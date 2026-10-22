/* PRUEBA de los 7 mundos de luz como CAPITULOS (1 parrafo = 1 capitulo). Mide coste y valida la API de capitulos. */
const M = VE.med, c01 = (v) => Math.max(0, Math.min(1, v));
const MUNDOS = ['prado_nocturno', 'lago_luna', 'bosque_niebla', 'aurora_boreal', 'amanecer', 'jardin_loto', 'oceano_estrellas'];
VE.proyecto({
  estilo: M.estilo('negro'), progreso: false, lint: { negro: true },
  subtitulos: { palabras: 7, tam: 50, resalte: '#FFE9A8' },
  transicion: { entrada: 1.4, salida: 1.4 },
  capitulos: MUNDOS.map((m) => ({ parrafos: 1, nombre: m, dibujar: (esc, t, ctx) => M.mundos[m](esc, ctx.tg, c01(t / Math.min(7, ctx.dur * 0.6))) })),
});
