#!/usr/bin/env python3
"""EFECTOS DE SONIDO por sintesis (numpy/scipy). Sin ficheros externos, sin copyright, deterministas.

Son sonidos DE LO QUE SE VE (un coche que pasa, el claxon, una puerta), no musica ni transiciones.
Se declaran en meta.json y se colocan por palabra (tiempos de voz-importar) o por segundo:

  "efectos": [
    {"tipo": "motor", "t": 0.0, "dur": 5, "modo": "paso"},          # coche que pasa (doppler + paneo)
    {"tipo": "claxon", "palabra": "claxon", "dur": 2.5},              # suena al decir «claxon»
    {"tipo": "intermitente", "palabra": "warnings", "dur": 3},
    {"tipo": "puerta", "palabra": "seguros", "ocurrencia": 1, "desfase": 0.1, "vol": -8, "pan": -0.3}
  ]

  palabra    : se busca en salida/palabras.json sin tildes ni signos; "ocurrencia" elige la n-esima (1 por defecto).
  t          : segundo absoluto (en lugar de palabra).
  desfase    : segundos que se suman al instante (negativo = antes).
  dur        : duracion en s (cada tipo tiene la suya por defecto).
  vol        : dB respecto al nivel medio de la VOZ (cada tipo tiene uno por defecto, siempre por debajo de la voz).
  pan        : -1 izquierda ... 1 derecha.
  modo       : variantes de algunos tipos (motor: paso | ralenti | arranque | interior).

Tipos: motor, claxon, frenazo, intermitente, seguros, puerta, pasos, golpe, mar, viento, lluvia, sirena, latido, tono_llamada, click.
Prueba de oido de todos:  python3 pipeline/efectos.py --demo salida.wav"""
import argparse, json, re, unicodedata
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100


# ------------------------------------------------------------------ utilidades
def _n(d): return max(1, int(d * SR))
def _t(d): return np.arange(_n(d)) / SR


def _bp(x, lo, hi, orden=2):
    return sosfilt(butter(orden, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)


def _lp(x, f, orden=2):
    return sosfilt(butter(orden, f / (SR / 2), 'low', output='sos'), x)


def _hp(x, f, orden=2):
    return sosfilt(butter(orden, f / (SR / 2), 'high', output='sos'), x)


def _env(n, ataque, caida, sostener=None):
    """Envolvente: subida lineal, meseta (si sostener) y caida exponencial al final."""
    e = np.ones(n, np.float64); a = min(n, max(1, int(ataque * SR))); c = min(n, max(1, int(caida * SR)))
    e[:a] = np.linspace(0, 1, a)
    e[-c:] *= np.exp(-np.linspace(0, 5, c))
    return e


def _fase(f):
    """Oscilador de frecuencia variable: f puede ser un array (Hz por muestra)."""
    return 2 * np.pi * np.cumsum(f) / SR


def _norm(x, pico=0.9):
    m = np.abs(x).max()
    return x * (pico / m) if m > 0 else x


def _ruido(rng, d): return rng.standard_normal(_n(d))


def _en(x, t0, n):
    """x colocado a partir de t0 segundos dentro de un array de n muestras."""
    out = np.zeros(n); i = int(t0 * SR)
    if i < n: out[i:i + len(x)] = x[:n - i]
    return out


def _mono(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


# ------------------------------------------------------------------ sintetizadores (devuelven mono o estereo [n,2])
def motor(rng, dur=4.0, modo='paso', **_):
    """4 cilindros: explosiones a 2 por vuelta (rpm/30 Hz) con armonicos, ruido de admision y escape."""
    t = _t(dur); n = len(t); u = t / dur
    if modo == 'arranque':                                         # motor de arranque (chug) -> acelerón -> ralenti
        rpm = np.where(t < 0.7, 250.0, np.where(t < 1.1, 250 + (t - 0.7) / 0.4 * 2750, 900 + 2100 * np.exp(-(t - 1.1) / 0.4)))
    elif modo == 'ralenti':
        rpm = 850 + 25 * np.sin(2 * np.pi * 0.7 * t)
    elif modo == 'interior':                                       # dentro del coche en marcha: grave y constante
        rpm = 1900 + 120 * np.sin(2 * np.pi * 0.15 * t)
    else:                                                          # paso: se acerca, pasa y se aleja
        rpm = np.full(n, 2600.0)
    f0 = rpm / 30.0
    if modo == 'paso':                                             # doppler (~45 km/h)
        f0 = f0 * (1.06 - 0.12 / (1 + np.exp(-(u - 0.5) * 14)))
    ph = _fase(f0); x = np.zeros(n)
    for k, a in ((1, 1.0), (2, 0.7), (3, 0.45), (4, 0.3), (6, 0.18), (8, 0.1)):
        x += a * np.sin(k * ph + rng.uniform(0, 6.28))
    puls = 0.5 + 0.5 * np.sin(ph) ** 8                             # golpes de cada explosion
    x = x * (0.6 + 0.4 * puls) + 0.35 * _lp(_ruido(rng, dur), 900) * puls
    x = _lp(x, 1800 if modo != 'interior' else 500)
    if modo == 'paso':
        x = x * np.exp(-((u - 0.5) / 0.22) ** 2) * 0.9 + x * 0.1 * np.exp(-((u - 0.5) / 0.5) ** 2)
        pan = np.tanh((u - 0.5) * 5) * 0.85
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        return np.stack([_norm(x) * l, _norm(x) * r], 1) * _env(n, 0.05, 0.3)[:, None]
    return _norm(x) * _env(n, 0.15 if modo != 'arranque' else 0.01, 0.5)


def claxon(rng, dur=1.5, **_):
    """Bocina de coche: dos tonos disonantes (~420 y ~525 Hz) muy ricos en armonicos, con formante metalico."""
    t = _t(dur); n = len(t); x = np.zeros(n)
    for f in (420.0, 525.0):
        ph = _fase(f * (1 + 0.003 * np.sin(2 * np.pi * 6 * t)))
        x += np.sign(np.sin(ph)) * 0.6 + np.sin(2 * ph) * 0.2      # casi cuadrada
    x = _bp(x, 350, 4500) + 0.6 * _bp(x, 1800, 3200)
    return _norm(np.tanh(x * 1.5)) * _env(n, 0.012, 0.06)


def frenazo(rng, dur=1.4, **_):
    """Chirrido de neumaticos: tono inestable ~1 kHz + banda de ruido alta."""
    t = _t(dur); n = len(t)
    f = 950 + 140 * np.sin(2 * np.pi * 3.1 * t) + 60 * np.cumsum(rng.standard_normal(n)) / np.sqrt(SR) * 4
    x = np.sin(_fase(f)) + 0.5 * np.sin(_fase(f * 2.01)) + 0.8 * _bp(_ruido(rng, dur), 1800, 4200)
    return _norm(x) * _env(n, 0.03, 0.4) * np.linspace(1, 0.6, n)


def click(rng, dur=0.05, **_):
    t = _t(dur); x = _bp(_ruido(rng, dur), 1500, 6000) * np.exp(-t / 0.004) + 0.6 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.006)
    return _norm(x)


def intermitente(rng, dur=3.0, **_):
    """Rele de los intermitentes / warnings: tic (encender) y tac (apagar) a ~1,5 Hz."""
    x = np.zeros(_n(dur)); per = 1 / 1.5
    for k in range(int(dur / per) + 1):
        for dt, f, g in ((0.0, 1.0, 1.0), (per / 2, 0.75, 0.7)):
            c = click(rng, 0.04); c = _lp(c, 4000 * f) * g; i = int((k * per + dt) * SR)
            if i < len(x): x[i:i + len(c)] += c[:len(x) - i]
    return _norm(x, 0.8)


def seguros(rng, dur=0.35, **_):
    """Cierre centralizado: golpe sordo corto + click mecanico."""
    t = _t(dur)
    golpe_ = np.sin(2 * np.pi * (110 + 80 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.05)
    x = golpe_ + 0.5 * _en(click(rng, 0.05), 0.02, len(t))
    return _norm(x)


def puerta(rng, dur=0.6, **_):
    """Puerta de coche que se cierra: golpe grave con cuerpo + pestillo."""
    t = _t(dur)
    cuerpo = _lp(_ruido(rng, dur), 260) * np.exp(-t / 0.09) * 3 + np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.12)
    pest = _en(click(rng, 0.05), 0.015, len(t)) * 0.4
    return _norm(cuerpo + pest)


def pasos(rng, dur=3.0, ritmo=1.9, **_):
    """Pasos sobre acera: golpe de talon + roce, alternando un poco el paneo."""
    out = np.zeros((_n(dur), 2)); per = 1 / ritmo
    for k in range(int(dur / per)):
        d = 0.18; t = _t(d)
        p = _lp(_ruido(rng, d), 900) * np.exp(-t / 0.03) * 2 + _bp(_ruido(rng, d), 2000, 6000) * np.exp(-t / 0.05) * 0.25
        p = _norm(p) * rng.uniform(0.75, 1.0); i = int((k * per + rng.uniform(-0.015, 0.015)) * SR)
        s = _mono(p, -0.12 if k % 2 else 0.12); i = max(0, i)
        if i < len(out): out[i:i + len(s)] += s[:len(out) - i]
    return out


def golpe(rng, dur=1.8, **_):
    """Choque de coches: boom grave + chapa (parciales inarmonicos) + cristales."""
    t = _t(dur)
    boom = np.sin(2 * np.pi * (45 + 60 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.25)
    chapa = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / dt) * a
                for f, dt, a in ((523, .35, .5), (811, .28, .4), (1297, .2, .35), (1913, .15, .3), (2671, .12, .25)))
    ruido = _bp(_ruido(rng, dur), 300, 8000) * np.exp(-t / 0.18)
    cristal = _hp(_ruido(rng, dur), 5000) * (np.exp(-np.maximum(t - 0.08, 0) / 0.3) * (t > 0.08)) * 0.4
    return _norm(boom * 1.2 + chapa * 0.6 + ruido * 0.8 + cristal)


def mar(rng, dur=8.0, **_):
    """Olas: ruido rosa filtrado con oleadas cada ~5-7 s (estereo decorrelado)."""
    t = _t(dur); out = []
    for lado in range(2):
        r = _ruido(rng, dur); rosa = lfilter([0.05, -0.04], [1, -0.97], r)
        ola = sum(np.clip(np.sin(2 * np.pi * (t / per) + ph), 0, 1) ** 2 for per, ph in ((6.3, 0.0 + lado * .4), (5.1, 2.1)))
        m = np.clip(ola / 2, 0, 1)                                   # rompiente: mas agudos en la cresta
        out.append((_lp(rosa, 600) * (1 - m) + _lp(rosa, 2100) * m) * (0.25 + ola))
    x = np.stack(out, 1); return _norm(x) * _env(len(t), 1.0, 1.5)[:, None]


def viento(rng, dur=6.0, **_):
    t = _t(dur); out = []
    for lado in range(2):
        r = _ruido(rng, dur); mod = 0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t + lado) * np.sin(2 * np.pi * 0.05 * t + 1)
        out.append(_bp(r, 250, 900) * (0.3 + mod) + 0.3 * _bp(r, 900, 1600) * mod ** 2)
    return _norm(np.stack(out, 1)) * _env(len(t), 1.0, 1.5)[:, None]


def lluvia(rng, dur=6.0, **_):
    out = []
    for _l in range(2):
        r = _ruido(rng, dur); gotas = (rng.random(len(r)) > 0.9985) * rng.standard_normal(len(r)) * 6
        out.append(_bp(r, 800, 7000) * 0.5 + _bp(gotas, 1500, 6000))
    return _norm(np.stack(out, 1)) * _env(_n(dur), 0.8, 1.2)[:, None]


def sirena(rng, dur=4.0, **_):
    """Sirena de dos tonos (emergencias), alternando cada 0,5 s, con algo de distancia."""
    t = _t(dur); f = np.where((t // 0.5) % 2 == 0, 650.0, 870.0); f = _lp(f, 40, 1)
    x = np.sign(np.sin(_fase(f))) * 0.5 + np.sin(_fase(f)) * 0.5
    return _norm(_bp(x, 400, 3500)) * _env(len(t), 0.3, 0.6)


def latido(rng, dur=4.0, lpm=72, **_):
    out = np.zeros(_n(dur)); per = 60 / lpm
    for k in range(int(dur / per) + 1):
        for dt, g in ((0, 1.0), (0.28, 0.7)):
            d = 0.25; t = _t(d); s = np.sin(2 * np.pi * (55 + 30 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.06) * g
            i = int((k * per + dt) * SR)
            if i < len(out): out[i:i + len(s)] += s[:len(out) - i]
    return _norm(out)


def tono_llamada(rng, dur=4.5, **_):
    """Tono de llamada (425 Hz; 1,5 s sonando y 3 s de silencio) como se oye en un manos libres."""
    t = _t(dur); x = np.sin(2 * np.pi * 425 * t) * ((t % 4.5) < 1.5)
    x = _bp(x + 0.1 * np.sin(2 * np.pi * 850 * t) * ((t % 4.5) < 1.5), 300, 3400)
    return _norm(x) * _env(len(t), 0.01, 0.05)


def _tintineo(rng, dur, parciales, golpe_ruido=0.5):
    t = _t(dur)
    x = sum(np.sin(2 * np.pi * f * (1 + rng.uniform(-0.002, 0.002)) * t + rng.uniform(0, 6)) * np.exp(-t / dt) * a for f, dt, a in parciales)
    x = x + golpe_ruido * _bp(_ruido(rng, dur), 2000, 7500) * np.exp(-t / 0.003)
    return _norm(x)


def taza(rng, dur=0.9, **_):
    """Taza de ceramica que se apoya sobre un plato: golpe seco + tintineo corto."""
    t = _t(dur); x = _tintineo(rng, dur, ((1180, .16, .7), (2330, .11, .5), (3790, .07, .35)), 0.7)
    toc = np.sin(2 * np.pi * (240 + 100 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.03) * 0.6
    return _norm(x + toc)


def copa(rng, dur=1.6, **_):
    """Copa de cristal que se toca: tintineo largo y agudo."""
    return _tintineo(rng, dur, ((2650, .9, .6), (4010, .6, .45), (5420, .35, .3), (6900, .2, .2)), 0.3)


def despertador(rng, dur=1.6, **_):
    """Despertador de campanillas: timbre metalico a rafagas de ~16 Hz."""
    t = _t(dur); puerta = 0.5 * (1 + np.tanh(6 * np.sin(2 * np.pi * 16 * t)))
    x = (np.sin(2 * np.pi * 2100 * t) + 0.6 * np.sin(2 * np.pi * 3170 * t) + 0.3 * np.sin(2 * np.pi * 4410 * t)) * puerta
    return _norm(x) * _env(len(t), 0.02, 0.15, sostener=max(0.1, dur - 0.2))


def vibracion(rng, dur=1.4, **_):
    """Movil vibrando (motor de masa excentrica): zumbido grave ~175 Hz con armonicos y traqueteo de la carcasa,
    en dos rafagas (brr-brr) con arranque y parada suaves; suena amortiguado, como contra la tela o una mesa."""
    t = _t(dur); n = len(t)
    f = 175 + 6 * np.sin(2 * np.pi * 3.1 * t) + 10 * np.exp(-t * 14)          # arranca algo mas agudo y se asienta
    ph = _fase(f)
    x = np.sin(ph) + 0.55 * np.sin(2 * ph + 0.4) + 0.3 * np.sin(3 * ph + 1.1) + 0.12 * np.sin(5 * ph)
    x *= 1 + 0.25 * np.sin(2 * np.pi * 29 * t)                                  # temblor de la masa
    traq = _bp(_ruido(rng, dur), 900, 3200) * (0.5 + 0.5 * np.sin(2 * np.pi * 175 * t) ** 2) * 0.35   # traqueteo en cada vuelta
    x = _lp(x + traq, 2600)
    ciclo = 0.58 * dur / 1.4; on = 0.40 * dur / 1.4                              # rafaga 1 y 2: brr (on) .. silencio .. brr
    puerta = np.zeros(n)
    for i in range(2):
        a = int((0.04 + i * ciclo) * SR); b = min(n, a + int(on * SR))
        if a < n:
            k = b - a; r = min(k // 4, int(0.03 * SR)); g = np.ones(k); g[:r] = np.linspace(0, 1, r); g[-r:] = np.linspace(1, 0, r)
            puerta[a:b] = g
    return _norm(x * puerta)


def respiracion(rng, dur=3.0, **_):
    """Respiracion de una persona tumbada: inhalacion corta y exhalacion larga (ruido de aire filtrado, ~4 s por ciclo),
    suave y cercana; el timbre se abre un poco en la inhalacion y se cierra al soltar el aire."""
    t = _t(dur); n = len(t); ciclo = 3.6; ti = 1.3                       # 1,3 s inhala + 2,3 s exhala
    fase = (t % ciclo)
    env = np.where(fase < ti, np.sin(np.pi / 2 * fase / ti) ** 2, np.cos(np.pi / 2 * (fase - ti) / (ciclo - ti)) ** 2.2)
    aire = _ruido(rng, dur)
    x = _bp(aire, 250, 1700) * 0.8 + _bp(aire, 1700, 4200) * 0.25 * np.where(fase < ti, 1.0, 0.45)
    return _norm(x * env) * _env(n, 0.08, 0.35)


TIPOS = {   # nombre: (funcion, duracion por defecto, dB respecto a la voz por defecto)
    'motor': (motor, 4.0, -12), 'claxon': (claxon, 1.5, -6), 'frenazo': (frenazo, 1.4, -9), 'intermitente': (intermitente, 3.0, -14),
    'seguros': (seguros, 0.35, -10), 'puerta': (puerta, 0.6, -9), 'pasos': (pasos, 3.0, -14), 'golpe': (golpe, 1.8, -6),
    'mar': (mar, 8.0, -18), 'viento': (viento, 6.0, -20), 'lluvia': (lluvia, 6.0, -20), 'sirena': (sirena, 4.0, -12),
    'latido': (latido, 4.0, -10), 'tono_llamada': (tono_llamada, 4.5, -14), 'click': (click, 0.05, -12),
    'taza': (taza, 0.9, -12), 'copa': (copa, 1.6, -13), 'despertador': (despertador, 1.6, -14),
    'vibracion': (vibracion, 1.4, -11), 'respiracion': (respiracion, 3.0, -13)}


def sintetizar(tipo, rng, dur=None, **op):
    if tipo not in TIPOS: raise SystemExit(f'Efecto desconocido: {tipo}. Hay: {", ".join(TIPOS)}')
    f, d0, _ = TIPOS[tipo]
    x = np.asarray(f(rng, dur=float(dur or d0), **op), np.float64)
    if x.ndim == 1: x = _mono(x, float(op.get('pan', 0)))
    elif op.get('pan'): x = x * np.array([1 - max(0, op['pan']), 1 + min(0, op['pan'])])
    return x


# ------------------------------------------------------------------ colocacion en la linea de tiempo
def _norm_palabra(w):
    w = unicodedata.normalize('NFD', w.lower()); w = ''.join(c for c in w if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9ñ]', '', w)


def instante(ef, palabras):
    if 'palabra' in ef:
        objetivo = _norm_palabra(ef['palabra']); n = int(ef.get('ocurrencia', 1))
        hits = [w['ini'] for w in palabras if _norm_palabra(w['t']) == objetivo]
        if len(hits) < n:
            raise SystemExit(f'Efecto {ef.get("tipo")}: la palabra «{ef["palabra"]}» aparece {len(hits)} veces en la locucion (pedida la {n}.ª)')
        t = hits[n - 1]
    elif 't' in ef: t = float(ef['t'])
    else: raise SystemExit(f'Efecto {ef.get("tipo")}: falta "palabra" o "t"')
    return max(0.0, t + float(ef.get('desfase', 0)))


def nivel_voz(voz):
    """RMS de la voz solo en los tramos con habla (ventanas de 50 ms por encima de -40 dB del pico)."""
    v = voz if voz.ndim == 1 else voz.mean(1); w = int(0.05 * SR); k = len(v) // w
    if k == 0: return 0.1
    r = np.sqrt((v[:k * w].reshape(k, w) ** 2).mean(1)); umbral = r.max() * 0.01
    return float(np.sqrt((r[r > umbral] ** 2).mean())) if (r > umbral).any() else 0.1


def pista(efectos, palabras, duracion, ref_rms, semilla=1):
    """Pista estereo de efectos con cada uno a su nivel relativo a la voz. Devuelve (audio [n,2], informe)."""
    n = _n(duracion); out = np.zeros((n, 2)); informe = []
    for k, ef in enumerate(efectos):
        rng = np.random.default_rng(semilla * 1000 + k)
        op = {c: v for c, v in ef.items() if c not in ('tipo', 'palabra', 't', 'ocurrencia', 'desfase', 'vol', 'dur')}
        x = sintetizar(ef['tipo'], rng, ef.get('dur'), **op)
        rms = np.sqrt((x ** 2).mean()) or 1.0
        vol = float(ef.get('vol', TIPOS[ef['tipo']][2]))
        x = x * (ref_rms * 10 ** (vol / 20) / rms)
        t0 = instante(ef, palabras); i = int(t0 * SR)
        if i < n: out[i:i + len(x)] += x[:n - i]
        informe.append(f'{ef["tipo"]} en {t0:.2f} s ({len(x) / SR:.1f} s, {vol:+.0f} dB vs voz)')
    pico = np.abs(out).max()
    if pico > 0.98: out *= 0.98 / pico
    return out.astype(np.float32), informe


def guardar(st, ruta):
    from scipy.io import wavfile
    wavfile.write(ruta, SR, (np.clip(st, -1, 1) * 32767).astype('<i2'))


def demo(ruta):
    """Todos los efectos seguidos, con 0,6 s de silencio entre ellos, para escucharlos."""
    rng = np.random.default_rng(1); trozos = []
    for nombre, (_, d0, _) in TIPOS.items():
        modos = ('paso', 'arranque', 'ralenti', 'interior') if nombre == 'motor' else (None,)
        for m in modos:
            x = sintetizar(nombre, rng, **({'modo': m} if m else {})); trozos += [_norm(x, 0.7), np.zeros((int(0.6 * SR), 2))]
            print(f'{nombre}{" (" + m + ")" if m else ""}: {len(x) / SR:.1f} s')
    guardar(np.concatenate(trozos), ruta)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--demo', metavar='SALIDA.wav', help='escribe todos los efectos seguidos para oirlos')
    ap.add_argument('--tipo', help='escribe un solo efecto'); ap.add_argument('--dur', type=float); ap.add_argument('--modo')
    ap.add_argument('salida', nargs='?')
    a = ap.parse_args()
    if a.demo: demo(a.demo)
    elif a.tipo and a.salida:
        guardar(_norm(sintetizar(a.tipo, np.random.default_rng(1), a.dur, **({'modo': a.modo} if a.modo else {})), 0.8), a.salida)
    else: ap.print_help()
