/* SE ACABO LA FIESTA (SALF): que propone de cara al 29N (anuncios de Alvise Perez). Short vertical, voz Carmen (ElevenLabs).
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
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'salf', horizonte: 0.68, nubes: 3 }, o));
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
function flechaV(esc, cx, cy, h, sube, color, a) {                          // flecha gorda arriba/abajo
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); x.scale(1, sube ? -1 : 1); const s = 0.7 + 0.3 * Math.min(1, a); x.scale(s, s);
  x.beginPath(); x.moveTo(-34, -h / 2); x.lineTo(34, -h / 2); x.lineTo(34, h * 0.1); x.lineTo(78, h * 0.1); x.lineTo(0, h / 2); x.lineTo(-78, h * 0.1); x.lineTo(-34, h * 0.1); x.closePath();
  x.fillStyle = color; x.fill(); x.lineWidth = 6; x.strokeStyle = '#fff'; x.lineJoin = 'round'; x.stroke(); x.restore();
}

// ============================ 1. GANCHO ============================
function escena1(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.6, 0.55, 0.1);
  const kc = tr(t, at(ctx, 'veintinueve', 0.3) - 0.1, 0.8, E.elastico); calendario(esc, cx, 780, 520, 500, 'NOVIEMBRE', '29', 'ELECCIONES GENERALES', kc);
  urna(esc, cx, 1070, 300, t, at(ctx, 'vota', 3.2));
  rotulo(esc, ctx, '¿QUÉ PROPONE SE ACABÓ LA FIESTA?', cx, 215, { a: tr(t, at(ctx, 'propone', 4.6) - 0.1, 0.7, E.elastico), color: '#fff', max: T.mega, lineas: 3 });
}

// ============================ 2. CONTEXTO: CALENDARIO ============================
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.35);
  rotulo(esc, ctx, 'EL CALENDARIO', cx, 205, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'CABEZA DE LISTA POR MADRID: ALVISE PÉREZ', cx, 365, { a: tr(t, at(ctx, 'alvise', 3.0), 0.5, E.atrasSalida), color: COL.cian, tam: 28 });
  const lx = cx - 330, y0 = 450, y1 = 1190, tA = at(ctx, 'doce', 7.0), tB = at(ctx, 'cinco', 10.6), tC = at(ctx, 'trece', 16.0), tE = at(ctx, 'veintisiete', 17.6), tD = tE + 0.9;
  const prog = c01((t - 0.4) / (tD + 0.2));
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, y1); x.stroke();
  x.strokeStyle = COL.dorado; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, lerp(y0, y1, prog)); x.stroke(); x.restore();
  const nodos = [[y0 + 70, '12 OCT 2025', 'ANUNCIA CANDIDATURA · VISTALEGRE', tA, COL.dorado], [y0 + 290, '5 OCT 2026', 'CONFIRMA QUE CONCURRE', tB, COL.dorado], [y0 + 510, '13 – 27 NOV', 'CAMPAÑA ELECTORAL', tC, COL.cian], [y1 - 40, '29 NOV', 'VOTACIÓN', tD, COL.verde]];
  nodos.forEach(([y, f, d, tt, c]) => { const a = tr(t, tt, 0.5, E.elastico); if (a <= 0) return;
    x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = c; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(lx, y, 26 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); x.restore();
    tarjeta(esc, lx + 470, y, 700, 160, a, { borde: c }); texto(esc, f, lx + 470, y - 32, 54, c, a, 6); texto(esc, d, lx + 470, y + 36, d.length > 26 ? 29 : 36, '#fff', a, 4); });
}

// ============================ 3. OJO: ALCANCE ============================
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'montanas', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'OJO', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 230, lineas: 1 });
  const filas = [['LO ANUNCIADO EN EL ACTO', at(ctx, 'acto', 1.6), true], ['SEGÚN LA PRENSA', at(ctx, 'prensa', 3.4), true], ['NO ES UN PROGRAMA COMPLETO', at(ctx, 'programa', 5.2), false], ['SIN CIFRAS QUE NO COINCIDEN', at(ctx, 'cifras', 8.0), false]];
  filas.forEach(([tx, tt, ok], i) => { const y = 560 + i * 180, a = tr(t, tt, 0.5, E.atrasSalida); tarjeta(esc, cx, y, 860, 140, a, { borde: ok ? COL.verde : COL.rojo });
    (ok ? check : aspa)(esc, cx - 350, y, 38 * Math.min(1, a), a); texto(esc, tx, cx + 55, y + 2, tx.length > 22 ? 34 : 44, '#fff', a, 5); });
}

// ============================ 4. CINCO BLOQUES ============================
function escena4(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'CINCO BLOQUES', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  [['SEGURIDAD', null, cx - 215, 520, at(ctx, 'seguridad', 3.0)], ['CORRUPCIÓN', null, cx + 215, 520, at(ctx, 'corrupcion', 4.0)], ['IMPUESTOS', null, cx - 215, 770, at(ctx, 'impuestos', 5.0)], ['VIVIENDA', null, cx + 215, 770, at(ctx, 'vivienda', 6.0)], ['UNIÓN EUROPEA', null, cx, 1020, at(ctx, 'union', 7.0)]].forEach(([n, n2, px, py, tt], i) => {
    const a = tr(t, tt - 0.2, 0.5, E.elastico); tarjeta(esc, px, py, i === 4 ? 620 : 400, 220, a, { borde: COL.dorado }); texto(esc, String(i + 1), px, py - 52, 76, COL.dorado, a, 8); texto(esc, n, px, py + 55, n.length > 10 ? 38 : 44, '#fff', a, 5); });
}

// ============================ 5. SEGURIDAD ============================
function escena5(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'costa', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'SEGURIDAD', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'ALVISE PÉREZ PROPUSO', cx, 385, { a: tr(t, at(ctx, 'alvise', 1.0), 0.5, E.atrasSalida), color: COL.cian, tam: 36 });
  const k1 = tr(t, at(ctx, 'deportacion', 3.4) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 620, 860, 260, k1, { borde: COL.dorado });
  texto(esc, 'PLAN DE DEPORTACIÓN MASIVA', cx, 570, 40, '#fff', k1, 5); texto(esc, 'DE INMIGRANTES IRREGULARES', cx, 625, 34, COL.dorado, k1, 5); texto(esc, 'CON FONDOS DE COOPERACIÓN', cx, 695, 32, '#fff', k1, 4);
  const k2 = tr(t, at(ctx, 'macrocarcel', 10.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 920, 860, 200, k2, { borde: COL.cian });
  texto(esc, 'CONSTRUIR UNA', cx, 890, 38, '#fff', k2, 5); texto(esc, 'MACROCÁRCEL', cx, 955, 60, COL.cian, k2, 7);
}

// ============================ 6. CORRUPCIÓN ============================
function escena6(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'CORRUPCIÓN', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const k1 = tr(t, at(ctx, 'codigo', 2.4) - 0.2, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 270, k1, { borde: COL.verde });
  escudo(esc, cx - 330, 600, 150, k1); texto(esc, 'REFORMAR EL CÓDIGO PENAL', cx + 70, 545, 32, COL.verde, k1, 5); texto(esc, 'QUE ESTOS DELITOS', cx + 70, 610, 40, '#fff', k1, 5); texto(esc, 'NO PRESCRIBAN', cx + 70, 670, 40, '#fff', k1, 5);
  const k2 = tr(t, at(ctx, 'financiacion', 8.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 900, 860, 240, k2, { borde: COL.dorado });
  moneda(esc, cx - 340, 900, 56, k2); aspa(esc, cx - 340, 900, 46 * Math.min(1, k2), k2); texto(esc, 'FIN DE LA FINANCIACIÓN', cx + 60, 865, 36, '#fff', k2, 5); texto(esc, 'PÚBLICA DE LOS PARTIDOS', cx + 60, 930, 36, COL.dorado, k2, 5);
}

// ============================ 7. IMPUESTOS ============================
function escena7(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'IMPUESTOS', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const k1 = tr(t, at(ctx, 'irpf', 2.6) - 0.2, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 270, k1, { borde: COL.verde });
  flechaV(esc, cx - 340, 600, 120, false, COL.verde, k1); texto(esc, 'IRPF', cx + 60, 540, 36, COL.verde, k1, 5); texto(esc, '0 %', cx + 60, 615, 84, '#fff', k1, 8); texto(esc, 'PARA RENTAS BAJAS', cx + 60, 690, 34, '#fff', k1, 5);
  const k2 = tr(t, at(ctx, 'inteligencia', 8.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 900, 860, 240, k2, { borde: COL.cian });
  texto(esc, 'REDUCIR EL TAMAÑO', cx, 860, 42, '#fff', k2, 5); texto(esc, 'DEL ESTADO CON AYUDA', cx, 920, 36, COL.cian, k2, 5); texto(esc, 'DE LA IA', cx, 975, 44, COL.cian, k2, 6);
}

// ============================ 8. VIVIENDA ============================
function escena8(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'atardecer', { horizonte: 0.74 }); velo(esc, 0, esc.H * 0.6, 0.6, 0.15);
  rotulo(esc, ctx, 'VIVIENDA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const k1 = tr(t, at(ctx, 'urbanizable', 3.6) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 240, k1, { borde: COL.dorado });
  texto(esc, 'TODO EL SUELO', cx, 560, 44, '#fff', k1, 5); texto(esc, 'URBANIZABLE', cx, 625, 62, COL.dorado, k1, 7); texto(esc, 'SALVO RAZONES OBJETIVAS', cx, 690, 30, '#fff', k1, 4);
  const k2 = tr(t, at(ctx, 'prision', 9.4) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 880, 860, 220, k2, { borde: COL.cian });
  texto(esc, 'OKUPACIÓN', cx, 840, 34, COL.cian, k2, 5); texto(esc, 'PRISIÓN Y DESALOJO', cx, 905, 44, '#fff', k2, 6); texto(esc, 'INMEDIATOS', cx, 955, 38, '#fff', k2, 5);
}

// ============================ 9. UNIÓN EUROPEA ============================
function escena9(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'montanas', 'alba'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'UNIÓN EUROPEA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const k1 = tr(t, at(ctx, 'referendum', 2.8) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 240, k1, { borde: COL.cian });
  urna(esc, cx - 330, 610, 120, t, at(ctx, 'referendum', 2.8)); texto(esc, 'REFERÉNDUM', cx + 60, 570, 52, COL.cian, k1, 7); texto(esc, 'SOBRE LA UE', cx + 60, 640, 46, '#fff', k1, 6);
  const k2 = tr(t, at(ctx, 'sangre', 6.8) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 880, 860, 240, k2, { borde: COL.dorado });
  texto(esc, 'ALVISE PÉREZ', cx, 825, 32, COL.dorado, k2, 5); texto(esc, '«NI UNA GOTA DE SANGRE', cx, 890, 40, '#fff', k2, 5); texto(esc, 'ESPAÑOLA» EN CONFLICTOS AJENOS', cx, 945, 30, '#fff', k2, 4);
}

// ============================ 10. CIERRE + LETRERO ============================
function escena10(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'alba', { nubes: 2 }); velo(esc, 0, esc.H * 0.8, 0.55, 0.35);
  const tS = at(ctx, 'sigue', ctx.dur - 3.2), kS = tr(t, tS - 0.15, 0.8, E.elastico), atenua = 1 - 0.75 * c01(kS * 2), x = esc.ctx;
  x.save(); x.globalAlpha *= atenua;
  rotulo(esc, ctx, '¿QUÉ PUNTO TE INTERESA MÁS?', cx, 205, { a: tr(t, 0.1, 0.6, E.elastico), color: '#fff', max: T.hero, lineas: 2 });
  const tiles = [['SEGURIDAD', 'MACROCÁRCEL'], ['CORRUPCIÓN', 'PARTIDOS'], ['IMPUESTOS', 'IRPF 0 %'], ['VIVIENDA', 'SUELO']];
  tiles.forEach(([n, s], i) => { const px = cx + (i % 2 ? 215 : -215), py = 640 + Math.floor(i / 2) * 270, a = tr(t, 1.0 + i * 0.25, 0.5, E.atrasSalida);
    tarjeta(esc, px, py, 400, 230, a); texto(esc, s, px, py - 28, s.length > 8 ? 42 : 60, COL.dorado, a, 8); texto(esc, n, px, py + 60, n.length > 9 ? 34 : 38, '#fff', a, 5); });
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
