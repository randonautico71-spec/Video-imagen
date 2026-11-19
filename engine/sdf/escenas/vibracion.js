'use strict';
/* ESCENA SDF «vibracion» · casa en corte de dos plantas (ray marching en CPU).
   Abajo, en el salón, una persona sentada con el móvil en el bolsillo del vaquero (el muslo vibra de verdad);
   arriba, en el dormitorio, otro móvil quieto sobre la mesilla. Se usa para el gancho y la vuelta al gancho de
   «Por qué notas vibraciones que no existen».
   Tiempo t = segundos del vídeo (el render se lanza por tramos con --ini/--seg):
     t en [0, 3.67)     gancho: plano cercano del muslo que vibra → grúa hacia arriba hasta el móvil de la otra planta
     t en [52.1, 59.03) vuelta al gancho: mismo plano cercano con el muslo quieto → plano general de las dos plantas
   Ejes: x derecha, y arriba, z hacia la cámara. Planta baja y = 0..2.5, planta alta y = 2.6..5.1. */
const M = require('../motor');
const { clamp, mix, sstep, n2, n3, fbm2, smin, sdCap, oclusion, sombra } = M;

const TAU = Math.PI * 2;
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
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const suave = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };

/* ------------------------------------------------------------ geometría fija */
const MUSLO_D = { a: [0.17, 0.58, -0.88], b: [0.17, 0.6, -0.3], r: 0.095 };     // muslo con el móvil (derecha de la imagen)
const MUSLO_I = { a: [-0.17, 0.58, -0.88], b: [-0.17, 0.6, -0.3], r: 0.095 };
const MOVIL_BOLSILLO = [0.17, 0.668, -0.77];                                       // centro del móvil bajo la tela
const MOVIL_MESILLA = [0.95, 3.23, -0.8];                                         // móvil de la otra planta (tumbado, pantalla apagada)

/* vibración del muslo: ráfagas «brr-brr» al compás del efecto de sonido (0.68–0.95 y 1.07–1.34 s) y temblor residual */
function vibracion(t) {
  if (t > 5) return 0;
  const rafaga = (a, b) => suave((t - a) / 0.04) * (1 - suave((t - b) / 0.04));
  const r = Math.max(rafaga(0.68, 0.95), rafaga(1.07, 1.34));
  const base = t < 1.7 ? 0.38 + 0.12 * Math.sin(t * 9) : t < 2.6 ? 0.3 * (1 - suave((t - 1.7) / 0.9)) : 0;
  return Math.max(r, base * (t < 0.2 ? suave(t / 0.2) * 0.4 + 0.6 : 1));
}

/* ------------------------------------------------------------ mundo */
function sdMundo(sc, x, y, z, mo) {
  let best = 1e9, nm = '';
  const put = (d, n) => { if (d < best) { best = d; nm = n; } };
  const A = sc.vib;
  // casa: cimientos, forjado, techo, fondo y laterales
  put(sdRBox(x, y, z, 0, -0.2, -0.6, 2.05, 0.2, 1.55, 0.03), 'suelo');
  put(sdRBox(x, y, z, 0, 2.55, -0.6, 2.0, 0.07, 1.5, 0.02), 'forjado');
  put(sdRBox(x, y, z, 0, 5.15, -0.6, 2.05, 0.07, 1.55, 0.02), 'techo');
  put(sdRBox(x, y, z, 0, 2.6, -2.1, 2.0, 2.65, 0.08, 0.02), 'fondo');
  put(sdRBox(x, y, z, -1.93, 2.6, -0.6, 0.08, 2.65, 1.5, 0.02), 'lado');
  put(sdRBox(x, y, z, 1.93, 2.6, -0.6, 0.08, 2.65, 1.5, 0.02), 'lado');
  // PLANTA BAJA · sofá y persona sentada
  if (Math.hypot(x, y - 0.9, z + 0.7) < 2.0) {
    put(sdRBox(x, y, z, 0, 0.27, -0.78, 0.9, 0.2, 0.45, 0.07), 'sofa');
    put(sdRBox(x, y, z, 0, 0.82, -1.32, 0.9, 0.42, 0.12, 0.07), 'sofa');
    put(sdRBox(x, y, z, -0.98, 0.5, -0.82, 0.12, 0.3, 0.5, 0.06), 'sofa');
    put(sdRBox(x, y, z, 0.98, 0.5, -0.82, 0.12, 0.3, 0.5, 0.06), 'sofa');
    put(sdRBox(x, y, z, 0.55, 0.88, -1.12, 0.3, 0.26, 0.07, 0.05), 'cojin');
    // piernas: muslos + rodillas + espinillas + zapatillas
    for (const [M0, sx] of [[MUSLO_I, -1], [MUSLO_D, 1]]) {
      const mu = sdCap(x, y, z, ...M0.a, ...M0.b, M0.r);
      let d = mu;
      if (sx > 0) {   // el bulto del móvil bajo la tela, con su temblor, y la tela que ondula alrededor
        const j = A * 0.011, ph = sc.t * 2 * Math.PI * 38;
        const bx = MOVIL_BOLSILLO[0] + j * Math.sin(ph), by = MOVIL_BOLSILLO[1] + j * 0.7 * Math.sin(ph * 1.13 + 1), bz = MOVIL_BOLSILLO[2] + j * 1.3 * Math.sin(ph * 0.87 + 2);
        const bulto = sdRBox(x, y, z, bx, by - 0.004, bz, 0.04, 0.017, 0.082, 0.01);
        d = smin(mu, bulto, 0.035);
        const dc = Math.hypot(x - MOVIL_BOLSILLO[0], z - MOVIL_BOLSILLO[2]);
        d -= A * 0.006 * Math.sin(ph * 0.5 + dc * 55) * Math.exp(-dc * 5);
      }
      put(d, 'vaquero');
      put(sdCap(x, y, z, M0.b[0], 0.6, -0.3, M0.b[0], 0.15, -0.22, 0.072), 'vaquero');
      put(sdSph(x, y, z, M0.b[0], 0.6, -0.3, 0.092), 'vaquero');
      put(sdRBox(x, y, z, M0.b[0], 0.055, -0.13, 0.07, 0.05, 0.15, 0.04), 'zapatilla');
      put(sdRBox(x, y, z, M0.b[0], 0.012, -0.13, 0.075, 0.014, 0.155, 0.01), 'suela');
    }
    // tronco, brazos, cabeza
    put(sdEllip(x, y, z, 0, 1.0, -0.98, 0.25, 0.36, 0.16), 'camiseta');
    put(sdEllip(x, y, z, 0, 0.67, -0.9, 0.27, 0.17, 0.19), 'vaquero');
    for (const sx of [-1, 1]) {
      put(sdCap(x, y, z, sx * 0.25, 1.22, -0.98, sx * 0.31, 0.92, -0.88, 0.052), 'camiseta');
      put(sdCap(x, y, z, sx * 0.31, 0.92, -0.88, sx * 0.43, 0.7, -0.55, 0.043), 'piel');
      put(sdSph(x, y, z, sx * 0.44, 0.68, -0.5, 0.05), 'piel');
    }
    put(sdCap(x, y, z, 0, 1.3, -0.98, 0, 1.4, -0.97, 0.06), 'piel');
    put(sdSph(x, y, z, 0, 1.5, -0.96, 0.11), 'piel');
    put(sdSph(x, y, z, 0, 1.54, -1.0, 0.112), 'pelo');
  }
  // PLANTA ALTA · cama, mesilla y el móvil quieto
  if (Math.hypot(x + 0.2, y - 3.1, z + 0.6) < 2.6) {
    put(sdRBox(x, y, z, -0.55, 2.86, -0.95, 0.85, 0.22, 1.05, 0.08), 'colchon');
    put(sdRBox(x, y, z, -0.55, 3.35, -1.98, 0.9, 0.5, 0.08, 0.04), 'cabecero');
    put(sdRBox(x, y, z, -0.55, 3.14, -1.55, 0.45, 0.07, 0.22, 0.06), 'almohada');
    put(sdRBox(x, y, z, -0.55, 3.07, -0.5, 0.82, 0.05, 0.75, 0.05), 'manta');
    put(sdRBox(x, y, z, 0.98, 2.92, -1.0, 0.27, 0.3, 0.27, 0.03), 'mesilla');
    put(sdRBox(x, y, z, MOVIL_MESILLA[0], MOVIL_MESILLA[1], MOVIL_MESILLA[2], 0.075, 0.009, 0.15, 0.012), 'movil');
    put(sdRBox(x, y, z, MOVIL_MESILLA[0], MOVIL_MESILLA[1] + 0.004, MOVIL_MESILLA[2], 0.067, 0.008, 0.142, 0.008), 'pantalla');
  }
  if (mo) mo.m = nm;
  return best;
}

/* ------------------------------------------------------------ cámara */
const CERCA0 = [0.85, 1.55, 0.62], CERCA1 = [0.66, 1.4, 0.26];
const MOV = [0.95, 3.23, -0.8];
function camara(t) {
  const F = [0.17, 0.66, -0.74], A = t < 5 ? vibracion(t) : 0;
  const sac = [A * 0.007 * Math.sin(t * 171), A * 0.006 * Math.sin(t * 203 + 1), A * 0.004 * Math.sin(t * 149 + 2)];
  const hombro = 0.01 * Math.sin(t * 2.3), alt = 0.008 * Math.sin(t * 3.1 + 1);
  let eye, target, fov;
  if (t < 1.7) { const k = suave(t / 1.7); eye = lerp3(CERCA0, CERCA1, k); target = [F[0], F[1] + 0.1, F[2]]; fov = 36; }
  else if (t < 3.67) { const k = suave((t - 1.7) / 1.97); eye = lerp3([0.66, 1.4, 0.26], [0.7, 4.2, 3.6], k); target = lerp3([F[0], F[1] + 0.1, F[2]], [0.92, 3.2, -0.8], k); fov = lerp(36, 38, k); }
  else if (t < 55.6) { const k = suave((t - 52.1) / 3.5); eye = lerp3([0.85, 1.55, 0.62], [0.95, 1.6, 0.8], k); target = [F[0], F[1] + 0.1, F[2]]; fov = 36; }
  else { const k = suave((t - 55.6) / 3.43); eye = lerp3([0.1, 3.0, 7.6], [0.7, 4.2, 3.6], k); target = lerp3([0.0, 2.55, -0.7], [0.92, 3.2, -0.8], k); fov = lerp(41, 38, k); }
  return { eye: [eye[0] + hombro + sac[0], eye[1] + alt + sac[1], eye[2] + sac[2]], target, fov };
}

const E = {};
E.prepara = (t) => { const c = camara(t); return { eye: c.eye, target: c.target, fov: c.fov, far: 40, pasos: 220, t, vib: (t < 5 ? vibracion(t) : 0) }; };
E.map = (sc, x, y, z) => sdMundo(sc, x, y, z);
const LUZ = (() => { const v = [-0.45, 0.75, 0.6], l = Math.hypot(...v); return v.map(a => a / l); })();

E.shade = (sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) => {
  const mo = {}; sdMundo(sc, x, y, z, mo); const m = mo.m;
  let alb = [.6, .6, .6], esp = 0, dur = 30, emi = 0;
  const w = fbm2(x * 3, y * 3 + z * 2, 3);
  if (m === 'suelo') alb = [.16, .15, .15];
  else if (m === 'forjado' || m === 'techo') alb = [.82, .8, .76];
  else if (m === 'fondo' || m === 'lado') {
    if (y < 2.5) alb = [mix(.86, .9, w), mix(.66, .72, w), mix(.45, .5, w)];            // salón: beige cálido
    else alb = [mix(.48, .54, w), mix(.58, .64, w), mix(.72, .8, w)];                    // dormitorio: azul grisáceo
    if (Math.abs(y - 0.06) < 0.06 || Math.abs(y - 2.66) < 0.05) alb = alb.map(v => v * .55);   // rodapié
  }
  else if (m === 'vaquero') {
    const u = x * 190, v = z * 190 + y * 40, weave = .5 + .5 * Math.sin(u) * Math.sin(v + 1.6);
    const gast = fbm2(x * 9, z * 9, 3);
    alb = [mix(.06, .12, gast) * (.85 + .3 * weave), mix(.13, .21, gast) * (.85 + .3 * weave), mix(.3, .44, gast) * (.85 + .3 * weave)];
    // costura del bolsillo: contorno rectangular alrededor del móvil
    const qx = Math.abs(x - MOVIL_BOLSILLO[0]) - 0.058, qz = Math.abs(z - MOVIL_BOLSILLO[2]) - 0.098, dq = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
    if (Math.abs(dq - 0.012) < 0.0018 && y > 0.58) alb = [.46, .36, .22].map(a => a * (.85 + .15 * Math.sin(z * 380)));
    esp = 0.04;
  }
  else if (m === 'zapatilla') alb = [.9, .9, .88];
  else if (m === 'suela') alb = [.25, .25, .25];
  else if (m === 'camiseta') alb = [.86, .58, .16].map((a, i) => a * (.9 + .15 * n3(x * 60, y * 60, z * 60)));
  else if (m === 'piel') { alb = [.86, .6, .46]; esp = .05; }
  else if (m === 'pelo') alb = [.09, .06, .045];
  else if (m === 'sofa') alb = [.18, .38, .42].map(a => a * (.9 + .2 * n3(x * 30, y * 30, z * 30)));
  else if (m === 'cojin') alb = [.92, .72, .32];
  else if (m === 'colchon') alb = [.9, .9, .93];
  else if (m === 'manta') alb = [.78, .3, .28].map((a, i) => a * (.85 + .3 * (.5 + .5 * Math.sin(x * 70) * Math.sin(z * 70))));
  else if (m === 'almohada') alb = [.96, .96, .98];
  else if (m === 'cabecero') alb = [.45, .3, .2];
  else if (m === 'mesilla') alb = [.55, .38, .24].map(a => a * (.93 + .1 * w));
  else if (m === 'movil') { alb = [.04, .04, .05]; esp = .9; dur = 90; }
  else if (m === 'pantalla') { alb = [.005, .006, .008]; esp = 1.4; dur = 150; }
  const ndl = Math.max(0, nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]);
  const sh = ndl > 0 ? sombra(map, x + nx * .02, y + ny * .02, z + nz * .02, LUZ[0], LUZ[1], LUZ[2], 10, 14, 24) : 0;
  const ao = oclusion(map, x, y, z, nx, ny, nz);
  const cielo = .45 + .55 * (.5 + .5 * ny), rebote = .5 - .5 * ny;
  const sol = [2.3, 2.0, 1.65], amb = [.5, .5, .56], sue = [.34, .26, .18];
  let c = [0, 1, 2].map(k => alb[k] * (sol[k] * ndl * sh + amb[k] * cielo * ao + sue[k] * rebote * ao));
  // luz de relleno de la lámpara de la mesilla (calidez en el dormitorio)
  if (y > 2.6) { const dl = Math.hypot(x - 0.98, y - 3.5, z + 0.9); const lamp = 1.3 / (1 + dl * dl * .9); c = [0, 1, 2].map(k => c[k] + alb[k] * lamp * [1, .8, .52][k] * Math.max(0, .35 + .65 * (-(nx * (x - 0.98) + ny * (y - 3.5) + nz * (z + 0.9)) / (dl || 1)))); }
  if (esp && ndl > 0) { const hx = LUZ[0] - dx, hy = LUZ[1] - dy, hz = LUZ[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, s = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), dur); c = c.map((v, k) => v + esp * s * sol[k] * sh); }
  return c;
};
E.cielo = (sc, dx, dy, dz) => { const k = clamp(.5 + .5 * dy, 0, 1); return [mix(.045, .02, k), mix(.06, .03, k), mix(.1, .055, k)]; };
E.camara = camara; E.vibracion = vibracion;
E.info = { titulo: 'vibracion (casa en corte)', seg: 59.03 };
module.exports = E;
