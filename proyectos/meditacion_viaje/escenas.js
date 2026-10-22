/* MEDITACION — un viaje hacia ti y hacia tu entorno. 9 actos (capitulos) x 12 parrafos. Sin subtitulos.
   Cada parrafo dibuja lo que se dice AHORA: los elementos aparecen al pronunciar su palabra (en:'palabra') y se desvanecen al terminar el parrafo.
   Estilo: luz sin relleno; el color de cada trazo sale del color real del objeto. */
const M = VE.med, T = VE.trazo, PI = Math.PI, c01 = (v) => Math.max(0, Math.min(1, v)), E = (v) => VE.ease.suave(c01(v)), lerp = (a, b, t) => a + (b - a) * t;
const ORO = '#FFC84A', AZ = '#6CC8FF', VI = '#B88CFF', RO = '#FF8FC0', VE_ = '#5BE07A', BL = '#EAF4FF', AM = '#FFB86B';
const ACTOS_TITULO = [['I', '¿Qué es la meditación?'], ['II', 'Conecta con tus puntos vitales'], ['III', 'Beneficios reales de meditar'], ['IV', 'Buscando a las fuerzas naturales'], ['V', 'Buscándote a ti'],
  ['VI', 'Encontrando animales salvajes'], ['VII', 'Tu espíritu y tú'], ['VIII', 'Tu camino'], ['IX', 'El aprendizaje, la brújula y la meta']];

// punto anatomico de la figura 'meditando' (fracciones de pantalla), para anclar brillos al cuerpo
const CUERPO = (esc) => ({ x: esc.W * 0.5, y: esc.H * 0.57, tam: 620 });
const PT = (esc, parte) => { const loc = { cabeza: [50, 14], corazon: [53, 46], vientre: [50, 57], manoI: [26, 70], manoD: [74, 70] }[parte], p = T.mapear('meditando', CUERPO(esc), loc); return [p[0] / esc.W, p[1] / esc.H]; };
const ecgTraje = (esc) => esc.H;

// ---------- PAISAJES (uno por acto, con profundidad): persisten durante todo el acto y se construyen de lejos a cerca ----------
const PA = VE.paisaje;
const cresta = (semilla, y, alto, freq, color, brillo, tinte, nieve, exp) => ({ semilla, y, alto, freq, exp: exp || 1.6, color, brillo, tinte, nieve });

// Lago de montana con reflejo. v: {modo, aurora, luna, nube, lotos}
const lago = (esc, tg, a, v) => { const W = esc.W, H = esc.H, yh = 0.66, f = (x) => c01(a * x);
  PA.cielo(esc, tg, { modo: v.modo, estrellas: .85 * f(2), niebla: .4, aurora: v.aurora && { intensidad: .5 * f(1.4), colores: v.aurora }, nubes: { n: 3, y: H * .2, color: v.nube || '#B8A8E8', alfa: .13 * a }, astro: v.luna && { tipo: 'luna', x: W * .72, y: H * .22, r: 78, prog: f(1.5) }, fugaces: 13 });
  const capas = [cresta('lm1', .56, .30, 3.0, v.c1 || '#8C9CFF', .6, 'rgba(70,80,170,.30)', .6), cresta('lm2', .61, .20, 4.3, v.c2 || '#7FA6E8', .75, 'rgba(34,54,120,.55)', .7), cresta('lm3', .655, .11, 6.2, v.c3 || '#6CC0D8', .9, 'rgba(4,14,40,.88)')];
  PA.cordillera(esc, tg, { clave: 'lago' + v.modo, capas, a }); PA.reflejo(esc, tg, { clave: 'lago' + v.modo, yh, capas, a });
  M.agua(esc, tg, { y: H * yh, alto: H * (1 - yh), color: v.agua || '#4DB8FF', reflejoX: v.luna ? W * .72 : undefined, reflejoColor: '#F4E9B8', alfa: f(1.6), n: 50 });
  M.bruma(esc, tg, { y: H * .655, alto: 150, color: v.bruma || '#B8B8F0', alfa: .14 * a }); PA.orilla(esc, tg, { clave: 'lago' + v.modo, a, color: v.junco });
  if (v.lotos) [[.2, .8, 200], [.34, .86, 260], [.66, .83, 240], [.82, .79, 190]].forEach(([x, y, t], i) => T.dibujar(esc, 'loto', { x: x * W, y: y * H, tam: t, modo: 'luz', progreso: E(a * 2 - i * .3), t: tg, brillo: .8, chispas: 4, semilla: 'lt' + i, pulso: { f: .14 + i * .01, a: .1 } }));
  M.luciernagas(esc, tg, { n: 8, zona: { x: 0, y: H * .7, w: W, h: H * .25 }, alfa: f(2) * .9, semilla: 'lg' + v.modo }); };

// Pradera con colinas, matas, flores y un arbol solitario. v: {modo, astro, dim, flores}
const pradera = (esc, tg, a, v) => { const W = esc.W, H = esc.H, f = (x) => c01(a * x), x = esc.ctx; x.save(); if (v.dim) x.globalAlpha *= v.dim;
  PA.cielo(esc, tg, { modo: v.modo, estrellas: (v.estrellas == null ? .8 : v.estrellas) * f(2), niebla: .3, nubes: { n: 4, y: H * .22, color: v.nube || '#8FA6D8', alfa: .14 * a }, astro: v.astro, fugaces: v.estrellas === 0 ? 0 : 14 });
  PA.cordillera(esc, tg, { clave: 'pr' + v.modo, a, capas: [cresta('pr1', .6, .24, 3.4, v.c0 || '#6C8CFF', .5, 'rgba(60,70,150,.30)', .65)] });
  PA.colinas(esc, tg, { clave: 'pr' + v.modo, a, capas: [{ semilla: 'ph1', y: .66, amp: .12, freq: 2.0, color: v.c1 || '#7FA6E8', brillo: .7, tinte: 'rgba(24,40,100,.55)' }, { semilla: 'ph2', y: .74, amp: .10, freq: 2.6, color: v.c2 || '#8FD0C8', brillo: .8, tinte: 'rgba(6,20,40,.8)' }, { semilla: 'ph3', y: .83, amp: .08, freq: 3.2, color: v.c3 || '#6EDC8A', brillo: .9, tinte: 'rgba(2,8,16,.92)' }] });
  PA.bosque(esc, tg, { clave: 'prarb' + v.modo, a, deriva: 6, capas: [{ y: .72, tam: 250, n: 2, brillo: .55, color: v.arbol || '#6EDC8A', figuras: ['arbol'], semilla: 'pa1', sombra: '#04110C' }] });
  PA.suelo(esc, tg, { clave: 'pr' + v.modo, y: .8, a, matas: 24, flores: v.flores == null ? 20 : v.flores, semilla: 'ps' + v.modo, n: 40, altura: 80 });
  M.bruma(esc, tg, { y: H * .78, alto: 160, color: v.bruma || '#9FB6E8', alfa: .1 * a }); M.luciernagas(esc, tg, { n: 10, zona: { x: 0, y: H * .55, w: W, h: H * .4 }, alfa: f(2), semilla: 'pl' + v.modo }); x.restore(); };

// Bosque denso en cuatro planos con rayos de luz
const bosque = (esc, tg, a) => { const W = esc.W, H = esc.H, f = (x) => c01(a * x);
  PA.cielo(esc, tg, { modo: 'bosque', estrellas: 0, niebla: .45 }); M.haces(esc, tg, { x0: -80, y0: -120, n: 6, largo: 1700, apertura: .7, angulo: PI / 3.1, ancho: 150, color: '#BFFFE0', alfa: .24, aparece: f(1.2), semilla: 'bq' });
  PA.bosque(esc, tg, { clave: 'bq', a, bruma: '#7FE0B8', capas: [
    { y: .70, tam: 170, n: 26, brillo: .32, color: '#4FD0A0', figuras: ['pino', 'arbol'], semilla: 'f1', sombra: '#010605', grosor: 1.6 },
    { y: .80, tam: 290, n: 14, brillo: .45, color: '#5BE0A0', figuras: ['pino', 'arbol'], semilla: 'f2', sombra: '#010806', grosor: 1.8 },
    { y: .93, tam: 470, n: 9, brillo: .5, bordes: true, color: '#6CF0B0', figuras: ['pino', 'arbol', 'pino'], semilla: 'f3', sombra: '#010906', grosor: 1.8, extras: [['helecho', .1, .88, 300], ['seta', .45, .93, 120], ['helecho', .8, .9, 330]] },
    { y: 1.05, tam: 760, n: 5, brillo: .55, bordes: true, color: '#8CFFC8', figuras: ['pino', 'arbol'], semilla: 'f4', sombra: '#010504', grosor: 2 }] });
  M.bruma(esc, tg, { y: H * .86, alto: 240, color: '#7FE0B8', alfa: .15 * a }); M.motas(esc, tg, { n: 22, color: '#8FFFC8', alfa: .55 * a, sube: 100, semilla: 'bqm' }); M.luciernagas(esc, tg, { n: 12, zona: { x: 0, y: H * .3, w: W, h: H * .6 }, alfa: f(2), semilla: 'bql' }); };

// Amanecer sobre colinas calidas con sol que asciende. v: {y0, y1 (altura del sol), prog}
const amanecer = (esc, tg, a, v) => { const W = esc.W, H = esc.H, f = (x) => c01(a * x), sy = lerp(v.y0, v.y1, E(v.prog));
  PA.cielo(esc, tg, { modo: 'amanecer', estrellas: 0, niebla: .25, nubes: { n: 4, y: H * .24, color: '#FFB8C8', alfa: .22 * a, aditivo: true, vel: .8, semilla: 'amn' } });
  esc.ctx.save(); esc.ctx.globalCompositeOperation = 'lighter'; esc.ctx.globalAlpha = .5 * f(1.5); esc.ctx.drawImage(esc.cache.halo(256, '#FFB28A', .35), -W * .2, H * .45, W * 1.4, H * .8); esc.ctx.restore();
  M.haces(esc, tg, { x0: W * .5, y0: sy * H, n: 8, largo: 1600, apertura: 1.7, angulo: -PI / 2, ancho: 150, color: '#FFD9A8', alfa: .2, aparece: f(1.2), semilla: 'amv' });
  M.astro(esc, tg, { x: W * .5, y: sy * H, r: 76, tipo: 'sol', prog: f(1.4) });
  PA.cordillera(esc, tg, { clave: 'am', a, capas: [cresta('am1', .66, .22, 3.2, '#FFB28A', .5, 'rgba(200,110,130,.30)', .7)] });
  PA.colinas(esc, tg, { clave: 'am', a, capas: [{ semilla: 'ah1', y: .72, amp: .10, freq: 2.2, color: '#FF9FB0', brillo: .75, tinte: 'rgba(150,70,110,.45)', tinteAbajo: 'rgba(40,16,50,.9)' }, { semilla: 'ah2', y: .79, amp: .09, freq: 2.8, color: '#C890D0', brillo: .85, tinte: 'rgba(70,40,110,.6)', tinteAbajo: 'rgba(16,8,34,.94)' }, { semilla: 'ah3', y: .87, amp: .07, freq: 3.4, color: '#8F7AD8', brillo: .9, tinte: 'rgba(24,14,60,.85)', tinteAbajo: 'rgba(6,4,20,.97)' }] });
  PA.suelo(esc, tg, { clave: 'am', y: .86, a, matas: 18, flores: 12, semilla: 'ams', n: 30, altura: 70, colorHierba: '#C8E08A' });
  M.bruma(esc, tg, { y: H * .76, alto: 170, color: '#FFC8B0', alfa: .13 * a }); M.motas(esc, tg, { n: 14, color: '#FFE9D0', alfa: .5 * a, sube: 100, semilla: 'amm' }); };

// Cumbre: cordillera mayor, noche que se vuelve amanecer (f 0..1)
const cumbre = (esc, tg, a, f) => { const W = esc.W, H = esc.H;
  PA.cielo(esc, tg, { modo: 'noche', a: 'amanecer', mezcla: f, estrellas: (1 - f) * .9 * c01(a * 2), niebla: .22, aurora: f < .6 && { intensidad: .4 * (1 - f / .6) * c01(a * 1.4), colores: ['#3DFFA8', '#6C8CFF', '#B88CFF'] }, fugaces: f < .6 ? 12 : 0 });
  if (f > .35) M.astro(esc, tg, { x: W * .5, y: lerp(H * .62, H * .36, E((f - .35) / .65)), r: 70, tipo: 'sol', prog: c01((f - .3) * 3) });
  PA.cordillera(esc, tg, { clave: 'cu', a, capas: [cresta('cu1', .60, .46, 2.2, '#8C9CFF', .6, 'rgba(70,80,170,.30)', .5, 1.4), cresta('cu2', .68, .40, 2.8, '#B8CCFF', .8, 'rgba(34,54,120,.55)', .55, 1.5), cresta('cu3', .78, .26, 3.8, '#CFE0FF', .95, 'rgba(6,14,44,.88)', .6, 1.6)] });
  PA.colinas(esc, tg, { clave: 'cu', a, capas: [{ semilla: 'cuh', y: .9, amp: .06, freq: 3, color: '#6EDC8A', brillo: .8, tinte: 'rgba(2,8,16,.9)', tinteAbajo: 'rgba(1,3,8,.98)' }] });
  M.bruma(esc, tg, { y: H * .78, alto: 200, color: '#B8C8F0', alfa: .15 * a }); };

// Cosmos desde un planeta
const cosmos = (esc, tg, a) => PA.cosmos(esc, tg, a);

const AMB = [
  (esc, t, ctx) => lago(esc, ctx.tg, c01(t / 12), { modo: 'onirico', luna: true }),
  (esc, t, ctx) => { pradera(esc, ctx.tg, c01(t / 12), { modo: 'noche', dim: .62, astro: { tipo: 'luna', x: esc.W * .8, y: esc.H * .18, r: 64, prog: 1 }, flores: 14 }); const b = CUERPO(esc);
    esc.ctx.save(); esc.ctx.globalCompositeOperation = 'lighter'; esc.ctx.globalAlpha = .35; esc.ctx.drawImage(esc.cache.halo(256, '#6C8CFF', .4), b.x - 520, b.y - 420, 1040, 840); esc.ctx.restore();
    T.dibujar(esc, 'meditando', { x: b.x, y: b.y, tam: b.tam, modo: 'luz', progreso: E(t / 5), t: ctx.tg, brillo: .95, chispas: 5, semilla: 'b2' }); },
  (esc, t, ctx) => lago(esc, ctx.tg, c01(t / 12), { modo: 'aurora', aurora: ['#3DFFA8', '#6C8CFF', '#B88CFF'], agua: '#3DFFA8', c1: '#9FD8FF', c2: '#8FE0C8', c3: '#6CE0B0', bruma: '#9FF0D8', junco: '#6EDC8A' }),
  (esc, t, ctx) => cosmos(esc, ctx.tg, c01(t / 12)),
  (esc, t, ctx) => amanecer(esc, ctx.tg, c01(t / 12), { y0: .70, y1: .58, prog: t / ctx.dur }),
  (esc, t, ctx) => bosque(esc, ctx.tg, c01(t / 12)),
  (esc, t, ctx) => lago(esc, ctx.tg, c01(t / 12), { modo: 'onirico', aurora: ['#B88CFF', '#6C8CFF'], lotos: true, agua: '#B88CFF', c1: '#C8A8FF', c2: '#9C8CFF', c3: '#7CA6F0', bruma: '#D8C8FF', luna: false }),
  (esc, t, ctx) => amanecer(esc, ctx.tg, c01(t / 12), { y0: .82, y1: .50, prog: t / ctx.dur }),
  (esc, t, ctx) => cumbre(esc, ctx.tg, c01(t / 12), c01((t - 20) / (ctx.dur - 30))),
];

// ---------- parrafos de cada acto ----------
const A = [];
// ===== ACTO I: ¿Que es la meditacion? =====
A[0] = [
  (c) => { c.fig('meditando', .5, .56, 420, { dur: 4 }); c.anillos(.5, .56, { r0: 300, r1: 430, n: 3, en: 1 }); c.motas(); },
  (c) => { c.fig('ojo', .5, .52, 540, { en: 'atención', dur: 3.5 }); c.fig('destello', .5, .52, 140, { en: 'observar', dur: 2, chispas: 0 }); },
  (c) => { const d = c.tp * 0.012; c.fig('nube', ((.12 + d) % 1.3) - .15, .3, 380, { en: 0.5 }); c.fig('nube', ((.52 + d * 0.8) % 1.3) - .15, .22, 320, { en: 1.5 }); c.fig('nube', ((.82 + d * 1.2) % 1.3) - .15, .36, 400, { en: 2.5 });
    c.fig('cerebro', .5, .7, 280, { en: 'mente', alfa: .9 }); },
  (c) => { c.linea([[.1, .64], [.9, .64]], '#9FB6E8', c.p(.6, 6)); [.18, .38, .58, .78].forEach((x, i) => c.fig('meditando', x, .5, 150, { en: 1.5 + i * 2, dur: 2, chispas: 2 })); c.fig('sol', .9, .26, 210, { en: 'Oriente', dur: 3 }); },
  (c) => { c.fig('ojo', .22, .5, 320, { en: 'visualización' }); c.fig('mano', .5, .5, 320, { en: 'mudras' }); c.fig('ola', .78, .5, 320, { en: 'respiración' }); },
  (c, esc) => { M.flores(esc, c.tg, { y: esc.H * .93, x: 0, ancho: esc.W, n: 12, prog: c.p(1, 6), tam: 130, semilla: 'a16' }); c.glow(.5, .6, 360, '#FFE9A8', { en: 'colores', alfa: .35 }); c.motas({ n: 26, color: '#FFE9D0', alfa: .8 }); },
  (c, esc) => { c.ondas(.5, .8, { en: .5, r0: 40, r1: 460, vel: .12, n: 4, color: '#CFE3FF' }); c.fig('meditando', .5, .76, 230, { en: 1, dur: 3, chispas: 3 }); c.glow(.5, .76, 220, '#FFB86B', { en: 2, alfa: .4 }); },
  (c) => { c.fig('mano', .5, .52, 560, { en: 0.8, dur: 4 }); c.glow(.5, .55, 120, ORO, { en: 3 }); },
  (c) => { c.fig('anjali', .33, .52, 440, { en: 'anjali', dur: 3 }); c.fig('gyan', .67, .52, 440, { en: 'pulgar', dur: 3 }); },
  (c, esc) => { c.anillos(.5, .5, { r0: 160, r1: 330, n: 4, en: .6 }); const a = tpOrb(c); c.glow(a[0], a[1], 60, '#FFE9A8', { en: 1 }); M.rios(esc, c.tg, { y: esc.H * 0.8 / esc.k, n: 3, sep: 24, amp: 24, colores: [AZ, VI], prog: c.p(1, 3), brillo: .5 }); },
  (c) => { for (let i = 0; i < 8; i++) c.glow(.16 + i * 0.096, .52, 58, i % 2 ? AM : ORO, { en: 1 + i * 1.8, dur: 1.2 }); c.linea([[.14, .52], [.86, .52]], '#9FB6E8', c.p(1, 14), { brillo: .5 }); },
  (c) => { c.fig('sendero', .5, .58, 600, { dur: 4 }); c.fig('sol', .5, .2, 240, { en: 'Ahora', dur: 4 }); },
];
function tpOrb(c) { const r = 0.10 + 0.20 * Math.pow(Math.sin(c.tp * 0.5), 2); return [0.5 + r * Math.cos(c.tp * 0.9), 0.5 + r * 1.6 * Math.sin(c.tp * 0.9)]; }

// ===== ACTO II: puntos vitales (cuerpo ambiente en AMB[1]) =====
const P = (esc, k) => PT(esc, k);
A[1] = [
  (c, esc) => { c.glow(.5, .57, 380, '#6C8CFF', { persistir: true, alfa: .35 }); c.anillos(.5, .57, { r0: 330, r1: 450, n: 3, en: 1 }); },
  (c, esc) => { const h = P(esc, 'cabeza'); c.glow(h[0], h[1], 150, ORO, { en: 'mente', dur: 2 }); c.ondas(h[0], h[1], { en: 1, r0: 40, r1: 260, color: '#FFE9A8' }); c.fig('ojo', h[0], h[1] - .14, 160, { en: 'ajna', dur: 2, chispas: 3 }); },
  (c, esc) => { const h = P(esc, 'cabeza'); c.glow(h[0], h[1], 110, ORO, { persistir: true }); c.fig('cerebro', .78, .36, 440, { en: 0.8, dur: 3.5 }); c.red(.78, .36, 420, 260, { en: 2.5, n: 26, semilla: 'c15' });
    c.linea(c.curva(h, [.62, .2], [.7, .34]), '#FFE9A8', c.p(2, 3), { brillo: .6 }); },
  (c, esc) => { const h = P(esc, 'cabeza'); c.glow(h[0], h[1], 90 + 160 * c01(c.tp / 12), '#FFF0B0', { persistir: true, dureza: .25 }); c.fig('constelacion', .26, .3, 340, { en: 'estrellas', dur: 3 }); c.fig('constelacion', .76, .26, 300, { en: 'lejanas', dur: 3, espejo: true }); },
  (c, esc) => { const h = P(esc, 'corazon'); c.glow(h[0], h[1], 130, '#FF8FA0', { en: 'corazón', dur: 2 }); c.fig('mano', h[0] - .1, h[1] + .02, 250, { en: 'mano', dur: 2.5, rot: -.35, chispas: 2 }); c.fig('corazon', .8, .36, 320, { en: 'latido', dur: 2.5 }); },
  (c, esc) => { const h = P(esc, 'corazon'); c.fig('mandala', h[0], h[1], 340, { en: 'chakra', dur: 4, opts: { rot: c.tg * 0.2 }, brillo: .9 }); c.ondas(h[0], h[1], { en: 'golpeado', r0: 30, r1: 300, color: '#FFC84A' }); },
  (c, esc) => { const h = P(esc, 'corazon'), l = P(esc, 'manoI'), r = P(esc, 'manoD'); c.glow(h[0], h[1], 80 + 330 * E(c.tp / 12), ORO, { persistir: true, dureza: .28 });
    c.linea(c.curva(h, [.36, .55], l), '#FFD27A', c.p('brazos', 3)); c.linea(c.curva(h, [.64, .55], r), '#FFD27A', c.p('brazos', 3)); },
  (c, esc) => { M.ecg(esc, c.tg, { x0: 100, x1: esc.W - 100, y: esc.H * 0.84, amp: 90, color: '#FF6B8B', prog: c.p(0.4, 2.5) }); c.fig('corazon', .5, .26, 260, { en: .6 }); c.anillos(.5, .26, { r0: 170, r1: 250, n: 2, en: 2, color: '#FF8FA0', ciclo: [4, 1.5, 5] }); },
  (c, esc) => { const h = P(esc, 'vientre'); c.glow(h[0], h[1], 130, ORO, { en: 'abdomen', dur: 2 }); c.fig('mandala', h[0], h[1], 320, { en: 'manipura', dur: 4, opts: { rot: -c.tg * 0.2 } }); for (let i = 0; i < 5; i++) c.fig('destello', .3 + i * .1, .84 - (i % 2) * .05, 70, { en: 'joyas' === 0 ? 0 : 'joyas', dur: 2, chispas: 0 }); },
  (c, esc) => { const h = P(esc, 'vientre'); c.red(h[0], h[1], 360, 240, { en: .5, n: 34, semilla: 'c22' }); c.fig('cerebro', .8, .36, 300, { en: 'segundo', dur: 3 }); c.linea(c.curva(h, [.66, .62], [.78, .42]), '#9FD8FF', c.p('segundo', 3), { brillo: .6 }); },
  (c, esc) => { const h = P(esc, 'vientre'), f = M.fase(c.tg, [3.5, 1.2, 4.5]); c.fig('sol', h[0], h[1], 200 + 120 * f.p, { en: .6, dur: 2.5, opts: { rot: c.tg * 0.5 }, chispas: 8 }); },
  (c, esc) => { const a = P(esc, 'cabeza'), b = P(esc, 'corazon'), d = P(esc, 'vientre'), p = c.p(.6, 6); c.linea([a, b, d], '#FFE9A8', p, { grosor: 3 });
    [a, b, d].forEach((q, i) => c.glow(q[0], q[1], 120, [ORO, '#FF8FA0', AM][i], { en: i * 1.5, dur: 1.5, persistir: true })); c.anillos(.5, .57, { r0: 330, r1: 460, n: 3, en: 5 }); },
];

// ===== ACTO III: beneficios reales =====
A[2] = [
  (c) => { c.fig('cerebro', .36, .5, 400, { en: 'ciencia' === 0 ? 0 : 1 }); c.fig('corazon', .64, .5, 320, { en: 3 }); c.motas(); },
  (c) => { for (let i = 0; i < 47; i++) c.glow(.22 + .56 * (i % 8) / 7, .24 + .42 * Math.floor(i / 8) / 5, 30, [AZ, VI, ORO][i % 3], { en: .8 + i * .15, dur: .8 }); c.fig('nube', .3, .86, 210, { en: 'ansiedad' }); c.fig('gota', .5, .86, 170, { en: 'depresión' }); c.fig('destello', .7, .86, 170, { en: 'dolor' }); },
  (c, esc) => { const cx = .5 * esc.W, cy = .66 * esc.H, R = 330 * esc.k, zonas = [[PI, PI * 1.33, '#6C8CFF'], [PI * 1.33, PI * 1.67, '#5BE07A'], [PI * 1.67, PI * 2, '#FFC84A']];
    zonas.forEach(([a0, a1, col], i) => T.polilinea(esc, T.arco(cx, cy, R, R, a0, a1, 40), { color: col, progreso: c.p(.5 + i * .4, 1.5), grosor: 4, brillo: i === 1 ? 1.2 : .45, cabeza: false }));
    const ang = lerp(PI * 1.02, PI * 1.5, E((c.tp - c.en('Moderada', 2)) / 2.5)); T.polilinea(esc, [[cx, cy], [cx + Math.cos(ang) * R * .92, cy + Math.sin(ang) * R * .92]], { color: BL, progreso: c.p(1, 1.5), grosor: 4, cabeza: false });
    c.glow(.5, .66, 40, ORO, { en: 1 }); },
  (c) => { c.fig('espiral', .5, .5, 480, { en: .6, opts: { rot: c.tg * lerp(1.4, 0.15, c01(c.tp / 14)) }, chispas: 8 }); c.anillos(.5, .5, { r0: 280, r1: 340, n: 2, en: 'freno', color: '#9FD8FF' }); },
  (c, esc) => { M.ecg(esc, c.tg, { x0: 100, x1: esc.W - 100, y: esc.H * 0.72, amp: 100, color: '#5BE0B0', prog: c.p(.4, 2.5) }); c.fig('corazon', .5, .28, 280, { en: .8 }); c.anillos(.5, .28, { r0: 180, r1: 260, n: 2, en: 2, color: '#5BE0B0' }); },
  (c, esc) => { const o = { x: esc.W * .5, y: esc.H * .5, tam: 620 }; c.fig('cerebro', .5, .5, 620, { en: .6, dur: 3 }); [[46, 58], [60, 36], [70, 52]].forEach((p, i) => { const q = T.mapear('cerebro', o, p); c.glow(q[0] / esc.W, q[1] / esc.H, 70, [ORO, AZ, VE_][i], { en: 3 + i * 2, dur: 1.5 }); });
    for (let i = 0; i < 8; i++) c.glow(.3 + i * .057, .9, 24, AM, { en: 'semanas' === 0 ? 0 : 3 + i * 1.4, dur: .8 }); },
  (c, esc) => { const o = { x: esc.W * .5, y: esc.H * .5, tam: 620 }, q = T.mapear('cerebro', o, [42, 62]), r = c01((c.tp - 4) / 5); c.fig('cerebro', .5, .5, 620, { en: .4 });
    c.glow(q[0] / esc.W, q[1] / esc.H, 90, '#FF6B6B', { en: 'miedo', dur: 2, alfa: 1 - r * .85 }); c.glow(q[0] / esc.W, q[1] / esc.H, 90, '#6CC8FF', { en: 6, dur: 3, alfa: r }); },
  (c) => { for (let i = 0; i < 16; i++) c.glow(.27 + (i % 4) * .05, .36 + Math.floor(i / 4) * .06, 26, AZ, { en: .6 + i * .25, dur: .8 }); for (let i = 0; i < 17; i++) c.glow(.58 + (i % 4) * .05, .36 + Math.floor(i / 4) * .06, 26, ORO, { en: 1 + i * .25, dur: .8 });
    c.fig('brujula', .5, .78, 190, { en: 'prudencia', dur: 2.5 }); },
  (c) => { c.fig('corazon', .2, .5, 300, { en: 'presión' }); c.fig('nube', .4, .5, 300, { en: 'ansiedad' }); c.fig('gota', .6, .5, 260, { en: 'depresión' }); c.fig('luna', .8, .5, 300, { en: 'insomnio' }); },
  (c) => { c.linea([[.1, .5], [.42, .5]], AZ, c.p(.6, 3), { grosor: 3 }); c.glow(.5, .5, 90 + 25 * Math.sin(c.tg * 1.2), ORO, { en: 'pausa', dur: 2 }); c.linea([[.58, .5], [.9, .5]], VE_, c.p('pausa', 3), { grosor: 3 }); c.fig('meditando', .5, .72, 190, { en: 'pausa', dur: 3 }); },
  (c) => { c.fig('meditando', .5, .6, 360, { en: .6, dur: 3.5 }); c.fig('corazon', .5, .22, 220, { en: 3, dur: 3 }); c.glow(.5, .6, 280, '#FFB86B', { en: 2, alfa: .5, persistir: true }); },
  (c) => { c.fig('sol', .5, .26, 320, { en: 'alentadora', dur: 3 }); c.fig('sendero', .5, .72, 520, { en: 1, dur: 4 }); },
];

// ===== ACTO IV: fuerzas naturales =====
A[3] = [
  (c) => { c.fig('galaxia', .5, .5, 820, { en: .5, dur: 5, opts: { rot: c.tg * 0.03 }, chispas: 16 }); },
  (c, esc) => { esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; const p = M.espaciotiempo(esc, c.tg, { cx: esc.W * .5, cy: esc.H * .52, w: 1300, h: 640, masa: c01(c.tp / 5), prog: c.p(.4, 3) }); esc.ctx.restore(); c.glow(p.x / esc.W, p.y / esc.H, 110, '#FFE9A8', { en: 'masa', dur: 2 }); },
  (c, esc) => { esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; const p = M.espaciotiempo(esc, c.tg, { cx: esc.W * .5, cy: esc.H * .52, w: 1300, h: 640, masa: 1, prog: 1 }); esc.ctx.restore(); c.glow(p.x / esc.W, p.y / esc.H, 100, '#FFE9A8', { persistir: true });
    const a = c.tg * 0.7, px = p.x + 330 * esc.k * Math.cos(a), py = p.y - 40 * esc.k + 95 * esc.k * Math.sin(a); c.glow(px / esc.W, py / esc.H, 36, '#6CC8FF', { en: 'planetas', dur: 1.5 }); },
  (c, esc) => { M.reloj(esc, c.tg, { x: esc.W * .3, y: esc.H * .55, r: 190, vel: .3, prog: c.p(.5, 2.5) * c.salida }); M.reloj(esc, c.tg, { x: esc.W * .7, y: esc.H * .38, r: 160, vel: .55, prog: c.p('satélites', 2.5) * c.salida, manecilla: '#FF9FB0' });
    c.fig('destello', .7 + .1 * Math.cos(c.tg * .8), .62 + .06 * Math.sin(c.tg * .8), 70, { en: 'satélites', dur: 1.5, chispas: 0 }); },
  (c) => { c.fig('atomo', .3, .5, 400, { en: 'cuántica', dur: 3.5 }); c.glow(.3 + .1 * Math.cos(c.tg * 2), .5 + .045 * Math.sin(c.tg * 2), 34, '#FFFFFF', { en: 'granos', dur: 1 }); c.fig('interferencia', .72, .5, 440, { en: 'ondas', dur: 3.5 }); },
  (c, esc) => { const n = c01((c.tp - 3) / (c.dp - 9)); esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; M.electrones(esc, c.tg, { x0: esc.W * .56, x1: esc.W * .9, y0: esc.H * .3, y1: esc.H * .7, n, emisor: [esc.W * .16, esc.H * .5] }); esc.ctx.restore();
    c.fig('estrella', .14, .5, 120, { en: .5, dur: 1.5, chispas: 0 }); c.linea([[.18, .5], [.54, .5]], '#9FB6E8', c.p(1.5, 2), { brillo: .35 }); },
  (c) => { c.fig('interferencia', .5, .5, 760, { en: .5, dur: 5, alfa: .85 }); c.fig('espiral', .5, .5, 1000, { en: 3, dur: 6, alfa: .22, opts: { rot: c.tg * .03 }, chispas: 0 }); },
  (c, esc) => { const t0 = c.en('murieron', 6); c.fig('estrella', .5, .38, 260, { en: .6, dur: 2.5, chispas: 10 }); c.ondas(.5, .38, { en: 'murieron', r0: 30, r1: 520, vel: .15, n: 3, color: '#FFC8A0' });
    for (let i = 0; i < 36; i++) { const a = i * 2.4, r = 40 + ((c.tp - t0) * 58 + i * 11) % 440; if (c.tp > t0) c.glow(.5 + Math.cos(a) * r / esc.W, .38 + Math.sin(a) * r / esc.H * 0.9, 16, i % 2 ? '#FFD27A' : '#B88CFF', { en: 0, alfa: Math.min(1, (c.tp - t0) / 1.5) * .8 }); }
    c.fig('meditando', .5, .8, 190, { en: 'polvo', dur: 3, chispas: 4 }); },
  (c) => { c.fig('ojo', .5, .5, 700, { en: .6, dur: 3.5 }); c.fig('galaxia', .5, .5, 230, { en: 'observa', dur: 3, opts: { rot: c.tg * .1 } }); },
  (c) => { c.fig('mandala', .5, .5, 760, { en: .6, dur: 5, opts: { rot: c.tg * .04 } }); c.fig('estrella', .5, .5, 120, { en: 'Spinoza', dur: 2 }); },
  (c) => { c.fig('mandala', .5, .5, 440, { en: .6, dur: 4, opts: { rot: c.tg * .04 } }); [['galaxia', .2, .3], ['atomo', .8, .3], ['hoja', .2, .72], ['ola', .8, .72]].forEach(([n, x, y], i) => { c.fig(n, x, y, 240, { en: 'todo' === 0 ? 0 : 2 + i * 2, dur: 2.5 }); c.linea([[x, y], [.5, .5]], '#9FB6E8', c.p(2.6 + i * 2, 2), { brillo: .4 }); }); },
  (c) => { c.fig('meditando', .5, .52, 260, { en: .6, dur: 3 }); ['hoja', 'ola', 'pino', 'pajaro', 'flor', 'mariposa'].forEach((n, i) => { const a = i / 6 * PI * 2 - PI / 2, x = .5 + .3 * Math.cos(a), y = .52 + .36 * Math.sin(a); c.fig(n, x, y, 200, { en: 2 + i * 1.6, dur: 2.5 }); c.linea([[x, y], [.5, .52]], '#9FD8FF', c.p(2.6 + i * 1.6, 2), { brillo: .35 }); }); },
];

// ===== ACTO V: buscandote a ti =====
A[4] = [
  (c) => { c.fig('galaxia', .5, .5, 1000, { en: .3, dur: 3, alfa: .4 * c01((6 - c.tp) / 2) + .0, opts: { rot: c.tg * .03 }, chispas: 0 }); c.fig('meditando', .5, .56, 520, { en: 5, dur: 3.5 }); c.glow(.5, .56, 300, '#FFB28A', { en: 6, alfa: .5 }); },
  (c, esc) => { c.fig('cerebro', .26, .46, 420, { en: .6, dur: 3 }); c.red(.26, .46, 360, 220, { en: 2, n: 22, semilla: 'c50' }); c.fig('caminante', .74, .52, 460, { en: 'cuerpo', dur: 3 }); c.linea(c.curva([.34, .46], [.5, .24], [.66, .46]), '#FFE9A8', c.p('prepara', 4), { brillo: .8 }); },
  (c) => { c.fig('nube', .3, .3, 440, { en: .6, dur: 2.5 }); c.fig('mano', .3, .3, 140, { en: 'imaginaban', dur: 2.5, chispas: 0 }); c.fig('mano', .7, .56, 440, { en: 'contraer', dur: 3 }); c.linea(c.curva([.34, .38], [.5, .5], [.64, .54]), '#9FD8FF', c.p('contraer', 3), { brillo: .6 }); },
  (c) => { c.fig('cerebro', .3, .5, 480, { en: .6, dur: 3 }); c.fig('mano', .72, .5, 440, { en: 'músculo', dur: 3 }); c.linea([[.4, .5], [.62, .5]], '#9FD8FF', c.p(2, 2.5), { brillo: .6 }); const f = (c.tg * .35) % 1; if (c.tp > 3) c.glow(lerp(.4, .62, f), .5, 40, '#FFFFFF', { en: 0, alfa: Math.sin(PI * f) }); },
  (c, esc) => { const m = E(c.tp / 8); c.fig('interferencia', lerp(.3, .5, m), .5, 380, { en: .5, dur: 2, opts: { espejo: false }, chispas: 3, color: AZ }); c.fig('interferencia', lerp(.7, .5, m), .5, 380, { en: .5, dur: 2, chispas: 3, color: VI });
    c.fig('mandala', .5, .5, 560, { en: 'aprenden', dur: 3, opts: { rot: c.tg * .05 } }); },
  (c, esc) => { const x = lerp(.14, .86, c01(c.tp / (c.dp - 2))); c.fig('sendero', .5, .6, 960, { en: .2, dur: 2, alfa: .35, fijo: true }); c.fig('caminante', x, .6 + .008 * Math.sin(c.tp * 4), 400, { fijo: true, chispas: 3 }); for (let i = 0; i < 10; i++) if (x > .14 + i * .07) c.glow(.14 + i * .07, .8, 26, '#FFE9A8', { persistir: true, alfa: .6 }); },
  (c, esc) => { c.fig('meditando', .5, .58, 560, { fijo: true, chispas: 3 }); c.linea([[.5, .88], [.5, .06]], '#FFE9A8', c.p('columna', 3), { grosor: 3 }); c.linea(c.curva([.5, .52], [.34, .46], [.26, .54]), AZ, c.p('pecho', 2.5)); c.linea(c.curva([.5, .52], [.66, .46], [.74, .54]), AZ, c.p('pecho', 2.5)); },
  (c) => { c.fig('caminante', .25, .56, 360, { en: 'caminar', dur: 2.5 }); const ye = c.en('correr', 6); c.fig('caminante', .5 - .03, .56, 360, { en: 'correr', dur: 2.5, rot: .18, alfa: .28, chispas: 0 }); c.fig('caminante', .5, .56, 360, { en: 'correr', dur: 2.5, rot: .18 }); c.fig('caminante', .75, .56, 360, { en: 'bailar', dur: 2.5, rot: .12 * Math.sin(c.tg * 3) }); },
  (c, esc) => { c.fig('caminante', .5, .56, 440, { en: .6, dur: 3 }); M.rios(esc, c.tg, { y: esc.H * 0.28 / esc.k, n: 5, sep: 60, amp: 55, colores: [AZ, VI, '#5BE0B0'], prog: c.p(1, 4), brillo: .6 }); c.anillos(.5, .5, { r0: 260, r1: 340, n: 2, en: 2 }); },
  (c) => { c.fig('constelacion', .5, .44, 700, { en: .4, dur: 4 }); c.glow(.3, .5, 70, RO, { en: 'emoción' }); c.glow(.5, .36, 70, AZ, { en: 'límite' }); c.glow(.7, .3, 70, ORO, { en: 'fuerza' }); },
  (c, esc) => { c.fig('meditando', .5, .58, 520, { en: .6, dur: 3 }); const h = PT(esc, 'corazon'); c.glow(h[0], h[1], 150, '#FF8FA0', { en: 'cuerpo', dur: 2 }); c.linea([[.08, .92], [.92, .92]], '#9FB6E8', c.p(2, 3), { brillo: .6 }); },
  (c) => { const m = E((c.tp - 1) / (c.en('recordando', 8) - 1)); c.fig('meditando', lerp(.36, .5, m), .57, 560, { fijo: true, alfa: .35 + .0, chispas: 0 }); c.fig('meditando', .5, .57, 560, { en: .6, dur: 3 }); c.glow(.5, .57, 280, ORO, { en: 'recordando', alfa: .6 }); },
];

// ===== ACTO VI: animales =====
A[5] = [
  (c) => { [[.14, .5, 'pino', 520], [.3, .56, 'arbol', 420], [.7, .56, 'arbol', 420], [.86, .5, 'pino', 520]].forEach(([x, y, n, t], i) => c.fig(n, x, y, t, { en: .5 + i * 1.2, dur: 3, brillo: .6 })); c.fig('sendero', .5, .66, 640, { en: 1, dur: 4 }); },
  (c) => { c.fig('leon', .5, .5, 680, { en: .5, dur: 4, chispas: 10 }); c.fig('leon', .17, .66, 240, { en: 'manadas', dur: 3, chispas: 2 }); c.fig('leon', .83, .66, 240, { en: 'hembras', dur: 3, chispas: 2 }); },
  (c, esc) => { c.fig('oso', .5, .5, 640, { en: .5, dur: 4, chispas: 8 }); c.fig('luna', .82, .2, 220, { en: 'invierno', dur: 3 }); esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; M.caida(esc, c.tg, { tipo: 'copos', n: 36, alfa: .8, vel: .5, semilla: 'a63' }); esc.ctx.restore(); },
  (c, esc) => { c.fig('cocodrilo', .5, .52, 900, { en: .5, dur: 4, chispas: 8 }); const t0 = c.en('dinosaurios', 9), u = c01((c.tp - t0) / 1.4); if (u > 0 && u < 1) { const p = [[.15 + u * .5, .1 + u * .3]]; c.linea([[.1 + u * .5 - .12, .08 + u * .3 - .06], [.1 + u * .5, .08 + u * .3]], BL, 1, { grosor: 3, brillo: 1.4, cabeza: false, persistir: true }); } },
  (c) => { c.fig('serpiente', .5, .5, 760, { en: .5, dur: 4, chispas: 8 }); const m = c01((c.tp - c.en('soltarla', 7)) / 4); if (m > 0) c.fig('serpiente', .5 + .12 * m, .5 - .02 * m, 760, { fijo: true, alfa: .4 * (1 - m * .7), chispas: 0, color: '#9FB6E8' }); },
  (c, esc) => { c.fig('ciervo', .5, .5, 700, { en: .5, dur: 4, chispas: 8 }); esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; M.caida(esc, c.tg, { tipo: 'hojas', n: 22, alfa: .7, vel: .6, semilla: 'a66' }); esc.ctx.restore(); },
  (c) => { c.fig('lobo', .5, .5, 660, { en: .5, dur: 4, chispas: 8 }); c.fig('luna', .5, .13, 190, { en: 'aullidos', dur: 3 }); c.ondas(.5, .3, { en: 'aullidos', r0: 30, r1: 420, vel: .18, n: 3, color: '#CFE3FF' }); },
  (c) => { c.fig('zorro', .5, .46, 620, { en: .5, dur: 4, chispas: 8 }); c.fig('pino', .24, .86, 190, { en: 'bosques', dur: 2.5 }); c.fig('montana', .5, .86, 230, { en: 'tundras', dur: 2.5 }); c.fig('ola', .76, .86, 190, { en: 'ciudades', dur: 2.5 }); },
  (c) => { const y = .32 + .02 * Math.sin(c.tg * .6); c.fig('halcon', .5, y, 820, { en: .5, dur: 4, chispas: 8 }); c.fig('montana', .5, .88, 520, { en: 1.5, dur: 3, alfa: .6 }); c.fig('ojo', .82, .28, 170, { en: 'vista', dur: 2.5 }); },
  (c) => { const L = ['leon', 'oso', 'cocodrilo', 'serpiente', 'ciervo', 'lobo', 'zorro', 'halcon']; c.fig('destello', .5, .5, 200, { en: .5, dur: 2 }); L.forEach((n, i) => { const a = i / 8 * PI * 2 - PI / 2; c.fig(n, .5 + .3 * Math.cos(a), .5 + .36 * Math.sin(a), 230, { en: 1.5 + i * 1.6, dur: 2.5, chispas: 3 }); }); },
  (c, esc) => { c.fig('meditando', .5, .62, 300, { en: .5, dur: 2.5 }); const h = PT(esc, 'corazon'); [['leon', .18, .28, 'león'], ['oso', .38, .15, 'oso'], ['serpiente', .62, .15, 'serpiente'], ['lobo', .82, .28, 'lobo'], ['halcon', .5, .2, 'halcón']].forEach(([n, x, y, w], i) => { c.fig(n, x, y, 230, { en: w, dur: 2.5, chispas: 2 }); c.linea(c.curva([x, y], [(x + .5) / 2, (y + .6) / 2 - .1], [.5, .6]), '#FFD27A', c.p(c.en(w, 3) + 1, 2.5), { brillo: .5 }); }); c.glow(.5, .6, 130, ORO, { en: 6, alfa: .6 }); },
  (c) => { const L = ['leon', 'oso', 'cocodrilo', 'serpiente', 'ciervo', 'lobo', 'zorro', 'halcon'], k = Math.floor(c.tp * .9) % 8; L.forEach((n, i) => { const a = i / 8 * PI * 2 - PI / 2; c.fig(n, .5 + .3 * Math.cos(a), .5 + .36 * Math.sin(a), 230, { fijo: true, alfa: i === k ? 1 : .22, brillo: i === k ? 1.3 : .5, chispas: i === k ? 6 : 0 }); }); c.glow(.5, .5, 120, '#FFE9A8', { en: 1, alfa: .6 }); },
];

// ===== ACTO VII: espiritu y tu =====
A[6] = [
  (c) => { c.fig('meditando', .5, .56, 600, { en: .5, dur: 3.5 }); c.fig('destello', .26, .3, 130, { en: 'espíritu', dur: 2 }); c.fig('destello', .5, .16, 130, { en: 'esencia', dur: 2 }); c.fig('destello', .74, .3, 130, { en: 'conciencia', dur: 2 }); },
  (c) => { const m = E((c.tp - 1.5) / 4); c.fig('meditando', .5, .57, 600, { en: .4, dur: 3 }); c.fig('meditando', lerp(.38, .5, m), lerp(.6, .57, m), 600, { fijo: true, alfa: .45, color: ORO, chispas: 4 }); c.glow(.5, .57, 320, '#FFE9A8', { en: 'amigo', alfa: .45 }); },
  (c, esc) => { const f = M.fase(c.tg, [3.5, 1.2, 4.5]), h = PT(esc, 'vientre'); c.fig('meditando', .5, .57, 600, { en: .4, dur: 3 }); c.glow(h[0], h[1], 90 + 80 * f.p, ORO, { en: 'abdomen', dur: 2 }); c.fig('mano', .42, .66, 210, { en: 'manos', dur: 2.5, rot: -.45, chispas: 1 }); c.fig('mano', .58, .66, 210, { en: 'manos', dur: 2.5, rot: .45, espejo: true, chispas: 1 }); },
  (c, esc) => { const n = 120, pts = [], xc = lerp(.2, .8, E(c01(c.tp / 14))); for (let i = 0; i <= n; i++) { const u = i / n; pts.push([u, .6 + .035 * Math.sin(u * 14 + c.tg * .8) - .12 * Math.exp(-Math.pow((u - xc) * 7, 2)) * c01((c.tp - 4) / 3)]); }
    c.linea(pts, AZ, c.p(.5, 3), { grosor: 3 }); c.linea(pts.map(p => [p[0], p[1] + .08]), '#6C8CFF', c.p(1, 3), { brillo: .5 }); c.linea(pts.map(p => [p[0], p[1] + .16]), '#8FD6FF', c.p(1.5, 3), { brillo: .35 }); },
  (c, esc) => { const h = PT(esc, 'corazon'); c.fig('meditando', .5, .57, 600, { fijo: true, chispas: 3 }); c.glow(h[0], h[1], 80 + 340 * E(c.tp / 10), ORO, { persistir: true }); [PT(esc, 'manoI'), PT(esc, 'manoD')].forEach((q, i) => c.linea(c.curva(h, [.5, .66], q), '#FFD27A', c.p('piel', 3), { brillo: .8 })); },
  (c, esc) => { c.fig('meditando', .5, .57, 600 * (1 - .15 * E(c.tp / 12)), { fijo: true, alfa: 1 - .6 * E(c.tp / 10) }); c.ondas(.5, .57, { en: .5, r0: 80, r1: 700, vel: .1, n: 5, color: '#E0D0FF', alfa: .9 }); c.motas({ n: 26, color: '#E0D0FF', alfa: .8 }); },
  (c) => { c.fig('mandala', .5, .5, 800, { en: .5, dur: 5, opts: { rot: c.tg * .04 } }); c.fig('meditando', .5, .5, 210, { en: 'tradiciones', dur: 2.5 }); },
  (c) => { c.fig('corazon', .5, .42, 440, { en: .6, dur: 3 }); c.fig('mano', .36, .7, 280, { en: 'ternura', dur: 2.5, rot: -.6 }); c.fig('mano', .64, .7, 280, { en: 'ternura', dur: 2.5, rot: .6, espejo: true }); c.glow(.5, .42, 260, RO, { en: 4, alfa: .5 }); },
  (c) => { c.fig('ojo', .5, .3, 400, { en: 'veo', dur: 2.5 }); c.fig('corazon', .5, .68, 280, { en: 'acepto', dur: 2.5 }); c.linea([[.5, .4], [.5, .58]], ORO, c.p('acepto', 2.5)); },
  (c, esc) => { const pts = []; for (let i = 0; i <= 60; i++) { const a = lerp(PI * .12, PI * .88, i / 60); pts.push([.5 + .3 * Math.cos(a) * (esc.H / esc.W), .34 + .26 * Math.sin(a)]); } c.linea(pts, ORO, c.p(1, 5), { grosor: 4 }); c.glow(.5 - .3 * (esc.H / esc.W) * .95, .42, 80, ORO, { en: 5, alfa: .7 }); c.glow(.5 + .3 * (esc.H / esc.W) * .95, .42, 80, ORO, { en: 5, alfa: .7 }); c.fig('destello', .42, .3, 80, { en: 2, dur: 2 }); c.fig('destello', .58, .3, 80, { en: 2.4, dur: 2 }); },
  (c) => { c.ondas(.5, .55, { en: .5, r0: 60, r1: 520, vel: .07, n: 5, color: '#9FB6E8', alfa: .7 }); c.fig('meditando', .5, .6, 380, { en: .6, dur: 3, alfa: .8 }); },
  (c, esc) => { c.fig('loto', .5, .56, 680, { en: .6, dur: 5, chispas: 14 }); esc.ctx.save(); esc.ctx.globalAlpha *= c.salida; M.caida(esc, c.tg, { tipo: 'petalos', n: 22, alfa: .8, vel: .5, semilla: 'a74' }); esc.ctx.restore(); },
];

// ===== ACTO VIII: tu camino =====
A[7] = [
  (c) => { c.fig('sendero', .5, .6, 860, { en: .5, dur: 4 }); c.fig('caminante', .5, .86, 170, { en: 'paso', dur: 2.5, chispas: 2 }); },
  (c, esc) => { const H = esc.H, W = esc.W; const curva = (xe, ye, ax) => c.curva([.5, .94], [ax, .66], [xe, ye], 50);
    c.linea(curva(.2, .4, .3), '#9FB6E8', c.p(1, 4), { brillo: .35 }); c.linea(curva(.8, .4, .7), '#9FB6E8', c.p(2, 4), { brillo: .35 }); c.linea(curva(.5, .3, .46), '#FFE9A8', c.p('camino', 5), { grosor: 4, brillo: 1.2 }); c.glow(.5, .3, 120, ORO, { en: 'solo', alfa: .6 }); },
  (c, esc) => { M.reloj(esc, c.tg, { x: esc.W * .5, y: esc.H * .5, r: 240, vel: 1.6 * c01(1 - c.tp / 12) + .2, prog: c.p(.5, 3) * c.salida }); c.glow(.5, .5, 240, '#FFE9A8', { en: 'noción', alfa: .4 }); c.fig('destello', .5, .5, 100, { en: 'viv', dur: 2 }); },
  (c, esc) => { const u = (c.tp * .06) % 1, bx = lerp(.1, .9, u), by = .5 + .12 * Math.sin(u * PI * 4); M.rios(esc, c.tg, { y: esc.H * .42 / esc.k, n: 1, amp: 0, prog: 0, brillo: 0 }); const pts = []; for (let i = 0; i <= 90; i++) { const v = i / 90; pts.push([lerp(.1, .9, v), .5 + .12 * Math.sin(v * PI * 4)]); } c.linea(pts, '#8FD6FF', c.p(.5, 4), { brillo: .5 }); c.fig('mariposa', bx, by - .02, 200, { en: 'curiosidad', dur: 2.5 }); },
  (c, esc) => { M.prado(esc, c.tg, { y: esc.H * .9, x: 0, ancho: esc.W * .38, n: 50, prog: c.p('izquierda', 3), altura: 110, semilla: 'a89' }); M.flores(esc, c.tg, { y: esc.H * .9, x: esc.W * .62, ancho: esc.W * .34, n: 7, prog: c.p('derecha', 3), tam: 110, semilla: 'a89f' }); c.fig('sendero', .5, .62, 640, { en: .5, dur: 3 }); c.glow(.5, .34, 260, ORO, { en: 'fondo', alfa: .6 }); },
  (c, esc) => { c.linea(c.curva([.5, .94], [.5, .76], [.5, .62]), '#FFE9A8', c.p(.4, 2)); const r = c01((c.tp - c.en('pecho', 8)) / 2.5);
    c.linea(c.curva([.5, .62], [.4, .5], [.28, .36]), '#9FB6E8', c.p(2, 3), { brillo: .9 - .55 * r }); c.linea(c.curva([.5, .62], [.6, .5], [.72, .36]), '#FFD27A', c.p(2, 3), { brillo: .5 + .8 * r }); c.fig('corazon', .5, .84, 150, { en: 'pecho', dur: 2 }); },
  (c, esc) => { M.bruma(esc, c.tg, { y: esc.H * .62, alto: 260, n: 6, color: '#C8B8E8', alfa: .22 * c01(c.tp / 4) }); c.fig('montana', .5, .52, 900, { en: .6, dur: 4, alfa: .7 }); const x = lerp(.28, .72, c01(c.tp / c.dp)); c.fig('caminante', x, .76, 230, { fijo: true, chispas: 1 }); },
  (c) => { [['arcoiris', .14, 'pintar'], ['seta', .30, 'cocinar'], ['pajaro', .46, 'cantar'], ['caminante', .62, 'caminar'], ['mano', .78, 'escribir'], ['flor', .92, 'jardín']].forEach(([n, x, w]) => c.fig(n, x - .02, .5, 230, { en: w, dur: 2.5 })); },
  (c, esc) => { const x = lerp(.15, .8, c01(c.tp / (c.dp - 2))); c.fig('caminante', x, .6, 400, { fijo: true, chispas: 3 }); for (let i = 0; i < 12; i++) if (x > .15 + i * .055) c.glow(.15 + i * .055, .84, 26, '#FFE9A8', { persistir: true, alfa: .7 }); c.fig('destello', .9, .5, 140, { en: 'confianza', dur: 3 }); },
  (c, esc) => { const pts = c.curva([.1, .9], [.3, .5], [.9, .85], 60); c.linea(pts, '#FFE9A8', c.p(.5, 6), { grosor: 3 }); for (let i = 0; i < 14; i++) c.glow(pts[Math.floor(i / 14 * 59) + 1][0], pts[Math.floor(i / 14 * 59) + 1][1], 28, '#FFD27A', { en: .8 + i * .4, dur: 1, alfa: .8 }); c.fig('constelacion', .5, .2, 520, { en: 'mapa', dur: 4 }); },
  (c, esc) => { c.fig('meditando', .5, .58, 420, { en: .5, dur: 3 }); c.linea([[.5, .06], [.5, .94]], '#9FB6E8', c.p(.8, 3), { brillo: .5 }); c.glow(.5, .93, 120, '#C8A878', { en: 'tierra', alfa: .7 }); c.glow(.5, .08, 130, '#CFE3FF', { en: 'cielo', alfa: .7 }); },
  (c) => { const e = c.p(.6, 3); c.fig('caminante', .3, .6, 440, { en: 'pasado', dur: 3, alfa: .6 }); c.fig('caminante', .7, .6, 440, { en: 'futuro', dur: 3, espejo: true }); c.linea(c.curva([.38, .55], [.5, .44], [.62, .55]), '#FFE9A8', c.p('mano', 3), { grosor: 3 }); c.glow(.5, .47, 120, ORO, { en: 'mano', alfa: .7 }); },
];

// ===== ACTO IX: aprendizaje, brujula, meta =====
A[8] = [
  (c, esc) => { const pts = c.curva([.1, .88], [.4, .5], [.9, .7], 60); c.linea(pts, '#FFE9A8', c.p(.5, 5), { brillo: .6 }); for (let i = 0; i < 16; i++) { const q = pts[Math.min(60, Math.floor(i / 16 * 60) + 1)]; c.glow(q[0], q[1], 26, ORO, { en: 1 + i * .6, dur: 1, alfa: .8 }); } c.fig('destello', .9, .66, 130, { en: 'huella', dur: 3 }); },
  (c, esc) => { c.fig('brujula_base', .5, .5, 640, { en: .5, dur: 3.5 }); const ang = -PI / 2 + .9 * Math.exp(-Math.max(0, c.tp - 2.5) * .45) * Math.sin(Math.max(0, c.tp - 2.5) * 3.2), cx = esc.W * .5, cy = esc.H * .5, R = 250 * esc.k, p = c.p(1.5, 2);
    T.polilinea(esc, [[cx + Math.cos(ang) * R, cy + Math.sin(ang) * R], [cx + Math.cos(ang + 1.6) * R * .12, cy + Math.sin(ang + 1.6) * R * .12], [cx + Math.cos(ang - 1.6) * R * .12, cy + Math.sin(ang - 1.6) * R * .12], [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]], { color: '#FF6B6B', progreso: p, grosor: 3, cabeza: false });
    T.polilinea(esc, [[cx - Math.cos(ang) * R, cy - Math.sin(ang) * R], [cx + Math.cos(ang + 1.6) * R * .12, cy + Math.sin(ang + 1.6) * R * .12], [cx + Math.cos(ang - 1.6) * R * .12, cy + Math.sin(ang - 1.6) * R * .12], [cx - Math.cos(ang) * R, cy - Math.sin(ang) * R]], { color: '#9FB6E8', progreso: p, grosor: 3, cabeza: false }); c.glow(.5, .5, 30, ORO, { en: 2 }); },
  (c, esc) => { c.fig('brujula_base', .34, .52, 520, { en: .4, dur: 3 }); const cx = esc.W * .34, cy = esc.H * .52, R = 200 * esc.k, ang = -PI / 4, p = c.p(1.5, 2); T.polilinea(esc, [[cx, cy], [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]], { color: '#FF6B6B', progreso: p, grosor: 4, cabeza: false });
    c.fig('corazon', .74, .26, 300, { en: 'importa', dur: 3 }); c.linea(c.curva([.38, .46], [.55, .3], [.67, .28]), '#FFB6C8', c.p('valores', 3), { brillo: .7 }); },
  (c) => { const q = [[.5, .5]]; c.fig('estrella', .5, .5, 190, { en: .5, dur: 2, chispas: 6 }); c.glow(.28, .5, 150, '#6CC8FF', { en: 'calma' }); c.glow(.5, .24, 150, '#FFE14D', { en: 'curiosidad' }); c.glow(.72, .5, 150, '#FF9A5A', { en: 'valentía' }); c.glow(.5, .76, 150, '#FF8FC0', { en: 'ternura' }); },
  (c) => { c.fig('cumbre', .5, .56, 800, { en: .5, dur: 5 }); c.glow(.5, .13, 120, '#FFE08A', { en: 'meta', alfa: .6 }); },
  (c, esc) => { c.fig('brujula', .36, .5, 480, { en: .5, dur: 3, rot: .1 * Math.sin(c.tg * .6) }); const a = [.62, .5], b = [.84, .3]; c.linea([a, b], '#FFE9A8', c.p('timón', 3), { grosor: 4 }); c.linea([[b[0] - .03, b[1] + .01], b, [b[0] - .01, b[1] + .05]], '#FFE9A8', c.p('timón', 3), { grosor: 4, cabeza: false }); },
  (c, esc) => { c.fig('cerebro', .3, .5, 440, { en: .5, dur: 3 }); c.fig('corazon', .7, .5, 360, { en: 2, dur: 3 }); c.linea(c.curva([.4, .48], [.5, .3], [.62, .48]), '#FFE9A8', c.p('sentimientos', 3)); c.linea(c.curva([.62, .56], [.5, .74], [.4, .56]), '#9FD8FF', c.p('frenan', 3)); const f = (c.tg * .3) % 1; c.glow(lerp(.4, .62, f), .46 - .16 * Math.sin(PI * f), 40, '#FFFFFF', { en: 4, alfa: Math.sin(PI * f) }); },
  (c) => { c.fig('sol', .2, .5, 260, { en: 'alegría' }); c.fig('loto', .4, .5, 260, { en: 'paz' }); c.fig('corazon', .6, .5, 240, { en: 'amor' }); c.fig('pajaro', .8, .5, 260, { en: 'libertad' }); },
  (c, esc) => { c.fig('sendero', .5, .6, 860, { en: .4, dur: 3 }); for (let i = 0; i < 4; i++) { const f = ((c.tg * .12) + i / 4) % 1; c.glow(.5 + (.02 - .04 * f) * Math.sin(f * 3), .92 - f * .6, 50 * (1 - f * .6), '#FFE9A8', { en: 2, alfa: Math.sin(PI * f) }); } c.fig('destello', .5, .22, 160, { en: 'dirección', dur: 3 }); },
  (c) => { c.fig('mariposa', .5, .52, 700, { en: .5, dur: 6, chispas: 12 }); c.glow(.5, .52, 380, '#B88CFF', { en: 3, alfa: .35 }); },
  (c) => { c.anillos(.5, .5, { r0: 150, r1: 300, n: 4, en: .5 }); c.fig('meditando', .5, .5, 240, { en: .5, dur: 3 }); ['galaxia', 'leon', 'hoja', 'ola', 'mariposa', 'estrella'].forEach((n, i) => { const a = i / 6 * PI * 2 - PI / 2; c.fig(n, .5 + .3 * Math.cos(a), .5 + .38 * Math.sin(a), 200, { en: 'universo' === 0 ? 0 : 2 + i * 1.2, dur: 2.5 }); }); },
  (c, esc) => { c.fig('sol', .5, .42, 560, { en: .5, dur: 5, chispas: 12, persistir: true }); c.fig('caminante', .5 + .02, .82, 190, { en: 'camina', dur: 3, persistir: true }); c.fig('sendero', .5, .72, 600, { en: .5, dur: 4, persistir: true, alfa: .7 }); },
];

VE.proyecto({
  estilo: M.estilo('negro'), progreso: false, subtitulos: false, lint: { negro: true },
  transicion: { entrada: 1.8, salida: 1.8 },
  capitulos: A.map((pars, i) => ({ parrafos: pars.length, nombre: ACTOS_TITULO[i][1], dibujar: (esc, t, ctx) => {
    AMB[i](esc, t, ctx); const c = VE.comp(esc, ctx); pars[ctx.parrafo](c, esc, ctx); M.tituloActo(esc, ctx, ACTOS_TITULO[i][0], ACTOS_TITULO[i][1]); } })),
});
