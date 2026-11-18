'use strict';
// Si la Tierra tuviera dos Lunas — planos A (cielo realista desde la playa). Tiempos absolutos del vídeo.
const S = require('./scene.js'); const { renderScene, DEG, DMOON, RM, ease, lerp, norm, sub, mul, add, dot, cross, PI } = S;
const L = require('./luna.js'), { fbm3 } = L;
const DUR = 77.44;
const sd = (yaw, el) => { const y = yaw * DEG, e = el * DEG; return [Math.sin(y) * Math.cos(e), Math.sin(e), Math.cos(y) * Math.cos(e)]; };
const terr = (x, z) => .05 * (10 - z) + .12 * (fbm3(x * .15 + 3, z * .15, 1.5, 3) - .5) + (z < 3 ? .1 * Math.sin(x * .5) : 0);
const lg = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));
const sunG = norm([.25, -.35, -1]);
const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const M1 = { yaw: -26, el: 16 }, M2 = { yaw: 12, el: 71.7 };       // 60° de separacion en el cielo
const SUN = { yaw: 8, el: 46 };

function ground(t, p) {
  const ez = p.ez == null ? -10 : p.ez, ex = p.ex || 0, eye = [ex, terr(ex, ez) + 1.65, ez], f = sd(p.yaw || 0, p.pitch || 0), bodies = [];
  for (const b of p.sky) {
    const dir = sd(b.yaw, b.el); let sol = b.sol;
    if (b.phase != null) { const u = norm(cross(dir, [0, 1, 0])); sol = norm(add(mul(dir, -Math.cos(b.phase)), mul(u, Math.sin(b.phase) * (b.ps || 1)))); }
    bodies.push({ glow: b.glow, type: b.type || 'moon', c: add(eye, mul(dir, DMOON)), R: b.R || RM, mixk: 0, rot: b.rot || 0, K: b.K, bright: b.bright, alpha: b.alpha, halo: b.halo, tint: b.tint, sol });
  }
  const sc = { t, ground: true, cam: { eye, tgt: add(eye, f), fov: p.fov, shift: p.shift == null ? .24 : p.shift }, bodies, sol: sunG, Ks: p.Ks || 0, W: p.W || 0, exp: p.exp || 1.15, day: p.day || 0, sunDir: p.sunDir };
  if (p.fig !== false) { const fz = p.fz == null ? 5 : p.fz, fx = p.fx || 0; sc.fig = { pos: [fx, terr(fx, fz), fz], yaw: p.fyaw || 0, pose: p.pose || { head: 0 } }; }
  return sc;
}
// Luna con fase: lit = fraccion iluminada (1 llena, 0 nueva) -> angulo de fase
const phaseOf = lit => Math.acos(Math.max(-1, Math.min(1, 2 * lit - 1)));
const moon = (t, o, lit, extra = {}) => Object.assign({ yaw: o.yaw, el: o.el, type: 'moon', rot: t * .01, phase: phaseOf(lit), ps: o.ps || 1, K: .55 * lit, bright: 1.15, halo: .5 + lit, glow: { r: 1.4, a: .35 + .7 * lit } }, extra);
const slow = (t, a, b, f) => lerp(a, b, ease(t, f[0], f[1]));

// ---------------- AB: gancho y puente (0 - 12.9) ----------------
function shotAB(t) {
  // camara: tele sobre la Luna 1 -> abre -> gira hasta ver las dos -> latigazos a cada Luna -> vuelta -> baja al mar
  let yaw, pitch, fov;
  const z = ease(t, 0, 2.3), pan = ease(t, 2.3, 4.2);
  if (t < 4.5) { fov = lg(1.8, 62, z); yaw = lerp(M1.yaw, -22, z); pitch = lerp(M1.el, 9, z);
    fov = lerp(fov, 82, pan); yaw = lerp(yaw, -7, pan); pitch = lerp(pitch, 40, pan); }
  else {
    const w1 = ease(t, 5.0, 5.9), w2 = ease(t, 6.0, 6.5), w3 = ease(t, 7.0, 7.6), back = ease(t, 7.9, 8.8);
    // base ancha con deriva suave
    const dy = lerp(-7, -4, ease(t, 4.5, 10.3)), dp = lerp(40, 34, ease(t, 4.5, 10.3)), df = lerp(82, 76, ease(t, 4.5, 10.3));
    // M2 tele (5.9-7.0), M1 tele (7.6-8.3)
    const tel2 = ease(t, 5.0, 5.9) * (1 - ease(t, 6.9, 7.5)), tel1 = ease(t, 6.9, 7.6) * (1 - ease(t, 8.0, 8.8));
    const f2 = lg(df, 5.5, tel2), f1 = lg(df, 5.5, tel1); fov = Math.min(f2, f1);
    yaw = dy + (M2.yaw - dy) * tel2 + (M1.yaw - dy) * tel1; pitch = dp + (M2.el - dp) * tel2 + (M1.el - dp) * tel1;
    // vuelta y bajada al mar
    const dn = ease(t, 10.3, 12.8); pitch = lerp(pitch, 3, dn); fov = lerp(fov, 62, dn); yaw = lerp(yaw, -12, dn);
  }
  const lit1 = .97, lit2 = lerp(.0, .6, 0) + .6; // la 2.a Luna va 60 grados atras en fase
  const sky = [moon(t, M1, lit1), moon(t, M2, lit2)];
  const dn = ease(t, 10.3, 12.8);
  return ground(t, { yaw, pitch, fov, shift: .24 * ease(t, 1.0, 2.3) * (1 - ease(t, 3.4, 4.4)) + .24 * dn, sky, Ks: .05, exp: lerp(1.7, 1.15, ease(t, 0, 2.4)), W: .12 * dn, fz: 5 });
}

// ---------------- dia + eclipses (45.4 - 55.3) ----------------
function shotDay(t) { return shotEclipse(t); }
function shotEclipse(t) {
  const sunD = sd(SUN.yaw, SUN.el), z = ease(t, 48.6, 50.0), wide = t < 49.9;
  // posiciones relativas de las lunas respecto al sol (grados de longitud)
  const off1 = lerp(1.7, -1.7, ease(t, 50.1, 52.4)), off2 = lerp(1.7, -1.7, ease(t, 52.9, 55.2));
  const cov = d => sm(.56, 0.02, Math.abs(d));            // cobertura aproximada del disco solar
  const dark = Math.pow(Math.max(t > 49.9 && t < 52.8 ? cov(off1) : 0, t > 52.8 ? cov(off2) : 0), 1.7) * .94;
  const fov = lg(72, 3.6, z), pitch = lerp(26, SUN.el, z), yaw = lerp(0, SUN.yaw, z);
  const co = Math.cos(SUN.el * DEG);
  const sky = [{ yaw: SUN.yaw, el: SUN.el, type: 'sun', R: RM * 1.02, bright: 9, K: 2.4 * (1 - dark), halo: 6 - 3 * dark, tint: [1, .95, .85], glow: { r: 3.2, a: 1.6 * (1 - dark * .6) } },
    { yaw: SUN.yaw + off1 / co, el: SUN.el - .08, type: 'moon', phase: PI, K: 0, bright: 1, ps: 1 },
    { yaw: SUN.yaw + off2 / co, el: SUN.el + .1, type: 'moon', phase: PI, K: 0, bright: 1, ps: 1 }];
  const sc = ground(t, { yaw, pitch, fov, shift: .24 * (1 - z), sky, Ks: .8 * (1 - dark), exp: lerp(1.5, 1.25, z), day: 1 - dark * .95, sunDir: sunD, fz: 5 });
  return sc;
}

// ---------------- noche con dos Lunas (55.2 - 62.67) ----------------
function shotNight(t) {
  const k = ease(t, 55.2, 62.6);
  const yaw = lerp(-7, 0, k), pitch = lerp(38, 30, k), fov = lerp(82, 72, k);
  const lit1 = .97 - .08 * k, lit2 = .5 + .1 * k;
  const sky = [moon(t, M1, lit1, { K: .9 * lit1, halo: 1.1 }), moon(t, M2, lit2, { K: .9 * lit2, halo: .8 })];
  return ground(t, { yaw, pitch, fov, shift: .24 * ease(t, 55.2, 57), sky, Ks: .09, exp: 1.4, W: .12, fz: 5 });
}

// ---------------- vuelta al gancho y cierre (62.67 - fin) ----------------
function shotReturn(t) {
  const sec = ease(t, 63.0, 66.5), dn = ease(t, 68.3, 70.6), up = ease(t, 71.6, 76.5);
  const ghost = ease(t, 67.1, 67.9) * (1 - ease(t, 70.6, 70.6)) + ease(t, 70.7, 72.0) * 1;     // la 2.a Luna aparece al decir «dos»
  const ghostA = Math.min(1, ease(t, 67.0, 67.9) * .5 + ease(t, 70.7, 72.0) * .5);
  const yaw = lerp(-14, -10, sec), pitch = lerp(30, 24, sec), fov = lerp(76, 70, sec);
  const p2 = lerp(pitch, 8, dn), p3 = lerp(p2, 34, up), f3 = lerp(lerp(fov, 62, dn), 80, up);
  const W = .12 + .4 * ease(t, 68.6, 70.4);
  const sky = [moon(t, M1, .97, { K: .55, halo: 1.1 }), moon(t, M2, .55, { K: .5 * .55, halo: .8, alpha: ghostA })];
  return ground(t, { yaw: lerp(yaw, -6, up), pitch: p3, fov: f3, shift: .24 * (.5 + .5 * dn), sky, Ks: .06, exp: 1.4, W, fz: 5 });
}

const SHOTS = [[0, shotAB], [45.4, shotEclipse], [55.2, shotNight], [62.67, shotReturn]];
function plan(t) {
  let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k][0]) i = k;
  const out = [{ s: SHOTS[i][1](t), w: 1 }], W = .17;
  if (i + 1 < SHOTS.length && SHOTS[i + 1][0] - t < W) { const k = (t - (SHOTS[i + 1][0] - W)) / (2 * W); out[0].w = 1 - (.5 + .5 * k); out.push({ s: SHOTS[i + 1][1](t), w: .5 + .5 * k }); }
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
