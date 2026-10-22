/* ORIENTACION: como encontrar el norte sin brujula. Short vertical, voz Serena.
   Paisajes y objetos con las herramientas de REALISMO (VE.real); graficos explicativos dibujados por codigo y sincronizados con las palabras.
   Esquemas (palo, reloj, constelacion) son DIAGRAMAS: la geometria de la Osa Mayor/Polar usa coordenadas reales (RA/Dec) proyectadas, el resto es esquematico. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, PI = Math.PI, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const COL = { sol: '#FFD36B', rojo: '#FF4D5E', verde: '#5BE08A', cian: '#6EE7F9', crema: '#FFF4DC', blanco: '#FFFFFF', noche: '#0B1230', dorado: '#FFC23C' };

// ---------- utilidades ----------
const at = (ctx, w, fb, desde = 0) => { const p = ctx.palabra(w, desde); return p ? p.ini : fb; };
const fin = (ctx, w, fb, desde = 0) => { const p = ctx.palabra(w, desde); return p ? p.fin : fb; };

function fondo(esc, tg, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'ori', horizonte: 0.66, nubes: hora === 'noche' ? 0 : 3 }, o));
}
function velo(esc, y0, y1, a0, a1) {
  const x = esc.ctx, g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(3,8,20,${a0})`); g.addColorStop(1, `rgba(3,8,20,${a1})`);
  x.fillStyle = g; x.fillRect(0, Math.min(y0, y1), esc.W, Math.abs(y1 - y0));
}
function rotulo(esc, ctx, txt, cx, y, o = {}) {                         // texto grande con contorno que entra con rebote
  const z = ctx.zonas.cuerpo, a = o.a == null ? 1 : o.a; if (a <= 0) return 0;
  const fit = VE.texto.ajustar(esc, txt, { w: o.w || z.w, h: o.h || 260 * esc.k }, { max: o.max || T.hero, min: T.lg, maxLineas: o.lineas || 2 });
  esc.tipo(fit.tam, 700); const lh = fit.tam * esc.k * 1.1, x = esc.ctx;
  x.save(); x.globalAlpha *= Math.min(1, a * 1.6); x.translate(cx, y + fit.lineas.length * lh / 2); const s = o.sinRebote ? 1 : 0.7 + 0.3 * a; x.scale(s, s); x.rotate(o.rot || 0);
  fit.lineas.forEach((l, i) => VE.texto.trazar(esc, l, 0, (i - (fit.lineas.length - 1) / 2) * lh, { color: o.color || COL.blanco, contornoAncho: o.contorno || 11, registrar: false }));
  x.restore(); return fit.lineas.length * lh;
}
function pastilla(esc, txt, cx, cy, o = {}) {
  const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const tam = o.tam || 34; esc.tipo(tam, 700); const w = x.measureText(txt).width + (o.pad || 44) * esc.k, h = tam * esc.k * 1.75;
  x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = 0.75 + 0.25 * a; x.scale(s, s);
  VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, h / 2); x.fillStyle = o.fondo || 'rgba(8,14,32,0.82)'; x.fill(); x.lineWidth = 3 * esc.k; x.strokeStyle = o.color || COL.dorado; x.stroke();
  x.fillStyle = o.texto || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, tam * esc.k * 0.04); x.restore();
}
function sol(esc, cx, cy, r, a = 1, giro = 0) {
  const x = esc.ctx; if (a <= 0 || r <= 0) return; x.save(); x.globalAlpha *= a;
  esc.pegar(esc.cache.halo(Math.round(r * 3.4), COL.sol, 0.3), cx, cy, 0.9);
  x.translate(cx, cy); x.rotate(giro); x.strokeStyle = '#FFE08A'; x.lineWidth = r * 0.11; x.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const an = i / 12 * PI * 2, r0 = r * 1.18, r1 = r * (i % 2 ? 1.5 : 1.75); x.beginPath(); x.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); x.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); x.stroke(); }
  const g = x.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#FFFDF0'); g.addColorStop(0.6, '#FFE27A'); g.addColorStop(1, '#FFB52E'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore();
}
function luna(esc, cx, cy, r, a = 1) {
  const x = esc.ctx; if (a <= 0 || r <= 0) return; x.save(); x.globalAlpha *= a; esc.pegar(esc.cache.halo(Math.round(r * 3), '#BFD0FF', 0.3), cx, cy, 0.8);
  x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = '#EEF2FF'; x.fill(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx + r * 0.45, cy - r * 0.2, r * 0.9, 0, 7); x.fill(); x.restore();
}
function estrella(esc, cx, cy, r, a = 1, col = '#FFFFFF') { if (a <= 0 || r <= 0) return; esc.pegar(esc.cache.halo(Math.round(r * 5), col, 0.25), cx, cy, a); esc.ctx.save(); esc.ctx.globalAlpha *= a; esc.ctx.fillStyle = '#fff'; esc.ctx.beginPath(); esc.ctx.arc(cx, cy, r * 0.55, 0, 7); esc.ctx.fill(); esc.ctx.restore(); }
function flecha(esc, x0, y0, x1, y1, col, ancho, prog = 1) {
  const x = esc.ctx, px = lerp(x0, x1, prog), py = lerp(y0, y1, prog), an = Math.atan2(y1 - y0, x1 - x0); if (prog <= 0) return;
  x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(px, py); x.stroke();
  if (prog > 0.85) { const h = ancho * 3.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px - Math.cos(an - 0.45) * h, py - Math.sin(an - 0.45) * h); x.lineTo(px - Math.cos(an + 0.45) * h, py - Math.sin(an + 0.45) * h); x.closePath(); x.fill(); } x.restore();
}
function brujula(esc, cx, cy, r, ang, a = 1) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= a;
  esc.pegar(esc.cache.halo(Math.round(r * 1.5), '#000000', 0.5), cx, cy + r * 0.1, 0.55);
  let g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); g.addColorStop(0, '#FFF1B8'); g.addColorStop(0.5, '#9A7424'); g.addColorStop(1, '#F1D98C');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  g = x.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r * 0.9); g.addColorStop(0, '#16314A'); g.addColorStop(1, '#07111C'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 0.9, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 72; i++) { const an = i / 72 * PI * 2, l = i % 18 === 0 ? 0.16 : i % 6 === 0 ? 0.1 : 0.05; x.lineWidth = (i % 18 === 0 ? 4 : 2) * esc.k; x.beginPath(); x.moveTo(cx + Math.sin(an) * r * 0.86, cy - Math.cos(an) * r * 0.86); x.lineTo(cx + Math.sin(an) * r * (0.86 - l), cy - Math.cos(an) * r * (0.86 - l)); x.stroke(); }
  esc.tipo(r * 0.2 / esc.k, 700); [['N', 0, COL.rojo], ['E', 90, '#fff'], ['S', 180, '#fff'], ['O', 270, '#fff']].forEach(([l, d, c]) => { const an = d * PI / 180; x.fillStyle = c; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(l, cx + Math.sin(an) * r * 0.58, cy - Math.cos(an) * r * 0.58); });
  x.translate(cx, cy); x.rotate(ang); x.fillStyle = COL.rojo; x.beginPath(); x.moveTo(0, -r * 0.5); x.lineTo(r * 0.075, 0); x.lineTo(-r * 0.075, 0); x.closePath(); x.fill();
  x.fillStyle = '#E8EEF5'; x.beginPath(); x.moveTo(0, r * 0.5); x.lineTo(r * 0.075, 0); x.lineTo(-r * 0.075, 0); x.closePath(); x.fill();
  x.fillStyle = '#2a2a2a'; x.beginPath(); x.arc(0, 0, r * 0.05, 0, 7); x.fill(); x.restore();
  x.save(); x.globalAlpha *= a * 0.22; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - r * 0.2, cy - r * 0.5, r * 0.5, r * 0.22, -0.4, 0, 7); x.fill(); x.restore();
}

// =====================================================================
// 1. GANCHO: perdido en el monte, brujula loca
// =====================================================================
function escena1(esc, t, ctx) {
  const z = ctx.zonas.cuerpo; fondo(esc, ctx.tg, ctx, 'bosque', 'atardecer'); velo(esc, 0, esc.H * 0.5, 0.55, 0);
  const ang = t < 3.2 ? 5.5 * t + 1.1 * Math.sin(t * 7.3) + 0.7 * Math.sin(t * 13.1) : 5.5 * 3.2 + 0.5 * Math.sin(t * 5) * Math.exp(-(t - 3.2) * 0.4);
  const cy = 735, a1 = tr(t, 0.05, 0.5, E.expoSalida);
  brujula(esc, z.cx, cy + (1 - a1) * 60, 225, ang, a1);
  [-1.25, 1.2, -0.65].forEach((an, i) => { const rr = [370, 365, 330][i], ph = i * 2.1, k = tr(t, 0.3 + i * 0.25, 0.5, E.atrasSalida);
    if (k <= 0) return; esc.tipo(130 - i * 20, 700); esc.ctx.save(); esc.ctx.globalAlpha *= k; VE.texto.trazar(esc, '?', z.cx + Math.sin(an) * rr, cy - Math.cos(an) * rr * 0.9 + Math.sin(t * 2 + ph) * 12, { color: COL.dorado, contornoAncho: 10, registrar: false }); esc.ctx.restore(); });
  rotulo(esc, ctx, '¿PERDIDO EN EL MONTE?', z.cx, 250, { a: tr(t, 0.05, 0.6, E.elastico), color: '#fff', max: T.mega });
  const tc = at(ctx, 'cuatro', 2.6), k4 = tr(t, tc, 0.7, E.elastico);
  rotulo(esc, ctx, '4 TRUCOS', z.cx, 975, { a: k4, color: COL.dorado, max: 150, lineas: 1, contorno: 14 });
  rotulo(esc, ctx, 'PARA ENCONTRAR EL NORTE', z.cx, 1135, { a: tr(t, tc + 0.25, 0.7, E.elastico), color: '#fff', max: 74, lineas: 1 });
  const kd = tr(t, at(ctx, 'dia', 5.0), 0.5, E.elastico), kn = tr(t, at(ctx, 'noche', 6.0), 0.5, E.elastico);
  sol(esc, z.cx - 345, 735, 46 * kd, kd, t * 0.5); luna(esc, z.cx + 335, 735, 46 * kn, kn);
}

// =====================================================================
// 2. MITO DEL MUSGO
// =====================================================================
function tronco(esc) {
  return R.hornear(esc, 'ori-tronco', 560, 1300, (x, w, h) => {
    const r = VE.rng('tronco'), tx0 = 130, tx1 = 430, base = h - 20;
    const g = x.createLinearGradient(tx0, 0, tx1, 0); g.addColorStop(0, '#9A7A58'); g.addColorStop(0.3, '#6E5238'); g.addColorStop(0.75, '#43301F'); g.addColorStop(1, '#2A1D12');
    x.fillStyle = g; x.beginPath(); x.moveTo(tx0 - 60, base); x.bezierCurveTo(tx0 - 10, base - 80, tx0 + 6, base - 160, tx0, base - 260); x.lineTo(tx0 + 4, 20); x.lineTo(tx1 - 4, 20); x.lineTo(tx1, base - 260); x.bezierCurveTo(tx1 - 6, base - 160, tx1 + 10, base - 80, tx1 + 60, base); x.closePath(); x.fill();
    x.save(); x.clip(); for (let i = 0; i < 70; i++) { const xx = lerp(tx0 - 40, tx1 + 40, r()), y0 = r() * h, l = 80 + r() * 260; x.strokeStyle = `rgba(20,10,4,${0.15 + r() * 0.3})`; x.lineWidth = 1.5 + r() * 3; x.beginPath(); x.moveTo(xx, y0); x.bezierCurveTo(xx + 8, y0 + l * 0.3, xx - 8, y0 + l * 0.7, xx + 3, y0 + l); x.stroke(); }
    for (let i = 0; i < 30; i++) { const xx = lerp(tx0, tx0 + 120, r()), y0 = r() * h; x.strokeStyle = `rgba(255,220,170,${0.05 + r() * 0.12})`; x.lineWidth = 2 + r() * 3; x.beginPath(); x.moveTo(xx, y0); x.lineTo(xx + 2, y0 + 60 + r() * 120); x.stroke(); } x.restore();
  });
}
function musgo(esc, i, rad) {                                 // cojin de musgo: muchas motas verdes agrupadas, mas anchas que altas
  const w = Math.round(rad * 3.4), h = Math.round(rad * 2.2);
  return R.hornear(esc, 'ori-musgo' + i, w, h, (x) => {
    const r = VE.rng('mg' + i), cols = ['#9BE06A', '#6DBB45', '#4C9A38', '#2F7A2A', '#C2F08A'];
    for (let k = 0; k < 90; k++) { const an = r() * PI * 2, d = Math.sqrt(r()), px = w / 2 + Math.cos(an) * d * rad * 1.45, py = h / 2 + Math.sin(an) * d * rad * 0.85, rr = 3 + r() * 8;
      const c = cols[Math.floor(r() * cols.length)]; R.bola(x, px, py, rr, R.aclarar(c, 0.25), R.oscurecer(c, 0.25), -0.3, -0.4); }
  });
}
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx.tg, ctx, 'bosque', 'dia', { nubes: 2 }); velo(esc, 0, esc.H * 0.55, 0.45, 0.1);
  const s = tronco(esc), k = tr(t, 0.05, 0.7, E.expoSalida);
  R.pegar(esc, s, cx, 1230 + (1 - k) * 90, { ax: 0.5, ay: 1, alfa: k });
  const r = VE.rng('musgo'), parches = [];
  for (let i = 0; i < 18; i++) parches.push([lerp(-105, 105, r()), lerp(330, 1150, r()), lerp(26, 52, r()), 0.5 + i * 0.14, i]);
  parches.forEach(([dx, y, rad, t0, i]) => { const a = tr(t, t0, 0.5, E.atrasSalida); if (a <= 0) return; const sp = musgo(esc, i, rad);
    R.pegar(esc, sp, cx + dx, y + sp.h / 2, { ax: 0.5, ay: 1, alfa: Math.min(1, a * 1.5), escala: 0.4 + 0.6 * Math.min(1, a) }); });
  rotulo(esc, ctx, '¿MUSGO = NORTE?', cx, 240, { a: tr(t, 0.05, 0.6, E.elastico), color: '#fff', max: T.mega });
  const tf = at(ctx, 'fies', 4.4), ks = tr(t, tf, 0.55, E.elastico);
  if (ks > 0) { const x = esc.ctx; x.save(); x.translate(cx, 760); x.rotate(-0.17); x.scale(0.5 + 0.5 * ks, 0.5 + 0.5 * ks); x.globalAlpha *= Math.min(1, ks * 2);
    VE.ruta.redondeado(x, -330, -95, 660, 190, 26); x.fillStyle = 'rgba(160,10,25,0.9)'; x.fill(); x.lineWidth = 12 * esc.k; x.strokeStyle = '#FFE1E1'; x.stroke();
    esc.tipo(110, 700); VE.texto.trazar(esc, 'NO FIABLE', 0, 4, { color: '#fff', contornoAncho: 6, registrar: false }); x.restore(); }
  [['SOMBRA', 'sombra', '#9FB4FF', -150, 1120], ['HUMEDAD', 'humedad', '#6EE7F9', 150, 1120]].forEach(([txt, w, col, dx, y], i) => {
    pastilla(esc, txt, cx + dx, y, { a: tr(t, at(ctx, w, 7 + i * 1.3), 0.5, E.atrasSalida), color: col, tam: 36 }); });
  const th = at(ctx, 'humedad', 8.2); for (let i = 0; i < 5; i++) { const f = (t - th - i * 0.25) / 1.4; if (f < 0 || f > 1) continue; VE.trazo.dibujar(esc, 'gota', { x: cx - 240 + i * 120, y: 520 + f * 560, tam: 54, modo: 'solido', progreso: 1, alfa: Math.sin(f * PI) }); }
}

// =====================================================================
// 3. EL SOL
// =====================================================================
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, hy = 1060, W2 = 395; fondo(esc, ctx.tg, ctx, 'llanura', 'dia', { sinSol: true, nubes: 2 });
  const arco = (u) => { const an = PI * (1 - u); return [cx + Math.cos(an) * W2, hy - Math.sin(an) * 560]; };
  const t0 = at(ctx, 'sale', 2.2) - 0.2, t1 = fin(ctx, 'oeste', 5.0), u = tr(t, t0, t1 - t0, E.suave);
  const x = esc.ctx; x.save(); x.setLineDash([16, 18]); x.strokeStyle = 'rgba(255,230,150,0.55)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 60; i++) { const [px, py] = arco(i / 60 * u); i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); x.restore();
  const [sx, sy] = arco(u); sol(esc, sx, sy, 62, c01(u * 8 + 0.2), t * 0.4);
  pastilla(esc, 'MIRANDO AL SUR', cx, hy + 60, { a: tr(t, 0.9, 0.5, E.atrasSalida), color: '#fff', tam: 32 });
  pastilla(esc, 'ESTE', cx - W2, hy + 60, { a: tr(t, 0.3, 0.5, E.atrasSalida), color: '#FFD36B', tam: 38 }); pastilla(esc, 'OESTE', cx + W2, hy + 60, { a: tr(t, 0.45, 0.5, E.atrasSalida), color: '#FFD36B', tam: 38 });
  rotulo(esc, ctx, 'TRUCO 1: EL SOL', cx, 250, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const ts = at(ctx, 'solo', 8.0), td = at(ctx, 'dos', 10.0), a0 = tr(t, ts, 0.6, E.suave), a1 = tr(t, td, 0.6, E.elastico);
  [-3, -2, -1, 1, 2, 3].forEach((i) => { sol(esc, cx - W2 + i * 62, hy - 6, 20, a0 * (1 - 0.5 * a1) * 0.8); });
  if (a0 > 0 && a1 < 1) pastilla(esc, 'EL RESTO DEL AÑO', cx - W2, hy - 100, { a: a0 * (1 - a1), color: '#fff', tam: 30 });
  if (a1 > 0) { x.save(); x.globalAlpha *= a1; x.strokeStyle = COL.verde; x.lineWidth = 7; x.beginPath(); x.arc(cx - W2, hy - 6, 60 + (1 - a1) * 40, 0, 7); x.stroke(); x.restore(); sol(esc, cx - W2, hy - 6, 34, a1); }
  rotulo(esc, ctx, '2 DÍAS AL AÑO', cx, 420, { a: a1, color: COL.verde, max: T.hero, lineas: 1 });
  pastilla(esc, 'EQUINOCCIOS', cx, 540, { a: tr(t, at(ctx, 'equinoccios', 12), 0.5, E.atrasSalida), color: COL.verde, tam: 40 });
}

// =====================================================================
// 4. LA SOMBRA DE UN PALO (vista desde arriba)
// =====================================================================
function suelo(esc) {
  return R.hornear(esc, 'ori-suelo', 700, 700, (x, w, h) => {
    const r = VE.rng('suelo'); let g = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 2); g.addColorStop(0, '#6E9A4A'); g.addColorStop(0.7, '#4E7E36'); g.addColorStop(1, '#335A28');
    x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, 7); x.fillStyle = g; x.fill(); x.save(); x.clip();
    for (let i = 0; i < 1400; i++) { const an = r() * PI * 2, d = Math.sqrt(r()) * (w / 2); x.strokeStyle = r() < 0.5 ? 'rgba(160,220,110,0.35)' : 'rgba(20,50,20,0.3)'; x.lineWidth = 1.5; const px = w / 2 + Math.cos(an) * d, py = h / 2 + Math.sin(an) * d; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 8, py - 4 - r() * 9); x.stroke(); }
    for (let i = 0; i < 40; i++) { const an = r() * PI * 2, d = Math.sqrt(r()) * (w / 2 - 20); R.bola(x, w / 2 + Math.cos(an) * d, h / 2 + Math.sin(an) * d, 5 + r() * 9, '#a89a86', '#5a5148'); } x.restore();
    x.lineWidth = 12; x.strokeStyle = '#E9D9A6'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, 7); x.stroke();
  });
}
function huella(esc, cx, cy, a, lado) {                        // huella de zapato: planta (adelante) + tacon (atras)
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a); x.translate(cx, cy); x.rotate(lado * 0.06); x.fillStyle = '#F5E9D0'; x.strokeStyle = '#1a1208'; x.lineWidth = 4;
  x.beginPath(); x.ellipse(0, -16, 26, 38, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.ellipse(0, 44, 17, 22, 0, 0, 7); x.fill(); x.stroke(); x.restore();
}
function escena4(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx.tg, ctx, 'llanura', 'dia', { nubes: 2 }); velo(esc, 0, esc.H * 0.7, 0.55, 0.3);
  const PC = [cx, 700], base = [cx, 830], L = 300, an1 = -0.62, an2 = 0.62, kp = tr(t, 0.05, 0.7, E.expoSalida);
  rotulo(esc, ctx, 'TRUCO 2: LA SOMBRA DE UN PALO', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 76, lineas: 2 });
  const sp = suelo(esc); R.pegar(esc, sp, PC[0], PC[1] + 350 * kp + (1 - kp) * 80, { ax: 0.5, ay: 1, alfa: kp, escala: 0.94 });
  const tClava = at(ctx, 'clava', 1.3), tM1 = at(ctx, 'marca', 3.0), tQ = at(ctx, 'quince', 5.0), tM2 = at(ctx, 'otra', 7.0), tL = at(ctx, 'linea', 9.0);
  const kc = tr(t, tClava, 0.4, E.atrasSalida), x = esc.ctx;
  const ang = t < tQ ? an1 : t > tM2 ? an2 : lerp(an1, an2, E.suave(c01((t - tQ) / Math.max(0.5, tM2 - tQ))));
  const dist = (an) => [base[0] + Math.sin(an) * L, base[1] - Math.cos(an) * L], tip = dist(ang);
  const kb = tr(t, tClava + 0.3, 0.6, E.suave);
  if (kb > 0) { x.save(); x.globalAlpha *= 0.55 * c01(kb * 2); x.fillStyle = '#0A1408'; x.beginPath(); x.moveTo(base[0] - 12 * Math.cos(ang), base[1] - 12 * Math.sin(ang)); x.lineTo(tip[0], tip[1]); x.lineTo(base[0] + 12 * Math.cos(ang), base[1] + 12 * Math.sin(ang)); x.closePath(); x.fill(); x.restore(); }
  const dm = (p, n, a, col) => { if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = col; x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(p[0], p[1], 24 * (0.6 + 0.4 * Math.min(1, a)), 0, 7); x.fill(); x.stroke(); esc.tipo(30, 700); VE.texto.trazar(esc, n, p[0], p[1] + 1, { color: '#fff', contornoAncho: 4, registrar: false }); x.restore(); };
  dm(dist(an1), '1', tr(t, tM1, 0.4, E.elastico), COL.rojo); dm(dist(an2), '2', tr(t, tM2, 0.4, E.elastico), COL.verde);
  if (kc > 0) { x.save(); x.globalAlpha *= Math.min(1, kc); esc.pegar(esc.cache.halo(48, '#000', 0.4), base[0] + 6, base[1] + 6, 0.6); const g = x.createRadialGradient(base[0] - 4, base[1] - 5, 2, base[0], base[1], 17); g.addColorStop(0, '#E9C79A'); g.addColorStop(1, '#6B4A2B'); x.fillStyle = g; x.beginPath(); x.arc(base[0], base[1], 15 * (0.4 + 0.6 * Math.min(1, kc)), 0, 7); x.fill(); x.restore(); }
  const kq = tr(t, tQ - 0.1, 0.5, E.atrasSalida) * (1 - tr(t, tM2 + 0.4, 0.4, E.suave)); if (kq > 0) { const rx = cx + 290, ry = 1085; x.save(); x.globalAlpha *= Math.min(1, kq); x.fillStyle = '#0B1424'; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(rx, ry, 58, 0, 7); x.fill(); x.stroke(); x.strokeStyle = COL.dorado; x.lineWidth = 8; x.lineCap = 'round'; const aa = c01((t - tQ) / Math.max(0.5, tM2 - tQ)) * PI * 2; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx + Math.sin(aa) * 42, ry - Math.cos(aa) * 42); x.stroke(); esc.tipo(34, 700); VE.texto.trazar(esc, '15 MIN', rx, ry + 92, { color: '#fff', contornoAncho: 6, registrar: false }); x.restore(); }
  const kl = tr(t, tL, 0.7, E.suave), p1 = dist(an1), p2 = dist(an2);
  if (kl > 0) { x.save(); x.strokeStyle = COL.dorado; x.lineWidth = 7; x.setLineDash([22, 14]); x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(lerp(p1[0], p2[0], kl), p1[1]); x.stroke(); x.restore(); }
  pastilla(esc, 'OESTE', p1[0] - 6, p1[1] - 62, { a: tr(t, tL + 0.3, 0.5, E.atrasSalida), color: COL.rojo, tam: 32 }); pastilla(esc, 'ESTE', p2[0] + 6, p2[1] - 62, { a: tr(t, tL + 0.5, 0.5, E.atrasSalida), color: COL.verde, tam: 32 });
  const tI = at(ctx, 'izquierdo', 12), tD = at(ctx, 'derecho', 13.4), tN = at(ctx, 'norte', 15);
  huella(esc, p1[0], p1[1] + 70, tr(t, tI, 0.4, E.atrasSalida), -1); huella(esc, p2[0], p2[1] + 70, tr(t, tD, 0.4, E.atrasSalida), 1);
  const mid = [(p1[0] + p2[0]) / 2, p1[1] + 150]; flecha(esc, mid[0], mid[1], mid[0], 395, COL.rojo, 14, tr(t, tN, 0.7, E.suave));
  pastilla(esc, 'NORTE', mid[0], 345, { a: tr(t, tN + 0.5, 0.5, E.elastico), color: COL.rojo, tam: 46, fondo: 'rgba(120,10,20,0.9)' });
}

// =====================================================================
// 5. EL RELOJ
// =====================================================================
function reloj(esc, cx, cy, r, rot, hora, a, resaltar1) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a); esc.pegar(esc.cache.halo(Math.round(r * 1.5), '#000', 0.5), cx, cy + r * 0.1, 0.6);
  x.translate(cx, cy); x.rotate(rot);
  let g = x.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#F3F3F3'); g.addColorStop(0.5, '#8E959C'); g.addColorStop(1, '#E4E6E8'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill();
  g = x.createRadialGradient(0, -r * 0.25, r * 0.1, 0, 0, r * 0.9); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#D9DEE3'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.9, 0, 7); x.fill();
  x.strokeStyle = '#222'; for (let i = 0; i < 60; i++) { const an = i / 60 * PI * 2, l = i % 5 === 0 ? 0.1 : 0.04; x.lineWidth = (i % 5 === 0 ? 5 : 2) * esc.k; x.beginPath(); x.moveTo(Math.sin(an) * r * 0.84, -Math.cos(an) * r * 0.84); x.lineTo(Math.sin(an) * r * (0.84 - l), -Math.cos(an) * r * (0.84 - l)); x.stroke(); }
  esc.tipo(r * 0.2 / esc.k, 700); [12, 3, 6, 9, 1].forEach(n => { const an = n * PI / 6, dd = r * 0.64; x.save(); x.translate(Math.sin(an) * dd, -Math.cos(an) * dd); x.rotate(-rot); x.fillStyle = (n === 1) ? '#E8641A' : '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; if (n !== 1 || resaltar1 > 0) x.fillText(String(n), 0, 0); x.restore(); });
  if (resaltar1 > 0) { const an = PI / 6; x.save(); x.strokeStyle = '#E8641A'; x.globalAlpha *= resaltar1; x.lineWidth = 6; x.beginPath(); x.arc(Math.sin(an) * r * 0.64, -Math.cos(an) * r * 0.64, r * 0.13, 0, 7); x.stroke(); x.restore(); }
  const mano = (ang, len, ancho, col) => { x.save(); x.rotate(ang); x.fillStyle = col; x.beginPath(); x.moveTo(-ancho, 0); x.lineTo(0, -len); x.lineTo(ancho, 0); x.lineTo(0, r * 0.12); x.closePath(); x.fill(); x.restore(); };
  mano(hora * PI / 6, r * 0.5, r * 0.055, '#111'); mano(PI * 2 * ((hora * 60) % 60) / 60, r * 0.76, r * 0.035, '#333'); x.fillStyle = '#B3262E'; x.beginPath(); x.arc(0, 0, r * 0.05, 0, 7); x.fill(); x.restore();
}
function escena5(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, cy = 760, r = 230; fondo(esc, ctx.tg, ctx, 'montanas', 'dia', { sinSol: true, nubes: 2 }); velo(esc, 0, esc.H * 0.7, 0.5, 0.25);
  rotulo(esc, ctx, 'TRUCO 3: TU RELOJ', cx, 235, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.hero, lineas: 1 });
  const ang = 70 * PI / 180, hora = 70 / 30, kr = tr(t, 0.2, 0.7, E.expoSalida), tA = at(ctx, 'apunta', 3.2), tS = at(ctx, 'sol', 3.8, 0.5);
  const rot = -1.4 * (1 - E.suave(c01((t - tA) / 1.4)));
  const ksol = tr(t, Math.max(0.6, tS - 0.2), 0.5, E.elastico), sx = cx + Math.sin(ang) * 380, sy = cy - Math.cos(ang) * 380;
  sol(esc, sx, sy, 44 * Math.min(1, ksol), Math.min(1, ksol), t * 0.5);
  const verano = tr(t, at(ctx, 'verano', 99), 0.7, E.suave); reloj(esc, cx, cy, r, rot, hora, kr, verano);
  const tM = at(ctx, 'medio', 6.2), km = tr(t, tM, 0.7, E.suave), bis = lerp(ang / 2, (ang + PI / 6) / 2, verano);
  if (km > 0) { const x = esc.ctx; x.save(); x.strokeStyle = COL.rojo; x.setLineDash([18, 14]); x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(bis) * 330 * km, cy - Math.cos(bis) * 330 * km); x.stroke(); x.restore(); }
  pastilla(esc, 'SUR', cx + Math.sin(bis) * 420, cy - Math.cos(bis) * 420, { a: tr(t, at(ctx, 'sur', 7.4), 0.5, E.elastico), color: COL.rojo, tam: 54, fondo: 'rgba(120,10,20,0.92)' });
  pastilla(esc, 'HORARIO DE VERANO: USA LA 1', cx, 1070, { a: verano, color: '#E8641A', tam: 32 });
  pastilla(esc, 'SOLO HEMISFERIO NORTE', cx, 1160, { a: tr(t, at(ctx, 'hemisferio', 99), 0.5, E.atrasSalida), color: COL.cian, tam: 32 });
}

// =====================================================================
// 6. DE NOCHE: LA POLAR (coordenadas reales proyectadas)
// =====================================================================
const ESTR = { dubhe: [11.0622, 61.75], merak: [11.0306, 56.38], phecda: [11.8972, 53.69], megrez: [12.2572, 57.03], alioth: [12.9006, 55.96], mizar: [13.3989, 54.92], alkaid: [13.7922, 49.31], polaris: [2.53, 89.26] };
let CARTA = null;
function carta(cx) {
  if (CARTA && CARTA.cx === cx) return CARTA;
  const P = {}, proj = ([ra, dec]) => { const th = ra * 15 * PI / 180, rr = 90 - dec; return [rr * Math.cos(th), -rr * Math.sin(th)]; };
  for (const k in ESTR) P[k] = proj(ESTR[k]);
  const ux = P.polaris[0] - P.dubhe[0], uy = P.polaris[1] - P.dubhe[1], rot = Math.atan2(-0.83, -0.55) - Math.atan2(uy, ux), cs = Math.cos(rot), sn = Math.sin(rot);
  for (const k in P) { const [a, b] = P[k]; P[k] = [a * cs - b * sn, a * sn + b * cs]; }
  const xs = Object.values(P).map(p => p[0]), ys = Object.values(P).map(p => p[1]), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys), s = Math.min(800 / bw, 620 / bh);
  const ox = cx + 40 - (Math.max(...xs) + Math.min(...xs)) / 2 * s, oy = 390 - Math.min(...ys) * s;
  for (const k in P) P[k] = [P[k][0] * s + ox, P[k][1] * s + oy];
  return (CARTA = { cx, P });
}
function escena6(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx.tg, ctx, 'montanas', 'noche', { nubes: 0, sinSol: true }); const { P } = carta(cx), x = esc.ctx;
  const tw = (i) => 0.8 + 0.2 * Math.sin(ctx.tg * 3 + i * 1.7);
  rotulo(esc, ctx, 'DE NOCHE: LA POLAR', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: '#CFE0FF', max: T.hero, lineas: 1 });
  const tO = at(ctx, 'osa', 3.0), kO = tr(t, tO, 0.8, E.suave), orden = ['dubhe', 'merak', 'phecda', 'megrez', 'alioth', 'mizar', 'alkaid'];
  orden.forEach((k, i) => estrella(esc, P[k][0], P[k][1], 20, tr(t, 0.2 + i * 0.12, 0.4, E.suave) * tw(i), '#BFD8FF'));
  if (kO > 0) { x.save(); x.strokeStyle = 'rgba(150,200,255,0.85)'; x.lineWidth = 5; x.lineCap = 'round'; x.globalAlpha *= kO; x.beginPath(); ['dubhe', 'merak', 'phecda', 'megrez', 'dubhe'].forEach((k, i) => i ? x.lineTo(P[k][0], P[k][1]) : x.moveTo(P[k][0], P[k][1])); x.stroke(); x.beginPath(); ['megrez', 'alioth', 'mizar', 'alkaid'].forEach((k, i) => i ? x.lineTo(P[k][0], P[k][1]) : x.moveTo(P[k][0], P[k][1])); x.stroke(); x.restore(); }
  pastilla(esc, 'OSA MAYOR', (P.phecda[0] + P.alioth[0]) / 2, Math.max(P.phecda[1], P.alkaid[1]) + 90, { a: kO, color: '#9FC4FF', tam: 34 });
  const u = [P.dubhe[0] - P.merak[0], P.dubhe[1] - P.merak[1]], ul = Math.hypot(u[0], u[1]), d = [u[0] / ul, u[1] / ul], tC = at(ctx, 'cinco', 5.4), kp = tr(t, tC - 0.4, 0.8, E.suave);
  if (kp > 0) { x.save(); x.strokeStyle = COL.dorado; x.lineWidth = 5; x.setLineDash([14, 12]); x.globalAlpha *= 0.9; x.beginPath(); x.moveTo(P.merak[0], P.merak[1]); x.lineTo(lerp(P.merak[0], P.polaris[0], kp), lerp(P.merak[1], P.polaris[1], kp)); x.stroke(); x.restore(); }
  for (let i = 1; i <= 5; i++) { const a = tr(t, tC + (i - 1) * 0.33, 0.35, E.elastico); if (a <= 0) continue; const px = P.dubhe[0] + d[0] * ul * i, py = P.dubhe[1] + d[1] * ul * i;
    x.save(); x.globalAlpha *= Math.min(1, a * 2); x.fillStyle = 'rgba(8,14,32,0.9)'; x.strokeStyle = COL.dorado; x.lineWidth = 4; x.beginPath(); x.arc(px + 36, py, 20 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); esc.tipo(26, 700); VE.texto.trazar(esc, String(i), px + 36, py + 1, { color: '#fff', contornoAncho: 3, registrar: false }); x.restore(); }
  const tA = at(ctx, 'ahi', 8.2), kA = tr(t, tA, 0.6, E.elastico);
  if (kA > 0) { estrella(esc, P.polaris[0], P.polaris[1], 26 * Math.min(1, kA), 1, '#FFE08A'); x.save(); x.globalAlpha *= Math.min(1, kA); x.strokeStyle = '#FFE08A'; x.lineWidth = 4; x.beginPath(); x.arc(P.polaris[0], P.polaris[1], 52 * Math.min(1, kA), 0, 7); x.stroke(); x.restore(); pastilla(esc, 'POLAR', P.polaris[0] + 175, P.polaris[1] - 38, { a: kA, color: '#FFE08A', tam: 38 });
    flecha(esc, P.polaris[0], P.polaris[1] + 70, P.polaris[0], 1010, COL.rojo, 12, tr(t, tA + 0.4, 0.9, E.suave)); pastilla(esc, 'NORTE', P.polaris[0], 1060, { a: tr(t, tA + 1.1, 0.5, E.elastico), color: COL.rojo, tam: 46, fondo: 'rgba(120,10,20,0.92)' }); }
  pastilla(esc, 'NO ES LA MÁS BRILLANTE', cx, 905, { a: tr(t, at(ctx, 'brillante', 13) - 0.4, 0.5, E.atrasSalida), color: '#fff', tam: 32 });
}

// =====================================================================
// 7. DATO LOCO: altura de la Polar = latitud
// =====================================================================
function escena7(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx.tg, ctx, 'llanura', 'noche', { nubes: 0, horizonte: 0.7, sinSol: true });
  rotulo(esc, ctx, 'DATO LOCO', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  rotulo(esc, ctx, 'ALTURA DE LA POLAR = TU LATITUD', cx, 340, { a: tr(t, at(ctx, 'altura', 0.8), 0.6, E.elastico), color: '#fff', max: 70, lineas: 2, h: 220 });
  const ox = cx - 250, oy = 1010, hx = ox + 8, hy = oy - 175, grados = 40, an = grados * PI / 180, L = 520;
  x.save(); x.translate(ox, oy); x.scale(1.5, 1.5); x.translate(-ox, -oy); x.fillStyle = '#34417A'; x.strokeStyle = '#B9CCFF'; x.lineWidth = 2.5; x.beginPath(); x.arc(ox, oy - 118, 16, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(ox - 22, oy); x.lineTo(ox - 13, oy - 98); x.lineTo(ox + 13, oy - 98); x.lineTo(ox + 22, oy); x.closePath(); x.fill(); x.stroke(); x.restore();
  const kl = tr(t, at(ctx, 'altura', 1.2), 1.0, E.suave), ex = hx + Math.cos(an) * L, ey = hy - Math.sin(an) * L;
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 4; x.setLineDash([12, 12]); x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + 520, hy); x.stroke(); x.restore();
  if (kl > 0) { x.save(); x.strokeStyle = '#FFE08A'; x.lineWidth = 6; x.beginPath(); x.moveTo(hx, hy); x.lineTo(lerp(hx, ex, kl), lerp(hy, ey, kl)); x.stroke(); x.restore(); }
  estrella(esc, ex, ey, 24, tr(t, at(ctx, 'altura', 1.2) + 0.7, 0.5, E.elastico), '#FFE08A');
  const kg = tr(t, at(ctx, 'latitud', 3.0), 0.7, E.suave); if (kg > 0) { x.save(); x.strokeStyle = COL.cian; x.lineWidth = 7; x.beginPath(); x.arc(hx, hy, 190, -an * kg, 0); x.stroke(); x.restore(); }
  const kn = tr(t, at(ctx, 'cuarenta', 6.0), 0.5, E.elastico); if (kn > 0) { esc.tipo(96 * (0.5 + 0.5 * Math.min(1, kn)), 700); VE.texto.trazar(esc, '≈ 40°', hx + 320, hy - 90, { color: COL.cian, contornoAncho: 12, registrar: false }); }
  pastilla(esc, 'MADRID · 40° N', cx, 1190, { a: tr(t, at(ctx, 'madrid', 4.6), 0.5, E.atrasSalida), color: COL.cian, tam: 36 });
}

// =====================================================================
// 8. CIERRE + LETRERO
// =====================================================================
function escena8(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx.tg, ctx, 'lago', 'alba', { nubes: 2 }); velo(esc, 0, esc.H * 0.75, 0.5, 0.35);
  const tS = at(ctx, 'sigue', ctx.dur - 3.2), kS = tr(t, tS - 0.15, 0.8, E.elastico), atenua = 1 - 0.72 * c01(kS * 2);
  const kb = tr(t, 0.1, 0.8, E.expoSalida), ang = 0.35 * Math.exp(-t * 1.6) * Math.sin(t * 9);
  x.save(); x.globalAlpha *= atenua; brujula(esc, cx, 600, 200, ang, kb);
  rotulo(esc, ctx, '¿CON CUÁL TE QUEDAS?', cx, 230, { a: tr(t, 0.1, 0.6, E.elastico), color: '#fff', max: T.hero });
  const tiles = [['1', 'sol'], ['2', 'palo'], ['3', 'reloj'], ['4', 'polar']], w0 = 165, gap = 16, x0 = cx - (4 * w0 + 3 * gap) / 2 + w0 / 2;
  tiles.forEach(([n, ic], i) => { const a = tr(t, 0.9 + i * 0.22, 0.45, E.atrasSalida), px = x0 + i * (w0 + gap), py = 930; if (a <= 0) return; const am = Math.min(1, a); x.save(); x.globalAlpha *= am; x.translate(px, py); x.scale(0.7 + 0.3 * am, 0.7 + 0.3 * am);
    VE.ruta.redondeado(x, -w0 / 2, -w0 / 2, w0, w0, 28); x.fillStyle = 'rgba(8,14,32,0.82)'; x.fill(); x.lineWidth = 4; x.strokeStyle = COL.dorado; x.stroke();
    if (ic === 'sol') sol(esc, 0, -6, 24, 1); else if (ic === 'palo') { x.fillStyle = '#3d6a2c'; x.beginPath(); x.arc(0, -4, 48, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.moveTo(-6, 6); x.lineTo(-30, -38); x.lineTo(-14, -42); x.closePath(); x.fill(); x.fillStyle = '#E9C79A'; x.beginPath(); x.arc(0, 6, 8, 0, 7); x.fill(); }
    else if (ic === 'reloj') { x.fillStyle = '#EDEFF2'; x.beginPath(); x.arc(0, -4, 46, 0, 7); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -4); x.lineTo(26, -28); x.moveTo(0, -4); x.lineTo(-6, -42); x.stroke(); }
    else { estrella(esc, 0, -4, 17, 1, '#FFE08A'); }
    esc.tipo(38, 700); VE.texto.trazar(esc, n, 0, 56, { color: COL.dorado, contornoAncho: 6, registrar: false }); x.restore(); });
  x.restore();
  pastilla(esc, 'GUARDA ESTE VÍDEO', cx, 1090, { a: tr(t, at(ctx, 'guarda', 99), 0.5, E.atrasSalida) * atenua, color: COL.cian, tam: 36 });
  if (kS > 0) { x.save(); x.translate(cx, 700); const s = 0.6 + 0.4 * Math.min(1.1, kS) + 0.025 * Math.sin(t * 4); x.scale(s, s); x.globalAlpha *= Math.min(1, kS * 1.8);
    esc.pegar(esc.cache.halo(520, COL.dorado, 0.25), 0, 0, 0.9 + 0.1 * Math.sin(t * 3));
    VE.ruta.redondeado(x, -400, -200, 800, 400, 60); const g = x.createLinearGradient(-400, -200, 400, 200); g.addColorStop(0, '#1B2A5E'); g.addColorStop(1, '#0A1030'); x.fillStyle = g; x.fill(); x.lineWidth = 12; x.strokeStyle = COL.dorado; x.stroke();
    esc.tipo(86, 700); VE.texto.trazar(esc, 'SIGUE A', 0, -78, { color: '#fff', contornoAncho: 10, registrar: false });
    const f = VE.texto.ajustar(esc, '@randonautico', { w: 700, h: 120 }, { max: 100, min: 50, maxLineas: 1 }); esc.tipo(f.tam, 700); VE.texto.trazar(esc, '@randonautico', 0, 62, { color: COL.dorado, contornoAncho: 11, registrar: false }); x.restore(); }
}

VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 74 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: [escena1, escena2, escena3, escena4, escena5, escena6, escena7, escena8]
});
