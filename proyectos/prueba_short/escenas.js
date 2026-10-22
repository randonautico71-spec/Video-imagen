/* Escenas de PRUEBA: solo ejercitan las herramientas del motor (texto ajustado, tiempos de palabra,
   cuenta atras sincronizada, atlas de sprites). No son un diseno de referencia. */
const E = VE.ease, T = VE.tokens.SCALE;
const rng = VE.rng('prueba');
let BOKEH = null;

function titular(esc, ctx, txt, y, opt = {}) {
  const z = ctx.zonas.cuerpo;
  const fit = VE.texto.ajustar(esc, txt, { w: z.w, h: opt.h || 260 * esc.k }, { max: opt.max || T.hero, min: T.lg, maxLineas: 3 });
  esc.tipo(fit.tam, 700);
  const lh = fit.tam * esc.k * 1.14;
  fit.lineas.forEach((l, i) => VE.texto.trazar(esc, l, z.cx, y + i * lh, { color: opt.color || esc.estilo.tinta, contornoAncho: 9 }));
  return fit.lineas.length * lh;
}

VE.proyecto({
  estilo: 'LAB',
  fondo(esc, tg) {
    if (!BOKEH) BOKEH = Array.from({ length: 12 }, () => ({ x: rng.range(0, esc.W), y: rng.range(0, esc.H), r: rng.range(70, 200),
      v: rng.range(0.05, 0.16), c: rng.pick([esc.estilo.acento, esc.estilo.acento2, esc.estilo.exito]) }));
    for (const b of BOKEH) esc.pegar(esc.cache.bokeh(b.r, b.c), b.x, b.y + Math.sin(tg * b.v * 2 + b.x) * 22);
  },
  escenas: [
    // 1. titulo
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, a = VE.tramo(t, 0.1, 0.8, E.expoSalida);
      const y = z.cy - 60 * esc.k + (1 - a) * 40;
      esc.pegar(esc.cache.halo(220, esc.estilo.acento, 0.3), z.cx, y - 230 * esc.k, a);
      esc.pegar(esc.cache.disco(54, esc.estilo.acento, { sombraBlur: 26 }), z.cx, y - 230 * esc.k, a, { nucleo: 54, nota: 'disco titulo' });
      titular(esc, ctx, 'Prueba del motor de vídeo', y);
    },
    // 2. tres tarjetas que aparecen cuando se dice cada palabra
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, nombres = ['párrafo', 'escena', 'palabra'];
      const cols = [esc.estilo.acento, esc.estilo.acento2, esc.estilo.exito];
      const hCard = 190 * esc.k, sep = 36 * esc.k, y0 = z.cy - (3 * hCard + 2 * sep) / 2;
      nombres.forEach((n, i) => {
        const w = ctx.palabra(n), ap = w ? VE.tramo(t, w.ini, 0.5, E.atrasSalida) : 0;
        if (ap <= 0) return;
        const py = y0 + i * (hCard + sep) + hCard / 2 + (1 - ap) * 50;
        esc.ctx.save(); esc.ctx.globalAlpha *= Math.min(1, ap * 1.5);
        const p = esc.cache.panel(z.w - 40, hCard, 36, esc.estilo);
        esc.pegar(p, z.cx, py, 1, { nucleo: 0 });
        VE.registrar('panel', { x: z.x + 20, y: py - hCard / 2, w: z.w - 40, h: hCard }, { nota: 'tarjeta ' + n, detras: true });
        esc.pegar(esc.cache.disco(34, cols[i], { sombraBlur: 18, sombraY: 5 }), z.x + 110, py, ap, { nucleo: 34, nota: 'punto ' + n });
        esc.tipo(T.display, 700);
        VE.texto.trazar(esc, n.charAt(0).toUpperCase() + n.slice(1), z.x + 190, py, { align: 'left', color: esc.estilo.tinta, contornoAncho: 7 });
        esc.ctx.restore();
      });
    },
    // 3. cuenta atras sincronizada con la voz
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo;
      const hitos = [['tres', '3'], ['dos', '2'], ['uno', '1']];
      let num = null, ini = 0;
      for (const [p, d] of hitos) { const w = ctx.palabra(p); if (w && t >= w.ini) { num = d; ini = w.ini; } }
      const resp = ctx.palabra('respuesta');
      if (resp && t >= resp.ini - 0.05) {
        const a = VE.tramo(t, resp.ini - 0.05, 0.6, E.atrasSalida);
        esc.pegar(esc.cache.halo(300, esc.estilo.exito, 0.3), z.cx, z.cy, a);
        esc.pegar(esc.cache.disco(120, esc.estilo.exito, { sombraBlur: 30 }), z.cx, z.cy, a, { nucleo: 120, nota: 'disco respuesta' });
        esc.ctx.save(); esc.ctx.strokeStyle = '#fff'; esc.ctx.lineWidth = 16 * esc.k; esc.ctx.lineCap = 'round'; esc.ctx.lineJoin = 'round';
        const k = esc.k * a; esc.ctx.beginPath(); esc.ctx.moveTo(z.cx - 52 * k, z.cy + 4 * k); esc.ctx.lineTo(z.cx - 14 * k, z.cy + 44 * k);
        esc.ctx.lineTo(z.cx + 56 * k, z.cy - 40 * k); esc.ctx.stroke(); esc.ctx.restore();
      } else if (num) {
        const a = VE.tramo(t, ini, 0.45, E.elastico);
        esc.pegar(esc.cache.halo(260, esc.estilo.aviso, 0.3), z.cx, z.cy, 0.6 + 0.4 * a);
        esc.tipo(T.mega * 2.2, 700);
        esc.ctx.save(); esc.ctx.translate(z.cx, z.cy); esc.ctx.scale(0.55 + 0.45 * a, 0.55 + 0.45 * a);
        VE.texto.trazar(esc, num, 0, 0, { color: esc.estilo.aviso, contornoAncho: 18, registrar: false });
        esc.ctx.restore();
      }
    },
    // 4. cierre con pregunta
    (esc, t, ctx) => {
      const z = ctx.zonas.cuerpo, a = VE.tramo(t, 0.15, 0.7, E.expoSalida);
      esc.pegar(esc.cache.halo(260, esc.estilo.acento2, 0.3), z.cx, z.cy, a);
      titular(esc, ctx, '¿Qué te ha parecido?', z.cy - 40 * esc.k + (1 - a) * 40, { color: esc.estilo.tinta });
    },
  ],
});
