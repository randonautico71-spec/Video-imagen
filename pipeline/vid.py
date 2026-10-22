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

COLA_S = {'meditacion': 3.5}          # segundos tras la ultima palabra (la musica de meditacion se apaga lenta)


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
def cmd_nuevo(a):
    d = RAIZ / 'proyectos' / a.tema
    if d.exists():
        raise SystemExit(f'proyectos/{a.tema} ya existe.')
    (d / 'salida').mkdir(parents=True)
    fmt = entrega.FORMATOS[a.formato]
    (d / 'meta.json').write_text(json.dumps({
        'titulo': a.tema, 'formato': a.formato, 'lienzo': fmt['lienzo'], 'voz': a.voz, 'musica': a.musica,
        'semilla': 1, 'estilo': 'LAB', 'dings_en_palabras': [], 'cola_s': COLA_S.get(a.musica, 1.2)}, indent=2, ensure_ascii=False))
    (d / 'guion.md').write_text('Primer parrafo = primera escena.\n\nSegundo parrafo = segunda escena.\n')
    (d / 'escenas.js').write_text("""VE.proyecto({
  estilo: 'LAB',
  escenas: [
    (esc, t, ctx) => { /* escena 1: dibujar con las herramientas del motor */ },
    (esc, t, ctx) => { /* escena 2 */ },
  ],
});
""")
    print(f'Creado proyectos/{a.tema}  (formato {a.formato}, voz {a.voz}, musica {a.musica})')


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
    m = voz.generar('\n\n'.join(pars), meta['voz'], s, whisper=a.whisper)
    tl = compilar_timeline(d, meta)
    print(f'  voz {m["duracion_s"]} s | alineado {m["alineado"]} ({m["cobertura_alineado"] * 100:.0f} % palabras casadas) | '
          f'total con cola {tl["duracion_total"]} s | calculo {m["segundos_calculo"]}')
    vs, av = entrega.plan(meta['formato'], tl['duracion_total'])
    print('  versiones:', [f"{v['nombre']}/{v['lienzo']}" for v in vs])
    for x in av: print('  !', x)


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
    vol = meta.get('volumen_musica', 0.55); lufs = meta.get('lufs', -16)
    filtro = (f"[0:a]aresample=44100,pan=stereo|c0=c0|c1=c0,apad,asplit=2[v1][v2];[1:a]volume={vol}[m];"
              f"[m][v2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];"
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
    t_ren = frames * ms / 1000 / (4 * cal['render']['eficiencia_4_procesos']) + cal['render']['overhead_fijo_s']
    crf = meta.get('crf', 17); mb = total * cal['salida']['mbps_crf17'] * 2 ** (-(crf - 17) / 6) / 8
    fmt = lambda s: f'{int(s // 3600)} h {int(s % 3600 // 60)} min' if s >= 3600 else f'{int(s // 60)} min {int(s % 60)} s'
    print(f"\n== ESTIMACION de proyectos/{a.tema}  (formato {meta['formato']}, voz {meta['voz']}/{motor}, ss {ss}, {fps} fps, crf {crf})")
    print(f"  Guion        {len(pars)} parrafos, {len(frases)} frases, {palabras} palabras")
    print(f"  Duracion     voz {fmt(voz_s)} (habla {fmt(habla)} + pausas {fmt(pausas)}) -> video {fmt(total)}, {frames} fotogramas")
    print(f"  Voz          ~{fmt(t_voz)} de calculo  (cache por frase: si se corta, se reanuda)")
    print(f"  Musica       ~{fmt(t_mus)}, pico ~{mem_mus:.1f} GB de RAM  -> NO ejecutar a la vez que voz o render")
    print(f"  Render       ~{fmt(t_ren)}  (reanudable por trozos)")
    print(f"  Disco        pesado ~{mb:.0f} MB; durante el render ~{mb * cal['salida']['copias_en_disco_durante_render']:.0f} MB")
    print(f"  TOTAL        ~{fmt(t_voz + t_mus + t_ren)} de proceso")
    vs, av = entrega.plan(meta['formato'], total)
    for x in av: print('  !', x)
    if total > 600: print('  ! El MP4 ligero (<10 MB) no es viable a esta duracion; se entrega solo el pesado.')
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
    objetivo = objetivo_MB * 1e6 * 8; audio_k = 40 if dur > 240 else 64
    v = objetivo / dur - audio_k * 1000 * 1.04
    if v < 70e3:
        return None, f'No cabe: a {dur:.0f} s harian falta {v / 1000:.0f} kbps de video (< 70). Con ese objetivo solo es viable hasta ~{objetivo / (70e3 + audio_k * 1040):.0f} s.'
    dims = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(pesado)],
                          capture_output=True, text=True).stdout.strip().split(',')
    w, h = int(dims[0]), int(dims[1]); lado = lado or (720 if v >= 1.4e6 else 480 if v >= 550e3 else 360 if v >= 260e3 else 240)
    esc = f'scale={lado}:-2' if h > w else f'scale=-2:{lado}'
    for intento in range(3):
        sh(['ffmpeg', '-v', 'error', '-y', '-i', str(pesado), '-vf', esc, '-c:v', 'libx264', '-b:v', str(int(v)), '-maxrate', str(int(v * 1.15)),
            '-bufsize', str(int(v * 2)), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', f'{audio_k}k', '-ac', '1',
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
               '--ss', str(v['ss']), '--salida', str(out), '--workers', str(a.workers)]
        if a.hasta: cmd += ['--hasta', str(a.hasta)]
        if 'crf' in meta: cmd += ['--crf', str(meta['crf'])]
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
    p = sp.add_parser('nuevo'); p.add_argument('tema'); p.add_argument('--formato', default='short', choices=['short', 'youtube', 'instagram'])
    p.add_argument('--voz', default='curiosos', choices=['curiosos', 'aprender', 'meditacion']); p.add_argument('--musica', default='curiosos', choices=['curiosos', 'aprender', 'meditacion']); p.set_defaults(f=cmd_nuevo)
    for nombre, f in (('voz', cmd_voz), ('musica', cmd_musica), ('mezcla', cmd_mezcla)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.add_argument('--whisper', default='small'); p.set_defaults(f=f)
    p = sp.add_parser('qa'); p.add_argument('tema'); p.add_argument('--paso', type=float, default=0.5); p.add_argument('--stills'); p.set_defaults(f=cmd_qa)
    for nombre, f in (('render', cmd_render), ('todo', cmd_todo)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.add_argument('--version'); p.add_argument('--workers', type=int, default=4)
        p.add_argument('--hasta', type=float); p.add_argument('--whisper', default='small'); p.set_defaults(f=f)
    for nombre, f in (('estimar', cmd_estimar), ('estado', cmd_estado)):
        p = sp.add_parser(nombre); p.add_argument('tema'); p.set_defaults(f=f)
    p = sp.add_parser('plan'); p.add_argument('formato'); p.add_argument('duracion', type=float); p.set_defaults(f=cmd_plan)
    a = ap.parse_args(); a.f(a)
