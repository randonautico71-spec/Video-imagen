#!/usr/bin/env python3
"""EFECTOS DE SONIDO por código (sin ficheros ni créditos). Tipos: mar, latido, golpe.
Uso: python3 pipeline/efectos.py --proyecto <tema>   -> mezcla meta.efectos sobre salida/mezcla.wav (modo: se suma a la mezcla, a bajo nivel)
     python3 pipeline/efectos.py --tipo latido prueba.wav   -> genera un efecto suelto para oírlo
meta.efectos: [{"tipo":"latido","t":13.0,"dur":3,"vol":0.5} | {"tipo":"golpe","palabra":"frena","ocurrencia":1,"dur":1}]  (palabra = tiempo de palabras.json)"""
import sys, os, json, wave, argparse
import numpy as np
SR = 44100
def _rng(s): return np.random.default_rng(s)
def _lp(x, fc):                                   # paso bajo de un polo (barato)
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc = a * acc + (1 - a) * v; y[i] = acc
    return y
def mar(dur):
    n = int(SR * dur); r = _rng(7); x = _lp(r.standard_normal(n), 380); x = _lp(x, 380)
    t = np.arange(n) / SR; ola = 0.65 + 0.35 * np.sin(2 * np.pi * 0.28 * t)               # oleaje lento
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.8); y = x * ola * env; return y / (np.abs(y).max() + 1e-9) * 0.9
def _thump(n, f0=62, d=0.16):
    t = np.arange(n) / SR; return np.sin(2 * np.pi * (f0 + 40 * np.exp(-t * 28)) * t) * np.exp(-t / d)
def latido(dur):
    n = int(SR * dur); y = np.zeros(n); bpm = 52; per = 60 / bpm
    for k in range(int(dur / per) + 1):
        for off, amp in ((0.0, 1.0), (0.30, 0.7)):                                      # lub-dub
            i = int((k * per + off) * SR); s = _thump(min(n - i, int(0.5 * SR)), 58 if amp == 1 else 70)
            if i < n: y[i:i + len(s)] += s[:n - i] * amp
    return y / (np.abs(y).max() + 1e-9) * 0.9
def golpe(dur):
    n = int(SR * dur); s = _thump(n, 48, 0.22) + 0.25 * _lp(_rng(3).standard_normal(n), 300) * np.exp(-np.arange(n) / SR / 0.1); return s / (np.abs(s).max() + 1e-9) * 0.9
TIPOS = {'mar': mar, 'latido': latido, 'golpe': golpe}
def leer(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); d = np.frombuffer(w.readframes(n), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768; return d, w.getframerate()
def guardar(p, d):
    w = wave.open(p, 'wb'); w.setnchannels(d.shape[1]); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(d, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
def mezclar(tema):
    base = os.path.join('proyectos', tema, 'salida'); meta = json.load(open(os.path.join('proyectos', tema, 'meta.json'))); pal = json.load(open(os.path.join(base, 'palabras.json')))
    d, sr = leer(os.path.join(base, 'mezcla.wav')); assert sr == SR, sr
    for e in meta.get('efectos', []):
        t = e.get('t')
        if t is None:
            cand = [w for w in pal if w['t'].strip('.,;:¿?¡!').lower() == e['palabra'].lower()]; t = cand[e.get('ocurrencia', 0)]['ini'] + e.get('desfase', 0)
        s = TIPOS[e['tipo']](e.get('dur', 1.0)) * e.get('vol', 0.28); i = int(t * SR); j = min(len(d), i + len(s))
        for c in range(d.shape[1]): d[i:j, c] += s[:j - i]
    guardar(os.path.join(base, 'mezcla.wav'), d); print('efectos mezclados:', [e['tipo'] for e in meta.get('efectos', [])])
if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--proyecto'); ap.add_argument('--tipo'); ap.add_argument('salida', nargs='?'); a = ap.parse_args()
    if a.proyecto: mezclar(a.proyecto)
    else: guardar(a.salida, np.stack([TIPOS[a.tipo](3.0)] * 2, 1))
