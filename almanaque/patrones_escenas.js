/* PATRONES REUTILIZABLES (copiar al escenas.js de un proyecto nuevo). Solo helpers visuales: sin guion ni datos.
   Requiere: const M = VE.med, T = VE.trazo, PA = VE.paisaje y las funciones c01/E/lerp (ver cabecera de cualquier escenas.js). */
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
// Ejemplo: un fondo oscuro por capitulo (el indice = capitulo)
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


/* Uso: const A = []; A[0] = [ (c) => {...}, (c) => {...} ];  // una funcion por parrafo
VE.proyecto({ estilo: M.estilo('negro'), progreso: false, subtitulos: false, lint: { negro: true }, transicion: { entrada: 1.8, salida: 1.8 },
  capitulos: A.map((pars, i) => ({ parrafos: pars.length, nombre: 'cap' + (i + 1), dibujar: (esc, t, ctx) => { AMB[i](esc, t, ctx); const c = VE.comp(esc, ctx); pars[ctx.parrafo](c, esc, ctx); } })) }); */
