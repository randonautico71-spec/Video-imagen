/* CLIPS DE FOTOGRAMAS dentro de una escena (p. ej. un clip SDF del kit extraido a JPG con ffmpeg).
   En escenas.js:  VE.proyecto({ precarga: async () => { CL = await VE.clip.cargar('proyectos/<tema>/salida/sdf/frames', 285); }, ... })
   y en la escena: VE.clip.pintar(esc, CL, t_del_clip, 30);  -> los subtitulos y grafismos se dibujan encima, como en cualquier escena. */
(function (VE) {
  'use strict';
  VE.clip = {
    cargar(carpeta, n, ext = 'jpg') {
      const cargas = Array.from({ length: n }, (_, i) => new Promise((ok, no) => {
        const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('no carga ' + im.src));
        im.src = '/' + carpeta + '/f' + String(i + 1).padStart(4, '0') + '.' + ext;
      }));
      return Promise.all(cargas);
    },
    /* o.oscuro (0..1) tapa el clip con negro; o.zoom (>=1) y o.cx, o.cy (0..1) recortan el centro del fotograma */
    pintar(esc, imgs, t, fps = 30, o = {}) {
      const i = Math.max(0, Math.min(imgs.length - 1, Math.floor(t * fps + 1e-6))), im = imgs[i], x = esc.ctx, W = esc.W, H = esc.H, z = o.zoom || 1;
      const sw = im.width / z, sh = im.height / z, sx = ((o.cx == null ? 0.5 : o.cx) * im.width) - sw / 2, sy = ((o.cy == null ? 0.5 : o.cy) * im.height) - sh / 2;
      x.drawImage(im, Math.max(0, Math.min(im.width - sw, sx)), Math.max(0, Math.min(im.height - sh, sy)), sw, sh, 0, 0, W, H);
      if (o.oscuro) { x.fillStyle = 'rgba(0,0,0,' + o.oscuro + ')'; x.fillRect(0, 0, W, H); }
    },
  };
})(window.VE = window.VE || {});
