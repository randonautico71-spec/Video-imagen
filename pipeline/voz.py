#!/usr/bin/env python3
"""VOZ LOCAL: sintesis (Piper / MeloTTS) + efectos + tiempos por palabra.

Entrada : texto del guion + perfil de voz (config/perfiles_voz.json)
Salida  : locucion.wav, palabras.json, frases.json, envolvente.json, voz_meta.json

Sin creditos y sin red una vez instalados los modelos. Los tiempos por palabra salen de
faster-whisper, pero ACOTADOS por los limites de frase, que se conocen con exactitud
porque cada frase se sintetiza por separado. Asi un fallo del alineador no puede
desplazar una palabra fuera de su frase."""
import argparse, difflib, hashlib, json, os, re, subprocess, sys, tempfile, time, unicodedata, wave
from pathlib import Path
import numpy as np

RAIZ = Path(__file__).resolve().parents[1]
SR = 44100
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')   # el protocolo xet va a un host que la red no permite


def cargar_perfil(nombre):
    perfiles = json.loads((RAIZ / 'config/perfiles_voz.json').read_text())
    if nombre not in perfiles or nombre.startswith('_'):
        raise SystemExit(f"Perfil desconocido: {nombre}. Hay: {[k for k in perfiles if not k.startswith('_')]}")
    return perfiles[nombre]


# ---------- texto -> frases ----------
def partir_frases(texto):
    """Devuelve [(frase, fin_de_parrafo)]. Una linea en blanco marca parrafo (pausa larga)."""
    out = []
    for parrafo in re.split(r'\n\s*\n', texto.strip()):
        parrafo = re.sub(r'\[[^\]]*\]', ' ', parrafo)           # etiquetas de direccion no se pronuncian
        parrafo = re.sub(r'\s+', ' ', parrafo).strip()
        if not parrafo:
            continue
        fr = [f.strip() for f in re.split(r'(?<=[.!?…])\s+', parrafo) if f.strip()]
        for i, f in enumerate(fr):
            out.append((f, i == len(fr) - 1))
    return out


def normalizar(p):
    p = unicodedata.normalize('NFD', p.lower())
    p = ''.join(c for c in p if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9ñ]', '', p)


# ---------- motores ----------
class Piper:
    def __init__(self, perfil):
        from piper import PiperVoice, SynthesisConfig
        self.Cfg = SynthesisConfig
        self.v = PiperVoice.load(str(RAIZ / perfil['modelo']))
        self.sr = self.v.config.sample_rate
        self.p = perfil

    def sintetizar(self, frase):
        cfg = self.Cfg(speaker_id=self.p['speaker'], **self.p['sintesis'])
        a = np.concatenate([c.audio_float_array for c in self.v.synthesize(frase, cfg)])
        return a.astype(np.float32), self.sr


class Melo:
    def __init__(self, perfil):
        sys.path.insert(0, str(RAIZ / 'vendor/MeloTTS'))
        import warnings; warnings.filterwarnings('ignore')
        from melo.api import TTS
        self.m = TTS(language=perfil['idioma'], device='cpu')
        self.sid = self.m.hps.data.spk2id[perfil['speaker']]
        self.sr = self.m.hps.data.sampling_rate
        self.p = perfil

    def sintetizar(self, frase):
        a = self.m.tts_to_file(frase, self.sid, None, quiet=True, **self.p['sintesis'])
        return np.asarray(a, dtype=np.float32), self.sr


class Qwen:
    """Qwen3-TTS (voces predefinidas, p. ej. Serena). Corre en un proceso aparte con .venv-qwen (Python 3.11) para no
    mezclar versiones de transformers con MeloTTS; el modelo se carga una vez y se reutiliza para todas las frases."""
    def __init__(self, perfil):
        import threading
        py = RAIZ / '.venv-qwen/bin/python'
        if not py.exists():
            raise SystemExit('Falta .venv-qwen (Python 3.11 + qwen-tts). Ejecuta: bash pipeline/instalar.sh')
        self.p = perfil
        self.proc = subprocess.Popen([str(py), str(RAIZ / 'pipeline/qwen_worker.py'), perfil.get('modelo_hf', 'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice')],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=open(tempfile.gettempdir() + '/qwen_worker.log', 'w'), text=True, bufsize=1,
                                     env={**os.environ, 'QWEN_HILOS': str(perfil.get('hilos', 4)), 'HF_HUB_DISABLE_XET': '1'})
        while True:                                   # el arranque puede imprimir avisos antes de la linea {"listo": true}
            primera = self.proc.stdout.readline()
            if '"listo"' in primera: break
            if not primera and self.proc.poll() is not None:
                raise RuntimeError('El proceso de Qwen no arranco (red: huggingface.co / us.aws.cdn.hf.co; detalle en ' + tempfile.gettempdir() + '/qwen_worker.log)')

    def _una(self, frase):
        with tempfile.TemporaryDirectory() as d:
            sal = Path(d) / 'a.npy'
            self.proc.stdin.write(json.dumps({'texto': frase, 'salida': str(sal), 'speaker': self.p['speaker'],
                                              'idioma': self.p.get('idioma', 'Spanish'), 'instruct': self.p.get('instruct')}) + '\n')
            self.proc.stdin.flush()
            r = json.loads(self.proc.stdout.readline() or '{"ok": false, "error": "el proceso de Qwen termino"}')
            if not r.get('ok'):
                raise RuntimeError('Qwen fallo: ' + r.get('error', ''))
            return np.load(sal).astype(np.float32), int(r['sr'])

    def sintetizar(self, frase, intentos=3):
        """Qwen muestrea (resultados distintos cada vez) y a veces se pasa o se queda corto. Como no se puede oir cada frase, se
        comprueba que la duracion sea razonable para el numero de palabras (0.55x-1.9x de 0.42 s/palabra) y, si no, se repite;
        se queda con el intento mas cercano a lo esperado."""
        esperado = max(0.8, len(frase.split()) * 0.42); mejor = None
        for i in range(intentos):
            a, sr = self._una(frase); dur = len(a) / sr; razon = dur / esperado
            if mejor is None or abs(np.log(razon)) < abs(np.log(mejor[2])): mejor = (a, sr, razon)
            if 0.55 <= razon <= 1.9 and float(np.abs(a).max()) > 0.02: break
        if not (0.55 <= mejor[2] <= 1.9): print(f'  ! duracion rara ({mejor[2]:.2f}x) en: {frase[:60]}', flush=True)
        return mejor[0], mejor[1]

    def sintetizar_lote(self, frases, tam=8):
        """Sintetiza varias frases a la vez (se reparten en lotes de 'tam'; conviene pasarlas ordenadas por longitud: cada lote cuesta lo que
        la mas larga). Las que salen con duracion rara se repiten una a una. Devuelve {frase: (audio, sr)}."""
        res = {}
        for i in range(0, len(frases), tam):
            grupo = frases[i:i + tam]
            with tempfile.TemporaryDirectory() as d:
                items = [{'texto': f, 'salida': str(Path(d) / f'{k}.npy')} for k, f in enumerate(grupo)]
                self.proc.stdin.write(json.dumps({'lote': items, 'speaker': self.p['speaker'], 'idioma': self.p.get('idioma', 'Spanish'),
                                                  'instruct': self.p.get('instruct')}) + '\n'); self.proc.stdin.flush()
                r = json.loads(self.proc.stdout.readline() or '{"ok": false, "error": "el proceso de Qwen termino"}')
                if not r.get('ok'): raise RuntimeError('Qwen (lote) fallo: ' + r.get('error', ''))
                for f, it in zip(grupo, items): res[f] = (np.load(it['salida']).astype(np.float32), int(r['sr']))
        for f, (a, sr) in list(res.items()):
            esperado = max(0.8, len(f.split()) * 0.42); razon = len(a) / sr / esperado
            if not (0.55 <= razon <= 1.9) or float(np.abs(a).max()) <= 0.02: res[f] = self.sintetizar(f)
        return res

    def cerrar(self):
        try: self.proc.stdin.close(); self.proc.wait(timeout=10)
        except Exception: self.proc.kill()


def remuestrear(a, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return a
    from scipy.signal import resample_poly
    from math import gcd
    g = gcd(sr_in, sr_out)
    return resample_poly(a, sr_out // g, sr_in // g).astype(np.float32)


def trozos_respiracion(frase, pausa, maximo):
    """Parte una frase larga en trozos por coma/dos puntos/punto y coma (la voz sintetiza mejor frases cortas y respira
    donde una persona respiraria). Devuelve [(texto, pausa_tras_el_trozo)]."""
    out, cur = [], ''
    for p in re.split(r'(?<=[,:;])\s+', frase):
        if cur and len(cur) + len(p) > maximo:
            out.append((cur, pausa)); cur = p
        else:
            cur = (cur + ' ' + p).strip()
    out.append((cur, 0))
    return out


# ---------- entonacion por frase ----------
def desplazamiento_frase(frase, idx, fin_parrafo, cfg):
    """Semitonos que se suman al tono base en esta frase (la 'musicalidad' del perfil)."""
    st = 0.0
    if '?' in frase or '¿' in frase:
        st += cfg.get('pregunta', 0)
    elif '!' in frase or '¡' in frase:
        st += cfg.get('exclamacion', 0)
    else:
        st += cfg.get('enunciado_alternado', 0) * (1 if idx % 2 == 0 else -1)
    if idx == 0:
        st += cfg.get('primera_frase', 0)
    if fin_parrafo:
        st += cfg.get('cierre_parrafo', 0)
    return st


def cambiar_tono(a, st):
    """Subir/bajar el tono de un trozo sin cambiar su duracion (rubberband)."""
    if abs(st) < 0.05:
        return a
    with tempfile.TemporaryDirectory() as d:
        e, s_ = Path(d) / 'e.wav', Path(d) / 's.wav'
        escribir_wav(e, a)
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(e), '-af',
                            f'rubberband=pitch={2 ** (st / 12):.5f}:formant=preserved', '-ar', str(SR), '-ac', '1', str(s_)],
                           capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError('rubberband fallo: ' + r.stderr[-300:])
        out = leer_wav(s_)
    n = len(a)                                   # rubberband puede variar unas muestras: se fija la longitud
    return out[:n] if len(out) >= n else np.concatenate([out, np.zeros(n - len(out), np.float32)])


# ---------- efectos ----------
def cadena_ffmpeg(fx):
    f = []
    if abs(fx.get('pitch_semitonos', 0)) > 0.01:
        f.append(f"rubberband=pitch={2 ** (fx['pitch_semitonos'] / 12):.5f}:formant=preserved" if fx.get('preservar_formante', True)
                 else f"rubberband=pitch={2 ** (fx['pitch_semitonos'] / 12):.5f}")
    f.append(f"highpass=f={fx.get('highpass_hz', 80)}")
    f.append(f"lowpass=f={fx.get('lowpass_hz', 12000)}")
    if fx.get('calidez_db'):
        f.append(f"equalizer=f=220:t=q:w=1.0:g={fx['calidez_db']}")
    if fx.get('presencia_db'):
        f.append(f"equalizer=f=3200:t=q:w=1.2:g={fx['presencia_db']}")
    comp = {'suave': 'acompressor=threshold=0.12:ratio=2.5:attack=20:release=250:makeup=2',
            'fuerte': 'acompressor=threshold=0.06:ratio=5:attack=8:release=160:makeup=4'}.get(fx.get('compresion'))
    if comp:
        f.append(comp)
    return ','.join(f)


def reverb(a, mezcla, seg, semilla=7):
    """Reverb por convolucion con una respuesta sintetica (ruido con caida exponencial).
    Determinista: misma semilla -> mismo resultado."""
    if mezcla <= 0 or seg <= 0:
        return a
    from scipy.signal import fftconvolve
    rng = np.random.default_rng(semilla)
    n = int(SR * seg)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * (6.9 / seg))          # -60 dB a los 'seg'
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(a, ir.astype(np.float32))[: len(a) + n // 2]
    seco = np.concatenate([a, np.zeros(len(wet) - len(a), np.float32)])
    return ((1 - mezcla) * seco + mezcla * wet * 0.9).astype(np.float32)


def procesar(a, fx):
    with tempfile.TemporaryDirectory() as d:
        ent, sal = Path(d) / 'e.wav', Path(d) / 's.wav'
        escribir_wav(ent, a)
        cadena = cadena_ffmpeg(fx)
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ent), '-af', cadena, '-ar', str(SR), '-ac', '1', str(sal)],
                           capture_output=True, text=True)
        if r.returncode:
            raise RuntimeError('ffmpeg fallo en la cadena de efectos:\n' + r.stderr[-600:])
        out = leer_wav(sal)
    return reverb(out, fx.get('reverb_mezcla', 0), fx.get('reverb_seg', 0))


def escribir_wav(ruta, a, sr=SR):
    x = (np.clip(a, -1, 1) * 32767).astype('<i2')
    with wave.open(str(ruta), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(x.tobytes())


def leer_wav(ruta):
    with wave.open(str(ruta), 'rb') as w:
        d = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32767
        if w.getnchannels() > 1:
            d = d.reshape(-1, w.getnchannels()).mean(1)
    return d


def normalizar_lufs(a, objetivo):
    """Normaliza con ffmpeg loudnorm (una pasada, suficiente para locucion)."""
    with tempfile.TemporaryDirectory() as d:
        e, s = Path(d) / 'e.wav', Path(d) / 's.wav'
        escribir_wav(e, a)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(e), '-af', f'loudnorm=I={objetivo}:TP=-1.5:LRA=11',
                        '-ar', str(SR), '-ac', '1', str(s)], check=True)
        return leer_wav(s)


# ---------- alineado ----------
def transcribir(audio, modelo='small'):
    """faster-whisper sobre un audio ya decodificado (44.1 kHz mono). Devuelve ([(palabra_normalizada, ini, fin)], metodo)."""
    try:
        from faster_whisper import WhisperModel
        wm = WhisperModel(modelo, device='cpu', compute_type='int8')
        # Se pasa el audio ya decodificado (16 kHz mono float32): evita decode_audio() de faster-whisper,
        # que falla con la version de PyAV instalada (metadata_errors).
        a16 = remuestrear(audio, SR, 16000)
        segs, _ = wm.transcribe(a16, language='es', word_timestamps=True, beam_size=1,
                                vad_filter=False, condition_on_previous_text=False)
        return [(normalizar(w.word), w.start, w.end) for s in segs for w in s.words if normalizar(w.word)], f'faster-whisper-{modelo}'
    except Exception as e:
        return [], f'proporcional (whisper no disponible: {type(e).__name__})'


def alinear(audio, frases, tiempos_frase, modelo='small', hip=None, metodo=None):
    """Tiempos por palabra: faster-whisper + acotado por frase + relleno proporcional."""
    palabras = []
    if hip is None:
        hip, metodo = transcribir(audio, modelo)

    todas = []                                     # (frase_idx, palabra_original)
    for i, (fr, _) in enumerate(frases):
        for p in fr.split():
            todas.append((i, p))
    ref = [normalizar(p) for _, p in todas]
    pares = {}
    if hip:
        sm = difflib.SequenceMatcher(a=ref, b=[h[0] for h in hip], autojunk=False)
        for bl in sm.get_matching_blocks():
            for k in range(bl.size):
                pares[bl.a + k] = (hip[bl.b + k][1], hip[bl.b + k][2])

    k = 0
    cobertura = 0
    for i, (fr, _) in enumerate(frases):
        ini_f, fin_f = tiempos_frase[i]
        idx = [j for j, (fi, _) in enumerate(todas) if fi == i]
        n = len(idx)
        pesos = np.array([max(1, len(normalizar(todas[j][1]))) for j in idx], float)
        acum = np.concatenate([[0], np.cumsum(pesos)]) / pesos.sum()
        prop = [(ini_f + (fin_f - ini_f) * acum[q], ini_f + (fin_f - ini_f) * acum[q + 1]) for q in range(n)]
        tiempos = []
        for q, j in enumerate(idx):
            if j in pares:
                a0, a1 = pares[j]
                tiempos.append((min(max(a0, ini_f), fin_f), min(max(a1, ini_f), fin_f)))
                cobertura += 1
            else:
                tiempos.append(prop[q])
        # monotonia: nunca hacia atras
        prev = ini_f
        for q, (a0, a1) in enumerate(tiempos):
            a0 = max(a0, prev); a1 = max(a1, a0 + 0.04)
            palabras.append({'t': todas[idx[q]][1], 'ini': round(a0, 3), 'fin': round(a1, 3), 'frase': i})
            prev = a0
    return palabras, metodo, (cobertura / max(1, len(todas)))


def importar(audio_ruta, texto, salida, whisper='small', perfil_nombre='carmen'):
    """Importa una locucion YA generada fuera del motor (p. ej. ElevenLabs con la herramienta creative_generate_speech) y produce los mismos
    ficheros que `generar`: locucion.wav, palabras.json, frases.json, envolvente.json, voz_meta.json.
    Como no se conocen los limites de frase, se transcribe TODO el audio con faster-whisper, se casa con el guion y de ahi salen los tiempos
    de frase y de palabra (las frases sin ninguna palabra casada se reparten entre sus vecinas segun su numero de palabras)."""
    t0 = time.time(); salida = Path(salida); salida.mkdir(parents=True, exist_ok=True)
    perfil = cargar_perfil(perfil_nombre); frases = partir_frases(texto)
    if not frases: raise SystemExit('El guion esta vacio.')
    with tempfile.TemporaryDirectory() as d:
        w = Path(d) / 'e.wav'
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(audio_ruta), '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', str(w)], capture_output=True, text=True)
        if r.returncode: raise SystemExit('ffmpeg no pudo leer el audio importado: ' + r.stderr[-300:])
        audio = leer_wav(w)
    dur = len(audio) / SR
    hip, metodo = transcribir(audio, whisper)
    if not hip: raise SystemExit('No se pudo transcribir el audio (faster-whisper no disponible): sin eso no hay tiempos por palabra.')
    todas = [normalizar(p) for fr, _ in frases for p in fr.split()]
    pares = {}
    sm = difflib.SequenceMatcher(a=todas, b=[h[0] for h in hip], autojunk=False)
    for bl in sm.get_matching_blocks():
        for k in range(bl.size): pares[bl.a + k] = (hip[bl.b + k][1], hip[bl.b + k][2])
    n = len(frases); ini = [None] * n; fin = [None] * n; cur = 0; nw = []
    for i, (fr, _) in enumerate(frases):
        k = len(fr.split()); nw.append(k); ts = [pares[j] for j in range(cur, cur + k) if j in pares]; cur += k
        if ts: ini[i], fin[i] = min(t[0] for t in ts), max(t[1] for t in ts)
    i = 0
    while i < n:                                   # huecos: se reparten entre la ultima frase conocida y la siguiente
        if ini[i] is not None: i += 1; continue
        j = i
        while j < n and ini[j] is None: j += 1
        a0 = max([fin[k] for k in range(i) if fin[k] is not None], default=0.0); a1 = min([ini[k] for k in range(j, n) if ini[k] is not None], default=dur)
        tot = sum(nw[i:j]); c = a0
        for k in range(i, j): ini[k] = c; c += (a1 - a0) * nw[k] / max(1, tot); fin[k] = c
        i = j
    for i in range(1, n): ini[i] = max(ini[i], fin[i - 1] - 0.02 if fin[i - 1] > ini[i] else ini[i])
    tiempos = [(ini[i], max(fin[i], ini[i] + 0.1)) for i in range(n)]
    audio = procesar(audio, perfil['fx'])
    palabras, metodo, cob = alinear(audio, frases, tiempos, whisper, hip=hip, metodo=metodo)
    escribir_wav(salida / 'locucion.wav', audio)
    (salida / 'palabras.json').write_text(json.dumps(palabras, ensure_ascii=False))
    (salida / 'frases.json').write_text(json.dumps([{'texto': f, 'ini': round(a, 3), 'fin': round(b, 3), 'parrafo_fin': pf} for (f, pf), (a, b) in zip(frases, tiempos)], ensure_ascii=False, indent=1))
    (salida / 'envolvente.json').write_text(json.dumps({'tasa': 60, 'valores': envolvente(audio)}))
    meta = {'perfil': perfil_nombre, 'motor': perfil['motor'], 'duracion_s': round(dur, 2), 'frases': n, 'palabras': len(palabras), 'alineado': metodo,
            'cobertura_alineado': round(cob, 3), 'origen': str(audio_ruta), 'segundos_calculo': round(time.time() - t0, 1)}
    (salida / 'voz_meta.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False))
    return meta


def envolvente(a, tasa=60):
    paso = SR // tasa
    n = len(a) // paso
    rms = np.sqrt(np.mean(a[: n * paso].reshape(n, paso) ** 2, axis=1))
    rms = rms / (np.percentile(rms, 95) + 1e-9)
    return np.clip(rms, 0, 1).round(3).tolist()


# ---------- principal ----------
def generar(texto, perfil_nombre, salida, whisper='small', progreso=True):
    t0 = time.time()
    perfil = cargar_perfil(perfil_nombre)
    salida = Path(salida); salida.mkdir(parents=True, exist_ok=True)
    frases = partir_frases(texto)
    if not frases:
        raise SystemExit('El guion esta vacio.')
    motor = {'piper': Piper, 'qwen': Qwen}.get(perfil['motor'], Melo)(perfil)
    t_carga = time.time() - t0

    # Cache por frase en disco: una sintesis larga (45 min = ~25 min de calculo) puede cortarse y se reanuda donde iba.
    # La clave incluye motor, modelo, hablante, parametros de sintesis y el texto: cambiar cualquiera de ellos la invalida.
    cache_dir = salida / 'voz_cache'; cache_dir.mkdir(exist_ok=True)
    base_clave = json.dumps([perfil['motor'], perfil.get('modelo', perfil.get('idioma')), perfil['speaker'], perfil['sintesis']], sort_keys=True)
    def ruta_cache(txt): return cache_dir / (hashlib.sha1((base_clave + '|' + txt).encode()).hexdigest()[:20] + '.npz')
    if hasattr(motor, 'sintetizar_lote'):                   # motores con lotes (Qwen): se sintetiza todo lo pendiente por lotes, guardando cada 40 frases
        pend = sorted({fr for fr, _ in frases if not ruta_cache(fr).exists()}, key=len)
        if pend: print(f'  lotes: {len(pend)} frases por sintetizar', flush=True)
        for i in range(0, len(pend), 40):
            for f, (a, sr) in motor.sintetizar_lote(pend[i:i + 40], tam=perfil.get('lote', 8)).items():
                np.savez(str(ruta_cache(f)) + '.tmp.npz', a=a, sr=sr); os.replace(str(ruta_cache(f)) + '.tmp.npz', ruta_cache(f))
            print(f'  lotes {min(i + 40, len(pend))}/{len(pend)}  ({time.time() - t0:.0f} s)', flush=True)
    aciertos = 0
    trozos, tiempos, cursor = [], [], 0
    for i, (fr, fin_parrafo) in enumerate(frases):
        pedazos = trozos_respiracion(fr, perfil['pausa_coma_s'], perfil.get('trozo_max_car', 70)) if perfil.get('pausa_coma_s') else [(fr, 0)]
        partes = []
        for k, (txt, pausa_k) in enumerate(pedazos):
            f_cache = cache_dir / (hashlib.sha1((base_clave + '|' + txt).encode()).hexdigest()[:20] + '.npz')
            if f_cache.exists():
                z = np.load(f_cache); a, sr = z['a'], int(z['sr']); aciertos += 1
            else:
                a, sr = motor.sintetizar(txt)
                np.savez(str(f_cache) + '.tmp.npz', a=a, sr=sr); os.replace(str(f_cache) + '.tmp.npz', f_cache)   # escritura atomica
            a = remuestrear(a, sr).copy()
            n = int(0.008 * SR); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n)   # fundido de 8 ms: sin clics en los empalmes
            partes.append(a)
            if pausa_k and k < len(pedazos) - 1:
                partes.append(np.zeros(int(pausa_k * SR), np.float32))
        a = np.concatenate(partes)
        if perfil.get('entonacion'):
            a = cambiar_tono(a, desplazamiento_frase(fr, i, fin_parrafo, perfil['entonacion']))
        ini = cursor / SR
        trozos.append(a); cursor += len(a)
        tiempos.append((ini, cursor / SR))
        pausa = perfil['pausa_parrafo_s'] if fin_parrafo else perfil['pausa_frase_s']
        trozos.append(np.zeros(int(pausa * SR), np.float32)); cursor += int(pausa * SR)
        if progreso and (i % 10 == 0 or i == len(frases) - 1):
            print(f'  frase {i + 1}/{len(frases)}  ({aciertos} desde cache)', flush=True)
    if hasattr(motor, 'cerrar'): motor.cerrar()          # libera la RAM del modelo antes de los filtros y del alineado
    crudo = np.concatenate(trozos)
    t_sint = time.time() - t0 - t_carga

    # los tiempos de frase se calculan sobre el audio SIN efectos; el pitch-shift y los filtros
    # no alteran la duracion, y la cola de reverb solo se anade al final.
    audio = procesar(crudo, perfil['fx'])
    audio = normalizar_lufs(audio, perfil['fx'].get('nivel_lufs', -16))
    t_fx = time.time() - t0 - t_carga - t_sint

    palabras, metodo, cob = alinear(audio, frases, tiempos, whisper)
    t_ali = time.time() - t0 - t_carga - t_sint - t_fx

    escribir_wav(salida / 'locucion.wav', audio)
    (salida / 'palabras.json').write_text(json.dumps(palabras, ensure_ascii=False))
    (salida / 'frases.json').write_text(json.dumps(
        [{'texto': f, 'ini': round(a, 3), 'fin': round(b, 3), 'parrafo_fin': pf}
         for (f, pf), (a, b) in zip(frases, tiempos)], ensure_ascii=False, indent=1))
    (salida / 'envolvente.json').write_text(json.dumps({'tasa': 60, 'valores': envolvente(audio)}))
    meta = {'perfil': perfil_nombre, 'motor': perfil['motor'], 'duracion_s': round(len(audio) / SR, 2),
            'frases': len(frases), 'frases_en_cache': aciertos, 'palabras': len(palabras), 'alineado': metodo,
            'cobertura_alineado': round(cob, 3),
            'segundos_calculo': {'carga_modelo': round(t_carga, 1), 'sintesis': round(t_sint, 1),
                                 'efectos': round(t_fx, 1), 'alineado': round(t_ali, 1)}}
    (salida / 'voz_meta.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False))
    return meta


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Sintetiza una locucion con un perfil de voz local.')
    ap.add_argument('texto', help='fichero .txt con la locucion')
    ap.add_argument('--perfil', required=True)
    ap.add_argument('--salida', required=True)
    ap.add_argument('--whisper', default='small', help='tiny|base|small|medium')
    a = ap.parse_args()
    m = generar(Path(a.texto).read_text(), a.perfil, a.salida, a.whisper)
    print(json.dumps(m, indent=1, ensure_ascii=False))
