/* PSOE: que propone de cara al 29N (decretos y promesas publicas). Short vertical, voz Carmen (ElevenLabs).
   Sin logos ni colores de partido: estilo informativo neutral. Diagramas dibujados por codigo, sincronizados con las palabras.
   Todo dato esta en datos.md con su fuente. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, PI = Math.PI, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const S = VE.short, COL = S.COL, at = S.en, velo = S.velo;
// separacion entre letras: sin ella la fuente funde "VI"/"IV" (VIVIENDA se leia "VMIENDA")
const sp = (esc, px, fn) => { const x = esc.ctx; x.letterSpacing = px + 'px'; x.fontKerning = 'none'; try { return fn(); } finally { x.letterSpacing = '0px'; x.fontKerning = 'auto'; } };
const rotulo = (esc, ctx, ...a) => sp(esc, 6 * esc.k, () => S.rotulo(esc, ctx, ...a));
const pastilla = (esc, ...a) => sp(esc, 3 * esc.k, () => S.pastilla(esc, ...a));
const NAVY = 'rgba(8,14,32,0.86)';

function fondo(esc, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'psoe', horizonte: 0.68, nubes: 3 }, o));
}
function tarjeta(esc, cx, cy, w, h, a, o = {}) {                         // panel redondeado oscuro con borde
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = 0.8 + 0.2 * Math.min(1, a); x.scale(s, s);
  VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, o.r || 34); x.fillStyle = o.fondo || NAVY; x.fill(); x.lineWidth = 5 * esc.k; x.strokeStyle = o.borde || COL.dorado; x.stroke(); x.restore();
}
function texto(esc, txt, cx, cy, tam, color, a = 1, contorno = 8) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a * 1.6); esc.tipo(tam, 700); x.letterSpacing = (3 * esc.k) + 'px'; x.fontKerning = 'none'; VE.texto.trazar(esc, txt, cx, cy, { color, contornoAncho: contorno, registrar: false }); x.restore();
}
function moneda(esc, px, py, r, a = 1) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= a; const g = x.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r);
  g.addColorStop(0, '#FFF2B0'); g.addColorStop(0.6, '#FFC23C'); g.addColorStop(1, '#B77A10'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  x.strokeStyle = '#8A5A08'; x.lineWidth = r * 0.1; x.beginPath(); x.arc(px, py, r * 0.72, 0, 7); x.stroke(); esc.tipo(r * 0.9 / esc.k, 700); x.fillStyle = '#7A4E06'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('€', px, py + r * 0.04); x.restore();
}
function check(esc, px, py, r, a) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = COL.verde; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  x.strokeStyle = '#06361A'; x.lineWidth = r * 0.22; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(px - r * 0.45, py); x.lineTo(px - r * 0.1, py + r * 0.35); x.lineTo(px + r * 0.5, py - r * 0.35); x.stroke(); x.restore();
}
function aspa(esc, px, py, r, a) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = COL.rojo; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = r * 0.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(px - r * 0.38, py - r * 0.38); x.lineTo(px + r * 0.38, py + r * 0.38); x.moveTo(px + r * 0.38, py - r * 0.38); x.lineTo(px - r * 0.38, py + r * 0.38); x.stroke(); x.restore();
}
function calendario(esc, cx, cy, w, h, mes, dia, sub, a) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = 0.7 + 0.3 * Math.min(1, a); x.scale(s, s);
  esc.pegar(esc.cache.halo(Math.round(w * 0.9), '#000000', 0.45), 0, h * 0.06, 0.6);
  VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, 36); x.fillStyle = '#F8F6EE'; x.fill();
  x.save(); VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, 36); x.clip(); x.fillStyle = COL.dorado; x.fillRect(-w / 2, -h / 2, w, h * 0.24); x.restore();
  esc.tipo(h * 0.11 / esc.k, 700); x.fillStyle = '#1A1A2E'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(mes, 0, -h * 0.38);
  esc.tipo(h * 0.46 / esc.k, 700); x.fillStyle = '#16213E'; x.fillText(dia, 0, h * 0.06);
  esc.tipo(h * 0.075 / esc.k, 700); x.fillStyle = '#3A3F5C'; x.fillText(sub, 0, h * 0.38); x.restore();
}
function urna(esc, cx, cy, w, t, t0) {                                   // urna con papeleta que cae por la ranura
  const x = esc.ctx, h = w * 0.78; x.save(); x.translate(cx, cy); esc.pegar(esc.cache.halo(Math.round(w * 0.8), '#000000', 0.5), 0, h * 0.5, 0.6);
  const p = c01((t - t0) / 1.0), py = lerp(-h * 1.1, h * 0.02, E.suave(p));
  if (p < 1) { x.save(); x.beginPath(); x.rect(-w, -h * 1.4, w * 2, h * 1.4 + h * 0.02); x.clip(); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#222'; x.lineWidth = 3; VE.ruta.redondeado(x, -w * 0.17, py - h * 0.28, w * 0.34, h * 0.44, 6); x.fill(); x.stroke(); x.restore(); }
  const g = x.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#3C5AA0'); g.addColorStop(0.5, '#5A7FD0'); g.addColorStop(1, '#2B427E');
  VE.ruta.redondeado(x, -w / 2, 0, w, h, 22); x.fillStyle = g; x.fill(); x.lineWidth = 5; x.strokeStyle = '#DCE6FF'; x.stroke();
  VE.ruta.redondeado(x, -w * 0.22, h * 0.08, w * 0.44, h * 0.07, 6); x.fillStyle = '#0A1030'; x.fill(); x.restore();
}
function jarra(esc, cx, cy, w, h, nivel, t) {                              // hucha: tarro de cristal que se llena de monedas
  const x = esc.ctx; x.save(); x.translate(cx, cy); esc.pegar(esc.cache.halo(Math.round(w * 0.9), '#000000', 0.45), 0, h * 0.55, 0.5);
  const jx = -w / 2, jy = -h / 2; x.save(); VE.ruta.redondeado(x, jx, jy, w, h, 40); x.clip(); x.fillStyle = 'rgba(190,225,255,0.18)'; x.fillRect(jx, jy, w, h);
  const top = jy + h * (1 - nivel), g = x.createLinearGradient(0, top, 0, jy + h); g.addColorStop(0, '#FFE27A'); g.addColorStop(1, '#C98A14'); x.fillStyle = g;
  x.beginPath(); x.moveTo(jx, top); for (let i = 0; i <= 24; i++) x.lineTo(jx + w * i / 24, top + Math.sin(i * 0.9 + t * 3) * 6 * (nivel > 0.02 ? 1 : 0)); x.lineTo(jx + w, jy + h); x.lineTo(jx, jy + h); x.closePath(); x.fill();
  const r = VE.rng('jarra'); for (let i = 0; i < 46; i++) { const mx = jx + 30 + r() * (w - 60), my = jy + h - 28 - r() * h * nivel * 0.95; if (my > top + 18) moneda(esc, mx, my, 22 + r() * 6, 0.9); } x.restore();
  VE.ruta.redondeado(x, jx, jy, w, h, 40); x.lineWidth = 8; x.strokeStyle = 'rgba(220,240,255,0.85)'; x.stroke();
  VE.ruta.redondeado(x, jx + w * 0.12, jy - 44, w * 0.76, 52, 16); x.fillStyle = '#8FA3C7'; x.fill(); x.lineWidth = 5; x.strokeStyle = '#DCE6FF'; x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.3)'; VE.ruta.redondeado(x, jx + 22, jy + 40, 18, h * 0.6, 9); x.fill(); x.restore();
}
function escudo(esc, cx, cy, tam, a) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = tam / 200 * (0.7 + 0.3 * Math.min(1, a)); x.scale(s, s);
  esc.pegar(esc.cache.halo(260, '#6EE7F9', 0.3), 0, 0, 0.6);
  x.beginPath(); x.moveTo(0, -130); x.bezierCurveTo(60, -100, 100, -100, 110, -90); x.lineTo(110, -10); x.bezierCurveTo(110, 70, 55, 115, 0, 140); x.bezierCurveTo(-55, 115, -110, 70, -110, -10); x.lineTo(-110, -90); x.bezierCurveTo(-100, -100, -60, -100, 0, -130); x.closePath();
  const g = x.createLinearGradient(-110, -130, 110, 140); g.addColorStop(0, '#6EE7F9'); g.addColorStop(1, '#2A6FD0'); x.fillStyle = g; x.fill(); x.lineWidth = 9; x.strokeStyle = '#FFFFFF'; x.stroke(); x.restore();
}

// ============================ 1. GANCHO ============================
function escena1(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.6, 0.55, 0.1);
  const kc = tr(t, at(ctx, 'veintinueve', 0.3) - 0.1, 0.8, E.elastico); calendario(esc, cx, 760, 520, 500, 'NOVIEMBRE', '29', 'ELECCIONES GENERALES', kc);
  urna(esc, cx, 1050, 300, t, at(ctx, 'vota', 3.2));
  rotulo(esc, ctx, '¿QUÉ PROPONE EL PSOE?', cx, 205, { a: tr(t, at(ctx, 'propone', 4.6) - 0.1, 0.7, E.elastico), color: '#fff', max: T.mega, lineas: 2 });
}

// ============================ 2. CONTEXTO: CALENDARIO ============================
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.35);
  rotulo(esc, ctx, 'EL CALENDARIO', cx, 205, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const lx = cx - 330, y0 = 440, y1 = 1130, tA = at(ctx, 'cinco', 3.3), tB = at(ctx, 'trece', 5.8), tC = at(ctx, 'veintisiete', 7.4), tD = tC + 0.9;
  const prog = tr(t, 0.3, tD + 0.3, E.suave) * 0 + c01((t - 0.4) / (tD + 0.2));
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, y1); x.stroke();
  x.strokeStyle = COL.dorado; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, lerp(y0, y1, prog)); x.stroke(); x.restore();
  const nodos = [[y0 + 40, '5 OCT', 'DISOLUCIÓN DE LAS CORTES', tA, COL.rojo], [y0 + 340, '13 – 27 NOV', 'CAMPAÑA ELECTORAL', tB, COL.cian], [y1 - 40, '29 NOV', 'VOTACIÓN', tD, COL.verde]];
  nodos.forEach(([y, f, d, tt, c]) => { const a = tr(t, tt, 0.5, E.elastico); if (a <= 0) return;
    x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = c; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(lx, y, 26 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); x.restore();
    tarjeta(esc, lx + 470, y, 700, 170, a, { borde: c }); texto(esc, f, lx + 470, y - 36, 58, c, a, 6); texto(esc, d, lx + 470, y + 38, 36, '#fff', a, 4); });
}

// ============================ 3. OJO: ALCANCE ============================
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'montanas', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'OJO', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 230, lineas: 1 });
  const filas = [['DECRETOS', at(ctx, 'decretos', 1.6), true], ['PROMESAS PÚBLICAS', at(ctx, 'promesas', 2.5), true], ['NO ES UN PROGRAMA COMPLETO', at(ctx, 'no', 3.5), false]];
  filas.forEach(([tx, tt, ok], i) => { const y = 600 + i * 190, a = tr(t, tt, 0.5, E.atrasSalida); tarjeta(esc, cx, y, 860, 150, a, { borde: ok ? COL.verde : COL.rojo });
    (ok ? check : aspa)(esc, cx - 350, y, 40 * Math.min(1, a), a); texto(esc, tx, cx + 55, y + 2, tx.length > 18 ? 36 : 52, '#fff', a, 5); });
}

// ============================ 4. PENSIONES ============================
function escena4(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'costa', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'PENSIONES', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'ZARAGOZA · 14 OCT', cx, 375, { a: tr(t, at(ctx, 'zaragoza', 5.2), 0.5, E.atrasSalida), color: COL.cian, tam: 38 });
  const tc = at(ctx, 'cuatro', 8.0), base = 790, w = 120, gap = 40, x0 = cx - (4 * w + 3 * gap) / 2;
  for (let i = 0; i < 4; i++) { const a = tr(t, tc + 0.5 + i * 0.5, 0.5, E.elastico); if (a <= 0) continue; const h = (60 + i * 50) * Math.min(1, a), px = x0 + i * (w + gap);
    const g = x.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, '#7FF0B4'); g.addColorStop(1, '#2AA564'); x.fillStyle = g; VE.ruta.redondeado(x, px, base - h, w, h, 14); x.fill(); x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke(); texto(esc, 'AÑO ' + (i + 1), px + w / 2, base + 34, 28, '#fff', a, 4); }
  pastilla(esc, '4 AÑOS MÁS · SEGÚN IPC', cx, 480, { a: tr(t, tc, 0.5, E.elastico), color: COL.verde, tam: 40 });
  const to = at(ctx, 'objetivo', 12.4), tv = at(ctx, 'veinte', 13.8), kj = tr(t, to - 0.2, 0.7, E.expoSalida);
  if (kj > 0) { tarjeta(esc, cx, 1050, 640, 380, kj, { fondo: 'rgba(8,14,32,0.7)' });
    jarra(esc, cx - 140, 1060, 190, 250, c01((t - tv) / 2.6) * 0.9, t); pastilla(esc, 'OBJETIVO', cx + 175, 970, { a: tr(t, to, 0.5, E.atrasSalida), color: COL.dorado, tam: 36 });
    texto(esc, '20.000', cx + 175, 1060, 80, COL.dorado, tr(t, tv, 0.5, E.elastico), 10); texto(esc, 'MILLONES €', cx + 175, 1140, 40, '#fff', tr(t, tv + 0.3, 0.5, E.elastico), 5); }
}

// ============================ 5. VIVIENDA: DECRETOS Y DESAHUCIOS ============================
function escena5(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'atardecer', { horizonte: 0.74 }); velo(esc, 0, esc.H * 0.6, 0.6, 0.15);
  rotulo(esc, ctx, 'VIVIENDA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const kh = tr(t, 0.2, 0.8, E.expoSalida); R.objeto(esc, 'casa', { x: cx + 200, y: 1170, tam: 380 * (0.6 + 0.4 * kh), hora: 'atardecer', semilla: 'psoe', alfa: kh });
  const td = at(ctx, 'dos', 4.6), ta = at(ctx, 'derogados', 9.0);
  pastilla(esc, '6 OCT · 2 DECRETOS-LEY', cx, 385, { a: tr(t, at(ctx, 'seis', 3.2), 0.5, E.atrasSalida), color: COL.cian, tam: 40 });
  [['RDL 28/2026', cx - 215, td + 0.1], ['RDL 29/2026', cx + 215, td + 0.6]].forEach(([n, px, tt]) => { const a = tr(t, tt, 0.5, E.elastico); tarjeta(esc, px, 540, 380, 130, a, { borde: COL.cian }); texto(esc, n, px, 540, 44, '#fff', a, 5); });
  pastilla(esc, 'LOS ANTERIORES: DEROGADOS', cx, 660, { a: tr(t, ta - 0.2, 0.5, E.atrasSalida), color: COL.rojo, tam: 34 });
  const tp = at(ctx, 'primero', 10.6), ts = at(ctx, 'suspende', 11.6), tw = at(ctx, 'treinta', 13.2);
  escudo(esc, cx - 250, 960, 215, tr(t, ts, 0.6, E.elastico)); texto(esc, '2030', cx - 250, 965, 60, '#fff', tr(t, tw, 0.5, E.elastico), 8);
  pastilla(esc, 'DESAHUCIOS: CIERTOS CASOS VULNERABLES', cx, 1245, { a: tr(t, at(ctx, 'desahucios', 12.4), 0.5, E.atrasSalida), color: COL.verde, tam: 30 });
}

// ============================ 6. COMPRAS DE VIVIENDA < 70 % ============================
function escena6(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'montanas', 'dia', { horizonte: 0.74 }); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'COMPRAS DE VIVIENDA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 130, lineas: 2 });
  const tg = at(ctx, 'grandes', 3.4), tm = at(ctx, 'mercado', 7.6), ts = at(ctx, 'setenta', 6.4), bx = cx - 260, bw = 240, base = 1130, H = 470;
  const kb = tr(t, 0.4, 0.8, E.expoSalida), h1 = H * kb; const g = x.createLinearGradient(0, base - H, 0, base); g.addColorStop(0, '#9CC4FF'); g.addColorStop(1, '#3A6FD0');
  x.fillStyle = g; VE.ruta.redondeado(x, bx, base - h1, bw, h1, 16); x.fill(); x.lineWidth = 5; x.strokeStyle = '#fff'; x.stroke();
  texto(esc, 'VALOR DE MERCADO', bx + bw / 2, base + 40, 32, '#fff', kb, 4); texto(esc, '100 %', bx + bw / 2, base - h1 + 50, 56, '#fff', kb, 6);
  const k7 = tr(t, ts, 0.6, E.suave), ly = base - H * 0.7; if (k7 > 0) { x.save(); x.setLineDash([22, 14]); x.strokeStyle = COL.rojo; x.lineWidth = 8; x.beginPath(); x.moveTo(bx - 40, ly); x.lineTo(bx - 40 + 700 * k7, ly); x.stroke(); x.restore(); }
  pastilla(esc, 'LÍMITE: 70 %', cx + 270, ly - 52, { a: k7, color: COL.rojo, tam: 40, fondo: 'rgba(120,10,20,0.92)' });
  const kp = tr(t, ts + 0.5, 0.7, E.elastico), pw = 240, px = cx + 100, ph = H * 0.6 * Math.min(1, kp); x.fillStyle = COL.dorado; VE.ruta.redondeado(x, px, base - ph, pw, ph, 16); x.fill(); x.lineWidth = 5; x.strokeStyle = '#fff'; x.stroke();
  texto(esc, 'PRECIO < 70 %', px + pw / 2, base + 40, 32, COL.dorado, kp, 4);
  pastilla(esc, 'GRANDES TENEDORES · ENTIDADES ESPECULATIVAS', cx, 500, { a: tr(t, tg, 0.5, E.atrasSalida), color: COL.cian, tam: 27 });
  pastilla(esc, 'HASTA 2030', cx, 590, { a: tr(t, at(ctx, 'fecha', 4.2), 0.5, E.elastico), color: COL.verde, tam: 46 });
}

// ============================ 7. ALQUILER DE TEMPORADA: 12 MESES ============================
function escena7(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'lago', 'alba'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'ALQUILER DE TEMPORADA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 110, lineas: 2 });
  const tc = at(ctx, 'causa', 1.6), td = at(ctx, 'doce', 4.6), m = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  pastilla(esc, 'CAUSA REAL ACREDITABLE', cx, 495, { a: tr(t, tc, 0.5, E.atrasSalida), color: COL.verde, tam: 42 });
  m.forEach((l, i) => { const col = i % 4, fila = Math.floor(i / 4), px = cx - 270 + col * 180, py = 640 + fila * 170, a = tr(t, td - 1.2 + i * 0.1, 0.35, E.elastico);
    tarjeta(esc, px, py, 150, 140, a, { borde: i === 11 ? COL.rojo : COL.dorado, fondo: i === 11 ? 'rgba(120,10,20,0.9)' : NAVY, r: 24 }); texto(esc, l, px, py, 66, '#fff', a, 6); });
  texto(esc, 'MÁX. 12 MESES', cx, 1130, 70, COL.dorado, tr(t, td, 0.5, E.elastico), 10); pastilla(esc, 'REGLA GENERAL', cx, 1215, { a: tr(t, at(ctx, 'regla', 3.6), 0.5, E.atrasSalida), color: COL.cian, tam: 34 });
}

// ============================ 8. PRÉSTAMOS A INTERÉS CERO ============================
function escena8(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'costa', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  for (let i = 0; i < 6; i++) { const f = ((t * 0.5 + i / 6) % 1), a = Math.sin(f * PI) * 0.9; moneda(esc, cx - 400 + ((i * 163) % 800), 300 + f * 700, 34, a); }
  rotulo(esc, ctx, 'PRÉSTAMOS A INTERÉS CERO', cx, 195, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 110, lineas: 2 });
  const k0 = tr(t, at(ctx, 'interes', 1.2), 0.7, E.elastico); texto(esc, '0 %', cx, 640, 330 * (0.6 + 0.4 * Math.min(1, k0)), COL.verde, k0, 20);
  const kc = tr(t, at(ctx, 'cincuenta', 2.8), 0.6, E.elastico); tarjeta(esc, cx, 930, 780, 150, kc, { borde: COL.dorado }); texto(esc, 'HASTA 50.000 €', cx, 932, 70, COL.dorado, kc, 8);
  const kd = tr(t, at(ctx, 'diez', 4.2), 0.6, E.elastico); tarjeta(esc, cx, 1110, 780, 130, kd, { borde: COL.cian }); texto(esc, '10.000 M€ DE DOTACIÓN', cx, 1112, 48, '#fff', kd, 6);
}

// ============================ 9. ALQUILER DE VIVIENDA HABITUAL ============================
function escena9(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'llanura', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'ALQUILER DE VIVIENDA HABITUAL', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 100, lineas: 2 });
  const tp = at(ctx, 'prorrogas', 3.0), tc = at(ctx, 'cinco', 4.6), ts = at(ctx, 'siete', 6.6), ti = at(ctx, 'indemnizacion', 9.6), tq = at(ctx, 'quince', 12.0);
  ['CONTRATO', 'PRÓRROGA', 'PRÓRROGA'].forEach((n, i) => { const px = cx - 300 + i * 300, a = tr(t, tc + i * 0.5, 0.5, E.elastico); tarjeta(esc, px, 560, 270, 220, a, { borde: i ? COL.verde : COL.dorado });
    texto(esc, '5 AÑOS', px, 535, 52, '#fff', a, 6); texto(esc, n, px, 600, 28, i ? COL.verde : COL.dorado, a, 4); });
  pastilla(esc, 'SUCESIVAS', cx, 725, { a: tr(t, tp, 0.5, E.atrasSalida), color: COL.verde, tam: 34 });
  const k7 = tr(t, ts, 0.6, E.elastico); tarjeta(esc, cx, 880, 860, 190, k7, { borde: COL.cian }); texto(esc, '7 AÑOS', cx, 850, 80, COL.cian, k7, 8); texto(esc, 'SI EL ARRENDADOR ES PERSONA JURÍDICA', cx, 930, 30, '#fff', k7, 4);
  const ki = tr(t, ti, 0.6, E.elastico); pastilla(esc, 'INDEMNIZACIÓN SI NO SE RENUEVA', cx, 1040, { a: ki, color: COL.dorado, tam: 36 }); moneda(esc, cx + 410, 1040, 30, ki);
  const kq = tr(t, tq, 0.6, E.elastico); tarjeta(esc, cx, 1170, 640, 120, kq, { borde: COL.rojo, fondo: 'rgba(120,10,20,0.9)' }); texto(esc, 'EN VIGOR: 15 NOV', cx, 1172, 52, '#fff', kq, 6);
}

// ============================ 10. CIERRE + LETRERO ============================
function escena10(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'alba', { nubes: 2 }); velo(esc, 0, esc.H * 0.8, 0.55, 0.35);
  const tS = at(ctx, 'sigue', ctx.dur - 3.2), kS = tr(t, tS - 0.15, 0.8, E.elastico), atenua = 1 - 0.75 * c01(kS * 2), x = esc.ctx;
  x.save(); x.globalAlpha *= atenua;
  rotulo(esc, ctx, '¿QUÉ PUNTO TE INTERESA MÁS?', cx, 205, { a: tr(t, 0.1, 0.6, E.elastico), color: '#fff', max: T.hero, lineas: 2 });
  const tiles = [['PENSIONES', 'IPC'], ['DESAHUCIOS', '2030'], ['COMPRAS', '< 70 %'], ['ALQUILER', '5 AÑOS']];
  tiles.forEach(([n, s], i) => { const px = cx + (i % 2 ? 215 : -215), py = 640 + Math.floor(i / 2) * 270, a = tr(t, 1.0 + i * 0.25, 0.5, E.atrasSalida);
    tarjeta(esc, px, py, 400, 230, a); texto(esc, s, px, py - 28, 70, COL.dorado, a, 8); texto(esc, n, px, py + 60, 38, '#fff', a, 5); });
  pastilla(esc, 'DEJA TU COMENTARIO', cx, 1100, { a: tr(t, at(ctx, 'comentarios', 4.6), 0.5, E.atrasSalida), color: COL.cian, tam: 38 });
  pastilla(esc, 'DALE LIKE · SUSCRÍBETE', cx, 1200, { a: tr(t, at(ctx, 'like', 7.2), 0.5, E.atrasSalida), color: COL.verde, tam: 38 });
  x.restore(); S.letrero(esc, t, tS);
}

VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 74 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: [escena1, escena2, escena3, escena4, escena5, escena6, escena7, escena8, escena9, escena10]
});
