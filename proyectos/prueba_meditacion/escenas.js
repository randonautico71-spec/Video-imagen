/* PRUEBA de las herramientas de meditacion (luz sin relleno, color real, fondos negro/onirico, haces que aparecen
   poco a poco). El contenido no afirma ningun dato. */
const E = VE.ease, M = VE.med, L = (a, b, t) => a + (b - a) * t, c01 = (v) => Math.max(0, Math.min(1, v));
const cuando = (ctx, w, def) => { const p = ctx.palabra(w); return p ? p.ini : def; };   // instante local de una palabra (o un valor por defecto)
const MODOS = ['negro', 'negro', 'noche', 'bosque', 'negro'];

VE.proyecto({
  estilo: M.estilo('negro'),
  progreso: false,
  lint: { negro: true },
  subtitulos: { palabras: 7, tam: 50, resalte: '#FFE9A8' },
  transicion: { entrada: 0.6, salida: 0.6 },
  fondo(esc, tg, ctx) {
    const i = ctx.i, ant = MODOS[Math.max(0, i - 1)], cur = MODOS[i];
    const f = ant !== cur ? c01(ctx.t / 1.6) : 1;                         // el fondo cambia fundiendo, no de golpe
    M.fondo(esc, tg, { modo: ant !== cur ? ant : cur, a: ant !== cur ? cur : null, mezcla: f,
      estrellas: i === 0 ? c01(ctx.t / 6) * 0.6 : (cur === 'noche' ? 1 : 0), niebla: cur === 'bosque' ? 0.35 : cur === 'noche' ? 0.2 : 0 });
  },
  escenas: [
    // 1 — respirar: anillos de luz que respiran sobre negro
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, ap = c01(t / 3);
      M.anillos(esc, ctx.tg, { x: z.cx, y: z.cy, r0: 90, r1: 230, n: 3, prog: E.suave(ap), color: '#9FB6E8', alfa: 0.95, ciclo: [3.5, 1.2, 4.5] });
      M.motas(esc, ctx.tg, { n: 14, zona: { x: z.x, y: z.y, w: z.w, h: z.h }, color: '#CFE3FF', alfa: ap * 0.8, sube: 120 });
    },
    // 2 — luz que baja y dibuja un camino
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, tLuz = cuando(ctx, 'luz', 0.8), tBaja = cuando(ctx, 'baja', 2), tDib = cuando(ctx, 'dibuja', 4);
      M.haces(esc, ctx.tg, { x0: z.cx, y0: -60, n: 6, largo: 1100, apertura: 0.95, angulo: Math.PI / 2, ancho: 120, color: '#CFE3FF', alfa: 0.30, aparece: c01((t - tLuz) / 3.2), semilla: 'h2' });
      M.rayo(esc, [z.cx, 20], [z.cx, z.cy + 140], c01((t - tBaja) / 2.2), { color: '#FFE9A8', grosor: 3.4, ondas: 1.2, amp: 10 });
      VE.trazo.dibujar(esc, 'sendero', { x: z.cx, y: z.cy + 60, tam: 430, modo: 'luz', progreso: E.suave(c01((t - tDib) / 3.6)), t, chispas: 14, semilla: 'sendero', pulso: { f: 0.2, a: 0.12 } });
    },
    // 3 — prado, colinas y luna (entorno terrestre tranquilo)
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, tCol = cuando(ctx, 'alrededor', 0.8), tPra = cuando(ctx, 'prado', 2.2), tLun = cuando(ctx, 'luna', 5.2), yb = z.y2 - 10;
      [['#6C8CFF', 56, 1, 360], ['#7FA6E8', 46, 2, 270], ['#8FD0C8', 36, 3, 180]].forEach(([col, amp, capa, alto], k) =>   // lejanas arriba y suaves; cercanas abajo
        M.colina(esc, ctx.tg, { y: yb - alto, amp, color: col, capa, prog: E.suave(c01((t - tCol - k * 0.5) / 2.8)), brillo: 0.85 }));
      M.prado(esc, ctx.tg, { y: yb, ancho: esc.W, n: 110, prog: c01((t - tPra) / 3.6), altura: 120, semilla: 'prado3', brillo: 0.8 });
      VE.trazo.dibujar(esc, 'luna', { x: z.x2 - 230, y: z.y + 170, tam: 250, modo: 'luz', progreso: E.suave(c01((t - tLun) / 3)), t, chispas: 10, semilla: 'luna', pulso: { f: 0.15, a: 0.1 } });
      M.luciernagas(esc, ctx.tg, { n: 7, zona: { x: z.x, y: yb - 260, w: z.w, h: 220 }, alfa: c01((t - tPra - 2) / 3) });
    },
    // 4 — bosque que respira
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, tArb = cuando(ctx, 'arboles', 0.8), r = M.fase(ctx.tg, [3.5, 1.2, 4.5]).p, yb = z.y2 - 20;
      [['pino', -0.34, 380], ['arbol', -0.18, 330], ['pino', 0.0, 450], ['arbol', 0.2, 340], ['pino', 0.36, 390], ['helecho', -0.47, 190], ['mata', 0.47, 150]].forEach(([n, ux, h], i) =>
        VE.trazo.dibujar(esc, n, { x: z.cx + ux * z.w, y: yb - h / 2 - (n === 'mata' || n === 'helecho' ? 0 : 0), tam: h, modo: 'luz', progreso: E.suave(c01((t - tArb - i * 0.45) / 2.8)),
          t, chispas: 6, semilla: 'bosque' + i, brillo: 0.85 + 0.25 * r, escalonado: 0.5 }));
      M.luciernagas(esc, ctx.tg, { n: 12, zona: { x: z.x, y: z.y + 60, w: z.w, h: z.h - 160 }, alfa: c01((t - 2.5) / 3), semilla: 'luci4' });
      M.motas(esc, ctx.tg, { n: 18, zona: { x: z.x, y: z.y, w: z.w, h: z.h }, color: '#8FFFC8', alfa: 0.6, sube: 100, semilla: 'm4' });
    },
    // 5 — calma: loto sobre el agua y mandala girando muy despacio, de nuevo sobre negro
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, tAq = cuando(ctx, 'aqui', 0.8), pr = E.suave(c01((t - tAq) / 3.8));
      VE.trazo.dibujar(esc, 'mandala', { x: z.cx, y: z.cy - 20, tam: 520, modo: 'luz', progreso: E.suave(c01((t - 0.3) / 4.5)), rot: ctx.tg * 0.04, t, brillo: 0.45, grosor: 2.4, escalonado: 0.2 });
      VE.trazo.dibujar(esc, 'loto', { x: z.cx, y: z.cy - 20, tam: 300, modo: 'luz', progreso: pr, t, chispas: 18, semilla: 'loto', pulso: { f: 0.18, a: 0.15 } });
    },
  ],
});
