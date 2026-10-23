#!/usr/bin/env python3
"""PROSODIA: da a una voz sintetizada (p. ej. Aiden) la melodia, el ritmo y el pulso de otra voz de referencia (p. ej. Carmen).
Se ejecuta con .venv-qwen (necesita pyworld, librosa, scipy). Trabaja por TROZO (frase) sobre el audio crudo del sintetizador.

Entrada: JSON con {"trabajos":[{"ent":"x.npz","sal":"y.npz"}], "cfg":{...}} por stdin o como primer argumento (fichero).
Cada .npz lleva a (float32 mono) y sr. Salida: mismo formato.

cfg:
  f0_ref_hz       tono mediano del crudo (referencia para ampliar la melodia). Medido en Aiden.
  desplazar_st    semitonos que se suman a todo el tono (negativo = mas grave)
  k_lento         factor de la melodia lenta (curva de frase): 1 = igual, 1.2 = 20 % mas amplia
  k_rapido        factor del detalle rapido (palabra/silaba)
  formantes       <1 baja los formantes (voz de apariencia mas grande/grave); 1 = sin cambio
  tempo           >1 acelera el habla sin cambiar el tono
  hueco_max_s     pausas internas mas largas que esto se acortan a este valor
  recorte_db      umbral para recortar silencios de los extremos
"""
import json, sys
import numpy as np, pyworld as pw, librosa
from scipy.ndimage import uniform_filter1d, median_filter

def recortar_y_acortar(y, sr, db, hueco_max, margen=0.03):
    iv = librosa.effects.split(y, top_db=db, frame_length=1024, hop_length=256)
    if len(iv) == 0: return y
    m = int(margen * sr); piezas = []
    for i, (a, b) in enumerate(iv):
        a2 = max(0, a - (m if i == 0 else 0)); b2 = min(len(y), b + (m if i == len(iv) - 1 else 0))
        piezas.append(y[a2:b2])
        if i < len(iv) - 1:
            hueco = y[b:iv[i + 1][0]]; mx = int(hueco_max * sr)
            if len(hueco) > mx:                                   # se conservan los extremos del hueco (colas suaves) y se quita el centro
                h = mx // 2; hueco = np.concatenate([hueco[:h], hueco[-(mx - h):]])
            piezas.append(hueco)
    return np.concatenate(piezas)

def procesar(y, sr, cfg):
    y = y.astype(np.float64)
    y = recortar_y_acortar(y.astype(np.float32), sr, cfg.get('recorte_db', 35), cfg.get('hueco_max_s', 0.55)).astype(np.float64)
    fp = 5.0
    f0, t = pw.harvest(y, sr, f0_floor=65, f0_ceil=400, frame_period=fp); f0 = pw.stonemask(y, f0, t, sr)
    sp = pw.cheaptrick(y, f0, t, sr); ap = pw.d4c(y, f0, t, sr)
    v = f0 > 0
    if v.sum() > 10:
        ref = np.log2(cfg.get('f0_ref_hz', 146.0)); lf = np.zeros_like(f0); lf[v] = np.log2(f0[v])
        # se rellenan los huecos sordos con el valor vecino para poder suavizar la curva
        idx = np.arange(len(f0)); lfv = np.interp(idx, idx[v], lf[v])
        lenta = uniform_filter1d(median_filter(lfv, size=9), size=60)
        rapido = lfv - lenta
        nuevo = ref + cfg.get('desplazar_st', 0) / 12 + (lenta - ref) * cfg.get('k_lento', 1.0) + rapido * cfg.get('k_rapido', 1.0)
        f0 = np.where(v, 2 ** nuevo, 0.0)
    w = cfg.get('formantes', 1.0)
    if abs(w - 1) > 0.002:                                        # nueva envolvente en f = vieja en f / w
        n = sp.shape[1]; src = np.arange(n) / w; src = np.clip(src, 0, n - 1); i0 = np.floor(src).astype(int); i1 = np.minimum(i0 + 1, n - 1); fr = src - i0
        sp = sp[:, i0] * (1 - fr) + sp[:, i1] * fr
    tempo = cfg.get('tempo', 1.0)
    if abs(tempo - 1) > 0.002:
        n = len(f0); m = max(2, int(n / tempo)); pos = np.linspace(0, n - 1, m); i0 = np.floor(pos).astype(int); i1 = np.minimum(i0 + 1, n - 1); fr = (pos - i0)[:, None]
        sp = sp[i0] * (1 - fr) + sp[i1] * fr; ap = ap[i0] * (1 - fr) + ap[i1] * fr
        f0 = np.where(fr[:, 0] < 0.5, f0[i0], f0[i1])
    sp = np.ascontiguousarray(sp); ap = np.ascontiguousarray(ap)
    out = pw.synthesize(np.ascontiguousarray(f0), sp, ap, sr, fp)
    pico = np.abs(out).max() + 1e-9; ent_pico = np.abs(y).max() + 1e-9
    return (out * (ent_pico / pico)).astype(np.float32)

if __name__ == '__main__':
    job = json.load(open(sys.argv[1]) if len(sys.argv) > 1 else sys.stdin)
    cfg = job['cfg']
    for t in job['trabajos']:
        z = np.load(t['ent']); a = np.asarray(z['a'], dtype=np.float32); sr = int(z['sr'])
        np.savez(t['sal'], a=procesar(a, sr, cfg), sr=sr)
    print(json.dumps({'ok': True, 'n': len(job['trabajos'])}))
