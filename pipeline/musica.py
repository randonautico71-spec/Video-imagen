#!/usr/bin/env python3
"""MUSICA ORIGINAL por sintesis (numpy/scipy). Sin ficheros externos, sin copyright.

Tres estilos, cada uno con su propia armonia, instrumentacion y ritmo:
  meditacion : onirica. Pads lentos, cuencos tibetanos, destellos agudos, oleaje suave, mucha reverb. Sin pulso.
  curiosos   : misterio/curiosidad. Marimba pentatonica menor, bajo grave, tic-tac sutil, risers y booms en cortes.
  aprender   : jugueton. Xilofono pentatonico mayor, bajo pizzicato saltarin, campanitas, fanfarria en aciertos.

Entrada: cues.json  {"duracion": s, "escenas": [{"ini": s}...], "dings": [s...], "semilla": n}
Salida : wav estereo 44,1 kHz. Determinista: misma semilla, mismo audio."""
import argparse, json, sys
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter, oaconvolve

SR = 44100
MIDI = lambda n: 440.0 * 2 ** ((n - 69) / 12)
PENT_MENOR = [0, 3, 5, 7, 10]
PENT_MAYOR = [0, 2, 4, 7, 9]


class Bus:
    """Un canal estereo de float32 con utilidades para sumar eventos."""
    def __init__(self, n):
        self.L = np.zeros(n, np.float32); self.R = np.zeros(n, np.float32); self.n = n

    def poner(self, x, t, pan=0.0, ganancia=1.0):
        i = int(t * SR)
        if i >= self.n or i + len(x) <= 0:
            return
        a, b = max(0, -i), min(len(x), self.n - i)
        x = x[a:b] * ganancia
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i + a:i + b] += x * l; self.R[i + a:i + b] += x * r


def env_ad(n, ataque, caida):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / caida)
    return e.astype(np.float32)


def tono(f, dur, armonicos=((1, 1.0),), ataque=0.005, caida=0.4, vib=0):
    n = int(dur * SR); t = np.arange(n) / SR
    fase = 2 * np.pi * f * t
    if vib:
        fase += vib * np.sin(2 * np.pi * 5 * t)
    y = sum(a * np.sin(h * fase) for h, a in armonicos)
    return (y * env_ad(n, ataque, caida)).astype(np.float32)


def ruido_filtrado(dur, f1, f2, rng):
    n = int(dur * SR)
    b, a = butter(2, [f1 / (SR / 2), f2 / (SR / 2)], 'band')
    return lfilter(b, a, rng.standard_normal(n)).astype(np.float32)


def reverb(bus, seg, mezcla, rng):
    """Reverb por convolucion por bloques (oaconvolve): vale para audio de 1 hora."""
    n = int(SR * seg); t = np.arange(n) / SR
    for canal in ('L', 'R'):
        ir = rng.standard_normal(n) * np.exp(-t * (6.9 / seg))
        ir[: int(.02 * SR)] *= np.linspace(0, 1, int(.02 * SR)); ir /= np.sqrt((ir ** 2).sum())
        x = getattr(bus, canal)
        wet = oaconvolve(x, ir.astype(np.float32))[: len(x)]
        setattr(bus, canal, ((1 - mezcla) * x + mezcla * wet * 1.4).astype(np.float32))


# ------------------------------------------------------------------ estilos
def estilo_meditacion(c, rng):
    D = c['duracion']; pad = Bus(int((D + 8) * SR)); luz = Bus(pad.n); mar = Bus(pad.n)
    raiz0 = 50                                                    # re3, modo lidio (luminoso y flotante)
    progresion = [[0, 7, 14, 16, 21], [5, 12, 16, 19, 23], [9, 16, 19, 23, 26], [7, 14, 19, 21, 26]]
    t, k = 0.0, 0
    while t < D + 6:                                              # acordes de ~16 s que se solapan
        acorde = progresion[k % 4] if k < 8 else progresion[int(rng.integers(4))]
        for st in acorde:
            f = MIDI(raiz0 + st - 12 * (st > 20))
            for det in (-0.07, 0.0, 0.09):                        # 3 voces desafinadas: coro lento
                dur = 21.0
                tt = np.arange(int(dur * SR)) / SR
                y = np.sin(2 * np.pi * f * (1 + det * .01) * tt) + .35 * np.sin(4 * np.pi * f * tt)
                env = np.minimum(np.minimum(1, tt / 6.0), np.minimum(1, (dur - tt) / 6.0))
                pad.poner((y * env * .035).astype(np.float32), t, pan=float(rng.uniform(-.7, .7)))
        t += 16.0; k += 1
    f0 = MIDI(raiz0 - 12)                                         # drone grave continuo
    tt = np.arange(pad.n) / SR
    drone = (np.sin(2 * np.pi * f0 * tt) * (.55 + .45 * np.sin(2 * np.pi * tt / 23.0))).astype(np.float32) * .05
    pad.L += drone; pad.R += drone
    t = 4.0
    while t < D:                                                  # cuencos tibetanos
        f = MIDI(raiz0 + 12 + int(rng.choice([0, 7, 14, 16, 21])))
        y = sum(a * tono(f * r, 12, ((1, 1.0),), .01, d) for r, a, d in
                [(1, 1.0, 5.5), (2.76, .5, 3.5), (5.4, .25, 2.2), (8.93, .12, 1.4)]) * .16
        pad.poner(y, t, pan=float(rng.uniform(-.5, .5))); t += float(rng.uniform(17, 27))
    t = 6.0
    while t < D:                                                  # destellos agudos
        f = MIDI(raiz0 + 24 + int(rng.choice(PENT_MAYOR)))
        luz.poner(tono(f, 5, ((1, 1.0), (2, .15)), .04, 1.6) * .05, t, pan=float(rng.uniform(-.9, .9)))
        t += float(rng.uniform(3.5, 9))
    # oleaje: ruido filtrado con marea lenta (~11 s por ciclo)
    ru = ruido_filtrado(D + 8, 180, 1800, rng)
    marea = (.25 + .75 * (.5 + .5 * np.sin(2 * np.pi * np.arange(len(ru)) / SR / 11.0 - 1.2))) ** 2
    mar.L[:len(ru)] += ru * marea.astype(np.float32) * .05
    mar.R[:len(ru)] += np.roll(ru, 3000) * marea.astype(np.float32) * .05
    for b in (pad, luz): reverb(b, 3.4, .55, rng)
    return [pad, luz, mar]


def corte_meditacion(buses, t, rng):                              # campanilla suave, sin boom ni riser
    f = MIDI(74 + int(rng.choice([0, 2, 7])))
    buses[1].poner(tono(f, 6, ((1, 1.0), (3, .1)), .01, 2.0) * .09, t, pan=float(rng.uniform(-.4, .4)))


def estilo_curiosos(c, rng):
    D = c['duracion']; bajo = Bus(int((D + 6) * SR)); mar = Bus(bajo.n); tic = Bus(bajo.n)
    bpm = 104; beat = 60 / bpm; raiz = 57                                       # la menor
    tt = np.arange(bajo.n) / SR
    drone = np.sin(2 * np.pi * MIDI(raiz - 24) * tt) * .07 + np.sin(2 * np.pi * MIDI(raiz - 12) * tt) * .035
    bajo.L += (drone * (.7 + .3 * np.sin(2 * np.pi * tt / 9))).astype(np.float32); bajo.R += bajo.L
    seq = [int(rng.integers(5)) for _ in range(8)]
    t, i = 0.0, 0
    while t < D:
        if i % 32 == 0: seq = [int(rng.integers(5)) for _ in range(8)]       # frase nueva cada 4 compases
        if rng.random() < .72:
            g = seq[i % 8]; octava = 12 * int(rng.choice([0, 0, 1]))
            f = MIDI(raiz + 12 + PENT_MENOR[g] + octava)
            nota = tono(f, 1.2, ((1, 1.0), (4, .35), (10, .08)), .003, .22)
            mar.poner(nota * .12, t, pan=float(rng.uniform(-.6, .6)))
        if i % 2 == 0:                                                       # tic-tac sutil
            tic.poner(ruido_filtrado(.03, 3000, 9000, rng) * env_ad(int(.03 * SR), .001, .006) * .6, t, ganancia=.05)
        if i % 8 == 0:
            bajo.poner(tono(MIDI(raiz - 12 + [0, 0, -2, -5][int(rng.integers(4))]), 1.6, ((1, 1.0), (2, .3)), .01, .5) * .16, t)
        t += beat / 2; i += 1
    return [bajo, mar, tic]


def corte_curiosos(buses, t, rng):
    n = int(1.4 * SR); r = ruido_filtrado(1.4, 500, 7000, rng)[:n]
    sube = np.linspace(0, 1, n) ** 2.2
    buses[0].poner(r * sube.astype(np.float32) * .12, max(0, t - 1.4))        # riser que llega al corte
    tt = np.arange(int(1.6 * SR)) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 9)) * tt) * np.exp(-tt * 2.6)
    buses[0].poner(boom.astype(np.float32) * .55, t)


def estilo_aprender(c, rng):
    D = c['duracion']; bajo = Bus(int((D + 6) * SR)); mar = Bus(bajo.n); cam = Bus(bajo.n)
    bpm = 112; beat = 60 / bpm; raiz = 60                                      # do mayor
    prog = [0, 5, 7, 5]                                                         # I IV V IV
    t, i = 0.0, 0
    melodia = [int(rng.integers(5)) for _ in range(8)]
    while t < D:
        compas = (i // 8) % 4
        if i % 32 == 0: melodia = [int(rng.integers(5)) for _ in range(8)]
        if rng.random() < .8:
            f = MIDI(raiz + 12 + prog[compas] * 0 + PENT_MAYOR[melodia[i % 8]] + 12 * int(rng.choice([0, 0, 1])))
            mar.poner(tono(f, .6, ((1, 1.0), (3, .28), (6, .09)), .002, .13) * .13, t, pan=float(rng.uniform(-.5, .5)))
        if i % 4 == 0:                                                         # pizzicato saltarin
            f = MIDI(raiz - 12 + prog[compas] + (7 if (i // 4) % 2 else 0))
            bajo.poner(tono(f, .5, ((1, 1.0), (2, .22)), .004, .11) * .22, t)
        if i % 8 == 4 and rng.random() < .6:
            cam.poner(tono(MIDI(raiz + 36 + int(rng.choice(PENT_MAYOR))), 1.4, ((1, 1.0), (2.76, .2)), .002, .5) * .06, t + beat / 2,
                      pan=float(rng.uniform(-.8, .8)))
        t += beat / 2; i += 1
    return [bajo, mar, cam]


def corte_aprender(buses, t, rng):                                              # arpegio ascendente con campanitas
    for j, st in enumerate([0, 4, 7, 12]):
        buses[2].poner(tono(MIDI(72 + st), 1.0, ((1, 1.0), (2.76, .25), (5.4, .1)), .002, .3) * .11, t - .36 + j * .09, pan=-.3 + j * .2)


def ding(buses, t, mood, rng):
    if mood == 'meditacion':
        buses[1].poner(tono(MIDI(79), 4, ((1, 1.0), (2.76, .12)), .01, 1.6) * .09, t)
    elif mood == 'aprender':                                                    # ta-da
        for j, st in enumerate([0, 4, 7, 12, 16]):
            buses[2].poner(tono(MIDI(72 + st), 1.2, ((1, 1.0), (2, .3), (3, .15)), .003, .4) * .13, t + j * .07, pan=-.5 + j * .25)
    else:
        buses[1].poner(tono(MIDI(93), 1.8, ((1, 1.0), (2.01, .25), (3.02, .1)), .002, .55) * .14, t)


ESTILOS = {'meditacion': (estilo_meditacion, corte_meditacion, -24),
           'curiosos': (estilo_curiosos, corte_curiosos, -21),
           'aprender': (estilo_aprender, corte_aprender, -21)}


def componer(cues, mood):
    if mood not in ESTILOS:
        raise SystemExit(f'Estilo musical desconocido: {mood}. Hay: {list(ESTILOS)}')
    rng = np.random.default_rng(int(cues.get('semilla', 1234)))
    estilo, corte, nivel_db = ESTILOS[mood]
    buses = estilo(cues, rng)
    for e in cues.get('escenas', [])[1:]:
        corte(buses, float(e['ini']), rng)
    for d in cues.get('dings', []):
        ding(buses, float(d), mood, rng)
    n = int((cues['duracion'] + (4 if mood == 'meditacion' else 1.5)) * SR)
    L = sum(b.L[:n] for b in buses); R = sum(b.R[:n] for b in buses)
    fin = np.ones(n, np.float32)                                                # fundidos
    fin[: int(2 * SR)] = np.linspace(0, 1, int(2 * SR)); fin[-int(3.5 * SR):] *= np.linspace(1, 0, int(3.5 * SR))
    st = np.stack([L * fin, R * fin], 1)
    rms = np.sqrt(np.mean(st[:: 8] ** 2) + 1e-12)
    st *= (10 ** (nivel_db / 20)) / rms
    pico = np.abs(st).max()
    if pico > .95: st *= .95 / pico
    return st.astype(np.float32)


def guardar(st, ruta):
    from scipy.io import wavfile
    wavfile.write(ruta, SR, (np.clip(st, -1, 1) * 32767).astype('<i2'))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cues'); ap.add_argument('salida'); ap.add_argument('--estilo', required=True, choices=list(ESTILOS))
    a = ap.parse_args()
    cues = json.loads(Path(a.cues).read_text())
    audio = componer(cues, a.estilo)
    guardar(audio, a.salida)
    print(f'{a.salida}: {len(audio) / SR:.1f} s, estilo {a.estilo}')
