#!/usr/bin/env python3
"""ANALISIS OBJETIVO DE UNA VOZ (no sustituye al oido). Mide ritmo, tono, pausas, dinamica y balance tonal de un audio con voz, para
AJUSTAR UN PERFIL PROPIO (ritmo, pausas, tono medio, ecualizacion, compresion) hacia un estilo de referencia. NO clona timbre ni identidad:
solo caracteristicas de estilo. Uso:
    python3 pipeline/analizar_voz.py audio.mp3 [--texto "guion"] [--json salida.json] [--comparar otro.json]"""
import argparse, json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
from scipy.signal import welch

SR = 16000
BANDAS = [125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300]     # tercios de octava (Hz)


def cargar(ruta):
    with tempfile.TemporaryDirectory() as d:
        w = Path(d) / 'a.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ruta), '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', str(w)], check=True)
        with wave.open(str(w)) as f:
            return np.frombuffer(f.readframes(f.getnframes()), '<i2').astype(np.float32) / 32768


def lufs(ruta):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(ruta), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(r.rsplit(k, 1)[1].split()[0]) if k in r else None
    return {'lufs_integrado': g('I:'), 'rango_lu': g('LRA:'), 'pico_dbtp': g('Peak:')}


def f0_serie(a, paso=0.01, ventana=0.04):
    n, h = int(SR * ventana), int(SR * paso); out = []
    lo, hi = int(SR / 400), int(SR / 70)
    for i in range(0, len(a) - n, h):
        x = a[i:i + n]
        if np.sqrt((x ** 2).mean()) < 0.015: out.append(0.0); continue
        x = x - x.mean(); r = np.correlate(x, x, 'full')[n - 1:]
        k = lo + int(np.argmax(r[lo:hi]))
        out.append(SR / k if r[k] > 0.45 * r[0] else 0.0)
    return np.array(out)


def palabras(a, texto=None):
    from faster_whisper import WhisperModel
    segs, info = WhisperModel('small', device='cpu', compute_type='int8').transcribe(a, language='es', word_timestamps=True, beam_size=1, vad_filter=False, condition_on_previous_text=False)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if w.word.strip()]


def ltas(a):
    """Espectro medio a largo plazo SOLO de tramos con voz, en dB por tercio de octava, relativo a 1 kHz."""
    n = 1024; tr = [a[i:i + n] * np.hanning(n) for i in range(0, len(a) - n, 512) if np.sqrt((a[i:i + n] ** 2).mean()) > 0.02]
    f, p = welch(np.concatenate([t for t in tr]), SR, nperseg=2048, noverlap=1024)
    out = []
    for c in BANDAS:
        m = (f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6)); out.append(10 * np.log10(p[m].mean() + 1e-12))
    out = np.array(out); return (out - out[BANDAS.index(1000)]).round(2).tolist()


def analizar(ruta, texto=None):
    a = cargar(ruta); pal = palabras(a); dur = len(a) / SR
    gaps = [(pal[i + 1][1] - pal[i][2], pal[i][0]) for i in range(len(pal) - 1)]
    sig = [g for g, w in gaps if g >= 0.12]
    fin_frase = [g for g, w in gaps if g >= 0.12 and w[-1:] in '.?!…']; coma = [g for g, w in gaps if g >= 0.12 and w[-1:] in ',;:']
    habla = (pal[-1][2] - pal[0][1]) - sum(g for g in sig if g >= 0.25)
    f0 = f0_serie(a); v = f0[f0 > 0]; st = 12 * np.log2(v / np.median(v))
    rms = np.array([np.sqrt((a[i:i + 800] ** 2).mean()) for i in range(0, len(a) - 800, 800)]); rd = 20 * np.log10(rms[rms > 0.02] + 1e-9)
    esp = ltas(a); sp = np.abs(np.fft.rfft(a[: len(a) // 1024 * 1024].reshape(-1, 1024) * np.hanning(1024), axis=1)).mean(0); fr = np.fft.rfftfreq(1024, 1 / SR)
    return {'archivo': str(ruta), 'duracion_s': round(dur, 2), 'palabras': len(pal),
            'palabras_por_min_total': round(len(pal) / (pal[-1][2] - pal[0][1]) * 60, 1), 'palabras_por_min_articulacion': round(len(pal) / habla * 60, 1),
            'pausa_fin_de_frase_s': round(float(np.median(fin_frase)), 2) if fin_frase else None, 'pausa_coma_s': round(float(np.median(coma)), 2) if coma else None,
            'pausas_n': len(sig), 'f0_hz': {k: round(float(np.percentile(v, p)), 1) for k, p in (('p10', 10), ('p50', 50), ('p90', 90))},
            'f0_variacion_semitonos_std': round(float(st.std()), 2), 'f0_sonoro_pct': round(float((f0 > 0).mean() * 100), 1),
            'dinamica_rms_db_std': round(float(rd.std()), 2), 'centroide_espectral_hz': round(float((sp * fr).sum() / sp.sum()), 0),
            'ltas_db_re_1k': {str(k): v for k, v in zip(BANDAS, esp)}, **lufs(ruta)}


def comparar(a, b):
    print(f"{'':32s}{'A':>12s}{'B':>12s}")
    for k in ('duracion_s', 'palabras_por_min_total', 'palabras_por_min_articulacion', 'pausa_fin_de_frase_s', 'pausa_coma_s', 'f0_variacion_semitonos_std', 'dinamica_rms_db_std', 'centroide_espectral_hz', 'lufs_integrado', 'rango_lu', 'pico_dbtp'):
        print(f'{k:32s}{str(a[k]):>12s}{str(b[k]):>12s}')
    print(f"{'f0 p10/p50/p90 (Hz)':32s}{'/'.join(str(int(a['f0_hz'][x])) for x in ('p10', 'p50', 'p90')):>12s}{'/'.join(str(int(b['f0_hz'][x])) for x in ('p10', 'p50', 'p90')):>12s}")
    d = np.array([b['ltas_db_re_1k'][str(c)] - a['ltas_db_re_1k'][str(c)] for c in BANDAS]); print('diferencia espectral B-A (dB) por banda:', dict(zip(BANDAS, d.round(1).tolist())))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('audio'); ap.add_argument('--json'); ap.add_argument('--comparar'); a = ap.parse_args()
    r = analizar(a.audio)
    if a.json: Path(a.json).write_text(json.dumps(r, indent=1, ensure_ascii=False))
    if a.comparar: comparar(json.loads(Path(a.comparar).read_text()), r)
    else: print(json.dumps(r, indent=1, ensure_ascii=False))
