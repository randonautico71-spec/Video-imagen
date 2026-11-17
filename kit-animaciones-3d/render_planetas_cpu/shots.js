'use strict';
const S = require('./scene.js'); const { renderScene, project, DEG, DMOON, RM, RJ, ease, lerp, norm, sub, mul, add, dot, cross, PI } = S;
const L = require('./luna.js'), { fbm3 } = L;
const DUR = 77.0;
const sd = (yaw, el) => { const y = yaw * DEG, e = el * DEG; return [Math.sin(y) * Math.cos(e), Math.sin(e), Math.cos(y) * Math.cos(e)]; };
const terr = (x, z) => .05 * (10 - z) + .12 * (fbm3(x * .15 + 3, z * .15, 1.5, 3) - .5) + (z < 3 ? .1 * Math.sin(x * .5) : 0);
const lg = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));
const sunG = norm([.25, -.35, -1]);
// ---- suelo ----
function ground(t, p) {
  const ez = p.ez == null ? -10 : p.ez, ex = p.ex || 0, eye = [ex, terr(ex, ez) + 1.65, ez], f = sd(p.yaw || 0, p.pitch || 0), bodies = [];
  for (const b of p.sky) { const dir = sd(b.yaw, b.el); bodies.push({ type: b.type || 'mix', c: add(eye, mul(dir, DMOON)), R: b.R, mixk: b.mixk == null ? 0 : b.mixk, rot: b.rot || 0, K: b.K, bright: b.bright, alpha: b.alpha, halo: b.halo, tint: b.tint }); }
  const sc = { t, ground: true, cam: { eye, tgt: add(eye, f), fov: p.fov, shift: p.shift == null ? .24 : p.shift }, bodies, sol: sunG, Ks: p.Ks || 0, W: p.W || 0, exp: p.exp || 1.15 };
  if (p.fig !== false) { const fz = p.fz == null ? 0 : p.fz, fx = p.fx || 0; sc.fig = { pos: [fx, terr(fx, fz), fz], yaw: p.fyaw || 0, pose: p.pose || { head: 0 } }; }
  return sc;
}
const moonK = (R, mk) => .3 + 1.3 * mk;
function skyMoon(t, yaw, el, R, mk, extra = {}) { return { yaw, el, R, mixk: mk, rot: t * .02, K: moonK(R, mk), bright: lerp(1.15, .85, mk), halo: extra.halo, alpha: extra.alpha }; }
// ---- A: gancho + puente (0–9) ----
function shotA(t) {
  const z = ease(t, 0, 2.3), fovz = lg(1.9, 70, z), push = ease(t, 4.4, 8.6), fov = t < 4.4 ? fovz : lerp(70, 58, push);
  const yaw = 9 * ease(t, 1.0, 2.2) - 9 * ease(t, 2.5, 3.8), zp = ease(t, .9, 2.3), pitch = lerp(18, 0, zp);
  const g = ease(t, 2.5, 4.1), R = lg(RM, RJ, g), mk = ease(t, 2.7, 4.0);
  const sky = [skyMoon(t, 0, 18, R, mk, { halo: mk * 1.2 })];
  sky.push({ yaw: 19, el: 18, R: RJ, mixk: 1, type: 'jup', rot: t * .03, K: 0, bright: .85, alpha: ease(t, 1.2, 1.7) * (1 - ease(t, 2.5, 3.2)) });
  const look = ease(t, 3.6, 4.4) * .5;
  return ground(t, { yaw: yaw, pitch: pitch, fov, shift: .24 * zp, sky, Ks: .16 * mk, exp: lerp(1.6, 1.0, mk), pose: { head: look }, fz: 0 });
}
// ---- B: masa (9–13.7) ----
function space(t, cam, bodies, extra = {}) { return Object.assign({ t, space: true, cam, bodies, sol: norm([-.6, .3, -.7]), exp: 1.1 }, extra); }
function shotB(t) {
  const a = (t - 9) * .035, R = 380, eye = [Math.sin(a) * R, 10, -Math.cos(a) * R];
  return space(t, { eye, tgt: [0, -22, 0], fov: 50 }, [
    { type: 'jup', c: [0, 62, 0], R: 69.911, rot: t * .25, bright: .9 }, { type: 'earth', c: [0, -92, 0], R: 6.371, rot: t * .4, mar: .5 }, { type: 'moon', c: [24, -128, 0], R: 1.7374, rot: 0, bright: 1.2 }]);
}
// ---- C: órbita (13.65–24.2) ----
function shotC(t) {
  const ro = 384.4, w = ease(t, 21.54, 23.94), th = .4 + .01 * (t - 13.6) + 2 * PI * w, E = [ro * Math.cos(th), 0, ro * Math.sin(th)];
  const k = ease(t, 16.6, 17.7), cc = [lerp(E[0], 0, k), 0, lerp(E[2], 0, k)], H = 1590;
  const Rb = lg(1.7374, 69.911, ease(t, 14.2, 15.6));
  const rings = [{ c: E, r: ro, y: 0, col: [.45, .75, 1], a: .9 * (1 - ease(t, 16.3, 17.2)), dash: 60, lw: 1.5 }, { c: [0, 0, 0], r: ro, y: 0, col: [1, .75, .3], a: .9 * ease(t, 16.8, 17.8), dash: 0, lw: 1.5 }, { c: [0, 0, 0], r: ro, y: 0, col: [1, .95, .8], a: 1 * ease(t, 17.2, 18), arc: [th, 1.4], lw: 2.2 }];
  const sc = space(t, { eye: [cc[0], H, cc[2]], tgt: cc, up: [0, 0, -1], fov: 50 }, [
    { type: 'jup', c: [0, 0, 0], R: Rb, rot: t * .25, bright: .9, tilt: 1.3 }, { type: 'earth', c: E, R: 6.371, rot: t * 3, mar: .5 }], { sol: norm([.3, .8, .5]), rings });
  sc.glows = [{ p: E, r: 14, a: .9, col: [.3, .6, 1] }]; sc.E = E; sc.th = th; return sc;
}
// ---- D: mar a ras de suelo (24.2–31.4) ----
function shotD(t) {
  const p = ease(t, 24.2, 31.4);
  return ground(t, { yaw: 0, pitch: lerp(5, 0, ease(t, 24.2, 28)), fov: 62, ez: lerp(-10, -6, p), sky: [skyMoon(t, 6, 16, RM, 0)], W: .5 * ease(t, 28.5, 31.0), exp: 2.2, fz: 0 });
}
// ---- E: Tierra desde órbita baja (31.4–41.35) ----
function earthView(t, o) {
  const ph = o.ph, dirB = [Math.cos(ph), 0, Math.sin(ph)], R = 6.371, side = norm(cross(dirB, [0, 1, 0])), eye = mul(norm(add(add(mul(side, -1), [0, .22, 0]), mul(dirB, o.turn || 0))), o.dist || 28), amp = o.amp;
  return space(t, { eye, tgt: [0, 0, 0], fov: 50, shift: .12 }, [
    { type: 'earth', c: [0, 0, 0], R, rot: t * .05, mar: { base: .5, amp, ax: dirB }, k: o.k || 0, ax: dirB }], { sol: norm(add(add(norm(eye), mul(side, .55)), [0, .25, 0])), exp: 1.0 });
}
function shotE(t) { return earthView(t, { ph: 1.0, dist: lerp(30, 26, ease(t, 31.4, 41.4)), turn: lerp(.15, .5, ease(t, 31.4, 41.4)), amp: .26 * ease(t, 32.5, 38.0) + .08 * ease(t, 38.5, 40.5) }); }
// ---- F: corte y lava (41.35–47.5) ----
function shotF(t) {
  const a = .6 + (t - 41.35) * .18, eye = [29 * Math.cos(a), 5, 29 * Math.sin(a)], cd = norm(eye), up = [0, 1, 0], rt = norm(cross(mul(cd, -1), up));
  const cutK = ease(t, 43.6, 44.4), lava = ease(t, 43.7, 46.2), k = .12 * ease(t, 41.5, 43.0);
  const n0 = norm(add(cd, rt)), n1 = norm(sub(cd, rt)), E = { type: 'earth', c: [0, 0, 0], R: 6.371, rot: t * .1, mar: { base: .5, amp: .26, ax: [1, 0, 0] }, k, ax: norm([Math.cos(.4), 0, Math.sin(.4)]), lava: lava * .9, t };
  if (cutK > .01) E.cut = [n0, n1];
  const sc = space(t, { eye, tgt: [0, 0, 0], fov: 50, shift: .12 }, [E], { sol: norm([-.5, .5, .6]), exp: 1.05 }); sc.glows = [{ p: [0, 0, 0], r: 8.5, a: .22 * lava, col: [1, .3, .06] }]; return sc;
}
// ---- G: Io (47.5–49.5) ----
function shotG(t) {
  const dB = norm([.32, .17, 1]), cam = [0, 0, -9 + (t - 47.5) * .35], Io = { type: 'io', c: [0, 0, 0], R: 1.82, rot: t * .2, bright: 1.1 };
  const p0 = mul(norm([.3, .75, -.5]), 1.82), nn = norm(p0), glows = []; for (let i = 0; i < 9; i++) { const u = i / 8; glows.push({ p: add(p0, mul(nn, .15 + u * 1.5)), r: .1 + u * .45, a: .55 * (1 - u * .7), col: [.75, .85, 1] }); }
  const sc = space(t, { eye: cam, tgt: [.1, .1, 0], fov: 36, shift: .08 }, [Io, { type: 'jup', c: mul(dB, 421.7), R: 69.911, rot: t * .25, bright: .9 }], { sol: norm([-.5, .35, -.6]), exp: 1.05 }); sc.glows = glows; return sc;
}
// ---- H/I: noche y amanecer de Júpiter (49.4–61.8) ----
function shotHI(t) {
  const rise = ease(t, 49.7, 53.5), el = lerp(-14, 18, rise), K = 1.6 * ease(t, 50.5, 53.5);
  const bright = ease(t, 53.4, 58), sl = ease(t, 59.8, 61.4);
  return ground(t, { yaw: lerp(0, -3, ease(t, 53, 61)), pitch: 0, fov: 70 - 4 * ease(t, 53, 61), ez: -10, sky: [{ yaw: 0, el, R: RJ, mixk: 1, type: 'mix', rot: t * .03, K: K, bright: .85, halo: rise }], Ks: .15 * ease(t, 52, 53.4) + .45 * bright + .1 * sl, exp: lerp(1.7, .8, bright), fz: 0 });
}
// ---- J: leyendo (61.8–66.0) ----
function shotJ(t) {
  const up = ease(t, 64.6, 66.0), bz = -1.7, bx = 0, by = terr(bx, bz) + .03, ez = -3.7;
  const sc = ground(t, { yaw: 0, pitch: lerp(5, 24, up), fov: lerp(46, 64, up), ez, shift: lerp(.02, .24, up), sky: [{ yaw: 0, el: 18, R: RJ, mixk: 1, type: 'mix', rot: t * .03, K: 1.6, bright: .85, halo: 1 }], Ks: .62, exp: .85, fig: false });
  sc.cam.eye = [0, terr(0, ez) + .42 + .2 * up, ez]; sc.cam.tgt = add(sc.cam.eye, sd(0, lerp(5, 24, up)));
  const n = norm([0, 1, -.45]), u = [1, 0, 0], v = cross(n, u); sc.book = { c: [bx, by + .01, bz], n, u: [-1, 0, 0], v: cross(n, [-1, 0, 0]) }; return sc;
}
// ---- K: vuelta al gancho + cierre (66.0–fin) ----
function shotK(t) {
  const sh = ease(t, 66.4, 67.9), z = ease(t, 68.0, 70.7);
  const R = lg(RJ, RM, sh), mk = 1 - ease(t, 66.6, 67.8), fov = lg(70, 3.0, z), pitch = lerp(0, 18, z), fovC = fov;
  const drift = t > 70.7 ? Math.sin((t - 70.7) * .35) * .35 : 0;
  return ground(t, { yaw: drift, pitch: pitch + drift * .3, fov: fovC, shift: .24 * (1 - z), ez: -10, sky: [skyMoon(t, 0, 18, R, mk, { halo: mk })], Ks: .7 * (1 - ease(t, 66.2, 67.8)), exp: lerp(.85, 1.7, ease(t, 66.2, 67.8)), fz: 0 });
}
const SHOTS = [[0, shotA], [9.0, shotB], [13.65, shotC], [24.2, shotD], [31.4, shotE], [41.35, shotF], [47.5, shotG], [49.4, shotHI], [61.8, shotJ], [66.0, shotK]];
function plan(t) {
  let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k][0]) i = k;
  const out = [{ s: SHOTS[i][1](t), w: 1 }], W = .17;
  if (i + 1 < SHOTS.length && SHOTS[i + 1][0] - t < W && !(i === 7 && false)) { const k = (t - (SHOTS[i + 1][0] - W)) / (2 * W) * 1; out[0].w = 1 - (.5 + .5 * k * 1); out.push({ s: SHOTS[i + 1][1](t), w: .5 + .5 * k }); }
  if (i > 0 && t - SHOTS[i][0] < W) { const k = (t - (SHOTS[i][0] - W)) / (2 * W); const prev = SHOTS[i - 1][1](t); out.length = 0; out.push({ s: prev, w: 1 - k }, { s: SHOTS[i][1](t), w: k }); }
  return out;
}
function renderFrame(t, w, h) {
  const P = plan(t), buf = new Uint8Array(w * h * 3);
  if (P.length === 1 || P[0].w >= .999) { renderScene(P[0].s, w, h, buf); return buf; }
  const b2 = new Uint8Array(w * h * 3); renderScene(P[0].s, w, h, buf); renderScene(P[1].s, w, h, b2);
  const k = P[1].w; for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - k) + b2[i] * k; return buf;
}
module.exports = { renderFrame, plan, DUR, SHOTS };
