/* ELECCIONES 29N: que propone cada partido (lo anunciado, sin programas completos). LARGO 16:9, voz Juanjo (ElevenLabs).
   Estilo informativo neutral: sin logos ni colores de partido. Todo dato esta en datos.md con su fuente. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const S = VE.short, COL = S.COL, at = S.en, velo = S.velo;
const NAVY = 'rgba(8,14,32,0.88)';
const sp = (esc, px, fn) => { const x = esc.ctx; x.letterSpacing = px + 'px'; x.fontKerning = 'none'; try { return fn(); } finally { x.letterSpacing = '0px'; x.fontKerning = 'auto'; } };
const rotulo = (esc, ctx, ...a) => sp(esc, 5 * esc.k, () => S.rotulo(esc, ctx, ...a));
const pastilla = (esc, txt, cx, cy, o = {}) => sp(esc, 3 * esc.k, () => S.pastilla(esc, txt, cx, cy, Object.assign({}, o, { tam: (o.tam || 30) * 1.4 })));

function fondo(esc, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'el29n', horizonte: 0.7, nubes: 3 }, o));
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

// ============ 1. GANCHO (primeros segundos: impacto inmediato) ============
function escena1(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  calendario(esc, cx - 430 * k, z.cy - 10 * k, 470 * k, 450 * k, 'NOVIEMBRE', '29', 'ELECCIONES GENERALES', tr(t, 0.05, 0.7, E.elastico));
  rotulo(esc, ctx, 'ESPAÑA VOTA', cx + 330 * k, z.y + 110 * k, { a: tr(t, 0.1, 0.5, E.elastico), color: '#fff', max: 130 * k, lineas: 1 });
  [['8 PARTIDOS', 'ocho', COL.cian], ['CIENTOS DE PROMESAS', 'cientos', COL.dorado], ['NINGÚN PROGRAMA COMPLETO LEÍDO', 'completo', COL.rojo]].forEach(([tx, kw, c], i) => {
    const y = z.y + 270 * k + i * 150 * k, a = tr(t, at(ctx, kw, 3 + i * 2.5) - 0.2, 0.5, E.elastico); tarjeta(esc, cx + 330 * k, y, 880 * k, 120 * k, a, { borde: c });
    texto(esc, tx, cx + 330 * k, y + 2, tx.length > 22 ? 36 : 48, '#fff', a, 5); });
  pastilla(esc, 'TE CUENTO DE DÓNDE SALE CADA DATO', cx + 330 * k, z.y + 740 * k, { a: tr(t, at(ctx, 'quédate', 9.5), 0.5, E.atrasSalida), color: COL.verde, tam: 30 });
}
// ============ 2. CALENDARIO ============
function escena2(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k, x = esc.ctx; fondo(esc, ctx, 'lago', 'dia'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4);
  tit(esc, ctx, 'EL CALENDARIO', COL.dorado);
  const y = z.cy + 20 * k, x0 = z.x + 200 * k, x1 = z.x2 - 200 * k, prog = c01((t - 0.3) / 8);
  x.save(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
  x.strokeStyle = COL.dorado; x.beginPath(); x.moveTo(x0, y); x.lineTo(lerp(x0, x1, prog), y); x.stroke(); x.restore();
  [['5 OCT', 'CONVOCATORIA', 'cinco', COL.dorado, 0], ['13 – 27 NOV', 'CAMPAÑA', 'trece', COL.cian, 0.5], ['29 NOV', 'VOTACIÓN', 'veintinueve', COL.verde, 1]].forEach(([f, d, kw, c, p], i) => {
    const px = lerp(x0, x1, p), a = tr(t, at(ctx, kw, 2 + i * 3) - 0.2, 0.5, E.elastico), up = i % 2 === 0 ? -1 : 1;
    x.save(); x.globalAlpha *= Math.min(1, a); x.fillStyle = c; x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(px, y, 26 * Math.min(1, a), 0, 7); x.fill(); x.stroke(); x.restore();
    tarjeta(esc, px, y + up * 170 * k, 520 * k, 190 * k, a, { borde: c }); texto(esc, f, px, y + up * 170 * k - 30 * k, 56, c, a, 6); texto(esc, d, px, y + up * 170 * k + 45 * k, 40, '#fff', a, 5); });
  pastilla(esc, 'CONVOCÓ: PEDRO SÁNCHEZ', z.cx, z.y2 - 40 * k, { a: tr(t, at(ctx, 'sánchez', 3.2), 0.5, E.atrasSalida), color: COL.cian, tam: 32 });
}
// ============ 3. LOS OCHO ============
function escena3(esc, t, ctx) {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'costa', 'dia'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4);
  tit(esc, ctx, 'LOS OCHO PARTIDOS', COL.dorado);
  [['PSOE', 'psoe'], ['PP', 'pp'], ['VOX', 'vox'], ['FRENTE AMPLIO', 'frente'], ['PODEMOS', 'podemos'], ['ERC', 'esquerra'], ['JUNTS', 'junts'], ['SE ACABÓ LA FIESTA', 'fiesta']].forEach(([n, kw], i) => {
    const c = i % 4, r = Math.floor(i / 4), w = 430 * k, px = cx + (c - 1.5) * (w + 24 * k), py = z.y + 330 * k + r * 230 * k, a = tr(t, at(ctx, kw, 2 + i * 1.1) - 0.2, 0.5, E.elastico);
    tarjeta(esc, px, py, w, 170 * k, a, { borde: COL.dorado }); texto(esc, n, px, py, n.length > 12 ? 36 : 58, '#fff', a, 6); });
  pastilla(esc, 'QUÉ HAN PRESENTADO · QUÉ PROMETEN · QUÉ NO CONCRETAN', cx, z.y2 - 60 * k, { a: tr(t, at(ctx, 'concretado', 16), 0.5, E.atrasSalida), color: COL.cian, tam: 32 });
}
const ESC = [escena1, escena2, escena3];
// ============ 4. LA REGLA ============
ESC.push(lista({ f: ['montanas', 'atardecer'], t: 'LA REGLA', l: [
  ['DOCUMENTO OFICIAL', 'documento', 1], ['LO RECOGEN VARIOS MEDIOS', 'medios', 1], ['EL RESTO SE QUEDA FUERA, Y TE AVISO', 'fuera', -1], ['SIN OPINIONES Y SIN ENCUESTAS', 'opiniones', -1]] }));
// ============ PSOE ============
ESC.push(lista({ f: ['llanura', 'atardecer'], t: 'PSOE', s: 'CANDIDATO: PEDRO SÁNCHEZ', l: [
  ['CAMPAÑA ARRANCA CON LA VIVIENDA COMO TEMA CENTRAL', 'vivienda', 0], ['NO HE PODIDO LEER UN PROGRAMA COMPLETO', 'programa', -1], ['SON DECRETOS APROBADOS Y PROMESAS EN MÍTINES', 'decretos', 0]] }));
ESC.push(lista({ f: ['llanura', 'atardecer'], t: 'PSOE · VIVIENDA', l: [
  ['6 OCT: EL GOBIERNO APRUEBA DOS DECRETOS DE VIVIENDA', 'seis', 0], ['SUSPENDE HASTA 2030 LOS DESAHUCIOS DE FAMILIAS VULNERABLES', 'suspende', 0], ['LIMITA QUE FONDOS Y GRANDES TENEDORES COMPREN POR MENOS DEL 70 % DEL VALOR', 'setenta', 0]] }));
ESC.push(lista({ f: ['llanura', 'atardecer'], t: 'PSOE · VIVIENDA', l: [
  ['PRÉSTAMOS A INTERÉS CERO DE HASTA 50.000 €', 'cincuenta', 0], ['10.000 MILLONES DE DOTACIÓN', 'diez', 0], ['ALQUILER: PRÓRROGAS DE 5 AÑOS, 7 SI EL CASERO ES EMPRESA', 'prórrogas', 0], ['SÁNCHEZ PROMETE REFORZAR Y MANTENER ESTOS DECRETOS', 'reforzar', 0]] }));
ESC.push(lista({ f: ['llanura', 'atardecer'], t: 'PSOE · PENSIONES', l: [
  ['4 AÑOS MÁS DE REVALORIZACIÓN CON EL IPC', 'cuatro', 0], ['OBJETIVO: 20.000 MILLONES EN LA HUCHA AL ACABAR LA LEGISLATURA', 'veinte', 0], ['26 OCT, GIJÓN: REFORMAR LA CONSTITUCIÓN PARA BLINDARLAS', 'gijón', 0]] }));
ESC.push(lista({ f: ['llanura', 'atardecer'], t: 'PSOE · SALARIOS', l: [
  ['SUBIR EL SALARIO MÍNIMO TODOS LOS AÑOS QUE GOBIERNE', 'salario', 0], ['SIN DAR UNA CIFRA', 'cifra', -1]] }));
// ============ PP ============
ESC.push(lista({ f: ['montanas', 'dia'], t: 'PP · CONTRATO CON ESPAÑA', s: 'PRESENTADO EL 19 DE OCTUBRE', l: [
  ['FEIJÓO: EL PROGRAMA TAMBIÉN SE PRESENTARÁ', 'programa', 0], ['FEIJÓO: EN ESTAS ELECCIONES NO BASTA CON UN PROGRAMA', 'basta', 0], ['DE MOMENTO, ESTAS SON SUS PROMESAS PÚBLICAS', 'momento', 0]] }));
ESC.push(lista({ f: ['montanas', 'dia'], t: 'PP · LAS PROMESAS', l: [
  ['PENSIONES: SUBIRLAS CADA AÑO CONFORME AL IPC', 'pensiones', 0], ['IMPUESTOS: BAJARLOS, SIN DECIR CUÁLES NI CUÁNTO', 'impuestos', -1], ['PRESUPUESTOS: UNO CADA AÑO', 'presupuestos', 0], ['SI ENCADENA DOS PRÓRROGAS, DEVOLVER LA PALABRA A LOS ESPAÑOLES', 'palabra', 0]] }));
ESC.push(lista({ f: ['montanas', 'dia'], t: 'PP · VIVIENDA', l: [
  ['AL MENOS 1.000.000 DE VIVIENDAS NUEVAS', 'millón', 0], ['100 PRIMEROS DÍAS: LEY PARA DESALOJAR OKUPAS EN 48 HORAS', 'okupas', 0], ['LEY DEL SUELO Y REFORMA DE LA PROPIEDAD HORIZONTAL', 'suelo', 0]] }));
ESC.push(lista({ f: ['montanas', 'dia'], t: 'PP · VIVIENDA', l: [
  ['MENORES DE 40: AVALES DE HASTA EL 100 %', 'avales', 0], ['REBAJAS DEL 60 % EN IVA Y EN TRANSMISIONES', 'sesenta', 0], ['ALQUILER: DEDUCCIONES EN CONTRATOS DE HASTA 3 AÑOS', 'deducciones', 0], ['CON SUBIDAS POR DEBAJO DEL IPC', 'subidas', 0]] }));
// ============ VOX ============
ESC.push(lista({ f: ['desierto', 'atardecer'], t: 'VOX · «ES SENTIDO COMÚN»', s: 'ARRANCA CAMPAÑA EL 13 DE NOVIEMBRE', l: [
  ['LO DICHO EN ACTOS Y PROPUESTAS EN EL CONGRESO', 'actos', 0], ['NO ES UN PROGRAMA COMPLETO', 'completo', -1], ['3 EJES: PRIORIDAD NACIONAL, DESREGULACIÓN, REMIGRACIÓN', 'ejes', 0]] }));
ESC.push(lista({ f: ['desierto', 'atardecer'], t: 'VOX · EJES', l: [
  ['PRIORIDAD NACIONAL: LOS ESPAÑOLES, LOS PRIMEROS (ABASCAL)', 'primeros', 0], ['JUNIO: MOCIÓN EN EL CONGRESO PARA VIVIENDA PROTEGIDA, ALQUILER SOCIAL Y AYUDAS', 'moción', 0], ['REMIGRACIÓN: REPATRIAR A QUIENES LLEGARON ILEGALMENTE Y DEPORTAR A DELINCUENTES EXTRANJEROS', 'remigración', 0]] }));
ESC.push(lista({ f: ['desierto', 'atardecer'], t: 'VOX · IMPUESTOS', l: [
  ['IRPF: DOS TIPOS ÚNICOS', 'tipos', 0], ['15 % HASTA 70.000 € · 25 % POR ENCIMA', 'quince', 0], ['22.000 € EXENTOS · 4 PUNTOS MENOS POR HIJO', 'veintidós', 0], ['DESREGULACIÓN: ACABAR CON LAS TRABAS ADMINISTRATIVAS', 'trabas', 0]] }));
ESC.push(lista({ f: ['desierto', 'atardecer'], t: 'VOX · PENSIONES Y VIVIENDA', l: [
  ['ABASCAL NIEGA QUERER PRIVATIZAR LAS PENSIONES', 'privatizarlas', 0], ['DICE QUE SE VAN A PAGAR «COMO SEA»', 'sea', 0], ['VIVIENDA: ACCESO «COMO SEA Y AL PRECIO QUE SEA»', 'vivienda', 0], ['SIGUIENTE: UNA LEY DE VIVIENDA ANUNCIADA EL 6 NOV', 'seis', 0]] }));
// ============ FRENTE AMPLIO ============
ESC.push(lista({ f: ['costa', 'dia'], t: 'FRENTE AMPLIO', s: 'CANDIDATA: ADA COLAU', l: [
  ['LA INTEGRAN, ENTRE OTROS: IU, SUMAR, MÁS MADRID Y LOS COMUNS', 'integran', 0], ['PORTAVOZ DE CAMPAÑA: PABLO BUSTINDUY', 'portavoz', 0], ['4 FRENTES: VIVIENDA, SALARIOS, PENSIONES Y SERVICIOS PÚBLICOS', 'frentes', 0]] }));
ESC.push(lista({ f: ['costa', 'dia'], t: 'FRENTE AMPLIO · VIVIENDA', l: [
  ['6 NOV, MÁLAGA: LEY PARA EXPROPIAR VIVIENDAS A GRANDES PROPIETARIOS CORPORATIVOS', 'expropiar', 0], ['INTERVENIR EL MERCADO Y CONTROLAR LOS ALQUILERES', 'intervenir', 0], ['BUSTINDUY: ESTAS ELECCIONES SON UN REFERÉNDUM SOBRE EL DERECHO A LA VIVIENDA', 'referéndum', 0]] }));
ESC.push(lista({ f: ['costa', 'dia'], t: 'FRENTE AMPLIO · SALARIOS E IMPUESTOS', l: [
  ['URTASUN: SEGUIR SUBIENDO EL SALARIO MÍNIMO', 'mínimo', 0], ['DELGADO: BAJAR LA JORNADA', 'jornada', 0], ['URTASUN: «HACHAZO FISCAL» A LAS ELÉCTRICAS', 'hachazo', 0], ['DELGADO: IMPUESTOS A LA INTELIGENCIA ARTIFICIAL', 'inteligencia', 0]] }));
ESC.push(lista({ f: ['costa', 'dia'], t: 'FRENTE AMPLIO · PENSIONES', l: [
  ['URTASUN: NO PERMITIRÁN QUE SE CAMBIE EL SISTEMA PÚBLICO', 'permitirán', 0], ['SERVICIOS PÚBLICOS: DEFENDERLOS, SIN MEDIDAS CONCRETAS', 'concretas', -1]] }));
// ============ PODEMOS ============
ESC.push(lista({ f: ['bosque', 'dia'], t: 'PODEMOS', s: 'IRENE MONTERO · PAZ, CASA Y TRABAJO', l: [
  ['PRESENTÓ SUS PROPUESTAS EL 19 DE OCTUBRE', 'diecinueve', 0], ['NO HE PODIDO LEER UN PROGRAMA COMPLETO', 'programa', -1], ['SON EJES Y MEDIDAS, SIN COSTES NI PLAZOS', 'ejes', -1]] }));
ESC.push(lista({ f: ['bosque', 'dia'], t: 'PODEMOS · CASA Y TRABAJO', l: [
  ['«LA VIVIENDA NO PUEDE SER UN NEGOCIO»', 'negocio', 0], ['NADIE QUE QUIERA ESPECULAR DEBERÍA PODER COMPRAR CASA', 'especular', 0], ['SALARIO MÍNIMO DE 1.800 € POR LEY', 'mil', 0], ['JORNADA DE 30 HORAS SEMANALES', 'treinta', 0]] }));
ESC.push(lista({ f: ['bosque', 'dia'], t: 'PODEMOS · PAZ', l: [
  ['NI UN EURO MÁS A ARMAS', 'euro', 0], ['PARAR LAS GUERRAS Y REDUCIR LA DEPENDENCIA DE LA OTAN', 'otan', 0], ['BAJAR LOS PRECIOS Y RECUPERAR EL PODER ADQUISITIVO, SIN CIFRAS', 'precios', -1]] }));
ESC.push(lista({ f: ['bosque', 'dia'], t: 'PODEMOS · SERVICIOS PÚBLICOS', l: [
  ['REFORZAR LA SANIDAD Y LA EDUCACIÓN PÚBLICAS', 'sanidad', 0], ['MÁS PROFESIONALES Y MEJOR PAGADOS', 'profesionales', 0], ['ACTUAR CONTRA EL CAMBIO CLIMÁTICO Y LAS VIOLENCIAS MACHISTAS', 'climático', 0]] }));
// ============ ERC ============
ESC.push(lista({ f: ['costa', 'atardecer'], t: 'ESQUERRA REPUBLICANA', s: 'GABRIEL RUFIÁN · «DEFENSA\'T»', l: [
  ['SEGÚN LA PRENSA, PRESENTÓ SU PROGRAMA EL 5 DE NOVIEMBRE', 'prensa', 0], ['TRES EJES: EL PAÍS, LA GENTE Y LOS SERVICIOS PÚBLICOS', 'ejes', 0], ['NO HE PODIDO LEER EL DOCUMENTO: CUENTO LO QUE RECOGEN LOS MEDIOS', 'documento', -1]] }));
ESC.push(lista({ f: ['costa', 'atardecer'], t: 'ERC · DEFENDER EL PAÍS', l: [
  ['AUTODETERMINACIÓN PARA RESOLVER EL CONFLICTO CON EL ESTADO', 'autodeterminación', 0], ['EL CATALÁN Y EL MODELO DE INMERSIÓN LINGÜÍSTICA', 'catalán', 0], ['FINANCIACIÓN SINGULAR PARA CATALUÑA', 'financiación', 0]] }));
ESC.push(lista({ f: ['costa', 'atardecer'], t: 'ERC · LA GENTE Y LOS SERVICIOS', l: [
  ['UN SALARIO MÍNIMO CATALÁN', 'salario', 0], ['UN PLAN DE VIVIENDA', 'vivienda', 0], ['TRASPASO DE RODALIES', 'rodalies', 0], ['UNA NUEVA EMPRESA CATALANA PARA GESTIONAR EL SERVICIO', 'empresa', 0]] }));
// ============ JUNTS ============
ESC.push(lista({ f: ['lago', 'atardecer'], t: 'JUNTS', s: 'CANDIDATA: MÍRIAM NOGUERAS', l: [
  ['NO HE ENCONTRADO UN PROGRAMA PUBLICADO', 'programa', -1], ['HAY CONDICIONES PARA NEGOCIAR DESPUÉS DEL 29', 'condiciones', 0]] }));
ESC.push(lista({ f: ['lago', 'atardecer'], t: 'JUNTS · CONDICIONES', l: [
  ['QUE CATALUÑA RECAUDE TODOS LOS IMPUESTOS Y DECIDA CÓMO GASTARLOS', 'recaude', 0], ['COMPETENCIAS DE INMIGRACIÓN', 'inmigración', 0], ['CATALÁN OFICIAL EN LA UNIÓN EUROPEA', 'oficialidad', 0]] }));
ESC.push(lista({ f: ['lago', 'atardecer'], t: 'JUNTS · LA IDEA DE FONDO', l: [
  ['MIENTRAS CATALUÑA NO SEA INDEPENDIENTE, EN MADRID NO SE PUEDE DECIDIR NADA IMPORTANTE SIN CATALUÑA', 'fondo', 0]] }));
// ============ SALF ============
ESC.push(lista({ f: ['desierto', 'noche'], t: 'SE ACABÓ LA FIESTA', s: 'ALVISE PÉREZ', l: [
  ['CANDIDATURA ANUNCIADA EL 12 DE OCTUBRE DEL AÑO PASADO, EN VISTALEGRE', 'vistalegre', 0], ['5 OCT: CONFIRMA QUE CONCURRE, DE CABEZA DE LISTA POR MADRID', 'confirmó', 0], ['SEGÚN LA PRENSA, NO HAY UN PROGRAMA COMPLETO', 'completo', -1]] }));
ESC.push(lista({ f: ['desierto', 'noche'], t: 'SALF · PROPUESTAS', l: [
  ['PLAN DE DEPORTACIÓN MASIVA DE IRREGULARES, CON CARGO A FONDOS DE COOPERACIÓN', 'deportación', 0], ['UNA MACROCÁRCEL', 'macrocárcel', 0], ['CÓDIGO PENAL: QUE LA CORRUPCIÓN NO PRESCRIBA', 'prescriba', 0], ['ACABAR CON LA FINANCIACIÓN PÚBLICA DE LOS PARTIDOS', 'financiación', 0]] }));
ESC.push(lista({ f: ['desierto', 'noche'], t: 'SALF · IMPUESTOS Y VIVIENDA', l: [
  ['IRPF DEL 0 % PARA RENTAS BAJAS', 'irpf', 0], ['TODO EL SUELO URBANIZABLE, SALVO RAZONES OBJETIVAS', 'suelo', 0], ['DESALOJO INMEDIATO DE OKUPAS', 'okupas', 0], ['REFERÉNDUM SOBRE LA UNIÓN EUROPEA', 'referéndum', 0]] }));
// ============ POR TEMAS ============
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · VIVIENDA', l: [
  ['PSOE', 'DECRETOS APROBADOS Y PROMESA DE MANTENERLOS', 'psoe'], ['PP', '1 MILLÓN DE VIVIENDAS · OKUPAS EN 48 H', 'pp'], ['VOX', 'PRIORIDAD NACIONAL EN AYUDAS · MENOS TRABAS', 'vox'], ['FRENTE AMPLIO', 'EXPROPIAR A GRANDES PROPIETARIOS · CONTROLAR ALQUILERES', 'frente']] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · VIVIENDA', l: [
  ['PODEMOS', 'LA VIVIENDA NO PUEDE SER UN NEGOCIO', 'podemos'], ['ERC', 'UN PLAN DE VIVIENDA', 'esquerra'], ['SE ACABÓ LA FIESTA', 'TODO EL SUELO URBANIZABLE', 'fiesta'], ['JUNTS', 'SIN MEDIDAS DETALLADAS EN ESTA CAMPAÑA', 'junts', -1]] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · PENSIONES', l: [
  ['PSOE', 'IPC Y BLINDAJE EN LA CONSTITUCIÓN', 'psoe'], ['PP', 'SUBIRLAS CADA AÑO CONFORME AL IPC', 'pp'], ['VOX', '«SE VAN A PAGAR COMO SEA»', 'vox'], ['FRENTE AMPLIO', 'NO PERMITIRÁN CAMBIAR EL SISTEMA PÚBLICO', 'frente'], ['LOS OTROS CUATRO', 'SIN MEDIDA CONCRETA CONFIRMADA', 'cuatro', -1]] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · SALARIOS', l: [
  ['PSOE', 'SUBIR EL SALARIO MÍNIMO CADA AÑO', 'psoe'], ['PP', 'QUE SUBA EL SALARIO MEDIO, SIN CIFRAS', 'pp'], ['FRENTE AMPLIO', 'SEGUIR SUBIENDO EL MÍNIMO Y BAJAR LA JORNADA', 'frente'], ['PODEMOS', '1.800 € POR LEY Y 30 HORAS SEMANALES', 'podemos'], ['ERC', 'UN SALARIO MÍNIMO CATALÁN', 'esquerra']] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · IMPUESTOS', l: [
  ['PP', 'BAJARLOS, SIN CONCRETAR CUÁLES', 'pp', -1], ['VOX', 'IRPF DE 15 % Y 25 %', 'vox'], ['SE ACABÓ LA FIESTA', 'IRPF 0 % PARA RENTAS BAJAS', 'fiesta'], ['FRENTE AMPLIO', 'MÁS IMPUESTOS A ELÉCTRICAS E IA', 'frente'], ['JUNTS', 'CATALUÑA RECAUDA TODOS LOS SUYOS', 'junts']] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · INMIGRACIÓN Y SEGURIDAD', l: [
  ['VOX', 'REMIGRACIÓN: REPATRIAR Y DEPORTAR A DELINCUENTES', 'vox'], ['SE ACABÓ LA FIESTA', 'DEPORTACIÓN MASIVA Y MACROCÁRCEL', 'fiesta'], ['JUNTS', 'COMPETENCIAS DE INMIGRACIÓN PARA CATALUÑA', 'junts'], ['PP Y PSOE', 'SIN MEDIDA CONCRETA CONFIRMADA EN ESTOS ANUNCIOS', 'confirmar', -1]] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'POR TEMAS · SERVICIOS PÚBLICOS Y EUROPA', l: [
  ['PODEMOS', 'REFORZAR SANIDAD Y EDUCACIÓN PÚBLICAS', 'podemos'], ['ERC', 'TRASPASO DE RODALIES', 'esquerra'], ['FRENTE AMPLIO', 'DEFENDERLOS, SIN CONCRETAR', 'frente', -1], ['SE ACABÓ LA FIESTA', 'REFERÉNDUM SOBRE LA UE', 'referéndum'], ['JUNTS', 'CATALÁN OFICIAL EN LA UE', 'oficial'], ['PODEMOS', 'MENOS DEPENDENCIA DE LA OTAN', 'otan']] }));
ESC.push(rejilla({ f: ['montanas', 'noche'], t: 'LO QUE FALTA', c: COL.rojo, l: [
  ['PP', '¿QUÉ IMPUESTOS BAJARÍA?', 'pp', -1], ['PODEMOS', 'MEDIDAS SIN COSTES NI PLAZOS', 'podemos', -1], ['FRENTE AMPLIO', 'SERVICIOS PÚBLICOS SIN MEDIDAS CONCRETAS', 'frente', -1], ['JUNTS Y SE ACABÓ LA FIESTA', 'SIN PROGRAMA A LA VISTA', 'junts', -1]] }));
// ============ CIERRE ============
ESC.push(lista({ f: ['llanura', 'alba'], t: 'RESUMEN RÁPIDO', l: [
  ['DE LOS OCHO, NINGÚN PROGRAMA COMPLETO LEÍDO', 'ninguno', -1], ['ESQUERRA, SEGÚN LA PRENSA, YA LO HA PRESENTADO', 'esquerra', 0], ['LOS DEMÁS: EJES, DECRETOS Y PROMESAS EN ACTOS', 'ejes', 0], ['CUANDO SE PUBLIQUEN: LEER EL DOCUMENTO, NO SOLO EL TITULAR', 'titular', 1]] }));
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.55, 0.4);
  tit(esc, ctx, 'TU TURNO', COL.dorado);
  const a1 = tr(t, at(ctx, 'propuesta', 4), 0.5, E.elastico); tarjeta(esc, cx, z.cy - 40 * k, 1300 * k, 190 * k, a1, { borde: COL.cian }); texto(esc, '¿QUÉ PROPUESTA TE HA LLAMADO MÁS LA ATENCIÓN?', cx, z.cy - 40 * k, 46, '#fff', a1, 5);
  pastilla(esc, 'CUÉNTALO EN LOS COMENTARIOS', cx, z.cy + 120 * k, { a: tr(t, at(ctx, 'comentarios', 7), 0.5, E.atrasSalida), color: COL.verde, tam: 38 });
  pastilla(esc, '¿VÍDEO A FONDO DE CADA PARTIDO CUANDO SALGAN SUS PROGRAMAS? DÍMELO', cx, z.cy + 215 * k, { a: tr(t, at(ctx, 'dímelo', 4.5), 0.5, E.atrasSalida), color: COL.dorado, tam: 34 });
});
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  pastilla(esc, 'DALE LIKE · SUSCRÍBETE', cx, z.y + 120 * k, { a: tr(t, at(ctx, 'like', 0.4), 0.5, E.atrasSalida), color: COL.verde, tam: 44 });
  S.letrero(esc, t, at(ctx, 'randonáutico', 2.0));
});

VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 64 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: ESC
});
