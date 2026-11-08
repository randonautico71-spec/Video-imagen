/* DESPUES DEL 29N: los partidos que faltaban. LARGO 16:9, voz Juanjo (ElevenLabs).
   Estilo informativo neutral: sin logos ni colores de partido. Todo dato esta en datos.md con su fuente. */
const E = VE.ease, T = VE.tokens.SCALE, R = VE.real, tr = VE.tramo, lerp = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const S = VE.short, COL = S.COL, at = S.en, velo = S.velo;
const NAVY = 'rgba(8,14,32,0.88)';
const sp = (esc, px, fn) => { const x = esc.ctx; x.letterSpacing = px + 'px'; x.fontKerning = 'none'; try { return fn(); } finally { x.letterSpacing = '0px'; x.fontKerning = 'auto'; } };
const rotulo = (esc, ctx, ...a) => sp(esc, 5 * esc.k, () => S.rotulo(esc, ctx, ...a));
const pastilla = (esc, txt, cx, cy, o = {}) => sp(esc, 3 * esc.k, () => S.pastilla(esc, txt, cx, cy, Object.assign({}, o, { tam: (o.tam || 30) * 1.4 })));

function fondo(esc, ctx, tipo, hora, o = {}) {
  return R.paisaje(esc, ctx.tg, Object.assign({ tipo, hora, a: Math.min(1, 0.3 + ctx.t / 0.8), semilla: 'el29d', horizonte: 0.7, nubes: 3 }, o));
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

const L = (f, t, s, l, o = {}) => ESC.push(lista(Object.assign({ f, t, s, l }, o)));
function cita(f, quien, txt, kw) {
  return (esc, t, ctx) => {
    const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, f[0], f[1]); velo(esc, 0, esc.H * 0.9, 0.6, 0.45); tit(esc, ctx, quien, COL.dorado, 'LO QUE DIJO', COL.cian);
    const a = tr(t, at(ctx, kw, 2) - 0.2, 0.6, E.elastico), ls = lineas(txt, 34);
    tarjeta(esc, cx, z.cy + 140 * k, 1500 * k, 460 * k, a, { borde: COL.dorado }); texto(esc, '«', cx - 640 * k, z.cy - 40 * k, 150, COL.dorado, a, 0);
    ls.forEach((l, j) => texto(esc, l, cx, z.cy + 140 * k + (j - (ls.length - 1) / 2) * 80 * k + 40 * k, 54, '#fff', a, 6));
  };
}
// 1 gancho
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  const a1 = tr(t, 0.2, 0.6, E.elastico); tarjeta(esc, cx - 420 * k, z.cy, 700 * k, 560 * k, a1, { borde: COL.dorado }); gran(esc, '13', cx - 420 * k, z.cy - 60 * k, 320, COL.dorado, a1); texto(esc, 'ESCAÑOS EN 2023', cx - 420 * k, z.cy + 150 * k, 46, '#fff', a1, 5);
  ['PNV', 'EH BILDU', 'BNG', 'COALICIÓN CANARIA'].forEach((n, i) => { const a = tr(t, 1.2 + i * 0.8, 0.5, E.elastico), y = z.cy - 200 * k + i * 135 * k; tarjeta(esc, cx + 420 * k, y, 700 * k, 110 * k, a, { borde: COL.cian }); texto(esc, n, cx + 420 * k, y, n.length > 10 ? 40 : 52, '#fff', a, 5); });
  pastilla(esc, 'QUÉ HAN DICHO · QUÉ PROMETEN', cx, z.y2 - 70 * k, { a: tr(t, at(ctx, 'prometen', 8), 0.5, E.atrasSalida), color: COL.verde, tam: 30 });
});
L(['lago', 'dia'], 'LOS QUE FALTABAN', 'EN MI CANAL, EL VÍDEO ANTERIOR', [['PNV', 'pnv', 0], ['EH BILDU', 'bildu', 0], ['BNG', 'bng', 0], ['COALICIÓN CANARIA', 'coalición', 0], ['Y OTRAS CANDIDATURAS', 'candidaturas', 0, COL.cian]]);
// 3 cuentas 2023
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'montanas', 'noche'); velo(esc, 0, esc.H * 0.9, 0.6, 0.45); tit(esc, ctx, 'ESCAÑOS EN 2023', COL.dorado);
  const W = Math.min(z.w * 0.6, 1100 * k), x0 = cx - W / 2 + 260 * k, y0 = z.y + 300 * k, gap = 150 * k;
  [['PNV', 5, 'pnv', COL.verde], ['EH BILDU', 6, 'bildu', COL.rojo], ['BNG', 1, 'bng', COL.cian], ['COALICIÓN C.', 1, 'coalición', COL.dorado]].forEach(([n, v, kw, c], i) => barra(esc, x0, y0 + i * gap, W, 110 * k, v / 6, tr(t, at(ctx, kw, 2 + i * 2.2) - 0.1, 0.8, E.atrasSalida), c, n, String(v), k));
  pastilla(esc, 'TOTAL: 13', cx, z.y2 - 40 * k, { a: tr(t, at(ctx, 'trece', 11), 0.5, E.atrasSalida), color: COL.verde, tam: 36 });
});
L(['costa', 'dia'], 'PNV', '17 OCT · BILBAO', [['MARIBEL VAQUERO · GIPUZKOA', 'maribel', 0], ['IDOIA SAGASTIZABAL · BIZKAIA', 'idoia', 0], ['GORKA URTARAN · ÁLAVA', 'gorka', 0], ['LISTAS APROBADAS POR UNANIMIDAD', 'unanimidad', 1]]);
ESC.push(cita(['costa', 'dia'], 'PNV · AITOR ESTEBAN', 'EL ÚNICO PARTIDO POLÍTICO QUE HA EVITADO QUE VOX GOBIERNE EN EL ESTADO, CON SUS VOTOS', 'único'));
L(['costa', 'dia'], 'PNV · BALANCE', 'SEGÚN ESTEBAN', [['PACTO CON EL PSOE: «MÁS DE UN 75 %» CUMPLIDO', 'setenta', 0], ['CIFRA DEL PROPIO PARTIDO', 'propio', 0, COL.cian], ['NEGOCIACIÓN: RECONOCIMIENTO DE EUSKADI COMO NACIÓN', 'reconocimiento', 0], ['OFICIALIDAD DE LA SELECCIÓN VASCA DE PELOTA', 'pelota', 0]]);
L(['montanas', 'atardecer'], 'EH BILDU', '19 OCT · PRESENTA SU CANDIDATURA', [['OSKAR MATUTE · LISTA AL CONGRESO', 'matute', 0], ['IDURRE BIDEGUREN · LISTA AL SENADO', 'bideguren', 0], ['LISTAS RATIFICADAS: 97 % DE RESPALDO MEDIO', 'noventa', 1]]);
L(['montanas', 'atardecer'], 'EH BILDU · OTEGI', 'LO QUE DIJO', [['«LA IZQUIERDA NACIONAL VASCA POPULAR»', 'nacional', 0], ['«HARÁN IMPOSIBLE UN GOBIERNO AUTORITARIO EN EL ESTADO, SI ESTÁ EN SUS MANOS»', 'imposible', 0], ['PIDE EL VOTO EN ÁLAVA, BIZKAIA, GIPUZKOA Y NAVARRA', 'pidió', 0, COL.cian]]);
L(['llanura', 'dia'], 'BNG', '24 OCT · CONSEJO NACIONAL', [['NÉSTOR REGO · A CORUÑA', 'néstor', 0], ['CARME DA SILVA · PONTEVEDRA', 'carme', 0], ['NOA PRESAS · OURENSE', 'noa', 0], ['OLALLA RODIL · LUGO', 'olalla', 0]]);
L(['llanura', 'dia'], 'BNG · OBJETIVOS', 'SEGÚN ANA PONTÓN', [['AMPLIAR EL ÚNICO ESCAÑO Y GANAR PESO EN MADRID', 'ampliar', 0], ['PRIORIDAD: VIVIENDA', 'vivienda', 0, COL.cian], ['PRIORIDAD: FINANCIACIÓN', 'financiación', 0, COL.cian], ['PRIORIDAD: INFRAESTRUCTURAS', 'infraestructuras', 0, COL.cian]]);
L(['llanura', 'dia'], 'BNG · LO QUE ATRIBUYE A SUS DIPUTADOS', null, [['REBAJAS EN LA AP-9', 'rebajas', 0], ['MEJORAS FERROVIARIAS', 'ferroviarias', 0], ['JUZGADOS DE GÉNERO', 'juzgados', 0], ['MEJORAS EN PENSIONES', 'pensiones', 0], ['QUITA DE 4.000 MILLONES EN DEUDA PÚBLICA', 'quita', 0]]);
L(['desierto', 'atardecer'], 'COALICIÓN CANARIA', 'CRISTINA VALIDO · CANDIDATA AL CONGRESO', [['CANDIDATURA DE UNIDAD CANARIA CON PRIMERO CANARIAS', 'primero', 0], ['PARA EL 29 DE NOVIEMBRE', 'veintinueve', 0, COL.cian]]);
L(['desierto', 'atardecer'], 'CC · PACTOS', 'SEGÚN VALIDO', [['ACUERDO POSIBLE CON PP O PSOE', 'acuerdo', 1], ['CON VOX: «NO PODEMOS FIRMAR NADA»', 'vox', -1], ['SU POSICIÓN, EL 30 DE NOVIEMBRE', 'treinta', 0, COL.cian]]);
L(['desierto', 'atardecer'], 'CC · AGENDA CANARIA', null, [['CUMPLIR LA AGENDA CANARIA DE 2023', 'agenda', 0], ['ENERGÍA · OBRAS HIDRÁULICAS · EDUCACIÓN', 'energía', 0], ['PARTICIPAR EN LA GESTIÓN DE AEROPUERTOS', 'aeropuertos', 0], ['MANTENER LAS AYUDAS DEL POSEI', 'posei', 0]]);
L(['desierto', 'atardecer'], 'CC · MÁS PETICIONES', null, [['EL ESTADO, CON LOS MENORES CON DERECHO A ASILO', 'menores', 0], ['MÁS MEDIOS DE SALVAMENTO MARÍTIMO', 'salvamento', 0], ['TURISMO: LÍMITE DE CARGA POBLACIONAL, CALIDAD', 'turismo', 0], ['SIN TASA DE BASURAS PARA CANARIAS', 'basuras', -1]]);
L(['montanas', 'dia'], 'TERUEL EXISTE', 'OTRAS CANDIDATURAS', [['TOMÁS GUITARTE, CABEZA DE LISTA', 'guitarte', 0], ['OBJETIVO: RECUPERAR UN ESCAÑO', 'recuperar', 0, COL.cian], ['PROPUESTA «ARAGONESISTA»: LA VOZ DEL TERRITORIO EN MADRID', 'aragonesista', 0]]);
ESC.push(rejilla({ f: ['montanas', 'dia'], t: 'DOS DATOS MÁS', l: [
  ['ALIANÇA CATALANA', 'No se presenta', 'aliança', -1], ['SÍLVIA ORRIOLS', '«No es conseguir sillas en la metrópoli»', 'orriols', 0], ['DEMOCRACIA 21', 'Miriam González la presenta', 'miriam', 0], ['SU FRASE', '«Venimos a limpiar España y a modernizarla»', 'venimos', 0]] }));
ESC.push(rejilla({ f: ['lago', 'dia'], t: 'RESUMEN', l: [
  ['PNV', 'El freno a Vox', 'pnv', 0], ['EH BILDU', 'La izquierda soberanista', 'bildu', 0], ['BNG', 'Vivienda y financiación', 'bng', 0], ['COALICIÓN CANARIA', 'La agenda canaria', 'coalición', 0]] }));
ESC.push((esc, t, ctx) => {
  const z = ctx.zonas.cuerpo, cx = z.cx, k = esc.k; fondo(esc, ctx, 'llanura', 'alba'); velo(esc, 0, esc.H * 0.9, 0.5, 0.45);
  const a = tr(t, at(ctx, 'cuéntame', 4), 0.5, E.elastico); tarjeta(esc, cx, z.cy - 60 * k, 1400 * k, 300 * k, a, { borde: COL.dorado });
  texto(esc, '¿DE QUÉ PARTIDO QUIERES', cx, z.cy - 100 * k, 56, '#fff', a, 6); texto(esc, 'UN VÍDEO A FONDO?', cx, z.cy - 25 * k, 56, COL.dorado, a, 6);
  pastilla(esc, 'DALE LIKE · SUSCRÍBETE', cx, z.cy + 230 * k, { a: tr(t, at(ctx, 'like', 8), 0.5, E.atrasSalida), color: COL.verde, tam: 44 });
  S.letrero(esc, t, at(ctx, 'randonáutico', 10));
});
VE.proyecto({
  estilo: 'LAB', lint: { negro: true },
  subtitulos: { palabras: 4, tam: 64 },
  transicion: { entrada: 0.28, salida: 0.18 },
  escenas: ESC
});
