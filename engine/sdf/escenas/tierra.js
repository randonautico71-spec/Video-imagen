'use strict';
/* ESCENA SDF «tierra» · el planeta visto desde el espacio (ray marching en CPU), con las costas reales de Natural Earth
   (las mismas de V.modelos.tierra: se leen de engine/volumen/tierra_datos.js y se rasterizan una vez en una máscara tierra/mar).
   Se usa en «¿Qué pasaría si la Tierra se parase de golpe?». Tiempo t = segundos del vídeo; el render se lanza por tramos.
     A (0–12 s)   gira rápido y se PARA en seco en tS = 1,06 s: sacudida, onda de choque desde Madrid y destello; las nubes (el aire) siguen
                  hacia el este por inercia; la cámara se acerca a Madrid, que lleva un punto de luz.
     B (26–33 s)  la Tierra está parada y los océanos siguen fluyendo hacia el este como rayas luminosas (los mares no frenan).
     C (35–44 s)  la Tierra gira despacio como siempre (se frena sola): órbita lenta con el terminador.
   Ejes: x derecha, y arriba, z hacia la cámara. Meridiano l = 0 mirando a +z; l crece hacia +x (el este va a la derecha, como en un mapa con el norte arriba).
   E.ancla(t) devuelve la posición de Madrid en pantalla (0..1) o null si queda tras el limbo (para pegar rótulos de VE.ed). */
const fs = require('fs'), path = require('path');
const M = require('../motor');
const { clamp, mix, sstep, n3 } = M;

const D = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const suave = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const tramo = (t, a, d) => suave((t - a) / d);
const lin = c => [Math.pow(c[0] / 255, 2.2), Math.pow(c[1] / 255, 2.2), Math.pow(c[2] / 255, 2.2)];

/* ------------------------------------------------------------ máscara tierra/mar (equirectangular 4096x2048) */
const NW = 4096, NH = 2048;
const TIERRA = new Float32Array(NW * NH), COSTA = new Float32Array(NW * NH);
(function () {
  const src = fs.readFileSync(path.join(__dirname, '../../volumen/tierra_datos.js'), 'utf8'), mm = /VE\.TIERRA_COSTAS\s*=\s*"([^"]+)"/.exec(src);
  if (!mm) throw new Error('No se encuentran las costas en tierra_datos.js');
  const cruces = Array.from({ length: NH }, () => []);
  for (const r of mm[1].split(';')) {
    const v = r.split(',').map(Number), P = []; let x = 0, y = 0;
    for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; P.push([(x / 20 + 180) / 360 * NW, (90 - y / 20) / 180 * NH]); }
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length]; if (a[1] === b[1]) continue;
      const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      for (let j = Math.max(0, Math.ceil(y0 - 0.5)); j < Math.min(NH, Math.ceil(y1 - 0.5)); j++) cruces[j].push(a[0] + (j + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
  }
  for (let j = 0; j < NH; j++) {
    const c = cruces[j].sort((p, q) => p - q);
    for (let k = 0; k + 1 < c.length; k += 2) for (let i = Math.max(0, Math.ceil(c[k] - 0.5)); i < Math.min(NW, Math.ceil(c[k + 1] - 0.5)); i++) TIERRA[j * NW + i] = 1;
  }
  // plataforma costera: desenfoque de caja (2 pasadas separables) de la máscara
  const R = 9, tmp = new Float32Array(NW * NH);
  for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) { let s = 0; for (let d = -R; d <= R; d++) s += TIERRA[j * NW + ((i + d + NW) % NW)]; tmp[j * NW + i] = s / (2 * R + 1); }
  for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) { let s = 0; for (let d = -R; d <= R; d++) s += tmp[clamp(j + d, 0, NH - 1) * NW + i]; COSTA[j * NW + i] = s / (2 * R + 1); }
})();
function muestra(A, lon, lat) {                  // grados; interpolación bilineal con vuelta en longitud
  const u = (lon + 180) / 360 * NW - 0.5, v = clamp((90 - lat) / 180 * NH - 0.5, 0, NH - 1.001), i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
  const a = ((i0 % NW) + NW) % NW, b = (a + 1) % NW, r0 = j0 * NW, r1 = (j0 + 1) * NW;
  return mix(mix(A[r0 + a], A[r0 + b], fu), mix(A[r1 + a], A[r1 + b], fu), fv);
}
const caja = (la, lo, a0, a1, o0, o1, s) => clamp(Math.min(Math.min(la - a0, a1 - la), Math.min(lo - o0, o1 - lo)) / s, 0, 1);
const desierto = (la, lo) => Math.max(caja(la, lo, 14, 33, -17, 35, 6), caja(la, lo, 13, 33, 35, 60, 5), caja(la, lo, 25, 38, 50, 72, 5) * 0.8, caja(la, lo, 37, 48, 88, 118, 5) * 0.7,
  caja(la, lo, -33, -19, 116, 146, 5) * 0.85, caja(la, lo, -28, -18, 14, 26, 4) * 0.6, caja(la, lo, -30, -15, -72, -68, 2) * 0.6, caja(la, lo, 28, 40, -118, -103, 4) * 0.5);

/* ------------------------------------------------------------ estado en el tiempo */
const TS = 1.06, W0 = 1.9, MAD = [40.42, -3.70];              // instante de la parada, velocidad de giro antes de parar (rad/s), Madrid [lat, lon]
const TH0 = -MAD[1] * D;                                       // con th = TH0, Madrid queda en el meridiano central
const SOL = (() => { const v = [-0.6, 0.32, 0.58], l = Math.hypot(...v); return v.map(a => a / l); })();
function estado(t) {
  let th, ca, oc = 0, mrel = 0, seg;
  if (t < 14) {                                                // A: gira, se para, el aire sigue
    seg = 'A';
    th = t < TS ? TH0 - W0 * (TS - t) : TH0 - 0.016 * Math.exp(-7 * (t - TS)) * Math.sin(34 * (t - TS));
    ca = t < TS ? th : TH0 + W0 * 3.0 * (1 - Math.exp(-(t - TS) / 3.0));
  } else if (t < 34) {                                         // B: parada; los mares fluyen
    seg = 'B'; th = 25 * D; ca = th + 0.5 * (t - 26.65) + 1.0; oc = tramo(t, 26.75, 0.5) * (1 - tramo(t, 30.4, 0.6)); mrel = 2.6 * (t - 26.65);
  } else {                                                     // C: gira despacio, como siempre
    seg = 'C'; th = -20 * D + 0.42 * (t - 35.01); ca = th + 0.04 * (t - 35.01);
  }
  return { t, seg, th, ca, oc, mrel, flash: t >= TS && t < 14 ? Math.exp(-(t - TS) * 9) : 0 };
}
const mad = (th) => { const la = MAD[0] * D, l = MAD[1] * D + th; return [Math.cos(la) * Math.sin(l), Math.sin(la), Math.cos(la) * Math.cos(l)]; };

/* ------------------------------------------------------------ cámara */
function camara(t) {
  let eye, target, fov = 30;
  if (t < 14) {
    const k = tramo(t, TS + 0.15, 4.2), s = Math.exp(-(t - TS) * 6) * (t >= TS ? 1 : 0), M1 = mad(TH0);
    eye = lerp3([0.0, 0.5, 6.6], [M1[0] * 2.25, M1[1] * 2.25 + 0.02, M1[2] * 2.25], k); target = lerp3([0, 0, 0], [M1[0] * 0.98, M1[1] * 0.98, M1[2] * 0.98], k);
    if (t < TS) eye = [eye[0], eye[1], eye[2] - 0.5 * tramo(t, 0, TS)];
    eye = [eye[0] + 0.05 * s * Math.sin(60 * t), eye[1] + 0.05 * s * Math.cos(47 * t), eye[2]];
    fov = lerp(32, 30, k);
  } else if (t < 34) {
    const k = tramo(t, 26.65, 4.4); eye = [Math.sin(lerp(-0.35, 0.3, k)) * lerp(6.2, 5.0, k), lerp(1.0, 0.5, k), Math.cos(lerp(-0.35, 0.3, k)) * lerp(6.2, 5.0, k)]; target = [0, 0.05, 0];
  } else if (t < 38.54) {
    const k = tramo(t, 35.01, 4.0); eye = lerp3([-2.6, 1.3, 6.0], [-1.2, 0.7, 5.4], k); target = [0.0, 0.0, 0]; fov = 30;
  } else {
    const k = tramo(t, 38.54, 4.0); eye = lerp3([3.2, 0.6, 4.4], [2.4, 0.3, 3.8], k); target = lerp3([0.2, 0.05, 0], [0.5, 0.05, 0], k); fov = 30;
  }
  return { eye, target, fov };
}
/* posición de Madrid en pantalla (0..1; u derecha, v abajo) o null si no se ve */
function ancla(t) {
  const c = camara(t), s = estado(t), P = mad(s.th), [ex, ey, ez] = c.eye, [tx, ty, tz] = c.target;
  if (P[0] * ex + P[1] * ey + P[2] * ez < 1.0) return null;
  let fx = tx - ex, fy = ty - ey, fz = tz - ez; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl; const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const dx = P[0] - ex, dy = P[1] - ey, dz = P[2] - ez, zf = dx * fx + dy * fy + dz * fz; if (zf <= 0.05) return null;
  const foc = 0.5 / Math.tan(c.fov * Math.PI / 360);
  return [0.5 + (dx * rx + dz * rz) / zf * foc, 0.5 - (dx * ux + dy * uy + dz * uz) / zf * foc];
}

const E = {};
E.prepara = (t) => { const c = camara(t); return Object.assign({ eye: c.eye, target: c.target, fov: c.fov, far: 12, pasos: 60 }, estado(t)); };
E.map = (sc, x, y, z) => Math.hypot(x, y, z) - 1;

/* ------------------------------------------------------------ materiales */
const AGUA_PROF = lin([22, 50, 108]), AGUA_COSTA = lin([36, 100, 160]);
E.shade = (sc, x, y, z, nx, ny, nz, dx, dy, dz) => {
  const l = Math.atan2(x, z), la = Math.asin(clamp(y, -1, 1)), lat = la / D;
  let lon = (l - sc.th) / D; lon = ((lon + 540) % 360) - 180;
  const jx = (n3(x * 46 + 1, y * 46, z * 46) - 0.5) * 0.16, jy = (n3(x * 46, y * 46 + 2, z * 46) - 0.5) * 0.16, tierra = muestra(TIERRA, lon + jx, lat + jy), cst = muestra(COSTA, lon + jx, lat + jy);
  const n = n3(x * 4 + 3, y * 4 + 3, z * 4 + 3), n2 = n3(x * 17 + 9, y * 17 + 4, z * 17 + 1), al = Math.abs(lat);
  // océano
  const k = clamp(cst * 1.7, 0, 1);
  let alb = [mix(AGUA_PROF[0], AGUA_COSTA[0], k) * (0.8 + 0.5 * n), mix(AGUA_PROF[1], AGUA_COSTA[1], k) * (0.8 + 0.5 * n), mix(AGUA_PROF[2], AGUA_COSTA[2], k) * (0.85 + 0.3 * n)];
  let emi = 0;
  if (sc.oc > 0.01) {                                         // rayas de agua que avanzan hacia el este mientras la tierra está parada
    const lo2 = (l - sc.th) - sc.mrel, s = sstep(0.55, 0.9, n3(lo2 * 6.0, lat * 0.9 + 3.1, 0.7) * 0.7 + n3(lo2 * 15.0, lat * 2.4, 4.2) * 0.3) * sc.oc * (1 - sstep(0.15, 0.5, tierra));
    alb = [mix(alb[0], 0.7, s), mix(alb[1], 0.92, s), mix(alb[2], 1.0, s)]; emi += 0.35 * s;
  }
  // tierra
  const lr = 62 + 40 * n + 14 * n2 - (al < 15 ? 18 : 0), lg = 112 + 40 * n + 16 * n2 - Math.max(0, al - 45) * 0.8 - (al < 15 ? 8 : 0), lb = 52 + 16 * n - (al < 15 ? 6 : 0);
  const ds = desierto(lat, lon), hielo = Math.min(1, Math.max(0, (al - 62) / 8) * (lat < 0 || (lon > -75 && lon < -10) ? 1 : 0.35) + (lat < -60 ? 1 : 0));
  let T = [lr + (204 - lr) * ds, lg + (168 - lg) * ds, lb + (110 - lb) * ds]; T = [T[0] + (236 - T[0]) * hielo, T[1] + (242 - T[1]) * hielo, T[2] + (248 - T[2]) * hielo]; T = lin(T);
  const t3 = sstep(0.35, 0.65, tierra); alb = [mix(alb[0], T[0], t3), mix(alb[1], T[1], t3), mix(alb[2], T[2], t3)];
  // nubes (el aire): giran con su propio ángulo
  const lc = l - sc.ca, cx = Math.sin(lc) * Math.cos(la), cz = Math.cos(lc) * Math.cos(la);
  const dens = (px, py, pz) => { const v = n3(px * 3.2 + 11, py * 5.5, pz * 3.2) * 0.5 + n3(px * 7.5, py * 13 + 5, pz * 7.5) * 0.3 + n3(px * 17, py * 30, pz * 17 + 8) * 0.2; return sstep(0.56 - 0.05 * Math.cos(la * 3.0), 0.68 - 0.05 * Math.cos(la * 3.0), v); };
  const nub = dens(cx, y, cz) * (1 - 0.8 * sstep(78, 90, al)) * (sc.seg === 'B' ? 0.55 : 1);
  const ndl = nx * SOL[0] + ny * SOL[1] + nz * SOL[2], dia = sstep(-0.12, 0.28, ndl), sombraNub = 1 - 0.4 * dens(cx - SOL[0] * 0.06, y - SOL[1] * 0.06, cz - SOL[2] * 0.06);
  alb = [alb[0] * sombraNub, alb[1] * sombraNub, alb[2] * sombraNub];
  alb = [mix(alb[0], 0.95, nub * 0.92), mix(alb[1], 0.96, nub * 0.92), mix(alb[2], 0.98, nub * 0.92)];
  // luz
  const lamb = clamp(ndl, 0, 1) * 1.45, term = Math.exp(-Math.pow((ndl - 0.02) / 0.12, 2)) * 0.5;
  let c = [alb[0] * (lamb * 1.02 + 0.035) + term * 0.35 * alb[0], alb[1] * (lamb * 0.98 + 0.04) + term * 0.14 * alb[1], alb[2] * (lamb * 0.92 + 0.07) + term * 0.04 * alb[2]];
  // brillo del sol sobre el agua
  const hx = SOL[0] - dx, hy = SOL[1] - dy, hz = SOL[2] - dz, hl = Math.hypot(hx, hy, hz) || 1, sp = Math.pow(clamp((nx * hx + ny * hy + nz * hz) / hl, 0, 1), 220) * (1 - t3) * (1 - nub) * dia * 0.9;
  c = [c[0] + sp, c[1] + sp, c[2] + sp * 0.9];
  // luces de ciudades en la cara nocturna
  const noche = sstep(0.06, -0.14, ndl) * t3; if (noche > 0.01) { const lz = Math.pow(n3(x * 70, y * 70, z * 70), 9) * 5 * (1 - 0.7 * nub); c = [c[0] + noche * lz * 1.1, c[1] + noche * lz * 0.8, c[2] + noche * lz * 0.35]; }
  // atmósfera en el borde
  const fr = Math.pow(1 - clamp(-(nx * dx + ny * dy + nz * dz), 0, 1), 3.0), aA = fr * (0.18 + 0.95 * clamp(ndl * 1.3 + 0.35, 0, 1));
  c = [c[0] + 0.16 * aA, c[1] + 0.38 * aA, c[2] + 0.95 * aA];
  // emisiones
  c = [c[0] + emi * 0.5, c[1] + emi * 0.8, c[2] + emi];
  if (sc.seg === 'A') {
    const P = mad(sc.th), ang = Math.acos(clamp(nx * P[0] + ny * P[1] + nz * P[2], -1, 1));
    const pin = Math.exp(-Math.pow(ang / 0.011, 2)) * (0.7 + 0.3 * Math.sin(sc.t * 9)), halo = Math.exp(-Math.pow(ang / 0.05, 2)) * 0.25 * clamp((sc.t - TS) * 3, 0, 1);
    c = [c[0] + pin * 2.4 + halo * 0.9, c[1] + pin * 1.5 + halo * 0.55, c[2] + pin * 0.5 + halo * 0.2];
    if (sc.t >= TS) { const r = (sc.t - TS) * 2.4, ring = Math.exp(-Math.pow((ang - r) / 0.06, 2)) * Math.exp(-(sc.t - TS) * 0.75) * 1.6; c = [c[0] + ring, c[1] + ring * 0.95, c[2] + ring * 0.85]; }
    const f = 1 + 1.4 * sc.flash; c = [c[0] * f, c[1] * f, c[2] * f];
  }
  return c;
};

/* ------------------------------------------------------------ espacio y halo de la atmósfera */
E.cielo = (sc, dx, dy, dz) => {
  const [ex, ey, ez] = sc.eye, t0 = -(ex * dx + ey * dy + ez * dz);
  let c = [0.004, 0.006, 0.014];
  const st = Math.pow(n3(dx * 300 + 3, dy * 300, dz * 300), 110) * 2.2 + Math.pow(n3(dx * 110, dy * 110 + 7, dz * 110), 150) * 3.5; c = [c[0] + st, c[1] + st, c[2] + st * 1.05];
  if (t0 > 0) {
    const cx = ex + dx * t0, cy = ey + dy * t0, cz = ez + dz * t0, b = Math.hypot(cx, cy, cz);
    if (b < 1.4) {
      const lit = clamp((cx * SOL[0] + cy * SOL[1] + cz * SOL[2]) / b * 1.3 + 0.4, 0, 1), h = Math.exp(-(b - 1) / 0.022) * (b >= 1 ? 1 : 0) * 0.9 + Math.exp(-(b - 1) / 0.12) * 0.12;
      let f = 1; if (sc.seg === 'A' && sc.t >= TS) f += 1.2 * sc.flash;
      c = [c[0] + h * lit * 0.2 * f, c[1] + h * lit * 0.48 * f, c[2] + h * lit * 1.0 * f];
    }
  }
  return c;
};

E.camara = camara; E.estado = estado; E.ancla = ancla;
E.info = { titulo: 'tierra (planeta que se para)', seg: 52.3 };
module.exports = E;
