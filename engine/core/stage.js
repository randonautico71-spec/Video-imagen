/* ESCENARIO: resuelve formato, supersampling y unidades de diseno.

   Un mismo guion debe servir a 16:9 y a 9:16. Para eso el codigo de escena NO trabaja
   en pixeles, trabaja en la rejilla y en las safe areas que le da este modulo. */
(function (VE) {

  const FORMATOS = {
    'yt':       { W: 1920, H: 1080, nombre: 'YouTube 16:9' },
    'vertical': { W: 1080, H: 1920, nombre: 'Vertical 9:16 (Shorts/Reels/TikTok)' },
    'cuadrado': { W: 1080, H: 1080, nombre: 'Cuadrado 1:1' }
  };

  /* Zonas seguras. En vertical, la interfaz de la app come la parte de abajo
     (descripcion, audio, botones) y algo de arriba.
     AVISO: estos margenes son una estimacion conservadora por observacion, NO una
     especificacion publicada por las plataformas. Si quieres exactitud, hay que
     medirlos sobre capturas reales del movil y ajustarlos aqui. */
  const SEGURO = {
    'yt':       { arriba: 0.055, abajo: 0.075, izq: 0.055, der: 0.055 },
    'vertical': { arriba: 0.100, abajo: 0.210, izq: 0.070, der: 0.140 },
    'cuadrado': { arriba: 0.070, abajo: 0.090, izq: 0.070, der: 0.070 }
  };

  VE.crearEscenario = function (opt) {
    const f = FORMATOS[opt.formato];
    if (!f) throw new Error('Formato desconocido: ' + opt.formato + '. Hay: ' + Object.keys(FORMATOS).join(', '));
    const ss = opt.ss || 1.5;              // supersampling; medido: 1.5x cuesta ~+40%
    const W = f.W, H = f.H;

    const c = opt.canvas || document.getElementById('c');
    c.width = Math.round(W * ss);
    c.height = Math.round(H * ss);
    // Clave: el buffer es mayor que el tamano CSS. El navegador reduce al pintar y
    // eso es lo que da el antialiasing de geometria fina.
    c.style.width = W + 'px';
    c.style.height = H + 'px';

    const x = c.getContext('2d', { alpha: false });
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';

    const s = SEGURO[opt.formato];
    const seguro = {
      x: Math.round(W * s.izq),
      y: Math.round(H * s.arriba),
      w: Math.round(W * (1 - s.izq - s.der)),
      h: Math.round(H * (1 - s.arriba - s.abajo))
    };
    seguro.x2 = seguro.x + seguro.w;
    seguro.y2 = seguro.y + seguro.h;
    seguro.cx = seguro.x + seguro.w / 2;
    seguro.cy = seguro.y + seguro.h / 2;

    const esc = {
      formato: opt.formato, W, H, ss, ctx: x, canvas: c,
      cx: W / 2, cy: H / 2,
      seguro,
      vertical: H > W,
      // Factor tipografico: basado en el lado menor, para que el texto ocupe la misma
      // proporcion del ancho util en los dos formatos.
      k: Math.min(W, H) / 1080,
      estilo: VE.estilo(opt.estilo || 'DARK'),
      cache: null,
      // Rejilla de 12 columnas dentro de la zona segura.
      col(n, span = 1) {
        const gut = 16 * (Math.min(W, H) / 1080);
        const cw = (seguro.w - gut * 11) / 12;
        return { x: seguro.x + n * (cw + gut), w: cw * span + gut * (span - 1) };
      },
      // Abre el fotograma: limpia con el fondo precocido y deja el contexto en
      // unidades de diseno (no en pixeles del buffer).
      abrir() {
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.drawImage(esc.cache.fondo(W, H, esc.estilo), 0, 0);
        x.setTransform(ss, 0, 0, ss, 0, 0);
      },
      /* Pega un sprite del atlas centrado en (px,py), en unidades de diseno.
         'nucleo' es el radio de la parte solida del sprite: un halo de 92px es casi
         todo transparente y no tapa nada, mientras que el disco solido de 26px si.
         El linter necesita esa distincion para no dar falsos positivos ni negativos. */
      pegar(sprite, px, py, escala = 1, opt) {
        const x = esc.ctx;                      // contexto ACTUAL (puede ser el de una capa horneada)
        const img = sprite.img || sprite;
        const w = img.width / ss * escala, h = img.height / ss * escala;
        x.drawImage(img, px - w / 2, py - h / 2, w, h);
        if (VE.registrar && opt && opt.nucleo) {
          const r = opt.nucleo * escala;
          VE.registrar(opt.tipo || 'figura', { x: px - r, y: py - r, w: r * 2, h: r * 2 },
                       { nota: opt.nota, detras: opt.detras, ignorarSeguro: opt.ignorarSeguro });
        }
      },
      tipo(tam, peso = 600) {
        esc.ctx.font = `${peso} ${Math.round(tam * esc.k)}px Fredoka, sans-serif`;
        return Math.round(tam * esc.k);
      }
    };
    esc.cache = VE.atlas.crearCache(ss);
    return esc;
  };

  VE.FORMATOS = FORMATOS;
  VE.SEGURO = SEGURO;
})(window.VE = window.VE || {});
