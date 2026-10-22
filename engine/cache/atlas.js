/* ATLAS DE SPRITES — el nucleo del rendimiento.

   Medido en este contenedor: una escena con glow y sombras calculados por fotograma
   cuesta 1706 ms/fotograma; la misma escena con esos efectos precocidos cuesta 9 ms.
   No hay GPU (Chromium va por SwiftShader), asi que cada blur() y cada shadowBlur se
   recalcula en CPU. Por eso aqui se cuece todo UNA vez al arrancar y despues el bucle
   de fotograma solo pega imagenes con drawImage.

   REGLA: ninguna funcion de este motor usa ctx.filter ni ctx.shadowBlur dentro de
   renderAt(). Si hace falta un desenfoque nuevo, se anade aqui. */
(function (VE) {

  function lienzo(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  /* Halo radial. Sustituye a blur() para los resplandores: un degradado radial cuesta
     una fraccion y a ojo es indistinguible en una forma redonda. */
  function halo(radio, color, dureza = 0.35, ss = 1) {
    const r = radio * ss, c = lienzo(r * 2, r * 2), x = c.getContext('2d');
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    const col = VE.color.a(color, 1);
    g.addColorStop(0, VE.color.a(color, 0.85));
    g.addColorStop(dureza, VE.color.a(color, 0.30));
    g.addColorStop(0.7, VE.color.a(color, 0.08));
    g.addColorStop(1, VE.color.a(color, 0));
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    return c;
  }

  /* Disco con sombra proyectada ya incorporada. El shadowBlur se paga una vez
     por color, no una vez por objeto y fotograma. */
  function disco(radio, color, opt = {}, ss = 1) {
    const pad = (opt.sombraBlur || 24) + Math.abs(opt.sombraY || 8) + 4;
    const r = radio, sz = (r + pad) * 2;
    const c = lienzo(sz * ss, sz * ss), x = c.getContext('2d');
    x.scale(ss, ss);
    const cx = sz / 2;
    if (opt.sombra !== false) {
      x.shadowColor = opt.sombraColor || 'rgba(0,0,0,0.55)';
      x.shadowBlur = opt.sombraBlur || 24;
      x.shadowOffsetY = opt.sombraY == null ? 8 : opt.sombraY;
    }
    x.fillStyle = color;
    x.beginPath(); x.arc(cx, cx, r, 0, Math.PI * 2); x.fill();
    x.shadowColor = 'transparent'; x.shadowBlur = 0;
    if (opt.brillo !== false) { // reflejo superior: da volumen sin coste
      const g = x.createLinearGradient(cx, cx - r, cx, cx + r * 0.2);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cx, cx, r, 0, Math.PI * 2); x.fill();
    }
    return { img: c, centro: sz / 2, tam: sz };
  }

  /* Grano de pelicula. Un mosaico de 256px repetido: textura sin coste por fotograma.
     Determinista, para que los 4 procesos de render generen el mismo grano. */
  function grano(alfa, semilla = 1) {
    const N = 256, c = lienzo(N, N), x = c.getContext('2d');
    const d = x.createImageData(N, N), p = d.data, r = VE.rng(semilla);
    for (let i = 0; i < p.length; i += 4) {
      const v = (r() * 255) | 0;
      p[i] = p[i + 1] = p[i + 2] = v; p[i + 3] = alfa;
    }
    x.putImageData(d, 0, 0);
    return c;
  }

  /* Fondo completo: degradado + vineta + grano, cocido a la resolucion final.
     Es el 90% de los pixeles de cada fotograma y pasa a costar un solo drawImage. */
  function fondo(W, H, est, ss = 1) {
    const c = lienzo(W * ss, H * ss), x = c.getContext('2d');
    x.scale(ss, ss);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, est.fondo[0]); g.addColorStop(1, est.fondo[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,' + est.vineta + ')');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    const tile = grano(est.grano, 7);
    x.fillStyle = x.createPattern(tile, 'repeat'); x.fillRect(0, 0, W, H);
    return c;
  }

  /* Bokeh: discos desenfocados de fondo. Se cuecen N variantes y luego se reparten
     con posiciones deterministas; da profundidad por casi nada. */
  function bokeh(radio, color, ss = 1) {
    const r = radio * ss, c = lienzo(r * 2, r * 2), x = c.getContext('2d');
    const g = x.createRadialGradient(r, r, r * 0.25, r, r, r);
    g.addColorStop(0, VE.color.a(color, 0.22));
    g.addColorStop(0.75, VE.color.a(color, 0.10));
    g.addColorStop(1, VE.color.a(color, 0));
    x.fillStyle = g; x.beginPath(); x.arc(r, r, r, 0, Math.PI * 2); x.fill();
    return c;
  }

  /* Panel redondeado con borde y sombra, precocido. Las tarjetas del video son esto. */
  function panel(w, h, radio, est, ss = 1) {
    const pad = 36;
    const c = lienzo((w + pad * 2) * ss, (h + pad * 2) * ss), x = c.getContext('2d');
    x.scale(ss, ss);
    x.shadowColor = 'rgba(0,0,0,0.45)'; x.shadowBlur = 28; x.shadowOffsetY = 10;
    x.fillStyle = est.panel;
    VE.ruta.redondeado(x, pad, pad, w, h, radio); x.fill();
    x.shadowColor = 'transparent'; x.shadowBlur = 0;
    x.strokeStyle = est.borde; x.lineWidth = 2;
    VE.ruta.redondeado(x, pad, pad, w, h, radio); x.stroke();
    return { img: c, pad: pad };
  }

  /* Cache con clave: pide un sprite y, si ya existe, lo devuelve. Asi una escena
     puede pedir "halo azul de 80" sin preocuparse de cuantas veces se pide. */
  function crearCache(ss) {
    const m = new Map();
    const get = (clave, fabrica) => {
      if (!m.has(clave)) m.set(clave, fabrica());
      return m.get(clave);
    };
    return {
      ss,
      halo: (r, col, dur) => get(`halo|${r}|${col}|${dur}`, () => halo(r, col, dur, ss)),
      disco: (r, col, opt) => get(`disco|${r}|${col}|${JSON.stringify(opt || {})}`, () => disco(r, col, opt, ss)),
      bokeh: (r, col) => get(`bokeh|${r}|${col}`, () => bokeh(r, col, ss)),
      panel: (w, h, rad, est) => get(`panel|${w}|${h}|${rad}|${est.nombre}`, () => panel(w, h, rad, est, ss)),
      fondo: (W, H, est) => get(`fondo|${W}|${H}|${est.nombre}`, () => fondo(W, H, est, ss)),
      grano: (a, s) => get(`grano|${a}|${s}`, () => grano(a, s)),
      obtener: get,
      tam: () => m.size
    };
  }

  VE.atlas = { crearCache, lienzo };
})(window.VE = window.VE || {});
