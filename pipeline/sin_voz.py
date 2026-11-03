#!/usr/bin/env python3
"""MODO SIN SONIDO: genera los mismos ficheros que la voz (frases.json, palabras.json, envolvente.json, locucion.wav, timeline.json, mezcla.wav)
pero con tiempos SINTETICOS a ritmo de locucion (~180 palabras/min) y audio en silencio. Sirve para revisar la imagen antes de gastar creditos
de voz. Cuando exista la voz real: `vid.py voz-importar <tema> <audio>` sobreescribe estos ficheros y hay que volver a renderizar.
Uso:  python3 pipeline/vid.py sin-voz <tema> [--ppm 180]"""
import json, re, wave
from pathlib import Path

SR = 24000


def generar(d, parrafos, meta, ppm=180.0, pausa_frase=0.28, pausa_parrafo=0.6):
    s = d / 'salida'; s.mkdir(exist_ok=True)
    frases, palabras = [], []
    t = 0.0
    seg_pal = 60.0 / ppm
    for k, par in enumerate(parrafos):
        trozos = [x for x in re.split(r'(?<=[.!?])\s+', par) if x.strip()]
        for j, fr in enumerate(trozos):
            ws = fr.split()
            pesos = [max(2, len(re.sub(r'\W', '', w))) + (3 if re.search(r'[,:;]$', w) else 0) for w in ws]
            tot = sum(pesos); dur = len(ws) * seg_pal; ini = t; acum = 0.0
            for w, p in zip(ws, pesos):
                a = ini + dur * acum / tot; acum += p; b = ini + dur * acum / tot
                palabras.append({'t': w, 'ini': round(a, 3), 'fin': round(b - 0.02, 3), 'frase': len(frases)})
            t = ini + dur
            fin_par = j == len(trozos) - 1
            frases.append({'texto': fr, 'ini': round(ini, 3), 'fin': round(t, 3), 'parrafo_fin': fin_par})
            t += pausa_parrafo if fin_par else pausa_frase
    dur_voz = frases[-1]['fin']
    (s / 'frases.json').write_text(json.dumps(frases, ensure_ascii=False, indent=1))
    (s / 'palabras.json').write_text(json.dumps(palabras, ensure_ascii=False))
    tasa = 60; n = int(dur_voz * tasa) + 1; env = [0.0] * n
    for p in palabras:
        for i in range(int(p['ini'] * tasa), min(n, int(p['fin'] * tasa) + 1)): env[i] = 0.6
    (s / 'envolvente.json').write_text(json.dumps({'tasa': tasa, 'valores': env}))
    silencio(s / 'locucion.wav', dur_voz + 0.2, SR, 1)
    (s / 'voz_meta.json').write_text(json.dumps({'perfil': 'sin_voz', 'motor': 'sintetico', 'duracion_s': round(dur_voz, 2), 'frases': len(frases),
                                                 'palabras': len(palabras), 'alineado': 'sintetico', 'ppm': ppm}, indent=1))
    return dur_voz


def silencio(ruta, seg, sr, canales):
    with wave.open(str(ruta), 'wb') as w:
        w.setnchannels(canales); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(b'\x00\x00' * canales * int(seg * sr))
