#!/usr/bin/env python3
"""MUSICA ORIGINAL por sintesis (numpy/scipy). Sin ficheros externos, sin copyright.

Tres estilos, cada uno con su propia armonia, instrumentacion y ritmo:
  meditacion : onirica. Pads lentos, cuencos tibetanos, destellos agudos, oleaje suave, mucha reverb. Sin pulso.
  curiosos   : misterio/curiosidad. Marimba pentatonica menor, bajo grave, tic-tac sutil, risers y booms en cortes.
  mistico    : PARA DORMIR. Coro lento, bordon con quinta, campanas de cristal con un motivo, cuencos graves, aire. Sin pulso.
  intriga    : tension y golpes tipo crash (riser + bombo + platillo) en cambios de capitulo y palabras clave; a peticion del usuario.
  natural    : PARA DORMIR. Cuerdas calidas, arpa espaciada, flauta suave, viento, arroyo lejano. Sin pulso.
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


# ------------------------------------------------------------------ estilos PARA DORMIR (suaves, sin pulso, sin golpes ni subidas bruscas, registro medio-grave)
def paso_bajo(x, fc, orden=2):
    b, a = butter(orden, fc / (SR / 2), 'low'); return lfilter(b, a, x).astype(np.float32)


def voz_coro(f, dur, ataque, detunes=(-0.08, 0.0, 0.1)):
    """Pad tipo coro 'aah': armonicos 1..14 con dos picos de formante (~700 y ~1150 Hz); suena humano y calido, sin filo."""
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for det in detunes:
        for h in range(1, 15):
            fh = f * h
            a = np.exp(-((fh - 700) / 380) ** 2) + .6 * np.exp(-((fh - 1150) / 420) ** 2) + .05
            y += (a / h ** .6) * np.sin(2 * np.pi * fh * (1 + det * .01) * t)
    env = np.minimum(np.minimum(1, t / ataque), np.minimum(1, (dur - t) / ataque))
    return (y * env ** 1.5 / 14).astype(np.float32)


def estilo_mistico(c, rng):
    """Mistico: re dorico/eolico, coro lento, bordon con quinta, campanas de cristal que repiten un motivo, cuencos graves y respiracion de aire."""
    D = c['duracion']; pad = Bus(int((D + 10) * SR)); mel = Bus(pad.n); aire = Bus(pad.n)
    prog = [[50, 57, 62, 64, 65], [46, 53, 57, 62, 69], [43, 50, 55, 58, 62], [45, 52, 57, 59, 64]]
    t, k = 0.0, 0
    while t < D + 8:                                              # coro: un acorde cada 18 s, solapados
        for nota in prog[k % 4]:
            pad.poner(voz_coro(MIDI(nota), 36.0, 11.0) * .06, t, pan=float(rng.uniform(-.8, .8)))
        t += 18.0; k += 1
    tt = np.arange(pad.n) / SR                                     # bordon: re2 + la2 + re3, respirando muy lento
    bordon = sum(a * np.sin(2 * np.pi * MIDI(m) * tt) for m, a in ((38, .6), (45, .35), (50, .2)))
    bordon = (bordon * (.75 + .25 * np.sin(2 * np.pi * tt / 29.0))).astype(np.float32) * .085
    pad.L += bordon; pad.R += bordon
    motivo = [0, 2, 3, 7, 5, 3, 2, 0]                              # re-mi-fa-la-sol-fa-mi-re (grados de re dorico en semitonos desde re4)
    t, i = 7.0, 0
    while t < D:                                                   # frases de 3-5 notas largas con el mismo motivo, variando el punto de inicio
        ini = int(rng.integers(0, 4)); n = int(rng.integers(3, 6))
        for j in range(n):
            f = MIDI(62 + motivo[(ini + j) % 8] + 12 * int(j == n - 1 and rng.random() < .3))
            y = sum(a * tono(f * r, 9, ((1, 1.0),), .06, d) for r, a, d in ((1, 1.0, 4.2), (2.0, .25, 2.4), (3.01, .08, 1.2)))
            mel.poner(y * .05, t + j * 3.4, pan=float(rng.uniform(-.6, .6)))
        t += n * 3.4 + float(rng.uniform(9, 17))
    t = 3.0
    while t < D:                                                   # cuencos graves
        f = MIDI(50 + int(rng.choice([0, 7, 12])))
        y = sum(a * tono(f * r, 14, ((1, 1.0),), .02, d) for r, a, d in ((1, 1.0, 7.0), (2.76, .35, 3.5), (5.4, .12, 2.0))) * .07
        pad.poner(y, t, pan=float(rng.uniform(-.4, .4))); t += float(rng.uniform(22, 34))
    ru = ruido_filtrado(D + 10, 300, 1400, rng)                    # aire: respiracion lenta (~14 s)
    resp = (.15 + .85 * (.5 + .5 * np.sin(2 * np.pi * np.arange(len(ru)) / SR / 14.0))) ** 2
    aire.L[:len(ru)] += ru * resp.astype(np.float32) * .034
    aire.R[:len(ru)] += np.roll(ru, 4100) * resp.astype(np.float32) * .034
    for b in (pad, mel): reverb(b, 5.5, .62, rng)
    for b in (pad, mel, aire):
        b.L = paso_bajo(b.L, 5200); b.R = paso_bajo(b.R, 5200)
    return [pad, mel, aire]


def corte_mistico(buses, t, rng):                                  # cambio de capitulo: cuenco grave que aparece despacio
    f = MIDI(50 + int(rng.choice([0, 7])))
    buses[0].poner(sum(a * tono(f * r, 16, ((1, 1.0),), 3.0, d) for r, a, d in ((1, 1.0, 7.0), (2.76, .2, 3.0))) * .045, t, pan=float(rng.uniform(-.3, .3)))


def estilo_natural(c, rng):
    """Natural: sol mayor/mi menor, cuerdas calidas, arpegios de arpa muy espaciados, flauta suave, viento, arroyo lejano y grillos lejanos muy bajos."""
    D = c['duracion']; pad = Bus(int((D + 10) * SR)); arp = Bus(pad.n); nat = Bus(pad.n)
    prog = [([43, 50, 55, 59, 62], [0, 2, 4, 7, 9]), ([40, 47, 52, 55, 59], [0, 2, 4, 7, 9]), ([48, 55, 60, 64, 67], [0, 2, 4, 7, 9]), ([50, 57, 62, 66, 69], [0, 2, 4, 7, 9])]
    t, k = 0.0, 0
    while t < D + 8:                                               # cuerdas calidas: seno + armonicos suaves, acorde cada 16 s
        for nota in prog[k % 4][0]:
            for det in (-0.06, 0.0, 0.08):
                tt = np.arange(int(22 * SR)) / SR; f = MIDI(nota)
                y = np.sin(2 * np.pi * f * (1 + det * .01) * tt) + .4 * np.sin(4 * np.pi * f * tt) + .15 * np.sin(6 * np.pi * f * tt)
                env = np.minimum(np.minimum(1, tt / 5.0), np.minimum(1, (22 - tt) / 5.0))
                pad.poner((y * env * .03).astype(np.float32), t, pan=float(rng.uniform(-.7, .7)))
        t += 16.0; k += 1
    t, k = 2.0, 0
    while t < D:                                                   # arpa: un arpegio lento por acorde, a veces se calla un compas
        cuerdas = prog[int(t // 16) % 4][0]
        if rng.random() < .8:
            n = int(rng.integers(4, 7)); orden = list(rng.permutation(len(cuerdas)))[:n]
            for j, g in enumerate(orden):
                f = MIDI(cuerdas[g] + 12 * int(rng.choice([0, 1])))
                y = sum(a * tono(f * r, 7, ((1, 1.0),), .012, d) for r, a, d in ((1, 1.0, 3.2), (2, .45, 1.6), (3, .2, .8), (4, .08, .4)))
                arp.poner(y * .06, t + j * 1.5, pan=float(rng.uniform(-.7, .7)))
        t += float(rng.uniform(8, 13))
    t = 9.0
    while t < D:                                                   # flauta suave: nota larga con soplo, sol-la-si-re
        f = MIDI(67 + int(rng.choice([0, 2, 4, 7, 9]))); dur = float(rng.uniform(4, 6))
        sop = ruido_filtrado(dur, 1200, 2600, rng) * .02 * env_ad(int(dur * SR), 1.2, 3.0)
        y = (tono(f, dur, ((1, 1.0), (2, .12)), 1.0, 2.8, vib=0.9) * .07 + sop)
        arp.poner(y.astype(np.float32), t, pan=float(rng.uniform(-.5, .5))); t += float(rng.uniform(14, 24))
    nn = int((D + 10) * SR)                                        # viento
    ru = ruido_filtrado(D + 10, 80, 700, rng)
    viento = (.3 + .7 * (.5 + .5 * np.sin(2 * np.pi * np.arange(len(ru)) / SR / 19.0 - .8))) ** 2
    nat.L[:len(ru)] += ru * viento.astype(np.float32) * .07; nat.R[:len(ru)] += np.roll(ru, 2500) * viento.astype(np.float32) * .07
    ar = ruido_filtrado(D + 10, 900, 3200, rng)                    # arroyo lejano: ruido con modulacion rapida y poco profunda
    mod = 1 + .35 * np.sin(2 * np.pi * np.arange(len(ar)) / SR * 6.3) * np.sin(2 * np.pi * np.arange(len(ar)) / SR * 0.7)
    nat.L[:len(ar)] += ar * mod.astype(np.float32) * .018; nat.R[:len(ar)] += np.roll(ar, 1900) * mod.astype(np.float32) * .018
    gr = np.zeros(nn, np.float32); tg = np.arange(nn) / SR                 # grillos lejanos: portadora 3,6 kHz con pulsos suaves; nivel muy bajo y filtrada
    puls = np.clip(np.sin(2 * np.pi * tg * 4.2), 0, 1) ** 2 * (.5 + .5 * np.sin(2 * np.pi * tg / 23.0)) ** 2
    gr = (np.sin(2 * np.pi * 3600 * tg) * puls).astype(np.float32) * .004
    nat.L += gr; nat.R += np.roll(gr, 700)
    reverb(arp, 2.8, .38, rng); reverb(pad, 3.2, .4, rng)
    for b in (pad, arp, nat):
        b.L = paso_bajo(b.L, 6500); b.R = paso_bajo(b.R, 6500)
    return [pad, arp, nat]


def corte_natural(buses, t, rng):                                  # cambio de capitulo: un arpegio de arpa muy suave
    for j, st in enumerate([0, 4, 7, 12]):
        buses[1].poner(sum(a * tono(MIDI(67 + st) * r, 6, ((1, 1.0),), .02, d) for r, a, d in ((1, 1.0, 2.6), (2, .3, 1.2))) * .045, t + j * .5, pan=-.3 + j * .2)



# ------------------------------------------------------------------ estilo INTRIGA (tension + golpes tipo crash; a peticion expresa del usuario)
def golpe(buses, t, rng, fuerza=1.0, riser=True):
    """Impacto: riser invertido (ruido filtrado que sube), bombo profundo con caida de tono, ruido grave y platillo suave con cola. fuerza 0..1."""
    b = buses[2]
    if riser:
        d = 2.6; n = int(d * SR); ru = ruido_filtrado(d, 1500, 7000, rng) * (np.linspace(0, 1, n) ** 2.2).astype(np.float32)
        b.poner(ru * .05 * fuerza, t - d, pan=0.0)
    n = int(3.2 * SR); tt = np.arange(n) / SR
    f = 34 + 70 * np.exp(-tt * 7.0)                                   # caida de ~104 Hz a ~34 Hz
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.9)
    gol = ruido_filtrado(3.2, 40, 500, rng) * np.exp(-tt / 0.5)
    b.poner(((boom * .55 + gol * .5) * fuerza).astype(np.float32), t, pan=0.0)
    cr = ruido_filtrado(3.0, 2500, 7500, rng) * np.exp(-np.arange(int(3.0 * SR)) / SR / 0.9)
    b.poner((cr * .035 * fuerza).astype(np.float32), t, pan=float(rng.uniform(-.4, .4)))


def estilo_intriga(c, rng):
    """Intriga: re frigio (re-mi bemol-sol-la), bordon con segunda menor que bate, cuerdas de tension con glissando lento, notas graves sueltas, latido muy lento."""
    D = c['duracion']; pad = Bus(int((D + 12) * SR)); mel = Bus(pad.n); imp = Bus(pad.n)
    tt = np.arange(pad.n) / SR
    d1 = np.sin(2 * np.pi * MIDI(26) * tt) + np.sin(2 * np.pi * MIDI(26) * 1.0105 * tt)            # re1 con batido lento (segunda menor microtonal)
    d2 = np.sin(2 * np.pi * MIDI(33) * tt) * .6 + np.sin(2 * np.pi * MIDI(27) * tt) * .35 * (.5 + .5 * np.sin(2 * np.pi * tt / 37.0))   # la1 y mi bemol1 que va y viene
    bord = ((d1 + d2) * (.7 + .3 * np.sin(2 * np.pi * tt / 23.0))).astype(np.float32) * .06
    pad.L += bord; pad.R += bord
    t, k = 0.0, 0
    acordes = [[38, 45, 51, 53], [38, 44, 50, 55], [36, 43, 51, 56], [38, 45, 50, 54]]               # grupos tensos: 2as menores, tritonos
    while t < D + 8:                                                                                   # cuerdas oscuras con glissando de un semitono
        for nota in acordes[k % 4]:
            dur = 30.0; n = int(dur * SR); x = np.arange(n) / SR
            f = MIDI(nota) * (1 + (.0594 * np.clip((x - 8) / 12, 0, 1)) * int(rng.random() < .35))
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(4 * np.pi * np.cumsum(f) / SR) + .25 * np.sin(6 * np.pi * np.cumsum(f) / SR)
            env = np.minimum(np.minimum(1, x / 9.0), np.minimum(1, (dur - x) / 9.0))
            pad.poner((y * env * .028).astype(np.float32), t, pan=float(rng.uniform(-.8, .8)))
        t += 17.0; k += 1
    escala = [0, 1, 5, 7, 8]                                                                           # frigio: re, mib, sol, la, sib
    t = 5.0
    while t < D:                                                                                       # notas graves sueltas, de caida lenta
        f = MIDI(50 + int(rng.choice(escala)) - 12 * int(rng.random() < .4))
        y = sum(a * tono(f * r, 8, ((1, 1.0),), .03, d) for r, a, d in ((1, 1.0, 3.6), (2, .4, 1.8), (3, .15, .9)))
        mel.poner(y * .075, t, pan=float(rng.uniform(-.5, .5))); t += float(rng.uniform(7, 14))
    t = 2.0
    while t < D:                                                                                       # latido muy lento (36 por minuto, muy grave y suave)
        n = int(.5 * SR); x = np.arange(n) / SR; lat = np.sin(2 * np.pi * (46 + 30 * np.exp(-x * 20)) * x) * np.exp(-x / .09)
        pad.poner((lat * .045).astype(np.float32), t); t += 1.65
    reverb(pad, 6.0, .55, rng); reverb(mel, 6.0, .65, rng); reverb(imp, 4.5, .5, rng)
    for b in (pad, mel, imp):
        b.L = paso_bajo(b.L, 5500); b.R = paso_bajo(b.R, 5500)
    return [pad, mel, imp]


def corte_intriga(buses, t, rng):                                  # cambio de capitulo: golpe fuerte con riser
    golpe(buses, max(3.0, t - 1.2), rng, 1.0, True)



def ding(buses, t, mood, rng):
    if mood == 'intriga':
        golpe(buses, t, rng, .6, False); return                               # acento de palabra clave: golpe medio sin riser
    if mood in ('mistico', 'natural'):
        return                                                                     # sueno: sin dings
    if mood == 'meditacion':
        buses[1].poner(tono(MIDI(79), 4, ((1, 1.0), (2.76, .12)), .01, 1.6) * .09, t)
    elif mood == 'aprender':                                                    # ta-da
        for j, st in enumerate([0, 4, 7, 12, 16]):
            buses[2].poner(tono(MIDI(72 + st), 1.2, ((1, 1.0), (2, .3), (3, .15)), .003, .4) * .13, t + j * .07, pan=-.5 + j * .25)
    else:
        buses[1].poner(tono(MIDI(93), 1.8, ((1, 1.0), (2.01, .25), (3.02, .1)), .002, .55) * .14, t)


ESTILOS = {'meditacion': (estilo_meditacion, corte_meditacion, -24),
           'curiosos': (estilo_curiosos, corte_curiosos, -21),
           'aprender': (estilo_aprender, corte_aprender, -21),
           'mistico': (estilo_mistico, corte_mistico, -21),
           'natural': (estilo_natural, corte_natural, -21),
           'intriga': (estilo_intriga, corte_intriga, -21)}


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
    n = int((cues['duracion'] + (4 if mood in ('meditacion', 'mistico', 'natural', 'intriga') else 1.5)) * SR)
    L = sum(b.L[:n] for b in buses); R = sum(b.R[:n] for b in buses)
    fin = np.ones(n, np.float32)                                                # fundidos
    fin[: int(2 * SR)] = np.linspace(0, 1, int(2 * SR)); fin[-int(3.5 * SR):] *= np.linspace(1, 0, int(3.5 * SR))
    st = np.stack([L * fin, R * fin], 1)
    rms = np.sqrt(np.mean(st[:: 8] ** 2) + 1e-12)
    st *= (10 ** (nivel_db / 20)) / rms
    if mood == 'intriga': st = (np.tanh(st / .7) * .7).astype(np.float32)           # limitador suave: los golpes no hunden el resto
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
