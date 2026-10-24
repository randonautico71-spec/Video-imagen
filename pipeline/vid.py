#!/usr/bin/env python3
"""CLI del motor. Cada video es una carpeta proyectos/<tema>/ con:
     meta.json   formato, perfil de voz, estilo de musica
     guion.md    la locucion; cada PARRAFO (separado por linea en blanco) es una ESCENA
     escenas.js  el diseno visual de ESE video (lo escribe Claude a partir de lo que pide el usuario)
Subcomandos:  nuevo | voz | musica | mezcla | qa | render | todo | plan"""
import argparse, json, math, os, re, shutil, subprocess, sys, time
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / 'pipeline'))
import entrega  # noqa: E402

TIPOS = json.loads((RAIZ / 'config/tipos.json').read_text())
COLA_S = {'meditacion': 3.5, 'mistico': 3.5, 'natural': 3.5, 'intriga': 3.5}          # segundos tras la ultima palabra (la musica de meditacion se apaga lenta)


def workers_auto():
    """Procesos de render segun el contenedor: 1 por CPU (maximo 4) y como mucho 1 por cada 2,5 GB de RAM libre
    (medido: cada proceso de render pico ~2,0 GB con ss 1.5 vertical; con 4 procesos en un chat de 7 GB habria memoria agotada)."""
    try: mem = int([l for l in open('/proc/meminfo') if l.startswith('MemAvailable')][0].split()[1]) / 1e6
    except Exception: mem = 8
    return max(1, min(4, os.cpu_count() or 1, int(mem // 2.5)))


def dir_proyecto(tema):
    d = RAIZ / 'proyectos' / tema
    if not d.is_dir():
        raise SystemExit(f'No existe proyectos/{tema}. Crea uno con: vid.py nuevo {tema}')
    return d


def leer_meta(d):
    return json.loads((d / 'meta.json').read_text())


def sh(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode:
        raise SystemExit(f'Fallo ({r.returncode}): {" ".join(str(c) for c in cmd)[:200]}')
    return r


def duracion(ruta):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(ruta)],
                                capture_output=True, text=True).stdout.strip())


# ------------------------------------------------------------------ nuevo
def meta_de_tipo(tipo):
    """meta.json inicial segun el TIPO de video (config/tipos.json): el usuario dice largo o short y el motor ya sabe formato, voz, calidad, etc."""
    t = TIPOS[tipo]; fmt = entrega.FORMATOS[t['formato']]
    m = {'titulo': '', 'tipo': tipo, 'formato': t['formato'], 'lienzo': fmt['lienzo'], 'voz': t['voz'], 'musica': t['musica'], 'semilla': 1, 'estilo': 'LAB',
         'dings_en_palabras': [], 'cola_s': t['cola_s'], 'fps': t['fps'], 'ss': t['ss'], 'crf': t['crf'], 'calidad_jpeg': t['calidad_jpeg'], 'lufs': t['lufs'],
         'duracion_objetivo_s': t['duracion_s']}
    if t.get('salida_escala', 1) != 1: m['salida_escala'] = t['salida_escala']
    if t.get('ligero_MB'): m['ligero_MB'] = t['ligero_MB']
    if t.get('ligero_lado'): m['ligero_lado'] = t['ligero_lado']
    return m


def avisar_rango(meta, total_s):
    """Avisa si la duracion se sale del rango del TIPO (largo 30-60 min, short 1-3 min)."""
    r = meta.get('duracion_objetivo_s')
    if not r: return
    if total_s < r[0] or total_s > r[1]:
        print(f"  ! Duracion {total_s / 60:.1f} min fuera del rango del tipo '{meta.get('tipo')}' ({r[0] / 60:g}-{r[1] / 60:g} min): "
              f"{'alarga' if total_s < r[0] else 'recorta'} el guion.")


def cmd_nuevo(a):
    d = RAIZ / 'proyectos' / a.tema
    if d.exists():
        raise SystemExit(f'proyectos/{a.tema} ya existe.')
    (d / 'salida').mkdir(parents=True)
    if a.tipo:
        meta = meta_de_tipo(a.tipo); meta['titulo'] = a.tema
        if a.voz: meta['voz'] = a.voz
        if a.musica: meta['musica'] = a.musica
        if a.formato: meta['formato'] = a.formato; meta['lienzo'] = entrega.FORMATOS[a.formato]['lienzo']
        sub = TIPOS[a.tipo].get('subtitulos', False)
        guia = TIPOS[a.tipo]['guia']
    else:                                                        # modo manual (sin tipo)
        a.formato = a.formato or 'short'; a.voz = a.voz or 'curiosos'; a.musica = a.musica or 'curiosos'
        meta = {'titulo': a.tema, 'formato': a.formato, 'lienzo': entrega.FORMATOS[a.formato]['lienzo'], 'voz': a.voz, 'musica': a.musica,
                'semilla': 1, 'estilo': 'LAB', 'dings_en_palabras': [], 'cola_s': COLA_S.get(a.musica, 1.2)}
        sub, guia = False, None
    (d / 'meta.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    (d / 'guion.md').write_text('Primer parrafo = primera escena.\n\nSegundo parrafo = segunda escena.\n')
    (d / 'escenas.js').write_text("""/* Diseno visual de este video. Herramientas: VE.real (paisajes y objetos), VE.short (rotulos, pastillas, letrero final), VE.trazo/VE.med (luz). */
VE.proyecto({
  estilo: 'LAB',
  subtitulos: %s,
  escenas: [
    (esc, t, ctx) => { /* escena 1: dibujar con las herramientas del motor */ },
    (esc, t, ctx) => { /* escena 2 */ },
  ],
});
""" % json.dumps(sub))
    print(f'Creado proyectos/{a.tema}  (tipo {a.tipo or "manual"}, formato {meta["formato"]}, voz {meta["voz"]}, musica {meta["musica"]})')
    if guia: print(f'  Guia de diseno de este tipo: {guia}')


# ------------------------------------------------------------------ voz + linea de tiempo
def parrafos_de(d):
    txt = re.sub(r'<!--.*?-->', '', (d / 'guion.md').read_text(), flags=re.S)
    return [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', txt.strip()) if p.strip()]


def compilar_timeline(d, meta):
    s = d / 'salida'
    frases = json.loads((s / 'frases.json').read_text())
    palabras = json.loads((s / 'palabras.json').read_text())
    dur_voz = duracion(s / 'locucion.wav')
    grupos, actual = [], []
    for i, f in enumerate(frases):
        actual.append(i)
        if f['parrafo_fin']:
            grupos.append(actual); actual = []
    if actual:
        grupos.append(actual)
    n_guion = len(parrafos_de(d))
    if len(grupos) != n_guion:
        raise SystemExit(f'El guion tiene {n_guion} parrafos pero la voz produjo {len(grupos)} grupos de frases.')
    cola = meta.get('cola_s', 1.2); total = dur_voz + cola
    lead = meta.get('adelanto_s', 0.35)          # la escena entra un poco antes de su primera palabra
    escenas, previo = [], 0.0
    for k, g in enumerate(grupos):
        ini = 0.0 if k == 0 else max(previo + 0.5, frases[g[0]]['ini'] - lead)
        idx = [j for j, w in enumerate(palabras) if w['frase'] in set(g)]
        escenas.append({'i': k, 'ini': round(ini, 3), 'palabras': [idx[0], idx[-1] + 1], 'frases': g})
        previo = ini
    for k, e in enumerate(escenas):
        e['fin'] = round(escenas[k + 1]['ini'] if k + 1 < len(escenas) else total, 3)
    tl = {'duracion_voz': round(dur_voz, 3), 'duracion_total': round(total, 3), 'escenas': escenas}
    (s / 'timeline.json').write_text(json.dumps(tl, indent=1))
    return tl


def cmd_voz(a):
    import voz
    d = dir_proyecto(a.tema); meta = leer_meta(d); s = d / 'salida'; s.mkdir(exist_ok=True)
    pars = parrafos_de(d)
    (s / 'locucion.txt').write_text('\n\n'.join(pars))
    print(f'Voz "{meta["voz"]}" para {len(pars)} escenas...')
    perfil = voz.cargar_perfil(meta['voz'])
    if perfil['motor'] == 'elevenlabs':                          # la voz se genera FUERA del motor (herramienta del conector) y se importa
        audios = sorted(s.glob('locucion_eleven.*'))
        if not audios:
            raise SystemExit(f'La voz "{meta["voz"]}" es de ElevenLabs: genera el audio con la herramienta creative_generate_speech '
                             f'(voice_id {perfil["voice_id"]}, generations_count 1; texto = salida/locucion.txt) y guardalo como salida/locucion_eleven.mp3; '
                             f'despues repite este comando (o usa: vid.py voz-importar {a.tema} <audio>).')
        m = voz.importar(audios[0], '\n\n'.join(pars), s, whisper=a.whisper, perfil_nombre=meta['voz'])
    else:
        m = voz.generar('\n\n'.join(pars), meta['voz'], s, whisper=a.whisper)
    tl = compilar_timeline(d, meta)
    print(f'  voz {m["duracion_s"]} s | alineado {m["alineado"]} ({m["cobertura_alineado"] * 100:.0f} % palabras casadas) | '
          f'total con cola {tl["duracion_total"]} s | calculo {m["segundos_calculo"]}')
    avisar_rango(meta, tl['duracion_total'])
    vs, av = entrega.plan(meta['formato'], tl['duracion_total'])
    print('  versiones:', [f"{v['nombre']}/{v['lienzo']}" for v in vs])
    for x in av: print('  !', x)


def cmd_voz_importar(a):
    """Importa una locucion ya generada (ElevenLabs u otra): la guarda como salida/locucion_eleven.<ext> y la alinea con el guion."""
    d = dir_proyecto(a.tema); s = d / 'salida'; s.mkdir(exist_ok=True)
    for viejo in s.glob('locucion_eleven.*'): viejo.unlink()
    if str(a.audio).startswith('http'):                       # URL firmada que devuelve creative_get_flow_run_status (caduca en ~2 h; dominio storage.googleapis.com)
        import urllib.request
        urllib.request.urlretrieve(a.audio, s / 'locucion_eleven.mp3')
    else:
        origen = Path(a.audio)
        if not origen.exists(): raise SystemExit(f'No existe {origen}')
        shutil.copy(origen, s / ('locucion_eleven' + origen.suffix))
    cmd_voz(argparse.Namespace(tema=a.tema, whisper=a.whisper))


# ------------------------------------------------------------------ musica + mezcla
def cmd_musica(a):
    import musica, numpy as np
    d = dir_proyecto(a.tema); meta = leer_meta(d); s = d / 'salida'
    tl = json.loads((s / 'timeline.json').read_text()); palabras = json.loads((s / 'palabras.json').read_text())
    dings = [float(x) for x in meta.get('dings_s', [])]
    objetivo = {re.sub(r'[^a-z0-9ñ]', '', w.lower()) for w in meta.get('dings_en_palabras', [])}
    dings += [w['ini'] for w in palabras if re.sub(r'[^a-z0-9ñ]', '', w['t'].lower()) in objetivo]
    escenas = tl['escenas']
    if meta.get('capitulos'):                      # videos largos: la musica solo marca los limites de CAPITULO, no cada parrafo
        pos, ini_cap = 0, []
        for n in meta['capitulos']:
            ini_cap.append(escenas[pos]['ini']); pos += n
        escenas = [{'ini': i} for i in ini_cap]
    cues = {'duracion': tl['duracion_total'], 'semilla': meta.get('semilla', 1),
            'escenas': [{'ini': e['ini']} for e in escenas], 'dings': sorted(dings)}
    (s / 'cues.json').write_text(json.dumps(cues))
    audio = musica.componer(cues, meta['musica'])
    musica.guardar(audio, s / 'musica.wav')
    print(f'Musica "{meta["musica"]}": {len(audio) / musica.SR:.1f} s, {len(cues["dings"])} dings, {len(cues["escenas"]) - 1} cortes')


def cmd_mezcla(a):
    d = dir_proyecto(a.tema); meta = leer_meta(d); s = d / 'salida'
    tl = json.loads((s / 'timeline.json').read_text()); end = tl['duracion_total'] + 0.1
    vol = meta.get('volumen_musica', 0.55); lufs = meta.get('lufs', -16); du = meta.get('ducking', {})
    filtro = (f"[0:a]aresample=44100,pan=stereo|c0=c0|c1=c0,apad,asplit=2[v1][v2];[1:a]volume={vol}[m];"
              f"[m][v2]sidechaincompress=threshold={du.get('umbral', 0.03)}:ratio={du.get('ratio', 8)}:attack={du.get('ataque', 20)}:release={du.get('relajacion', 400)}[md];"
              f"[v1][md]amix=inputs=2:normalize=0:duration=longest,loudnorm=I={lufs}:TP=-1.5,atrim=0:{end:.2f}[a]")
    sh(['ffmpeg', '-v', 'error', '-y', '-i', str(s / 'locucion.wav'), '-i', str(s / 'musica.wav'), '-filter_complex', filtro,
        '-map', '[a]', '-ac', '2', '-ar', '44100', str(s / 'mezcla.wav')])
    print(f'Mezcla: {duracion(s / "mezcla.wav"):.1f} s (video {tl["duracion_total"]:.1f} s)')


# ------------------------------------------------------------------ estimar / estado
def cmd_estimar(a):
    import voz as _v
    d = dir_proyecto(a.tema); meta = leer_meta(d); cal = json.loads((RAIZ / 'config/calibracion.json').read_text())
    perfiles = json.loads((RAIZ / 'config/perfiles_voz.json').read_text()); pv = perfiles[meta['voz']]
    pars = parrafos_de(d); frases = [f for p in pars for f in _v.partir_frases(p)]
    palabras = sum(len(p.split()) for p in pars); wpm = cal['voz']['palabras_por_min_habla'][meta['voz']]
    habla = palabras / wpm * 60
    pausas = sum(pv['pausa_parrafo_s'] if fin else pv['pausa_frase_s'] for _, fin in frases)
    voz_s = habla + pausas; total = voz_s + meta.get('cola_s', 1.2)
    motor = pv['motor']; fps = meta.get('fps', entrega.FORMATOS[meta['formato']]['fps']); ss = meta.get('ss', entrega.FORMATOS[meta['formato']]['ss'])
    frames = math.ceil(total * fps)
    t_voz = cal['voz']['carga_modelo_s'][motor] + habla * cal['voz']['calculo_s_por_s_de_habla'][motor] + total * cal['voz']['alineado_s_por_s_de_audio']
    t_mus = total * cal['musica']['s_por_s_de_audio']; mem_mus = total * cal['musica']['memoria_MB_por_s'] / 1000
    ms = cal['render']['ms_por_fotograma_un_proceso'].get(str(ss)) or cal['render']['ms_por_fotograma_un_proceso']['1.5'] * (ss / 1.5) ** 2
    if meta.get('tipo') == 'short' and ss >= 1.5: ms = cal['render']['ms_por_fotograma_realismo_vertical_ss1.5']      # paisajes y objetos reales (VE.real): ~3x mas caros que las escenas de luz
    W = workers_auto(); t_ren = frames * ms / 1000 / (W * cal['render']['eficiencia_4_procesos']) + cal['render']['overhead_fijo_s']
    crf = meta.get('crf', 17); mb = total * cal['salida']['mbps_crf17'] * 2 ** (-(crf - 17) / 6) / 8
    fmt = lambda s: f'{int(s // 3600)} h {int(s % 3600 // 60)} min' if s >= 3600 else f'{int(s // 60)} min {int(s % 60)} s'
    print(f"\n== ESTIMACION de proyectos/{a.tema}  (formato {meta['formato']}, voz {meta['voz']}/{motor}, ss {ss}, {fps} fps, crf {crf})")
    print(f"  Guion        {len(pars)} parrafos, {len(frases)} frases, {palabras} palabras")
    print(f"  Duracion     voz {fmt(voz_s)} (habla {fmt(habla)} + pausas {fmt(pausas)}) -> video {fmt(total)}, {frames} fotogramas")
    print(f"  Voz          ~{fmt(t_voz)} de calculo  (cache por frase: si se corta, se reanuda)")
    print(f"  Musica       ~{fmt(t_mus)}, pico ~{mem_mus:.1f} GB de RAM  -> NO ejecutar a la vez que voz o render")
    print(f"  Render       ~{fmt(t_ren)}  con {W} proceso(s) en paralelo (este contenedor: {os.cpu_count()} CPU)  (reanudable por trozos)")
    print(f"  Disco        pesado ~{mb:.0f} MB; durante el render ~{mb * cal['salida']['copias_en_disco_durante_render']:.0f} MB")
    print(f"  TOTAL        ~{fmt(t_voz + t_mus + t_ren)} de proceso")
    avisar_rango(meta, total)
    vs, av = entrega.plan(meta['formato'], total)
    for x in av: print('  !', x)
    if total > 600 and 'ligero_MB' not in meta: print('  ! El MP4 ligero (<10 MB) no es viable a esta duracion; se entrega solo el pesado.')
    print('  Certeza: las constantes vienen de config/calibracion.json (medidas con videos CORTOS; en uno largo pueden variar).')


def cmd_estado(a):
    d = dir_proyecto(a.tema); s = d / 'salida'
    paso = lambda n, ok, extra='': print(f"  [{'x' if ok else ' '}] {n}{('  ' + extra) if extra else ''}")
    print(f'== estado de proyectos/{a.tema}')
    paso('guion.md', (d / 'guion.md').exists()); paso('escenas.js', (d / 'escenas.js').exists())
    cache = len(list((s / 'voz_cache').glob('*.npz'))) if (s / 'voz_cache').exists() else 0
    paso('voz (locucion.wav)', (s / 'locucion.wav').exists(), f'{cache} frases en cache')
    paso('linea de tiempo', (s / 'timeline.json').exists()); paso('musica.wav', (s / 'musica.wav').exists()); paso('mezcla.wav', (s / 'mezcla.wav').exists())
    for v in sorted(s.glob('v_*')):
        hechos = len(list((v / 'seg').glob('seg????.mp4'))) if (v / 'seg').exists() else 0
        pr = json.loads((v / 'progreso.json').read_text()) if (v / 'progreso.json').exists() else None
        paso(f'render {v.name}', (v / 'mudo.mp4').exists(), f'{hechos} trozos hechos' + (f", {pr['hechos']}/{pr['total']} segun progreso, ~{pr['restante_s']} s restantes" if pr and pr.get('restante_s') else ''))
        for f in sorted(v.glob('*_pesado.mp4')): paso('  ' + f.name, True, f'{f.stat().st_size / 1e6:.0f} MB')


# ------------------------------------------------------------------ qa
def cmd_qa(a):
    d = dir_proyecto(a.tema); meta = leer_meta(d)
    vs, _ = entrega.plan(meta['formato'], json.loads((d / 'salida/timeline.json').read_text())['duracion_total'])
    codigo = 0
    for v in vs:
        v['ss'] = meta.get('ss', v['ss'])
        cmd = ['node', str(RAIZ / 'render/revisar.cjs'), '--proyecto', f'proyectos/{a.tema}', '--lienzo', v['lienzo'],
               '--paso', str(a.paso), '--ss', str(v['ss']), '--salida', str(d / f'salida/stills_{v["nombre"]}')]
        if a.stills: cmd += ['--stills', a.stills]
        codigo |= subprocess.run(cmd).returncode
    if codigo:
        raise SystemExit('El linter encontro errores: corrige escenas.js antes de renderizar.')


# ------------------------------------------------------------------ render + empaquetado
def ligero(pesado, salida, dur, objetivo_MB=9.5, lado=None, tope_MB=10):
    """MP4 ligero: bitrate calculado para quedar bajo 'objetivo_MB'. Por defecto <10 MB (la app no reproduce MP4 > ~12 MB).
    Para videos largos se pide un objetivo mayor en meta.json ('ligero_MB') y, si se quiere, la altura ('ligero_lado')."""
    objetivo = objetivo_MB * 1e6 * 8; audio_k = 64      # 40 kbps en un video largo suena a codec (medido: pico +5 dBFS tras AAC); 64 kbps + limitador
    v = objetivo / dur - audio_k * 1000 * 1.04
    if v < 70e3:
        return None, f'No cabe: a {dur:.0f} s harian falta {v / 1000:.0f} kbps de video (< 70). Con ese objetivo solo es viable hasta ~{objetivo / (70e3 + audio_k * 1040):.0f} s.'
    dims = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(pesado)],
                          capture_output=True, text=True).stdout.strip().split(',')
    w, h = int(dims[0]), int(dims[1]); lado = lado or (720 if v >= 1.4e6 else 480 if v >= 550e3 else 360 if v >= 260e3 else 240)
    esc = f'scale={lado}:-2' if h > w else f'scale=-2:{lado}'
    for intento in range(3):
        sh(['ffmpeg', '-v', 'error', '-y', '-i', str(pesado), '-vf', esc, '-c:v', 'libx264', '-b:v', str(int(v)), '-maxrate', str(int(v * 1.15)),
            '-bufsize', str(int(v * 2)), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-af', 'volume=-4dB,alimiter=limit=0.6:level=disabled', '-c:a', 'aac', '-b:a', f'{audio_k}k', '-ac', '1',
            '-movflags', '+faststart', str(salida)])
        if os.path.getsize(salida) <= objetivo_MB * 1.05e6:
            return salida, f'{lado}p a {v / 1000:.0f} kbps (objetivo {objetivo_MB} MB)'
        v *= 0.85
    return salida, f'SUPERA el objetivo de {objetivo_MB} MB tras 3 intentos'


def cmd_render(a):
    d = dir_proyecto(a.tema); meta = leer_meta(d); s = d / 'salida'
    tl = json.loads((s / 'timeline.json').read_text())
    if not (s / 'mezcla.wav').exists():
        raise SystemExit('Falta salida/mezcla.wav: ejecuta voz, musica y mezcla primero (o usa "todo").')
    vs, av = entrega.plan(meta['formato'], tl['duracion_total'])
    for x in av: print('!', x)
    for v in vs:                                   # ajustes del proyecto sobre los del formato
        v['ss'] = meta.get('ss', v['ss']); v['fps'] = meta.get('fps', v['fps'])
    informe = []
    for v in vs:
        if a.version and v['nombre'] != a.version:
            continue
        out = s / f'v_{v["nombre"]}'; out.mkdir(exist_ok=True)
        t0 = time.time()
        cmd = ['node', str(RAIZ / 'render/render.cjs'), '--proyecto', f'proyectos/{a.tema}', '--lienzo', v['lienzo'], '--fps', str(v['fps']),
               '--ss', str(v['ss']), '--salida', str(out), '--workers', str(a.workers or workers_auto())]
        if a.hasta: cmd += ['--hasta', str(a.hasta)]
        if 'crf' in meta: cmd += ['--crf', str(meta['crf'])]
        if 'calidad_jpeg' in meta: cmd += ['--calidad', str(meta['calidad_jpeg'])]
        if 'salida_escala' in meta: cmd += ['--so', str(meta['salida_escala'])]
        sh(cmd)
        dur = min(float(a.hasta), tl['duracion_total']) if a.hasta else tl['duracion_total']
        pesado = out / f'{a.tema}_{v["nombre"]}_pesado.mp4'
        sh(['ffmpeg', '-v', 'error', '-y', '-i', str(out / 'mudo.mp4'), '-i', str(s / 'mezcla.wav'), '-map', '0:v', '-map', '1:a',
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', f'{dur:.2f}', '-movflags', '+faststart', str(pesado)])
        lig, nota = ligero(pesado, out / f'{a.tema}_{v["nombre"]}_ligero.mp4', dur, meta.get('ligero_MB', 9.5), meta.get('ligero_lado'))
        fila = {'version': v['nombre'], 'lienzo': v['lienzo'], 'duracion_s': round(duracion(pesado), 2),
                'pesado': str(pesado), 'pesado_MB': round(os.path.getsize(pesado) / 1e6, 1),
                'ligero': str(lig) if lig else None, 'ligero_MB': round(os.path.getsize(lig) / 1e6, 1) if lig else None,
                'ligero_nota': nota, 'segundos_render': round(time.time() - t0)}
        informe.append(fila); print(json.dumps(fila, ensure_ascii=False, indent=1))
    (s / 'entrega.json').write_text(json.dumps(informe, indent=1, ensure_ascii=False))


def cmd_todo(a):
    for f in (cmd_voz, cmd_musica, cmd_mezcla):
        f(a)
    cmd_qa(argparse.Namespace(tema=a.tema, paso=0.5, stills=None))
    cmd_render(a)


def cmd_plan(a):
    vs, av = entrega.plan(a.formato, a.duracion)
    print(json.dumps({'versiones': vs, 'avisos': av}, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('nuevo'); p.add_argument('tema'); p.add_argument('--tipo', choices=[k for k in TIPOS if not k.startswith('_') and k != 'marca'], help='largo | short: rellena formato, voz, musica y calidad')
    p.add_argument('--formato', choices=['short', 'youtube', 'instagram']); p.add_argument('--voz'); p.add_argument('--musica', choices=['curiosos', 'aprender', 'meditacion', 'mistico', 'natural', 'intriga']); p.set_defaults(f=cmd_nuevo)
    p = sp.add_parser('voz-importar'); p.add_argument('tema'); p.add_argument('audio'); p.add_argument('--whisper', default='small'); p.set_defaults(f=cmd_voz_importar)
    for nombre, f in (('voz', cmd_voz), ('musica', cmd_musica), ('mezcla', cmd_mezcla)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.add_argument('--whisper', default='small'); p.set_defaults(f=f)
    p = sp.add_parser('qa'); p.add_argument('tema'); p.add_argument('--paso', type=float, default=0.5); p.add_argument('--stills'); p.set_defaults(f=cmd_qa)
    for nombre, f in (('render', cmd_render), ('todo', cmd_todo)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.add_argument('--version'); p.add_argument('--workers', type=int, default=None, help='procesos de render; por defecto segun CPU y RAM del contenedor')
        p.add_argument('--hasta', type=float); p.add_argument('--whisper', default='small'); p.set_defaults(f=f)
    for nombre, f in (('estimar', cmd_estimar), ('estado', cmd_estado)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.set_defaults(f=f)
    p = sp.add_parser('plan'); p.add_argument('formato'); p.add_argument('duracion', type=float); p.set_defaults(f=cmd_plan)
    a = ap.parse_args(); a.f(a)
