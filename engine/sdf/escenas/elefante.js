'use strict';
// ESCENA 'elefante' · Un elefante africano carga contra un humano y se detiene ante él (SDF realista, llanura al atardecer).
// 0–4,6 s: HOOK (el elefante trota hacia el humano y frena; los pies apoyados no resbalan: marcha dirigida por la distancia recorrida).
// 4,6–9,2 s: GIRO FINAL (del ojo del elefante al rostro sereno del humano).
const M = require('../motor');
const { clamp, mix, sstep, n2, n3, fbm2, smin, sdEll, sdCap, sdRC, sombra } = M;
const SUN = (() => { const v = [-0.35, 0.4, -0.85], l = Math.hypot(...v); return v.map(a => a / l); })();
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const HX = 0.8, EX0 = -12.2, EX1 = -3.4, T_PARA = 4.2;    // humano; posición inicial y final del elefante
const NC = 4, DUTY = 0.75, D = EX1 - EX0, S = D / NC;     // 4 ciclos de paso exactos: al parar, las cuatro patas quedan en el suelo
const OFF = { FL: 0.25, HL: 0.0, FR: 0.75, HR: 0.5 };    // orden de la marcha: trasera izq., delantera izq., trasera der., delantera der.
const L1 = 1.0, L2 = 0.98;

function posX(t) {                                       // arranca ya al trote y frena suave hasta EX1
  const u = clamp(t / T_PARA, 0, 1), f = 1 - Math.pow(1 - u, 2.2);   // velocidad inicial alta, frenado progresivo
  return EX0 + D * f;
}
function pata(ex, d, hx, z, off, front, bob) {           // devuelve [cadera, rodilla, pie] en mundo (plano XY, z fija)
  const u = ((d / S + off) % 1 + 1) % 1, A = DUTY * S / 2;
  const fbx = u < DUTY ? A - 2 * A * (u / DUTY) : -A + 2 * A * ease((u - DUTY) / (1 - DUTY));
  const fy = 0.11 + (u >= DUTY ? 0.24 * Math.sin(Math.PI * (u - DUTY) / (1 - DUTY)) : 0);
  const hip = [ex + hx, 2.02 + bob], foot = [ex + hx + fbx * 0.82, fy];
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1], Dd = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.02), a = Math.atan2(dy, dx);
  const cosA = clamp((L1 * L1 + Dd * Dd - L2 * L2) / (2 * L1 * Dd), -1, 1), A2 = Math.acos(cosA), s = front ? 1 : -1;
  const knee = [hip[0] + L1 * Math.cos(a + s * A2), hip[1] + L1 * Math.sin(a + s * A2)];
  return { hip, knee, foot, z };
}

// Primitivas: [tipo, m, ...] e = elipsoide (cx,cy,cz,rx,ry,rz), c = cápsula (a,b,r), r = cono redondeado (a,b,r1,r2)
function figuras(t) {
  const ex = posX(t), d = ex - EX0, mov = clamp(1 - t / T_PARA, 0, 1), bob = 0.035 * Math.abs(Math.sin(Math.PI * d / S * 2)) * (0.3 + mov) + 0.006 * Math.sin(t * 1.6);
  const resp = Math.sin(t * 1.7) * 0.012, flap = Math.sin(t * 2.6) * 0.5 + 0.5;
  const g = [], h = [];
  const gp = (tp, m, ...v) => g.push({ tp, m, v });
  const hp = (tp, m, ...v) => h.push({ tp, m, v });
  const X = v => ex + v;
  // ---- elefante
  gp('e', 'piel', X(0), 2.18 + bob + resp, 0, 1.45, 0.92 + resp, 0.84);          // tronco
  gp('e', 'piel', X(1.0), 2.02 + bob, 0, 0.78, 0.86, 0.74);                      // pecho
  gp('e', 'piel', X(-1.05), 2.2 + bob, 0, 0.82, 0.88, 0.78);                     // grupa
  gp('e', 'piel', X(0.35), 2.92 + bob + resp, 0, 0.5, 0.2, 0.46);                // lomo
  const nod = 0.04 * Math.sin(Math.PI * d / S * 2) * (0.3 + mov) - 0.12 * ease((t - T_PARA) / 1.2) * 0;
  const hy = 2.42 + bob + nod;
  gp('r', 'piel', X(1.2), 2.45 + bob, 0, X(1.8), hy + 0.02, 0, 0.62, 0.55);       // cuello-cabeza
  gp('e', 'piel', X(2.0), hy + 0.0, 0, 0.58, 0.64, 0.5);                         // cráneo
  gp('e', 'piel', X(1.9), hy + 0.42, 0, 0.36, 0.34, 0.4);                        // frente (cúpula)
  gp('e', 'piel', X(2.38), hy - 0.22, 0, 0.3, 0.38, 0.32);                       // cara
  for (const s of [1, -1]) {
    // oreja: tres lóbulos apilados que se abren al subir; aleteo lento con t
    const open = 0.14 + 0.2 * flap + 0.12 * mov;
    gp('e', 'oreja', X(1.5), hy + 0.05, s * (0.5 + open * 0.2), 0.12, 0.34, 0.07);
    gp('e', 'oreja', X(1.42 - open * 0.05), hy - 0.18, s * (0.52 + open * 0.55), 0.46, 0.34, 0.035);
    gp('e', 'oreja', X(1.38 - open * 0.08), hy + 0.22, s * (0.52 + open * 0.38), 0.44, 0.4, 0.035);
    gp('e', 'oreja', X(1.34 - open * 0.1), hy - 0.52, s * (0.56 + open * 0.7), 0.38, 0.3, 0.03);
    gp('e', 'ojo', X(2.28), hy + 0.1, s * 0.46, 0.036, 0.034, 0.028);             // ojo
    gp('e', 'piel', X(2.28), hy + 0.145, s * 0.45, 0.06, 0.028, 0.05);            // párpado
    gp('e', 'pestana', X(2.3), hy + 0.172, s * 0.45, 0.04, 0.006, 0.05);          // pestañas
    // colmillo: tres tramos, curvados hacia delante y arriba
    const a0 = [X(2.34), hy - 0.42, s * 0.2], a1 = [X(2.9), hy - 0.52, s * 0.26], a2 = [X(3.3), hy - 0.34, s * 0.27], a3 = [X(3.5), hy - 0.06, s * 0.26];
    gp('r', 'colmillo', ...a0, ...a1, 0.075, 0.062); gp('r', 'colmillo', ...a1, ...a2, 0.062, 0.045); gp('r', 'colmillo', ...a2, ...a3, 0.045, 0.014);
    // patas con apoyo real
    for (const [f, hx, nm] of [[true, 0.95, s > 0 ? 'FL' : 'FR'], [false, -0.98, s > 0 ? 'HL' : 'HR']]) {
      const p = pata(ex, d, hx, s * 0.52, OFF[nm], f, bob), z = s * 0.52;
      gp('r', 'piel', p.hip[0], p.hip[1] + 0.05, z, p.knee[0], p.knee[1], z, f ? 0.4 : 0.44, 0.3);
      gp('r', 'pata', p.knee[0], p.knee[1], z, p.foot[0], p.foot[1] + 0.12, z, 0.3, 0.24);
      gp('e', 'pata', p.foot[0] + 0.03, p.foot[1] + 0.07, z, 0.32, 0.1, 0.27);                 // pie
      for (const k of [-0.15, 0, 0.15]) gp('e', 'unia', p.foot[0] + 0.3, p.foot[1] + 0.07, z + k * (z > 0 ? 1 : 1), 0.045, 0.055, 0.05);
    }
  }
  // trompa: seis tramos, curvada al trote, relajada y olisqueando al parar
  const tr = [X(2.58), hy - 0.45]; let ang = -Math.PI / 2 + 0.55, pz = 0;
  const curl = mix(0.35, 0.16, 1 - mov), sniff = ease((t - T_PARA) / 1.4) * (0.45 + 0.2 * Math.sin(t * 2.1));
  const rad = [0.24, 0.205, 0.17, 0.14, 0.11, 0.085, 0.065];
  for (let i = 0; i < 6; i++) {
    ang += -curl * 0.45 - sniff * 0.12 * (i / 5) + 0.07 * Math.sin(t * 1.9 + i * 0.7) * (0.4 + mov);
    pz = 0.04 * Math.sin(t * 1.3 + i) * (i / 5);
    const nx = tr[0] + 0.4 * Math.cos(ang), ny = tr[1] + 0.4 * Math.sin(ang);
    gp('r', 'trompa', tr[0], tr[1], i ? pz : 0, nx, Math.max(ny, 0.1), pz, rad[i], rad[i + 1]); tr[0] = nx; tr[1] = ny;
  }
  gp('e', 'trompa', tr[0] + 0.02, tr[1] - 0.01, pz, 0.075, 0.06, 0.07);                          // punta
  // cola
  gp('r', 'cola', X(-1.82), 2.5 + bob, 0, X(-1.95), 1.55 + bob, 0, 0.065, 0.04); gp('e', 'cola', X(-1.96), 1.4 + bob, 0, 0.07, 0.15, 0.07);
  // ---- humano (mira a -x), de pie y quieto
  const f = -1, hb = Math.sin(t * 2.0 + 1) * 0.008;
  hp('e', 'pantalon', 0, .95, 0, .17, .12, .2);
  for (const s of [1, -1]) {
    hp('r', 'pantalon', 0, .92, .09 * s, 0, .5, .1 * s, .09, .07);
    hp('r', 'pantalon', 0, .5, .1 * s, 0, .09, .1 * s, .07, .05);
    hp('e', 'zapato', .06 * f, .04, .1 * s, .11, .04, .05);
    hp('r', 'camiseta', 0, 1.4 + hb, .225 * s, 0, 1.12, .27 * s, .055, .045);
    hp('r', 'piel', 0, 1.12, .27 * s, .1 * f, .93, .26 * s, .042, .035);
    hp('e', 'piel', .105 * f, .9, .26 * s, .04, .05, .03);
  }
  hp('e', 'camiseta', 0, 1.2 + hb, 0, .13, .27, .2);
  hp('e', 'camiseta', 0, 1.38 + hb, 0, .12, .1, .24);
  hp('c', 'piel', 0, 1.46 + hb, 0, 0, 1.54 + hb, 0, .05);
  hp('e', 'piel', 0, 1.65 + hb, 0, .1, .118, .095);
  hp('e', 'pelo', -.012 * f, 1.7 + hb, 0, .1, .085, .1);
  hp('e', 'piel', .095 * f, 1.62 + hb, 0, .03, .028, .022);
  hp('e', 'ojo', .082 * f, 1.67 + hb, .04, .016, .015, .015); hp('e', 'ojo', .082 * f, 1.67 + hb, -.04, .016, .015, .015);
  hp('e', 'pelo', .085 * f, 1.705 + hb, .04, .014, .006, .026); hp('e', 'pelo', .085 * f, 1.705 + hb, -.04, .014, .006, .026);
  hp('e', 'piel', 0, 1.655 + hb, .095, .018, .03, .012); hp('e', 'piel', 0, 1.655 + hb, -.095, .018, .03, .012);
  hp('e', 'labio', .074 * f, 1.585 + hb, 0, .012, .006, .028);
  return { g, h, ex, hy };
}
function dPrim(p, x, y, z) {
  const v = p.v;
  return p.tp === 'e' ? sdEll(x - v[0], y - v[1], z - v[2], v[3], v[4], v[5])
    : p.tp === 'c' ? sdCap(x, y, z, v[0], v[1], v[2], v[3], v[4], v[5], v[6])
      : sdRC(x, y, z, v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
}
const DUROS = { ojo: 1, pestana: 1, unia: 1 };
function dFig(list, ox, k, x, y, z) {
  let d = 1e9, hd = 1e9;
  for (const p of list) { const di = dPrim(p, x - ox, y, z); if (DUROS[p.m]) { if (di < hd) hd = di; } else d = smin(d, di, p.m === 'colmillo' || p.m === 'oreja' ? k * 0.4 : k); }
  return Math.min(d, hd);
}
function nearest(list, ox, x, y, z) { let best = null, bd = 1e9; for (const p of list) { const d = dPrim(p, x - ox, y, z); if (d < bd) { bd = d; best = p; } } return best; }
const sueloH = (x, z) => .06 * fbm2(x * .4, z * .4, 3) + .015 * n2(x * 7, z * 7);
const ARBOLES = [[-6, 9, .4], [4, 11, .5], [-10, 14, .6], [9, 16, .5], [0, 24, .7], [14, 8, .4], [-14, 6, .5]];   // acacias lejanas (troncos)
function arboles(x, y, z) { let d = 1e9; for (const [tx, tz, r] of ARBOLES) { const dd = Math.hypot(x - tx, z - tz) - r * (1 + .04 * Math.sin(y * 3 + tx)); if (dd < d) d = dd; } return d; }

const E = {
  prepara(t) {
    const { g, h, ex, hy } = figuras(t);
    let eye, target, fov = 44;
    if (t < 4.6) {                                       // HOOK: plano bajo junto al humano; el elefante carga y frena
      const u = t / 4.6;
      target = [lerp(ex + 0.8, ex + 1.7, ease(u)), lerp(1.7, 1.9, u), 0.15];
      eye = [HX + lerp(1.5, 1.0, u), lerp(0.95, 1.2, u), lerp(-0.75, -1.3, u)]; fov = 54;
    } else if (t < 6.6) {                                // ojo del elefante: primer plano y salida
      const u = (t - 4.6) / 2.0, a = lerp(-1.25, -0.8, ease(u)), dist = lerp(2.2, 3.4, ease(u));
      target = [ex + 2.26, hy + 0.1, -0.44]; eye = [target[0] + Math.sin(a) * dist * 0.6, target[1] + lerp(0.05, 0.3, u), target[2] - Math.cos(a) * dist]; fov = 32;
    } else {                                             // rostro del humano, sereno
      const u = (t - 6.6) / 2.6;
      target = [HX - 0.05, lerp(1.4, 1.6, ease(u)), 0]; eye = [HX - lerp(2.6, 2.0, ease(u)), lerp(1.5, 1.65, ease(u)), lerp(-3.2, -2.5, ease(u))]; fov = 30;
    }
    return { t, g, h, ex, eye, target, fov, far: 70 };
  },
  map(sc, x, y, z, sinSuelo) {
    let d = sinSuelo ? 1e9 : (y - sueloH(x, z)) * .9;
    const tr = arboles(x, y, z); if (tr < d) d = tr;
    const bg = Math.hypot(x - sc.ex - 0.9, y - 1.9, z) - 3.7, bh = Math.hypot(x - HX, y - .95, z) - 1.05;
    const so = sinSuelo ? .3 : 0;   // en la sombra, la esfera envolvente no debe oscurecer: se infla su distancia
    d = Math.min(d, bg > .06 ? bg + so : dFig(sc.g, 0, .06, x, y, z), bh > .05 ? bh + so : dFig(sc.h, HX, .03, x, y, z));
    return d;
  },
  cielo(sc, dx, dy, dz) {
    const tt = clamp(dy * 1.8, 0, 1), c = [mix(1.5, .28, Math.pow(tt, .6)), mix(.82, .36, Math.pow(tt, .7)), mix(.42, .62, tt)];
    const s = Math.max(0, dx * SUN[0] + dy * SUN[1] + dz * SUN[2]);
    return c.map((v, k) => v + Math.pow(s, 10) * [1.2, .7, .25][k]);
  },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) {
    const ds = (y - sueloH(x, z)) * .9, dt = arboles(x, y, z), dg = Math.hypot(x - sc.ex - 0.9, y - 1.9, z) < 3.8 ? dFig(sc.g, 0, .06, x, y, z) : 9, dh = Math.hypot(x - HX, y - .95, z) < 1.1 ? dFig(sc.h, HX, .03, x, y, z) : 9;
    let alb, m = null, pelaje = 0, rug = 0;
    const mn = Math.min(ds, dt, dg, dh);
    if (mn === dg) {
      m = nearest(sc.g, 0, x, y, z).m;
      // piel de elefante: arrugas finas cruzadas, pliegues oscuros y polvo en la parte baja
      const w1 = Math.abs(Math.sin(y * 46 + 5 * n3(x * 5, y * 3, z * 5) + n3(x * 30, y * 8, z * 30) * 3.5)), w2 = n3(x * 26, y * 26, z * 26), crea = sstep(0.82, 1.0, w1);
      rug = 0.62 + 0.38 * w2;
      const polvo = sstep(1.5, 0.15, y) * (0.5 + 0.5 * n3(x * 5, y * 5, z * 5));
      const base = m === 'oreja' ? [.19, .15, .135] : m === 'trompa' ? [.17, .14, .125] : [.15, .125, .11];
      alb = base.map((v, k) => mix(v, [.36, .27, .18][k], polvo * 0.75) * (0.72 + 0.4 * rug) * (1 - 0.16 * crea));
      if (m === 'oreja') { const ven = sstep(.9, 1.0, Math.abs(Math.sin((x * 22 + z * 9) + 2 * n3(x * 4, y * 4, z * 4)))); alb = alb.map((v, k) => v * (1 - .16 * ven) + (k === 0 ? .018 * ven : 0)); }
      if (m === 'trompa') { const dist = Math.hypot(x - (sc.ex + 2.58), y - (2.0 + 0.4), z); const ani = 0.78 + 0.22 * Math.sin(dist * 58 + 3 * n3(x * 4, y * 4, z * 4)); alb = alb.map(v => v * ani); }
      if (m === 'colmillo') alb = [.62, .55, .42].map(v => v * (.82 + .3 * n3(x * 14, y * 14, z * 14)));
      else if (m === 'unia') alb = [.34, .29, .24];
      else if (m === 'ojo') alb = [.05, .028, .016];
      else if (m === 'pestana') alb = [.025, .02, .018];
      else if (m === 'pata') { alb = alb.map(v => v * 0.92); }
    } else if (mn === dh) {
      m = nearest(sc.h, HX, x, y, z).m;
      alb = m === 'piel' ? [.78, .55, .43].map(v => v * (.94 + .1 * n3(x * 40, y * 40, z * 40))) : m === 'camiseta' ? [.12, .27, .5].map(v => v * (.9 + .2 * n3(x * 120, y * 8, z * 120))) :
        m === 'pantalon' ? [.1, .12, .18] : m === 'zapato' ? [.82, .82, .8] : m === 'labio' ? [.55, .27, .25] : m === 'pelo' ? [.1, .065, .04].map(v => v * (.8 + .5 * n3(x * 80, y * 80, z * 80))) : [.05, .03, .02];
    } else if (mn === dt) {
      alb = [.2, .15, .11].map(v => v * (.6 + .8 * n3(x * 12, y * 2, z * 12)));
    } else {
      const f = fbm2(x * .4, z * .4, 4), g = n2(x * 16, z * 16);
      alb = [mix(.28, .4, f) * (.8 + .4 * g), mix(.2, .28, f) * (.8 + .4 * g), mix(.1, .14, f)];
      if (n2(x * 3, z * 3) > .72) alb = [.34, .22, .12];
      // polvo levantado y huellas: el suelo se oscurece alrededor del elefante
    }
    const ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);
    const sh = ndl > 0 ? sombra((a, b, c) => E.map(sc, a, b, c, true), x + nx * .12, y + ny * .12, z + nz * .12, SUN[0], SUN[1], SUN[2], 10, 18, 48) : 0;
    const sky = .5 + .5 * ny, bounce = .5 - .5 * ny;
    const sunC = [2.7, 1.7, .85], skyC = [.32, .34, .46], bC = [.2, .14, .08];
    const ao = M.oclusion(map, x, y, z, nx, ny, nz);
    const rim = Math.pow(1 - Math.max(0, -(nx * dx + ny * dy + nz * dz)), 3) * (mn === dg ? .22 : .1);
    const esp = m === 'ojo' ? M.brillo('ojo', nx, ny, nz, dx, dy, dz, SUN) * sh : (m === 'colmillo' ? 0.07 * sh : 0);
    const c = [0, 1, 2].map(k => alb[k] * (sunC[k] * ndl * sh + (skyC[k] * sky + bC[k] * bounce) * ao) + esp * sunC[k] + rim * [.9, .6, .3][k] * ao);
    const fog = 1 - Math.exp(-T * .018), fc = E.cielo(sc, dx, Math.max(dy, 0), dz).map(v => v * .7);
    return c.map((v, k) => mix(v, fc[k], fog));
  },
};
E.info = { titulo: 'Elefante y humano cara a cara (SDF)', seg: 9.2, letrero_s: 99 };
module.exports = E;
