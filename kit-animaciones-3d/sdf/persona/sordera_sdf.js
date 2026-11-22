'use strict';
// ESCENA SDF 'sordera' · dormitorio + oído interno (cóclea y canales semicirculares) + persona detallada
const M = require('./motor_sordera');
const { clamp, mix, h2, n3 } = M, sdEll = M.sdEll, cap = M.sdCap;
const PI = Math.PI, TAU = PI * 2;
const sm = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; };
const ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;
const tr = (t, a, b) => ease((t - a) / (b - a));
const sdBox = (x, y, z, hx, hy, hz) => { const qx = Math.abs(x) - hx, qy = Math.abs(y) - hy, qz = Math.abs(z) - hz, mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0); return Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(qx, qy, qz), 0); };
const sdRB = (x, y, z, hx, hy, hz, r) => sdBox(x, y, z, hx - r, hy - r, hz - r) - r;
const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
// ---------- vectores (solo por fotograma)
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]), vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vmix = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
function ik2(S, Tg, l1, l2, pole) {
  const d = vsub(Tg, S); let L = vlen(d); const Lc = Math.min(Math.max(L, 0.05), l1 + l2 - 1e-3), dir = vmul(d, 1 / (L || 1));
  const a = (l1 * l1 - l2 * l2 + Lc * Lc) / (2 * Lc), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let pn = vsub(pole, vmul(dir, vdot(pole, dir))); pn = vnorm(pn);
  return { E: vadd(vadd(S, vmul(dir, a)), vmul(pn, hh)), W: vadd(S, vmul(dir, Lc)) };
}
// ---------- tiempos de corte (s)
const CUT = [0, 2.10, 4.38, 7.50, 11.66, 14.62, 17.70, 22.96, 25.77, 29.08, 32.38, 34.88, 39.90, 43.50, 49];
const SET = ['room', 'room', 'ear', 'ear', 'ear', 'ear', 'room', 'ear', 'room', 'room', 'room', 'room', 'room', 'room'];
function shotIdx(t) { let i = 0; for (let k = 0; k < CUT.length - 1; k++) if (t >= CUT[k]) i = k; return i; }
// ---------- habitación
const BXS = 0.0;          // cama central
const CLK = [-0.9, 0.62, 1.36];   // despertador en la mesilla izquierda
// ---------- estado del fotograma
const F = { set: 'room', shadow: false, t: 0, twin: false, vert: 0, warpT: 0, J: new Float64Array(80), H: new Float64Array(24), H2: new Float64Array(24), HAND: new Float64Array(40), cam: [0, 0, 0] };
let MAT = 0, D = 0, MT = 0;
const T_ = (v, m) => { if (v < D) { D = v; MT = m; } };
// ---------- poses
const UP = [0, 1, 0];
function frameBody(P, psi, lean, side) {
  const f = [Math.sin(psi), 0, Math.cos(psi)], r = [-f[2], 0, f[0]];
  const s = vnorm(vadd(vadd(vmul(UP, Math.cos(lean)), vmul(f, Math.sin(lean))), vmul(r, Math.sin(side))));
  const ff = vcross(s, r);
  return { P, f, r, s, ff };
}
function headFrame(B, hy, hp, hr) {
  let R = B.r, U = B.s, Fw = B.ff;
  // yaw (sobre U)
  const cy = Math.cos(hy), sy = Math.sin(hy); let Fw1 = vadd(vmul(Fw, cy), vmul(R, sy)), R1 = vsub(vmul(R, cy), vmul(Fw, sy));
  // pitch (sobre R1): positivo = mira abajo
  const cp = Math.cos(hp), sp = Math.sin(hp); const Fw2 = vsub(vmul(Fw1, cp), vmul(U, sp)), U2 = vadd(vmul(U, cp), vmul(Fw1, sp));
  // roll (sobre Fw2): positivo = inclina a su derecha
  const cr = Math.cos(hr), sr = Math.sin(hr); const R3 = vsub(vmul(R1, cr), vmul(U2, sr)), U3 = vadd(vmul(U2, cr), vmul(R1, sr));
  return { r: R3, u: U3, f: Fw2 };
}
// definición de poses por tiempo: devuelve todo lo necesario
function poseBed(t, wake, off) {
  const bx = off, ph = t;
  const lean = lerp(-0.62, -0.1, tr(t, wake[0], wake[1])) + 0.012 * Math.sin(ph * 1.9);
  return { P: [bx, 0.62, 1.27], psi: PI, lean, side: 0.0, bed: true, bx };
}
function poseAt(t, who) {
  // who: 0 = persona principal, 1 = gemelo (derecha)
  const o = { hy: 0, hp: 0, hr: 0, lids: 0.0, mouth: 0.0, brow: 0.0, gx: 0, gy: 0, curlL: 0.7, curlR: 0.5, handL: 'rest', handR: 'rest', legs: null, bed: false, mode: 'bed', smile: 0, ear: 0 };
  const twin = t >= CUT[9] && t < CUT[11];
  if (t < CUT[6] || (t >= CUT[9] && t < CUT[12])) {
    // en la cama (S01, S02, gemelos, S12)
    const bx = twin ? (who ? 0.85 : -0.85) : BXS;
    const wake = (t < CUT[2]) ? [0.0, 1.5] : [-9, -8];
    const B = poseBed(t, wake, bx); Object.assign(o, B);
    o.mode = 'bed';
    o.handL = 'ear'; o.ear = tr(t, 0.0, 0.9);
    if (t >= CUT[9]) o.ear = 1;
    o.hy = -0.12 * Math.sin(t * 1.3) + (t < 2.4 ? lerp(0.35, 0.0, tr(t, 0, 1.5)) : -0.35 * tr(t, 2.6, 3.4));  // mira al despertador, luego a ninguna parte
    o.hp = 0.06; o.lids = t < 1.0 ? lerp(0.55, 0.05, tr(t, 0, 1.0)) : 0.04; o.mouth = 0.25; o.brow = 0.7;
    o.curlL = 0.45;
    if (twin && who === 1) { o.smile = tr(t, 29.5, 31.5); o.mouth = lerp(0.25, 0.1, o.smile); o.brow = lerp(0.7, 0.0, o.smile); o.ear = lerp(1, 0.5, tr(t, 30.2, 31.6)); o.hy = 0.15 * Math.sin(t * 0.8); o.handL = 'ear'; o.lean = -0.1; o.hp = 0.02; }
    if (twin && who === 0) { o.hy = 0.05 * Math.sin(t * 0.8) - 0.1; o.brow = 0.9; o.mouth = 0.35; o.hp = 0.1 + 0.03 * tr(t, 32.4, 34.8); }
    if (t >= CUT[11] && t < CUT[12]) { // S12 repetido: lo del GOLPE, pero sin sonido; mira al reloj
      o.hy = lerp(0.05, 0.75, tr(t, 37.2, 38.0)); o.hy = lerp(o.hy, -0.25, tr(t, 38.8, 39.5)); o.brow = 0.85; o.mouth = 0.3;
    }
    return o;
  }
  if (t >= CUT[6] && t < CUT[7]) {
    // sentado al borde de la cama, dedos en la oreja (S07)
    o.mode = 'edge';
    const P = [0.84, 0.56, 0.55 + 0.02 * Math.sin(t * 1.4)];
    Object.assign(o, { P, psi: PI / 2, lean: 0.14 + 0.02 * Math.sin(t * 1.1), side: 0.0 });
    o.handL = 'ear'; o.ear = 1; o.curlL = 0.3 + 0.2 * Math.sin(t * 6) * tr(t, 18.5, 19.0) * (1 - tr(t, 20.8, 21.0));
    // de mirar el despertador (+z) → al hombro → a cámara (-z) al decir «esto es para ti»
    const look = t < 20.9 ? lerp(-0.6, -0.9, tr(t, 18, 20.8)) : lerp(-0.9, -1.75, tr(t, 21.0, 21.7));
    o.hy = look; o.hp = lerp(0.1, 0.0, tr(t, 21, 21.7)); o.hr = lerp(0.12, -0.08, tr(t, 21, 21.8)); o.brow = lerp(0.3, 0.85, tr(t, 20.8, 21.6)); o.mouth = lerp(0.2, 0.05, tr(t, 21, 22));
    o.lids = 0.05; o.legs = { L: [1.2, 0.08, 0.38], R: [1.18, 0.08, 0.74] };
    return o;
  }
  if (t >= CUT[8] && t < CUT[9]) {
    // de pie, agarrado a la pared, el mundo gira (S09)
    o.mode = 'stand';
    const sw = Math.sin(t * 2.3) * 0.05 * tr(t, 25.9, 27.2);
    const P = [1.9 + sw, 0.95 + 0.012 * Math.sin(t * 4.1), -0.25];
    Object.assign(o, { P, psi: PI * 0.92, lean: 0.12, side: 0.1 + 0.06 * Math.sin(t * 2.3 + 1) });
    o.handL = 'ear'; o.ear = 1; o.curlL = 0.5; o.handR = [2.46, 1.28 + 0.01 * Math.sin(t * 3), -0.16]; o.curlR = 0.2;
    o.hy = 0.3 * Math.sin(t * 1.7); o.hp = 0.14; o.hr = -0.2 + 0.1 * Math.sin(t * 2.3); o.brow = 1.0; o.mouth = 0.5; o.lids = 0.0;
    o.legs = { L: [1.72 + sw * 0.4, 0.08, -0.12], R: [2.1 - sw * 0.4, 0.08, -0.34] };
    return o;
  }
  if (t >= CUT[12]) {
    // camina hacia la puerta y sale (S13, S14)
    o.mode = 'walk';
    const t0 = CUT[12], u = clamp((t - t0) / (47.8 - t0), 0, 1), ue = u * 0.9 + u * u * (3 - 2 * u) * 0.1;
    const A = [0.95, 0, 0.4], Bp = [2.2, 0, -0.78], Cc = [3.2, 0, -0.78];
    let pos, psi;
    if (ue < 0.48) { const k = ue / 0.48; pos = [lerp(A[0], Bp[0], k), 0, lerp(A[2], Bp[2], k)]; psi = Math.atan2(Bp[0] - A[0], Bp[2] - A[2]); }
    else { const k = (ue - 0.48) / 0.52; pos = [lerp(Bp[0], Cc[0], k), 0, lerp(Bp[2], Cc[2], k)]; psi = lerp(Math.atan2(Bp[0] - A[0], Bp[2] - A[2]), PI / 2, ease(Math.min(1, k * 4))); }
    const ph = (t - t0) * 6.1, bob = 0.02 * Math.abs(Math.sin(ph));
    const P = [pos[0], 0.95 - bob, pos[2]];
    const lean = 0.08 + 0.05 * tr(t, 40.0, 41.0), side = 0.05 * Math.sin(ph * 0.5);
    Object.assign(o, { P, psi, lean, side });
    const f = [Math.sin(psi), 0, Math.cos(psi)], r = [-f[2], 0, f[0]];
    const foot = (sgn) => { const a = ph + (sgn > 0 ? 0 : PI); const fw = 0.2 * Math.sin(a), lift = 0.1 * Math.max(0, Math.cos(a)); return [pos[0] + f[0] * fw + r[0] * sgn * 0.1, 0.08 + lift, pos[2] + f[2] * fw + r[2] * sgn * 0.1]; };
    o.legs = { L: foot(-1), R: foot(1) };
    if (t < 42.0) { o.handL = 'ear'; o.ear = 1 - tr(t, 41.4, 42.0); o.curlL = 0.5; }
    else { o.handL = 'swing'; o.ear = 0; }
    o.handR = 'swing'; o.swing = ph; o.sw = 0.5 + 0.3 * tr(t, 42, 43);
    o.hy = lerp(0.2, 0.0, tr(t, 40, 42)); o.hp = 0.05; o.brow = 0.5; o.mouth = 0.2; o.lids = 0.0;
    return o;
  }
  return o;
}
// ---------- construir el esqueleto de una persona en F (slot 0 = principal, 1 = gemelo)
function buildPerson(o, slot) {
  const B = frameBody(o.P, o.psi, o.lean, o.side), J = F.J, off = slot * 40;
  const Cc = vadd(B.P, vmul(B.s, 0.5));
  const SL = vsub(vsub(Cc, vmul(B.r, 0.185)), vmul(B.s, 0.03)), SR = vsub(vadd(Cc, vmul(B.r, 0.185)), vmul(B.s, 0.03));
  const HF = headFrame(B, o.hy, o.hp, o.hr);
  const Hc = vadd(vadd(Cc, vmul(HF.u, 0.2)), vmul(HF.f, 0.015));
  // manos
  let tgL, tgR, poleL, poleR;
  const hearL = vadd(vadd(vadd(Hc, vmul(HF.r, -0.105)), vmul(HF.u, -0.15)), vmul(HF.f, 0.09));
  const rest = (sg) => vadd(vadd(vadd(Cc, vmul(B.r, 0.24 * sg)), vmul(B.s, -0.52)), vmul(B.ff, 0.06));
  const restBed = (sg) => vadd(vadd(vadd(Cc, vmul(B.r, 0.27 * sg)), vmul(B.s, -0.4)), vmul(B.ff, 0.2));
  if (o.handL === 'ear') { tgL = vmix(o.mode === 'bed' ? restBed(-1) : rest(-1), hearL, o.ear == null ? 1 : o.ear); poleL = vadd(vmul(B.r, -0.45), vadd(vmul(UP, -1), vmul(B.ff, -0.35))); }
  else if (o.handL === 'swing') { const sw = Math.sin(o.swing + PI) * 0.18 * o.sw; tgL = vadd(rest(-1), vmul(B.ff, sw)); poleL = vsub(vmul(B.r, -0.5), vmul(B.ff, 0.2)); }
  else { tgL = o.mode === 'bed' ? restBed(-1) : rest(-1); poleL = vsub(vmul(B.r, -0.7), vmul(UP, 0.6)); }
  if (Array.isArray(o.handR)) { tgR = o.handR; poleR = vadd(vmul(B.r, 0.4), vmul(UP, -0.7)); }
  else if (o.handR === 'swing') { const sw = Math.sin(o.swing) * 0.18 * o.sw; tgR = vadd(rest(1), vmul(B.ff, sw)); poleR = vsub(vmul(B.r, 0.5), vmul(B.ff, 0.2)); }
  else { tgR = o.mode === 'bed' ? restBed(1) : rest(1); poleR = vsub(vmul(B.r, 0.7), vmul(UP, 0.6)); }
  const aL = ik2(SL, tgL, 0.3, 0.27, poleL), aR = ik2(SR, tgR, 0.3, 0.27, poleR);
  const set = (k, v) => { J[off + k] = v[0]; J[off + k + 1] = v[1]; J[off + k + 2] = v[2]; };
  set(0, B.P); set(3, Cc); set(6, SL); set(9, SR); set(12, aL.E); set(15, aR.E); set(18, aL.W); set(21, aR.W); set(24, Hc);
  // piernas
  let hipL = vsub(vsub(B.P, vmul(B.r, 0.09)), vmul(B.s, 0.03)), hipR = vsub(vadd(B.P, vmul(B.r, 0.09)), vmul(B.s, 0.03));
  set(27, hipL); set(30, hipR);
  F['legs' + slot] = !!o.legs;
  if (o.legs) {
    const kL = ik2(hipL, o.legs.L, 0.43, 0.42, vadd(B.ff, vmul(B.r, -0.15))), kR = ik2(hipR, o.legs.R, 0.43, 0.42, vadd(B.ff, vmul(B.r, 0.15)));
    set(33, kL.E); set(36, kR.E); J[off + 39 - 0] = 0; F['aL' + slot] = kL.W; F['aR' + slot] = kR.W;
  }
  // marcos
  const H = slot ? F.H2 : F.H;
  H[0] = Hc[0]; H[1] = Hc[1]; H[2] = Hc[2]; H[3] = HF.r[0]; H[4] = HF.r[1]; H[5] = HF.r[2]; H[6] = HF.u[0]; H[7] = HF.u[1]; H[8] = HF.u[2]; H[9] = HF.f[0]; H[10] = HF.f[1]; H[11] = HF.f[2];
  H[12] = o.lids; H[13] = o.mouth; H[14] = o.brow; H[15] = o.gx; H[16] = o.gy; H[17] = o.smile || 0;
  // marcos de torso
  H[18] = B.r[0]; H[19] = B.r[1]; H[20] = B.r[2]; H[21] = B.s[0]; H[22] = B.s[1]; H[23] = B.s[2];
  // manos: origen, dirección dedos, normal palma, lado
  const HA = F.HAND, ho = slot * 20;
  const hand = (k, E, W, nrm, curl, sgn) => { const d = vnorm(vsub(W, E)); let n = vsub(nrm, vmul(d, vdot(nrm, d))); n = vnorm(n); const sd = vcross(d, n);
    HA[ho + k] = W[0]; HA[ho + k + 1] = W[1]; HA[ho + k + 2] = W[2]; HA[ho + k + 3] = d[0]; HA[ho + k + 4] = d[1]; HA[ho + k + 5] = d[2]; HA[ho + k + 6] = n[0]; HA[ho + k + 7] = n[1]; HA[ho + k + 8] = n[2]; HA[ho + k + 9] = curl; };
  // normal de la palma hacia la oreja / hacia el cuerpo
  const nL = o.handL === 'ear' ? vmul(HF.r, 1) : vmul(B.r, 1), nR = Array.isArray(o.handR) ? [-1, 0, 0] : vmul(B.r, -1);
  hand(0, aL.E, aL.W, nL, o.curlL, -1); hand(10, aR.E, aR.W, nR, o.curlR, 1);
  F['bed' + slot] = o.bed ? (o.bx == null ? 0 : o.bx) : null;
  F['sit' + slot] = o.mode; F['P' + slot] = B.P; F['ct' + slot] = Cc;
}
// ---------- geometría: cabeza y cuerpo
function head(x, y, z, H, mdet) {
  const dx = x - H[0], dy = y - H[1], dz = z - H[2];
  const lx = dx * H[3] + dy * H[4] + dz * H[5], ly = dx * H[6] + dy * H[7] + dz * H[8], lz = -(dx * H[9] + dy * H[10] + dz * H[11]);
  const ax = Math.abs(lx);
  let d = sdEll(lx, ly - 0.018, lz - 0.012, 0.079, 0.098, 0.099);
  d = sm(d, sdEll(lx, ly + 0.045, lz + 0.012, 0.071, 0.078, 0.076), 0.05);
  d = sm(d, sdEll(lx, ly + 0.093, lz + 0.04, 0.034, 0.026, 0.034), 0.03);
  d = sm(d, sdEll(ax - 0.058, ly + 0.035, lz + 0.05, 0.028, 0.03, 0.03), 0.04);
  let dskin = d;
  if (mdet) {
    dskin = sm(dskin, sdEll(ax - 0.034, ly - 0.021, lz + 0.078, 0.034, 0.011, 0.018), 0.02);   // arco de las cejas
    const lid = H[12], bro = H[14];
    const ocx = ax - 0.034, ocy = ly - 0.0, ocz = lz + 0.073;
    dskin = Math.max(dskin, -sdEll(ocx, ocy, ocz + 0.008, 0.0195, 0.0155, 0.0185) + 0.003);       // cuenca
    dskin = sm(dskin, cap(lx, ly, lz, 0, 0.0, -0.085, 0, -0.03, -0.104, 0.0102), 0.02);      // nariz
    dskin = sm(dskin, hyp3(lx, ly + 0.036, lz + 0.107) - 0.0138, 0.014);
    dskin = sm(dskin, hyp3(ax - 0.0165, ly + 0.034, lz + 0.097) - 0.0102, 0.014);
    // oreja (más pequeña y pegada al cráneo)
    const ex = ax - 0.078, ey = ly - 0.0, ez = lz - 0.012;
    if (ex < 0.07 && ex > -0.05 && Math.abs(ey) < 0.07) {
      let pin = sdEll(ex - 0.016, ey, ez, 0.011, 0.037, 0.026);
      const pocket = sdEll(ex - 0.007, ey + 0.003, ez + 0.004, 0.012, 0.021, 0.014);
      pin = Math.max(pin, -pocket + 0.001);
      pin = sm(pin, cap(ex - 0.0125, ey, ez, 0, 0.013, -0.006, 0, -0.006, 0.011, 0.0048), 0.006);
      pin = sm(pin, sdEll(ex - 0.014, ey + 0.035, ez - 0.002, 0.0085, 0.011, 0.0095), 0.01);
      pin = sm(pin, hyp3(ex - 0.006, ey + 0.001, ez + 0.019) - 0.0062, 0.006);
      dskin = sm(dskin, pin, 0.014);
    }
    const open = H[13];
    dskin = Math.max(dskin, -sdEll(lx, ly + 0.0705 + 0.004 * open, lz + 0.086, 0.019, 0.0028 + 0.008 * open, 0.012) + 0.0012);
    const lidd = sdEll(ocx, ocy + 0.004 - 0.016 * lid, ocz, 0.0205, 0.0135, 0.0185);
    dskin = Math.min(dskin, Math.max(lidd, -sdEll(ocx, ocy - 0.011, ocz - 0.001, 0.0205, 0.009, 0.0185)));
    const eye = hyp3(ocx, ocy, ocz + 0.0) - 0.0155;
    D = 1e9; MT = 7;
    if (eye < 0.03) { D = eye; MT = 11; }
    if (dskin < D) { D = dskin; MT = 7; }
    const sm_ = H[17];
    const up = sdEll(lx, ly + 0.0655 - 0.001 * sm_, lz + 0.085, 0.0205, 0.0058, 0.0105);
    const lo = sdEll(lx, ly + 0.0775 + 0.006 * open, lz + 0.082, 0.0185, 0.0068, 0.0098);
    const lp = sm(up, lo, 0.004); if (lp < D) { D = lp; MT = 13; }
    const hair = Math.max(sdEll(lx, ly - 0.027, lz - 0.01, 0.0865, 0.109, 0.109), -(ly - (0.075 + 0.006 * Math.sin(lx * 150 + 1.3) + 0.004 * Math.sin(lx * 310) - 0.9 * Math.max(0, lz) - 0.3 * Math.max(0, ax - 0.05))));
    if (hair < D) { D = hair; MT = 8; }
    return D;
  }
  D = d; MT = 7;
  const hairL = Math.max(sdEll(lx, ly - 0.027, lz - 0.01, 0.0865, 0.109, 0.109), -(ly - (0.075 - 0.9 * Math.max(0, lz))));
  if (hairL < D) { D = hairL; MT = 8; }
  return D;
}
function mano(x, y, z, ho, near) {
  const A = F.HAND; const Wx = A[ho], Wy = A[ho + 1], Wz = A[ho + 2], dx = A[ho + 3], dy = A[ho + 4], dz = A[ho + 5], nx = A[ho + 6], ny = A[ho + 7], nz = A[ho + 8], curl = A[ho + 9];
  const px = x - Wx, py = y - Wy, pz = z - Wz;
  const a = px * dx + py * dy + pz * dz, b = px * nx + py * ny + pz * nz;
  const sx = dy * nz - dz * ny, sy = dz * nx - dx * nz, sz = dx * ny - dy * nx; const c = px * sx + py * sy + pz * sz;
  if (!near) return sdEll(a - 0.07, b, c, 0.075, 0.025, 0.045);
  let d = sdEll(a - 0.045, b, c, 0.05, 0.017, 0.043);
  const cs = [-0.032, -0.011, 0.011, 0.031], ln = [0.036, 0.04, 0.038, 0.03];
  for (let i = 0; i < 4; i++) {
    const t1 = curl * 0.9, t2 = curl * 1.5, L1 = ln[i], L2 = ln[i] * 0.75, bx = 0.088, p1x = bx + Math.cos(t1) * L1, p1y = Math.sin(t1) * L1, p2x = p1x + Math.cos(t1 + t2 * 0.8) * L2, p2y = p1y + Math.sin(t1 + t2 * 0.8) * L2;
    d = Math.min(d, cap(a, b, c, bx, 0, cs[i], p1x, p1y, cs[i], 0.0085), cap(a, b, c, p1x, p1y, cs[i], p2x, p2y, cs[i], 0.0075));
  }
  const tb = 0.045 * 0 ; d = Math.min(d, cap(a, b, c, 0.025, 0.004, 0.036, 0.07, 0.014 + curl * 0.01, 0.06, 0.0105), cap(a, b, c, 0.07, 0.014 + curl * 0.01, 0.06, 0.1, 0.018 + curl * 0.012, 0.055, 0.009));
  return d;
}
function person(x, y, z, slot, fino, cerca) {
  const J = F.J, o = slot * 40, H = slot ? F.H2 : F.H, HA = slot * 20;
  // esfera envolvente
  const bc = F['ct' + slot], bd = Math.hypot(x - bc[0], y - bc[1] + 0.0, z - bc[2]) - 1.25;
  if (bd > 0.15) return bd;
  D = 1e9; MT = 9;
  const r0 = H[18], r1 = H[19], r2 = H[20], s0 = H[21], s1 = H[22], s2 = H[23];
  const P0 = J[o], P1 = J[o + 1], P2 = J[o + 2];
  // torso: elipsoides en el marco del cuerpo
  const qx = x - P0, qy = y - P1, qz = z - P2, a = qx * r0 + qy * r1 + qz * r2, b = qx * s0 + qy * s1 + qz * s2;
  const f0 = s1 * r2 - s2 * r1, f1 = s2 * r0 - s0 * r2, f2 = s0 * r1 - s1 * r0, c = qx * f0 + qy * f1 + qz * f2;
  let dt = sdEll(a, b - 0.03, c, 0.168, 0.115, 0.105);
  dt = sm(dt, sdEll(a, b - 0.2, c, 0.152, 0.15, 0.11), 0.07);
  dt = sm(dt, sdEll(a, b - 0.385, c, 0.188, 0.165, 0.12), 0.07);
  T_(dt, 9);
  // hombros y brazos
  const Cx = J[o + 3], Cy = J[o + 4], Cz = J[o + 5];
  T_(cap(x, y, z, J[o + 6], J[o + 7], J[o + 8], J[o + 9], J[o + 10], J[o + 11], 0.062), 9);
  T_(cap(x, y, z, J[o + 6], J[o + 7], J[o + 8], J[o + 12], J[o + 13], J[o + 14], 0.054), 9);
  T_(cap(x, y, z, J[o + 12], J[o + 13], J[o + 14], J[o + 18], J[o + 19], J[o + 20], 0.045), 9);
  T_(cap(x, y, z, J[o + 9], J[o + 10], J[o + 11], J[o + 15], J[o + 16], J[o + 17], 0.054), 9);
  T_(cap(x, y, z, J[o + 15], J[o + 16], J[o + 17], J[o + 21], J[o + 22], J[o + 23], 0.045), 9);
  // cuello (piel)
  const Hx = H[0], Hy = H[1], Hz = H[2];
  const neck = cap(x, y, z, Cx, Cy, Cz, Hx - H[6] * 0.07, Hy - H[7] * 0.07, Hz - H[8] * 0.07, 0.05);
  // piernas (si hay)
  if (F['legs' + slot]) {
    const hl0 = J[o + 27], hl1 = J[o + 28], hl2 = J[o + 29], hr0 = J[o + 30], hr1 = J[o + 31], hr2 = J[o + 32], kl = o + 33, kr = o + 36, aL = F['aL' + slot], aR = F['aR' + slot];
    T_(cap(x, y, z, hl0, hl1, hl2, J[kl], J[kl + 1], J[kl + 2], 0.078), 10); T_(cap(x, y, z, J[kl], J[kl + 1], J[kl + 2], aL[0], aL[1], aL[2], 0.056), 10);
    T_(cap(x, y, z, hr0, hr1, hr2, J[kr], J[kr + 1], J[kr + 2], 0.078), 10); T_(cap(x, y, z, J[kr], J[kr + 1], J[kr + 2], aR[0], aR[1], aR[2], 0.056), 10);
    const fw = [H[9] * 0, 0, 0];
    // pies: apuntan hacia delante del cuerpo
    const bf = [-(H[19] * 0), 0, 0];
    T_(cap(x, y, z, aL[0], aL[1], aL[2], aL[0] + F.fx * 0.2, aL[1] - 0.03, aL[2] + F.fz * 0.2, 0.04), 7); T_(cap(x, y, z, aR[0], aR[1], aR[2], aR[0] + F.fx * 0.2, aR[1] - 0.03, aR[2] + F.fz * 0.2, 0.04), 7);
  } else if (!F['bed' + slot] && F['bed' + slot] !== 0) {
    T_(cap(x, y, z, J[o + 27], J[o + 28], J[o + 29], J[o + 27] - 0.0, 0.1, J[o + 29] + 0.0, 0.08), 10);
  }
  // cabeza y manos
  const hdist = Math.hypot(x - Hx, y - Hy, z - Hz);
  const dn = sm(neck, 1e9, 0.01);
  T_(neck, 7);
  const near = fino && hdist < 0.46;
  if (hdist < 0.5) { const sv = D, mv = MT; const dh = head(x, y, z, H, near); const hd = D, hm = MT; D = sv; MT = mv; if (hd < D) { D = hd; MT = hm; } }
  else { const sv = D, mv = MT; head(x, y, z, H, false); const hd = D, hm = MT; D = sv; MT = mv; if (hd < D) { D = hd; MT = hm; } }
  for (let k = 0; k < 2; k++) {
    const ho = HA + k * 10, hx = F.HAND[ho], hy = F.HAND[ho + 1], hz = F.HAND[ho + 2], dd = Math.hypot(x - hx, y - hy, z - hz);
    if (dd < 0.5) { const dm = mano(x, y, z, ho, fino && dd < 0.46); T_(dm, 7); } else T_(dd - 0.15, 7);
  }
  MAT = MT; return D;
}
// ---------- habitación
function wavesD(x, y, z) {
  const t = F.t, ear = F.earPos, ax = ear[0] - CLK[0], ay = ear[1] - CLK[1], az = ear[2] - CLK[2], al = Math.hypot(ax, ay, az), ux = ax / al, uy = ay / al, uz = az / al;
  const px = x - CLK[0], py = y - CLK[1], pz = z - CLK[2], a = px * ux + py * uy + pz * uz;
  if (a < 0.02 || a > al + 0.05) return 1e9;
  const qx = px - ux * a, qy = py - uy * a, qz = pz - uz * a, perp = Math.sqrt(qx * qx + qy * qy + qz * qz);
  let best = 1e9; const period = 0.3, n = 4;
  for (let k = 0; k < n; k++) { const rk = ((t * 0.9 + k * period / n * 1.0) % period) * (al / period); const rr = ((t * 0.9 + k / n) % 1) * al; const R = 0.035 + 0.11 * (rr / al), dd = Math.hypot(perp - R, a - rr) - 0.0045; if (dd < best) best = dd; }
  return best;
}
function room(x, y, z) {
  const tw = F.twin;
  const inner = sdBox(x, y - 1.3, z, 2.5, 1.3, 1.85);
  const win = sdBox(x + 2.5, y - 1.5, z, 0.35, 0.6, 0.7), door = sdBox(x - 2.5, y - 1.05, z + 0.78, 0.35, 1.05, 0.46);
  const shell = Math.max(sdBox(x, y - 1.3, z, 2.8, 1.45, 2.15), -inner);
  D = Math.max(shell, -Math.min(win, door)); MT = 1;
  T_(y, 0);
  // ventana + cortinas
  let b = sdBox(x + 2.42, y - 1.3, z, 0.3, 1.15, 1.2);
  if (b > 0.3) T_(b, 3); else {
    T_(Math.max(sdBox(x + 2.5, y - 1.5, z, 0.08, 0.66, 0.76), -sdBox(x + 2.5, y - 1.5, z, 0.2, 0.6, 0.7)), 3);
    T_(sdBox(x + 2.5, y - 1.5, z, 0.03, 0.02, 0.7), 3); T_(sdBox(x + 2.5, y - 1.5, z, 0.03, 0.6, 0.02), 3);
    T_(sdRB(x + 2.38, y - 1.3, z - 0.95, 0.07, 1.0, 0.24, 0.04), 17); T_(sdRB(x + 2.38, y - 1.3, z + 0.95, 0.07, 1.0, 0.24, 0.04), 17);
  }
  // puerta + pasillo
  b = sdBox(x - 3.0, y - 1.2, z + 0.78, 0.75, 1.25, 0.72);
  if (b > 0.3) T_(b, 3); else {
    T_(Math.max(sdBox(x - 2.5, y - 1.05, z + 0.78, 0.1, 1.1, 0.52), -sdBox(x - 2.5, y - 1.05, z + 0.78, 0.3, 1.05, 0.46)), 3);
    const ang = F.doorAng;
    if (ang > 0.001) { const ca = Math.cos(ang), sa = Math.sin(ang), px = x - 2.46, pz = z + 0.32, lx = px * ca + pz * sa, lz = -px * sa + pz * ca; T_(sdRB(lx, y - 1.04, lz + 0.46, 0.022, 1.02, 0.45, 0.01), 3); }
    else T_(sdRB(x - 2.46, y - 1.04, z + 0.78, 0.022, 1.02, 0.45, 0.01), 3);
    T_(sdBox(x - 3.55, y - 1.05, z + 0.78, 0.05, 1.3, 0.8), 16);
    T_(Math.max(sdBox(x - 3.0, y - 1.3, z + 0.78, 0.6, 1.3, 0.95), -sdBox(x - 3.0, y - 1.3, z + 0.78, 0.7, 1.15, 0.5)), 1);
  }
  // alfombra
  T_(sdRB(x, y - 0.012, z + 0.75, 1.1, 0.012, 0.6, 0.01), 20);
  // camas
  const bxs = tw ? [-0.85, 0.85] : [BXS];
  for (let q = 0; q < bxs.length; q++) {
    const bx = bxs[q], xx = x - bx;
    b = sdBox(xx, y - 0.65, z - 0.75, 0.75, 0.65, 1.2);
    if (b > 0.25) { T_(b, 3); continue; }
    T_(sdRB(xx, y - 0.2, z - 0.8, 0.62, 0.2, 1.05, 0.02), 3);
    T_(sdRB(xx, y - 0.42, z - 0.78, 0.57, 0.1, 0.99, 0.045), 4);
    T_(sdRB(xx, y - 0.78, z - 1.8, 0.66, 0.52, 0.04, 0.02), 3);
    T_(sdRB(xx - 0.27, y - 0.61, z - 1.52, 0.24, 0.075, 0.17, 0.05), 5); T_(sdRB(xx + 0.27, y - 0.61, z - 1.52, 0.24, 0.075, 0.17, 0.05), 5);
    const wv = 0.012 * Math.sin(xx * 9 + z * 6) + 0.01 * Math.sin(z * 13 + xx * 3);
    T_(sdRB(xx, y - 0.57 - wv, z - 0.18, 0.555, 0.062, 0.76, 0.05), 6);
    T_(cap(xx, y, z, -0.5, 0.63, 0.94, 0.5, 0.63, 0.94, 0.055), 6);
    T_(sdRB(xx - 0.58, y - 0.36, z - 0.18, 0.05, 0.22, 0.76, 0.04), 6); T_(sdRB(xx + 0.58, y - 0.36, z - 0.18, 0.05, 0.22, 0.76, 0.04), 6);
  }
  // mesilla + despertador + lámpara
  if (!tw) {
    b = sdBox(x + 0.92, y - 0.7, z - 1.6, 0.4, 0.62, 0.4);
    if (b > 0.25) T_(b, 18); else {
      const nx = x + 0.92; T_(sdRB(nx, y - 0.3, z - 1.55, 0.26, 0.3, 0.22, 0.02), 18);
      const cx = x - CLK[0] - F.clkJit, cy = y - CLK[1], cz = z - CLK[2];
      T_(sdEll(cx, cy, cz, 0.075, 0.075, 0.034), 14); T_(hyp3(cx - 0.05, cy - 0.075, cz) - 0.026, 14); T_(hyp3(cx + 0.05, cy - 0.075, cz) - 0.026, 14);
      T_(cap(cx, cy, cz, -0.05, -0.07, 0, -0.07, -0.1, 0, 0.007), 14); T_(cap(cx, cy, cz, 0.05, -0.07, 0, 0.07, -0.1, 0, 0.007), 14);
      T_(cap(x, y, z, -0.92, 0.6, 1.76, -0.92, 0.88, 1.76, 0.012), 14); T_(sdEll(x + 0.92, y - 0.98, z - 1.76, 0.1, 0.09, 0.1), 21);
    }
  }
  // cuadro, cómoda y planta
  b = sdBox(x, y - 1.62, z - 1.82, 0.56, 0.36, 0.06);
  if (b > 0.25) T_(b, 3); else { T_(sdRB(x, y - 1.62, z - 1.84, 0.52, 0.32, 0.02, 0.01), 3); T_(sdBox(x, y - 1.62, z - 1.82, 0.46, 0.26, 0.01), 22); }
  b = sdBox(x - 1.75, y - 0.75, z - 1.35, 0.4, 0.8, 0.3);
  if (b > 0.25) T_(b, 18); else { T_(sdRB(x - 1.75, y - 0.45, z - 1.35, 0.35, 0.45, 0.22, 0.02), 18); T_(sdEll(x - 1.75, y - 1.15, z - 1.35, 0.14, 0.2, 0.14), 23); T_(sdEll(x - 1.75, y - 0.93, z - 1.35, 0.08, 0.06, 0.08), 14); }
  // personas
  { const dR = D, mR = MT;
    const dp = person(x, y, z, 0, F.near0, true), pm = MAT; D = dR; MT = mR; if (dp < D) { D = dp; MT = pm; }
    if (tw) { const dR2 = D, mR2 = MT; const dq = person(x, y, z, 1, F.near1, true), pm2 = MAT; D = dR2; MT = mR2; if (dq < D) { D = dq; MT = pm2; } } }
  if (!F.shadow && F.waves > 0) { const w = wavesD(x, y, z); if (w < D) { D = w; MT = 30; } }
  return D;
}
// ---------- oído interno
function sdRC(qx, qy, qz, r1, r2, h) { const qxz = Math.hypot(qx, qz), b = (r1 - r2) / h, a = Math.sqrt(1 - b * b), k = qxz * (-b) + qy * a; if (k < 0) return Math.hypot(qxz, qy) - r1; if (k > a * h) return Math.hypot(qxz, qy - h) - r2; return qxz * a + qy * b - r1; }
const CH = 0.17, CT = 2.6;
function spiral(qx, qy, qz) {
  const th = Math.atan2(qz, qx), ph = th - TAU * CT * qy / CH; const ridge = 0.5 + 0.5 * Math.cos(ph);
  return (sdRC(qx, qy, qz, 0.125, 0.03, CH) - 0.011 * ridge) * 0.7;
}
function arcT(qu, qv, qn, R, r, a0, a1) {
  let ang = Math.atan2(qv, qu); let da = ang - a0; da -= Math.floor(da / TAU) * TAU; const span = a1 - a0;
  if (da <= span) return Math.hypot(Math.hypot(qu, qv) - R, qn) - r;
  const toEnd = da - span, toStart = TAU - da; const e = toEnd < toStart ? a1 : a0;
  return Math.hypot(qu - R * Math.cos(e), qv - R * Math.sin(e), qn) - r;
}
const IEC = [40, 0, 0];
function ear(x, y, z) {
  const O = IEC, lx = x - O[0], ly = y - O[1], lz = z - O[2];
  // cascarón de la cabeza (vidrio): elipsoide + nariz + oreja
  const bb = sdBox(lx + 0.36, ly, lz - 0.04, 0.82, 0.5, 0.5); D = bb > 0 ? bb + 0.02 : 1e9; MT = 41;
  // contenido: oído interno (izquierdo) en coordenadas locales IE
  const ix = lx + 0.36, iy = ly - 0.0, iz = lz - 0.04;
  if (Math.abs(ix) < 0.8 && Math.abs(iy) < 0.5 && Math.abs(iz) < 0.5) {
    // conducto auditivo
    const cn = Math.max(cap(ix, iy, iz, -0.4, 0, 0, -0.1, 0, 0, 0.055) , -cap(ix, iy, iz, -0.41, 0, 0, -0.08, 0, 0, 0.043));
    T_(cn, 41);
    T_(sdEll(ix + 0.1, iy, iz, 0.012, 0.062, 0.062), 42); // tímpano
    T_(cap(ix, iy, iz, -0.085, 0, 0, -0.03, 0.055, 0, 0.012), 43); T_(cap(ix, iy, iz, -0.03, 0.055, 0, 0.02, 0.035, 0.03, 0.012), 43); T_(cap(ix, iy, iz, 0.02, 0.035, 0.03, 0.06, 0.0, 0.05, 0.0095), 43);
    // cóclea (eje apunta hacia delante −z y un poco hacia dentro)
    const cx = ix - 0.12, cy = iy + 0.1, cz = iz - 0.02;
    const e1 = F.ce1, e2 = F.ce2, ax = F.cax;
    const qx = cx * e1[0] + cy * e1[1] + cz * e1[2], qy = cx * ax[0] + cy * ax[1] + cz * ax[2], qz = cx * e2[0] + cy * e2[1] + cz * e2[2];
    if (Math.hypot(qx, qz) < 0.24 && qy > -0.08 && qy < 0.26) { T_(spiral(qx, qy, qz), 44); }
    // vestíbulo + canales
    const vx = ix - 0.02, vy = iy - 0.12, vz = iz - 0.1;
    T_(sdEll(vx, vy, vz, 0.05, 0.042, 0.055), 46);
    if (Math.hypot(vx, vy, vz) < 0.33) {
      const k1 = F.canal;
      for (let c = 0; c < 3; c++) {
        const cc = k1[c]; const dx = vx - cc[0], dy = vy - cc[1], dz = vz - cc[2];
        const qu = dx * cc[3] + dy * cc[4] + dz * cc[5], qv = dx * cc[6] + dy * cc[7] + dz * cc[8], qn = dx * cc[9] + dy * cc[10] + dz * cc[11];
        T_(arcT(qu, qv, qn, 0.115, 0.0125, cc[12], cc[13]), 47);
        const ex = cc[0] + cc[3] * 0.115 * Math.cos(cc[12]) + cc[6] * 0.115 * Math.sin(cc[12]), ey = cc[1] + cc[4] * 0.115 * Math.cos(cc[12]) + cc[7] * 0.115 * Math.sin(cc[12]), ez = cc[2] + cc[5] * 0.115 * Math.cos(cc[12]) + cc[8] * 0.115 * Math.sin(cc[12]);
        T_(hyp3(vx - ex, vy - ey, vz - ez) - 0.022, 46);
      }
      if (!F.shadow) { const B = F.beads; for (let i = 0; i < B.length; i += 3) { const bd = hyp3(vx - B[i], vy - B[i + 1], vz - B[i + 2]) - 0.0125; if (bd < D) { D = bd; MT = 48; } } }
    }
    // nervio
    T_(cap(ix, iy, iz, 0.12, -0.1, 0.0, 0.5, 0.0, 0.05, 0.022), 49);
    // pulsos de sonido hacia el oído
    if (F.pulse > 0) { for (let k = 0; k < 4; k++) { const u = (F.pulseT * 0.55 + k * 0.25) % 1; const px = -0.4 + u * 0.3; const pd = hyp3(ix - px, iy, iz) - 0.02 * (1 - u * 0.5); if (pd < D) { D = pd; MT = 50; } } }
  }
  return D;
}
function mapE(sc, x, y, z) {
  if (sc.set === 'ear') { const d = ear(x, y, z); MAT = MT; return d * 0.85; }
  // aviso: warp del vértigo
  if (F.vert > 0) { const a = F.vert; const wx = x + a * (0.07 * Math.sin(y * 2.7 + F.t * 3.1) + 0.04 * Math.sin(z * 3.3)), wy = y + a * 0.05 * Math.sin(x * 2.3 + F.t * 2.4), wz = z + a * 0.07 * Math.sin(y * 2.9 + x * 1.7 + F.t * 2.9); D = 1e9; MT = 0; const d = room(wx, wy, wz); MAT = MT; return d * (1 - 0.35 * a); }
  D = 1e9; MT = 0; const d = room(x, y, z); MAT = MT; return d;
}
// ---------- cámara
const K = (t, ex, ey, ez, tx, ty, tz, fov, roll) => [t, ex, ey, ez, tx, ty, tz, fov, roll || 0];
const CAMS = require('./camaras');
function camara(t) {
  const si = shotIdx(t), kf = CAMS[si]; let i = 0; while (i < kf.length - 2 && t >= kf[i + 1][0]) i++;
  const a = kf[i], b = kf[i + 1], u = (t - a[0]) / Math.max(1e-3, b[0] - a[0]);
  const e = kf.lin ? clamp(u, 0, 1) : ease(u), o = []; for (let k = 1; k < 9; k++) o.push(lerp(a[k], b[k], e)); return o;
}
// ---------- prepara
const SUN = vnorm([-0.78, 0.62, 0.12]);
const E = {
  prepara(t) {
    F.t = t; const si = shotIdx(t); F.set = SET[si]; const c = camara(t);
    F.twin = t >= CUT[9] && t < CUT[11];
    F.cam = [c[0], c[1], c[2]];
    // puerta y despertador
    F.doorAng = tr(t, 42.0, 43.5) * 1.55; F.clkJit = (t < 2.9 ? 0.004 * Math.sin(t * 110) : 0);
    F.waves = t < 4.38 || (t >= 9 && t < 0) ? 1 : 0;
    // vértigo
    F.vert = (t >= CUT[8] && t < CUT[9]) ? tr(t, 25.9, 27.0) * 0.85 + 0.1 * Math.sin(t * 5) : 0;
    const sc = { set: F.set, t, eye: [c[0], c[1], c[2]], target: [c[3] + 1e-3, c[4], c[5]], fov: c[6], roll: c[7], far: F.set === 'ear' ? 12 : 30, pasos: F.set === 'ear' ? 150 : 170, shy: 0.045, paso: 0.92, thr: 0.0018, eps: 0.0015, vig: 0.35 };
    if (F.set === 'room') {
      const o0 = poseAt(t, 0); buildPerson(o0, 0); F.o0 = o0;
      if (F.twin) { const o1 = poseAt(t, 1); buildPerson(o1, 1); F.o1 = o1; }
      // dirección de los pies
      const fx = Math.sin(o0.psi), fz = Math.cos(o0.psi); F.fx = fx; F.fz = fz;
      const H = F.H; F.near0 = Math.hypot(c[0] - H[0], c[1] - H[1], c[2] - H[2]) < 3.2; F.near1 = F.twin;
      // oreja izquierda real (para las ondas)
      F.earPos = [H[0] - H[3] * 0.078, H[1] - H[4] * 0.078, H[2] - H[5] * 0.078];
      // las ondas pierden fuerza antes de llegar a la oreja (cuanto más avanza «apagado», antes mueren)
      F.waveDie = lerp(0.10, 0.5, tr(t, 2.14, 3.2));
      if (t < 4.38) sc.vig = 0.35 + 0.35 * tr(t, 1.8, 3.4) * (1 - tr(t, 4.0, 4.38));
      if (t >= CUT[11] && t < CUT[12]) sc.vig = 0.35 + 0.25 * tr(t, 36.0, 38.5);
      if (t >= CUT[8] && t < CUT[9]) sc.vig = 0.4 + 0.25 * Math.sin(t * 3.2) ** 2;
      // roll del vértigo
      if (t >= CUT[8] && t < CUT[9]) sc.roll += tr(t, 25.9, 27.3) * (0.34 * Math.sin((t - 25.9) * 2.1) + 0.16 * Math.sin((t - 25.9) * 5.3));
      if (t >= CUT[8] && t < CUT[9]) sc.fov += 4 * Math.sin(t * 3.7) * tr(t, 26, 27);
    } else {
      // oído interno: cóclea, canales, esferas de fluido
      const ax = vnorm([0.30, -0.15, -0.94]); let e1 = vnorm(vcross(ax, [0, 1, 0])); const e2 = vcross(ax, e1); F.ce1 = e1; F.ce2 = e2; F.cax = ax;
      const mk = (n, a0, a1) => { const nn = vnorm(n); let u = vnorm(vcross(nn, [0, 1, 0.01])); const v = vcross(nn, u); return [0.0, 0.0, 0.0, u[0], u[1], u[2], v[0], v[1], v[2], nn[0], nn[1], nn[2], a0, a1]; };
      const c1 = mk([0.7, 0, 0.7], 0.4, 0.4 + 4.6), c2 = mk([0.7, 0, -0.7], 0.2, 0.2 + 4.7), c3 = mk([0, 1, 0], 0.1, 0.1 + 4.8);
      c1[0] = 0.0; c1[1] = 0.1; c1[2] = 0.0; c2[0] = 0.0; c2[1] = 0.06; c2[2] = 0.1; c3[0] = 0.0; c3[1] = -0.02; c3[2] = 0.11;
      F.canal = [c1, c2, c3];
      const spd = (t >= CUT[7] && t < CUT[8]) ? 0.9 + 1.4 * tr(t, 23.0, 24.8) : 0.12;
      const B = []; for (let c = 0; c < 3; c++) { const cc = F.canal[c]; for (let i = 0; i < 7; i++) { const a = cc[12] + (cc[13] - cc[12]) * (((F.t * spd * (c % 2 ? -1 : 1) + i / 7 + c * 0.13) % 1 + 1) % 1); const px = cc[0] + 0.115 * (cc[3] * Math.cos(a) + cc[6] * Math.sin(a)), py = cc[1] + 0.115 * (cc[4] * Math.cos(a) + cc[7] * Math.sin(a)), pz = cc[2] + 0.115 * (cc[5] * Math.cos(a) + cc[8] * Math.sin(a)); B.push(px, py, pz); } }
      F.beads = B;
      F.pulse = (t >= CUT[2] && t < 8.6) ? 1 : 0; F.pulseT = t - CUT[2];
      sc.vig = 0.3;
      if (t >= CUT[7] && t < CUT[8]) sc.roll += tr(t, 23.0, 25.0) * (0.3 * Math.sin((t - 23) * 2.4));
    }
    sc.vert = F.vert; return sc;
  },
  map(sc, x, y, z) { return mapE(sc, x, y, z); },
  cielo(sc, dx, dy, dz) {
    if (sc.set === 'ear') { const g = Math.max(0, dy * 0.5 + 0.5), h = Math.max(0, dx * 0.5 + 0.5) * 0.5; return [0.012 + 0.03 * g + 0.01 * h, 0.032 + 0.07 * g + 0.02 * h, 0.07 + 0.14 * g + 0.04 * h]; }
    const g = Math.max(0, 0.5 + dy * 0.5); return [0.7 + 0.5 * g, 0.85 + 0.45 * g, 1.2 + 0.3 * g];
  },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) {
    map(x, y, z); const m = MAT;
    return sc.set === 'ear' ? shadeEar(sc, x, y, z, nx, ny, nz, dx, dy, dz, m, map) : shadeRoom(sc, x, y, z, nx, ny, nz, dx, dy, dz, m, map);
  },
};
// ---------- sombreado del oído interno
function shadeEar(sc, x, y, z, nx, ny, nz, dx, dy, dz, m, map) {
  const t = F.t, fres = Math.pow(1 - Math.max(0, -(nx * dx + ny * dy + nz * dz)), 3);
  const L = vnorm([-0.5, 0.7, -0.5]), ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
  let alb = [0.5, 0.5, 0.5], em = [0, 0, 0], spec = 0;
  // brillo de la cóclea: se apaga con «72 horas»
  const cochBright = t < 7.5 ? tr(t, 5.2, 6.4) : t < 11.66 ? Math.max(0, 1 - tr(t, 8.0, 9.6)) * (0.8 + 0.2 * Math.sin(t * 40) * (t > 8.6 ? 1 : 0.2)) : 0.02;
  const cochB2 = t >= 11.66 ? 0.03 : cochBright;
  if (m === 41) { alb = [0.85, 0.62, 0.55]; em = [0.08, 0.05, 0.05]; spec = 0.3; }
  else if (m === 42) { alb = [0.9, 0.78, 0.7]; em = [0.25, 0.2, 0.16]; spec = 0.4; }
  else if (m === 43) { alb = [0.96, 0.94, 0.88]; em = [0.3, 0.3, 0.27]; spec = 0.7; }
  else if (m === 44) {
    const ix = x - IEC[0] + 0.36 - 0.12, iy = y - IEC[1] + 0.1, iz = z - IEC[2] - 0.04 - 0.02, e1 = F.ce1, e2 = F.ce2, ax = F.cax;
    const qx = ix * e1[0] + iy * e1[1] + iz * e1[2], qy = ix * ax[0] + iy * ax[1] + iz * ax[2], qz = ix * e2[0] + iy * e2[1] + iz * e2[2];
    const th = Math.atan2(qz, qx), ph = th - TAU * CT * qy / CH, ridge = 0.5 + 0.5 * Math.cos(ph), groove = Math.pow(1 - ridge, 3), u = clamp(qy / CH, 0, 1);
    const w = cochB2, trav = Math.exp(-Math.pow((u - ((t * 0.5) % 1.15)) * 4.5, 2)) * 1.2 + 0.35;
    alb = [0.92, 0.7, 0.5]; const gl = groove * w * trav; em = [1.5 * gl + 0.18 * w * ridge, 0.82 * gl + 0.07 * w * ridge, 0.28 * gl]; spec = 0.5;
    em = em.map(v => v + 0.0);
  }
  else if (m === 45) { alb = [0.6, 0.4, 0.4]; em = [0.1 * cochB2, 0.05, 0.02]; }
  else if (m === 46) { alb = [0.25, 0.7, 0.85]; em = [0.05, 0.45, 0.62]; spec = 0.8; }
  else if (m === 47) { alb = [0.2, 0.7, 0.85]; em = [0.05, 0.38, 0.55]; spec = 0.8; }
  else if (m === 48) { alb = [1, 1, 1]; em = [0.9, 1.2, 1.4]; }
  else if (m === 49) { alb = [0.95, 0.85, 0.5]; em = [0.5, 0.42, 0.18]; }
  else if (m === 50) { alb = [0.7, 0.9, 1.0]; em = [0.8, 1.1, 1.4]; }
  const rim = 0.6 * fres;
  // brillo especular
  const hx = L[0] - dx, hy = L[1] - dy, hz = L[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, sp = spec * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 36);
  const hl2 = (m === 47 && F.highlightCanal) ? 1 : 0;
  return [alb[0] * (0.22 + 1.1 * ndl) + em[0] + rim * 0.25 + sp, alb[1] * (0.22 + 1.1 * ndl) + em[1] + rim * 0.55 + sp, alb[2] * (0.25 + 1.1 * ndl) + em[2] + rim * 0.9 + sp];
}

// sombra analítica del sol: ventana + esferas de las personas
const sstep = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
function sunVis(x, y, z, m) {
  const sx = SUN[0], sy = SUN[1], sz = SUN[2];
  let vis = 1;
  const self = (m === 7 || m === 8 || m === 9 || m === 10 || m === 11 || m === 13);
  if (x > -2.45) { const s = (-2.5 - x) / sx; const yy = y + sy * s, zz = z + sz * s, pen = self ? 0.9 + 0.3 * s : 0.12 + 0.16 * s; vis = clamp((0.62 - Math.abs(yy - 1.5)) / pen + (self ? 0.35 : 0), 0, 1) * clamp((0.72 - Math.abs(zz)) / pen + (self ? 0.35 : 0), 0, 1); if (self) vis = 0.9; }
  if (vis <= 0) return 0;
  for (let k = 0; k < (F.twin ? 2 : 1); k++) {
    if (self && !F.twin) break;
    if (self && F.twin) { const H = k ? F.H2 : F.H, dd = Math.hypot(x - H[0], y - H[1], z - H[2]); if (dd < 1.0) continue; }
    const H = k ? F.H2 : F.H, C = F['ct' + k], P = F['P' + k];
    const sph = [[H[0], H[1], H[2], 0.11], [C[0], C[1] - 0.05, C[2], 0.19], [P[0], P[1], P[2], 0.17]];
    for (const q of sph) { const cx = q[0] - x, cy = q[1] - y, cz = q[2] - z, tc = cx * sx + cy * sy + cz * sz; if (tc > 0.03) { const dx = cx - sx * tc, dy = cy - sy * tc, dz = cz - sz * tc, dd = Math.sqrt(dx * dx + dy * dy + dz * dz); vis *= sstep(q[3] * 0.5, q[3] * 1.25 + 0.05 * tc, dd); } }
  }
  return vis;
}
function ao3(map, x, y, z, nx, ny, nz) { let o = 0, w = 1; for (let i = 0; i < 3; i++) { const h = [0.025, 0.08, 0.2][i], d = map(x + nx * h, y + ny * h, z + nz * h); o += (h - d) * w; w *= 0.6; } return clamp(1 - 2.6 * o, 0.3, 1); }
// ---------- sombreado de la habitación
function headLocal(x, y, z, H) { const dx = x - H[0], dy = y - H[1], dz = z - H[2]; return [dx * H[3] + dy * H[4] + dz * H[5], dx * H[6] + dy * H[7] + dz * H[8], -(dx * H[9] + dy * H[10] + dz * H[11])]; }
function shadeRoom(sc, x, y, z, nx, ny, nz, dx, dy, dz, m, map) {
  const t = F.t; let alb = [0.5, 0.5, 0.5], em = [0, 0, 0], spec = 0, sh = 1, aoOn = true, wrap = 0, shin = 30;
  if (m === 16) return [3.2, 3.0, 2.6];
  if (m === 30) { const ear = F.earPos; const de = Math.hypot(x - ear[0], y - ear[1], z - ear[2]); const fade = clamp((de - F.waveDie * 0.5) / 0.3, 0, 1); const k = 0.25 + 1.5 * fade; E.A = 1; return [0.45 * k, 1.1 * k, 1.5 * k]; }
  let hLoc = null, hSlot = 0;
  switch (m) {
    case 0: { // suelo de madera
      const pl = Math.floor(x / 0.16), g = Math.abs(((x / 0.16) % 1 + 1) % 1 - 0.5); const v = h2(pl * 3.1, Math.floor((z + h2(pl, 1) * 3) / 1.1) * 1.7); alb = [0.40 + 0.1 * v, 0.24 + 0.07 * v, 0.12 + 0.04 * v]; alb = alb.map(c => c * (0.5 + 1.1 * Math.min(1, (0.5 - g) * 14))); spec = 0.2; shin = 20; break; }
    case 1: { alb = [0.86, 0.76, 0.64]; if (y > 2.52) alb = [0.92, 0.9, 0.86]; if (y < 0.12) alb = [0.92, 0.9, 0.86]; if (x < -2.4 && y > 0.9 && y < 2.1 && Math.abs(z) < 0.7) alb = [0.4, 0.4, 0.4]; break; }
    case 3: alb = [0.38, 0.23, 0.13]; spec = 0.2; break;
    case 4: alb = [0.82, 0.86, 0.9]; wrap = 0.2; break;
    case 5: alb = [0.92, 0.92, 0.94]; wrap = 0.3; break;
    case 6: alb = [0.22, 0.44, 0.5]; { const st = Math.abs(((z * 4.2) % 1 + 1) % 1 - 0.5); alb = alb.map((c, i) => c * (st < 0.08 ? 1.5 : 1)); } wrap = 0.25; break;
    case 14: { alb = [0.7, 0.68, 0.64]; spec = 0.8; shin = 60; const cx = x - CLK[0] - F.clkJit, cy = y - CLK[1], cz = z - CLK[2]; if (cz < -0.02 && hyp3(cx, cy, 0) < 0.062) { alb = [0.95, 0.94, 0.9]; const r = Math.hypot(cx, cy); const hm = (t < 34.88 ? 0.2 : t < 39.9 ? 0.2 + (t - 34.88) * 7.5 : 0.2) , mm = hm * 12; const ah = Math.atan2(cx, cy); const hand = (ang, len, wd) => { const da = Math.abs(Math.atan2(Math.sin(ah - ang), Math.cos(ah - ang))) * r; return (r < len && da < wd) ? 1 : 0; }; if (hand(hm, 0.034, 0.0035) || hand(mm, 0.052, 0.0022) || r < 0.004) alb = [0.05, 0.05, 0.05]; } break; }
    case 17: alb = [0.78, 0.7, 0.55]; wrap = 0.5; break;
    case 18: alb = [0.45, 0.28, 0.16]; spec = 0.3; break;
    case 19: alb = [0.92, 0.92, 0.9]; break;
    case 20: { alb = [0.55, 0.3, 0.28]; const sx = Math.abs(((x * 5) % 1 + 1) % 1 - 0.5); if (sx < 0.1) alb = [0.7, 0.5, 0.35]; wrap = 0.4; break; }
    case 21: alb = [0.9, 0.82, 0.6]; em = [0.5, 0.42, 0.22]; break;
    case 22: { alb = [0.35, 0.55, 0.62]; const cx = x * 8, cz = z * 0; alb = [0.28 + 0.2 * Math.sin(x * 9), 0.45 + 0.2 * Math.sin(x * 7 + 1), 0.5 + 0.1 * Math.sin(x * 5)]; break; }
    case 23: alb = [0.18, 0.5, 0.2]; break;
    case 7: case 8: case 9: case 10: case 11: case 13: break;
  }
  // personas: materiales
  let skinLocal = null;
  if (m === 7 || m === 8 || m === 11 || m === 13 || m === 9 || m === 10) {
    // elegir slot por proximidad de la cabeza (útil con gemelos)
    let H = F.H; if (F.twin) { const d0 = Math.hypot(x - F.H[0], y - F.H[1], z - F.H[2]), d1 = Math.hypot(x - F.H2[0], y - F.H2[1], z - F.H2[2]); if (d1 < d0) H = F.H2; }
    const dH = Math.hypot(x - H[0], y - H[1], z - H[2]);
    if (m === 7) {
      alb = [0.82, 0.58, 0.46]; wrap = 0.6;
      if (dH < 0.25) { const [lx, ly, lz] = headLocal(x, y, z, H); const ax = Math.abs(lx);
        const bw = Math.abs(ly - (0.045 + 0.01 * H[14] + 0.9 * Math.pow(Math.max(0, ax - 0.034), 2) * 6 * -1 * -1 * 0.0 + 0.0 - 0.0)); if (lz < -0.065 && ax > 0.012 && ax < 0.06 && Math.abs(ly - (0.033 + 0.012 * H[14] - 0.12 * Math.max(0, ax - 0.04) + 0.02 * (0.04 - Math.min(ax, 0.04)))) < 0.0034) alb = [0.14, 0.085, 0.06];
        const ch = Math.hypot(ax - 0.058, ly + 0.035, lz + 0.05); alb = alb.map((c, i) => c + [0.08, -0.02, -0.02][i] * clamp(1 - ch / 0.04, 0, 1));
        const ex = ax - 0.078, ey = ly, ez = lz - 0.012; if (ex > -0.03 && ex < 0.05 && Math.abs(ey) < 0.05) { const cd = Math.hypot(ex - 0.001, ey - 0.002, ez + 0.003); const wE = sstep(0.045, 0.012, cd); alb = alb.map((c, i) => c * (1 - wE * (1 - [1.0, 0.85, 0.85][i]))); const wc = sstep(0.018, 0.006, cd); alb = alb.map(c => c * (1 - 0.55 * wc)); if (cd < 0.008) alb = alb.map(c => c * 0.3); }
        const nd = Math.hypot(ax - 0.0165, ly + 0.03, lz + 0.1); if (nd < 0.007) alb = alb.map(c => c * 0.35);
        const ed = Math.hypot(ax - 0.034, ly - 0.0, lz + 0.075); if (ed < 0.024) alb = alb.map(c => c * (0.96 - 0.07 * clamp(1 - ed / 0.024, 0, 1)));
      }
    } else if (m === 8) { alb = [0.1, 0.065, 0.045]; { const hv = n3(x * 260, y * 260, z * 260); alb = alb.map(c => c * (0.72 + 0.5 * hv)); } spec = 0.25; shin = 25; }
    else if (m === 13) { alb = [0.66, 0.26, 0.28]; spec = 0.35; shin = 25; wrap = 0.4; }
    else if (m === 9) { alb = [0.18, 0.42, 0.52]; { const nn = n3(x * 40, y * 40, z * 40); alb = alb.map(c => c * (0.93 + 0.14 * nn)); } wrap = 0.35; }
    else if (m === 10) { alb = [0.12, 0.16, 0.34]; wrap = 0.3; }
    else if (m === 11) {
      const [lx, ly, lz] = headLocal(x, y, z, H); const ax = Math.abs(lx);
      const rad = Math.hypot(ax - 0.034 + (lx < 0 ? -1 : 1) * 0.0 - H[15] * 0.0, ly - 0.014 - H[16] * 0.0);
      const cxr = (ax - 0.034) - H[15] * 0.004 * (lx < 0 ? -1 : 1), cyr = (ly - 0.0) - H[16] * 0.004; const rr = Math.hypot(cxr, cyr);
      alb = [0.93, 0.91, 0.89]; if (lz < -0.07 && rr < 0.0088) { alb = [0.30, 0.17, 0.08]; if (rr < 0.004) alb = [0.01, 0.01, 0.012]; else if (rr > 0.0068) alb = [0.14, 0.09, 0.05]; }
      spec = 1.6; shin = 140;
    }
  }
  // iluminación
  const ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]), ndw = clamp((nx * SUN[0] + ny * SUN[1] + nz * SUN[2] + wrap) / (1 + wrap), 0, 1);
  if (ndl > 0.02) sh = process.env.DBG === 'nosun' ? 1 : sunVis(x, y, z, m);
  const ao = process.env.DBG === 'noao' ? 1 : ao3(map, x, y, z, nx, ny, nz);
  const sky = 0.5 + 0.5 * ny;
  const amb = [0.5 * sky + 0.16, 0.5 * sky + 0.15, 0.56 * sky + 0.15];
  // rebote cálido del suelo
  const bounce = Math.max(0, -ny) * 0.14;
  let key = ndw * sh; if (wrap > 0) key = (ndw * 0.9 + 0.0) * (0.35 + 0.65 * sh);
  const k = [2.0, 1.65, 1.25];
  // luz de relleno desde la puerta/pasillo (solo cuando está abierta)
  const dl = F.doorAng > 0.02 ? Math.max(0, nx * -1) * F.doorAng * 0.9 / (1 + Math.hypot(x - 3, z + 0.78) * 0.6) : 0;
  let c = [0, 1, 2].map(i => alb[i] * ((k[i] * key + amb[i] * ao * 1.0 + bounce * [1, 0.7, 0.5][i]) * (m === 1 ? 0.9 : 1) + dl * [1.6, 1.5, 1.3][i]) + em[i]);
  if (spec > 0) { const hx = SUN[0] - dx, hy = SUN[1] - dy, hz = SUN[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, sp = spec * Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), shin) * sh; c = c.map(v => v + sp); }
  // luz de contorno (rim) fría desde la ventana en la piel para separar del fondo
  if (m === 7 || m === 8 || m === 9) { const rim = Math.pow(1 - Math.max(0, -(nx * dx + ny * dy + nz * dz)), 3) * 0.18 * ao; c = [c[0] + rim * 0.7, c[1] + rim * 0.85, c[2] + rim]; }
  // enfriar y atenuar con «silencio»: tras apagado el mundo se desatura
  const sil = F.set === 'room' ? (t >= 2.14 && t < 4.38 ? tr(t, 2.14, 3.6) : (t >= CUT[11] && t < CUT[12] ? tr(t, 36.6, 38.6) * 0.8 : 0)) : 0;
  if (sil > 0) { const g = (c[0] + c[1] + c[2]) / 3; c = c.map((v, i) => mix(v, g * [0.9, 1.0, 1.15][i], sil * 0.55)); }
  return c;
}

const GLASS = [[0, 0, 0, 0.78, 0.95, 0.9, 1.0], [0, -0.14, -0.9, 0.11, 0.17, 0.13, 0.8], [-0.76, 0, 0.1, 0.07, 0.19, 0.13, 0.9], [0.0, -0.78, -0.3, 0.3, 0.3, 0.3, 0.7]];
E.glass = function (sc, ox, oy, oz, dx, dy, dz, Tmax) {
  if (sc.set !== 'ear') return null;
  let r = 0, g = 0, b = 0, ca = 0;
  for (const q of GLASS) {
    const cx = IEC[0] + q[0], cy = IEC[1] + q[1], cz = IEC[2] + q[2];
    const p0x = (ox - cx) / q[3], p0y = (oy - cy) / q[4], p0z = (oz - cz) / q[5], d0x = dx / q[3], d0y = dy / q[4], d0z = dz / q[5];
    const A = d0x * d0x + d0y * d0y + d0z * d0z, B = p0x * d0x + p0y * d0y + p0z * d0z, C = p0x * p0x + p0y * p0y + p0z * p0z - 1, disc = B * B - A * C;
    if (disc < 0) continue; const sq = Math.sqrt(disc);
    for (const t of [(-B - sq) / A, (-B + sq) / A]) {
      if (t <= 0.01 || t > Tmax) continue;
      const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
      let nx = (px - cx) / (q[3] * q[3]), ny = (py - cy) / (q[4] * q[4]), nz = (pz - cz) / (q[5] * q[5]); const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const fr = Math.pow(1 - Math.abs(nx * dx + ny * dy + nz * dz), 2.2), al = (0.018 + 0.34 * fr) * q[6] * (1 - ca);
      const k = 0.55 + 0.9 * fr; r += al * 0.55 * k; g += al * 0.8 * k; b += al * 1.0 * k; ca += al;
    }
  }
  return ca > 0 ? [r, g, b, ca] : null;
};
E.info = { titulo: 'SDF sordera', seg: 48.2, letrero_s: 0 };
module.exports = E;
