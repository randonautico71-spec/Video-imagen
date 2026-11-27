'use strict';
/* ESCENA SDF «llamadas» · mesilla de noche con un móvil que vibra (ray marching en CPU) para temas de llamadas perdidas / spam / wangiri.
   Mesilla con lámpara cálida y vaso de agua, el móvil boca arriba (pantalla procedural: llamada entrante, perdida, devolviendo la llamada),
   la cama con manta al fondo y una mano (índice, pulgar, dedos curvados, antebrazo con manga) que duda sobre «Devolver» y se retira.
   t = segundos del vídeo (el render se lanza por tramos con --ini/--seg/--fps; ver proyectos/llamadas_cuelgan/render_sdf.sh).
   Ejes: x derecha, y arriba, z hacia la cámara. Superficie de la mesilla y = 0.55; el móvil está girado YAW y su parte alta apunta a -z.
   estado(t): modo de pantalla {0 apagada, 1 entrante, 2 perdida, 3 devolviendo}, brillo, vibración y la mano {vis, H, T}.
   Tiempos de voz (llamadas_cuelgan): colgado 3.34 · devuelvas 16.0 · curiosidad 19.74 · tarificación 23.12 · suene 35.72 · devuelvas 36.9 · fin 48.19. */
const M = require('../motor');
const { clamp, mix, sstep, n3, fbm2, smin, sdCap, oclusion, sombra } = M;

const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const suave = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const tramo = (t, a, d) => suave((t - a) / d);
const sdSph = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
function sdRBox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function sdCyl(px, py, pz, cx, cy, cz, r, h) { const dx = Math.hypot(px - cx, pz - cz) - r, dy = Math.abs(py - cy) - h; return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)); }

/* ------------------------------------------------------------ constantes */
const TOP = 0.55;                                    // superficie de la mesilla
const PH = { x: 0.0, z: -0.04, yaw: 0.32 };         // móvil
const CY = Math.cos(PH.yaw), SY = Math.sin(PH.yaw);
const HX = 0.0365, HZ = 0.0775, HY = 0.0042;         // medios lados del móvil (7,3 × 15,5 cm, 8,4 mm)
const pAMundo = (lx, lz) => [PH.x + lx * CY - lz * SY, PH.z + lx * SY + lz * CY];
const BOTON = pAMundo(0, 0.7 * HZ);                  // «Devolver» (modo 2) y botón verde (modo 1, a la derecha)
const LAMP = [0.2, 0.86, -0.42];                     // posición de la lámpara (luz cálida)

/* ------------------------------------------------------------ estado en el tiempo */
function estado(t) {
  // pantalla: 1 entrante 0–3.3 · 2 perdida 3.34–35.7 · 1 entrante 35.7–38.4 · 2 perdida · 3 devolviendo 22.0–27
  let modo = 1;
  if (t >= 3.34 && t < 22.0) modo = 2; else if (t >= 22.0 && t < 28.0) modo = 3; else if (t >= 28.0 && t < 35.7) modo = 2; else if (t >= 35.7 && t < 38.4) modo = 1; else if (t >= 38.4) modo = 2;
  const encendido = t < 28.0 || t >= 34.0 ? 1 : 0.0;
  // vibración: ráfagas del motor (0,65 s sí / 0,35 no) mientras suena; se apaga con un amortiguado
  const suena = (t < 3.34) ? 1 : (t >= 35.7 && t < 38.4 ? 1 : 0);
  const ciclo = (t * 1.55) % 1, rafaga = ciclo < 0.62 ? Math.sin(ciclo / 0.62 * Math.PI) : 0;
  const dec = t >= 3.34 && t < 4.1 ? Math.exp(-(t - 3.34) * 8) : (t >= 38.4 && t < 39.1 ? Math.exp(-(t - 38.4) * 8) : 0);
  const vib = suena ? rafaga : dec * 0.6;
  // mano
  let vis = 0, T = [0.3, 0.7, 0.3];
  const Bw = BOTON;
  if (t >= 17.0 && t < 23.0) {                                                    // B: entra, duda y toca «Devolver»
    vis = 1; const ent = tramo(t, 17.0, 1.6);
    const hov = [Bw[0] + 0.012, 0.61, Bw[1] - 0.018];
    let tip = lerp3([0.34, 0.66, 0.2], hov, ent);
    const duda = tramo(t, 18.6, 0.5) * (1 - tramo(t, 21.3, 0.35));
    tip = [tip[0] + duda * 0.006 * Math.sin(t * 4.2), tip[1] - duda * (0.014 + 0.012 * Math.sin(t * 3.3)), tip[2] + duda * 0.004 * Math.sin(t * 2.6)];
    const tap = tramo(t, 21.55, 0.3) * (1 - tramo(t, 22.25, 0.35));
    T = [lerp(tip[0], Bw[0], tap), lerp(tip[1], TOP + HY * 2 + 0.003, tap), lerp(tip[2], Bw[1], tap)];
    if (t >= 22.3) { const sal = tramo(t, 22.6, 0.5); T = [lerp(Bw[0], -0.3, sal), lerp(TOP + 0.013, 0.74, sal), lerp(Bw[1], -0.32, sal)]; if (sal > 0.99) vis = 0; }
  } else if (t >= 34.09 && t < 38.0) {                                            // C: la mano duda al lado y se retira al decir «no devuelvas»
    vis = 1; const ret = tramo(t, 36.9, 0.9);
    const base = [Bw[0] + 0.03, 0.585 + 0.006 * Math.sin(t * 2.1), Bw[1] - 0.01];
    T = [lerp(base[0], -0.3, ret), lerp(base[1], 0.76, ret), lerp(base[2], -0.32, ret)];
    if (ret > 0.99) vis = 0;
  }
  const H = [T[0] - 0.026, T[1] + 0.05, T[2] - 0.082];
  return { t, modo, encendido, vib, vis, T, H, ring: t > 35.7 && t < 38.4 ? ((t - 35.7) * 1.4) % 1 : 0 };
}

/* ------------------------------------------------------------ cámara */
function camara(t) {
  let eye, target, fov;
  const sw = [0.004 * Math.sin(t * 1.3), 0.003 * Math.sin(t * 0.9 + 1), 0.004 * Math.sin(t * 1.1 + 2)];
  if (t < 4.2) { const k = tramo(t, 0, 4.2); eye = lerp3([0.17, 0.73, 0.32], [0.05, 0.65, 0.16], k); target = lerp3([0.0, 0.57, -0.05], [0.0, 0.56, -0.02], k); fov = lerp(37, 32, k); }
  else if (t < 23) { const k = tramo(t, 17.0, 5.0); eye = lerp3([0.36, 0.9, 0.5], [0.2, 0.8, 0.3], k); target = lerp3([0.0, 0.575, -0.03], [0.0, 0.57, 0.0], k); fov = lerp(36, 33, k); }
  else if (t < 38.4) { const k = tramo(t, 34.0, 4.4); eye = lerp3([0.46, 0.9, 0.62], [0.3, 0.74, 0.34], k); target = lerp3([0.0, 0.6, -0.1], [0.0, 0.57, -0.04], k); fov = lerp(42, 36, k); }
  else { const k = tramo(t, 38.4, 9.8); eye = lerp3([0.3, 0.74, 0.34], [0.9, 1.25, 1.55], k); target = lerp3([0.0, 0.57, -0.04], [-0.12, 0.62, -0.3], k); fov = lerp(36, 40, k); }
  return { eye: [eye[0] + sw[0], eye[1] + sw[1], eye[2] + sw[2]], target, fov };
}

const E = {};
E.prepara = (t) => { const c = camara(t), s = estado(t); return Object.assign({ eye: c.eye, target: c.target, fov: c.fov, far: 8, pasos: 180 }, s); };

/* ------------------------------------------------------------ mundo */
function mano(sc, x, y, z, put) {
  if (!sc.vis) return;
  const H = sc.H, T = sc.T;
  if (Math.hypot(x - H[0], z - H[2]) > 0.55 || y < 0.45 || y > 0.95) return;
  // mano derecha que viene de la cama (izquierda y al fondo), palma hacia abajo, dedos hacia la cámara; el índice llega a la yema T
  const Bx = H[0] + 0.026, By = H[1] - 0.006, Bz = H[2] + 0.048;
  const k1 = [lerp(Bx, T[0], 0.45), lerp(By, T[1], 0.45) + 0.007, lerp(Bz, T[2], 0.45)], k2 = [lerp(Bx, T[0], 0.78), lerp(By, T[1], 0.78) + 0.003, lerp(Bz, T[2], 0.78)];
  put(sdCap(x, y, z, Bx, By, Bz, k1[0], k1[1], k1[2], 0.0098), 'piel');
  put(sdCap(x, y, z, k1[0], k1[1], k1[2], k2[0], k2[1], k2[2], 0.0086), 'piel');
  put(sdCap(x, y, z, k2[0], k2[1], k2[2], T[0], T[1], T[2], 0.0074), 'piel');
  for (let i = 1; i <= 3; i++) {                                                      // dedos recogidos
    const xx = H[0] + 0.026 - i * 0.019, l = 0.036 - i * 0.003;
    put(sdCap(x, y, z, xx, H[1] - 0.006, H[2] + 0.048, xx, H[1] - 0.024, H[2] + 0.048 + l * 0.8, 0.0088 - i * 0.0004), 'piel');
    put(sdCap(x, y, z, xx, H[1] - 0.024, H[2] + 0.048 + l * 0.8, xx, H[1] - 0.036, H[2] + 0.048 + l * 0.35, 0.0078), 'piel');
  }
  put(sdCap(x, y, z, H[0] + 0.036, H[1] - 0.012, H[2] + 0.0, H[0] + 0.05, H[1] - 0.026, H[2] + 0.03, 0.0105), 'piel');          // pulgar
  put(sdCap(x, y, z, H[0] + 0.05, H[1] - 0.026, H[2] + 0.03, H[0] + 0.044, H[1] - 0.03, H[2] + 0.06, 0.0092), 'piel');
  put(sdRBox(x, y, z, H[0], H[1] - 0.004, H[2] + 0.004, 0.036, 0.011, 0.046, 0.01), 'piel');                                    // palma
  const W0 = [H[0] - 0.01, H[1] + 0.004, H[2] - 0.075];
  put(sdCap(x, y, z, H[0], H[1], H[2] - 0.03, W0[0], W0[1], W0[2], 0.02), 'piel');                                              // muñeca
  put(sdCap(x, y, z, W0[0], W0[1], W0[2], W0[0] - 0.3, W0[1] + 0.02, W0[2] - 0.36, 0.029), 'manga');                            // antebrazo con manga, desde la cama
}
function sdMundo(sc, x, y, z, mo) {
  let best = 1e9, nm = '';
  const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  put(y + 0.0, 'suelo');
  put(sdRBox(x, y, z, 0, 0.7, -0.95, 2.4, 0.7, 0.05, 0.01), 'pared');
  // mesilla
  put(sdRBox(x, y, z, 0, TOP - 0.02, -0.2, 0.27, 0.02, 0.22, 0.008), 'madera');
  put(sdRBox(x, y, z, 0, 0.26, -0.2, 0.25, 0.26, 0.2, 0.01), 'madera');
  put(sdRBox(x, y, z, 0, 0.405, -0.0, 0.2, 0.004, 0.012, 0.002), 'cajon');                // tirador
  // cama a la izquierda: somier, colchón y manta caída hasta la mesilla
  if (x < -0.15) {
    put(sdRBox(x, y, z, -0.75, 0.2, -0.2, 0.42, 0.2, 0.7, 0.02), 'madera');
    let manta = sdRBox(x, y, z, -0.75, 0.52, -0.2, 0.41, 0.1, 0.68, 0.06);
    manta = smin(manta, sdRBox(x, y, z, -0.42, 0.37, -0.2, 0.04, 0.2, 0.62, 0.04), 0.1);
    put(manta, 'manta');
    put(sdRBox(x, y, z, -0.78, 0.66, -0.75, 0.3, 0.07, 0.17, 0.06), 'almohada');
  }
  // lámpara y vaso
  if (Math.hypot(x - 0.2, z + 0.42) < 0.3 && y < 1.1) {
    put(sdCyl(x, y, z, 0.2, TOP + 0.006, -0.42, 0.06, 0.006), 'lampara');
    put(sdCap(x, y, z, 0.2, TOP + 0.01, -0.42, 0.2, TOP + 0.25, -0.42, 0.011), 'lampara');
    put(sdCyl(x, y, z, 0.2, TOP + 0.31, -0.42, 0.08, 0.075) + 0.006 * Math.abs(Math.sin(y * 40)) * 0, 'pantalla_l');
  }
  if (Math.hypot(x + 0.14, z + 0.36) < 0.1 && y < 0.85) put(Math.max(sdCyl(x, y, z, -0.14, TOP + 0.055, -0.36, 0.033, 0.055), -sdCyl(x, y, z, -0.14, TOP + 0.075, -0.36, 0.029, 0.05)), 'vaso');
  if (Math.hypot(x + 0.14, z + 0.36) < 0.1 && y < 0.85) put(sdCyl(x, y, z, -0.14, TOP + 0.045, -0.36, 0.028, 0.038), 'agua');
  // móvil (con la vibración y su pequeño giro)
  const vx = sc.vib * 0.0024 * Math.sin(sc.t * 66), vz = sc.vib * 0.0019 * Math.sin(sc.t * 79 + 1), ry = sc.vib * 0.012 * Math.sin(sc.t * 58 + 2);
  const dx = x - (PH.x + vx), dz = z - (PH.z + vz), c = Math.cos(PH.yaw + ry), s = Math.sin(PH.yaw + ry);
  const lx = dx * c + dz * s, lz = -dx * s + dz * c;
  if (Math.abs(lx) < 0.06 && Math.abs(lz) < 0.1 && Math.abs(y - (TOP + HY)) < 0.03) put(sdRBox(lx, y, lz, 0, TOP + HY, 0, HX, HY, HZ, 0.0065), 'movil');
  mano(sc, x, y, z, put);
  if (mo) { mo.m = nm; mo.lx = lx; mo.lz = lz; }
  return best;
}
E.map = (sc, x, y, z) => sdMundo(sc, x, y, z);

/* ------------------------------------------------------------ pantalla procedural */
const disco = (u, v, cx, cy, r) => Math.hypot(u - cx, v - cy) < r;
const anillo = (u, v, cx, cy, r, g) => Math.abs(Math.hypot(u - cx, v - cy) - r) < g;
function pantalla(sc, u, v) {     // u en [-1,1] (derecha del móvil), v en [-1,1] (v>0 = parte baja, hacia la cámara). Devuelve [r,g,b] emisivo
  const t = sc.t, m = sc.modo;
  if (m === 1) {                                                                       // llamada entrante: avatar desconocido, dos botones
    let c = [0.02 + 0.03 * (1 - (v + 1) / 2), 0.07 + 0.05 * (1 - (v + 1) / 2), 0.11 + 0.06 * (1 - (v + 1) / 2)];
    const pulso = 0.5 + 0.5 * Math.sin(t * 7);
    if (disco(u, v, 0, -0.38, 0.3)) c = [0.12, 0.2, 0.28]; if (disco(u, v, 0, -0.45, 0.095) || (Math.abs(u) < 0.2 && v > -0.34 && v < -0.2 && Math.hypot(u / 0.2, (v + 0.2) / 0.14) < 1 && v > -0.34)) c = [0.45, 0.62, 0.78];
    if (Math.abs(v - 0.02) < 0.035 && Math.abs(u) < 0.55) c = [0.85, 0.9, 0.95]; if (Math.abs(v - 0.11) < 0.022 && Math.abs(u) < 0.34) c = [0.4, 0.46, 0.55];
    if (disco(u, v, -0.45, 0.72, 0.18)) c = [0.95, 0.18, 0.22]; if (disco(u, v, 0.45, 0.72, 0.18)) c = [0.15, 0.85, 0.35];
    if (anillo(u, v, 0.45, 0.72, 0.23 + 0.06 * pulso, 0.012)) c = [0.2, 0.9, 0.4].map((a) => a * (0.5 + 0.5 * pulso));
    return c;
  }
  if (m === 2) {                                                                       // llamada perdida: avatar apagado, aviso rojo y «Devolver»
    let c = [0.05 + 0.02 * (1 - (v + 1) / 2), 0.04, 0.07 + 0.02 * (1 - (v + 1) / 2)];
    if (disco(u, v, 0, -0.38, 0.3)) c = [0.1, 0.12, 0.17]; if (disco(u, v, 0, -0.45, 0.095)) c = [0.3, 0.33, 0.4];
    if (Math.abs(v - 0.02) < 0.035 && Math.abs(u) < 0.5) c = [0.8, 0.84, 0.9]; if (Math.abs(v - 0.11) < 0.022 && Math.abs(u) < 0.3) c = [1.0, 0.25, 0.28];
    if (Math.abs(u) < 0.6 && v > 0.57 && v < 0.84 && Math.hypot(Math.max(Math.abs(u) - 0.3, 0), Math.max(Math.abs(v - 0.7) - 0.01, 0)) < 0.13) {
      const near = sc.vis ? 1 : 0, glow = 0.7 + 0.3 * Math.sin(t * 3) + 0.4 * near;
      c = [0.12 * glow, 0.78 * glow, 0.4 * glow];
    }
    return c;
  }
  if (m === 3) {                                                                       // devolviendo la llamada: verde con ondas
    const r = Math.hypot(u, v + 0.1), w = 0.5 + 0.5 * Math.sin(r * 14 - t * 6);
    let c = [0.04 + 0.05 * w, 0.28 + 0.3 * w, 0.14 + 0.16 * w];
    if (disco(u, v, 0, -0.1, 0.16)) c = [0.9, 1, 0.92]; if (disco(u, v, 0, 0.72, 0.17)) c = [0.95, 0.18, 0.22];
    return c;
  }
  return [0.01, 0.01, 0.012];
}
const COLOR_PANT = (sc) => sc.modo === 1 ? [0.15, 0.55, 0.9] : sc.modo === 2 ? [0.2, 0.55, 0.5] : [0.15, 0.9, 0.45];

/* ------------------------------------------------------------ materiales y luz */
const SUELO_LUZ = LAMP;
E.shade = (sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) => {
  const mo = {}; sdMundo(sc, x, y, z, mo); const m = mo.m;
  let alb = [0.5, 0.5, 0.5], esp = 0, dur = 30, emi = [0, 0, 0];
  const w = fbm2(x * 8, z * 8 + y * 3, 3);
  if (m === 'suelo') alb = [0.13, 0.09, 0.07].map((a) => a * (0.7 + 0.6 * fbm2(x * 6, z * 30, 3)));
  else if (m === 'pared') alb = [0.2 + 0.03 * w, 0.22 + 0.03 * w, 0.3 + 0.04 * w];
  else if (m === 'madera') { const v = 0.5 + 0.5 * Math.sin(y * 80 + w * 6 + z * 20); alb = [0.34 + 0.06 * v, 0.2 + 0.04 * v, 0.11 + 0.02 * v]; esp = 0.12; dur = 40; }
  else if (m === 'cajon') alb = [0.5, 0.5, 0.52];
  else if (m === 'manta') { const ray = 0.5 + 0.5 * Math.sin(z * 60 + w * 2); alb = [mix(0.2, 0.26, ray), mix(0.28, 0.36, ray), mix(0.5, 0.6, ray)]; }
  else if (m === 'almohada') alb = [0.78, 0.8, 0.88];
  else if (m === 'lampara') { alb = [0.12, 0.1, 0.1]; esp = 0.5; dur = 30; }
  else if (m === 'pantalla_l') { alb = [0.9, 0.7, 0.45]; emi = [1.7, 1.0, 0.45]; }
  else if (m === 'vaso') { alb = [0.5, 0.65, 0.75]; esp = 1.3; dur = 90; }
  else if (m === 'agua') { alb = [0.35, 0.55, 0.7]; esp = 0.8; dur = 70; }
  else if (m === 'piel') { alb = [1.0, 0.7, 0.57].map((a) => a * (0.92 + 0.12 * n3(x * 90, y * 90, z * 90))); esp = 0.1; dur = 18; }
  else if (m === 'manga') { const ray = 0.5 + 0.5 * Math.sin(x * 140 + y * 20); alb = [mix(0.35, 0.42, ray), mix(0.4, 0.5, ray), mix(0.55, 0.66, ray)]; }
  else if (m === 'movil') {
    const lx = mo.lx, lz = mo.lz;
    if (y > TOP + 2 * HY - 0.0014 && Math.abs(lx) < HX - 0.0022 && Math.abs(lz) < HZ - 0.0035) {                // cara de la pantalla
      const col = sc.encendido ? pantalla(sc, lx / (HX - 0.0022), lz / (HZ - 0.0035)) : [0.01, 0.01, 0.012];
      emi = col.map((a) => a * 1.25); alb = [0.02, 0.02, 0.03];
    } else { alb = [0.07, 0.075, 0.09]; esp = 0.7; dur = 60; }                                                 // marco y cuerpo
  }
  // luz: lámpara cálida (puntual) + relleno frío + resplandor de la pantalla del móvil
  const Lx = LAMP[0] - x, Ly = LAMP[1] - y, Lz = LAMP[2] - z, Ld = Math.hypot(Lx, Ly, Lz) || 1, lx = Lx / Ld, ly = Ly / Ld, lz = Lz / Ld;
  const ndl = Math.max(0, nx * lx + ny * ly + nz * lz), att = 1.9 / (0.35 + Ld * Ld * 2.0);
  const sh = ndl > 0.02 && m !== 'pantalla_l' && m !== 'pared' && m !== 'suelo' ? sombra(map, x + nx * 0.003, y + ny * 0.003, z + nz * 0.003, lx, ly, lz, 12, Ld * 0.95, 26) : 1;
  const ao = oclusion(map, x, y, z, nx, ny, nz);
  const cielo = 0.5 + 0.5 * ny, rebote = 0.5 - 0.5 * ny;
  const key = [1.0, 0.68, 0.36].map((a) => a * att * ndl * sh);
  const amb = [0.055, 0.075, 0.15].map((a) => a * (cielo + 0.3));
  const sk0 = m === 'piel' ? 2.4 : m === 'manga' ? 1.6 : 1; let c = [0, 1, 2].map((k) => alb[k] * (key[k] * (0.7 + 0.3 * ao) + amb[k] * ao * sk0 + 0.02 * rebote) + emi[k]);
  if (m === 'piel') c = [c[0] + alb[0] * 0.07, c[1] + alb[1] * 0.04, c[2] + alb[2] * 0.03];
  // pantalla: luz del móvil sobre todo lo cercano
  const sd2 = (x - PH.x) * (x - PH.x) + (y - TOP - 0.01) * (y - TOP - 0.01) + (z - PH.z) * (z - PH.z);
  if (m !== 'movil') {
    const g = sc.encendido * 0.05 / (0.012 + sd2 * 14) * (0.5 + 0.5 * Math.max(0, ny + 0.25)), cp = COLOR_PANT(sc), pul = sc.modo === 1 ? 0.7 + 0.3 * Math.sin(sc.t * 7) : 0.85;
    const sk = m === 'piel' || m === 'manga' ? 0.45 : 1; c = [0, 1, 2].map((k) => c[k] + alb[k] * cp[k] * g * pul * sk);
  }
  if (esp > 0 && ndl > 0) { const hx = lx - dx, hy = ly - dy, hz = lz - dz, hl = Math.hypot(hx, hy, hz) || 1, s = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), dur); c = c.map((v, k) => v + esp * s * att * sh * [1, 0.75, 0.5][k]); }
  if (esp > 0) { const ndv = Math.max(0, -(nx * dx + ny * dy + nz * dz)), fr = Math.pow(1 - ndv, 4) * 0.25 * esp; c = [c[0] + fr * 0.15, c[1] + fr * 0.25, c[2] + fr * 0.5]; }
  return c;
};
E.cielo = (sc, dx, dy, dz) => { const k = clamp(0.5 + 0.5 * dy, 0, 1); return [0.02 + 0.015 * k, 0.025 + 0.02 * k, 0.05 + 0.04 * k]; };
E.camara = camara; E.estado = estado;
E.info = { titulo: 'llamadas (mesilla de noche con el móvil)', seg: 48.2 };
module.exports = E;
