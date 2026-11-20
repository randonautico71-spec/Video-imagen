'use strict';
/* ESCENA SDF «sueno» · dormitorio de noche (ray marching en CPU) para temas de sueño.
   Una cama junto a la pared del fondo, una persona tumbada boca arriba con pijama (ojos abiertos o cerrados), la mano sobre la manta,
   una mesilla con un reloj de números rojos y una ventana con luna. En la esquina, de pie contra la ventana, una figura oscura
   (alucinación): puede acercarse a la cama, inclinarse sobre el pecho y deshacerse en partículas. Al final amanece.
   Se usa en «¿Por qué a veces te despiertas y no puedes moverte?» (parálisis del sueño). Tiempo t = segundos del vídeo
   (el render se lanza por tramos con --stills t1,t2,… o --ini/--seg).
   Ejes: x derecha, y arriba, z hacia la cámara. Cabeza de la cama en z = -1.5, pared del fondo en z = -2.3.
   Parámetros por tiempo (ver `estado(t)`): ojos (0 abiertos – 1 cerrados), figura {x, z, vis, dis, lean}, peso (hundimiento del pecho), alba (0 noche – 1 amanecer),
   dedos (temblor de la mano que no puede moverse).
   Cámaras: A (0–3.25 s gancho: general alta → empuja a la cara, corte a la mano), C (25.7–38.5 s la figura), D (52.4–58.5 s vuelta: cara → general con luz de amanecer). */
const M = require('../motor');
const { clamp, mix, sstep, n3, fbm2, smin, sdCap, oclusion } = M;

const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const suave = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const tramo = (t, a, d) => suave((t - a) / d);
const sdSph = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
function sdRBox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}
function sdEllip(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const ax = (px - cx) / rx, ay = (py - cy) / ry, az = (pz - cz) / rz, k0 = Math.hypot(ax, ay, az);
  const bx = ax / rx, by = ay / ry, bz = az / rz, k1 = Math.hypot(bx, by, bz) + 1e-9;
  return k0 * (k0 - 1) / k1;
}

/* ------------------------------------------------------------ estado en el tiempo */
function estado(t) {
  const alba = tramo(t, 52.5, 5.5);
  const ojos = tramo(t, 52.9, 0.6);
  // figura: esquina (-1.4,-2.0) → junto a la cama (-0.8,-1.0) → inclinada sobre el pecho → deshecha
  const ir = tramo(t, 31.4, 2.8), lean = tramo(t, 34.2, 1.5), dis = tramo(t, 35.7, 2.3);
  const fig = { x: lerp(-1.4, -0.85, ir), z: lerp(-2.0, -1.0, ir), vis: t >= 28.6 && t < 38.4 ? 1 : 0, dis, lean, sway: t };
  const peso = tramo(t, 34.2, 1.4) * (1 - tramo(t, 36.0, 1.6));
  const dedos = t > 1.9 && t < 3.4 ? 1 : 0;
  return { t, alba, ojos, fig, peso, dedos, resp: Math.sin(t * 1.5) };
}

/* ------------------------------------------------------------ cámara */
const CA0 = [1.55, 1.95, 1.9], CA1 = [0.95, 1.45, -0.02], TA0 = [0.2, 0.62, -0.5], TA1 = [0.2, 0.84, -1.12];      // gancho: general alta → cara
const CMANO0 = [1.0, 1.0, 0.6], CMANO1 = [0.85, 0.84, 0.2], TMANO = [0.66, 0.64, -0.18];                       // gancho: la mano
function camara(t) {
  let eye, target, fov;
  if (t < 1.9) { const k = tramo(t, 0, 1.9); eye = lerp3(CA0, CA1, k); target = lerp3(TA0, TA1, k); fov = lerp(40, 30, k); }
  else if (t < 12) { const k = tramo(t, 1.9, 1.6); eye = lerp3(CMANO0, CMANO1, k); target = TMANO; fov = 30; }
  else if (t < 31.5) { const k = tramo(t, 25.5, 4.0); eye = lerp3([1.7, 1.25, 2.2], [1.45, 1.2, 1.9], k); target = lerp3([-0.35, 1.05, -1.6], [-0.4, 1.1, -1.5], k); fov = 40; }     // general baja, la esquina de la ventana
  else if (t < 34.2) { const k = tramo(t, 31.5, 2.7); eye = lerp3([1.5, 1.0, 1.7], [1.5, 1.0, 0.8], k); target = lerp3([-0.4, 1.05, -1.4], [-0.3, 1.0, -1.15], k); fov = 36; }
  else if (t < 40) { const k = tramo(t, 34.2, 3.0); eye = lerp3([1.5, 1.0, 0.8], [1.3, 1.15, 0.3], k); target = lerp3([-0.3, 1.0, -1.15], [-0.25, 1.0, -1.1], k); fov = lerp(36, 38, k); }
  else { const k = tramo(t, 52.4, 6.0); eye = lerp3(CA1, CA0, k); target = lerp3(TA1, TA0, k); fov = lerp(30, 40, k); }      // vuelta: de la cara a la general
  return { eye, target, fov };
}

const E = {};
E.prepara = (t) => { const c = camara(t), s = estado(t); return Object.assign({ eye: c.eye, target: c.target, fov: c.fov, far: 14, pasos: 200 }, s); };

/* ------------------------------------------------------------ mundo */
const BX = 0.2;       // eje de la cama (x)
function figura(sc, x, y, z, put) {
  const f = sc.fig; if (!f || !f.vis) return;
  if (Math.hypot(x - f.x, z - f.z) > 1.5 || y > 2.4) return;
  const sw = Math.sin(f.sway * 0.9) * 0.012;
  // las piezas de arriba se inclinan hacia la cama (cizalla en z) cuando se acerca al pecho
  const up = Math.max(0, y - 0.95), zq = z + f.lean * up * 0.55 * (up > 0 ? 1 : 0), xq = x - f.lean * up * 0.5 * 0.4, X = xq - f.x, Zq = zq - f.z, Z = z - f.z;
  let d = 1e9;
  d = Math.min(d, sdCap(X, y, Z, -0.08, 0.05, 0, -0.09, 1.0, 0, 0.04), sdCap(X, y, Z, 0.08, 0.05, 0, 0.09, 1.0, 0, 0.04));                 // piernas
  d = Math.min(d, sdCap(X, y, Zq, 0, 0.98, 0, 0, 1.58, 0, 0.105));                                                                              // torso
  d = Math.min(d, sdCap(X, y, Zq, -0.17, 1.52, 0, -0.22 + sw, 0.5, 0.04 + f.lean * 0.14, 0.024), sdCap(X, y, Zq, 0.17, 1.52, 0, 0.22 - sw, 0.5, 0.04 + f.lean * 0.14, 0.024));   // brazos largos
  d = Math.min(d, sdCap(X, y, Zq, 0, 1.55, 0, 0, 1.7, 0.04, 0.038), sdEllip(X, y, Zq, 0, 1.82, 0.05, 0.075, 0.115, 0.085));                       // cuello y cabeza
  const carve = f.dis > 0 ? (f.dis * 1.5 - 0.15 - n3(x * 11, y * 11, z * 11) * 0.9 - 0.2 * fbm2(x * 5 + y * 3, z * 5, 2)) * 0.12 : -1;
  if (f.dis > 0) d = Math.max(d, carve);
  put(d, 'figura');
}
function sdMundo(sc, x, y, z, mo) {
  let best = 1e9, nm = '';
  const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  // habitación: suelo, pared del fondo (con hueco de ventana tapado por un panel luminoso)
  put(y + 0.02, 'suelo');
  put(sdRBox(x, y, z, 0, 1.4, -2.34, 3.6, 1.4, 0.05, 0.01), 'pared');
  // cama: somier, colchón, cabecero, almohada
  if (Math.hypot(x - BX, z + 0.4) < 1.9 && y < 1.4) {
    put(sdRBox(x, y, z, BX, 0.2, -0.4, 0.74, 0.2, 1.12, 0.03), 'madera');
    put(sdRBox(x, y, z, BX, 0.45, -0.4, 0.71, 0.14, 1.07, 0.07), 'colchon');
    put(sdRBox(x, y, z, BX, 0.85, -1.52, 0.76, 0.45, 0.05, 0.03), 'madera');
    put(sdRBox(x, y, z, BX, 0.68, -1.2, 0.3, 0.075, 0.2, 0.07), 'almohada');
    // manta con el cuerpo debajo (el pecho se hunde con el «peso»)
    const resp = sc.resp * 0.006, ph = sc.peso;
    let manta = sdRBox(x, y, z, BX, 0.66, -0.18, 0.33, 0.07, 0.86, 0.05);
    manta = smin(manta, sdEllip(x, y, z, BX, 0.69 + resp - 0.03 * ph, -0.78, 0.25, 0.12 - 0.035 * ph, 0.3), 0.09);       // pecho
    manta = smin(manta, sdEllip(x, y, z, BX, 0.69, -0.28, 0.23, 0.1, 0.22), 0.08);                                         // caderas
    manta = smin(manta, sdEllip(x, y, z, BX - 0.1, 0.71, 0.17, 0.09, 0.1, 0.16), 0.07);                                    // rodillas
    manta = smin(manta, sdEllip(x, y, z, BX + 0.1, 0.71, 0.17, 0.09, 0.1, 0.16), 0.07);
    manta = smin(manta, sdEllip(x, y, z, BX - 0.1, 0.68, 0.5, 0.08, 0.08, 0.13), 0.06);                                    // pies
    manta = smin(manta, sdEllip(x, y, z, BX + 0.1, 0.68, 0.5, 0.08, 0.08, 0.13), 0.06);
    put(manta, 'manta');
    // persona: hombros con pijama, cabeza con rasgos, brazos y manos sobre la manta
    put(sdEllip(x, y, z, BX, 0.7, -1.0, 0.3, 0.085, 0.1), 'pijama');
    put(sdCap(x, y, z, BX + 0.28, 0.68, -0.98, BX + 0.45, 0.645, -0.6, 0.044), 'pijama');
    put(sdCap(x, y, z, BX + 0.45, 0.645, -0.6, BX + 0.46, 0.63, -0.28, 0.038), 'pijama');
    put(sdCap(x, y, z, BX - 0.28, 0.68, -0.98, BX - 0.45, 0.645, -0.6, 0.044), 'pijama');
    put(sdCap(x, y, z, BX - 0.45, 0.645, -0.6, BX - 0.46, 0.63, -0.28, 0.038), 'pijama');
    put(sdCap(x, y, z, BX, 0.74, -1.08, BX, 0.78, -1.13, 0.05), 'piel');                                                    // cuello
    put(sdEllip(x, y, z, BX, 0.79, -1.2, 0.098, 0.115, 0.125), 'cabeza');
    put(sdEllip(x, y, z, BX, 0.872, -1.1, 0.012, 0.014, 0.024), 'piel');                                                       // nariz
    put(sdEllip(x, y, z, BX, 0.855, -1.058, 0.022, 0.011, 0.01), 'piel');
    const lp = sc.ojos, lz = lerp(-1.162, -1.14, lp), lr = lerp(0.0075, 0.019, lp);
    for (const sx of [-1, 1]) {
      put(sdSph(x, y, z, BX + sx * 0.037, 0.87, -1.15, 0.0175), 'ojo');
      put(sdEllip(x, y, z, BX + sx * 0.037, 0.872, lz, 0.0185, 0.0105, lr + 0.004), 'piel');                                // párpado superior (cierra al final)
    }
    // manos: palma y dedos (el temblor es un esfuerzo que no mueve nada)
    for (const sx of [-1, 1]) {
      const hx = BX + sx * 0.46, tr = sx > 0 ? sc.dedos * 0.004 * Math.sin(sc.t * 38) : 0;
      put(sdRBox(x, y, z, hx, 0.625, -0.2, 0.038, 0.016, 0.05, 0.012), 'piel');
      for (let i = 0; i < 4; i++) { const fx = hx + (i - 1.5) * 0.02 * sx * -1, fl = 0.07 - 0.008 * Math.abs(i - 1.5) * 0.4 + tr; put(sdCap(x, y, z, fx, 0.628, -0.15, fx + 0.003 * sx, 0.628, -0.15 + fl, 0.0095), 'piel'); }
      put(sdCap(x, y, z, hx - sx * 0.036, 0.628, -0.23, hx - sx * 0.052, 0.63, -0.16, 0.011), 'piel');
    }
  }
  // mesilla con reloj, vaso y lámpara
  if (Math.hypot(x - 1.35, z + 1.3) < 0.7 && y < 1.3) {
    put(sdRBox(x, y, z, 1.35, 0.28, -1.3, 0.3, 0.28, 0.24, 0.02), 'madera');
    put(sdRBox(x, y, z, 1.22, 0.64, -1.22, 0.1, 0.055, 0.04, 0.012), 'reloj');
    put(sdCap(x, y, z, 1.5, 0.585, -1.2, 1.5, 0.665, -1.2, 0.034), 'vaso');
    put(sdCap(x, y, z, 1.45, 0.57, -1.45, 1.45, 0.95, -1.45, 0.018), 'lampara');
    put(sdCap(x, y, z, 1.45, 0.95, -1.45, 1.45, 1.1, -1.45, 0.13), 'pantalla');
  }
  // cortinas a los lados de la ventana
  put(sdRBox(x, y, z, -2.12, 1.3, -2.2, 0.12, 1.2, 0.07, 0.03), 'cortina');
  put(sdRBox(x, y, z, -0.62, 1.3, -2.2, 0.12, 1.2, 0.07, 0.03), 'cortina');
  figura(sc, x, y, z, put);
  if (mo) mo.m = nm;
  return best;
}
E.map = (sc, x, y, z) => sdMundo(sc, x, y, z);

/* ------------------------------------------------------------ materiales y luz */
const LUNA = (() => { const v = [-0.45, 0.62, 0.5], l = Math.hypot(...v); return v.map(a => a / l); })();
E.shade = (sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) => {
  const mo = {}; sdMundo(sc, x, y, z, mo); const m = mo.m, al = sc.alba;
  let alb = [.6, .6, .6], esp = 0, dur = 30, emi = [0, 0, 0], rim = 0;
  const w = fbm2(x * 3, y * 3 + z * 2, 3);
  if (m === 'suelo') { const rx = Math.abs(x - 0.3) < 1.5 && z > -1.8 && z < 1.4; alb = rx ? [.28, .2, .3].map(a => a * (.9 + .2 * w)) : [.18, .13, .1].map(a => a * (.8 + .4 * w)); if (!rx) alb = alb.map((a, i) => a * (.85 + .15 * Math.sin(x * 40 + w * 6))); }
  else if (m === 'pared') {
    alb = [mix(.22, .28, w), mix(.23, .29, w), mix(.27, .34, w)];
    const vx = x > -1.98 && x < -0.74 && y > 0.82 && y < 2.15;                                                             // ventana: luz de luna / del cielo
    if (vx) { const gy = (y - 0.82) / 1.33, luna = Math.hypot(x + 1.12, y - 1.8) < 0.17; const cn = [mix(.16, .1, gy), mix(.27, .18, gy), mix(.55, .35, gy)], am = [mix(1.2, .6, gy), mix(.75, .45, gy), mix(.4, .5, gy)]; alb = [0, 0, 0]; emi = [0, 1, 2].map(k => mix(cn[k], am[k], al) * 1.15 + (luna ? mix(.9, .0, al) : 0)); if (Math.abs(x + 1.36) < 0.012 || Math.abs(y - 1.48) < 0.012) { emi = [0.01, 0.015, 0.03]; } }
    if (Math.abs(y - 0.08) < 0.07) alb = alb.map(v => v * .55);
  }
  else if (m === 'madera') alb = [.3, .19, .11].map(a => a * (.88 + .24 * w));
  else if (m === 'colchon') alb = [.72, .72, .74];
  else if (m === 'almohada') alb = [.86, .86, .88];
  else if (m === 'manta') { const ray = .5 + .5 * Math.sin(z * 55 + w * 1.5); alb = [mix(.3, .36, ray), mix(.35, .41, ray), mix(.47, .55, ray)]; if (z > -0.98 && z < -0.9) alb = [.88, .9, .95]; }   // manta azul con el embozo claro
  else if (m === 'pijama') { const ray = .5 + .5 * Math.sin(x * 80); alb = [mix(.5, .7, ray), mix(.55, .74, ray), mix(.66, .82, ray)]; }
  else if (m === 'piel') { alb = [.86, .62, .5]; esp = .05; dur = 20; }
  else if (m === 'cabeza') {
    alb = [.86, .62, .5]; esp = .05;
    if (z < -1.225) alb = [.07, .045, .035].map(a => a * (.8 + .5 * n3(x * 90, y * 90, z * 90)));                                    // pelo
    if (y > 0.9 && z > -1.232) { const cx = Math.abs(x - BX), bz = z + 1.185; if (cx > 0.015 && cx < 0.07 && Math.abs(bz + 0.09 - 0.004) < 0.012) alb = [.12, .08, .06]; }   // cejas
    if (z > -1.075 && z < -1.052 && Math.abs(x - BX) < 0.024 && y > 0.82) alb = [.62, .32, .3];                                       // boca
  }
  else if (m === 'ojo') { const cx = x - (BX + (x > BX ? 1 : -1) * 0.037), cz = z + 1.15, r = Math.hypot(cx, cz); alb = r < 0.0045 ? [.012, .01, .01] : r < 0.0092 ? [.18, .11, .06] : [.8, .78, .76]; esp = .5; dur = 80; }
  else if (m === 'reloj') { const dxr = x - 1.22, on = Math.abs(dxr) < 0.085 && Math.abs(y - 0.645) < 0.034 && z > -1.19; alb = [.03, .03, .035]; if (on) { const seg = Math.abs(Math.sin(dxr * 150)) < 0.7 || Math.abs(y - 0.645) < 0.006; if (seg && Math.abs(dxr) > 0.006) emi = [2.6, 0.12, 0.05]; } }
  else if (m === 'vaso') { alb = [.5, .6, .7]; esp = 1; dur = 90; }
  else if (m === 'lampara') alb = [.12, .1, .1];
  else if (m === 'pantalla') alb = [.5, .45, .38];
  else if (m === 'cortina') { const pl = .5 + .5 * Math.sin(x * 60); alb = [mix(.16, .22, pl), mix(.12, .17, pl), mix(.26, .34, pl)]; }
  else if (m === 'figura') { alb = [.004, .004, .006]; rim = 1; }
  const ndl = Math.max(0, nx * LUNA[0] + ny * LUNA[1] + nz * LUNA[2]);
  const ao = oclusion(map, x, y, z, nx, ny, nz);
  const cielo = .5 + .5 * ny, rebote = .5 - .5 * ny;
  // noche: luna azulada y ambiente frío · amanecer: luz cálida y más fuerte
  const key = [mix(.16, 1.7, al), mix(.21, 1.25, al), mix(.42, .85, al)], amb = [mix(.05, .45, al), mix(.065, .4, al), mix(.13, .42, al)], sue = [mix(.02, .3, al), mix(.018, .22, al), mix(.02, .14, al)];
  let c = [0, 1, 2].map(k => alb[k] * (key[k] * ndl * (0.65 + 0.35 * ao) + amb[k] * cielo * ao + sue[k] * rebote * ao) + emi[k]);
  // resplandor rojo del reloj sobre lo cercano
  const dr = Math.hypot(x - 1.22, y - 0.7, z + 1.1); if (m !== 'reloj') c = [c[0] + alb[0] * 0.5 / (1 + dr * dr * 14) * (1 - al), c[1] + alb[1] * 0.05 / (1 + dr * dr * 14), c[2] + alb[2] * 0.03 / (1 + dr * dr * 14)];
  if (esp && ndl > 0) { const hx = LUNA[0] - dx, hy = LUNA[1] - dy, hz = LUNA[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, s = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), dur); c = c.map((v, k) => v + esp * s * key[k]); }
  if (rim) { const ndv = Math.max(0, -(nx * dx + ny * dy + nz * dz)), r = Math.pow(1 - ndv, 3) * 0.55; c = [c[0] + r * 0.1, c[1] + r * 0.14, c[2] + r * 0.32]; }
  return c;
};
E.cielo = (sc, dx, dy, dz) => { const k = clamp(.5 + .5 * dy, 0, 1), al = sc.alba || 0; return [mix(.03, .14, al) * (1 - .4 * k), mix(.04, .1, al) * (1 - .4 * k), mix(.08, .1, al) * (1 - .3 * k)]; };
E.camara = camara; E.estado = estado;
E.info = { titulo: 'sueno (dormitorio de noche)', seg: 58.5 };
module.exports = E;
