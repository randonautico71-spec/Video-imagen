'use strict';
// Luna del tamaño de Júpiter — trazador analítico de esferas (CPU), unidades: Mm en el espacio, m en el suelo
const vm = require('vm'), fs = require('fs');
const KIT = '/home/claude/randonautico71-spec/video-imagen/kit-animaciones-3d/';
if (typeof globalThis.tierra !== 'function') {
  globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
  vm.runInThisContext(fs.readFileSync(KIT + 'estilos/motor3d.js', 'utf8'));
  vm.runInThisContext(fs.readFileSync(KIT + 'temas/planeta/modelo.js', 'utf8').replace('const mar = .5;', 'const mar = (globalThis.MAR||.5);'));
  vm.runInThisContext('Object.assign(globalThis,{norm,sub,mul,add,dot,cross,smooth,mix,clamp,fbm3,vnoise3,hash3,tierra,nube,luzCiudad,texN,rotX,rotY,rotZ})');
}
const G = globalThis, PI = Math.PI;
const { norm, sub, mul, add, dot, cross, smooth, mix, clamp, fbm3, vnoise3, hash3 } = G;
const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const rotYv = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
const SOLd = norm([-.75, .35, .55]);

// ---------- texturas ----------
function moonTex(n) {
  const maria = smooth(.46, .58, fbm3(n[0] * 2.2 + 5, n[1] * 2.2, n[2] * 2.2, 4));
  let a = .62 - .26 * maria + .1 * (fbm3(n[0] * 9, n[1] * 9, n[2] * 9, 4) - .5);
  for (const s of [10, 24]) { const p = [n[0] * s, n[1] * s, n[2] * s], i = p.map(Math.floor), f = [p[0] - i[0], p[1] - i[1], p[2] - i[2]];
    const hh = hash3(i[0] + 11, i[1] + 3, i[2]), c = [.25 + .5 * hash3(i[0], i[1], i[2] + 5), .25 + .5 * hash3(i[0] + 7, i[1], i[2]), .25 + .5 * hash3(i[0], i[1] + 9, i[2])];
    const d = Math.hypot(f[0] - c[0], f[1] - c[1], f[2] - c[2]), rad = .1 + .2 * hh;
    if (hh > .35) { if (d < rad) a -= .16 * (1 - d / rad); else if (d < rad + .05) a += .11 * (1 - (d - rad) / .05); } }
  return [a * 1.0, a * .98, a * .94];
}
function jupTex(n, rot) {
  const lat = n[1]; let ph = Math.atan2(n[2], n[0]) + rot + .35 * Math.sin(lat * 9);
  const turb = fbm3(Math.cos(ph) * 2.2 + lat * .5, lat * 13, Math.sin(ph) * 2.2, 5);
  let b = Math.sin(lat * 17 + 3.2 * (turb - .5)) * .5 + .5; b = smooth(.22, .78, b + .3 * (turb - .5));
  let c = [mix(.93, .66, b), mix(.84, .4, b), mix(.7, .24, b)];
  const z = smooth(.82, .96, Math.sin(lat * 9 + 1) * .5 + .5); c = [mix(c[0], .97, z * .6), mix(c[1], .94, z * .6), mix(c[2], .88, z * .6)];
  const belt = Math.exp(-Math.pow((Math.abs(lat) - .3) / .07, 2)); c = [mix(c[0], .5, belt * .5), mix(c[1], .3, belt * .5), mix(c[2], .2, belt * .5)];
  let dp = Math.atan2(n[2], n[0]) + rot - 1.0; dp = Math.atan2(Math.sin(dp), Math.cos(dp));
  const gx = dp / .42, gy = (lat + .27) / .1, g = gx * gx + gy * gy; if (g < 1.6) { const k = smooth(1.6, .5, g), sw = .5 + .5 * Math.sin(Math.atan2(gy, gx) * 3 + g * 6); c = [mix(c[0], .8 - .08 * sw, k), mix(c[1], .3 + .05 * sw, k), mix(c[2], .2, k)]; }
  const pol = smooth(.8, .97, Math.abs(lat)); c = [mix(c[0], .45, pol * .6), mix(c[1], .5, pol * .6), mix(c[2], .55, pol * .6)];
  return c;
}
function ioTex(n) {
  const f = fbm3(n[0] * 4 + 2, n[1] * 4, n[2] * 4, 5), g = fbm3(n[0] * 11, n[1] * 11, n[2] * 11, 4);
  let c = [mix(.95, .85, f), mix(.82, .45, f), mix(.3, .12, f)]; c = [mix(c[0], .97, smooth(.62, .75, g) * .7), mix(c[1], .95, smooth(.62, .75, g) * .7), mix(c[2], .9, smooth(.62, .75, g) * .7)];
  const p = n.map(v => v * 13), i = p.map(Math.floor), hh = hash3(i[0], i[1], i[2]);
  if (hh > .78) { const d = Math.hypot(p[0] - i[0] - .5, p[1] - i[1] - .5, p[2] - i[2] - .5); if (d < .22) c = [.12, .07, .05]; else if (d < .34) c = [.7, .22, .08]; }
  return c;
}
function earthCol(n, sol, o) {   // o: {mar, lava, t}
  G.MAR = o.mar || .5; const tx = G.tierra(n), dl = dot(n, sol), dif = smooth(-.1, .4, dl);
  const cl = G.nube(n), sombraN = G.nube(norm(add(n, mul(sol, .025)))) * .55, qd = G.texN(n), fino = tx.tierra ? .78 + .4 * fbm3(qd[0] * 34, qd[1] * 34, qd[2] * 34, 4) : 1;
  let s = tx.col.map(v => v / 255 * fino * (.03 + .97 * dif * (1 - sombraN)));
  if (tx.tierra && dl < -.04 && G.luzCiudad(n) && !(o.lava > .3)) { const k = smooth(-.04, -.25, dl) * (1 - cl) * (.6 + .4 * vnoise3(n[0] * 120, n[1] * 120, n[2] * 120)); s = [s[0] + 1.1 * k, s[1] + .75 * k, s[2] + .35 * k]; }
  s = s.map((v, k) => mix(v, (.03 + .97 * dif) * [.98, .99, 1][k], cl * .93 * (1 - (o.lava || 0))));
  if (o.lava > 0) { const q = G.texN(n), r1 = Math.abs(vnoise3(q[0] * 9, q[1] * 9, q[2] * 9) - .5) * 2, r2 = Math.abs(vnoise3(q[0] * 23 + 4, q[1] * 23, q[2] * 23) - .5) * 2, crack = smooth(.2, .0, Math.min(r1, r2 * 1.3)),
    hs = vnoise3(q[0] * 7 + 9, q[1] * 7, q[2] * 7), hot = smooth(.66, .78, hs); const e = o.lava * Math.min(1, crack * 1.2 + hot * 1.4), flick = .8 + .2 * Math.sin((o.t || 0) * 6 + hs * 40);
    s = s.map((v, k) => v * (1 - o.lava * .55) + e * flick * [2.4, .8, .12][k]); }
  return s;
}
// ---------- cuerpos ----------
function hitBody(b, o, d) {   // → {t, p, n, loc} | null
  if (b.k) {   // esferoide alargado (marea) con eje b.ax; transformamos al espacio unitario
    const ax = b.ax, e1 = norm(cross(ax, [0, 1, 0])), e2 = cross(ax, e1), a = b.R * (1 + b.k), bb = b.R / Math.sqrt(1 + b.k);
    const T = v => [dot(v, ax) / a, dot(v, e1) / bb, dot(v, e2) / bb], oc = sub(o, b.c), O = T(oc), D = T(d);
    const A = dot(D, D), B = dot(O, D), C = dot(O, O) - 1, disc = B * B - A * C; if (disc < 0) return null;
    const s = Math.sqrt(disc); let t = (-B - s) / A, t2 = (-B + s) / A;
    const loc = p => { const q = sub(p, b.c); return norm(q); };
    const mk = (t_) => { const P = add(o, mul(d, t_)), q = T(sub(P, b.c)), nl = [q[0] / a, q[1] / bb, q[2] / bb], n = norm(add(add(mul(ax, nl[0]), mul(e1, nl[1])), mul(e2, nl[2]))); return { t: t_, p: P, n, loc: loc(P) }; };
    if (b.cut) { const inW = P => { const q = sub(P, b.c); return dot(q, b.cut[0]) > 0 && dot(q, b.cut[1]) > 0; };
      const P1 = add(o, mul(d, t)); if (t > 0 && !inW(P1)) return mk(t);
      let best = null; for (const [nf, pf, ps] of [[b.cut[0], b.cut[1], 1], [b.cut[1], b.cut[0], 1]]) { const den = dot(d, nf); if (Math.abs(den) < 1e-9) continue; const tt = dot(sub(b.c, o), nf) / den; if (tt <= 0 || (best && tt > best.t)) continue; const P = add(o, mul(d, tt)), q = sub(P, b.c);
        if (dot(q, pf) < 0) continue; const qq = T(q); if (dot(qq, qq) > 1) continue; best = { t: tt, p: P, n: mul(nf, -Math.sign(den) * -1), loc: null, face: true, rho: Math.hypot(...q) / b.R }; }
      if (best) return best; const P2 = add(o, mul(d, t2)); if (t2 > 0 && !inW(P2)) { const r = mk(t2); r.back = true; return r; } return null; }
    if (t > 0) return mk(t); return null;
  }
  const oc = sub(o, b.c), B = dot(oc, d), C = dot(oc, oc) - b.R * b.R, disc = B * B - C; if (disc < 0) return null;
  const t = -B - Math.sqrt(disc); if (t <= 0) return null; const P = add(o, mul(d, t)), n = mul(sub(P, b.c), 1 / b.R); return { t, p: P, n, loc: n };
}
const lin = c => c.map(v => Math.pow(Math.max(0, v), 2.2) * 1.3);
function shadeBody(b, h, d, sol) {
  const rot = b.rot || 0; if (b.sol) sol = b.sol;
  if (b.type === 'sun') { const mu = Math.max(0, -dot(h.n, d)), l = .55 + .45 * Math.pow(mu, .6); return [1.0 * l, .9 * l, .68 * l].map(v => v * (b.bright || 8)); }
  if (h.face) { const r = h.rho; let c; if (r > .985) c = [.14, .1, .08]; else if (r > .55) c = L3([1, .55, .1], [.95, .18, .03], smooth(.55, .95, r)); else if (r > .2) c = L3([1, .85, .35], [1, .6, .12], smooth(.2, .55, r)); else c = [1, .97, .8];
    const glow = (r > .985 ? .2 : 1.2 + (1 - r) * .8) * (b.lava != null ? 1 : .6); return c.map((v, k) => v * glow * [1, 1, 1][k]); }
  let nl = rotYv(h.loc, -rot); if (b.tilt) { const c = Math.cos(b.tilt), s = Math.sin(b.tilt); nl = [nl[0], nl[1] * c - nl[2] * s, nl[1] * s + nl[2] * c]; } let alb, spec = 0;
  if (b.type === 'moon') alb = moonTex(nl); else if (b.type === 'jup') alb = jupTex(nl, rot); else if (b.type === 'io') alb = ioTex(nl);
  else if (b.type === 'mix') { const a1 = moonTex(nl), a2 = jupTex(nl, rot); alb = L3(a1, a2, b.mixk); } else alb = null;
  if (b.type === 'earth') { const s = earthCol(rotYv(h.loc, -rot), rotYv(sol, -rot), { mar: (b.mar && typeof b.mar === 'object') ? b.mar.base + b.mar.amp * Math.pow(dot(h.loc, b.mar.ax), 2) : b.mar, lava: b.lava || 0, t: b.t }), rim = Math.pow(1 - Math.max(0, -dot(h.n, d)), 3) * (.12 + .88 * smooth(-.2, .5, dot(h.n, sol)));
    return lin(s).map((v, k) => v + rim * [.18, .42, .9][k] * (b.lava ? 1 - b.lava * .7 : 1)); }
  const dl = dot(h.n, sol), dif = b.type === 'jup' || b.type === 'mix' ? smooth(-.12, .5, dl) : Math.max(0, dl) * .92 + .05 * Math.max(0, dl);
  const lim = b.type === 'jup' || b.type === 'mix' ? 1 - .35 * Math.pow(1 - Math.max(0, -dot(h.n, d)), 2) : 1;
  let c = alb.map(v => v * dif * lim * (b.bright || 1) + .006);
  if (b.type === 'jup' || b.type === 'mix') { const rim = Math.pow(1 - Math.max(0, -dot(h.n, d)), 4) * smooth(-.2, .5, dl); c = [c[0] + rim * .12, c[1] + rim * .1, c[2] + rim * .08]; }
  return lin(c);
}
// ---------- cielo ----------
function stars(d, k) {
  let c = [.003, .005, .013];
  const mw = fbm3(d[0] * 3 + 4, d[1] * 3, d[2] * 3, 5), banda = Math.exp(-Math.pow((d[1] + d[0] * .55 - .15) / .22, 2)); c = c.map((v, i) => v + banda * Math.pow(mw, 2.5) * [.05, .045, .065][i] * k);
  const sx = Math.floor(d[0] * 700), sy = Math.floor(d[1] * 700), sz = Math.floor(d[2] * 700), hh = hash3(sx, sy, sz); if (hh > .9975) { const q = (hh - .9975) / .0025; c = c.map((v, i) => v + q * 1.6 * k * [1, .95, .9 + .2 * hash3(sx, sz, 1)][i]); }
  return c;
}
module.exports = { G, ease, lerp, L3, rotYv, SOLd, hitBody, shadeBody, stars, lin, norm, sub, mul, add, dot, cross, smooth, mix, clamp, fbm3, vnoise3, hash3, PI, earthCol };
