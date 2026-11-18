#!/usr/bin/env python3
"""EFECTOS DE SONIDO por codigo (sin ficheros, sin creditos, sin licencias): solo los de lo que se ve, en su momento exacto.

Se declaran en meta.json:  "efectos": [{"tipo": "motor", "t": 0, "dur": 5, "modo": "paso"},
                                       {"tipo": "claxon", "palabra": "claxon", "dur": 2.5}, ...]
Opcionales: ocurrencia (n-esima vez que sale la palabra), desfase (s), pan (-1..1), vol (dB respecto a la voz; cada tipo trae el suyo, siempre por debajo).
Tipos: motor (modos paso, arranque, ralenti, interior), claxon, frenazo, intermitente, seguros, puerta, pasos, golpe, mar, viento, lluvia,
       sirena, latido, tono_llamada, click.
Uso:  python3 pipeline/efectos.py --tipo motor --modo arranque prueba.wav   |   python3 pipeline/efectos.py --demo todos.wav
El motor no oye: el realismo de cada efecto lo juzga el usuario (la demo sirve para eso)."""
import argparse, re, sys
import numpy as np
from scipy.signal import butter, lfilter
SR = 44100


def _rng(semilla): return np.random.default_rng(semilla)
def _t(d): return np.arange(int(d * SR)) / SR
def _filtro(x, tipo, fc, orden=2):
    fc = np.clip(np.asarray(fc, float) / (SR / 2), 1e-4, 0.99); fc = float(fc) if fc.ndim == 0 else list(fc); b, a = butter(orden, fc, btype=tipo); return lfilter(b, a, x)
def _ruido(d, r): return r.standard_normal(int(d * SR))
def _env(n, ataque, caida):
    t = np.arange(n) / SR; return np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / max(caida, 1e-4))
def _fade(x, a=0.02):
    n = min(len(x) // 2, int(a * SR)); x = x.copy()
    if n: x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def _suma(base, x, t0):
    i = int(t0 * SR); j = min(len(base), i + len(x))
    if i < len(base) and j > i: base[i:j] += x[:j - i]


# ---------------------------------------------------------------- motor de combustion (tren de pulsos de explosion + armonicos + ruido de admision)
def _motor_tono(dur, f0, r, jitter=0.02, brillo=1.0, aspereza=0.35):
    n = int(dur * SR); f = np.broadcast_to(np.asarray(f0, float), n) if np.ndim(f0) == 0 else np.interp(np.arange(n), np.linspace(0, n - 1, len(f0)), f0)
    jt = _filtro(r.standard_normal(n), 'low', 6); f = f * (1 + jitter * jt / (jt.std() + 1e-12))
    fase = 2 * np.pi * np.cumsum(f) / SR; x = np.zeros(n)
    for k in range(1, 16): x += np.sin(k * fase + r.uniform(0, 6.28) * 0.2) * (1.0 / k ** (1.15 / brillo)) * (1 + 0.25 * np.sin(fase * 0.5 * k))     # semi-armonicos: cuatro tiempos
    x *= 1 + aspereza * np.sin(fase * 0.5)                       # un cilindro por cada dos vueltas: irregularidad que lo hace "motor"
    return x / np.max(np.abs(x))
def motor(d, r, modo='ralenti'):
    n = int(d * SR); t = _t(d)
    if modo == 'paso':                                             # coche que pasa: sube la tension, pasa y se aleja (Doppler suave + filtro)
        f = np.linspace(38, 52, n) * (1 + 0.12 * np.tanh((t - d / 2) * -1.6)); x = _motor_tono(d, f, r, brillo=1.1)
        pos = np.tanh((t - d / 2) * 1.8); a = np.exp(-(t - d / 2) ** 2 / (2 * (d / 4.2) ** 2)); x = _filtro(x, 'low', 1400) * a ** 1.4
        return (x + 0.25 * _filtro(_ruido(d, r), 'band', [90, 900]) * a)
    if modo == 'arranque':                                         # motor de arranque (vueltas irregulares) y el motor prende y baja a ralenti
        tc = min(1.3, d * 0.45); cr = _t(tc); fc = 7 + 3 * cr / tc; ar = _motor_tono(tc, fc, r, jitter=0.12, brillo=0.7, aspereza=0.8) * 0.8 + 0.08 * _filtro(_ruido(tc, r), 'band', [500, 2500])
        ar *= _env(len(ar), 0.05, 5) * np.minimum(1, (tc - cr) / 0.06 + 0.0) if len(ar) else 1
        td = d - tc; fb = np.concatenate([np.linspace(55, 40, int(td * SR * 0.45)), np.full(int(td * SR) - int(td * SR * 0.45), 26.0)]); ra = _motor_tono(td, fb, r) * np.minimum(1, _t(td) / 0.12)
        out = np.zeros(n); out[:len(ar)] += ar; _suma(out, ra, tc); return _filtro(out, 'low', 3200)
    if modo == 'interior':                                         # desde dentro: apagado y grave
        x = _motor_tono(d, 30, r, jitter=0.015, brillo=0.8); return _filtro(x, 'low', 520) * 1.4 + 0.1 * _filtro(_ruido(d, r), 'low', 180)
    x = _motor_tono(d, 25 + 0.6 * np.tanh(_filtro(r.standard_normal(n), 'low', 2) * 30), r, jitter=0.03)        # ralenti
    return _filtro(x, 'low', 2600) + 0.06 * _filtro(_ruido(d, r), 'band', [120, 1200])


def claxon(d, r, modo=None):
    t = _t(d); x = np.zeros(len(t))
    for f in (392, 494):                                           # dos tonos (sol-si): claxon de coche
        for k, a in ((1, 1), (2, .6), (3, .45), (4, .3), (5, .2), (7, .12)): x += a * np.sign(np.sin(2 * np.pi * f * k * t)) * 0 + a * np.sin(2 * np.pi * f * k * t * (1 + 0.0008 * np.sin(2 * np.pi * 5 * t)))
    return _filtro(x, 'band', [250, 4200]) * _env(len(t), 0.012, 1e9) * np.minimum(1, (d - t) / 0.06)
def frenazo(d, r, modo=None):
    t = _t(d); chirr = np.sin(2 * np.pi * np.cumsum(2300 - 700 * t / d) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(3400 - 900 * t / d) / SR) * 0.25
    x = chirr * (0.7 + 0.3 * _filtro(r.standard_normal(len(t)), 'low', 25)) + 0.9 * _filtro(_ruido(d, r), 'band', [1200, 5200])
    return _fade(x * np.exp(-t / (d * 0.7)) * np.minimum(1, t / 0.04), 0.03)
def intermitente(d, r, modo=None):
    out = np.zeros(int(d * SR)); k = 0; t0 = 0.0
    while t0 < d - 0.05:                                           # tic-toc a ~1,5 Hz
        c = _filtro(_ruido(0.05, r), 'band', [1500 if k % 2 == 0 else 1000, 4200]) * _env(int(0.05 * SR), 0.001, 0.008); c += np.sin(2 * np.pi * (2600 if k % 2 == 0 else 1900) * _t(0.05)) * _env(int(0.05 * SR), 0.0005, 0.006) * 0.5
        _suma(out, c, t0); t0 += 0.34 + (0.0 if k % 2 == 0 else 0.0); k += 1
    return out
def seguros(d, r, modo=None):
    out = np.zeros(int(max(d, 0.9) * SR))
    for t0 in (0.0, 0.17):                                         # dos bips agudos + clac mecanico
        b = np.sin(2 * np.pi * 2000 * _t(0.07)) * _env(int(0.07 * SR), 0.002, 0.04) * 0.8; _suma(out, b, t0)
    _suma(out, _filtro(_ruido(0.08, r), 'band', [300, 2400]) * _env(int(0.08 * SR), 0.001, 0.02) * 0.9, 0.36)
    return out
def puerta(d, r, modo=None):
    t = _t(max(d, 0.7)); thud = np.sin(2 * np.pi * (110 - 40 * np.minimum(1, t / 0.12)) * t) * _env(len(t), 0.002, 0.07)
    cuerpo = _filtro(_ruido(len(t) / SR, r), 'band', [80, 700]) * _env(len(t), 0.002, 0.05); out = 0.9 * thud + 0.8 * cuerpo
    _suma(out, _filtro(_ruido(0.04, r), 'band', [1800, 6000]) * _env(int(0.04 * SR), 0.0005, 0.012) * 0.7, 0.012)     # cierre del pestillo
    return out
def pasos(d, r, modo=None):
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.15:
        a = 0.85 + 0.25 * r.random(); p = _filtro(_ruido(0.14, r), 'band', [90, 900]) * _env(int(0.14 * SR), 0.002, 0.03) + 0.6 * np.sin(2 * np.pi * 75 * _t(0.14)) * _env(int(0.14 * SR), 0.002, 0.04)
        _suma(out, a * p, t0); t0 += 0.52 + 0.03 * r.standard_normal()
    return out
def golpe(d, r, modo=None):
    t = _t(max(d, 0.6)); x = np.sin(2 * np.pi * (70 - 35 * np.minimum(1, t / 0.15)) * t) * _env(len(t), 0.001, 0.12) + 0.6 * _filtro(_ruido(len(t) / SR, r), 'low', 1200) * _env(len(t), 0.001, 0.035)
    return x
def mar(d, r, modo=None):
    t = _t(d); r1 = _filtro(_ruido(d, r), 'low', 900); sw = 0.55 + 0.45 * np.sin(2 * np.pi * t / 7.5 - 1.2) ** 2; esp = _filtro(_ruido(d, r), 'band', [1500, 6000]) * np.clip(np.sin(2 * np.pi * t / 7.5 - 0.5), 0, 1) ** 3 * 0.4
    return _fade((r1 * sw + esp) * 1.2, 0.5)
def viento(d, r, modo=None):
    t = _t(d); mod = 0.5 + 0.5 * _filtro(r.standard_normal(len(t)), 'low', 0.6) * 3; fc = 400 + 500 * np.clip(mod, 0, 1.5)
    x = _filtro(_ruido(d, r), 'band', [250, 1800]); return _fade(x * np.clip(0.4 + mod, 0.15, 1.6), 0.4)
def lluvia(d, r, modo=None):
    x = _filtro(_ruido(d, r), 'high', 1500) * 0.5; out = x.copy()
    for t0 in r.uniform(0, d, int(d * 90)): _suma(out, _filtro(_ruido(0.02, r), 'band', [2000, 7000]) * _env(int(0.02 * SR), 0.0005, 0.004) * r.uniform(0.3, 1.2), t0)
    return _fade(out, 0.3)
def sirena(d, r, modo=None):
    t = _t(d); f = 900 + 350 * np.sin(2 * np.pi * t / 3.2); x = sum(a * np.sin(k * 2 * np.pi * np.cumsum(f) / SR) for k, a in ((1, 1), (2, .4), (3, .25), (5, .1)))
    return _fade(_filtro(x, 'band', [350, 4200]), 0.15)
def latido(d, r, modo=None):
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d - 0.4:
        for dt, a in ((0.0, 1.0), (0.26, 0.75)): _suma(out, a * np.sin(2 * np.pi * (58 - 18 * np.minimum(1, _t(0.2) / 0.1)) * _t(0.2)) * _env(int(0.2 * SR), 0.004, 0.06), t0 + dt)
        t0 += 0.85
    return _filtro(out, 'low', 220)
def tono_llamada(d, r, modo=None):
    out = np.zeros(int(d * SR)); t0 = 0.0
    while t0 < d:
        b = np.sin(2 * np.pi * 425 * _t(1.5)) * np.minimum(1, np.minimum(_t(1.5), 1.5 - _t(1.5)) / 0.02) * 0.7; _suma(out, b, t0); t0 += 4.5
    return out
def click(d, r, modo=None): return _filtro(_ruido(0.03, r), 'band', [1200, 5000]) * _env(int(0.03 * SR), 0.0005, 0.007)


# tipo: (funcion, duracion por defecto s, nivel por defecto dB respecto a la RMS de la voz)
TIPOS = {'motor': (motor, 5.0, -9), 'claxon': (claxon, 1.2, -9), 'frenazo': (frenazo, 1.8, -10), 'intermitente': (intermitente, 3.0, -16), 'seguros': (seguros, 0.9, -12),
         'puerta': (puerta, 0.8, -9), 'pasos': (pasos, 3.0, -14), 'golpe': (golpe, 0.7, -8), 'mar': (mar, 6.0, -17), 'viento': (viento, 5.0, -18), 'lluvia': (lluvia, 5.0, -19),
         'sirena': (sirena, 4.0, -13), 'latido': (latido, 4.0, -12), 'tono_llamada': (tono_llamada, 3.0, -13), 'click': (click, 0.1, -14)}


def generar(tipo, dur=None, modo=None, semilla=1):
    f, d0, _ = TIPOS[tipo]; d = dur or d0; x = f(d, _rng(semilla), modo) if tipo == 'motor' else f(d, _rng(semilla), modo)
    x = np.asarray(x, float); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9)            # RMS 1 (se escala luego al nivel pedido)
    return _fade(x, min(0.03, d / 4))


def nivel_voz(ruta):
    """RMS (dBFS) de la voz en los tramos con habla (para fijar los efectos respecto a ella)."""
    from scipy.io import wavfile
    sr, v = wavfile.read(str(ruta)); v = v.astype(float) / (32768.0 if v.dtype.kind in 'iu' or abs(v).max() > 2 else 1); v = v.mean(axis=1) if v.ndim > 1 else v
    h = 2048; m = np.array([np.sqrt(np.mean(v[i:i + h] ** 2)) for i in range(0, len(v) - h, h)]); m = m[m > 0.2 * m.max()]
    return 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9)


def _norm(w): return re.sub(r'[^a-z0-9ñ]', '', w.lower())
def pista(efectos, palabras, total, ref_db=-20.0):
    """Pista estereo (n,2) con todos los efectos en su sitio + lineas de informe. total: duracion del video (s)."""
    out = np.zeros((int((total + 3) * SR), 2)); informe = []
    for i, e in enumerate(efectos):
        tipo = e['tipo']
        if tipo not in TIPOS: raise SystemExit(f'Efecto desconocido: {tipo} (tipos: {", ".join(TIPOS)})')
        if 'palabra' in e:
            cand = [w for w in palabras if _norm(w['t']) == _norm(e['palabra'])]; k = e.get('ocurrencia', 1) - 1
            if k >= len(cand): raise SystemExit(f'Efecto {tipo}: la palabra "{e["palabra"]}" (ocurrencia {k + 1}) no sale en la locucion')
            t0 = cand[k]['ini']
        else: t0 = float(e.get('t', 0))
        t0 += float(e.get('desfase', 0)); dur = e.get('dur'); x = generar(tipo, dur, e.get('modo'), e.get('semilla', 1 + i))
        g = 10 ** ((ref_db + e.get('vol', TIPOS[tipo][2])) / 20); pan = float(e.get('pan', 0)); x = x * g; x = x * min(1.0, 0.7 / (np.abs(x).max() + 1e-9))      # los golpes secos no pasan de -3 dBFS
        l, rr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); j = int(t0 * SR); n = min(len(x), len(out) - j)
        if n > 0: out[j:j + n, 0] += x[:n] * l * 1.414; out[j:j + n, 1] += x[:n] * rr * 1.414
        informe.append(f'{tipo}{"/" + e["modo"] if e.get("modo") else ""} en {t0:.2f} s' + (f' (palabra "{e["palabra"]}")' if 'palabra' in e else '') + f' · {len(x) / SR:.1f} s · {ref_db + e.get("vol", TIPOS[tipo][2]):.0f} dBFS')
    return out, informe


def guardar(st, ruta):
    from scipy.io import wavfile
    wavfile.write(str(ruta), SR, (np.clip(st, -1, 1) * 32767).astype('<i2'))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('salida'); ap.add_argument('--tipo', choices=list(TIPOS)); ap.add_argument('--modo'); ap.add_argument('--dur', type=float); ap.add_argument('--demo', action='store_true', help='todos los tipos seguidos')
    o = ap.parse_args()
    if o.demo:
        trozos = []
        for t in TIPOS:
            modos = ['paso', 'arranque', 'ralenti', 'interior'] if t == 'motor' else [None]
            for m in modos: x = generar(t, None, m) * 10 ** ((-20 + TIPOS[t][2]) / 20); trozos += [x, np.zeros(int(0.6 * SR))]; print(f'{t}{"/" + m if m else ""}')
        x = np.concatenate(trozos)
    elif o.tipo: x = generar(o.tipo, o.dur, o.modo) * 10 ** ((-20 + TIPOS[o.tipo][2]) / 20)
    else: sys.exit('Indica --tipo o --demo')
    guardar(np.stack([x, x], 1), o.salida); print(f'{o.salida}: {len(x) / SR:.1f} s')
