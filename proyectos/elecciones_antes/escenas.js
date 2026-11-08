/* ANTES DEL 29N: como se reparten los 350 escanos. LARGO 16:9, voz Juanjo (ElevenLabs).
   Estilo informativo neutral: sin logos ni colores de partido. Todo dato esta en datos.md con su fuente. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const S = VE.short, COL = S.COL, at = S.en, velo = S.velo;
const NAVY = 'rgba(8,14,32,0.88)';
const sp = (esc, px, fn) => { const x = esc.ctx; x.letterSpacing = px + 'px'; x.fontKerning = 'none'; try { return fn(); } finally { x.letterSpacing = '0px'; x.fontKerning = 'auto'; } };
const rotulo = (esc, ctx, ...a) => sp(esc, 5 * esc.k, () => S.rotulo(esc, ctx, ...a));
const pastilla = (esc, txt, cx, cy, o = {}) => sp(esc, 3 * esc.k, () => S.pastilla(esc, txt, cx, cy, Object.assign({}, o, { tam: (o.tam || 30) * 1.4 })));

function fondo(esc, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'el29a', horizonte: 0.7, nubes: 3 }, o));
}
function tarjeta(esc, cx, cy, w, h, a, o = {}) {
  const x = esc.ctx; if (a <= 0) return; x.save(); x.globalAlpha *= Math.min(1, a * 1.5); x.translate(cx, cy); const s = 0.85 + 0.15 * Math.min(1, a); x.scale(s, s);
  VE.ruta.redondeado(x, -w / 2, -h / 2, w, h, o.r || 28); x.fillStyle = o.fondo || NAVY; x.fill(); x.lineWidth = 5 * esc.k; x.strokeStyle = o.borde || COL.dorado; x.stroke(); x.restore();
}
function texto(esc, txt, cx, cy, tam, color, a = 1, contorno = 6, alinear) {
  if (a <= 0) return; const x = esc.ctx; x.save(); x.globalAlpha *= Math.min(1, a * 1.6); esc.tipo(tam, 700); x.letterSpacing = (2 * esc.k) + 'px'; x.fontKerning = 'none';
  VE.texto.trazar(esc, txt, cx, cy, { color, contornoAncho: contorno, registrar: false }); x.restore();
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
// parte un texto en 1-2 lineas de <= n caracteres
function lineas(s, n) {
  if (s.length <= n) return [s]; const p = s.split(' '); let a = '', i = 0;
  while (i < p.length && (a + ' ' + p[i]).trim().length <= n) { a = (a + ' ' + p[i]).trim(); i++; }
  return [a, p.slice(i).join(' ')];
}
function tit(esc, ctx, txt, color, sub, subCol) {
  const z = ctx.zonas.cuerpo, cx = z.cx;
  rotulo(esc, ctx, txt, cx, z.y + 62 * esc.k, { a: tr(ctx.t, 0.05, 0.55, E.elastico), color: color || COL.dorado, max: 112 * esc.k, lineas: 1 });
  if (sub) pastilla(esc, sub, cx, z.y + 215 * esc.k, { a: tr(ctx.t, 0.45, 0.5, E.atrasSalida), color: subCol || COL.cian, tam: 30 });
}
// ---- escena tipo lista: tarjetas de una columna con icono opcional [texto, palabra clave, icono(1 ok,-1 no,0 nada), color]
function lista(def) {
  return (esc, t, ctx) => {
    const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, def.f[0], def.f[1]); velo(esc, 0, esc.H * 0.9, 0.55, 0.4);
    tit(esc, ctx, def.t, def.c, def.s, def.sc);
    const n = def.l.length, y0 = z.y + (def.s ? 330 : 215) * k, hs = z.y2 - y0, h = Math.min(150 * k, hs / n - 14 * k), w = Math.min(z.w * 0.86, 1560 * k);
    def.l.forEach((it, i) => {
      const [tx, kw, ic, col] = it, y = y0 + h / 2 + i * (h + 14 * k), a = tr(t, at(ctx, kw, 1.6 + i * 2.4) - 0.2, 0.45, E.atrasSalida);
      const borde = col || (ic === 1 ? COL.verde : ic === -1 ? COL.rojo : COL.dorado); tarjeta(esc, cx, y, w, h, a, { borde });
      const corto = tx.length <= (ic ? 32 : 36), ls = corto ? [tx] : lineas(tx, ic ? 42 : 46), tam = corto ? 50 : 40, off = ic ? 40 * k : 0;
      if (ic === 1) check(esc, cx - w / 2 + 60 * k, y, 30 * k * Math.min(1, a), a); else if (ic === -1) aspa(esc, cx - w / 2 + 60 * k, y, 30 * k * Math.min(1, a), a);
      ls.forEach((l, j) => texto(esc, l, cx + off, y + (j - (ls.length - 1) / 2) * tam * 1.15 * k, tam, '#fff', a, 5));
    });
  };
}
// ---- escena tipo rejilla (tematica): [partido, texto, palabra clave, icono]
function rejilla(def) {
  return (esc, t, ctx) => {
    const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, def.f[0], def.f[1]); velo(esc, 0, esc.H * 0.9, 0.6, 0.45);
    tit(esc, ctx, def.t, def.c, def.s, def.sc);
    const n = def.l.length, cols = n > 4 ? 2 : 1, filas = Math.ceil(n / cols), y0 = z.y + (def.s ? 330 : 215) * k, hs = z.y2 - y0, h = Math.min(150 * k, hs / filas - 14 * k);
    const w = cols === 2 ? z.w * 0.47 : Math.min(z.w * 0.86, 1500 * k);
    def.l.forEach((it, i) => {
      const [p, tx, kw, ic] = it, c = cols === 2 ? i % 2 : 0, r = cols === 2 ? Math.floor(i / 2) : i;
      const px = cols === 2 ? cx + (c ? 1 : -1) * (w / 2 + 12 * k) : cx, py = y0 + h / 2 + r * (h + 14 * k), a = tr(t, at(ctx, kw, 1.4 + i * 2.2) - 0.2, 0.45, E.atrasSalida);
      tarjeta(esc, px, py, w, h, a, { borde: ic === -1 ? COL.rojo : COL.dorado });
      texto(esc, p, px, py - h * 0.33, 32, COL.dorado, a, 4);
      const ls = lineas(tx, cols === 2 ? 30 : 52), tam = 38;
      ls.forEach((l, j) => texto(esc, l, px, py + h * 0.04 + j * tam * 1.1 * k, tam, '#fff', a, 4));
      if (ic === -1) aspa(esc, px - w / 2 + 36 * k, py, 20 * k * Math.min(1, a), a);
    });
  };
}


const ESC = [];
function gran(esc, txt, cx, cy, tam, color, a) { texto(esc, txt, cx, cy, tam, color, a, 10); }
// barra horizontal rotulada
function barra(esc, x0, cy, wmax, h, frac, a, color, etq, val, k) {
  const x = esc.ctx; if (a <= 0) return; const w = Math.max(6 * k, wmax * frac * Math.min(1, a));
  x.save(); VE.ruta.redondeado(x, x0, cy - h / 2, w, h, 14); x.fillStyle = color; x.fill(); x.lineWidth = 4 * k; x.strokeStyle = '#fff'; x.stroke(); x.restore();
  texto(esc, etq, x0 - 170 * k, cy, etq.length > 6 ? 34 : 44, '#fff', a, 5); texto(esc, val, x0 + w + 70 * k, cy, 54, color, a, 6);
}
// ============ 1 GANCHO ============
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  const a1 = tr(t, at(ctx, 'madrid', 0.3), 0.5, E.elastico), a2 = tr(t, at(ctx, 'solo', 2.2), 0.5, E.elastico);
  tarjeta(esc, cx - 420 * k, z.cy - 40 * k, 700 * k, 520 * k, a1, { borde: COL.dorado }); gran(esc, '38', cx - 420 * k, z.cy - 90 * k, 300, COL.dorado, a1); texto(esc, 'DIPUTADOS · MADRID', cx - 420 * k, z.cy + 110 * k, 44, '#fff', a1, 5);
  tarjeta(esc, cx + 420 * k, z.cy - 40 * k, 700 * k, 520 * k, a2, { borde: COL.cian }); gran(esc, '2', cx + 420 * k, z.cy - 90 * k, 300, COL.cian, a2); texto(esc, 'DIPUTADOS · PROVINCIAS PEQUEÑAS', cx + 420 * k, z.cy + 110 * k, 38, '#fff', a2, 5);
  pastilla(esc, '¿CÓMO SE REPARTEN LOS 350 ESCAÑOS?', cx, z.y2 - 80 * k, { a: tr(t, at(ctx, 'cómo', 6), 0.5, E.atrasSalida), color: COL.verde, tam: 30 });
});
// ============ 2 LO BASICO ============
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, 'LO BÁSICO', COL.dorado);
  const a1 = tr(t, at(ctx, 'trescientos', 2.2), 0.5, E.elastico), a2 = tr(t, at(ctx, 'setenta', 6.5), 0.5, E.elastico);
  tarjeta(esc, cx - 420 * k, z.cy + 60 * k, 700 * k, 470 * k, a1, { borde: COL.dorado }); gran(esc, '350', cx - 420 * k, z.cy + 20 * k, 260, COL.dorado, a1); texto(esc, 'DIPUTADOS', cx - 420 * k, z.cy + 170 * k, 48, '#fff', a1, 5);
  tarjeta(esc, cx + 420 * k, z.cy + 60 * k, 700 * k, 470 * k, a2, { borde: COL.verde }); gran(esc, '176', cx + 420 * k, z.cy + 20 * k, 260, COL.verde, a2); texto(esc, 'MAYORÍA ABSOLUTA', cx + 420 * k, z.cy + 170 * k, 48, '#fff', a2, 5);
});
ESC.push(lista({ f: ['costa', 'dia'], t: 'SE VOTA PROVINCIA A PROVINCIA', l: [
  ['CADA PROVINCIA ES UNA CIRCUNSCRIPCIÓN', 'circunscripción', 0], ['50 PROVINCIAS', 'son', 0, COL.cian], ['MÁS CEUTA Y MELILLA', 'ceuta', 0, COL.cian], ['CADA UNA ELIGE A SUS PROPIOS DIPUTADOS', 'propios', 0]] }));
ESC.push(lista({ f: ['montanas', 'dia'], t: 'ASÍ SE REPARTEN', l: [
  ['2 DIPUTADOS PARA CADA PROVINCIA = 100', 'primero', 0], ['CEUTA Y MELILLA: 1 CADA UNA', 'ceuta', 0], ['SUMAN 102', 'suma', 0, COL.verde], ['LOS OTROS 248, SEGÚN LA POBLACIÓN', 'doscientos', 0, COL.cian]] }));
// 5 barra fijos / poblacion
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k, x = esc.ctx; fondo(esc, ctx, 'desierto', 'atardecer'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, '350 ESCAÑOS', COL.dorado);
  const W = Math.min(z.w * 0.86, 1600 * k), x0 = cx - W / 2, y = z.cy + 20 * k, h = 190 * k, f = 102 / 350;
  const a1 = tr(t, at(ctx, 'ciento', 1.0), 0.8, E.atrasSalida), a2 = tr(t, at(ctx, 'doscientos', 6.5), 0.8, E.atrasSalida);
  x.save(); VE.ruta.redondeado(x, x0, y - h / 2, W * f * Math.min(1, a1), h, 20); x.fillStyle = COL.dorado; x.fill(); x.restore();
  x.save(); x.globalAlpha *= Math.min(1, a2); VE.ruta.redondeado(x, x0 + W * f + 6 * k, y - h / 2, (W * (1 - f) - 6 * k) * Math.min(1, a2), h, 20); x.fillStyle = COL.cian; x.fill(); x.restore();
  texto(esc, '102', x0 + W * f / 2, y, 90, '#10162b', a1, 0); texto(esc, '248', x0 + W * f + W * (1 - f) / 2, y, 90, '#10162b', a2, 0);
  texto(esc, 'FIJOS · casi 3 de cada 10'.toUpperCase(), x0 + W * f / 2 + 100 * k, y + 170 * k, 40, COL.dorado, a1, 5);
  texto(esc, 'SEGÚN LA POBLACIÓN', x0 + W * f + W * (1 - f) / 2, y - 170 * k, 44, COL.cian, a2, 5);
});
// 6 Madrid 38 vs 2
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'montanas', 'dia'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, 'MADRID VS. EL MÍNIMO', COL.dorado);
  const W = Math.min(z.w * 0.7, 1300 * k), x0 = cx - W / 2 + 200 * k, y = z.cy + 20 * k;
  barra(esc, x0, y - 100 * k, W, 150 * k, 38 / 38, tr(t, at(ctx, 'madrid', 1.2), 0.9, E.atrasSalida), COL.dorado, 'MADRID', '38', k);
  barra(esc, x0, y + 100 * k, W, 150 * k, 2 / 38, tr(t, at(ctx, 'mínimo', 4.5), 0.9, E.atrasSalida), COL.cian, 'MÁS PEQUEÑAS', '2', k);
});
// 7 cambios
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'montanas', 'atardecer'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, 'CAMBIOS EN 2026', COL.dorado, 'POR LA POBLACIÓN', COL.cian);
  [['MADRID', '37 → 38', '+1', 'madrid', COL.verde, -1], ['CÁDIZ', '9 → 8', '−1', 'cádiz', COL.rojo, 1]].forEach(([n, v, d, kw, c, s], i) => {
    const px = cx + s * 430 * k, a = tr(t, at(ctx, kw, 2 + i * 2.5) - 0.2, 0.5, E.elastico), py = z.cy + 120 * k;
    tarjeta(esc, px, py, 700 * k, 520 * k, a, { borde: c }); texto(esc, n, px, py - 170 * k, 64, '#fff', a, 6); texto(esc, v, px, py - 20 * k, 110, c, a, 8); gran(esc, d, px, py + 150 * k, 130, c, a);
  });
});
ESC.push(lista({ f: ['llanura', 'dia'], t: 'LO QUE DICEN LOS EXPERTOS', s: 'SEGÚN MALDITA.ES', l: [
  ['CADA PROVINCIA TIENE UN MÍNIMO DE 2 DIPUTADOS', 'mínimo', 0], ['LAS PROVINCIAS CON MENOS HABITANTES...', 'habitantes', 0], ['...TIENEN, EN CONJUNTO, MÁS REPRESENTANTES QUE LAS GRANDES', 'grandes', 0]] }));
ESC.push(lista({ f: ['montanas', 'atardecer'], t: 'EL SISTEMA D\'HONDT', l: [
  ['VOTOS DE CADA PARTIDO ÷ 1, ÷ 2, ÷ 3...', 'dividen', 0], ['HASTA EL NÚMERO DE ESCAÑOS DE LA PROVINCIA', 'hasta', 0], ['LOS ESCAÑOS VAN A LOS COCIENTES MÁS ALTOS', 'cocientes', 1]] }));
// 10 ejemplo D'Hondt
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.9, 0.6, 0.45); tit(esc, ctx, 'EJEMPLO INVENTADO · 6 ESCAÑOS', COL.dorado);
  const cols = [['A', 340, ['340', '170', '113'], [1, 1, 1], 'trescientos', COL.dorado], ['B', 220, ['220', '110', '73'], [1, 1, 0], 'doscientos', COL.cian], ['C', 120, ['120', '60', '40'], [1, 0, 0], 'ciento', COL.verde]];
  const w = 430 * k, y0 = z.y + 330 * k, rh = 120 * k;
  cols.forEach(([n, v, q, win, kw, c], i) => {
    const px = cx + (i - 1) * (w + 40 * k), a = tr(t, at(ctx, kw, 3 + i * 3) - 0.2, 0.5, E.elastico);
    tarjeta(esc, px, y0 + 190 * k, w, 560 * k, a, { borde: c }); texto(esc, 'PARTIDO ' + n, px, y0 - 20 * k, 46, c, a, 5); texto(esc, v + '.000 votos', px, y0 + 50 * k, 40, '#fff', a, 5);
    q.forEach((m, j) => { const aw = tr(t, at(ctx, 'seis', 14) + 1.5 + j * 0.5 + i * 0.15, 0.4, E.atrasSalida);
      if (win[j] && aw > 0.2) { tarjeta(esc, px, y0 + 150 * k + j * rh, w - 60 * k, rh - 14 * k, aw, { borde: c, fondo: 'rgba(30,70,40,0.9)' }); }
      texto(esc, '÷' + (j + 1) + ' = ' + m + (win[j] ? '' : ''), px, y0 + 150 * k + j * rh, 48, win[j] && aw > 0.2 ? '#fff' : 'rgba(255,255,255,0.45)', a, 5); });
  });
  pastilla(esc, 'A: 3 ESCAÑOS · B: 2 · C: 1', cx, z.y2 - 50 * k, { a: tr(t, at(ctx, 'resultado', 25), 0.5, E.atrasSalida), color: COL.verde, tam: 32 });
});
// 11 umbral 3%
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'desierto', 'alba'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, 'EL CORTE', COL.dorado);
  const a = tr(t, at(ctx, 'tres', 3), 0.6, E.elastico); tarjeta(esc, cx, z.cy + 70 * k, 900 * k, 520 * k, a, { borde: COL.rojo }); gran(esc, '3 %', cx, z.cy + 20 * k, 300, COL.rojo, a);
  texto(esc, 'DE LOS VOTOS DE CADA PROVINCIA', cx, z.cy + 190 * k, 44, '#fff', a, 5);
});
ESC.push(lista({ f: ['desierto', 'dia'], t: 'EL EFECTO', s: 'SEGÚN LOS EXPERTOS', l: [
  ['CON POCOS ESCAÑOS, LOS PARTIDOS PEQUEÑOS SUELEN QUEDAR FUERA', 'pequeños', -1], ['2 ESCAÑOS EN JUEGO = POCO MARGEN', 'dos', 0, COL.rojo], ['38 ESCAÑOS EN JUEGO = MUCHO MÁS MARGEN', 'treinta', 0, COL.verde]] }));
// 13 2023 barras
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k, x = esc.ctx; fondo(esc, ctx, 'montanas', 'noche'); velo(esc, 0, esc.H * 0.9, 0.6, 0.45); tit(esc, ctx, 'ASÍ QUEDÓ EN 2023', COL.dorado);
  const W = Math.min(z.w * 0.6, 1100 * k), x0 = cx - W / 2 + 220 * k, y0 = z.y + 290 * k, gap = 150 * k;
  [['PP', 137, 'pp', COL.dorado], ['PSOE', 121, 'psoe', COL.rojo], ['VOX', 33, 'vox', COL.verde], ['SUMAR', 31, 'sumar', COL.cian]].forEach(([n, v, kw, c], i) => barra(esc, x0, y0 + i * gap, W, 110 * k, v / 176, tr(t, at(ctx, kw, 2 + i * 2.6) - 0.1, 0.8, E.atrasSalida), c, n, String(v), k));
  const xl = x0 + W, al = tr(t, at(ctx, 'ninguno', 12), 0.6, E.atrasSalida);
  if (al > 0) { x.save(); x.globalAlpha *= al; x.setLineDash([16, 12]); x.strokeStyle = '#fff'; x.lineWidth = 6 * k; x.beginPath(); x.moveTo(xl, y0 - 70 * k); x.lineTo(xl, y0 + 3 * gap + 70 * k); x.stroke(); x.restore(); texto(esc, '176', xl, y0 - 100 * k, 50, '#fff', al, 6); }
});
ESC.push(rejilla({ f: ['montanas', 'noche'], t: '2023 · LOS DEMÁS', l: [
  ['JUNTS', '7 escaños', 'junts', 0], ['ESQUERRA', '7 escaños', 'esquerra', 0], ['EH BILDU', '6 escaños', 'bildu', 0], ['PNV', '5 escaños', 'pnv', 0], ['UPN', '1 escaño', 'upn', 0], ['COALICIÓN CANARIA', '1 escaño', 'coalición', 0], ['BNG', '1 escaño', 'bng', 0]] }));
ESC.push(lista({ f: ['montanas', 'noche'], t: 'PARTICIPACIÓN 2023', l: [
  ['≈ 70 % DEL CENSO', 'setenta', 0], ['≈ 4 PUNTOS MÁS QUE EN 2019', 'cuatro', 0, COL.cian], ['VOTO POR CORREO: CASI 2,5 MILLONES, HISTÓRICO', 'correo', 0, COL.verde]] }));
ESC.push(lista({ f: ['montanas', 'noche'], t: 'LA ARITMÉTICA', l: [
  ['PP + VOX: NO LLEGABAN A LA MAYORÍA', 'pp', -1], ['PSOE + SUMAR + BILDU + PNV + ERC: TAMPOCO', 'psoe', -1], ['SI JUNTS SE ABSTENÍA, SÍ PODÍAN', 'abstenía', 1], ['CADA ESCAÑO PEQUEÑO PUEDE DECIDIR UN GOBIERNO', 'decidir', 0]] }));
// 17 cuatro numeros
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'atardecer'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4); tit(esc, ctx, 'CUATRO NÚMEROS', COL.dorado);
  [['350', 'DIPUTADOS', 'trescientos', COL.dorado], ['176', 'MAYORÍA ABSOLUTA', 'setenta', COL.verde], ['102', 'ESCAÑOS FIJOS', 'ciento', COL.cian], ['3 %', 'CORTE POR PROVINCIA', 'tres', COL.rojo]].forEach(([v, d, kw, c], i) => {
    const col = i % 2, row = Math.floor(i / 2), px = cx + (col ? 1 : -1) * 420 * k, py = z.y + 400 * k + row * 330 * k, a = tr(t, at(ctx, kw, 3 + i * 3) - 0.2, 0.5, E.elastico);
    tarjeta(esc, px, py, 780 * k, 290 * k, a, { borde: c }); gran(esc, v, px, py - 40 * k, 150, c, a); texto(esc, d, px, py + 90 * k, 44, '#fff', a, 5); });
});

// ============ 2. CALENDARIO ============
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k, x = esc.ctx; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4);
  tit(esc, ctx, 'EL CALENDARIO', COL.dorado);
  const y = z.cy + 75 * k, x0 = z.x + 200 * k, x1 = z.x2 - 200 * k, prog = c01((t - 0.3) / 8);
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
  x.strokeStyle = COL.dorado; x.beginPath(); x.moveTo(x0, y); x.lineTo(lerp(x0, x1, prog), y); x.stroke(); x.restore();
  [['5 OCT', 'CONVOCATORIA', 'cinco', COL.dorado, 0], ['13 – 27 NOV', 'CAMPAÑA', 'trece', COL.cian, 0.5], ['29 NOV', 'VOTACIÓN', 'veintinueve', COL.verde, 1]].forEach(([f, d, kw, c, p], i) => {
    const px = lerp(x0, x1, p), a = tr(t, at(ctx, kw, 2 + i * 3) - 0.2, 0.5, E.elastico), up = i % 2 === 0 ? -1 : 1;
    x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = c; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(px, y, 26 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); x.restore();
    tarjeta(esc, px, y + up * 170 * k, 520 * k, 190 * k, a, { borde: c }); texto(esc, f, px, y + up * 170 * k - 30 * k, 56, c, a, 6); texto(esc, d, px, y + up * 170 * k + 45 * k, 40, '#fff', a, 5); });
  pastilla(esc, 'CONVOCÓ: PEDRO SÁNCHEZ', z.cx, z.y + 255 * k, { a: tr(t, at(ctx, 'sánchez', 3.2), 0.5, E.atrasSalida), color: COL.cian, tam: 32 });
}
ESC.push(escena2);

ESC.push(lista({ f: ['lago', 'dia'], t: 'EL SIGUIENTE VÍDEO', s: 'EN MI CANAL', l: [
  ['LOS 8 PARTIDOS', 'ocho', 0], ['TODO LO QUE HAN PROMETIDO', 'prometido', 0, COL.cian], ['VIVIENDA · PENSIONES · SALARIOS · IMPUESTOS', 'vivienda', 0], ['AL FINAL: COMPARADO POR TEMAS', 'temas', 1]] }));
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  const a = tr(t, at(ctx, 'pregunta', 0.5), 0.5, E.elastico); tarjeta(esc, cx, z.cy - 60 * k, 1400 * k, 300 * k, a, { borde: COL.dorado });
  texto(esc, '¿CUÁNTOS DIPUTADOS HACEN FALTA', cx, z.cy - 100 * k, 56, '#fff', a, 6); texto(esc, 'PARA LA MAYORÍA ABSOLUTA?', cx, z.cy - 25 * k, 56, COL.dorado, a, 6);
  pastilla(esc, 'DALE LIKE · SUSCRÍBETE', cx, z.cy + 230 * k, { a: tr(t, at(ctx, 'like', 8), 0.5, E.atrasSalida), color: COL.verde, tam: 44 });
  S.letrero(esc, t, at(ctx, 'randonáutico', 10));
});
VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 64 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: ESC
});
