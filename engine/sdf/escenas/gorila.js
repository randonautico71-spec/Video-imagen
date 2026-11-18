'use strict';
// ESCENA 'gorila' · Un humano y un gorila macho cara a cara, al atardecer, en el claro de un bosque.
// 0–4,5 s: plano general que orbita (HOOK). 5–9,5 s: primeros planos, del tronco del gorila a la cabeza del humano (giro final).
const M = require('../motor');
const { clamp, mix, sstep, n2, n3, fbm2, smin, sdEll, sdCap, sdRC, sombra } = M;
const SUN = (() => { const v = [-0.3, 0.42, -0.8], l = Math.hypot(...v); return v.map(a => a / l); })();
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const GX = -.95, HX = .95;     // posiciones x: el gorila mira a +x, el humano a -x

// Primitivas: [tipo, m, ...] tipos e = elipsoide (cx,cy,cz,rx,ry,rz), c = cápsula (a,b,r), r = cono redondeado (a,b,r1,r2)
function figuras(t) {
  const b = Math.sin(t * 2.3) * .014, sway = Math.sin(t * .9) * .03;
  const turn = ease((t - 1.2) / 1.5) * .35;                    // el gorila gira la cabeza hacia el humano
  const g = [], h = [];
  const gp = (tp, m, ...v) => g.push({ tp, m, v });
  const hp = (tp, m, ...v) => h.push({ tp, m, v });
  // ---- gorila (origen en el suelo, mira a +x)
  gp('e', 'cuerpo', .02, .63, 0, .30, .24, .30);                       // pelvis
  gp('e', 'cuerpo', .09, 1.0 + b, 0, .40, .52 + b, .47);               // tórax
  gp('e', 'cuerpo', .08, 1.27 + b, 0, .30, .2, .6);                    // hombros
  gp('e', 'cuerpo', -.12, 1.12 + b, 0, .3, .38, .4);                    // joroba/lomo
  gp('e', 'cabeza', .42, 1.58, 0, .22, .2, .19);                         // cráneo
  gp('e', 'cabeza', .36 - turn * .08, 1.76, 0, .2, .12, .1);            // cresta sagital
  gp('e', 'cabeza', .56, 1.64, 0, .1, .055, .17);                      // arco superciliar
  gp('e', 'hocico', .6, 1.53, 0, .14, .12, .14);                      // hocico
  gp('e', 'hocico', .54, 1.42, 0, .16, .09, .13);                       // mandíbula
  gp('e', 'nariz', .73, 1.56, .045, .025, .02, .025); gp('e', 'nariz', .73, 1.56, -.045, .025, .02, .025);
  gp('e', 'ojo', .62, 1.64, .08, .028, .026, .026); gp('e', 'ojo', .62, 1.64, -.08, .028, .026, .026);
  gp('c', 'cuerpo', .2, 1.25, .0, .4, 1.5, .0, .13);                    // cuello grueso
  for (const s of [1, -1]) {
    const k = s * (1 + .0);
    gp('r', 'cuerpo', .1, 1.3 + b, .55 * k, .3 + sway * s, .95, .72 * k, .18, .14);   // brazo
    gp('r', 'brazo', .3 + sway * s, .95, .72 * k, .46, .2, .74 * k, .14, .11);        // antebrazo
    gp('e', 'mano', .5, .1, .74 * k, .13, .1, .1);                                    // mano apoyada en los nudillos
    gp('r', 'cuerpo', -.02, .64, .2 * k, .12, .34, .28 * k, .17, .13);                // muslo
    gp('r', 'brazo', .12, .34, .28 * k, .0, .1, .28 * k, .12, .09);                   // pantorrilla
    gp('e', 'mano', .08, .05, .28 * k, .17, .05, .1);                                 // pie
  }
  // ---- humano (mira a -x)
  const f = -1, hb = Math.sin(t * 2.0 + 1) * .008;
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
  hp('e', 'pelo', .012 * -f, 1.7 + hb, 0, .1, .085, .1);
  hp('e', 'piel', .095 * f, 1.62 + hb, 0, .03, .028, .022);             // nariz
  hp('e', 'ojo', .082 * f, 1.67 + hb, .04, .016, .015, .015); hp('e', 'ojo', .082 * f, 1.67 + hb, -.04, .016, .015, .015);
  hp('e', 'pelo', .085 * f, 1.705 + hb, .04, .014, .006, .026); hp('e', 'pelo', .085 * f, 1.705 + hb, -.04, .014, .006, .026);   // cejas
  hp('e', 'piel', 0, 1.655 + hb, .095, .018, .03, .012); hp('e', 'piel', 0, 1.655 + hb, -.095, .018, .03, .012);               // orejas
  hp('e', 'labio', .074 * f, 1.585 + hb, 0, .012, .006, .028);                                                                // boca
  return { g, h };
}
function dPrim(p, x, y, z) {
  const v = p.v;
  return p.tp === 'e' ? sdEll(x - v[0], y - v[1], z - v[2], v[3], v[4], v[5])
    : p.tp === 'c' ? sdCap(x, y, z, v[0], v[1], v[2], v[3], v[4], v[5], v[6])
      : sdRC(x, y, z, v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
}
function dFig(list, ox, k, x, y, z) {
  let d = 1e9, hd = 1e9;
  for (const p of list) { const di = dPrim(p, x - ox, y, z); if (p.m === 'ojo' || p.m === 'nariz') { if (di < hd) hd = di; } else d = smin(d, di, k); }
  return Math.min(d, hd);
}
function nearest(list, ox, x, y, z) { let best = null, bd = 1e9; for (const p of list) { const d = dPrim(p, x - ox, y, z); if (d < bd) { bd = d; best = p; } } return best; }
const sueloH = (x, z) => .1 * fbm2(x * .5, z * .5, 3) + .02 * n2(x * 6, z * 6);
const TRONCOS = [[-5, -8, .35], [3.5, -10, .4], [-9, -14, .5], [8, -15, .45], [0, -22, .6], [-3, -6, .3], [6, -7, .3], [-11, -4, .4], [11, -4, .35]];
function troncos(x, y, z) {
  let d = 1e9;
  for (const [tx, tz, r] of TRONCOS) { const dd = Math.hypot(x - tx, z - tz) - r * (1 + .04 * Math.sin(y * 3 + tx)); if (dd < d) d = dd; }
  return d;
}

const E = {
  prepara(t) {
    const { g, h } = figuras(t);
    // cámara
    let eye, target, fov = 40;
    if (t < 4.6) {                                    // HOOK: plano general orbitando, de perfil a tres cuartos
      const u = t / 4.6, a = lerp(-.25, .5, ease(u)), dist = lerp(7.6, 5.6, ease(u));
      target = [0, lerp(1.35, 1.2, u), 0]; eye = [Math.sin(a) * dist, lerp(.8, 1.1, u), -Math.cos(a) * dist]; fov = 48;
    } else if (t < 7.0) {                             // músculo: del pecho del gorila al antebrazo
      const u = (t - 4.6) / 2.4, a = lerp(.7, 1.15, ease(u)), dist = lerp(3.6, 2.5, ease(u));
      target = [GX + .25, lerp(1.25, .95, u), .2]; eye = [target[0] + Math.sin(a) * dist, lerp(.75, .9, u), target[2] - Math.cos(a) * dist]; fov = 44;
    } else {                                          // cabeza: sube hasta el rostro del humano
      const u = (t - 7.0) / 2.6, a = lerp(-.45, -.85, ease(u)), dist = lerp(3.6, 2.5, ease(u));
      target = [HX - .05, lerp(1.2, 1.64, ease(u)), 0]; eye = [target[0] + Math.sin(a) * dist, lerp(1.1, 1.66, ease(u)), -Math.cos(a) * dist]; fov = 40;
    }
    return { t, g, h, eye, target, fov, far: 60 };
  },
  map(sc, x, y, z, sinSuelo) {
    let d = sinSuelo ? 1e9 : (y - sueloH(x, z)) * .9;
    const tr = troncos(x, y, z); if (tr < d) d = tr;
    const bg = Math.hypot(x - GX - .2, y - .9, z) - 1.4, bh = Math.hypot(x - HX, y - .95, z) - 1.05;
    d = Math.min(d, bg > .05 ? bg : dFig(sc.g, GX, .07, x, y, z), bh > .05 ? bh : dFig(sc.h, HX, .03, x, y, z));
    return d;
  },
  cielo(sc, dx, dy, dz) {
    const tt = clamp(dy * 1.8, 0, 1), c = [mix(1.5, .28, Math.pow(tt, .6)), mix(.82, .36, Math.pow(tt, .7)), mix(.42, .62, tt)];
    const s = Math.max(0, dx * SUN[0] + dy * SUN[1] + dz * SUN[2]);
    return c.map((v, k) => v + Math.pow(s, 10) * [1.2, .7, .25][k]);
  },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T, map) {
    const ds = (y - sueloH(x, z)) * .9, dt = troncos(x, y, z), dg = Math.hypot(x - GX - .2, y - .9, z) < 1.5 ? dFig(sc.g, GX, .07, x, y, z) : 9, dh = Math.hypot(x - HX, y - .95, z) < 1.1 ? dFig(sc.h, HX, .03, x, y, z) : 9;
    let alb, m = null, pelaje = 0;
    const mn = Math.min(ds, dt, dg, dh);
    if (mn === dg) {
      m = nearest(sc.g, GX, x, y, z).m; const lx = x - GX;
      const fur = .8 + .4 * n3(x * 30, y * 30, z * 30) * n3(x * 90, y * 90, z * 20);
      if (m === 'cuerpo' || m === 'brazo') { alb = [.085, .08, .075]; if (m === 'cuerpo') { const pl = sstep(.8, 1.15, y + .25 * n3(x * 6, y * 6, z * 6)) * sstep(.5, .2, Math.abs(z)) * sstep(.35, .1, lx); alb = alb.map((v, k) => mix(v, [.32, .31, .3][k], pl)); } pelaje = 1; alb = alb.map(v => v * fur); }
      else if (m === 'cabeza') { alb = [.06, .055, .05].map(v => v * fur); pelaje = 1; }
      else if (m === 'hocico' || m === 'mano') alb = [.05, .045, .045].map(v => v * (.8 + .4 * n3(x * 60, y * 60, z * 60)));
      else if (m === 'nariz') alb = [.02, .018, .018];
      else alb = [.12, .06, .02];
    } else if (mn === dh) {
      m = nearest(sc.h, HX, x, y, z).m;
      alb = m === 'piel' ? [.78, .55, .43].map(v => v * (.94 + .1 * n3(x * 40, y * 40, z * 40))) : m === 'camiseta' ? [.12, .27, .5].map(v => v * (.9 + .2 * n3(x * 120, y * 8, z * 120))) :
        m === 'pantalon' ? [.1, .12, .18] : m === 'zapato' ? [.82, .82, .8] : m === 'labio' ? [.55, .27, .25] : m === 'pelo' ? [.1, .065, .04].map(v => v * (.8 + .5 * n3(x * 80, y * 80, z * 80))) : [.05, .03, .02];
    } else if (mn === dt) {
      alb = [.2, .15, .11].map(v => v * (.6 + .8 * n3(x * 12, y * 2, z * 12)));
    } else {
      const f = fbm2(x * .4, z * .4, 4), g = n2(x * 16, z * 16);
      alb = [mix(.16, .3, f) * (.8 + .4 * g), mix(.2, .3, f) * (.8 + .4 * g), mix(.07, .1, f)];
      if (n2(x * 3, z * 3) > .72) alb = [.28, .17, .08];
    }
    const ndl = Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]);
    const sh = ndl > 0 ? sombra((a, b, c) => E.map(sc, a, b, c, true), x + nx * .05, y + ny * .05, z + nz * .05, SUN[0], SUN[1], SUN[2], 10, 18, 48) : 0;
    const sky = .5 + .5 * ny, bounce = .5 - .5 * ny;
    const sunC = [2.7, 1.7, .85], skyC = [.32, .34, .46], bC = [.2, .14, .08];
    const ao = M.oclusion(map, x, y, z, nx, ny, nz);
    const rim = Math.pow(1 - Math.max(0, -(nx * dx + ny * dy + nz * dz)), 3) * (pelaje ? .35 : .1);
    const esp = m === 'ojo' ? M.brillo('ojo', nx, ny, nz, dx, dy, dz, SUN) * sh : m === 'nariz' ? M.brillo('nariz', nx, ny, nz, dx, dy, dz, SUN) * sh : 0;
    const c = [0, 1, 2].map(k => alb[k] * (sunC[k] * ndl * sh + (skyC[k] * sky + bC[k] * bounce) * ao) + esp * sunC[k] + rim * [.9, .6, .3][k] * ao);
    const fog = 1 - Math.exp(-T * .02), fc = E.cielo(sc, dx, Math.max(dy, 0), dz).map(v => v * .7);
    return c.map((v, k) => mix(v, fc[k], fog));
  },
};
E.info = { titulo: 'Humano y gorila cara a cara (SDF)', seg: 9.5, letrero_s: 99 };
module.exports = E;
