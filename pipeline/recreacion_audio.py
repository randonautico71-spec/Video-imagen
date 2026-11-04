#!/usr/bin/env python3
"""AUDIO DE UNA RECREACION 3D YA RENDERIZADA (sin volver a renderizar el 3D).

Las recreaciones 3D tardan ~1 h en renderizarse. Para no repetir ese render cuando llega la voz, el video se renderiza MUDO con la
duracion ESTIMADA de cada escena (escenas_estimadas.json) y este script, cuando ya hay voz:
  1. reajusta cada escena a la duracion REAL de su parrafo (cambio de velocidad pequeno; la escena entera se acelera o frena),
  2. quema los subtitulos (grupos de palabras con la palabra que suena resaltada; tipografia Fredoka 700, banda inferior),
  3. coloca los efectos de sonido (efectos.json: en su escena, a un segundo dado o en una palabra del guion; bucles; volumen; fundidos),
  4. mezcla voz + efectos + musica (los efectos y la musica bajan solos cuando habla la voz) y normaliza a los LUFS del perfil,
  5. saca el MP4 pesado (1080x1920) y el ligero (< meta.ligero_MB).

Uso (antes: vid.py voz-importar <tema> <audio>, que alinea la voz y crea timeline.json y palabras.json; opcional: vid.py musica <tema>):
  python3 pipeline/recreacion_audio.py <tema> [--video salida/video_mudo.mp4] [--sin-musica] [--solo-audio]

efectos.json (en proyectos/<tema>/):
  { "carpeta": "salida/efectos",                      # donde estan los audios de los efectos
    "efectos": [ { "archivo": "ambiente.mp3", "escena": 0, "hasta_escena": 7, "bucle": true, "db": -20 },
                 { "archivo": "grito_carga.mp3", "escena": 4, "palabra": "atacan", "adelanto": 0.3, "db": -4 },
                 { "archivo": "choque.mp3", "escena": 5, "en": 0.0, "db": -5, "dur": 10, "fundido": 1.0 } ] }
  escena = indice del parrafo; en = segundos desde el inicio REAL de la escena; palabra = primera aparicion de esa palabra en la escena.
"""
import argparse, json, math, re, shutil, subprocess, sys, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def sh(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('Fallo: ' + ' '.join(map(str, cmd))[:300] + '\n' + r.stderr[-1500:])
    return r


def duracion(ruta):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(ruta)], capture_output=True, text=True).stdout)


def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in t if unicodedata.category(c) != 'Mn'))


def fuente_subtitulos(destino):
    """Fredoka 700 en TTF (libass no lee woff2 y Fredoka es variable: se instancia el peso 700)."""
    ttf = destino / 'Fredoka-Bold.ttf'
    if ttf.exists():
        return ttf
    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
    except ImportError:
        sys.exit('Falta fontTools para la fuente de los subtitulos: pip install fonttools brotli')
    f = TTFont(str(RAIZ / 'assets/fonts/fredoka-latin.woff2'))
    f.flavor = None
    if 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {'wght': 700})
    for rec in f['name'].names:                       # que libass la encuentre como «Fredoka» negrita
        if rec.nameID in (1, 16):
            rec.string = 'Fredoka'
        if rec.nameID in (2, 17):
            rec.string = 'Bold'
    destino.mkdir(parents=True, exist_ok=True)
    f.save(str(ttf))
    return ttf


def t_ass(s):
    s = max(0.0, s); h = int(s // 3600); m = int(s % 3600 // 60); return f'{h}:{m:02d}:{s % 60:05.2f}'


def subtitulos_ass(palabras, ruta, W=1080, H=1920, por_grupo=4, resalte='&H006BD3FF&', margen_v=430):
    """Grupos de hasta 'por_grupo' palabras (se corta en fin de frase); un evento por palabra con la que suena resaltada."""
    grupos, g = [], []
    for i, w in enumerate(palabras):
        g.append(w)
        fin_frase = re.search(r'[.!?…:;]$', w['t']) or (i + 1 < len(palabras) and palabras[i + 1].get('frase') != w.get('frase'))
        if len(g) >= por_grupo or fin_frase:
            grupos.append(g); g = []
    if g:
        grupos.append(g)
    lineas = ['[Script Info]', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}', 'WrapStyle: 0', '',
              '[V4+ Styles]',
              'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
              f'Style: Sub,Fredoka,72,&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,6,2,2,90,90,{margen_v},1', '',
              '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    for k, g in enumerate(grupos):
        fin_grupo = g[-1].get('fin', g[-1]['ini'] + 0.4)
        sig = grupos[k + 1][0]['ini'] if k + 1 < len(grupos) else fin_grupo + 0.6
        fin_grupo = min(max(fin_grupo + 0.25, fin_grupo), sig)
        for j, w in enumerate(g):
            ini = w['ini'] if j else g[0]['ini']
            fin = g[j + 1]['ini'] if j + 1 < len(g) else fin_grupo
            if fin <= ini:
                continue
            texto = ' '.join((('{\\c' + resalte + '}' + x['t'].upper() + '{\\c&H00FFFFFF&}') if q == j else x['t'].upper()) for q, x in enumerate(g))
            lineas.append(f'Dialogue: 0,{t_ass(ini)},{t_ass(fin)},Sub,,0,0,0,,{texto}')
    ruta.write_text('\n'.join(lineas) + '\n', encoding='utf-8')
    return len(grupos)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('tema'); ap.add_argument('--video', default='salida/video_mudo.mp4'); ap.add_argument('--estimadas', default='escenas_estimadas.json')
    ap.add_argument('--efectos', default='efectos.json'); ap.add_argument('--sin-musica', action='store_true'); ap.add_argument('--solo-audio', action='store_true')
    ap.add_argument('--db-musica', type=float, default=-12.0, help='volumen de la musica bajo la voz (dB)')
    a = ap.parse_args()
    d = RAIZ / 'proyectos' / a.tema; s = d / 'salida'; meta = json.loads((d / 'meta.json').read_text())
    for f in ('timeline.json', 'palabras.json', 'locucion.wav'):
        if not (s / f).exists():
            sys.exit(f'Falta salida/{f}: primero vid.py voz-importar {a.tema} <audio de ElevenLabs>')
    tl = json.loads((s / 'timeline.json').read_text()); palabras = json.loads((s / 'palabras.json').read_text())
    est = json.loads((d / a.estimadas).read_text())['escenas']
    reales = [{'ini': e['ini'], 'dur': e['fin'] - e['ini']} for e in tl['escenas']]
    if len(est) != len(reales):
        sys.exit(f'El video mudo tiene {len(est)} escenas y la voz {len(reales)} parrafos')
    total = tl['duracion_total']; fps = meta.get('fps', 30)

    # 1) audio: voz + efectos + musica
    entradas = ['-i', str(s / 'locucion.wav')]; filtros = ['[0:a]aresample=44100,pan=stereo|c0=c0|c1=c0,apad,asplit=2[voz][llave]']; lecho = []
    cfg = json.loads((d / a.efectos).read_text()) if (d / a.efectos).exists() else {'efectos': []}
    carpeta = d / cfg.get('carpeta', 'salida/efectos'); n = 1
    for k, ef in enumerate(cfg['efectos']):
        ruta = carpeta / ef['archivo']
        if not ruta.exists():
            sys.exit(f'Falta el efecto {ruta}')
        e = reales[ef['escena']]; t0 = e['ini'] + ef.get('en', 0.0)
        if 'palabra' in ef:
            obj = norm(ef['palabra']); rango = tl['escenas'][ef['escena']]['palabras']
            cand = [w for w in palabras[rango[0]:rango[1]] if norm(w['t']) == obj]
            if not cand:
                sys.exit(f'No encuentro la palabra «{ef["palabra"]}» en la escena {ef["escena"]}')
            t0 = cand[0]['ini'] - ef.get('adelanto', 0.0)
        hasta = reales[ef['hasta_escena']]['ini'] + reales[ef['hasta_escena']]['dur'] if 'hasta_escena' in ef else None
        dur = (hasta - t0) if hasta else ef.get('dur', duracion(ruta))
        fade = ef.get('fundido', 0.6); db = ef.get('db', -6.0)
        entradas += (['-stream_loop', '-1'] if ef.get('bucle') else []) + ['-i', str(ruta)]
        filtros.append(f'[{n}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:{dur:.3f},afade=t=in:d=0.08,afade=t=out:st={max(0, dur - fade):.3f}:d={fade:.3f},'
                       f'volume={db}dB,adelay={int(t0 * 1000)}|{int(t0 * 1000)}[e{k}]')
        lecho.append(f'[e{k}]'); n += 1
    if not a.sin_musica and (s / 'musica.wav').exists():
        entradas += ['-i', str(s / 'musica.wav')]; filtros.append(f'[{n}:a]aresample=44100,aformat=channel_layouts=stereo,volume={a.db_musica}dB[mus]'); lecho.append('[mus]'); n += 1
    if lecho:
        filtros.append(''.join(lecho) + f'amix=inputs={len(lecho)}:normalize=0:duration=longest[lecho0]')
        filtros.append('[lecho0][llave]sidechaincompress=threshold=0.04:ratio=4:attack=30:release=500[lecho]')   # efectos y musica bajan cuando habla la voz
        filtros.append('[voz][lecho]amix=inputs=2:normalize=0:duration=longest[mezcla0]')
    else:
        filtros.append('[voz]anull[mezcla0]')
    lufs = meta.get('lufs', -14)
    filtros.append(f'[mezcla0]atrim=0:{total:.3f},loudnorm=I={lufs}:TP=-1.5:LRA=11[a]')
    mezcla = s / 'mezcla_recreacion.wav'
    sh(['ffmpeg', '-v', 'error', '-y'] + entradas + ['-filter_complex', ';'.join(filtros), '-map', '[a]', '-ar', '44100', '-ac', '2', str(mezcla)])
    print(f'Mezcla: {duracion(mezcla):.2f} s  ({len(cfg["efectos"])} efectos, musica: {"no" if a.sin_musica or not (s / "musica.wav").exists() else "si"})')
    if a.solo_audio:
        return

    # 2) video: cada escena a su duracion real
    video = d / a.video
    partes, cadena = [], []
    for i, (e, r) in enumerate(zip(est, reales)):
        fac = r['dur'] / e['dur']
        partes.append(f'[0:v]trim=start={e["ini"]:.3f}:duration={e["dur"]:.3f},setpts=(PTS-STARTPTS)*{fac:.5f}[v{i}]'); cadena.append(f'[v{i}]')
        print(f'  escena {i + 1}: estimada {e["dur"]:.2f} s -> real {r["dur"]:.2f} s (x{fac:.3f})')
    # 3) subtitulos
    ass = s / 'subtitulos.ass'; ng = subtitulos_ass(palabras, ass); fuentes = fuente_subtitulos(s / 'fuentes').parent
    filtro_v = ';'.join(partes) + ';' + ''.join(cadena) + f'concat=n={len(cadena)}:v=1:a=0,fps={fps},ass={ass}:fontsdir={fuentes}[v]'
    pesado = s / f'{a.tema}.mp4'
    sh(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-i', str(mezcla), '-filter_complex', filtro_v, '-map', '[v]', '-map', '1:a',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', str(meta.get('crf', 17) + 1), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}',
        '-movflags', '+faststart', str(pesado)])
    # 5) ligero (< ligero_MB): tasa de video calculada para el tamano objetivo, audio a 64 kbps con limitador
    objetivo = meta.get('ligero_MB', 9.5) * 0.92; kbps = max(300, int(objetivo * 8 * 1024 / total - 64))
    ligero = s / f'{a.tema}_ligero.mp4'
    sh(['ffmpeg', '-v', 'error', '-y', '-i', str(pesado), '-vf', 'scale=720:-2', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kbps}k', '-maxrate', f'{int(kbps * 1.4)}k',
        '-bufsize', f'{kbps * 2}k', '-af', 'alimiter=limit=0.84', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(ligero)])
    print(f'Subtitulos: {ng} grupos · Pesado: {pesado} ({pesado.stat().st_size / 1e6:.1f} MB) · Ligero: {ligero} ({ligero.stat().st_size / 1e6:.1f} MB)')


if __name__ == '__main__':
    main()
