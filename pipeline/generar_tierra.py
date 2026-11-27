"""Genera engine/volumen/tierra_datos.js (costas del mundo) a partir de Natural Earth 1:50m 'land' (dominio publico).
Uso: python3 pipeline/generar_tierra.py ne_50m_land.geojson
Descarga: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
Simplifica (Douglas-Peucker, tolerancia en grados), descarta islas diminutas y codifica cada anillo como
deltas enteros de 1/20 de grado: 'lon0,lat0,dlon,dlat,...' y anillos separados por ';'."""
import json, sys, math

TOL, AREA_MIN, Q = 0.12, 0.25, 20

def dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, -1
    for i in range(1, len(pts)-1):
        p = pts[i]
        d = abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L if L > 1e-9 else math.hypot(p[0]-a[0], p[1]-a[1])
        if d > dmax: imax, dmax = i, d
    if dmax <= tol: return [a, b]
    return dp(pts[:imax+1], tol)[:-1] + dp(pts[imax:], tol)

def area(r): return abs(sum(r[i][0]*r[i-1][1]-r[i-1][0]*r[i][1] for i in range(len(r))))/2

d = json.load(open(sys.argv[1])); out = []; n = 0
for f in d['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for p in polys:
        ring = p[0]                      # solo el contorno exterior (los lagos interiores no se ven a esta escala)
        if area(ring) < AREA_MIN: continue
        s = dp(ring[:-1] if ring[0] == ring[-1] else ring, TOL)
        if len(s) < 4: continue
        q = [(round(x*Q), round(y*Q)) for x, y in s]; v = [q[0][0], q[0][1]]
        for i in range(1, len(q)): v += [q[i][0]-q[i-1][0], q[i][1]-q[i-1][1]]
        out.append(','.join(map(str, v))); n += len(q)
js = ('/* Costas del mundo: Natural Earth 1:50m land (dominio publico, naturalearthdata.com), simplificado con\n'
      '   pipeline/generar_tierra.py (tolerancia %.2f grados, %d anillos, %d puntos). Unidades: 1/%d de grado, deltas. */\n'
      'window.VE = window.VE || {}; VE.TIERRA_COSTAS = "%s";\n') % (TOL, len(out), n, Q, ';'.join(out))
open('engine/volumen/tierra_datos.js', 'w').write(js); print(len(out), 'anillos', n, 'puntos', len(js)//1024, 'KB')
