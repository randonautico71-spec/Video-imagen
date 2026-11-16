'use strict';
// ESCENA 'reyes_sabana' · ¿Quién es el rey de la sabana? Leones (roca, coalición), hienas (clan) y elefantes (matriarca)
// 88 s sincronizados con la voz: límites de escena en B (vienen de proyectos/reyes_sabana/salida/timeline.json)
const M = require('../motor');
const { clamp, mix, sstep, fract, h2, n2, n3, fbm2, voro3, cuadrupedo, sdAnimal, primCercana, sombra, sdEll, sdCap } = M;
const SUN = (() => { const v = [0.62, 0.27, 0.74], l = Math.hypot(...v); return v.map(a => a / l); })();
const B = [0, 4.39, 11.99, 27.57, 31.99, 54.53, 59.57, 80.39, 88.16];
const ROCA = [-14, -9.5, 1.35];
const roca = (x, z) => ROCA[2] * sstep(3.3, 1.2, Math.hypot(x - ROCA[0], z - ROCA[1]) * (1 + .12 * Math.sin(Math.atan2(z - ROCA[1], x - ROCA[0]) * 3)));
const sueloH = (x, z) => .12 * Math.sin(x * .3 + 1) * Math.cos(z * .25) + .06 * Math.sin(x * .9 + z * .7) + roca(x, z);
// ---- árboles periódicos (acacias) en celdas de 30 m; no caen sobre las calles de los animales
const CEL = 30, CALLES = [0, -16, -34, 8.5, -9.5, -22, -24];
const CACHE = new Map();
function arbolDe(ix, iz) { const k = ix * 4096 + iz; let r = CACHE.get(k); if (r === undefined) { r = arbolDe0(ix, iz); CACHE.set(k, r); } return r; }
function arbolDe0(ix, iz) {
  const r = h2(ix * 3.1 + 7, iz * 5.7 + 1); if (r < .25) return null;
  const x = (ix + .5) * CEL + (h2(ix, iz + 9) - .5) * 16, z = (iz + .5) * CEL - 8 + (h2(ix + 4, iz) - .5) * 16;
  if (CALLES.some(c => Math.abs(z - c) < 7) || Math.hypot(x - ROCA[0], z - ROCA[1]) < 8) return null;
  return [x, z, .9 + .5 * h2(ix + 2, iz + 3)];
}
function acacia(x, y, z, cap = true) {
  const ix = Math.floor(x / CEL), iz = Math.floor((z + 8) / CEL);
  const lim = cap ? Math.min(x - ix * CEL, (ix + 1) * CEL - x, z + 8 - iz * CEL, (iz + 1) * CEL - z - 8) + 3 : 1e9;
  const t = arbolDe(ix, iz); if (!t) return lim;
  const [ax, az, s] = t; const b = Math.hypot(x - ax, z - az) - 3.6 * s; if (b > 1.5) return Math.min(b, lim);
  let e = sdCap(x, y, z, ax, -.2, az, ax + .3 * s, 2.2 * s, az, .16 * s);
  e = Math.min(e, sdCap(x, y, z, ax + .3 * s, 2.2 * s, az, ax - .9 * s, 3.0 * s, az + .3 * s, .09 * s));
  e = Math.min(e, sdCap(x, y, z, ax + .3 * s, 2.2 * s, az, ax + 1.3 * s, 3.0 * s, az - .2 * s, .09 * s));
  const cp = sdEll(x - ax - .2 * s, y - 3.25 * s, z - az, 2.5 * s, .38 * s, 2.1 * s) - .12 * n2(x * 2.5, z * 2.5);
  return Math.min(e, cp * .8, lim);
}
// ---- grupos (todos caminan hacia +x a velocidad constante para que los pies no patinen)
const VL = 1.0, VH = 1.0, VE = .88;
const Wc = t => [VL * t - 21.5, 0, .2], Hc = t => [VH * t - 9, 0, -16], Ec = t => [VE * t - 12, 0, -34];
function animales(t) {
  const L = Wc(t), H = Hc(t), El = Ec(t), a = [];
  const o = (v, y0) => ({ v, suelo: sueloH, y0 });
  a.push(cuadrupedo('leon', ROCA[0], ROCA[1], t, .3, 1.12, { quieto: true, suelo: sueloH, y0: ROCA[2] }));
  const m = (dx, dz, e, ph, mel = true) => a.push(cuadrupedo('leon', L[0] + dx, L[2] + dz, t, ph, e, { v: VL, suelo: sueloH, melena: mel }));
  m(1.8, -.9, 1.05, 0); m(-.6, .5, 1.0, 1.7); m(-2.5, -.1, 1.02, 3.2);
  m(3.4, -2.6, .86, .8, false); m(-4.2, -2.3, .84, 2.5, false);
  const h = (dx, dz, e, ph) => a.push(cuadrupedo('hiena', H[0] + dx, H[2] + dz, t, ph, e, { v: VH, suelo: sueloH }));
  h(2.4, -.4, .98, 0); h(.3, .7, .86, 1.9); h(-1.6, -.5, .84, 3.3); h(.9, -.3, .5, 4.4); h(-.4, -1.3, .46, .9); h(-3.4, .5, .82, 2.4);
  const e = (dx, dz, s, ph) => a.push(cuadrupedo('elefante', El[0] + dx, El[2] + dz, t, ph, s, { v: VE, suelo: sueloH }));
  e(2.8, -.2, 1.0, 0); e(-.6, .8, .88, 2.2); e(-3.4, -.6, .9, 4.1); e(-1.6, -.3, .5, 1.1); e(-5.8, .7, .84, 5.2);
  return a;
}
// ---- cámara por escenas
const camas = [
  (t) => { const u = clamp((t - B[0]) / (B[1] - B[0]), 0, 1); return { eye: [ROCA[0] + mix(5.8, 3.0, u), mix(2.3, 2.6, u), ROCA[1] + mix(3.8, 1.7, u)], target: [ROCA[0] + .7, 2.55 + .25 * u, ROCA[1]], fov: mix(44, 36, u) }; },
  (t) => { const w = Wc(t), u = clamp((t - B[1]) / (B[2] - B[1]), 0, 1); return { eye: [w[0] + mix(5.2, 3.2, u), 1.5, w[2] + mix(9.5, 8, u)], target: [w[0] - .2, 1.15, w[2]], fov: 52 }; },
  (t) => { const w = Wc(t), u = clamp((t - B[2]) / (B[3] - B[2]), 0, 1); return { eye: [w[0] + mix(4.4, 1.2, u), mix(1.2, 1.0, u), w[2] + mix(7.4, 5.4, u)], target: [w[0] - .1, 1.0, w[2]], fov: mix(50, 44, u) }; },
  (t) => { const w = Wc(t), h = Hc(t), u = clamp((t - B[3]) / (B[4] - B[3]), 0, 1), k = sstep(0, 1, u); return { eye: [mix(w[0] + 3, h[0] + 4, k), 1.3, mix(w[2] + 6, h[2] + 7, k)], target: [mix(w[0], h[0], k), 1.0, mix(w[2], h[2], k)], fov: 50 }; },
  (t) => { const h = Hc(t), u = clamp((t - B[4]) / (B[5] - B[4]), 0, 1); return { eye: [h[0] + mix(4.6, 1.8, u), mix(1.0, .75, u), h[2] + mix(7.8, 5.2, u)], target: [h[0] + .5, .85, h[2]], fov: mix(52, 42, u) }; },
  (t) => { const h = Hc(t), e = Ec(t), u = clamp((t - B[5]) / (B[6] - B[5]), 0, 1), k = sstep(0, 1, u); return { eye: [mix(h[0] + 4, e[0] + 6, k), mix(2.6, 1.9, k), mix(h[2] + 9, e[2] + 12, k)], target: [mix(h[0], e[0], k), 1.4, mix(h[2], e[2], k)], fov: 54 }; },
  (t) => { const e = Ec(t), u = clamp((t - B[6]) / (B[7] - B[6]), 0, 1); return { eye: [e[0] + mix(6, 3.5, u), mix(1.7, 2.1, u), e[2] + mix(12.5, 10, u)], target: [e[0] - .3, mix(1.6, 1.9, u), e[2]], fov: mix(56, 52, u) }; },
  (t) => { const e = Ec(t), u = clamp((t - B[7]) / (B[8] - B[7]), 0, 1); return { eye: [e[0] - mix(2, 8, u), mix(3.2, 7.5, u), e[2] + mix(13, 20, u)], target: [e[0] + 1, mix(1.8, 1.4, u), e[2]], fov: 58 }; },
];
const mixc = (a, b, k) => ({ eye: a.eye.map((v, i) => mix(v, b.eye[i], k)), target: a.target.map((v, i) => mix(v, b.target[i], k)), fov: mix(a.fov, b.fov, k) });
function camara(t) {
  const W = .9; let k = 0; while (k < B.length - 2 && t >= B[k + 1]) k++;
  let c = camas[k](t);
  if (k + 1 < camas.length && t > B[k + 1] - W) c = mixc(c, camas[k + 1](t), sstep(B[k + 1] - W, B[k + 1] + W, t));
  else if (k > 0 && t < B[k] + W) c = mixc(camas[k - 1](t), c, sstep(B[k] - W, B[k] + W, t));
  return c;
}
const E = {
  prepara(t) {
    const c = camara(t), an = animales(t), grupos = [[0, 1], [1, 6], [6, 12], [12, 17]].map(([a, b]) => { const A = an.slice(a, b); let cx = 0, cy = 0, cz = 0; for (const q of A) { cx += q.bx; cy += q.by; cz += q.bz; } cx /= A.length; cy /= A.length; cz /= A.length; let r = 0; for (const q of A) r = Math.max(r, Math.hypot(q.bx - cx, q.by - cy, q.bz - cz) + q.br); return { c: [cx, cy, cz], r: r + .2, an: A }; });
    return { t, an, grupos, eye: c.eye, target: c.target, fov: c.fov, far: 110 };
  },
  map(sc, x, y, z, sombras) {
    let d = sombras ? 1e9 : (y - sueloH(x, z)) * .9;
    if (!sombras) { const a = acacia(x, y, z, true); if (a < d) d = a; }
    for (const g of sc.grupos) { const dg = Math.hypot(x - g.c[0], y - g.c[1], z - g.c[2]) - g.r; if (dg > .3) { if (dg < d) d = dg; continue; } for (const an of g.an) { const da = sdAnimal(an, x, y, z); if (da < d) d = da; } }
    return d;
  },
  cielo(sc, dx, dy, dz) {
    const az = Math.atan2(dx, -dz), hill = .035 + .022 * Math.sin(az * 6 + 1) + .012 * Math.sin(az * 15) + .008 * Math.sin(az * 31);
    const tt = clamp(dy * 2.2, 0, 1);
    let c = [mix(1.25, .38, tt), mix(.78, .52, tt), mix(.42, .78, tt)];
    if (dy < hill && dy > -.2) c = [.62, .5, .5].map((v, k) => mix(v, c[k], .35));
    const s = Math.max(0, dx * SUN[0] + dy * SUN[1] + dz * SUN[2]); c = c.map((v, k) => v + Math.pow(s, 8) * [.4, .25, .1][k]);
    return c;
  },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) {
    let matAn = null, alb;
    const ds = (y - sueloH(x, z)) * .9, dacc = acacia(x, y, z, false);
    let best = Math.min(ds, dacc), an = null;
    for (const g of sc.grupos) { if (Math.hypot(x - g.c[0], y - g.c[1], z - g.c[2]) - g.r > .3) continue; for (const a of g.an) { const d = sdAnimal(a, x, y, z); if (d < best) { best = d; an = a; } } }
    if (an) {
      const q = primCercana(an, x, y, z), S = an.S, c = an.cab, m = q.m, lx = (x - an.ox) / an.s, ly = (y - an.oy) / an.s, lz = (z - an.oz) / an.s;
      const pata = m === 'pata' || m === 'patab'; matAn = m; const nom = an.nombre;
      const fur = M.pelo(x - an.ox, y, z - an.oz), vol = n3(lx * 7, ly * 7, lz * 7);
      if (nom === 'leon') {
        alb = [mix(.4, .5, vol), mix(.25, .32, vol), mix(.1, .15, vol)];
        if (m === 'cuerpo' && ly < -S.bh * .5) alb = [.5, .38, .24];
        if (pata && ly < -.3) alb = [.44, .32, .19];
        if (m === 'melena') alb = [mix(.2, .38, vol), mix(.1, .2, vol), mix(.04, .09, vol)].map((v, k) => v * (.8 + .5 * n3(lx * 30, ly * 30, lz * 30)));
        if (m === 'hocico') alb = [.74, .56, .36];
        if (m === 'cabeza') alb = [.55, .36, .18];
        if (m === 'oreja') alb = [.3, .2, .12];
        if (m === 'borla') alb = [.12, .07, .04];
        if (m === 'cola' && lx < -.9) alb = [.55, .4, .24];
      } else if (nom === 'hiena') {
        const sz = pata ? 9 : 7, [f1, , id] = voro3(lx * sz, ly * sz, lz * sz), spot = sstep(.24, .17, f1 * (.8 + .4 * id));
        const base = [mix(.45, .55, vol), mix(.34, .42, vol), mix(.2, .26, vol)];
        alb = base.map(v => mix(v, .09, spot * (m === 'cuerpo' || m === 'pata' ? 1 : .4)));
        if (pata || m === 'patab') alb = [.22, .17, .12];
        if (m === 'crin') alb = [.28, .2, .12];
        if (m === 'hocico') alb = [.1, .085, .07];
        if (m === 'cabeza') alb = ly < c.hy - S.hh * .1 ? [.15, .12, .09] : [.5, .4, .27];
        if (m === 'oreja') alb = [.17, .13, .1];
        if (m === 'cola') alb = [.2, .15, .1];
      } else if (nom === 'elefante') {
        const wr = .5 + .5 * Math.sin((m === 'trompa' ? ly * 60 : lx * 40 + ly * 31) + 6 * n3(lx * 6, ly * 6, lz * 6));
        const g = mix(.2, .3, n3(lx * 5, ly * 5, lz * 5)) * (.92 + .1 * wr) * (.85 + .3 * n3(lx * 60, ly * 60, lz * 60));
        alb = [g * 1.05, g * .98, g * .93];
        const polvo = sstep(1.1, .05, y) * .45 + .05; alb = alb.map((v, k) => mix(v, [.52, .38, .25][k], polvo));
        if (m === 'oreja') alb = alb.map((v, k) => mix(v, [.55, .38, .36][k], .45 * (nx > 0 ? 0 : 1)));
        if (m === 'colmillo') alb = [.9, .86, .74];
        if (m === 'pezuna') alb = [.3, .26, .23];
        if (m === 'cola') alb = [.3, .26, .23];
      } else alb = [.5, .4, .3];
      if (m === 'ojo') alb = nom === 'elefante' ? [.05, .035, .03] : nom === 'hiena' ? [.08, .05, .02] : [.5, .33, .08];
      if (m === 'nariz') alb = nom === 'leon' ? [.3, .14, .12] : [.04, .035, .035];
      if (m === 'pezuna' && nom !== 'elefante') alb = [.04, .035, .035];
      if (!['ojo', 'nariz', 'pezuna', 'colmillo'].includes(m)) alb = alb.map(v => v * fur);
    } else if (dacc < ds) {
      alb = y > 2.6 ? [.12, .22, .07].map(v => v * (.7 + .6 * n3(x * 6, y * 6, z * 6))) : [.25, .18, .12];
    } else {
      const f = fbm2(x * .35, z * .35, 4), g = n2(x * 14, z * 3), tuft = n2(x * 2.2, z * 2.2);
      const gr = n2(x * 45, z * 9), fino = n2(x * 120, z * 120); alb = [mix(.5, .72, f) * (.7 + .5 * g) * (.8 + .4 * fino), mix(.37, .53, f) * (.7 + .5 * g) * (.8 + .4 * fino), mix(.15, .22, f) * (.8 + .4 * gr)];
      alb = alb.map(v => v * (1 - .3 * sstep(.62, .85, tuft)));
      const r = roca(x, z); if (r > .12) { const rr = .17 + .1 * n3(x * 3, y * 3, z * 3) + .08 * n3(x * 9, y * 9, z * 9); alb = [mix(alb[0], rr * 1.15, sstep(.1, .5, r)), mix(alb[1], rr * .9, sstep(.1, .5, r)), mix(alb[2], rr * .7, sstep(.1, .5, r))]; }
    }
    const ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);
    const sh = ndl > 0 ? sombra((a, b, c) => E.map(sc, a, b, c, true), x + nx * .02, y + ny * .02, z + nz * .02, SUN[0], SUN[1], SUN[2], 12, 20) : 0;
    const sky = .5 + .5 * ny, bounce = .5 - .5 * ny;
    const sunC = [3.0, 2.0, 1.0], skyC = [.2, .27, .42], bC = [.2, .13, .06];
    const ao = M.oclusion(map, x, y, z, nx, ny, nz);
    const cl = [-dx * .4, .8, -dz * .4], cn = Math.hypot(...cl), CL = cl.map(v => v / cn);
    const esp = matAn ? M.brillo(matAn, nx, ny, nz, dx, dy, dz, SUN) * sh : 0, cat = matAn ? M.brillo(matAn, nx, ny, nz, dx, dy, dz, CL) * .5 : 0;
    const c = [0, 1, 2].map(k => alb[k] * (sunC[k] * ndl * sh + (skyC[k] * sky + bC[k] * bounce) * ao) + esp * sunC[k] + cat * .7);
    const fog = 1 - Math.exp(-T * .0075), fc = E.cielo(sc, dx, Math.max(dy, .0), dz).map(v => v * .85);
    return c.map((v, k) => mix(v, fc[k], fog));
  },
};
E.info = { titulo: '¿Quién es el rey de la sabana?', seg: 88.2, letrero_s: 82 };
module.exports = E;
