'use strict';
// ESCENA 'fondo_marino' · ¿Y si te hundieras en el fondo marino? Humanos vs. ballenas · 83 s sincronizados con la voz
// SDF / ray marching bajo el agua: buzo a pulmón, cachalote, zifio de Cuvier y traje rígido (atmosférico).
// Límites de escena en B (de proyectos/fondo_marino/salida/timeline.json). Eje y = altura; profundidad = -y (m).
const M = require('../motor');
const { clamp, mix, sstep, n2, n3, fbm2, smin, sdEll, sdCap, sdRC } = M;
const B = [0, 4.19, 10.21, 26.73, 30.91, 39.68, 45.84, 52.6, 57.01, 60.23, 67.1, 70.6, 75.31, 83.04];
const SUN = (() => { const v = [0.22, 0.95, 0.18], l = Math.hypot(...v); return v.map(a => a / l); })();
const nrm = v => { const l = Math.hypot(...v) || 1; return v.map(a => a / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sdSph = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
function sdRBox(px, py, pz, cx, cy, cz, hx, hy, hz, r) { const qx = Math.abs(px - cx) - hx, qy = Math.abs(py - cy) - hy, qz = Math.abs(pz - cz) - hz; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; }

// ---------------- cachalote (cabeza hacia +x; cuerpo ~17 m a escala 1) ----------------
function sdCachalote(x, y, z, tm, mo) {
  const k = clamp(-x / 9, 0, 1.4), off = .85 * Math.pow(k, 1.5) * Math.sin(tm * 1.5 + x * .42); y -= off;
  let best = 1e9, nm = '';
  const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  const az = Math.abs(z);
  const cab = sdRBox(x, y, z, 3.9, .45, 0, 2.0, .95, .7, .95);
  const cuerpo = smin(sdRC(x, y, z, 1.0, 0, 0, -4, -.1, 0, 1.7, 1.3), sdRC(x, y, z, -4, -.1, 0, -10, 0, 0, 1.3, .36), 1.2);
  let d = smin(cab, cuerpo, .8);
  const mand = sdEll(x - 3.3, y + 1.28, z, 2.5, .38, .42); put(mand, 'mandibula'); d = smin(d, mand, .25);
  d = smin(d, sdEll(x + 5.4, y - 1.15, z, .95, .5, .3), .5);
  for (let i = 0; i < 3; i++) d = smin(d, sdEll(x + 7.1 + i * .85, y - (.82 - i * .2), z, .42, .22, .14), .25);
  put(d, 'cuerpo');
  put(sdEll(x + 10.3 + .3 * az, y, az - 1.3, .85, .09, 1.6) * .8, 'cola');
  put(sdEll(x - 2.2, y + 1.35, az - 1.6, .95, .1, .45), 'aleta');
  put(sdSph(x, y, az, 1.15, -.12, 1.62, .1), 'ojo');
  if (mo) mo.m = nm; return best;
}
// ---------------- zifio de Cuvier (cabeza hacia +x; ~6,5 m) ----------------
function sdZifio(x, y, z, tm, mo) {
  const k = clamp(-x / 3.2, 0, 1.4), off = .32 * Math.pow(k, 1.5) * Math.sin(tm * 1.7 + x * 1.1); y -= off;
  let best = 1e9, nm = ''; const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  const az = Math.abs(z);
  let d = smin(sdRC(x, y, z, 1.7, 0, 0, -.4, -.02, 0, .5, .74), sdRC(x, y, z, -.4, -.02, 0, -2.7, 0, 0, .74, .3), .6);
  d = smin(d, sdEll(x - 2.1, y - .22, z, .7, .5, .44), .35);
  d = smin(d, sdCap(x, y, z, 2.6, -.04, 0, 3.15, -.12, 0, .12), .15);
  d = smin(d, sdCap(x, y, z, 2.55, -.24, 0, 3.05, -.2, 0, .075), .1);
  d = smin(d, sdCap(x, y, z, -2.7, 0, 0, -3.3, .02, 0, .1), .2);
  put(d, 'cuerpo');
  put(sdEll(x + 1.55 + .6 * (y - .6), y - .82, z, .26, .3, .045), 'aleta');
  put(sdEll(x - .95, y + .45, az - .5, .36, .04, .17), 'aleta');
  put(sdEll(x + 3.4 + .3 * az, y, az - .4, .36, .05, .52) * .8, 'cola');
  put(sdSph(x, y, az, 1.62, -.03, .42, .04), 'ojo');
  put(sdSph(x, y, az, 3.1, -.3, .06, .03), 'diente');
  if (mo) mo.m = nm; return best;
}
// ---------------- buzo a pulmón (eje x = de pies a cabeza; ventral = -y) ----------------
function sdBuzo(x, y, z, tm, mo, brazos = 1) {
  const kk = Math.sin(tm * 2.6), az = Math.abs(z), sg = z >= 0 ? 1 : -1, ph = kk * (sg > 0 ? 1 : -1) * .5 + kk * .5;
  let best = 1e9, nm = ''; const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  let d = smin(sdEll(x - .2, y, z, .4, .155, .21), sdEll(x + .14, y, z, .24, .14, .18), .12);
  d = smin(d, sdCap(x, y, z, .42, 0, 0, .6, 0, 0, .06), .08);
  put(d, 'traje');
  put(sdSph(x, y, z, .7, 0, 0, .105), 'piel');
  put(sdEll(x - .76, y + .035, z, .06, .06, .11), 'mascara');
  // brazos extendidos hacia delante
  const sx = brazos ? 1 : 0;
  put(sdCap(x, y, az, .42, 0, .21, .9, -.02, .1, .055), 'traje'); put(sdCap(x, y, az, .9, -.02, .1, 1.25, -.02, .06, .045), 'traje'); put(sdSph(x, y, az, 1.3, -.02, .055, .05), 'piel');
  // piernas con patada
  const yk = .2 * kk * (sg > 0 ? 1 : -.6), ya = .34 * kk * (sg > 0 ? 1 : -.6);
  put(smin(sdCap(x, y, az, -.1, 0, .09, -.55, yk, .085, .085), sdCap(x, y, az, -.55, yk, .085, -.98, ya, .08, .062), .1), 'traje');
  put(sdEll(x + 1.2, y - ya - .0, az - .09, .3, .018, .1), 'aleta');
  if (mo) mo.m = nm; return best;
}
// ---------------- traje rígido (atmosférico). x = pies→cabeza; frente = -y ----------------
function sdAds(x, y, z, tm, mo) {
  const az = Math.abs(z); let best = 1e9, nm = ''; const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  put(smin(sdCap(x, y, z, -.12, 0, 0, .52, 0, 0, .27), sdEll(x - .2, y + .02, z, .45, .3, .3), .08), 'metal');
  put(sdSph(x, y, z, .8, 0, 0, .21), 'metal');
  put(sdSph(x, y, z, .82, -.15, 0, .1), 'vidrio');
  put(sdEll(x - .2, y - .33, z, .35, .17, .24), 'metal2');
  for (const s of [-1, 1]) {
    const zz = s * .33;
    put(sdSph(x, y, z, .5, 0, zz, .13), 'junta');
    put(sdCap(x, y, z, .5, 0, zz, .16, .0, zz * 1.15, .1), 'metal'); put(sdSph(x, y, z, .16, 0, zz * 1.15, .105), 'junta');
    put(sdCap(x, y, z, .16, 0, zz * 1.15, .02, -.34, zz, .085), 'metal'); put(sdSph(x, y, z, .0, -.38, zz, .075), 'junta');
    put(sdCap(x, y, z, -.12, 0, s * .15, -.55, 0, s * .16, .115), 'metal'); put(sdSph(x, y, z, -.55, 0, s * .16, .125), 'junta');
    put(sdCap(x, y, z, -.55, 0, s * .16, -.98, 0, s * .16, .11), 'metal');
    put(sdEll(x + 1.05, y + .08, z - s * .16, .12, .2, .1), 'metal2');
    put(sdSph(x, y, z, .87, -.1, s * .19, .04), 'foco');
  }
  if (mo) mo.m = nm; return best;
}
const KIND = { cachalote: sdCachalote, zifio: sdZifio, buzo: sdBuzo, ads: sdAds };

// ---------------- entidades ----------------
function orient(f, back) { const ex = nrm(f), ey = nrm(back), ez = cross(ex, ey); return [ex, ey, ez]; }
const lat = f => nrm(cross([0, 0, 1], f));                      // lomo del buzo hacia el lado
function ent(kind, pos, f, back, s, br, tm, extra = {}) { const [ex, ey, ez] = orient(f, back || lat(f)); return Object.assign({ kind, pos, ex, ey, ez, s, br: br * s, tm }, extra); }
const D1 = t => { const f = nrm([.16 * Math.cos(.4 * t) + .1, -1, 0]); return ent('buzo', [.4 * Math.sin(.4 * t), -(10 + 1.0 * t), 0], f, null, 1, 1.9, t); };
const C1 = t => ent('cachalote', [5.5 + .15 * (t - 4), -(9 + 2.6 * (t - 3.8)), -7], nrm([.07, -1, 0]), null, .82, 10.5, t);
const Z1 = t => ent('zifio', [1.2, -(520 + 2.0 * (t - 26.7)), 0], nrm([.12, -1, 0]), null, 1, 4.2, t);
const C2 = t => ent('cachalote', [0 + .1 * (t - 39.68), -(800 + 1.5 * (t - 39.68)), -2], nrm([.1, -1, 0]), null, .85, 10.5, t);
const Z2 = t => ent('zifio', [.2 * Math.sin(t * .3), -(2988 + .9 * (t - 45.84)), 0], nrm([.1, -1, 0]), null, 1, 4.2, t);
const D2 = t => ent('buzo', [0, -(209 + 1.2 * (t - 52.6)), 0], nrm([.1, -1, 0]), null, 1, 1.9, t);
const A1 = t => ent('ads', [0, -(705 + .35 * Math.sin(t * .8)), 0], [0, 1, 0], [0, 0, -1], 1, 1.7, t);
const D3 = t => { const f = nrm([.1, -1, 0]); return ent('buzo', [-1.2 + .15 * (t - 70.6), -(11.5 + .4 * (t - 70.6)), 0], f, null, 1, 1.9, t); };
const Z3 = t => ent('zifio', [1.5 + .22 * (t - 70.6), -(14.0 + .4 * (t - 70.6)), -1.2], nrm([.08, -1, 0]), null, 1, 4.2, t);
function entidades(t) {
  const a = [];
  if (t < 13) a.push(D1(t)); else if (t < 32) a.push(D1(t));
  if (t > 3 && t < 12) a.push(C1(t));
  if (t > 25 && t < 40.5) a.push(Z1(t));
  if (t > 38 && t < 47) a.push(C2(t));
  if (t > 44 && t < 71) a.push(Z2(t));
  if (t > 51 && t < 58.5) a.push(D2(t));
  if (t > 65 && t < 72) a.push(A1(t));
  if (t > 69.5) { a.push(D3(t)); a.push(Z3(t)); }
  return a;
}
// ---------------- cámara ----------------
const add = (a, b) => a.map((v, i) => v + b[i]), sc3 = (a, k) => a.map(v => v * k);
const orb = (c, r, a, h) => [c[0] + r * Math.sin(a), c[1] + h, c[2] + r * Math.cos(a)];
const camas = [
  t => { const u = sstep(0, 1, (t - B[0]) / (B[1] - B[0])), d = D1(t).pos; return { eye: [mix(4.2, 4, u) + d[0], d[1] + mix(-5, 1.0, u), mix(6.8, 8.5, u)], target: [d[0] * .5, d[1] + mix(1.7, .8, u), 0], fov: mix(66, 54, u) }; },
  t => { const u = (t - B[1]) / (B[2] - B[1]), d = D1(t).pos, c = C1(t).pos; return { eye: [mix(-3, 3, u), d[1] + 1.0, 19], target: [1.5, (d[1] + c[1]) / 2 + .6, -3], fov: 60 }; },
  t => { const u = (t - B[2]) / (B[3] - B[2]), d = D1(t).pos, a = mix(.2, 1.35, u); return { eye: add(d, [6.4 * Math.sin(a), 1.1, 6.4 * Math.cos(a)]), target: add(d, [0, -.35, 0]), fov: mix(52, 48, u) }; },
  t => { const u = (t - B[3]) / (B[4] - B[3]), z = Z1(t).pos; return { eye: add(z, [mix(4.5, 7, u), mix(6.5, 1.5, u), mix(11, 12, u)]), target: add(z, [0, -1.2, 0]), fov: 54 }; },
  t => { const u = (t - B[4]) / (B[5] - B[4]), z = Z1(t).pos, a = mix(.55, 1.5, u); return { eye: add(z, [11 * Math.sin(a), 1.2, 11 * Math.cos(a)]), target: add(z, [0, -.8, 0]), fov: 50 }; },
  t => { const u = (t - B[5]) / (B[6] - B[5]), c = C2(t).pos; return { eye: [c[0] + mix(7, -4, u), c[1] + mix(3, -1, u), 17], target: [c[0], c[1] - .5, c[2]], fov: 58 }; },
  t => { const u = (t - B[6]) / (B[7] - B[6]), z = Z2(t).pos; return { eye: [z[0] + mix(5.5, 2.5, u), z[1] + mix(2.2, .5, u), 11.5], target: [z[0], z[1] - .2, z[2]], fov: mix(56, 50, u) }; },
  t => { const u = (t - B[7]) / (B[8] - B[7]), d = D2(t).pos; return { eye: add(d, [mix(5.5, 3.6, u), mix(1.2, .5, u), mix(6, 5, u)]), target: add(d, [0, -.2, 0]), fov: 52 }; },
  t => { const u = sstep(0, 1, (t - B[8]) / (B[9] - B[8])), y = -(224 + (2989 - 224) * u); return { eye: [2, y, 13.5], target: [-1.5, y - 7, 0], fov: 54 }; },
  t => { const u = (t - B[9]) / (B[10] - B[9]), z = Z2(t).pos, a = mix(.35, 1.3, u); return { eye: add(z, [12.5 * Math.sin(a), 1.3, 12.5 * Math.cos(a)]), target: add(z, [.3, 0, 0]), fov: 52 }; },
  t => { const u = (t - B[10]) / (B[11] - B[10]), p = A1(t).pos, a = mix(-.55, .85, u); return { eye: add(p, [5.6 * Math.sin(a), .35, 5.6 * Math.cos(a)]), target: add(p, [0, .2, 0]), fov: 50 }; },
  t => { const u = (t - B[11]) / (B[12] - B[11]), d = D3(t).pos; return { eye: [mix(6, 3, u) + d[0], d[1] + mix(-4, .5, u), mix(11, 10.5, u)], target: [d[0] + 1.5, d[1] - 1.6 + mix(1.4, 0, u), -.5], fov: mix(64, 58, u) }; },
  t => { const u = sstep(0, 1, (t - B[12]) / (B[13] - B[12])), d = D3(t).pos; return { eye: [d[0] + mix(3, 5, u), d[1] + mix(.5, 3, u), mix(10.5, 19, u)], target: [d[0] + 1.5, d[1] - 1.6 + mix(0, 1.5, u), -.5], fov: mix(58, 60, u) }; },
];
const W = [0, .9, .9, 1.5, .9, .8, 1.6, 1.0, 1.0, 1.0, .9, .9, .9, 0];
const mixc = (a, b, k) => ({ eye: a.eye.map((v, i) => mix(v, b.eye[i], k)), target: a.target.map((v, i) => mix(v, b.target[i], k)), fov: mix(a.fov, b.fov, k) });
function camara(t) {
  let k = 0; while (k < B.length - 2 && t >= B[k + 1]) k++;
  let c = camas[k](t);
  const w1 = W[k + 1]; if (k + 1 < camas.length && t > B[k + 1] - w1) c = mixc(c, camas[k + 1](t), sstep(B[k + 1] - w1, B[k + 1] + w1, t));
  else if (k > 0 && t < B[k] + W[k]) c = mixc(camas[k - 1](t), c, sstep(B[k] - W[k], B[k] + W[k], t));
  return c;
}
// ---------------- iluminación del agua ----------------
const lampara = (t, ey) => { const d = -ey; let p = sstep(70, 260, d); if (t > 57.0 && t < 59.35) p *= sstep(59.35, 59.0, t) * .0 + (t < 58.9 ? 0 : sstep(58.9, 59.35, t)); return p; };
const fogColor = D => { const e = Math.exp(-Math.max(0, D) / 52); return [.0006 + .06 * e, .002 + .26 * e, .005 + .4 * e]; };

const E = {
  prepara(t) {
    const c = camara(t), en = entidades(t);
    return { t, ents: en, eye: c.eye, target: c.target, fov: c.fov, far: 70, lamp: lampara(t, c.eye[1]), D: -c.eye[1], pasos: 150 };
  },
  map(sc, x, y, z, sombras) {
    let d = 1e9;
    for (const e of sc.ents) {
      const dx = x - e.pos[0], dy = y - e.pos[1], dz = z - e.pos[2], b = Math.hypot(dx, dy, dz) - e.br;
      if (b > .35) { if (b < d) d = b; continue; }
      const q = [(dx * e.ex[0] + dy * e.ex[1] + dz * e.ex[2]) / e.s, (dx * e.ey[0] + dy * e.ey[1] + dz * e.ey[2]) / e.s, (dx * e.ez[0] + dy * e.ez[1] + dz * e.ez[2]) / e.s];
      const di = KIND[e.kind](q[0], q[1], q[2], e.tm) * e.s; if (di < d) d = di;
    }
    return d;
  },
  cielo(sc, dx, dy, dz) {
    const D = sc.D, fc = fogColor(D), up = clamp(dy * .5 + .5, 0, 1);
    let c = fc.map(v => v * (.55 + .85 * up));
    if (dy > .05 && D < 90) {
      const T = D / dy, sx = sc.eye[0] + dx * T, sz = sc.eye[2] + dz * T;
      const ripple = .75 + .5 * n2(sx * .55 + sc.t * .35, sz * .55 - sc.t * .2) + .25 * n2(sx * 1.7 - sc.t * .6, sz * 1.7);
      const win = sstep(.35, .9, dy);                             // ventana de Snell
      const lum = Math.exp(-T * .02) * Math.exp(-D / 160);
      const s = [.45, 1.05, 1.35].map(v => v * ripple * win * lum * (.8 + .5 * n2(sx * .25 + 3, sz * .25)));
      c = c.map((v, k) => v + s[k]);
      // rayos de luz
      const az = Math.atan2(dx, dz), ray = Math.pow(Math.max(0, n2(az * 7 + sc.t * .1, dy * 6)), 2) * Math.exp(-D / 45) * sstep(.3, .9, dy) * .22;
      c = c.map((v, k) => v + ray * [.25, .7, .9][k]);
    }
    return c;
  },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) {
    let best = 1e9, en = null;
    for (const e of sc.ents) {
      const ddx = x - e.pos[0], ddy = y - e.pos[1], ddz = z - e.pos[2]; if (Math.hypot(ddx, ddy, ddz) - e.br > .4) continue;
      const q = [(ddx * e.ex[0] + ddy * e.ex[1] + ddz * e.ex[2]) / e.s, (ddx * e.ey[0] + ddy * e.ey[1] + ddz * e.ey[2]) / e.s, (ddx * e.ez[0] + ddy * e.ez[1] + ddz * e.ez[2]) / e.s];
      const di = KIND[e.kind](q[0], q[1], q[2], e.tm) * e.s; if (di < best) { best = di; en = { e, q }; }
    }
    if (!en) return [0, 0, 0];
    const { e, q } = en, mo = {}; KIND[e.kind](q[0], q[1], q[2], e.tm, mo); const m = mo.m, [lx, ly, lz] = q;
    let alb = [.3, .3, .3], esp = 0, emi = 0, dur = 20;
    if (e.kind === 'cachalote') {
      const w = .5 + .5 * Math.sin(lx * 9 + 3 * n3(lx * 1.3, ly * 1.3, lz * 1.3)), fino = n3(lx * 8, ly * 8, lz * 8), rasg = n3(lx * 1.8, ly * 14, lz * 1.8);
      const g = .2 + .06 * fino + .035 * w * (lx < 1.2 ? 1 : .5); alb = [g * 1.08, g * 1.02, g * .98];
      if (ly < -.3 - .2 * Math.abs(lz)) alb = alb.map(v => v * 1.35);
      if (m === 'mandibula') alb = [.55, .52, .47]; if (m === 'ojo') alb = [.02, .02, .02];
      if (rasg > .72) alb = alb.map(v => mix(v, .5, .5));                                    // cicatrices
      if (m === 'cola' || m === 'aleta') alb = alb.map(v => v * .85);
      esp = .12; dur = 25;
    } else if (e.kind === 'zifio') {
      const fino = n3(lx * 10, ly * 10, lz * 10), rasg = n3(lx * 9, ly * 30, lz * 6);
      const cab = sstep(1.0, 2.2, lx), dorsal = sstep(-.05, .45, ly);
      const base = [.15 + .05 * fino, .125 + .04 * fino, .1 + .035 * fino];
      alb = base.map((v, k) => mix(v * (.8 + .5 * dorsal), [.42, .36, .28][k], cab * .7));
      if (rasg > .84) alb = alb.map(v => mix(v, .6, .5));                                  // arañazos blancos
      const ojo = Math.hypot(lx - 1.62, ly + .03, Math.abs(lz) - .42); alb = alb.map(v => v * (1 - .65 * sstep(.2, .06, ojo) * (m === 'cuerpo' ? 1 : 0)));
      if (m === 'ojo') alb = [.015, .015, .015]; if (m === 'diente') alb = [.85, .8, .7];
      esp = .1;
    } else if (e.kind === 'buzo') {
      alb = [.025, .028, .035]; esp = .35; dur = 40;
      if (m === 'traje') { const band = Math.sin(lx * 14) > .86 && lx > -.35 && lx < .55; if (band) alb = [.7, .55, .08]; }
      if (m === 'piel') alb = [.55, .36, .26]; if (m === 'mascara') alb = [.01, .02, .03]; if (m === 'aleta') alb = [.95, .75, .05];
    } else {
      alb = [.9, .36, .03]; esp = .7; dur = 60;
      if (m === 'metal2') alb = [.55, .55, .56]; if (m === 'junta') alb = [.18, .18, .19]; if (m === 'vidrio') { alb = [.01, .04, .06]; esp = 1.2; dur = 120; }
      if (m === 'foco') { alb = [1, 1, .9]; emi = 6; }
    }
    const dp = Math.max(0, -y), L = 1.1;
    const sunC = [3.0 * Math.exp(-dp * .27 * L), 2.7 * Math.exp(-dp * .062 * L), 2.5 * Math.exp(-dp * .032 * L)];
    const skyC = [.04 * Math.exp(-dp * .2), .22 * Math.exp(-dp / 60), .36 * Math.exp(-dp / 80)];
    const ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]), cau = dp < 40 ? 1 + .45 * (n3(x * 1.4 + sc.t * .5, z * 1.4, sc.t * .4) - .45) * Math.exp(-dp / 22) : 1;
    const sky = .5 + .5 * ny;
    let c = [0, 1, 2].map(k => alb[k] * (sunC[k] * ndl * cau + skyC[k] * sky));
    // ¿especular del sol?
    if (esp && ndl > 0) { const hx = SUN[0] - dx, hy = SUN[1] - dy, hz = SUN[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, s = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), dur); c = c.map((v, k) => v + esp * s * sunC[k] * .5); }
    // lámpara del vehículo (cerca de la cámara)
    if (sc.lamp > 0) {
      const lx2 = sc.eye[0] + .6 - x, ly2 = sc.eye[1] + .4 - y, lz2 = sc.eye[2] - z, ld = Math.hypot(lx2, ly2, lz2), l0 = lx2 / ld, l1 = ly2 / ld, l2 = lz2 / ld;
      const nl = Math.max(0, nx * l0 + ny * l1 + nz * l2), I = sc.lamp * 7.5 / (1 + Math.pow(ld / 10, 2));
      const ab = [Math.exp(-ld * .07), Math.exp(-ld * .04), Math.exp(-ld * .035)];
      const hx = l0 - dx, hy = l1 - dy, hz = l2 - dz, hl = Math.hypot(hx, hy, hz) || 1, sp = esp * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), dur);
      c = c.map((v, k) => v + (alb[k] * nl + sp) * I * ab[k] * [1, 1, 1][k]);
    }
    if (emi) c = c.map(v => v + emi);
    // niebla del agua (más oscura y azul con la profundidad)
    const fc = fogColor(sc.D), sig = .032 + .02 * sstep(30, 120, sc.D), f = 1 - Math.exp(-T * sig), ab2 = [Math.exp(-T * .08), Math.exp(-T * .03), Math.exp(-T * .02)];
    const lampHaze = sc.lamp * (1 - Math.exp(-T * .09)) * .035;
    return c.map((v, k) => mix(v * ab2[k], fc[k], f) + lampHaze * [.4, .75, 1][k]);
  },
};
// ---------------- anclas 2D (las usa el overlay) ----------------
function proyectar(cam, p) {
  const [ex, ey, ez] = cam.eye, [tx, ty, tz] = cam.target; let fx = tx - ex, fy = ty - ey, fz = tz - ez; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const vx = p[0] - ex, vy = p[1] - ey, vz = p[2] - ez, zf = vx * fx + vy * fy + vz * fz, xr = vx * rx + vz * rz, yu = vx * ux + vy * uy + vz * uz;
  const foc = 960 / Math.tan(cam.fov * Math.PI / 360); if (zf < .1) return { x: -999, y: -999, k: 0 };
  return { x: 540 + xr / zf * foc, y: 960 - yu / zf * foc, k: foc / zf };
}
function anclas(t) {
  const cam = camara(t), en = entidades(t), o = { depth: -cam.target[1], eyeDepth: -cam.eye[1], lamp: lampara(t, cam.eye[1]) };
  const pt = (e, l) => proyectar(cam, add(e.pos, sc3(add(add(sc3(e.ex, l[0]), sc3(e.ey, l[1])), sc3(e.ez, l[2])), e.s)));
  for (const e of en) {
    const n = e.kind + (e.pos[1] > -60 && e.kind === 'buzo' ? (t > 60 ? '3' : '1') : e.kind === 'buzo' ? '2' : '');
    const nombre = e.kind === 'buzo' ? (t < 40 ? 'buzo1' : t < 60 ? 'buzo2' : 'buzo3') : e.kind === 'cachalote' ? (t < 20 ? 'cach1' : 'cach2') : e.kind === 'zifio' ? (t < 45 ? 'zif1' : t < 70 ? 'zif2' : 'zif3') : 'ads';
    o[nombre] = e.kind === 'buzo' ? { pecho: pt(e, [.25, 0, 0]), cabeza: pt(e, [.75, 0, 0]), pies: pt(e, [-1, 0, 0]), sup: proyectar(cam, [e.pos[0], 0, e.pos[2]]) }
      : e.kind === 'cachalote' ? { cabeza: pt(e, [5.5, 1.0, 0]), cola: pt(e, [-9, 0, 0]), centro: pt(e, [0, 0, 0]) }
      : e.kind === 'zifio' ? { cabeza: pt(e, [2.2, .4, 0]), cola: pt(e, [-3, 0, 0]), centro: pt(e, [0, 0, 0]) }
      : { centro: pt(e, [.3, 0, 0]), cabeza: pt(e, [.9, 0, 0]) };
  }
  return o;
}
E.camara = camara; E.anclas = anclas; E.B = B;
E.info = { titulo: '¿Y si te hundieras en el fondo marino?', seg: 83.04, letrero_s: 76.3 };
module.exports = E;
