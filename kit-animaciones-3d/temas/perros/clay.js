'use strict';
// FIELTRO · ranking de perros por fuerza de mordida: seis peanas en fila, números de fieltro detrás y la cámara que va de una a otra al ritmo de la voz.
// Línea de tiempo en segundos del audio (locución de 58,4 s). Uso: MATERIAL=fieltro node bin/sdf.cjs temas/perros/clay.js salida.mp4 --fps 12 --w 360 --h 640
const C = require('../clay/arcilla'), { perro, perroSombra, RAZAS } = require('./perro');
const { sdEll, smin, smax, len, cap, sph, bulto, hfijo, figura, crearEscena, dirYaw, n3, cl, mix, S, hs } = C;
const SEP = 2.6, X = { presa: 0, dogue: SEP, dogo: 2 * SEP, rottweiler: 3 * SEP, cane: 4 * SEP, kangal: 5 * SEP };
const ORDEN = ['presa', 'dogue', 'dogo', 'rottweiler', 'cane', 'kangal'], NUM = { presa: 5, dogue: 4, dogo: 3, cane: 2, kangal: 1 };
const sm = (a, b, t) => { t = cl((t - a) / (b - a)); return t * t * (3 - 2 * t); };
const pulso = (t, t0, dur = 1.4, n = 2) => (t < t0 || t > t0 + dur) ? 0 : Math.max(0, Math.sin((t - t0) / dur * Math.PI * 2 * n)) * Math.sin((t - t0) / dur * Math.PI) ** .5;
// ventanas en las que cada perro «actúa» (mira a cámara, mueve la cola) y momento de «mordida» (la boca se abre)
const V = { presa: { a: [9.0, 16.3], m: 12.6 }, dogue: { a: [16.3, 23.9], m: 19.85 }, dogo: { a: [23.9, 30.9], m: 27.2 }, rottweiler: { a: [30.9, 36.2], m: 34.0 }, cane: { a: [36.2, 43.0], m: 39.4 }, kangal: { a: [43.0, 58.5], m: 46.55 } };
const COL = {
  kangal: { cuerpo: [.8, .64, .42], hocico: [.13, .11, .11], oreja: [.16, .13, .12], ceja: [.7, .55, .34] },
  presa: { cuerpo: [.8, .55, .22], hocico: [.12, .1, .09], oreja: [.18, .12, .08], ceja: [.7, .47, .18] },
  dogue: { cuerpo: [.66, .27, .13], hocico: [.3, .1, .08], oreja: [.42, .15, .09], ceja: [.55, .2, .1] },
  dogo: { cuerpo: [.94, .93, .89], hocico: [.93, .92, .88], oreja: [.93, .78, .74], ceja: [.9, .89, .85] },
  rottweiler: { cuerpo: [.09, .09, .1], hocico: [.62, .3, .12], oreja: [.07, .07, .08], ceja: [.66, .32, .12] },
  cane: { cuerpo: [.15, .15, .17], hocico: [.1, .1, .11], oreja: [.1, .1, .12], ceja: [.13, .13, .15] },
};
const colores = { boca: [.5, .07, .13], lengua: [.8, .3, .38], diente: [.99, .97, .9], ojo: [.04, .03, .03], pupila: [.01, .01, .01], nariz: [.05, .04, .04],
  suelo: [.2, .27, .3], fondo: [.2, .12, .26], num: [.95, .78, .25], podio: [.78, .35, .3] };
for (const r of ORDEN) for (const k of Object.keys(COL[r])) colores[k + '_' + r] = COL[r][k];
colores.marca_rottweiler = [.62, .3, .12]; colores.garra = [.1, .08, .08]; colores.mancha = [.2, .15, .14]; Object.assign(colores, { iris_kangal: [.85, .55, .16], iris_presa: [.8, .48, .12], iris_dogue: [.62, .3, .09], iris_dogo: [.5, .3, .12], iris_rottweiler: [.6, .32, .08], iris_cane: [.75, .5, .15] }); colores.oreja_int_dogo = [.95, .6, .62];
for (const r of ORDEN) { const b = COL[r].cuerpo; colores['parpado_' + r] = b.map(v => v * .72); if (!colores['marca_' + r]) colores['marca_' + r] = b; }
colores.parpado_dogo = [.9, .6, .6]; colores['nariz_dogo'] = [.92, .5, .52];
// trazos de los números (cada uno en [0..1]×[0..2]); se dibujan con cápsulas de fieltro
const TRAZOS = {
  1: [[[.2, 1.6], [.55, 2], [.55, 0]]],
  2: [[[.05, 1.55], [.2, 1.9], [.5, 2], [.8, 1.9], [.95, 1.55], [.85, 1.15], [.05, 0], [1, 0]]],
  3: [[[.05, 1.85], [.5, 2], [.9, 1.8], [.9, 1.3], [.45, 1.05]], [[.45, 1.05], [.95, .8], [.95, .2], [.5, 0], [.05, .15]]],
  4: [[[.7, 0], [.7, 2], [.05, .6], [1, .6]]],
  5: [[[.9, 2], [.15, 2], [.1, 1.1], [.55, 1.2], [.95, .9], [.95, .3], [.5, 0], [.05, .15]]],
};
function numero(x, y, z, n, cx, cy, cz, h) { // distancia a un número de fieltro centrado en (cx,cy) con altura h
  const sx = h / 2, u = (x - cx) / sx + .5, v = (y - cy) / sx + 1; if (u < -.3 || u > 1.3 || v < -.3 || v > 2.3 || Math.abs(z - cz) > .6) return .25; let d = 1e9;
  for (const tr of TRAZOS[n]) for (let k = 0; k < tr.length - 1; k++) { const a = tr[k], b = tr[k + 1]; d = Math.min(d, cap(u, v, (z - cz) / sx, a[0], a[1], 0, b[0], b[1], 0, .17) * sx); } return d; }
let T = 0, DOGS = [];
function estadoPerro(r, t) {
  const v = V[r], idx = ORDEN.indexOf(r), F = S.F; let act = sm(v.a[0] - .6, v.a[0] + .3, t) * (1 - sm(v.a[1] - .2, v.a[1] + .5, t)); if (r === 'kangal') act = Math.max(act, 1 - sm(4.3, 5.3, t));
  let jaw = pulso(t, v.m, 1.5, 2) * .7, cab = -(act * .55) + (1 - act) * (idx % 2 ? .3 : -.3) + (hs(F, idx, 3) - .5) * .05, esc = RAZAS[r].esc, vis = 1;
  if (r === 'kangal') { const hook = sm(-.1, .5, t) * (1 - sm(4.3, 4.9, t)); jaw = Math.max(jaw, hook * (.4 + .3 * Math.max(0, Math.sin(t * 5)))); cab = hook ? .08 * Math.sin(t * 2.2) : cab; if (t > 49.6 && t < 54.1) jaw = 0; }
  if (r === 'rottweiler') { const q = cl((t - 30.95) / .6); vis = q > 0 ? 1 : 0; esc *= q > 0 ? (q < 1 ? 1 + Math.sin(q * Math.PI) * .25 : 1) * sm(0, .35, q) : 0; }
  const salto = r === 'rottweiler' ? Math.max(0, 1 - (t - 30.95) / .6) * 2.2 * (t > 30.95 ? 1 : 0) : 0;
  return { jaw, cab: cab + (hs(F, idx, 9) - .5) * .06, cola: t * 9 + idx, colaAmp: act * (r === 'dogo' || r === 'presa' || r === 'cane' ? .12 : r === 'rottweiler' ? .5 : .05), resp: Math.sin(t * 4 + idx), esc, vis, salto, act };
}
function objDe(r) { const st = estadoPerro(r, T), yaw = (r === 'kangal' ? mix(dirYaw(0, 1), dirYaw(.65, 1), sm(4, 5.2, T)) : dirYaw(.65, 1)) - .5 * (1 - st.act) * (ORDEN.indexOf(r) % 2 ? -1 : 1); return { o: { pos: [X[r], .14 + st.salto, 0], yaw, esc: st.esc }, st }; }
function escena(x, y, z, sombra) {
  let d = y, m = 'suelo'; const c = (dd, mm) => { if (dd < d) { d = dd; m = mm; } };
  c(z + 4.8 + .05 * n3(x * 2, y * 2, 0), 'fondo');
  for (let i = 0; i < DOGS.length; i++) { const r = ORDEN[i], D = DOGS[i], cx = X[r];
    if (Math.abs(x - cx) > 2.2) continue;
    c(Math.max(len(x - cx, z) - .95, y - .14, -y) + .004 * Math.sin(x * 40), 'podio');
    if (D.st.vis && D.st.esc > .01) { const q = figura(D.o, sombra ? ((a, b, e) => [perroSombra(a, b, e, RAZAS[r]), 'cuerpo']) : ((a, b, e) => perro(a, b, e, RAZAS[r], D.st)), x, y, z, [.12, .65, 0], 1.25); if (q[0] < d) { d = q[0]; m = 'perro' + i; } }
    if (NUM[r]) c(numero(x, y, z, NUM[r], cx + .5, 1.45, -1.5, 1.5) - .005, 'num');
  }
  return [d, m];
}
const camaras = (t) => {
  // fotogramas clave: [t, cx, ex, ey, ez, ty, tz]
  const K = [
    [0, X.kangal, .35, 1.4, 3.7, 1.02, .9], [4.2, X.kangal, .12, 1.35, 3.0, 1.02, .9],
    [5.0, X.kangal, .5, 1.7, 5.0, .6, .8], [6.8, X.cane - .6, .3, 1.4, 4.2, .5, .7], [8.2, X.dogo + 0.0, .2, 1.35, 4.4, .42, .65], [9.0, X.presa, .3, 1.3, 4.4, .4, .7],
    [16.0, X.presa, -.15, 1.3, 4.3, .38, .65], [16.5, X.dogue, -.2, 1.25, 4.4, .38, .6], [23.6, X.dogue + .1, .35, 1.3, 4.3, .4, .65], [24.1, X.dogo, .3, 1.25, 4.4, .38, .65],
    [30.6, X.dogo, -.3, 1.3, 4.3, .38, .65], [31.2, X.rottweiler, -.1, 1.25, 4.4, .38, .65], [36.0, X.rottweiler + .1, .3, 1.3, 4.3, .38, .65], [36.6, X.cane, .2, 1.25, 4.4, .38, .65],
    [42.7, X.cane + .1, -.3, 1.3, 4.3, .4, .65], [43.3, X.kangal, .3, 1.3, 4.7, .45, .7], [49.2, X.kangal, .5, 1.4, 4.2, .45, .75], [50.0, X.kangal, .1, 1.5, 4.8, .45, .75],
    [54.0, X.kangal, .0, 1.6, 5.6, .5, .8], [55.0, (X.kangal + X.cane) / 2 + .1, 0, 1.7, 8.6, .55, .8], [58.5, (X.kangal + X.cane) / 2 + .1, .3, 1.75, 9, .6, .85]];
  let k = 0; while (k < K.length - 2 && t >= K[k + 1][0]) k++; const a = K[k], b = K[k + 1], u = sm(a[0], b[0], t) , e = u; // suavizado por tramo
  const ip = (i) => mix(a[i], b[i], e); const ez = ip(4), cx = ip(1) + .22 * cl((6 - ez) / 2) * (t > 4.3 ? 1 : 0);
  return { eye: [cx + ip(2), ip(3), ez], target: [cx, ip(5), mix(a[6] || 0, b[6] || 0, e)], fov: 42 };
};
module.exports = crearEscena({
  escena, escenaSombra: (x, y, z) => escena(x, y, z, true), lejos: 30, pasos: 240, brillantes: new Set(['ojo', 'pupila']),
  prepara(t) { T = t; DOGS = ORDEN.map(objDe); },
  parte(m, x, y, z) { if (m.startsWith('perro')) { const i = +m.slice(5), r = ORDEN[i], D = DOGS[i], q = figura(D.o, (a, b, e) => perro(a, b, e, RAZAS[r], D.st), x, y, z, [.12, .65, 0], 1.25); const nm = q[1] || 'cuerpo'; return colores[nm + '_' + r] ? nm + '_' + r : nm; } if (m === 'podio') return 'podio'; return m; },
  colores,
  pinta(part, x, y, z, alb) {
    if (part === 'fondo') { const h = cl((y + .2) / 4); return [mix(.2, .1, h), mix(.11, .07, h), mix(.27, .2, h)]; }
    if (part === 'suelo') return alb.map(v => v * (.85 + .3 * n3(x * 5, 0, z * 5)));
    if (part === 'podio') { const i = Math.round(x / SEP), r = ORDEN[cl(i, 0, 5)]; return [[.82, .42, .2], [.3, .55, .62], [.86, .6, .22], [.4, .62, .4], [.45, .35, .62], [.78, .3, .35]][ORDEN.indexOf(r)]; }
    if (part === 'cuerpo_rottweiler' && y < .3) return [.62, .3, .12];
    if (part === 'cuerpo_presa') { const s = Math.sin(y * 32 + z * 24 + 5 * n3(x * 9, y * 9, z * 9)); return alb.map(v => v * (.72 + .28 * sm(-.2, .5, s))); }
  },
  luz: [-.45, .8, .7], luzColor: [1.3, 1.1, .92], fondo: [.1, .07, .14],
  camara: camaras,
});
