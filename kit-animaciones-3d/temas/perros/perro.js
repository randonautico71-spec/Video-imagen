'use strict';
// PERRO DETALLADO (SDF) para el material de fieltro. Coordenadas locales: x = delante, y = arriba, z = lateral; altura a la cruz ≈ 1.
// perro(x,y,z,P,s) → [distancia, parte]. P = raza (RAZAS), s = estado { jaw 0..1, cab (giro de cabeza, rad), cola (fase), colaAmp, resp }.
// perroSombra(x,y,z,P) → distancia simplificada (para sombras y oclusión).
// Grupos con esfera envolvente: lejos de ellos se devuelve la distancia a la esfera (rápido); cerca se calculan los detalles. La pieza es simétrica en z (se usa |z|).
const { sdEll, smin, smax, cl, len, cap, sph, bulto } = require('../clay/arcilla');
const D = { w: 1, ch: 1, lg: .085, nk: .17, sk: [.2, .18, .18], mz: [.15, .09, .1], fl: [.1, .06, .035], orej: 'caida', cola: 'colgante', hy: 1, mej: 1, dew: 0, tuck: .5, pelo: 0, arrugas: 0, marcas: 0, mascara: 0, esc: 1, pata: 1, musc: 1 };
const RAZAS = {
  kangal:     { ...D, esc: 1.22, w: 1.0, ch: 1.05, lg: .075, nk: .18, sk: [.2, .18, .18], mz: [.17, .09, .1], fl: [.1, .055, .03], orej: 'caida', cola: 'rizada', hy: 1.02, mascara: 1, pelo: 1, dew: .3, tuck: .7, pata: 1.1, musc: .8 },
  presa:      { ...D, esc: 1.0, w: 1.12, ch: 1.05, lg: .085, nk: .18, sk: [.21, .19, .2], mz: [.13, .095, .115], fl: [.13, .075, .05], orej: 'rosa', cola: 'colgante', hy: .98, mascara: 1, mej: 1.5, dew: .6, tuck: .3, musc: 1.25 },
  dogue:      { ...D, esc: 1.0, w: 1.22, ch: 1.15, lg: .098, nk: .21, sk: [.27, .235, .25], mz: [.1, .125, .155], fl: [.2, .15, .085], orej: 'chica', cola: 'colgante', hy: .93, mascara: 1, mej: 1.7, dew: 1.2, arrugas: 1, tuck: .1, pata: .92, musc: 1.3 },
  dogo:       { ...D, esc: 1.0, w: 1.08, ch: 1.08, lg: .08, nk: .165, sk: [.2, .18, .17], mz: [.155, .09, .09], fl: [.09, .05, .03], orej: 'caida', cola: 'colgante', hy: 1.0, tuck: .9, musc: 1.3, pata: 1.04, mancha: 1 },
  rottweiler: { ...D, esc: 1.0, w: 1.05, ch: 1.05, lg: .08, nk: .17, sk: [.19, .17, .17], mz: [.14, .085, .095], fl: [.08, .05, .03], orej: 'caida', cola: 'tocon', hy: 1.0, marcas: 1, mej: 1.3, tuck: .4, musc: 1.2 },
  cane:       { ...D, esc: 1.04, w: 1.12, ch: 1.1, lg: .088, nk: .185, sk: [.2, .18, .19], mz: [.15, .095, .105], fl: [.12, .075, .04], orej: 'caida', cola: 'colgante', hy: 1.0, mej: 1.4, dew: .7, arrugas: .5, tuck: .6, musc: 1.3, pata: 1.03 },
};
const near = (x, y, z, cx, cy, cz, r) => { const q = len(x - cx, y - cy, z - cz); return q > r + .18 ? q - r : -1; };
function perro(x, y, z, P, s) {
  const az = Math.abs(z), W = P.w, M = P.musc, rs = s.resp || 0; let d = 1e9, p = 'cuerpo';
  const put = (dd, pp, k) => { if (dd < d + (k || 0) * .25) p = pp; d = k ? smin(d, dd, k) : Math.min(d, dd); };
  // ---------- TRONCO ----------
  let q = near(x, y, az, 0, .6, 0, .78);
  if (q >= 0) d = Math.min(d, q); else {
    put(sdEll(x - .2, y - .66 - .004 * rs, az, .34, .28 * P.ch + .006 * rs, .2 * W), 'cuerpo');
    put(sdEll(x + .27, y - .61, az, .3, .25, .19 * W), 'cuerpo', .14);
    put(sdEll(x - .02, y - .54, az, .38, .2, .17 * W), 'cuerpo', .1);
    if (P.tuck) d = smax(d, -sdEll(x + .1, y - .12, az, .2 + .05 * P.tuck, .17 + .07 * P.tuck, .5), .09);             // vientre recogido
    put(sdEll(x - .3, y - .6, az - .17 * W, .15, .2, .075 * M), 'cuerpo', .08);                                       // músculo del hombro
    put(sdEll(x + .34, y - .6, az - .165 * W, .15, .21, .085 * M), 'cuerpo', .08);                                    // músculo de la grupa
    put(sdEll(x - .3, y - .9, az, .13, .06, .11), 'cuerpo', .06);                                                      // cruz
    put(sdEll(x - .32, y - .4, az, .14, .11, .13), 'cuerpo', .07);                                                     // esternón
    d += .004 * Math.sin(x * 30 + az * 10) * (P.arrugas ? 1 : 0);
  }
  // ---------- PATAS DELANTERAS ----------
  q = near(x, y, az, .31, .3, .12 * W, .5);
  if (q >= 0) d = Math.min(d, q); else {
    const fz = .12 * W; put(cap(x, y, az, .27, .56, fz, .3, .33, fz * 1.02, P.lg * 1.3), 'cuerpo', .06); put(cap(x, y, az, .3, .33, fz * 1.02, .31, .09, fz * 1.05, P.lg * 1.1), 'cuerpo', .05);
    const pat = sdEll(x - .37, y - .045, az - fz * 1.05, .11, .048, .078); put(pat, 'cuerpo', .03);
    for (const k of [-1, 1]) d = smax(d, -sdEll(x - .47, y - .05, az - fz * 1.05 - k * .026, .06, .05, .003), .006);   // dedos
    for (const k of [-1, 0, 1]) { const g = sdEll(x - .475, y - .022, az - fz * 1.05 - k * .045, .014, .012, .016); if (g < d + .004) p = 'garra'; d = Math.min(d, g); }
  }
  // ---------- PATAS TRASERAS ----------
  q = near(x, y, az, -.4, .33, .14 * W, .55);
  if (q >= 0) d = Math.min(d, q); else {
    const hz = .15 * W; put(sdEll(x + .33, y - .5, az - hz, .17, .23 * (1 + .1 * M * .3), .105 * W * M), 'cuerpo', .06); put(cap(x, y, az, -.3, .36, hz, -.42, .3, hz * .95, P.lg * 1.05), 'cuerpo', .05);
    put(cap(x, y, az, -.42, .3, hz * .95, -.48, .2, hz * .93, P.lg * .8), 'cuerpo', .04); put(cap(x, y, az, -.48, .2, hz * .93, -.42, .075, hz * .95, P.lg * .72), 'cuerpo', .03);
    put(sdEll(x + .38, y - .045, az - hz * .95, .11, .048, .074), 'cuerpo', .03);
    for (const k of [-1, 1]) d = smax(d, -sdEll(x + .28, y - .05, az - hz * .95 - k * .026, .06, .05, .003), .006);
    for (const k of [-1, 0, 1]) { const g = sdEll(x + .275, y - .022, az - hz * .95 - k * .045, .014, .012, .016); if (g < d + .004) p = 'garra'; d = Math.min(d, g); }
  }
  // ---------- CUELLO ----------
  q = near(x, y, az, .52, .86, 0, .42);
  if (q >= 0) d = Math.min(d, q); else {
    put(cap(x, y, az, .38, .7, 0, .6, P.hy - .03, 0, P.nk * 1.15), 'cuerpo', .12);
    if (P.dew) put(sdEll(x - .52, y - (P.hy - .22), az, .12, .09 + .06 * P.dew, .07 + .03 * P.dew), 'cuerpo', .09);   // papada
    if (P.pelo) for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; put(sph(x, y, az, .5 + .05 * Math.abs(Math.cos(a)), P.hy - .05 + Math.cos(a) * .17, Math.sin(a) * .15, .08), 'cuerpo', .06); }
  }
  // ---------- COLA ----------
  const wag = Math.sin(s.cola || 0) * (s.colaAmp || 0);
  q = near(x, y, z, -.55, .65, 0, .6);
  if (q >= 0) d = Math.min(d, q); else {
    if (P.cola === 'colgante') { put(cap(x, y, z, -.56, .66, 0, -.74, .46, wag * .5, .055), 'cuerpo', .05); put(cap(x, y, z, -.74, .46, wag * .5, -.79, .24, wag, .036), 'cuerpo', .03); }
    else if (P.cola === 'rizada') { put(cap(x, y, z, -.52, .72, 0, -.62, .98, wag * .3, .065), 'cuerpo', .05); put(cap(x, y, z, -.62, .98, wag * .3, -.43, 1.1, wag * .4, .06), 'cuerpo', .03); put(cap(x, y, z, -.43, 1.1, wag * .4, -.26, .99, wag * .2, .055), 'cuerpo', .03);
      for (let k = 0; k < 5; k++) { const t = k / 4; put(sdEll(x - (-.62 + t * .36), y - (1.0 + .08 * Math.sin(t * 3.1)), z - wag * .3, .07, .06, .06), 'cuerpo', .05); } }      // penacho
    else put(sdEll(x + .53, y - .68, z - wag * .1, .06, .05, .05), 'cuerpo', .03);
  }
  // ---------- CABEZA (con giro y mandíbula) ----------
  const cb = Math.cos(s.cab || 0), sb = Math.sin(s.cab || 0), px = x - .6, xl = px * cb - z * sb + .6, zl = px * sb + z * cb, azl = Math.abs(zl), hx = .77, hy = P.hy, jw = s.jaw || 0;
  const sk = P.sk.map(v => v * 1.26), mz = P.mz.map(v => v * 1.3), fl = P.fl;
  q = near(xl, y, azl, hx + .12, hy - .04, 0, .5);
  if (q >= 0) d = Math.min(d, q); else {
    const hd = d, prevP = p; d = 1e9; const cabeza = (dd, pp, k) => put(dd, pp, k);
    cabeza(sdEll(xl - hx, y - hy, azl, sk[0], sk[1], sk[2]), 'cuerpo');
    cabeza(sdEll(xl - hx - sk[0] * .5, y - hy - sk[1] * .5, azl - sk[2] * .42, .09, .045, .09), 'cuerpo', .05);                  // arco ciliar
    cabeza(sdEll(xl - hx - sk[0] * .15, y - hy - .07, azl - sk[2] * .6, .12 * P.mej, .1, .075 * P.mej), 'cuerpo', .06);            // mejilla (masetero)
    const muz = sdEll(xl - hx - sk[0] * .85, y - hy + .075, azl, mz[0], mz[1], mz[2]); cabeza(muz, 'hocico', .07);
    cabeza(sdEll(xl - hx - sk[0] * .9 - mz[0] * .25, y - hy + .075 + mz[1] * .75, azl, mz[0] * .75, .026, .04), 'hocico', .03);     // caña nasal
    cabeza(sdEll(xl - hx - sk[0] * .78, y - hy + .11 + .02 * jw, azl - mz[2] * .8, fl[0], fl[1], fl[2]), 'hocico', .04);             // belfo
    if (P.arrugas) for (let k = 0; k < 4; k++) d = smax(d, -sdEll(xl - hx - .05 + k * .015, y - hy - .1 - .028 * k, azl, .12, .007, .26 - .02 * k), .01);
    if (P.arrugas > .9) for (let k = 0; k < 2; k++) d = smax(d, -sdEll(xl - hx - sk[0] * .75 + k * .05, y - hy + .0 - .035 * k, azl - mz[2] * .55, .05, .008, .06), .008);
    // máscara de color (el hocico y los ojos)
    if (P.mascara && p === 'cuerpo' && sdEll(xl - hx - sk[0] * .75, y - hy - .01, azl, .27, .11, .17) < 0) p = 'hocico';
    if (P.mancha && zl > 0 && p === 'cuerpo' && sdEll(xl - hx - sk[0] * .42, y - hy - .035, azl - sk[2] * .8, .075, .065, .06) < 0) p = 'mancha';
    // mandíbula inferior
    const jx = hx + .03, jy = hy - .09, ang = jw * .75, ca = Math.cos(ang), sa = Math.sin(ang), u = xl - jx, v = y - jy, u2 = u * ca - v * sa, v2 = u * sa + v * ca;
    cabeza(sdEll(u2 - mz[0] * 1.05 - .04, v2 + .035, azl, mz[0] * .95, .034, mz[2] * .72), 'hocico', .035);
    cabeza(sdEll(u2 - mz[0] * 1.9, v2 + .04, azl, .03, .03, mz[2] * .5), 'hocico', .02);                                                // barbilla
    if (jw > .04) {
      const cav = sdEll(xl - hx - .1, y - hy + .07 - .05 * jw, azl, mz[0] * .75, .015 + .09 * jw, mz[2] * .75); if (cav < d) { d = cav; p = 'boca'; }
      const leng = sdEll(u2 - mz[0] * .95, v2 + .015, azl, mz[0] * .7, .03, mz[2] * .5); if (leng < d) { d = leng; p = 'lengua'; }
      if (len(xl - hx - .25, y - hy + .05, azl) < .36) {
        for (let k = 0; k < 4; k++) { const tx = hx + .1 + .06 * k, tz = .045 + .006 * k, t1 = sdEll(xl - tx, y - hy + .115 - .004 * k, azl - tz, .012, .022 + .004 * (k === 3), .012), t2 = sdEll(u2 - (tx - jx), v2 + .075, azl - tz, .011, .02, .011); if (t1 < d) { d = t1; p = 'diente'; } if (t2 < d) { d = t2; p = 'diente'; } }
        for (let k = -1; k <= 1; k++) { const ix = hx + sk[0] * .85 + mz[0] * .95, t1 = sdEll(xl - ix, y - hy + .1, azl - Math.abs(k) * .018 * 0 - .018 * (k + 1) * 0 - Math.abs(k * .02), .01, .02, .01); if (t1 < d) { d = t1; p = 'diente'; } }
        const c1 = sdEll(xl - hx - sk[0] * .85 - mz[0] * .85, y - hy + .12, azl - .045, .016, .045, .016), c2 = sdEll(u2 - mz[0] * 1.45, v2 + .085, azl - .04, .014, .036, .014); if (c1 < d) { d = c1; p = 'diente'; } if (c2 < d) { d = c2; p = 'diente'; }
      }
    } else d = smax(d, -sdEll(xl - hx - sk[0] * .85 - mz[0] * .6, y - hy + .113, azl, mz[0] * .75, .005, mz[2] * .9), .008);       // línea de la boca
    // nariz con fosas
    const nar = sdEll(xl - hx - sk[0] * .85 - mz[0] * .95, y - hy + .065, azl, .043, .036, .054); if (nar < d) p = 'nariz'; d = smin(d, nar, .02);
    d = smax(d, -sdEll(xl - hx - sk[0] * .85 - mz[0] * .95 - .03, y - hy + .06, azl - .026, .012, .01, .012), .006);
    // ojos con párpado
    const ex = hx + sk[0] * .42, ey = hy + .035, ez = sk[2] * .8, ojo = sph(xl, y, azl, ex, ey, ez, .046), pup = sph(xl, y, azl, ex + .024, ey + .002, ez + .01, .026), bri = sph(xl, y, azl, ex + .03, ey + .022, ez + .006, .011);
    if (ojo < d + .005) { d = Math.min(d, ojo); p = 'iris'; } if (pup < d + .002) { d = Math.min(d, pup); p = 'pupila'; } if (bri < d + .002) { d = Math.min(d, bri); p = 'ojo'; }
    const par = sdEll(xl - ex + .004, y - ey - .028, azl - ez + .008, .05, .02, .04); if (par < d + .003) p = 'parpado'; d = smin(d, par, .01);
    if (P.marcas) { const ce = sdEll(xl - ex + .005, y - ey - .068, azl - ez + .005, .032, .018, .028); if (ce < d + .003) p = 'marca'; d = smin(d, ce, .012); const mj = sdEll(xl - hx - sk[0] * .5, y - hy + .07, azl - sk[2] * .92, .09, .06, .03); if (mj < d + .004) p = 'marca'; d = smin(d, mj, .015); }
    // orejas
    { const tipo = P.orej, ez0 = sk[2] * .9, ex0 = hx - sk[0] * .22;
      if (tipo === 'rosa') { const e = sdEll(xl - ex0, y - hy - .0, azl - ez0 - .03, .06, .08, .03); if (e < d) p = 'oreja'; d = smin(d, e, .02); const e2 = sdEll(xl - ex0 - .04, y - hy - .06, azl - ez0 - .06, .045, .035, .03); if (e2 < d) p = 'oreja'; d = smin(d, e2, .02); }
      else { const R = tipo === 'larga' ? [.07, .14, .022] : tipo === 'chica' ? [.05, .065, .022] : [.075, .115, .023];
        const ey0 = y - (hy + .075 - R[1] * .85), tap = 1 - cl(-ey0 / R[1], 0, 1) * .3, e = sdEll((xl - ex0) / tap, ey0, azl - ez0 - ey0 * (-.2) - .03, R[0], R[1], R[2]); if (e < d) p = 'oreja'; d = smin(d, e, .02);
        if (tipo === 'larga') { const ei = sdEll((xl - ex0) / tap, ey0, azl - ez0 - .008 - .03, R[0] * .6, R[1] * .6, R[2] * .5); if (ei < d + .002) p = 'oreja_int'; } } }
    if (!(d < hd + .025)) p = prevP; d = smin(hd, d, .1);
  }
  return [d + bulto(x, y, z, .012), p];
}
// forma simplificada para sombras y oclusión
function perroSombra(x, y, z, P) { const az = Math.abs(z); let d = sdEll(x - .2, y - .66, az, .34, .28 * P.ch, .2 * P.w); d = smin(d, sdEll(x + .27, y - .61, az, .3, .25, .19 * P.w), .14); d = Math.min(d, cap(x, y, az, .3, .56, .12 * P.w, .31, .06, .12 * P.w, P.lg * 1.3), cap(x, y, az, -.4, .5, .15 * P.w, -.43, .06, .15 * P.w, P.lg * 1.1), sph(x, y, az, .8, P.hy, 0, .26 * (P.sk[0] / .2)), cap(x, y, az, .4, .72, 0, .6, P.hy, 0, P.nk)); return d; }
module.exports = { perro, perroSombra, RAZAS };
