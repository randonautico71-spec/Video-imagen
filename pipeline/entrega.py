#!/usr/bin/env python3
"""PLAN DE ENTREGA: de formato + duracion a la lista de versiones a renderizar.

Regla del usuario: cuando se genera un YouTube de 3 a 5 min, se devuelven DOS versiones
(youtube 16:9 e instagram 9:16) porque no son el mismo archivo."""
import json
from pathlib import Path
RAIZ = Path(__file__).resolve().parents[1]
FORMATOS = json.loads((RAIZ / 'config/formatos.json').read_text())


def plan(formato, duracion_s):
    """Devuelve (versiones, avisos). Cada version: {'nombre','formato','lienzo','fps','ss'}."""
    if formato not in FORMATOS or formato.startswith('_'):
        raise SystemExit(f"Formato desconocido: {formato}. Hay: {[k for k in FORMATOS if not k.startswith('_')]}")
    f = FORMATOS[formato]
    avisos, versiones = [], []

    def v(nombre, fm):
        g = FORMATOS[fm]
        versiones.append({'nombre': nombre, 'formato': fm, 'lienzo': g['lienzo'], 'fps': g['fps'], 'ss': g['ss']})

    if formato == 'short' and duracion_s > f['limite_plataforma_s']:
        avisos.append(f"Dura {duracion_s:.0f} s y el limite de YouTube Shorts es {f['limite_plataforma_s']} s (fuente oficial): no contara como Short.")
    if formato == 'youtube':
        if duracion_s < f['min_s']:
            avisos.append(f"Dura {duracion_s:.0f} s, por debajo del minimo de {f['min_s']} s del formato 'youtube'.")
        if duracion_s > f['max_s']:
            avisos.append(f"Dura {duracion_s:.0f} s, por encima del maximo de {f['max_s']} s del formato 'youtube'.")
    if formato == 'instagram':
        a, b = f['objetivo_s']
        if duracion_s > b * 1.25:
            avisos.append(f"Dura {duracion_s:.0f} s; el objetivo de Instagram es ~{b} s. Los limites de Instagram NO estan verificados: comprueba la app.")

    v(formato, formato)
    d = f.get('doble_entrega')
    if d and d['desde_s'] <= duracion_s <= d['hasta_s']:
        v(d['tambien'], d['tambien'])
        avisos.append(f"Entrega doble: {d['motivo']}")
    return versiones, avisos


if __name__ == '__main__':
    import sys
    for fm, dur in [('short', 45), ('short', 200), ('youtube', 120), ('youtube', 240), ('youtube', 300), ('youtube', 301), ('youtube', 1800), ('instagram', 280)]:
        vs, av = plan(fm, dur)
        print(f"{fm:9s} {dur:5d}s -> {[x['nombre']+'/'+x['lienzo'] for x in vs]}")
        for a in av: print('           !', a[:110])
