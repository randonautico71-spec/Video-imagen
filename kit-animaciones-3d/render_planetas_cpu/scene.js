'use strict';
const L = require('./luna.js'); const { G, ease, lerp, L3, rotYv, hitBody, shadeBody, stars, lin, norm, sub, mul, add, dot, cross, smooth, mix, clamp, fbm3, vnoise3, hash3, PI } = L;
const DEG = PI / 180, DMOON = 384.4e6, RM = 1.7374e6, RJ = 69.911e6;      // metros (mundo del suelo)
const SUNg = norm([.25, -.35, -1]);
// ---------- figura ----------
const sdCap = (p, a, b, r) => { const pa = sub(p, a), ba = sub(b, a), h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1); return Math.hypot(...sub(pa, mul(ba, h))) - r; };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
function figSDF(p, P) {   // p local (y arriba, mira a +z). P: {head (rad hacia arriba), read}
  const legs = Math.min(sdCap(p, [-.1, .05, 0], [-.1, .88, 0], .075), sdCap(p, [.1, .05, 0], [.1, .88, 0], .075));
  let tor = sdCap(p, [0, .95, 0], [0, 1.36, 0], .16); tor = Math.max(tor, p[1] - 1.5);
  const hy = P.read ? 1.57 : 1.6, hz = P.read ? .06 : 0, tilt = P.head || 0;
  const hc = [0, hy, hz - tilt * .02], head = Math.hypot(p[0] - hc[0], (p[1] - hc[1]) * 1.05, (p[2] - hc[2]) * .95) - .105;
  const neck = sdCap(p, [0, 1.38, 0], [0, 1.52, hz * .6], .05);
  let arms; if (P.read) arms = Math.min(sdCap(p, [-.2, 1.38, 0], [-.14, 1.15, .22], .045), sdCap(p, [.2, 1.38, 0], [.14, 1.15, .22], .045)); else arms = Math.min(sdCap(p, [-.21, 1.38, 0], [-.23, .95, .02], .05), sdCap(p, [.21, 1.38, 0], [.23, .95, .02], .05));
  let d = smin(Math.min(legs, tor), arms, .05); d = smin(d, neck, .04); const dh = head; 
  let book = 1e9; if (P.read) { const q = [Math.abs(p[0]) - .0, p[1] - 1.16, p[2] - .27]; const k = [Math.abs(q[0]) - .15, Math.abs(q[1]) - .1, Math.abs(q[2]) - .012]; book = Math.hypot(Math.max(k[0], 0), Math.max(k[1], 0), Math.max(k[2], 0)) + Math.min(Math.max(k[0], k[1], k[2]), 0); }
  const dd = Math.min(d, dh, book); let m = 0; if (dd === dh) m = 3; else if (dd === book) m = 4; else if (p[1] < .9) m = 1; else m = 2;
  return [dd, m];
}
function hitFig(o, d, F) {   // F: {pos, yaw, pose}; devuelve {t, n, m, p}
  const c = [F.pos[0], F.pos[1] + .95, F.pos[2]], oc = sub(o, c), B = dot(oc, d), Cc = dot(oc, oc) - 1.2 * 1.2, disc = B * B - Cc; if (disc < 0) return null;
  let t = Math.max(0, -B - Math.sqrt(disc)); const tmax = -B + Math.sqrt(disc), cy = Math.cos(-F.yaw), sy = Math.sin(-F.yaw);
  const loc = P => { const q = sub(P, F.pos); return [q[0] * cy + q[2] * sy, q[1], -q[0] * sy + q[2] * cy]; };
  for (let i = 0; i < 40 && t < tmax; i++) { const P = add(o, mul(d, t)), r = figSDF(loc(P), F.pose); if (r[0] < .004) { const e = .006, q = loc(P), n0 = [figSDF([q[0] + e, q[1], q[2]], F.pose)[0] - figSDF([q[0] - e, q[1], q[2]], F.pose)[0], figSDF([q[0], q[1] + e, q[2]], F.pose)[0] - figSDF([q[0], q[1] - e, q[2]], F.pose)[0], figSDF([q[0], q[1], q[2] + e], F.pose)[0] - figSDF([q[0], q[1], q[2] - e], F.pose)[0]];
      const nl = norm(n0), n = [nl[0] * Math.cos(F.yaw) + nl[2] * Math.sin(F.yaw), nl[1], -nl[0] * Math.sin(F.yaw) + nl[2] * Math.cos(F.yaw)]; return { t, n, m: r[1], p: P, ql: q }; } t += Math.max(.004, r[0] * .9); }
  return null;
}
// ---------- terreno y agua ----------
const terr = (x, z, S) => .05 * (10 - z) + .12 * (fbm3(x * .15 + 3, z * .15, 1.5, 3) - .5) + (z < 3 ? .1 * Math.sin(x * .5) : 0);
function skyAt(S, d, withBodies = true, nrm) {
  let c = stars(d, 1 - .93 * Math.min(1, S.Ks * 2));
  c = c.map(v => v * (1 - Math.min(.97, S.Ks * 1.6)));
  const hz = Math.exp(-Math.abs(d[1]) * 9); c = [c[0] + hz * .012 * (1 + S.Ks * 3), c[1] + hz * .02 * (1 + S.Ks * 3), c[2] + hz * .04 * (1 + S.Ks * 3)];
  if (S.Ks > 0) { const g = (.5 + .5 * Math.max(-.2, d[1]) + .35) * S.Ks; c = [c[0] + g * .34, c[1] + g * .35, c[2] + g * .42]; }
  for (const b of S.bodies) { const h = hitBody(b, S.o, d); if (h) { const s = shadeBody(b, h, d, S.sol); c = [s[0] * (b.alpha == null ? 1 : b.alpha) + c[0] * (1 - (b.alpha == null ? 1 : b.alpha)) * 1, s[1] * (b.alpha == null ? 1 : b.alpha) + c[1] * (1 - (b.alpha == null ? 1 : b.alpha)), s[2] * (b.alpha == null ? 1 : b.alpha) + c[2] * (1 - (b.alpha == null ? 1 : b.alpha))]; }
    else if (b.halo) { const dd = norm(sub(b.c, S.o)), ang = Math.acos(clamp(dot(d, dd), -1, 1)), a0 = Math.asin(Math.min(1, b.R / Math.hypot(...sub(b.c, S.o)))); if (ang > a0) { const k = b.halo * Math.exp(-(ang - a0) / (a0 * .5 + .002)) * .05; c = [c[0] + k, c[1] + k * .93, c[2] + k * .82]; } } }
  return c;
}
function groundTrace(S, d) {
  const o = S.o; let tHit = 1e18, col = null;
  const wl = S.W;
  let tw = 1e18; if (d[1] < -1e-5) tw = (wl - o[1]) / d[1];
  // terreno
  let ts = null; if (d[1] < 0.35) { let t = .2, tm = Math.min(tw, 90), prev = null; for (let i = 0; i < 90 && t < tm; i++) { const P = add(o, mul(d, t)), h = P[1] - terr(P[0], P[2], S); if (h < 0) { let a = prev || 0, b = t; for (let k = 0; k < 7; k++) { const m = (a + b) / 2, Pm = add(o, mul(d, m)); if (Pm[1] - terr(Pm[0], Pm[2], S) < 0) b = m; else a = m; } ts = b; break; } prev = t; t += Math.max(.12, h * .55); } }
  if (ts !== null && ts < tw) { const P = add(o, mul(d, ts)), e = .08, hx = terr(P[0] + e, P[2]) - terr(P[0] - e, P[2]), hz = terr(P[0], P[2] + e) - terr(P[0], P[2] - e), n = norm([-hx / (2 * e), 1, -hz / (2 * e)]);
    const wet = smooth(.35, 0, P[1] - wl) , g = fbm3(P[0] * 3, P[2] * 3, 7, 3), alb = [.62 - .25 * wet, .55 - .22 * wet, .42 - .17 * wet].map(v => v * (.85 + .3 * g)); col = lightSurf(S, P, n, alb); return { t: ts, c: col }; }
  if (tw < 1e17) { const P = add(o, mul(d, tw)), r = Math.hypot(P[0] - o[0], P[2] - o[2]), amp = .035 / (1 + r * .04), tt = S.t;
    const gx = fbm3(P[0] * .9 + tt * .5, P[2] * .9, tt * .3, 3) - .5, gz = fbm3(P[0] * .9 + 9, P[2] * .9 - tt * .4, tt * .3 + 4, 3) - .5, gx2 = fbm3(P[0] * 3.1, P[2] * 3.1 + tt, 5, 2) - .5, gz2 = fbm3(P[0] * 3.1 + 5, P[2] * 3.1, tt + 2, 2) - .5;
    let n = norm([(gx + gx2 * .5) * amp * 9, 1, (gz + gz2 * .5) * amp * 9]); const dn = -dot(d, n), F = .03 + .97 * Math.pow(1 - clamp(dn, 0, 1), 5);
    const rd = norm(add(d, mul(n, 2 * dn))); rd[1] = Math.abs(rd[1]); const sk = skyAt({ ...S, o: P }, rd, true);
    const base = lightSurf(S, P, [0, 1, 0], [.012, .04, .05]); const foam = smooth(.0, -.9, -(r - 0)) * 0;
    col = [base[0] * (1 - F) + sk[0] * F, base[1] * (1 - F) + sk[1] * F, base[2] * (1 - F) + sk[2] * F];
    const fog = 1 - Math.exp(-tw * .0009 * (.5 + S.Ks)); const hz = skyAt(S, [d[0], 0, d[2]], false); col = [mix(col[0], hz[0], fog * .5), mix(col[1], hz[1], fog * .5), mix(col[2], hz[2], fog * .5)]; return { t: tw, c: col }; }
  return null;
}
function lightSurf(S, P, n, alb) {   // irradiancia de la(s) luna(s) + ambiente
  let E = [.03, .042, .075]; for (const b of S.bodies) { if (!b.K) continue; const dd = norm(sub(b.c, P)), k = Math.max(0, dot(n, dd)) * b.K; E = [E[0] + k * (b.tint || [1, .95, .86])[0], E[1] + k * (b.tint || [1, .95, .86])[1], E[2] + k * (b.tint || [1, .95, .86])[2]]; }
  E = [E[0] + S.Ks * .45, E[1] + S.Ks * .47, E[2] + S.Ks * .55];
  return [alb[0] * E[0], alb[1] * E[1], alb[2] * E[2]];
}
// ---------- cámara ----------
function camRay(cam, w, h) {
  const up0 = cam.up || [0, 1, 0], f = norm(sub(cam.tgt, cam.eye)), r = norm(cross(f, up0)), u = cross(r, f), th = Math.tan(cam.fov * DEG / 2), asp = w / h, s2 = cam.shift || 0;
  return (px, py) => { const x = ((px + .5) / w * 2 - 1) * th * asp, y = ((1 - (py + .5) / h * 2) + s2) * th; return norm([f[0] + r[0] * x + u[0] * y, f[1] + r[1] * x + u[1] * y, f[2] + r[2] * x + u[2] * y]); };
}
function project(cam, P) { const up0 = cam.up || [0, 1, 0], f = norm(sub(cam.tgt, cam.eye)), r = norm(cross(f, up0)), u = cross(r, f), v = sub(P, cam.eye), z = dot(v, f); if (z <= 0) return null; const th = Math.tan(cam.fov * DEG / 2), asp = 9 / 16, x = dot(v, r) / z / (th * asp), y = dot(v, u) / z / th - (cam.shift || 0);
  return [(x + 1) / 2, (1 - y) / 2, z]; }
// ---------- trazado de un fotograma de escena ----------
function hitBook(S, d) {
  const B = S.book, o = S.o, n = B.n, den = dot(d, n); if (Math.abs(den) < 1e-6) return null; const t = dot(sub(B.c, o), n) / den; if (t <= 0) return null;
  const P = add(o, mul(d, t)), q = sub(P, B.c), a = dot(q, B.u), b = dot(q, B.v);
  if (Math.abs(a) > .335 || Math.abs(b) > .235) { const sa = Math.abs(a - .02) , sb = Math.abs(b + .03); if (sa < .39 && sb < .29) return { t, shadow: .5 * smooth(.39, .335, sa) * smooth(.29, .235, sb) }; return null; }
  let alb, dark = 0;
  if (Math.abs(a) < .31 && Math.abs(b) < .21) {
    const pg = a < 0 ? 0 : 1, curve = Math.exp(-Math.abs(a) * 14), row = Math.floor((b + .21) / .0175), fr = ((b + .21) / .0175) % 1, len = .06 + .2 * hash3(row, pg, 7), x0 = Math.abs(a) - .035, margin = x0 > 0 && x0 < len + .1 && Math.abs(b) < .185;
    const para = hash3(row, pg, 3) > .86 ? 0 : 1, txt = margin && para && fr > .3 && fr < .62 && hash3(Math.floor(Math.abs(a) * 120), row, pg) > .24 && x0 < .05 + .21 * hash3(row, pg, 9) + .06;
    alb = [.9, .86, .74].map(v => v * (1 - .45 * curve)); if (txt) alb = [.16, .15, .15];
    if (Math.abs(a) < .004) alb = [.35, .3, .25];
  } else alb = [.28, .1, .09];
  return { t, c: lightSurf(S, P, n, alb) };
}
function renderScene(S, w, h, out) {
  const ray = camRay(S.cam, w, h); S.o = S.cam.eye; const bodies = S.bodies;
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const d = ray(px, py); let col = null, tBest = 1e30;
    if (S.fig) { const hf = hitFig(S.o, d, S.fig); if (hf) { tBest = hf.t; col = figShade(S, hf, d); } }
    let bk = null; if (S.book) { const hb = hitBook(S, d); if (hb && !hb.shadow && hb.t < tBest) { bk = hb; } else if (hb && hb.shadow) bk = hb; }
    if (S.ground) { const g = groundTrace(S, d); if (g && g.t < tBest) { tBest = g.t; col = g.c; } }
    if (bk) { if (bk.shadow) { if (col) col = col.map(v => v * (1 - bk.shadow)); } else { col = bk.c; tBest = bk.t; } }
    if (!col) {
      if (S.space) { let c = stars(d, 1); let tb = 1e30; for (const b of bodies) { const hh = hitBody(b, S.o, d); if (hh && hh.t < tb) { tb = hh.t; const s = shadeBody(b, hh, d, S.sol); const a = b.alpha == null ? 1 : b.alpha; c = [s[0] * a + c[0] * (1 - a), s[1] * a + c[1] * (1 - a), s[2] * a + c[2] * (1 - a)]; } }
        if (S.rings) for (const rg of S.rings) { const dy = d[1]; if (Math.abs(dy) > 1e-6) { const t = (rg.y - S.o[1]) / dy; if (t > 0 && t < tb) { const P = add(S.o, mul(d, t)), rr = Math.hypot(P[0] - rg.c[0], P[2] - rg.c[2]), pix = t * Math.tan(S.cam.fov * DEG / 2) * 2 / h * (rg.lw || 1.3), a = Math.exp(-Math.pow((rr - rg.r) / pix, 2)) * rg.a, ang = Math.atan2(P[2] - rg.c[2], P[0] - rg.c[0]);
              const dash = rg.dash ? (Math.sin(ang * rg.dash) > -.3 ? 1 : 0) : 1; let ww = 1; if (rg.arc) { let da = ang - rg.arc[0]; da = Math.atan2(Math.sin(da), Math.cos(da)); ww = da < 0 && da > -rg.arc[1] ? Math.pow(1 + da / rg.arc[1], 1.5) : 0; }
              const k = a * dash * ww; c = [c[0] * (1 - k) + rg.col[0] * k, c[1] * (1 - k) + rg.col[1] * k, c[2] * (1 - k) + rg.col[2] * k]; } } }
        col = c;
      } else col = skyAt(S, d, true);
    }
    if (S.glows) for (const g of S.glows) { const v = sub(g.p, S.o), tt = dot(v, d); if (tt > 0) { const q = sub(v, mul(d, tt)), dist = Math.hypot(...q), k = g.a * Math.exp(-dist * dist / (g.r * g.r)); col = [col[0] + k * g.col[0], col[1] + k * g.col[1], col[2] + k * g.col[2]]; } }
    // tono
    const ex = S.exp || 1.1; let r = 1 - Math.exp(-col[0] * ex), g2 = 1 - Math.exp(-col[1] * ex), b = 1 - Math.exp(-col[2] * ex);
    const i = (py * w + px) * 3; out[i] = Math.pow(r, .86) * 255; out[i + 1] = Math.pow(g2, .86) * 255; out[i + 2] = Math.pow(b, .86) * 255;
  }
}
function figShade(S, h, d) {
  const mats = [[.2, .22, .32], [.22, .25, .38], [.3, .62, .66], [.82, .6, .48], [.85, .82, .72]], alb = mats[h.m] || mats[1];
  let E = [.42, .46, .58]; for (const b of S.bodies) { if (!b.K) continue; const dd = norm(sub(b.c, h.p)), k = Math.max(0, dot(h.n, dd) * .6 + .4) * b.K * 1.0, rim = Math.pow(1 - Math.max(0, -dot(h.n, d)), 3) * b.K * .5; E = [E[0] + k + rim * .9, E[1] + k * .95 + rim * .85, E[2] + k * .86 + rim * .8]; }
  E = [E[0] + S.Ks * .4, E[1] + S.Ks * .42, E[2] + S.Ks * .5];
  return [alb[0] * E[0], alb[1] * E[1], alb[2] * E[2]];
}
module.exports = { renderScene, project, camRay, figSDF, DEG, DMOON, RM, RJ, SUNg, ease, lerp, L3, norm, sub, mul, add, dot, cross, rotYv, PI };
