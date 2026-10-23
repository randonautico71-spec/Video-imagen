/* FRENTE AMPLIO: que propone de cara al 29N (anuncios de campaña). Short vertical, voz Carmen (ElevenLabs).
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
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'fa', horizonte: 0.68, nubes: 3 }, o));
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
  const kc = tr(t, at(ctx, 'veintinueve', 0.3) - 0.1, 0.8, E.elastico); calendario(esc, cx, 760, 520, 500, 'NOVIEMBRE', '29', 'ELECCIONES GENERALES', kc);
  urna(esc, cx, 1050, 300, t, at(ctx, 'vota', 3.2));
  rotulo(esc, ctx, '¿QUÉ PROPONE FRENTE AMPLIO?', cx, 205, { a: tr(t, at(ctx, 'propone', 4.6) - 0.1, 0.7, E.elastico), color: '#fff', max: T.mega, lineas: 2 });
}

// ============================ 2. CONTEXTO: CALENDARIO ============================
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, x = esc.ctx; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.35);
  rotulo(esc, ctx, 'EL CALENDARIO', cx, 205, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'NUEVA COALICIÓN · CANDIDATA: ADA COLAU', cx, 335, { a: tr(t, at(ctx, 'colau', 5.0), 0.5, E.atrasSalida), color: COL.cian, tam: 30 });
  const lx = cx - 330, y0 = 470, y1 = 1150, tA = at(ctx, 'diecisiete', 8.0), tB = at(ctx, 'trece', 12.4), tC = at(ctx, 'veintisiete', 14.0), tD = tC + 0.9;
  const prog = c01((t - 0.4) / (tD + 0.2));
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, y1); x.stroke();
  x.strokeStyle = COL.dorado; x.beginPath(); x.moveTo(lx, y0); x.lineTo(lx, lerp(y0, y1, prog)); x.stroke(); x.restore();
  const nodos = [[y0 + 70, '17 OCT', 'PRESENTACIÓN EN MADRID', tA, COL.dorado], [y0 + 360, '13 – 27 NOV', 'CAMPAÑA ELECTORAL', tB, COL.cian], [y1 - 40, '29 NOV', 'VOTACIÓN', tD, COL.verde]];
  nodos.forEach(([y, f, d, tt, c]) => { const a = tr(t, tt, 0.5, E.elastico); if (a <= 0) return;
    x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = c; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(lx, y, 26 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); x.restore();
    tarjeta(esc, lx + 470, y, 700, 170, a, { borde: c }); texto(esc, f, lx + 470, y - 36, 58, c, a, 6); texto(esc, d, lx + 470, y + 38, 36, '#fff', a, 4); });
}

// ============================ 3. LA COALICIÓN ============================
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'costa', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'LA COALICIÓN', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  [['IZQUIERDA UNIDA', cx - 215, 560, at(ctx, 'izquierda', 2.6)], ['SUMAR', cx + 215, 560, at(ctx, 'sumar', 3.8)], ['MÁS MADRID', cx - 215, 750, at(ctx, 'madrid', 4.8)], ['COMUNS', cx + 215, 750, at(ctx, 'comuns', 5.8)]].forEach(([n, px, py, tt]) => {
    const a = tr(t, tt - 0.2, 0.5, E.elastico); tarjeta(esc, px, py, 400, 150, a, { borde: COL.cian }); texto(esc, n, px, py + 2, n.length > 10 ? 36 : 46, '#fff', a, 5); });
  pastilla(esc, 'ENTRE OTRAS ORGANIZACIONES', cx, 930, { a: tr(t, at(ctx, 'otras', 1.4), 0.5, E.atrasSalida), color: COL.verde, tam: 36 });
}

// ============================ 4. OJO: ALCANCE ============================
function escena4(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'montanas', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'OJO', cx, 215, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 230, lineas: 1 });
  const filas = [['ANUNCIOS PÚBLICOS', at(ctx, 'anuncios', 1.6), true], ['ACTOS DE CAMPAÑA', at(ctx, 'publicos', 2.4), true], ['NO ES UN PROGRAMA COMPLETO', at(ctx, 'no', 3.4), false]];
  filas.forEach(([tx, tt, ok], i) => { const y = 600 + i * 190, a = tr(t, tt, 0.5, E.atrasSalida); tarjeta(esc, cx, y, 860, 150, a, { borde: ok ? COL.verde : COL.rojo });
    (ok ? check : aspa)(esc, cx - 350, y, 40 * Math.min(1, a), a); texto(esc, tx, cx + 55, y + 2, tx.length > 18 ? 36 : 52, '#fff', a, 5); });
}

// ============================ 5. CUATRO FRENTES ============================
function escena5(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'dia'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'CUATRO FRENTES', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'PORTAVOZ: PABLO BUSTINDUY', cx, 385, { a: tr(t, at(ctx, 'bustinduy', 1.6), 0.5, E.atrasSalida), color: COL.cian, tam: 38 });
  [['VIVIENDA', null, cx - 215, 650, at(ctx, 'vivienda', 5.2)], ['SALARIOS', null, cx + 215, 650, at(ctx, 'salarios', 6.2)], ['PENSIONES', null, cx - 215, 910, at(ctx, 'pensiones', 7.2)], ['SERVICIOS', 'PÚBLICOS', cx + 215, 910, at(ctx, 'servicios', 8.2)]].forEach(([n, n2, px, py, tt], i) => {
    const a = tr(t, tt - 0.2, 0.5, E.elastico); tarjeta(esc, px, py, 400, 230, a, { borde: COL.dorado }); texto(esc, String(i + 1), px, py - 58, 80, COL.dorado, a, 8);
    if (n2) { texto(esc, n, px, py + 28, 40, '#fff', a, 5); texto(esc, n2, px, py + 76, 40, '#fff', a, 5); } else texto(esc, n, px, py + 52, 44, '#fff', a, 5); });
}

// ============================ 6. VIVIENDA ============================
function escena6(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'atardecer', { horizonte: 0.74 }); velo(esc, 0, esc.H * 0.6, 0.6, 0.15);
  rotulo(esc, ctx, 'VIVIENDA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  pastilla(esc, 'BUSTINDUY', cx, 385, { a: tr(t, at(ctx, 'bustinduy', 1.0), 0.5, E.atrasSalida), color: COL.cian, tam: 40 });
  const k1 = tr(t, at(ctx, 'referendum', 3.8) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 560, 860, 190, k1, { borde: COL.cian });
  texto(esc, '«REFERÉNDUM SOBRE EL', cx, 530, 42, '#fff', k1, 5); texto(esc, 'DERECHO A LA VIVIENDA»', cx, 600, 42, COL.cian, k1, 5);
  const k2 = tr(t, at(ctx, 'intervenir', 8.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 790, 860, 190, k2, { borde: COL.dorado });
  texto(esc, 'COLAU', cx, 750, 34, COL.dorado, k2, 5); texto(esc, 'INTERVENIR EL MERCADO', cx, 815, 46, '#fff', k2, 6);
  const k3 = tr(t, at(ctx, 'alquileres', 12.4) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 1020, 860, 190, k3, { borde: COL.verde });
  texto(esc, 'EN EL ACTO', cx, 980, 34, COL.verde, k3, 5); texto(esc, 'CONTROLAR LOS ALQUILERES', cx, 1045, 44, '#fff', k3, 6);
}

// ============================ 7. SALARIOS Y JORNADA ============================
function escena7(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'costa', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'SALARIOS Y JORNADA', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 120, lineas: 1 });
  const k1 = tr(t, at(ctx, 'urtasun', 2.4) - 0.2, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 240, k1, { borde: COL.verde });
  flechaV(esc, cx - 340, 600, 120, true, COL.verde, k1); texto(esc, 'URTASUN', cx + 60, 540, 36, COL.verde, k1, 5); texto(esc, 'SEGUIR SUBIENDO EL', cx + 60, 610, 40, '#fff', k1, 5); texto(esc, 'SALARIO MÍNIMO', cx + 60, 665, 40, '#fff', k1, 5);
  const k2 = tr(t, at(ctx, 'jornada', 8.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 900, 860, 240, k2, { borde: COL.cian });
  flechaV(esc, cx - 340, 900, 120, false, COL.cian, k2); texto(esc, 'DELGADO', cx + 60, 850, 36, COL.cian, k2, 5); texto(esc, 'BAJAR LA JORNADA', cx + 60, 930, 46, '#fff', k2, 6);
}

// ============================ 8. IMPUESTOS ============================
function escena8(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'alba'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'IMPUESTOS', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: T.mega, lineas: 1 });
  const k1 = tr(t, at(ctx, 'hachazo', 2.8) - 0.2, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 240, k1, { borde: COL.dorado });
  moneda(esc, cx - 340, 600, 56, k1); texto(esc, 'URTASUN', cx + 60, 540, 36, COL.dorado, k1, 5); texto(esc, '«HACHAZO FISCAL»', cx + 60, 610, 50, '#fff', k1, 6); texto(esc, 'A LAS ELÉCTRICAS', cx + 60, 670, 40, '#fff', k1, 5);
  const k2 = tr(t, at(ctx, 'inteligencia', 6.6) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 900, 860, 240, k2, { borde: COL.cian });
  moneda(esc, cx - 340, 900, 56, k2); texto(esc, 'DELGADO', cx + 60, 840, 36, COL.cian, k2, 5); texto(esc, 'IMPUESTOS A LA', cx + 60, 910, 44, '#fff', k2, 6); texto(esc, 'INTELIGENCIA ARTIFICIAL', cx + 60, 970, 34, '#fff', k2, 5);
}

// ============================ 9. PENSIONES Y SERVICIOS PÚBLICOS ============================
function escena9(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'llanura', 'atardecer'); velo(esc, 0, esc.H * 0.8, 0.6, 0.4);
  rotulo(esc, ctx, 'PENSIONES Y SERVICIOS', cx, 200, { a: tr(t, 0.05, 0.6, E.elastico), color: COL.dorado, max: 120, lineas: 1 });
  const k1 = tr(t, at(ctx, 'urtasun', 2.0) - 0.2, 0.7, E.elastico); tarjeta(esc, cx, 600, 860, 270, k1, { borde: COL.verde });
  escudo(esc, cx - 330, 600, 150, k1); texto(esc, 'URTASUN: NO PERMITIRÁN', cx + 70, 535, 34, COL.verde, k1, 5); texto(esc, 'CAMBIAR EL SISTEMA', cx + 70, 600, 40, '#fff', k1, 5); texto(esc, 'PÚBLICO DE PENSIONES', cx + 70, 660, 40, '#fff', k1, 5);
  const k2 = tr(t, at(ctx, 'servicios', 9.0) - 0.3, 0.7, E.elastico); tarjeta(esc, cx, 930, 860, 240, k2, { borde: COL.cian });
  texto(esc, 'SERVICIOS PÚBLICOS', cx, 880, 46, COL.cian, k2, 6); texto(esc, 'DEFENDERLOS, SIN MEDIDAS', cx, 950, 34, '#fff', k2, 5); texto(esc, 'CONCRETAS POR AHORA', cx, 1000, 34, '#fff', k2, 5);
}

// ============================ 10. CIERRE + LETRERO ============================
function escena10(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx; fondo(esc, ctx, 'lago', 'alba', { nubes: 2 }); velo(esc, 0, esc.H * 0.8, 0.55, 0.35);
  const tS = at(ctx, 'sigue', ctx.dur - 3.2), kS = tr(t, tS - 0.15, 0.8, E.elastico), atenua = 1 - 0.75 * c01(kS * 2), x = esc.ctx;
  x.save(); x.globalAlpha *= atenua;
  rotulo(esc, ctx, '¿QUÉ PUNTO TE INTERESA MÁS?', cx, 205, { a: tr(t, 0.1, 0.6, E.elastico), color: '#fff', max: T.hero, lineas: 2 });
  const tiles = [['VIVIENDA', 'ALQUILERES'], ['SALARIOS', 'JORNADA'], ['IMPUESTOS', 'ELÉCTRICAS'], ['PENSIONES', 'PÚBLICAS']];
  tiles.forEach(([n, s], i) => { const px = cx + (i % 2 ? 215 : -215), py = 640 + Math.floor(i / 2) * 270, a = tr(t, 1.0 + i * 0.25, 0.5, E.atrasSalida);
    tarjeta(esc, px, py, 400, 230, a); texto(esc, s, px, py - 28, s.length > 6 ? 54 : 70, COL.dorado, a, 8); texto(esc, n, px, py + 60, 38, '#fff', a, 5); });
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
