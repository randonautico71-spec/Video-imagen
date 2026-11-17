'use strict';
// PERRO PARAMÉTRICO (SDF) para el material de fieltro. Coordenadas locales: x = delante, y = arriba, z = lateral; altura a la cruz ≈ 1.
// perro(x,y,z,P,s) → [distancia, parte]. P = raza (RAZAS), s = estado { jaw 0..1, cab (giro de cabeza, rad), cola (fase), resp, ojo }.
const { sdEll, smin, smax, cl, len, cap, sph, bulto } = require('../clay/arcilla');
const sdEll2 = sdEll;
const RAZAS = {
  // sk: cráneo (radios), mz: hocico (largo, alto, ancho), fl: belfos, orej: tipo de oreja, cola: tipo de cola
  kangal:  { esc: 1.22, w: 1.05, ch: 1.0,  lg: .085, nk: .17, sk: [.2, .18, .18],   mz: [.17, .09, .1],   fl: [.1, .05, .03],   orej: 'caida',  cola: 'rizada',   hy: 1.0,  alto: 1.0 },
  presa:   { esc: 1.0,  w: 1.12, ch: 1.05, lg: .085, nk: .17, sk: [.21, .19, .2],   mz: [.13, .095, .11], fl: [.12, .07, .045], orej: 'rosa',   cola: 'colgante', hy: .98,  alto: 1.0 },
  dogue:   { esc: 1.0,  w: 1.22, ch: 1.15, lg: .098, nk: .2,  sk: [.27, .235, .25], mz: [.1, .12, .15],   fl: [.2, .15, .08],  orej: 'chica',  cola: 'colgante', hy: .93,  alto: .98, arrugas: 1 },
  dogo:    { esc: 1.0,  w: 1.08, ch: 1.08, lg: .08,  nk: .16, sk: [.2, .18, .17],   mz: [.15, .09, .09],  fl: [.09, .05, .03],  orej: 'larga',  cola: 'colgante', hy: 1.0,  alto: 1.0 },
  rottweiler: { esc: 1.0, w: 1.05, ch: 1.05, lg: .08, nk: .16, sk: [.19, .17, .17], mz: [.14, .085, .095], fl: [.08, .05, .03], orej: 'caida',  cola: 'tocon',    hy: 1.0,  alto: 1.0, marcas: 1 },
  cane:    { esc: 1.04, w: 1.12, ch: 1.1,  lg: .088, nk: .18, sk: [.2, .18, .19],   mz: [.15, .095, .1],  fl: [.12, .075, .04], orej: 'caida',  cola: 'colgante', hy: 1.0,  alto: 1.02 },
};
function perro(x, y, z, P, s) {
  const az = Math.abs(z), W = P.w; let d = 1e9, p = 'cuerpo';
  const put = (dd, pp, k) => { if (dd < d + (k || 0) * .25) p = pp; d = k ? smin(d, dd, k) : Math.min(d, dd); };
  const rs = s.resp || 0;
  // tronco: pecho, grupa y vientre
  put(sdEll(x - .2, y - .66 - .004 * rs, z, .33, .27 * P.ch + .006 * rs, .19 * W), 'cuerpo');
  put(sdEll(x + .27, y - .61, z, .3, .25, .18 * W), 'cuerpo', .14);
  put(sdEll(x - .02, y - .52, z, .4, .2, .17 * W), 'cuerpo', .1);
  // patas delanteras y traseras
  for (const sd of [1, -1]) {
    const fz = sd * .115 * W;
    put(cap(x, y, z, .28, .56, fz, .31, .09, fz * 1.05, P.lg * 1.18), 'cuerpo', .05);
    put(sdEll(x - .35, y - .045, z - fz * 1.05, .105, .047, .075), 'cuerpo', .03);
    const hz = sd * .15 * W;
    put(sdEll(x + .33, y - .5, z - hz, .17, .23, .105 * W), 'cuerpo', .06);
    put(cap(x, y, z, -.4, .42, hz, -.47, .21, hz * .95, P.lg * .78), 'cuerpo', .04);
    put(cap(x, y, z, -.47, .21, hz * .95, -.41, .08, hz * .95, P.lg * .72), 'cuerpo', .03);
    put(sdEll(x + .38, y - .045, z - hz * .95, .105, .047, .072), 'cuerpo', .03);
  }
  // cuello y cabeza (con giro): pivote en la base del cuello
  put(cap(x, y, z, .38, .7, 0, .6, P.hy - .03, 0, P.nk * 1.15), 'cuerpo', .12);
  const cb = Math.cos(s.cab || 0), sb = Math.sin(s.cab || 0), px = x - .6, xl = px * cb - z * sb + .6, zl = px * sb + z * cb, hx = .77, hy = P.hy, jw = s.jaw || 0;
  const sk = P.sk.map(q => q * 1.26), mz = P.mz.map(q => q * 1.3);
  let cab = sdEll(xl - hx, y - hy, zl, sk[0], sk[1], sk[2]);
  const muz = sdEll(xl - hx - sk[0] * .85, y - hy + .075, zl, mz[0], mz[1], mz[2]);
  put(smin(cab, muz, .07), 'cuerpo', .09); const cabP = cab;
  // el hocico lleva el color de la máscara
  if (muz < cabP - .01 && muz < d + .02) p = 'hocico';
  // belfos colgantes
  const fl = P.fl; for (const sd of [1, -1]) { const b = sdEll(xl - hx - sk[0] * .8, y - hy + .12 + .02 * jw, zl - sd * (mz[2] * .85), fl[0], fl[1], fl[2]); if (b < d) { p = 'hocico'; } d = smin(d, b, .04); }
  // mandíbula inferior: gira alrededor de la articulación
  const jx = hx + .03, jy = hy - .09, ang = jw * .75, ca = Math.cos(ang), sa = Math.sin(ang), u = xl - jx, v = y - jy, u2 = u * ca - v * sa, v2 = u * sa + v * ca;
  const mand = sdEll(u2 - mz[0] * 1.05 - .04, v2 + .035, zl, mz[0] * .95, .034, mz[2] * .72);
  if (mand < d) p = 'hocico'; d = smin(d, mand, .035);
  // interior de la boca, lengua y dientes (solo si está abierta)
  if (jw > .04) {
    const cav = sdEll(xl - hx - .1, y - hy + .07 - .05 * jw, zl, mz[0] * .75, .015 + .09 * jw, mz[2] * .75); if (cav < d) { d = cav; p = 'boca'; }
    const leng = sdEll(u2 - mz[0] * .95, v2 + .015, zl, mz[0] * .7, .03, mz[2] * .5); if (leng < d) { d = leng; p = 'lengua'; }
    if (len(xl - hx - .25, y - hy + .05, zl) < .34) {
      for (let k = 0; k < 4; k++) for (const sd of [1, -1]) { const tx = hx + .1 + .065 * k, tz = sd * (.045 + .006 * k);
        const t1 = sdEll(xl - tx, y - hy + .115 - .004 * k, zl - tz, .012, .024, .012), t2 = sdEll(u2 - (tx - jx), v2 + .075, zl - tz, .011, .02, .011); if (t1 < d) { d = t1; p = 'diente'; } if (t2 < d) { d = t2; p = 'diente'; } }
      for (const sd of [1, -1]) { const c1 = sdEll(xl - hx - sk[0] * .85 - mz[0] * .85, y - hy + .12, zl - sd * .045, .015, .042, .015), c2 = sdEll(u2 - mz[0] * 1.45, v2 + .085, zl - sd * .04, .013, .034, .013); if (c1 < d) { d = c1; p = 'diente'; } if (c2 < d) { d = c2; p = 'diente'; } }
    }
  } else { d = smax(d, -sdEll(xl - hx - sk[0] * .85 - mz[0] * .6, y - hy + .113, zl, mz[0] * .7, .004, mz[2] * .85), .008); }
  // nariz, ojos, cejas
  const nar = sdEll(xl - hx - sk[0] * .85 - mz[0] * .95, y - hy + .065, zl, .042, .035, .052); if (nar < d) p = 'nariz'; d = smin(d, nar, .02);
  for (const sd of [1, -1]) {
    const ex = hx + sk[0] * .42, ey = hy + .035, ez = sd * sk[2] * .8, ojo = sph(xl, y, zl, ex, ey, ez, .036), brillo = sph(xl, y, zl, ex + .022, ey + .018, ez + sd * .004, .009);
    if (ojo < d + .005) { d = Math.min(d, ojo); p = 'pupila'; } if (brillo < d + .002) { d = Math.min(d, brillo); p = 'ojo'; }
    const ceja = sdEll(xl - ex + .005, y - ey - .047, zl - ez, .045, .018, .03); if (ceja < d + .004) p = 'ceja'; d = smin(d, ceja, .012);
    // orejas
    { const ez0 = sd * sk[2] * .88, ex0 = hx - sk[0] * .25, tipo = P.orej;
      const R = tipo === 'larga' ? [.07, .13, .022] : tipo === 'chica' ? [.05, .06, .022] : tipo === 'rosa' ? [.065, .075, .028] : [.075, .11, .022];
      const e = sdEll(xl - ex0, y - (hy + .06 - R[1] * .85), zl - ez0 - sd * (R[1] * .35 * (1 - (y - hy) * 0)), R[0], R[1], R[2]); if (e < d) p = 'oreja'; d = smin(d, e, .02); }
    if (P.marcas) { const mj = sdEll(xl - hx - sk[0] * .5, y - hy + .07, zl - sd * sk[2] * .92, .09, .06, .03); if (mj < d + .004) p = 'marca'; d = smin(d, mj, .015); }
    // mejillas / arrugas
    if (P.arrugas) for (let k = 0; k < 3; k++) d = smax(d, -sdEll(xl - hx + .04 - k * .0, y - hy - .125 + k * .018 * 0 - .02 * k, zl, .13, .007, .22), .01);
  }
  // cola
  const wag = Math.sin(s.cola || 0) * (s.colaAmp || 0);
  if (P.cola === 'colgante') { put(cap(x, y, z, -.56, .66, 0, -.74, .46, wag * .5, .05), 'cuerpo', .05); put(cap(x, y, z, -.74, .46, wag * .5, -.78, .25, wag, .035), 'cuerpo', .03); }
  else if (P.cola === 'rizada') { put(cap(x, y, z, -.52, .72, 0, -.62, .98, wag * .3, .06), 'cuerpo', .05); put(cap(x, y, z, -.62, .98, wag * .3, -.42, 1.08, wag * .4, .055), 'cuerpo', .03); put(cap(x, y, z, -.42, 1.08, wag * .4, -.27, .98, wag * .2, .05), 'cuerpo', .03); }
  else { put(sdEll(x + .53, y - .68, z - wag * .1, .06, .05, .05), 'cuerpo', .03); }
  return [d + bulto(x, y, z, .012), p];
}
module.exports = { perro, RAZAS };
