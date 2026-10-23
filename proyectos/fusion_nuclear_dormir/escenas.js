/* FUSION NUCLEAR PARA DORMIR — 7 capitulos, 67 parrafos. Mismo estilo que «Fisica cuantica para dormir»: fondo oscuro, trazos de luz,
   cada parrafo dibuja lo que se dice AHORA, sin subtitulos. Figuras en biblioteca3 y biblioteca4. */
const M = VE.med, T = VE.trazo, PI = Math.PI, c01 = (v) => Math.max(0, Math.min(1, v)), E = (v) => VE.ease.suave(c01(v)), lerp = (a, b, t) => a + (b - a) * t;
const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', RO = '#FF8FC0', VD = '#5BE07A', BL = '#EAF4FF', AM = '#FFB86B', GR = '#9FB6E8';
const PA = VE.paisaje;
const cresta = (semilla, y, alto, freq, color, brillo, tinte) => ({ semilla, y, alto, freq, exp: 1.6, color, brillo, tinte });
const LOC = (esc, fig, ux, uy, tam, lx, ly) => { const p = T.mapear(fig, { x: ux * esc.W, y: uy * esc.H, tam }, [lx, ly]); return [p[0] / esc.W, p[1] / esc.H]; };

// ---------- fondos oscuros, uno por capitulo ----------
const lago = (esc, tg, a) => { const W = esc.W, H = esc.H, yh = .68;
  PA.cielo(esc, tg, { modo: 'noche', estrellas: .8 * c01(a * 2), niebla: .3, astro: { tipo: 'luna', x: W * .72, y: H * .22, r: 70, prog: c01(a * 1.5) }, fugaces: 0 });
  const capas = [cresta('fl1', .60, .22, 3.2, '#6C7CD8', .5, 'rgba(40,50,130,.4)'), cresta('fl2', .66, .12, 4.8, '#5C8CC8', .6, 'rgba(6,16,50,.85)')];
  PA.cordillera(esc, tg, { clave: 'fq', capas, a }); PA.reflejo(esc, tg, { clave: 'fq', yh, capas, a });
  M.agua(esc, tg, { y: H * yh, alto: H * (1 - yh), color: '#4D88D8', reflejoX: W * .72, reflejoColor: '#F4E9B8', alfa: c01(a * 1.6), n: 40 });
  M.bruma(esc, tg, { y: H * .68, alto: 140, color: '#9FA8E8', alfa: .10 * a }); };
const calido = (esc, a) => { const x = esc.ctx; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .22 * a; x.drawImage(esc.cache.halo(256, '#FF8A3C', .4), esc.W * .1, esc.H * .25, esc.W * .8, esc.H * .9); x.restore(); };
const AMB = [
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'noche', estrellas: .6 * c01(t / 6), niebla: .3 }),
  (esc, t, ctx) => { M.fondo(esc, ctx.tg, { modo: 'negro', estrellas: .6 * c01(t / 6), niebla: .35 }); calido(esc, c01(t / 8)); },
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'noche', estrellas: .4 * c01(t / 6), niebla: .4 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'aurora', estrellas: .4 * c01(t / 6), niebla: .35 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'noche', estrellas: .5 * c01(t / 6), niebla: .4 }),
  (esc, t, ctx) => M.fondo(esc, ctx.tg, { modo: 'negro', estrellas: .7 * c01(t / 6), niebla: .3 }),
  (esc, t, ctx) => lago(esc, ctx.tg, c01(t / 10)),
];

// ---------- piezas reutilizables ----------
const sube = (c, nombre, ux, uy, tam, en, o = {}) => c.fig(nombre, ux, uy, tam, Object.assign({ en, dur: 3 }, nombre === 'nube_prob' ? { brillo: .5, chispas: 0 } : nombre === 'uranio' ? { brillo: .4, chispas: 0 } : {}, o));
const flecha = (c, a, b, en, col) => c.linea([a, b], col || GR, c.p(en, 2), { grosor: 2, brillo: .6 });
// Fusion animada: deuterio y tritio se acercan, destello, y salen helio (se queda) y neutron (sale veloz). Ciclo de 9 s desde t0.
const fusion = (c, ux, uy, t0, tam = 230) => { const s = c.tp - t0; if (s < 0) return; const u = (s % 9) / 9, fi = E(s / 1.5);
  if (u < .5) { const q = E(u / .5), dx = lerp(.25, .03, q); c.fig('deuterio', ux - dx, uy, tam, { fijo: true, alfa: fi, chispas: 0 }); c.fig('tritio', ux + dx, uy, tam, { fijo: true, alfa: fi, chispas: 0 }); }
  else { const q = (u - .5) / .5, f = Math.max(0, 1 - (u - .5) / .12);
    c.glow(ux, uy, 120 + 260 * f, '#FFF0B0', { alfa: f, dureza: .3 }); c.fig('helio4', ux - .04 - .05 * q, uy + .02 * q, tam * 1.05, { fijo: true, alfa: c01(q * 8) * (1 - E((q - .8) / .2)), chispas: 0 });
    c.fig('neutron', ux + .02 + .38 * q, uy - .12 * q, tam * .5, { fijo: true, alfa: c01(q * 8) * (1 - E((q - .75) / .25)), chispas: 0 }); } };
const paso = (c, nombre, ux, uy, tam, en, lx, ly, u, col) => { const p = LOC(c.esc, nombre, ux, uy, tam, lx, ly); c.glow(p[0], p[1], 36, col || ORO, { en }); };
const anillo = (c, nombre, ux, uy, tam, cx, cy, rx, ry, vel, col, en, n = 1) => { for (let i = 0; i < n; i++) { const a = c.tg * vel + i * PI * 2 / n, p = LOC(c.esc, nombre, ux, uy, tam, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); c.glow(p[0], p[1], 42, col, { en }); } };

const A = [];
// ===== I. La energia y la idea (1-9) =====
A[0] = [
  (c) => { c.fig('meditando', .5, .56, 420, { dur: 4 }); c.anillos(.5, .56, { r0: 300, r1: 430, n: 3, en: 1 }); c.motas(); },
  (c) => { sube(c, 'cama', .5, .6, 560, 'cuerpo'); sube(c, 'respiro', .5, .3, 300, 'respira'); c.glow(.5, .6, 380, '#6C8CFF', { en: 'peso', alfa: .25 }); },
  (c) => { fusion(c, .5, .5, 2.5, 250); sube(c, 'estrella', .5, .14, 130, 'Sol', { chispas: 3 }); },
  (c) => { c.puntos([[.1, .5, 'energía', AM], [.26, .5, 'fusión', ORO], [.42, .5, 'fuerzas', RO], [.58, .5, 'combustible', VD], [.74, .5, 'conseguido', AZ], [.9, .5, 'descansaremos', VI]], { r: 56 }); c.linea([[.1, .5], [.9, .5]], GR, c.p('energía', 28), { brillo: .5 }); },
  (c) => { sube(c, 'lampara', .13, .5, 300, 'lámpara'); sube(c, 'llama', .37, .5, 270, 'caliente'); sube(c, 'engranaje', .62, .5, 290, 'movimiento'); sube(c, 'casa', .87, .5, 290, 'invierno'); },
  (c) => { sube(c, 'llama', .1, .5, 240, 'leña'); sube(c, 'chimenea', .3, .5, 260, 'petróleo'); sube(c, 'aerogenerador', .5, .5, 260, 'viento'); sube(c, 'gota', .7, .5, 220, 'agua'); sube(c, 'sol', .9, .5, 230, 'Sol'); },
  (c) => { sube(c, 'sol', .5, .48, 560, 'Sol', { dur: 5 }); c.anillos(.5, .48, { r0: 330, r1: 450, n: 3, en: 'fusión' }); },
  (c) => { sube(c, 'estrella', .26, .5, 330, 'estrella'); sube(c, 'tokamak', .74, .5, 420, 'botella'); c.linea(c.curva([.34, .5], [.5, .36], [.62, .5]), '#FFE9A8', c.p('botella', 3), { brillo: .6 }); },
  (c) => { sube(c, 'respiro', .5, .5, 520, 0.5, { dur: 4 }); c.ondas(.5, .5, { en: 1, r0: 80, r1: 420, color: '#BFE8FF', vel: .1 }); },
];
// ===== II. Que es la fusion (10-19) =====
A[1] = [
  (c) => { sube(c, 'atomo', .3, .5, 440, 'átomos'); sube(c, 'nucleo', .72, .5, 420, 'núcleo'); flecha(c, [.42, .5], [.58, .5], 'centro'); },
  (c) => { sube(c, 'hidrogeno', .2, .5, 340, 'hidrógeno'); sube(c, 'uranio', .8, .5, 340, 'uranio'); sube(c, 'balanza', .5, .6, 220, 'extremos'); },
  (c) => { sube(c, 'uranio', .2, .5, 300, 'fisión'); flecha(c, [.32, .5], [.4, .5], 'fisión'); sube(c, 'deuterio', .6, .5, 240, 'fusión'); sube(c, 'tritio', .84, .5, 240, 'fusión'); c.linea([[.5, .2], [.5, .8]], GR, c.p(.5, 2), { brillo: .3 }); },
  (c) => { sube(c, 'balanza', .5, .5, 560, .6); c.glow(.5, .3, 160, ORO, { en: 'energía', alfa: .35 }); },
  (c, esc) => { esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; const p = c.p('ecuación', 2); M.texto(esc, 'E = m c²', { x: esc.W * .5, y: esc.H * .46, tam: 190, prog: p, color: '#FFE9A8', alfa: 1, peso: 500 }); esc.ctx.restore(); c.glow(.5, .46, 360, ORO, { en: 'ecuación', alfa: .22 }); },
  (c) => { sube(c, 'sol', .2, .5, 340, 'Sol'); fusion(c, .62, .5, 4, 200); },
  (c) => { sube(c, 'termometro', .28, .5, 420, 'temperatura'); sube(c, 'sol', .72, .5, 400, 'Sol'); c.glow(.72, .5, 260, ORO, { en: 'centro', alfa: .25 }); },
  (c) => { sube(c, 'atomo', .24, .5, 320, 'gas'); flecha(c, [.36, .5], [.5, .5], 'electrones'); c.motas({ n: 44, zona: { x: c.W * .54, y: c.H * .25, w: c.W * .38, h: c.H * .5 }, color: '#FFC8A0', alfa: .85, sube: 14 }); c.glow(.72, .5, 200, AZ, { en: 'sopa', alfa: .22 }); },
  (c) => { sube(c, 'rayo', .17, .5, 300, 'rayo'); sube(c, 'tubo', .45, .5, 420, 'fluorescente'); sube(c, 'estrella', .78, .5, 300, 'estrella'); },
  (c) => { sube(c, 'sol', .5, .5, 440, 'gravedad'); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, u = (c.tg * .25 + i * .13) % 1, r0 = 380 - 90 * u, r1 = r0 - 60; c.linea([[.5 + Math.cos(a) * r0 / c.W, .5 + Math.sin(a) * r0 / c.H], [.5 + Math.cos(a) * r1 / c.W, .5 + Math.sin(a) * r1 / c.H]], GR, c.p('gravedad', 1) * Math.sin(u * PI), { grosor: 2.4 }); } },
];
// ===== III. Fuerzas y proceso (20-30) =====
A[2] = [
  (c) => { const q = .5 + .5 * Math.sin(c.tg * .9), dx = lerp(.27, .16, q); sube(c, 'proton', .5 - dx, .5, 250, 'carga'); sube(c, 'proton', .5 + dx, .5, 250, 'carga'); c.ondas(.5, .5, { en: 'repelen', r0: 20, r1: 190, color: '#FF8FC0', vel: .3 }); },
  (c) => { sube(c, 'proton', .36, .5, 280, 'repulsión'); sube(c, 'proton', .64, .5, 280, 'repulsión'); const s = E((c.tp - 3) / 6); c.glow(.5, .5, 60 + 200 * s, RO, { en: 'cerca', alfa: .6 }); flecha(c, [.12, .5], [.26, .5], 'velocidad', AM); flecha(c, [.88, .5], [.74, .5], 'velocidad', AM); },
  (c) => { sube(c, 'deuterio', .5, .5, 600, .8, { dur: 4 }); c.glow(.5, .5, 340, ORO, { en: 'pegamento', alfa: .22 }); c.anillos(.5, .5, { r0: 300, r1: 420, n: 3, en: 'unen' }); },
  (c) => { sube(c, 'colina', .5, .5, 700, 'colina', { dur: 4 }); const pts = [[12, 80], [22, 60], [32, 40], [40, 30], [50, 40]], u = c01((c.tp - 6) / 10) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(u)), f = u - i; const p = LOC(c.esc, 'colina', .5, .5, 700, lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)); c.glow(p[0], p[1] - .02, 36, ROSA_(), { en: 'colina' }); },
  (c) => { sube(c, 'tunel', .5, .54, 640, 'túnel', { dur: 4 }); const u = (c.tp * .09) % 1, p = LOC(c.esc, 'tunel', .5, .54, 640, lerp(14, 86, u), 78); c.glow(p[0], p[1], 36, ORO, { en: 'túnel', alfa: Math.sin(u * PI) }); },
  (c) => { sube(c, 'sol', .14, .5, 240, 'gravedad'); sube(c, 'neutron', .38, .5, 220, 'débil'); sube(c, 'proton', .62, .5, 220, 'eléctrica'); sube(c, 'deuterio', .86, .5, 240, 'fuerte'); c.linea([[.08, .74], [.92, .74]], GR, c.p('cuatro', 4), { brillo: .4 }); },
  (c) => { sube(c, 'tierra', .2, .5, 300, 'Tierra'); sube(c, 'iman', .5, .5, 340, 'solución'); sube(c, 'termometro', .8, .5, 360, 'calentarlo'); },
  (c) => { sube(c, 'hidrogeno', .17, .5, 290, 'hidrógeno'); sube(c, 'deuterio', .5, .5, 300, 'deuterio'); sube(c, 'tritio', .83, .5, 300, 'tritio'); },
  (c) => { fusion(c, .5, .5, 1.2, 280); },
  (c) => { sube(c, 'termometro', .26, .5, 420, 'cien'); sube(c, 'tokamak', .72, .5, 480, 'ITER'); },
  (c) => { sube(c, 'respiro', .5, .5, 400, 'Respira'); c.motas({ n: 18, color: '#CFE3FF', alfa: .5 }); },
];
function ROSA_() { return '#FF8FC0'; }
// ===== IV. El combustible (31-39) =====
A[3] = [
  (c) => { sube(c, 'ola', .26, .5, 420, 'agua'); sube(c, 'deuterio', .74, .5, 320, 'deuterio'); for (let i = 0; i < 6; i++) c.glow(.18 + i * .045, .52 + (i % 2) * .05, 26, ORO, { en: 'miligramos', alfa: .9 }); },
  (c) => { sube(c, 'tritio', .3, .5, 400, 'tritio'); sube(c, 'cronometro', .72, .5, 380, 'doce'); c.glow(.3, .5, 240, AM, { en: 'radiactivo', alfa: .16 }); },
  (c) => { sube(c, 'neutron', .12, .5, 170, 'neutrón'); sube(c, 'litio', .32, .5, 340, 'litio'); flecha(c, [.46, .5], [.54, .5], 'transforma'); sube(c, 'helio4', .64, .5, 230, 'helio'); sube(c, 'tritio', .86, .5, 230, 'tritio'); },
  (c) => { sube(c, 'tokamak', .3, .52, 520, 'reactor'); c.anillos(.3, .52, { r0: 290, r1: 330, n: 1, en: 'litio', color: '#5BE07A', brillo: .8 }); sube(c, 'turbina', .64, .5, 280, 'turbinas', { rot: c.tg * .6 }); sube(c, 'lampara', .86, .5, 260, 'electricidad'); flecha(c, [.46, .5], [.54, .5], 'calor', AM); },
  (c) => { sube(c, 'ciclo', .5, .5, 540, 'autosuficiencia', { dur: 4, rot: c.tg * .08 }); sube(c, 'tritio', .5, .5, 190, 'tritio'); },
  (c) => { sube(c, 'clip', .16, .5, 260, 'gramo'); for (let i = 0; i < 8; i++) sube(c, 'barril', .4 + (i % 4) * .13, .38 + Math.floor(i / 4) * .26, 190, 'toneladas', { dur: 1.5, esc: false }); },
  (c) => { sube(c, 'globo', .28, .5, 330, 'globos'); sube(c, 'helio4', .7, .5, 300, 'helio'); },
  (c) => { const f = 1 - E((c.tp - 8) / 10); sube(c, 'llama', .5, .5, 520, 'enfría', { alfa: Math.max(.08, f) }); c.glow(.5, .5, 260 * f + 40, AM, { en: 'enfría', alfa: .3 * f }); },
  (c) => { sube(c, 'muro_neutrones', .5, .5, 560, 'neutrones'); c.glow(.66, .5, 200, AZ, { en: 'residuos', alfa: .12 }); },
];
// ===== V. Lo que se ha conseguido (40-53) =====
A[4] = [
  (c) => { sube(c, 'tokamak', .5, .5, 640, 'plasma', { dur: 4 }); anillo(c, 'tokamak', .5, .5, 640, 50, 56, 32, 15, .8, AM, 'plasma', 3); },
  (c) => { sube(c, 'termometro', .2, .5, 340, 'caliente'); sube(c, 'nube_prob', .5, .5, 330, 'denso'); sube(c, 'cronometro', .8, .5, 320, 'tiempo'); },
  (c) => { sube(c, 'iman', .27, .5, 440, 'imanes'); sube(c, 'campo', .73, .5, 440, 'jaula'); c.glow(.73, .5, 80, AM, { en: 'flota', alfa: .6 }); },
  (c) => { sube(c, 'tokamak', .5, .5, 760, 'rosquilla', { dur: 4 }); anillo(c, 'tokamak', .5, .5, 760, 50, 56, 32, 15, 1.1, '#FFE9A8', 'rosquilla', 2); },
  (c) => { sube(c, 'estelerador', .5, .5, 760, 'estelerador', { dur: 4 }); anillo(c, 'estelerador', .5, .5, 760, 50, 52, 40, 15, 1.0, '#FFE9A8', 'estelerador', 2); },
  (c) => { const p = .5 + .5 * Math.sin(c.tg * 2); sube(c, 'capsula_laser', .5, .5, 600, 'láser', { dur: 4 }); c.glow(.5, .5, 70 + 90 * p, '#FFF0B0', { en: 'comprime', alfa: .5 + .3 * p }); },
  (c) => { sube(c, 'capsula_laser', .28, .5, 460, 'láseres'); sube(c, 'barras_q', .72, .5, 440, 'megajulios'); },
  (c) => { sube(c, 'barras_q', .22, .5, 340, 'ignición'); sube(c, 'bateria', .52, .5, 300, 'electricidad'); sube(c, 'estrella', .82, .5, 300, 'récord', { chispas: 4 }); },
  (c) => { sube(c, 'tokamak', .3, .52, 480, 'máquina'); sube(c, 'cronometro', .74, .5, 340, 'segundos'); c.glow(.3, .52, 240, AM, { en: 'megajulios', alfa: .18 }); },
  (c) => { sube(c, 'cronometro', .22, .5, 320, 'China'); sube(c, 'cronometro', .56, .5, 400, 'Francia'); sube(c, 'termometro', .86, .5, 300, 'cincuenta'); },
  (c) => { sube(c, 'estelerador', .5, .5, 640, 'estelerador', { dur: 4 }); sube(c, 'cronometro', .86, .22, 220, 'cuarenta'); },
  (c) => { sube(c, 'mundo_unido', .16, .5, 300, 'países'); sube(c, 'tokamak', .52, .5, 560, 'ITER'); sube(c, 'barras_q', .88, .5, 260, 'diez'); },
  (c) => { sube(c, 'barras_q', .3, .5, 480, 'cincuenta'); sube(c, 'llama', .62, .5, 270, 'térmica'); sube(c, 'lampara', .86, .5, 270, 'electricidad', { alfa: .35 }); },
  (c) => { sube(c, 'calendario', .27, .5, 340, 'cuatro'); flecha(c, [.4, .5], [.6, .5], 'nueve', AM); sube(c, 'calendario', .73, .5, 340, 'nueve'); sube(c, 'tokamak', .5, .2, 190, 'investigación'); },
];
// ===== VI. Lo que falta (54-60) =====
A[5] = [
  (c) => { sube(c, 'cronometro', .26, .5, 420, 'horas'); sube(c, 'estrella', .74, .5, 400, 'estrella'); c.glow(.74, .5, 260, ORO, { en: 'tranquila', alfa: .22 }); },
  (c) => { sube(c, 'barras_q', .2, .5, 340, 'ganancia'); sube(c, 'lampara', .5, .5, 300, 'electricidad'); sube(c, 'casa', .8, .5, 300, 'red'); },
  (c) => { sube(c, 'muro_neutrones', .3, .5, 460, 'materiales'); sube(c, 'termometro', .72, .5, 380, 'calor'); },
  (c) => { sube(c, 'ciclo', .26, .5, 400, 'combustible', { rot: c.tg * .08 }); sube(c, 'engranaje', .74, .5, 400, 'ingeniería', { rot: -c.tg * .15 }); },
  (c) => { sube(c, 'pared_ruta', .5, .5, 760, 'imposible', { dur: 4 }); c.glow(.78, .36, 120, ORO, { en: 'avances', alfa: .4 }); sube(c, 'mundo_unido', .86, .8, 180, 'mundo'); },
  (c) => { sube(c, 'sol', .28, .5, 400, 'estrella'); sube(c, 'tokamak', .72, .5, 440, 'imanes'); c.linea(c.curva([.38, .5], [.5, .34], [.62, .5]), '#FFE9A8', c.p('imanes', 3), { brillo: .6 }); },
  (c) => { sube(c, 'mundo_unido', .5, .5, 520, 'países'); c.ondas(.5, .5, { en: 'cooperación', r0: 200, r1: 440, color: '#CFE3FF', vel: .06, alfa: .5 }); },
];
// ===== VII. Descanso (61-67) =====
A[6] = [
  (c) => { sube(c, 'estrella', .36, .3, 330, 'Sol', { chispas: 3 }); c.glow(.36, .3, 280, ORO, { en: 'Sol', alfa: .3 }); },
  (c) => { sube(c, 'estrella', .22, .36, 260, 'centro'); c.linea(c.curva([.3, .38], [.5, .26], [.7, .46]), '#FFE9A8', c.p('muchísimo', 5), { brillo: .6 }); sube(c, 'meditando', .8, .44, 260, 'aquí'); },
  (c) => { const s = .5 + .5 * Math.sin(c.tp * .7); c.glow(.5, .46, 120 + 130 * s, '#BFE8FF', { en: 'respiración', dureza: .3, alfa: .6 }); sube(c, 'respiro', .5, .46, 340, 'luz'); },
  (c) => { sube(c, 'estrella', .3, .32, 260, 'estrellas'); sube(c, 'meditando', .7, .44, 300, 'cuerpo'); c.linea(c.curva([.38, .36], [.5, .26], [.62, .44]), '#FFE9A8', c.p('estrellas', 4), { brillo: .6 }); c.motas({ n: 16, color: '#FFE9A8', alfa: .45 }); },
  (c) => { c.ondas(.5, .84, { en: 'lago', r0: 30, r1: 360, vel: .06, color: '#CFE3FF', alfa: .5 }); c.glow(.72, .22, 160, '#F4E9B8', { en: 'luna', alfa: .3 }); },
  (c) => { sube(c, 'meditando', .5, .44, 360, 'cuerpo'); sube(c, 'nube_prob', .5, .41, 540, 'cuerpo', { alfa: .4, dur: 4 }); c.motas({ n: 18, color: '#9FD8FF', alfa: .4 }); },
  (c) => { const s = .5 + .5 * Math.sin(c.tp * .5); c.anillos(.5, .5, { r0: 150, r1: 330, n: 3, en: .5, ciclo: [5, 2, 6] }); c.glow(.5, .5, 160 + 80 * s, '#BFE8FF', { en: 'Respira', alfa: .45 }); },
];

VE.proyecto({
  estilo: M.estilo('negro'), progreso: false, subtitulos: false, lint: { negro: true }, transicion: { entrada: 1.8, salida: 1.8 },
  capitulos: A.map((pars, i) => ({ parrafos: pars.length, nombre: 'cap' + (i + 1), dibujar: (esc, t, ctx) => { AMB[i](esc, t, ctx); const c = VE.comp(esc, ctx); pars[ctx.parrafo](c, esc, ctx); } })),
});
