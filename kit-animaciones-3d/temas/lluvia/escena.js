'use strict';
// LLUVIA · CGI de estilo animación (SDF / ray marching): una persona estilizada (cara lisa, abrigo largo, paraguas de papel rojo)
// pasea a un husky por una calle de noche con farolillos y paneles de madera iluminados, bajo la lluvia, con suelo mojado y ondas en los charcos.
// node bin/fotograma_sdf.cjs temas/lluvia/escena.js salida.png <t>      (vídeo: node bin/sdf.cjs temas/lluvia/escena.js salida.mp4 --seg 6)
const M = require('../../sdf/motor');
const { sdEll, sdRC, smin, n3, clamp, mix } = M, len = Math.hypot, fract = x => x - Math.floor(x);
const h1 = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const smax = (a, b, k) => -smin(-a, -b, k);
const sdBox = (x, y, z, bx, by, bz) => { const qx = Math.abs(x) - bx, qy = Math.abs(y) - by, qz = Math.abs(z) - bz; return len(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0); };
const cap = (px, py, pz, a, b, r) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], h = clamp(((px - a[0]) * bx + (py - a[1]) * by + (pz - a[2]) * bz) / (bx * bx + by * by + bz * bz), 0, 1); return len(px - a[0] - bx * h, py - a[1] - by * h, pz - a[2] - bz * h) - r; };
M.ESPECIES.husky = { ...M.ESPECIES.zorro, gait: M.PASO, freq: 1.55, amp: .55, bob: .015, bl: .3, bh: .17, bw: .14, L1: .25, L2: .27, lr: .038, tx: -.04, ty: .3, tw: .03, tr: .075, colaBase: 1.05, colaPunta: .75, el: .1, er: .045, orejaPunta: .22, nr: .08, sl: .11, sd: .036, hl: .13, hh: .095, hw: .095 };
const V = .9;   // velocidad del paseo (m/s)
let S = null;
// ------------------------------------------------ persona estilizada (mira hacia +x)
function persona(x, y, z, t) {
  const px = S.px, w = t * 2 * Math.PI * .85, lx = x - px, az = Math.abs(z); let d = 1e9, p = 'abrigo';
  const pega = (dd, pp, k) => { if (k ? dd < d + k * .3 : dd < d) p = pp; d = k ? smin(d, dd, k) : Math.min(d, dd); };
  // piernas: medias oscuras y botas altas (se ven por debajo del abrigo)
  for (const sd of [1, -1]) { const f = w + (sd > 0 ? 0 : Math.PI), a = Math.sin(f) * .34, lev = Math.max(0, Math.cos(f)) * .07, hip = [0, .84, sd * .08], rod = [Math.sin(a) * .4, .84 - Math.cos(a) * .4 + lev * .3, sd * .08], ank = [rod[0] + Math.sin(a - .25 - lev * 2) * .38, .08 + lev, sd * .08];
    pega(cap(lx, y, z, hip, rod, .062), 'medias', .02); pega(cap(lx, y, z, rod, ank, .05), 'medias', .015);
    const bota = Math.min(cap(lx, y, z, [rod[0] + (ank[0] - rod[0]) * .25, rod[1] + (ank[1] - rod[1]) * .25, sd * .08], ank, .058), sdEll(lx - ank[0] - .07, y - ank[1] + .035, z - sd * .08, .12, .05, .055)); pega(bota, 'bota', .015); }
  // abrigo: hombros, cintura marcada con cinturón y falda acampanada que acaba en la rodilla (con dobladillo); se abre un poco por delante al andar
  const vaiven = .035 * Math.sin(w * 2), torso = smin(sdEll(lx, y - 1.27, z, .13, .2, .2), sdEll(lx - .01, y - 1.08, z, .11, .1, .15), .08);
  const falda = Math.max(sdRC(lx, y, z, .0, 1.02, 0, .03 + vaiven, .58, 0, .15, .31), .555 - y), dobladillo = Math.max(len(Math.max(0, len(lx - .03 - vaiven, z) - .29), y - .585) - .025, .555 - y - .01);
  let abrigo = smin(torso, falda, .06); abrigo = smin(abrigo, dobladillo, .02); abrigo = smax(abrigo, -sdBox(lx - .3, y - .8, z, .1, .26, .012), .01);   // abertura delantera
  pega(abrigo, 'abrigo', .02);
  const cint = Math.max(len(lx / 1.15, z / 1.38) - .13, Math.abs(y - 1.02) - .028); if (cint < d + .005) p = 'cinturon'; d = Math.min(d, cint);
  const hebilla = sdBox(lx - .14, y - 1.02, z, .008, .025, .03); if (hebilla < d) { d = hebilla; p = 'hebilla'; }
  for (let k = 0; k < 3; k++) { const b = len(lx - .145, y - (1.3 - k * .1), z - .03) - .014; if (b < d) { d = b; p = 'boton'; } }
  // mangas con puño: derecha sujeta el paraguas (lado lejano), izquierda la correa (lado cercano)
  const brazos = [[[.0, 1.4, -.2], [.18, 1.18, -.21], [.27, 1.3, -.12], 'paraguas'], [[.0, 1.4, .2], [.1, 1.13, .24], [.32, .98, .2], 'correa']];
  for (const [h, c, m] of brazos) { pega(cap(lx, y, z, h, c, .062), 'abrigo', .045); pega(cap(lx, y, z, c, [c[0] + (m[0] - c[0]) * .8, c[1] + (m[1] - c[1]) * .8, c[2] + (m[2] - c[2]) * .8], .054), 'abrigo', .02);
    const puno = cap(lx, y, z, [c[0] + (m[0] - c[0]) * .72, c[1] + (m[1] - c[1]) * .72, c[2] + (m[2] - c[2]) * .72], [c[0] + (m[0] - c[0]) * .84, c[1] + (m[1] - c[1]) * .84, c[2] + (m[2] - c[2]) * .84], .062); if (puno < d + .005) p = 'puno'; d = Math.min(d, puno);
    pega(len(lx - m[0], y - m[1], z - m[2]) - .043, 'piel', .015); }
  // cuello alto del abrigo, cuello, cabeza lisa y pelo negro con flequillo y melena
  const solapa = Math.max(sdEll(lx - .02, y - 1.47, z, .12, .07, .14), -sdEll(lx - .02, y - 1.48, z, .07, .09, .08)); if (solapa < d + .005) p = 'solapa'; d = smin(d, solapa, .01);
  pega(cap(lx, y, z, [.02, 1.44, 0], [.03, 1.55, 0], .048), 'piel', .02);
  pega(sdEll(lx - .04, y - 1.66, z, .1, .122, .098), 'piel', .02);
  let pelo = sdEll(lx + .005, y - 1.7, z, .114, .125, .112); pelo = smax(pelo, (lx - .075) + (1.73 - y) * .55, .025); pelo = smin(pelo, sdEll(lx + .03, y - 1.57, z, .1, .1, .116), .04); pelo = smax(pelo, -(y - 1.49), .02);
  pelo = smin(pelo, sdEll(lx + .1, y - 1.72, z, .055, .055, .05), .03);   // moño
  if (pelo < d + .004) p = 'pelo'; d = smin(d, pelo, .01);
  // paraguas japonés: cono de papel con varillas, mástil y puño
  const manoD = brazos[0][2], ux = lx - .22, uy = y - 2.0, ur = len(ux, z);
  const lona = Math.max(Math.abs(ur * .3 + uy - .045) - .008, ur - .72); if (lona < d) { d = lona; p = 'paraguas'; }
  const mastil = cap(lx, y, z, [manoD[0] - .02, manoD[1] - .1, manoD[2] + .02], [.22, 2.08, 0], .014); if (mastil < d) { d = mastil; p = 'mastil'; }
  const varillas = Math.max(Math.abs(Math.sin(Math.atan2(z, ux) * 12)) * ur - .01, Math.abs(ur * .3 + uy - .025 + ur * .12) - .008, ur - .7, .12 - ur); if (varillas < d) { d = varillas; p = 'mastil'; }
  return [d, p];
}
// ------------------------------------------------ calle
function calle(x, y, z) { let d = y, m = 'suelo'; const c = (dd, mm) => { if (dd < d) { d = dd; m = mm; } };
  c(z + 2.4, 'pared');                                                       // fachada
  const cx = ((x % 3.2) + 3.2) % 3.2 - 1.6; c(sdBox(cx, y - 1.45, z + 2.32, 1.25, .95, .08), 'panel');   // paneles de madera y papel iluminados
  c(sdBox(cx - 1.6, y - 1.5, z + 2.25, .09, 1.5, .12), 'poste'); c(sdBox(cx, y - 2.62, z + 2.2, 1.7, .08, .18), 'viga');
  const lx = ((x - 1.6) % 6.4 + 6.4) % 6.4 - 3.2; c(sdEll(lx, y - 2.32, z + 1.75, .17, .24, .17), 'farolillo'); c(cap(lx, y, z, [0, 2.56, -1.75], [0, 2.75, -2.05], .012), 'poste');
  c(sdBox(0, y - .07, z + 1.9, 1e6, .07, .5), 'acera');
  return [d, m]; }
function escena(x, y, z, lejos) { let [d, m] = calle(x, y, z); const c = (dd, mm) => { if (dd < d) { d = dd; m = mm; } };
  { const db = len(x - S.px - .1, y - 1.2, z) - 1.4; c(db > .2 ? db : persona(x, y, z, S.t)[0] * .85, 'persona'); }
  { const a = S.perro, db = len(x - a.bx, y - a.by, z - a.bz) - a.br; c(db > .2 ? db : M.sdAnimal(a, x, y, z), 'perro'); }
  c(len(len(x - S.collar[0] - .02, y - S.collar[1] - .03) - .1, z - S.collar[2]) - .02, 'correa');
  c(cap(x, y, z, S.mano, S.medio, .008), 'correa'); c(cap(x, y, z, S.medio, S.collar, .008), 'correa');
  return [d, m]; }
function prepara(t) { const px = V * t - .2, perro = M.cuadrupedo('husky', px + 1.42, .42, t, .6, 1.08, { v: V });
  const cabP = perro.P.find(q => q.m === 'cabeza'), collar = [cabP.cx - .2, cabP.cy - .14, .42], mano = [px + .32, .96, .2]; const medio = [(mano[0] + collar[0]) / 2, Math.min(mano[1], collar[1]) - .1, (mano[2] + collar[2]) / 2];
  S = { t, px, perro, collar, mano, medio };
  return { t, eye: [px + .78, 1.25, 6.9], target: [px + .78, 1.0, 0], fov: 40, far: 40, pasos: 280 }; }
// ------------------------------------------------ luz, lluvia y ondas
const FAROLES = t => { const r = []; const b = Math.round((S.px - 1.6) / 6.4); for (let k = b - 2; k <= b + 2; k++) r.push([1.6 + k * 6.4, 2.32, -1.75]); return r; };
function lluvia(dx, dy, dz, t, T) { let s = 0; const az = Math.atan2(dx, -dz), el = Math.atan2(dy, len(dx, dz));
  for (const [k, dens, br, prof] of [[260, .45, .5, 1], [150, .35, .35, 3], [90, .25, .25, 7]]) { if (T < prof) continue; const u = az * k, col = Math.floor(u), hh = h1(col * 7.3 + k), f = fract(el * 3.2 + hh * 13 + t * (2.2 + hh * 1.5) * (k / 150));
    if (hh < dens && Math.abs(u - col - .5) < .12 && f < .07) s += br * (1 - f / .07); }
  return s; }
function ondas(x, z, t) { let r = 0; const cx = Math.floor(x / .7), cz = Math.floor(z / .7);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = cx + i, b = cz + j, hh = h1(a * 17.1 + b * 3.7), ox = (a + .2 + .6 * h1(a + b * 9)) * .7, oz = (b + .2 + .6 * h1(a * 5 + b)) * .7, edad = fract(t * .8 + hh), rr = len(x - ox, z - oz) - edad * .45;
    r += Math.sin(rr * 90) * Math.exp(-rr * rr / .0015) * (1 - edad); }
  for (const p of S.pasos) { const e = t - p[2]; if (e < 0 || e > 1.6) continue; const rr = len(x - p[0], z - p[1]) - e * .5; r += 1.6 * Math.sin(rr * 60) * Math.exp(-rr * rr / .004) * (1 - e / 1.6); }
  return r; }
function cieloC(dx, dy, dz) { const k = clamp(dy * 2 + .3, 0, 1); return [mix(.05, .01, k), mix(.08, .02, k), mix(.1, .04, k)]; }
const E = {
  info: { seg: 6 },
  prepara(t) { const sc = prepara(t); S.pasos = []; for (let k = -4; k <= 0; k++) { const tp = Math.floor(t * 1.7) / 1.7 + k / 1.7; if (tp < 0) continue; S.pasos.push([V * tp - .2 + .25, (k % 2 ? .09 : -.09), tp]); } return sc; },
  map(sc, x, y, z) { return escena(x, y, z)[0]; },
  cielo(sc, dx, dy, dz) { const c = cieloC(dx, dy, dz), l = lluvia(dx, dy, dz, sc.t, 99); return c.map((v, i) => v + l * [.4, .55, .7][i]); },
  shade(sc, x, y, z, nx, ny, nz, dx, dy, dz, T) {
    const [, m] = escena(x, y, z); let alb = [.5, .5, .5], spec = .1, rough = 20, emit = [0, 0, 0], refl = 0, n = [nx, ny, nz], sss = 0;
    if (m === 'persona') { const p = persona(x, y, z, S.t)[1];
      if (p === 'abrigo') { alb = [.06, .3, .52]; spec = .35; rough = 30; const e = .004, f = (aa, bb, cc) => Math.sin(bb * 260 + n3(aa * 20, bb * 20, cc * 20) * 3) * .5; n = n.map((v, i) => v - (i === 1 ? 0 : 0)); }
      else if (p === 'solapa' || p === 'puno') { alb = [.04, .2, .38]; spec = .3; rough = 30; }
      else if (p === 'cinturon') { alb = [.04, .03, .03]; spec = .8; rough = 60; } else if (p === 'hebilla' || p === 'boton') { alb = [.85, .65, .3]; spec = 2.5; rough = 200; }
      else if (p === 'medias') { alb = [.04, .05, .08]; spec = .4; rough = 30; } else if (p === 'bota') { alb = [.03, .025, .025]; spec = 1.6; rough = 90; }
      else if (p === 'piel') { alb = [.82, .62, .5]; sss = 1; spec = .2; } else if (p === 'pelo') { alb = [.015, .015, .02]; spec = .9; rough = 50; }
      else if (p === 'paraguas') { const ang = Math.atan2(z, x - S.px - .22), costilla = Math.abs(Math.sin(ang * 12)) > .97; alb = costilla ? [.45, .02, .02] : [.95, .06, .04]; emit = [.32, .015, .01]; spec = .3; rough = 25; }
      else if (p === 'mastil') { alb = [.25, .14, .07]; spec = .4; rough = 40; } }
    else if (m === 'perro') { const a = S.perro, q = M.primCercana(a, x, y, z), ly = y - a.oy, c = a.cab; let blanco = false;
      if (q.m === 'hocico' || q.m === 'zarpa' || q.m === 'pata' || q.m === 'patab') blanco = q.m !== 'pata' || y < a.oy * .55; else if (q.m === 'cabeza') blanco = y < q.cy - .01 || (x > q.cx + .02 && y < q.cy + .04); else if (q.m === 'cuerpo' || q.m === 'cuello') blanco = ly < -.05; else if (q.m === 'cola') blanco = y < q.cy - .02;
      alb = blanco ? [1, 1, 1] : [.26, .28, .32]; if (q.m === 'oreja') alb = [.22, .23, .27]; if (q.m === 'nariz') { alb = [.02, .02, .02]; spec = 1.5; rough = 100; } if (q.m === 'ojo') { alb = [.25, .55, .85]; spec = 3; rough = 300; }
      alb = alb.map(v => v * M.pelo(x - a.ox, y, z - a.oz)); }
    else if (m === 'correa') { alb = [.7, .06, .05]; spec = .4; }
    else if (m === 'suelo' || m === 'acera') { const piedra = m === 'acera', g = n3(x * 3, 0, z * 3); alb = piedra ? [.12, .12, .13] : [.06, .065, .075]; alb = alb.map(v => v * (.8 + .4 * g));
      const charco = clamp((n3(x * .6 + 3, 0, z * .9) - .45) * 5, 0, 1); refl = piedra ? .15 : .25 + .55 * charco; spec = 1; rough = 120;
      const e = .01, o0 = ondas(x, z, S.t), gx = (ondas(x + e, z, S.t) - o0) / e, gz = (ondas(x, z + e, S.t) - o0) / e; n = [n[0] - gx * .0025, n[1], n[2] - gz * .0025]; const nl = len(...n); n = n.map(v => v / nl);
      emit = [0, 0, 0].map((v, i) => [.02, .5, .8][i] * clamp(Math.abs(o0) * .3, 0, 1) * (.45 + charco)); }
    else if (m === 'pared') { alb = [.06, .07, .09]; }
    else if (m === 'panel') { const cx = ((x % 3.2) + 3.2) % 3.2 - 1.6, gx = fract(cx / .28), gy = fract((y - .5) / .3), marco = gx < .1 || gy < .1; alb = marco ? [.12, .07, .04] : [.9, .62, .35]; emit = marco ? [0, 0, 0] : [1.25, .55, .16].map(v => v * (.7 + .3 * n3(x, y, 1))); }
    else if (m === 'poste' || m === 'viga') { alb = [.09, .055, .04]; spec = .2; }
    else if (m === 'farolillo') { alb = [1, .35, .1]; emit = [2.8, .75, .12]; }
    // luces: farolillos (cálidos, con sombra suave del más cercano), paneles (cálidos), luna azul y ambiente
    const [Nx, Ny, Nz] = n, mapa = (a, b, cc) => escena(a, b, cc)[0], ao = M.oclusion(mapa, x, y, z, Nx, Ny, Nz); let c = [0, 0, 0];
    const amb = [.03, .1, .17]; for (let i = 0; i < 3; i++) c[i] += alb[i] * amb[i] * (.5 + .5 * Ny) * ao;
    const luces = [...FAROLES().map(p => ({ p, col: [1.5, .62, .2], I: 1 })), { p: [S.px + .5, 1.4, -2.1], col: [.9, .55, .25], I: .8 }, { p: [S.px + 1.2, 2.2, 4.5], col: [.3, .38, .5], I: .9 }, { dir: [-.45, .75, -.5], col: [.15, .45, .8] }];
    for (const l of luces) { let lx, ly, lz, at = 1; if (l.dir) { const q = len(...l.dir); [lx, ly, lz] = l.dir.map(v => v / q); } else { lx = l.p[0] - x; ly = l.p[1] - y; lz = l.p[2] - z; const d2 = lx * lx + ly * ly + lz * lz, dd = Math.sqrt(d2); lx /= dd; ly /= dd; lz /= dd; at = l.I * 2.2 / (1 + d2 * .9); if (at < .01) continue; }
      const ndl = Nx * lx + Ny * ly + Nz * lz, w = sss ? Math.max(0, (ndl + .4) / 1.4) : Math.max(0, ndl); if (w <= 0) continue; const sh = l.dir ? 1 : M.sombra(mapa, x + Nx * .01, y + Ny * .01, z + Nz * .01, lx, ly, lz, 10, 4, 30);
      const hx = lx - dx, hy = ly - dy, hz = lz - dz, hl = len(hx, hy, hz), sp = Math.pow(Math.max(0, (Nx * hx + Ny * hy + Nz * hz) / hl), rough) * spec;
      for (let i = 0; i < 3; i++) c[i] += (alb[i] * w + sp) * l.col[i] * at * sh; }
    for (let i = 0; i < 3; i++) c[i] += emit[i];
    // reflejo del suelo mojado
    if (refl > .02) { const rd = dx * Nx + dy * Ny + dz * Nz, rx = dx - 2 * rd * Nx, ry = dy - 2 * rd * Ny, rz = dz - 2 * rd * Nz, fr = Math.pow(1 - Math.max(0, -rd), 4), kr = refl * (.4 + .6 * fr);
      let tt = .03, hit = false; for (let i = 0; i < 90; i++) { const dd = mapa(x + rx * tt, y + .002 + ry * tt, z + rz * tt); if (dd < .002 * tt) { hit = true; break; } tt += dd * .9; if (tt > 25) break; }
      let rc = cieloC(rx, ry, rz); if (hit) { const qx = x + rx * tt, qy = y + ry * tt, qz = z + rz * tt, [, m2] = escena(qx, qy, qz); rc = m2 === 'farolillo' ? [2.2, .7, .18] : m2 === 'panel' ? [.8, .45, .2] : m2 === 'persona' ? (persona(qx, qy, qz, S.t)[1] === 'paraguas' ? [.35, .03, .02] : [.02, .03, .05]) : m2 === 'perro' ? [.12, .12, .14] : [.02, .025, .035]; }
      for (let i = 0; i < 3; i++) c[i] = c[i] * (1 - kr * .5) + rc[i] * kr; }
    // halo de los farolillos, bruma y lluvia
    for (const p of FAROLES()) { const vx = p[0] - sc.eye[0], vy = p[1] - sc.eye[1], vz = p[2] - sc.eye[2], tt = vx * dx + vy * dy + vz * dz; if (tt < 0 || tt > T + .2) continue; const qx = vx - dx * tt, qy = vy - dy * tt, qz = vz - dz * tt, d2 = (qx * qx + qy * qy + qz * qz);
      const g = .5 / (1 + d2 * 40) + .25 * Math.exp(-d2 * 6); c[0] += g * 1.2; c[1] += g * .45; c[2] += g * .12; }
    const f = 1 - Math.exp(-T * .04); c = c.map((v, i) => v + ([.03, .09, .15][i] - v) * f);
    const l = lluvia(dx, dy, dz, sc.t, T); c = c.map((v, i) => v + l * [.5, .7, .85][i]);
    const Y = c[0] * .3 + c[1] * .59 + c[2] * .11; return c.map(v => Math.max(0, Y + (v - Y) * 1.45)); },   // colores más vivos
};
module.exports = E;
