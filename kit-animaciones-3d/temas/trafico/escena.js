/* TEMA TRÁFICO (estilo 4 · Low-poly, de noche) con gráficos de infografía anclados al 3D.
   Ciudad de bloques con ventanas encendidas, parques y río; autopista de 3 carriles por sentido con tráfico que se vuelve atasco;
   coche protagonista con pulsos, etiquetas de velocidad y hora, regla de distancia y carretera de color según el tráfico.
   node bin/estilo.cjs trafico_1|trafico_2|trafico_3 salida --stills 0 --extra temas/trafico/escena.js
   Las cifras en pantalla son ilustrativas. Mundo en metros: x a lo ancho, y arriba, la autopista va hacia -z. */
(function () {
  const TR = globalThis.TRAF = {};
  const R = rng(7), PAL = [[226, 232, 240], [214, 70, 70], [240, 186, 60], [80, 150, 235], [150, 110, 220], [60, 190, 170], [235, 235, 238], [60, 66, 80]];
  const CARRIL = [2.1, 5.6, 9.1], ATASCO = -150, VEL = 30;           // carriles en nuestro sentido (x), inicio del atasco (z), velocidad del protagonista (m/s)
  // tráfico: posiciones fijas en z con densidad que sube en el atasco; velocidad baja dentro
  const COCHES = []; for (const [sent, xs] of [[1, CARRIL], [-1, CARRIL.map(v => -v)]]) for (const x of xs) { let z = 60;
    while (z > -560) { const atasco = sent === 1 && z < ATASCO; z -= atasco ? 6.4 + R() * 1.6 : 22 + R() * 30; COCHES.push({ x, z0: z, sent, atasco, col: PAL[Math.floor(R() * PAL.length)], v: atasco ? 2 + R() * 2 : 26 + R() * 8 }); } }
  TR.heroe = t => [CARRIL[1], 0, -20 - VEL * t];
  const posCoche = (c, t) => [c.x, 0, c.z0 - c.sent * c.v * t];
  function coche(F, p, sent, col, heroe) { const [x, , z] = p, d = sent, L = 2.25, A = .95;
    box(F, x - A, .25, z - L, x + A, .95, z + L, col, { side: jit(col, .8) }); box(F, x - .8, .95, z - 1.2 + d * -.1, x + .8, 1.55, z + 1.0 + d * -.1, jit(col, .92), { side: [40, 60, 90] });
    for (const sx of [-.6, .6]) { F.push({ p: [[x + sx - .22, .55, z - d * L - .01 * d], [x + sx + .22, .55, z - d * L - .01 * d], [x + sx + .22, .75, z - d * L - .01 * d], [x + sx - .22, .75, z - d * L - .01 * d]], col: [255, 248, 220], emit: true, two: true, zb: -.05 });
      F.push({ p: [[x + sx - .22, .55, z + d * L + .01 * d], [x + sx + .22, .55, z + d * L + .01 * d], [x + sx + .22, .72, z + d * L + .01 * d], [x + sx - .22, .72, z + d * L + .01 * d]], col: [255, 40, 50], emit: true, two: true, zb: -.05 }); }
    if (heroe) box(F, x - .5, 1.55, z - .5, x + .5, 1.62, z + .5, [70, 160, 255], { f: { emit: true } }); }
  // ciudad: manzanas a ambos lados de la autopista, río a la izquierda y parques
  const EDIF = [], SUELO = [], R2 = rng(11);
  for (let zb = 40; zb > -560; zb -= 34) for (const lado of [-1, 1]) for (let k = 0; k < 6; k++) {
    const x0 = lado * (16 + k * 34), z0 = zb, rio = lado < 0 && k === 2, parque = !rio && R2() < .12;
    SUELO.push({ x0, z0, rio, parque });
    if (rio || parque) continue;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const w = 11 + R2() * 4, dd = 11 + R2() * 4, h = 6 + Math.pow(R2(), 2) * (k < 2 ? 34 : 22), bx = x0 + lado * (2 + i * 15), bz = z0 - 2 - j * 15;
      EDIF.push({ x0: Math.min(bx, bx + lado * w), x1: Math.max(bx, bx + lado * w), z0: bz - dd, z1: bz, h, col: jit([[44, 54, 92], [52, 48, 96], [38, 60, 96], [60, 56, 104]][Math.floor(R2() * 4)], .9 + .2 * R2()), s: R2() * 1000 }); } }
  function ciudad(F, conVentanas) {
    for (const s of SUELO) { const c = s.rio ? [16, 38, 78] : s.parque ? [34, 92, 58] : [30, 36, 58], x0 = Math.min(s.x0, s.x0 + Math.sign(s.x0) * 32), x1 = Math.max(s.x0, s.x0 + Math.sign(s.x0) * 32);
      F.push({ p: [[x0, 0, s.z0], [x1, 0, s.z0], [x1, 0, s.z0 - 32], [x0, 0, s.z0 - 32]], col: c, two: true, zb: .5 });
      if (s.parque) for (let k = 0; k < 6; k++) { const tx = x0 + 4 + hash3(k, s.z0, 1) * 24, tz = s.z0 - 4 - hash3(k, s.z0, 2) * 24; box(F, tx - 1.2, 0, tz - 1.2, tx + 1.2, 3 + hash3(k, s.z0, 3) * 2, tz + 1.2, [40, 120, 70]); } }
    for (const e of EDIF) { box(F, e.x0, 0, e.z0, e.x1, e.h, e.z1, e.col, { top: jit(e.col, 1.35), side: e.col });
      if (!conVentanas) continue;
      const fil = Math.floor((e.h - 2) / 3.2), lado = (e.x0 + e.x1) / 2 > 0 ? -1 : 1, xf = lado < 0 ? e.x0 - .02 : e.x1 + .02;
      for (let f = 0; f < fil; f++) for (let c = 0; c < Math.floor((e.z1 - e.z0 - 1) / 2.6); c++) { if (hash3(e.s, f, c) > .42) continue; const y = 2 + f * 3.2, z = e.z1 - 1.2 - c * 2.6, cal = hash3(c, f, e.s) > .2;
        F.push({ p: [[xf, y, z], [xf, y, z - 1.3], [xf, y + 1.5, z - 1.3], [xf, y + 1.5, z]], col: cal ? [255, 206, 120] : [140, 210, 255], emit: true, two: true, zb: -.08 }); }
      for (let f = 0; f < fil; f++) for (let c = 0; c < Math.floor((e.x1 - e.x0 - 1) / 2.6); c++) { if (hash3(e.s + 5, f, c) > .4) continue; const y = 2 + f * 3.2, x = e.x0 + 1.2 + c * 2.6;
        F.push({ p: [[x, y, e.z1 + .02], [x + 1.3, y, e.z1 + .02], [x + 1.3, y + 1.5, e.z1 + .02], [x, y + 1.5, e.z1 + .02]], col: hash3(c, f, e.s + 9) > .2 ? [255, 206, 120] : [140, 210, 255], emit: true, two: true, zb: -.08 }); } } }
  function autopista(F) { for (let z = 60; z > -600; z -= 10) { F.push({ p: [[-11.5, .02, z], [11.5, .02, z], [11.5, .02, z - 10], [-11.5, .02, z - 10]], col: [44, 48, 66], two: true, zb: .3 });
      box(F, -.4, .02, z - 10, .4, .6, z, [90, 96, 120]); for (const s of [-1, 1]) box(F, s * 11.5 - .3, .02, z - 10, s * 11.5 + .3, .8, z, [80, 86, 110]);
      for (const x of [3.85, 7.35, -3.85, -7.35]) if (Math.floor(-z / 10) % 2 === 0) F.push({ p: [[x - .1, .03, z], [x + .1, .03, z], [x + .1, .03, z - 5], [x - .1, .03, z - 5]], col: [200, 205, 220], emit: true, two: true, zb: .1 }); } }
  // banda de color del tráfico sobre nuestros carriles: verde (fluido) → rojo (atasco)
  function banda(F, z0, z1) { for (let z = z0; z > z1; z -= 4) { const k = clamp((ATASCO + 30 - z) / 60), col = mixc([60, 230, 140], [255, 60, 70], k);
      F.push({ p: [[.9, .06, z], [10.4, .06, z], [10.4, .06, z - 4], [.9, .06, z - 4]], col, emit: true, two: true }); } }
  function escena(ctx, cam, t, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04060f'); g.addColorStop(.35, '#0c1230'); g.addColorStop(.6, '#1a1d44'); g.addColorStop(1, '#0b0f24'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const L = { light: norm([-.3, .9, .4]), amb: .55, lightCol: [.55, .6, .85], ambCol: [.45, .5, .85], seam: .8, fog: { col: [14, 18, 44], near: o.near || 80, far: o.far || 520, max: .9 } };
    const S = []; ciudad(S, false); autopista(S); render(ctx, cam, S.filter(f => f.zb >= .1 || f.p[0][1] === 0), L);
    if (o.banda !== false) { const B = []; banda(B, 40, -560); ctx.globalAlpha = .42; render(ctx, cam, B, { ...L, fog: { ...L.fog, max: .6 } }); ctx.globalAlpha = 1; }
    const F = []; for (const e of EDIF) { const lado = (e.x0 + e.x1) / 2; if (Math.abs(lado) < 90) {} } ciudad(F, true); const sinSuelo = F.filter(f => !(f.zb === .5));
    const C = []; for (const c of COCHES) coche(C, posCoche(c, t), c.sent, c.col); coche(C, TR.heroe(t), 1, [235, 240, 248], true);
    render(ctx, cam, [...sinSuelo, ...C], L);
    // farolas: halos aditivos
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let z = 40; z > -560; z -= 30) for (const x of [-11.5, 11.5]) { const q = cam.P([x, 9, z]); if (q[2] < 1) continue; const r = 900 / q[2];
      const h = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); h.addColorStop(0, 'rgba(255,210,150,.5)'); h.addColorStop(1, 'rgba(255,210,150,0)'); ctx.fillStyle = h; ctx.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); } ctx.restore(); }
  // ------------------------------------------------ gráficos anclados al 3D (estilo infografía)
  const pastilla = (ctx, x, y, txt, o = {}) => { ctx.save(); ctx.font = `${o.peso || 700} ${o.tam || 40}px "DejaVu Sans", sans-serif`; const w = ctx.measureText(txt).width + (o.pad || 28), h = (o.tam || 40) * 1.55;
    ctx.fillStyle = o.fondo || 'rgba(8,12,30,.85)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.strokeStyle = o.borde || 'rgba(120,200,255,.8)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = o.color || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 2); ctx.restore(); };
  const anillo = (ctx, cam, c, r, t, col = '80,190,255') => { for (let k = 0; k < 3; k++) { const f = ((t * .8 + k / 3) % 1), rr = r * (.4 + f * 1.4); ctx.strokeStyle = `rgba(${col},${(1 - f) * .9})`; ctx.lineWidth = 4; ctx.beginPath();
      for (let a = 0; a <= 48; a++) { const q = cam.P([c[0] + Math.cos(a / 48 * 6.283) * rr, .1, c[2] + Math.sin(a / 48 * 6.283) * rr]); a ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); } };
  const punto = (ctx, q, col = '#5ec8ff') => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 46); g.addColorStop(0, 'rgba(94,200,255,.9)'); g.addColorStop(1, 'rgba(94,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(q[0] - 46, q[1] - 46, 92, 92); ctx.restore();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0], q[1], 13, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); };
  const regla = (ctx, a, b, txt, lado = 1) => { const dx = 60 * lado; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0] + dx, a[1]); ctx.lineTo(b[0] + dx, b[1]); for (const p of [a, b]) { ctx.moveTo(p[0] + dx - 14, p[1]); ctx.lineTo(p[0] + dx + 14, p[1]); } ctx.stroke();
    ctx.font = 'bold 36px "DejaVu Sans", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = lado > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.fillText(txt, (a[0] + b[0]) / 2 + dx + 24 * lado, (a[1] + b[1]) / 2); };
  // ------------------------------------------------ tres planos de prueba
  ESC.trafico_1 = (ctx, t = 0) => {   // vista aérea: ciudad de noche, autopista verde → roja y velocidades
    const h = TR.heroe(t), cam = camera([h[0] - 30, 140, h[2] + 85], [h[0] - 2, 0, h[2] - 95], { fov: 50 }); escena(ctx, cam, t, { near: 140, far: 560 });
    anillo(ctx, cam, h, 9, t); punto(ctx, cam.P([h[0], 2, h[2]]));
    const vis = COCHES.filter(c => c.sent === 1).map(c => [c, posCoche(c, t)]).filter(([c, p]) => p[2] < h[2] - 25 && p[2] > -330);
    for (const [i, z] of [[0, h[2] - 50], [1, -175], [2, -250]]) { const best = vis.reduce((m, v) => Math.abs(v[1][2] - z) < Math.abs(m[1][2] - z) ? v : m), q = cam.P([best[1][0], 2.5, best[1][2]]);
      punto(ctx, q, best[0].atasco ? '#ff5a66' : '#3fe08f'); pastilla(ctx, q[0] + 120, q[1] - 50, `${Math.round(best[0].v * 3.6)} km/h`, { tam: 34, borde: best[0].atasco ? 'rgba(255,90,100,.9)' : 'rgba(63,224,143,.9)' }); }
    pastilla(ctx, cam.P([h[0], 2, h[2]])[0] - 190, cam.P([h[0], 2, h[2]])[1] - 40, `${VEL * 3.6} km/h`, { tam: 40 }); };
  ESC.trafico_2 = (ctx, t = 0) => {   // seguimiento: el coche protagonista, dos marcas de hora y la distancia recorrida
    const h = TR.heroe(t), cam = camera([h[0] - 3, 15, h[2] + 22], [h[0] + .5, 0, h[2] - 18], { fov: 48 }); escena(ctx, cam, t, { near: 40, far: 260 });
    anillo(ctx, cam, h, 4.5, t); const a = cam.P([h[0], 1.8, h[2]]), b = cam.P([h[0], 1.8, h[2] - 30]); punto(ctx, a); punto(ctx, b);
    ctx.strokeStyle = 'rgba(94,200,255,.8)'; ctx.setLineDash([14, 12]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    regla(ctx, a, b, '30 m', 1); pastilla(ctx, a[0] - 210, a[1], '8:14:21', { tam: 34, peso: 600 }); pastilla(ctx, b[0] - 190, b[1], '8:14:22', { tam: 34, peso: 600 });
    pastilla(ctx, W / 2 - 150, (a[1] + b[1]) / 2, '108 km/h', { tam: 54 }); };
  ESC.trafico_3 = (ctx, t = 0) => {   // cenital sobre el atasco: coches pegados, banda roja y distancia entre parachoques
    const zc = -205, cam = camera([2, 120, zc + .01], [2, 0, zc], { fov: 40, up: [0, 0, -1] }); escena(ctx, cam, t, { near: 110, far: 400 });
    const fila = COCHES.filter(c => c.sent === 1 && c.x === CARRIL[1]).map(c => posCoche(c, t)).filter(p => Math.abs(p[2] - zc) < 25).sort((p, q) => q[2] - p[2]);
    if (fila.length > 2) { const c1 = fila[1], c2 = fila[2]; anillo(ctx, cam, c1, 4, t, '255,90,100'); punto(ctx, cam.P([c1[0], 2, c1[2]]), '#ff5a66');
      const a = cam.P([c1[0], 1, c1[2] - 2.25]), b = cam.P([c2[0], 1, c2[2] + 2.25]); regla(ctx, a, b, `${Math.round(c1[2] - 2.25 - c2[2] - 2.25)} m`, 1);
      pastilla(ctx, cam.P(c1)[0] - 230, cam.P(c1)[1], `${Math.round(COCHES.find(c => c.x === CARRIL[1] && Math.abs(posCoche(c, t)[2] - c1[2]) < .01).v * 3.6)} km/h`, { tam: 36, borde: 'rgba(255,90,100,.9)' }); } };
})();
