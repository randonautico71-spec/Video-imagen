/* CLIPS DE VÍDEO DENTRO DE LAS ESCENAS (por ejemplo, animaciones del kit-animaciones-3d en cualquier estilo).
   Los MP4 van en proyectos/<tema>/clips/<nombre>.mp4. Antes de qa/render, `vid.py` extrae sus fotogramas a los fps
   del render en salida/clips/<nombre>/00001.jpg… y escribe salida/clips/clips.json (lo hace solo; también `vid.py clips <tema>`).

   Uso en escenas.js (unidades de diseño, como el resto del motor):
     VE.clip(esc, 'leon_clay', ctx.t)                                   // a pantalla completa, recortando lo que sobre
     VE.clip(esc, 'ballena', ctx.t - 1.2, { x, y, w, h, ajuste: 'contener', alfa: .9, radio: 24, bucle: false, velocidad: 1 })
   - t: segundos dentro del clip (el instante del clip que se ve). Con bucle (por defecto) se repite; sin bucle se queda en el último fotograma.
   - ajuste: 'cubrir' (por defecto, llena el recuadro) o 'contener' (se ve entero).
   - Devuelve false si el fotograma aún no estaba cargado: el render lo espera y repite la imagen (renderAtListo), así que nunca sale vacío.
   Los subtítulos, grafismos y el resto de la escena se dibujan encima o debajo según el orden en que se llame. */
(function (VE) {
  const cache = new Map(), pendientes = [], MAX = 90;
  VE.clips = { base: '', info: {}, faltan: false };
  VE.clips.cargar = function (base, info) { VE.clips.base = base; VE.clips.info = info || {}; };
  VE.clips.esperar = async function () { if (!pendientes.length) return; const p = pendientes.splice(0); await Promise.all(p); };
  function imagen(url) {
    let im = cache.get(url);
    if (!im) { im = new Image(); im.src = url; cache.set(url, im); pendientes.push(im.decode().catch(() => {}));
      if (cache.size > MAX) { const k = cache.keys().next().value; cache.delete(k); } }
    return im;
  }
  VE.clip = function (esc, nombre, t, o = {}) {
    const inf = VE.clips.info[nombre];
    if (!inf) throw new Error(`Clip sin preparar: "${nombre}". Pon proyectos/<tema>/clips/${nombre}.mp4 y ejecuta python3 pipeline/vid.py clips <tema>`);
    let f = Math.floor((t * (o.velocidad || 1)) * inf.fps + 1e-6);
    f = o.bucle === false ? Math.max(0, Math.min(inf.n - 1, f)) : ((f % inf.n) + inf.n) % inf.n;
    const pide = (k) => imagen(`${VE.clips.base}salida/clips/${nombre}/${String(k + 1).padStart(5, '0')}.jpg`);
    const im = pide(f); pide((f + 1) % inf.n);                                // adelanta la carga del siguiente
    if (!im.complete || !im.naturalWidth) { VE.clips.faltan = true; return false; }
    const x = esc.ctx, X = o.x ?? 0, Y = o.y ?? 0, Wr = o.w ?? esc.W, Hr = o.h ?? esc.H, iw = im.naturalWidth, ih = im.naturalHeight;
    const s = (o.ajuste === 'contener' ? Math.min : Math.max)(Wr / iw, Hr / ih), dw = iw * s, dh = ih * s;
    x.save(); x.globalAlpha *= o.alfa ?? 1;
    x.beginPath(); if (o.radio && x.roundRect) x.roundRect(X, Y, Wr, Hr, o.radio); else x.rect(X, Y, Wr, Hr); x.clip();
    x.drawImage(im, X + (Wr - dw) / 2, Y + (Hr - dh) / 2, dw, dh); x.restore();
    return true;
  };
})(window.VE = window.VE || {});
