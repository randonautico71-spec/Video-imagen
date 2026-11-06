/* EDICION «EDITORIAL»: el lenguaje de montaje de los cortos divulgativos de referencia (analizados en docs/GUIA_IMAGEN.md):
   subtitulos ARRIBA palabra a palabra con la palabra clave enmarcada como una seleccion de texto, etiquetas con linea guia,
   ondas concentricas, tarjetas de datos (y tachado cuando se desmiente; SIN fuente en pantalla: regla del usuario), regla de medida, lupa, chip de fecha,
   particulas, grano y vineta, zoom continuo entre planos y cierre con el letrero de la marca (y, si se pide, el movil «Envialo»). Todo es funcion de t y sin filtros por fotograma.
     VE.ed.subtitulos(esc, grupos, tg, {clave, y, tam, marca})   (el runner lo usa con subtitulos: {estilo: 'editorial'})
     VE.ed.dato(esc, {num, etiqueta, x, y, a, tachado, color})
     VE.ed.tarjeta(esc, {x, y, a, columnas: [{num, etiqueta, color}]})
     VE.ed.etiqueta(esc, {x, y, tx, ty, texto, sub, a, color})           punto anclado (x, y) y texto en (tx, ty)
     VE.ed.ondas(esc, x, y, t, {color, n, radio, periodo, ancho, achatado, a})
     VE.ed.medida(esc, x, y0, y1, texto, {a, color, lado})
     VE.ed.lupa(esc, cx, cy, r, dibujar(ctx), {a, aumento})              dibujar pinta el contenido ampliado (unidades de diseno)
     VE.ed.lupaImagen(esc, cx, cy, r, fx, fy, aumento, {a})              amplia una zona del propio fotograma
     VE.ed.captura(esc) -> lienzo con el fotograma actual
     VE.ed.chip(esc, texto, x, y, {a, color, tam})
     VE.ed.particulas(esc, semilla, t, {caja, n, color, tam, vel, a, brillo})
     VE.ed.chorro(esc, semilla, t, {x, y, dir, n, color, tam, vida, a})   burbujas o aliento que salen de un punto
     VE.ed.grano(esc, t, fuerza) · VE.ed.vineta(esc, {arriba, bordes})
     VE.ed.zoom(esc, {cx, cy, escala}, dibujar)                          camara 2D: ampliar hacia un punto (transiciones «a traves»)
     VE.ed.movil(esc, t, t0, {captura, contactos, texto})                movil con hoja de compartir y dedo que pulsa (dura ~2,4 s)
     VE.ed.cierre(esc, t, t0, {captura, handle})                         CIERRE DE SHORT: letrero «SIGUE A @randonautico»; con {movil:true} antes entra el movil «Envialo» (ya no es el cierre por defecto)
   Paleta por defecto: seleccion azul #5b8cff, rojo #ff4d5e, verde #5be08a, texto blanco y gris. */
(function (VE) {
  const D = VE.ed = {}, PI = Math.PI, E = VE.ease, c01 = (v) => Math.max(0, Math.min(1, v));
  const COL = D.COL = { sel: '#5b8cff', rojo: '#ff4d5e', verde: '#5be08a', cian: '#6ee7f9', gris: 'rgba(235,238,245,0.55)', blanco: '#ffffff', tarjeta: 'rgba(14,16,22,0.82)' };
  const fuente = (esc, tam, peso = 600) => { esc.ctx.font = `${peso} ${Math.round(tam * esc.k)}px Fredoka, sans-serif`; return tam * esc.k; };
  const redondo = (x, X, Y, w, h, r) => VE.ruta.redondeado(x, X, Y, w, h, r);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');

  // ---------------------------------------------------------------- subtitulos editoriales (arriba)
  /* Las palabras aparecen al decirse (suben 6 px y se funden); las dichas quedan en gris; la activa en blanco y negrita.
     clave: lista de palabras que se enmarcan como una seleccion (rectangulo azul con tiradores en las esquinas). */
  D.subtitulos = function (esc, grupos, tg, o = {}) {
    const g = VE.grupoEn(grupos, tg, o.persistencia == null ? 0.35 : o.persistencia); if (!g) return;
    const x = esc.ctx, tam = o.tam || 46, w = (o.ancho || 0.78) * esc.W, cx = o.cx || esc.W / 2, y = o.y || esc.seguro.y + 40 * esc.k;
    const clave = new Set((o.clave || []).map(norm)), lh = tam * esc.k * 1.22;
    // reparto en lineas con la negrita (la mas ancha)
    fuente(esc, tam, 700); const esp = x.measureText(' ').width, pal = g.palabras.map(p => ({ p, w: x.measureText(p.t).width }));
    const lineas = [[]]; let ancho = 0; for (const q of pal) { if (ancho + q.w > w && lineas[lineas.length - 1].length) { lineas.push([]); ancho = 0; } lineas[lineas.length - 1].push(q); ancho += q.w + esp; }
    if (lineas.length > 2) { const todo = lineas.flat(), m = Math.ceil(todo.length / 2); lineas.length = 0; lineas.push(todo.slice(0, m), todo.slice(m)); }
    if (o.marca) { x.save(); fuente(esc, 20, 500); x.fillStyle = 'rgba(255,255,255,0.55)'; x.textAlign = 'center'; x.textBaseline = 'middle'; if ('letterSpacing' in x) x.letterSpacing = (6 * esc.k) + 'px'; x.fillText(o.marca, cx, y - 46 * esc.k); x.restore(); }
    x.save(); x.textBaseline = 'middle'; x.textAlign = 'left';
    lineas.forEach((l, li) => {
      const lw = l.reduce((s, q) => s + q.w, 0) + esp * (l.length - 1); let px = cx - lw / 2; const py = y + li * lh;
      for (const q of l) {
        const { p } = q, ap = c01((tg - p.ini + 0.08) / 0.16); if (ap <= 0) { px += q.w + esp; continue; }
        const activa = tg >= p.ini - 0.02 && tg < p.fin + 0.05, dy = (1 - ap) * 8 * esc.k;
        fuente(esc, tam, activa ? 700 : 500); const ww = x.measureText(p.t).width;
        x.globalAlpha = ap; x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillText(p.t, px + (q.w - ww) / 2 + 1.5 * esc.k, py + dy + 2 * esc.k);      // sombra dura barata
        x.fillStyle = activa ? COL.blanco : COL.gris; x.fillText(p.t, px + (q.w - ww) / 2, py + dy);
        if (activa && clave.has(norm(p.t))) D.seleccion(esc, px + (q.w - ww) / 2 - 6 * esc.k, py - tam * esc.k * 0.62, ww + 12 * esc.k, tam * esc.k * 1.24, c01((tg - p.ini) / 0.12));
        px += q.w + esp;
      }
    });
    x.restore();
  };
  /* Rectangulo de seleccion con tiradores (como al seleccionar texto en un editor). */
  D.seleccion = function (esc, X, Y, w, h, a = 1, col = COL.sel) {
    const x = esc.ctx, k = esc.k; x.save(); x.globalAlpha *= a; x.strokeStyle = col; x.lineWidth = 2.5 * k; x.strokeRect(X, Y, w, h);
    x.fillStyle = 'rgba(91,140,255,0.16)'; x.fillRect(X, Y, w, h); x.fillStyle = '#fff';
    for (const [px, py] of [[X, Y], [X + w, Y + h]]) { x.beginPath(); x.arc(px, py, 5 * k, 0, 7); x.fill(); x.lineWidth = 2 * k; x.stroke(); }
    x.restore();
  };

  // ---------------------------------------------------------------- datos
  D.dato = function (esc, o) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, s = 0.85 + 0.15 * E.atrasSalida(c01(a));
    x.save(); x.globalAlpha *= c01(a * 1.5); x.translate(o.x, o.y); x.scale(s, s); x.textBaseline = 'middle'; x.textAlign = 'left';
    const tn = fuente(esc, o.tam || 110, 700); const wn = x.measureText(o.num).width;
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillText(o.num, 3 * k, 4 * k); x.fillStyle = o.color || '#fff'; x.fillText(o.num, 0, 0);
    if (o.tachado) { const p = c01(o.tachado); x.strokeStyle = COL.rojo; x.lineWidth = 9 * k; x.lineCap = 'round'; x.beginPath(); x.moveTo(-8 * k, tn * 0.12); x.lineTo(-8 * k + (wn + 16 * k) * p, tn * 0.12 - tn * 0.3 * p); x.stroke(); }
    fuente(esc, (o.tam || 110) * 0.3, 600); x.fillStyle = '#fff'; x.fillText(o.etiqueta || '', wn + 18 * k, 0);   // la fuente va en datos.md, nunca en pantalla
    x.restore();
  };
  D.tarjeta = function (esc, o) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, cols = o.columnas, cw = (o.ancho || 230) * k, h = (o.alto || 190) * k, W = cw * cols.length, s = 0.9 + 0.1 * E.atrasSalida(c01(a));
    x.save(); x.globalAlpha *= c01(a * 1.5); x.translate(o.x, o.y); x.scale(s, s); redondo(x, -W / 2, -h / 2, W, h, 22 * k); x.fillStyle = COL.tarjeta; x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2 * k; x.stroke(); x.textAlign = 'center'; x.textBaseline = 'middle';
    cols.forEach((c, i) => { const cx = -W / 2 + cw * (i + 0.5);
      if (i) { x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.moveTo(-W / 2 + cw * i, -h * 0.35); x.lineTo(-W / 2 + cw * i, h * 0.35); x.stroke(); }
      fuente(esc, 84, 700); x.fillStyle = c.color || '#fff'; x.fillText(c.num, cx, -h * 0.16);
      fuente(esc, 26, 600); x.fillStyle = '#fff'; x.fillText(c.etiqueta || '', cx, h * 0.2); });
    x.restore();
  };
  D.etiqueta = function (esc, o) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, p = c01(a), col = o.color || '#fff';
    const lx = o.x + (o.tx - o.x) * E.suaveSalida(p), ly = o.y + (o.ty - o.y) * E.suaveSalida(p);
    x.save(); x.strokeStyle = col; x.globalAlpha *= 0.85; x.lineWidth = 2 * k; x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(lx, ly); x.stroke();
    x.fillStyle = col; x.beginPath(); x.arc(o.x, o.y, 5 * k, 0, 7); x.fill();
    x.globalAlpha = c01((a - 0.5) * 2) * (o.a == null ? 1 : 1); x.textBaseline = 'bottom'; x.textAlign = o.tx < o.x ? 'right' : 'left';
    const dx = (o.tx < o.x ? -1 : 1) * 6 * k; fuente(esc, o.tam || 28, 600); x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillText(o.texto, lx + dx + 1.5 * k, ly - 4 * k + 2 * k); x.fillStyle = col; x.fillText(o.texto, lx + dx, ly - 4 * k);
    if (o.sub) { x.textBaseline = 'top'; fuente(esc, (o.tam || 28) * 0.7, 500); x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillText(o.sub, lx + dx, ly + 4 * k); }
    x.restore();
  };
  D.ondas = function (esc, X, Y, t, o = {}) {
    const x = esc.ctx, n = o.n || 3, per = o.periodo || 1.8, R = (o.radio || 160) * esc.k, a = o.a == null ? 1 : o.a; if (a <= 0) return;
    x.save(); x.strokeStyle = o.color || COL.cian; x.lineWidth = (o.ancho || 4) * esc.k;
    for (let i = 0; i < n; i++) { const f = ((t / per + i / n) % 1 + 1) % 1; x.globalAlpha = a * (1 - f) * 0.9; x.beginPath(); x.ellipse(X, Y, R * (0.15 + f), R * (0.15 + f) * (o.achatado || 1), 0, 0, 7); x.stroke(); }
    x.restore();
  };
  D.medida = function (esc, X, y0, y1, texto, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, p = E.suaveSalida(c01(a * 1.4)), col = o.color || COL.verde, ym = (y0 + y1) / 2, h = (y1 - y0) * p;
    x.save(); x.strokeStyle = col; x.lineWidth = 4 * k; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, ym - h / 2); x.lineTo(X, ym + h / 2);
    for (const yy of [ym - h / 2, ym + h / 2]) { x.moveTo(X - 18 * k, yy); x.lineTo(X + 18 * k, yy); } x.stroke();
    x.globalAlpha *= c01(a * 2 - 0.6); fuente(esc, o.tam || 34, 700); const tw = x.measureText(texto).width + 26 * k, th = 48 * k, lx = X + (o.lado === 'derecha' ? 20 * k : -tw / 2);
    redondo(x, lx, ym - th / 2, tw, th, 10 * k); x.fillStyle = COL.tarjeta; x.fill(); x.strokeStyle = col; x.lineWidth = 2 * k; x.stroke();
    x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, lx + tw / 2, ym + 1); x.restore();
  };
  D.lupa = function (esc, cx, cy, r, dibujar, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, s = E.atrasSalida(c01(a)), R = r * s;
    x.save(); x.globalAlpha *= c01(a * 1.5);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.arc(cx + 6 * k, cy + 10 * k, R, 0, 7); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip(); x.fillStyle = o.fondo || '#f3eee8'; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); dibujar(x, cx, cy, R); x.restore();
    const g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 7 * k; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke(); x.restore();
  };
  D.chip = function (esc, texto, X, Y, o = {}) {
    const x = esc.ctx, a = o.a == null ? 1 : o.a; if (a <= 0) return; const k = esc.k, col = o.color || COL.cian;
    x.save(); x.globalAlpha *= c01(a * 1.5); esc.pegar(esc.cache.halo(Math.round(160 * k), col, 0.3), X, Y, 1);
    fuente(esc, o.tam || 64, 700); const tw = x.measureText(texto).width + 40 * k, th = (o.tam || 64) * k * 1.3, s = 0.8 + 0.2 * E.atrasSalida(c01(a)); x.translate(X, Y); x.scale(s, s);
    redondo(x, -tw / 2, -th / 2, tw, th, 16 * k); x.fillStyle = 'rgba(12,20,34,0.85)'; x.fill(); x.strokeStyle = 'rgba(110,231,249,0.35)'; x.lineWidth = 2 * k; x.stroke();
    x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, 0, 2 * k); x.restore();
  };

  /* Lupa sobre la propia imagen: amplia la zona (fx, fy) del fotograma ya pintado y la muestra en un circulo en (cx, cy). */
  D.lupaImagen = function (esc, cx, cy, r, fx, fy, aumento = 2.5, o = {}) {
    const ss = esc.ss, src = esc.cache.obtener('lupa|tmp|' + esc.ss, () => document.createElement('canvas')), w = Math.round(r * 2 / aumento * ss);
    src.width = w; src.height = w; src.getContext('2d').drawImage(esc.canvas, (fx - r / aumento) * ss, (fy - r / aumento) * ss, w, w, 0, 0, w, w);
    if (o.guia !== false && (o.a == null || o.a > 0)) { const x = esc.ctx; x.save(); x.globalAlpha *= c01((o.a == null ? 1 : o.a) * 1.5) * 0.8; x.strokeStyle = '#fff'; x.lineWidth = 2.5 * esc.k;
      x.beginPath(); x.arc(fx, fy, r / aumento, 0, 7); x.stroke(); x.beginPath(); x.moveTo(fx + (cx - fx) * (r / aumento) / Math.hypot(cx - fx, cy - fy), fy + (cy - fy) * (r / aumento) / Math.hypot(cx - fx, cy - fy)); x.lineTo(cx - (cx - fx) * r / Math.hypot(cx - fx, cy - fy), cy - (cy - fy) * r / Math.hypot(cx - fx, cy - fy)); x.stroke(); x.restore(); }
    D.lupa(esc, cx, cy, r, (x) => x.drawImage(src, cx - r, cy - r, r * 2, r * 2), o);
  };
  /* Copia del fotograma actual (para la pantalla del movil del cierre, o una transicion). */
  D.captura = function (esc, clave = 'captura') { const c = esc.cache.obtener('cap|' + clave + '|' + esc.ss, () => document.createElement('canvas')); c.width = esc.canvas.width; c.height = esc.canvas.height; c.getContext('2d').drawImage(esc.canvas, 0, 0); return c; };

  // ---------------------------------------------------------------- particulas
  D.particulas = function (esc, semilla, t, o = {}) {
    const r = VE.rng(semilla), c = o.caja || { x: 0, y: 0, w: esc.W, h: esc.H }, n = o.n || 40, a = o.a == null ? 1 : o.a; if (a <= 0) return; const x = esc.ctx, tam = (o.tam || 8) * esc.k;
    const spr = esc.cache.halo(Math.round(tam * 3), o.color || COL.verde, 0.35); x.save();
    for (let i = 0; i < n; i++) { const vx = (r() - 0.5) * (o.vel || 30), vy = (r() - 0.5) * (o.vel || 30), fx = r(), fy = r(), ph = r() * 7, s = 0.5 + r();
      const px = c.x + ((fx * c.w + vx * t) % c.w + c.w) % c.w, py = c.y + ((fy * c.h + vy * t) % c.h + c.h) % c.h;
      x.globalAlpha = a * (0.55 + 0.45 * Math.sin(t * 2 + ph)); if (o.brillo !== false) esc.pegar(spr, px, py, s * 0.5);
      x.fillStyle = o.nucleo || '#eafff0'; x.beginPath(); x.arc(px, py, tam * 0.35 * s, 0, 7); x.fill(); }
    x.restore();
  };
  D.chorro = function (esc, semilla, t, o) {
    const r = VE.rng(semilla), x = esc.ctx, n = o.n || 30, vida = o.vida || 1.6, tam = (o.tam || 22) * esc.k, a = o.a == null ? 1 : o.a; if (a <= 0) return; x.save();
    for (let i = 0; i < n; i++) { const t0 = (i / n) * vida + r() * 0.2, f = ((t - t0) / vida % 1 + 1) % 1, an = (o.dir || 0) + (r() - 0.5) * (o.abertura || 0.9), d = f * (o.alcance || 260) * esc.k * (0.6 + r() * 0.6);
      const px = o.x + Math.cos(an) * d, py = o.y + Math.sin(an) * d - f * f * 30 * esc.k, rr = tam * (0.4 + f * 1.1) * (0.6 + r() * 0.6);
      x.globalAlpha = a * Math.sin(PI * f) * 0.75; const g = x.createRadialGradient(px - rr * 0.3, py - rr * 0.3, 0, px, py, rr); g.addColorStop(0, 'rgba(220,245,255,0.95)'); g.addColorStop(1, VE.color.a(o.color || '#5fc8ff', 0.25));
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill(); }
    x.restore();
  };

  // ---------------------------------------------------------------- acabado
  /* Grano de pelicula: 6 lienzos de ruido horneados; se elige uno por fotograma (determinista) y se mezcla con 'overlay'. */
  D.grano = function (esc, t, fuerza = 0.06) {
    const i = Math.floor(t * 24) % 6, c = esc.cache.obtener('grano|' + i + '|' + esc.ss, () => {
      const w = 512, h = 512, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), img = g.createImageData(w, h), r = VE.rng('grano' + i);
      for (let p = 0; p < w * h; p++) { const v = 128 + (r() - 0.5) * 255; img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = v; img.data[p * 4 + 3] = 255; } g.putImageData(img, 0, 0); return cv; });
    const x = esc.ctx; x.save(); x.globalAlpha = fuerza; x.globalCompositeOperation = 'overlay'; const pat = x.createPattern(c, 'repeat'); x.fillStyle = pat; x.fillRect(0, 0, esc.W, esc.H); x.restore();
  };
  D.vineta = function (esc, o = {}) {
    const c = esc.cache.obtener('vineta|' + (o.arriba == null ? 0.3 : o.arriba) + '|' + (o.bordes == null ? 0.5 : o.bordes) + '|' + esc.W + 'x' + esc.H + '|' + esc.ss, () => {
      const cv = document.createElement('canvas'); cv.width = Math.round(esc.W * esc.ss); cv.height = Math.round(esc.H * esc.ss); const x = cv.getContext('2d'); x.scale(esc.ss, esc.ss); const W = esc.W, H = esc.H;
      const g = x.createLinearGradient(0, 0, 0, H * 0.3); g.addColorStop(0, `rgba(6,7,10,${0.92 * (o.arriba == null ? 0.3 : o.arriba) / 0.3})`); g.addColorStop(0.55, 'rgba(6,7,10,0.35)'); g.addColorStop(1, 'rgba(6,7,10,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H * 0.3);
      const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.bordes == null ? 0.5 : o.bordes})`); x.fillStyle = v; x.fillRect(0, 0, W, H); return cv; });
    esc.ctx.drawImage(c, 0, 0, esc.W, esc.H);
  };
  /* Camara 2D: amplia 'escala' veces alrededor de (cx, cy) llevando ese punto al centro (con escala 1 no mueve nada). */
  D.zoom = function (esc, o, dibujar) {
    const x = esc.ctx, s = o.escala || 1, k = c01(o.centrar == null ? (s - 1) / Math.max(1e-6, (o.escalaFinal || s) - 1) : o.centrar);
    x.save(); const tx = esc.W / 2 + (o.cx - esc.W / 2) * (1 - k), ty = esc.H / 2 + (o.cy - esc.H / 2) * (1 - k);
    x.translate(tx, ty); x.scale(s, s); x.translate(-o.cx, -o.cy); dibujar(); x.restore();
  };

  // ---------------------------------------------------------------- cierre: movil con hoja de compartir
  D.movil = function (esc, t, t0, o = {}) {
    const k0 = E.suaveSalida(c01((t - t0) / 0.7)); if (k0 <= 0) return; const x = esc.ctx, k = esc.k, W = 520 * k, H = W * 2.05, cx = esc.W / 2, cy = esc.H * 0.47 + (1 - k0) * 300 * k;
    x.save(); x.globalAlpha *= k0;
    x.fillStyle = 'rgba(0,0,0,0.45)'; redondo(x, cx - W / 2 + 10 * k, cy - H / 2 + 16 * k, W, H, 64 * k); x.fill();
    redondo(x, cx - W / 2, cy - H / 2, W, H, 64 * k); x.fillStyle = '#16181d'; x.fill(); x.strokeStyle = '#3a3e47'; x.lineWidth = 5 * k; x.stroke();
    const m = 18 * k, sx = cx - W / 2 + m, sy = cy - H / 2 + m, sw = W - 2 * m, sh = H - 2 * m;
    x.save(); redondo(x, sx, sy, sw, sh, 48 * k); x.clip(); x.fillStyle = '#0d0f13'; x.fillRect(sx, sy, sw, sh);
    if (o.captura) { const c = o.captura, r = Math.max(sw / c.width, sh / c.height); x.drawImage(c, sx + (sw - c.width * r) / 2, sy + (sh - c.height * r) / 2, c.width * r, c.height * r); }
    // hoja de compartir
    const hk = E.suaveSalida(c01((t - t0 - 0.5) / 0.5)), hh = sh * 0.42, hy = sy + sh - hh * hk;
    redondo(x, sx, hy, sw, hh + 40 * k, 34 * k); x.fillStyle = '#1e2128'; x.fill(); x.fillStyle = '#4a4f5a'; redondo(x, cx - 40 * k, hy + 14 * k, 80 * k, 8 * k, 4 * k); x.fill();
    fuente(esc, 26, 600); x.fillStyle = '#fff'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(o.texto || 'Enviar a', sx + 30 * k, hy + 58 * k);
    const cs = o.contactos || [['A', '#3b82f6', 'Ana'], ['L', '#a855f7', 'Leo'], ['M', '#ec4899', 'Marta'], ['D', '#eab308', 'Dani']];
    cs.forEach((c, i) => { const px = sx + sw * (i + 0.5) / cs.length, py = hy + 140 * k; x.fillStyle = c[1]; x.beginPath(); x.arc(px, py, 40 * k, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.textAlign = 'center'; fuente(esc, 34, 700); x.fillText(c[0], px, py + 2 * k); fuente(esc, 20, 500); x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillText(c[2], px, py + 66 * k); });
    const pulsa = c01((t - t0 - 1.5) / 0.25), enviado = t > t0 + 1.75, by = hy + 270 * k;
    redondo(x, sx + 30 * k, by - 30 * k, sw - 60 * k, 60 * k, 30 * k); x.fillStyle = enviado ? '#22c55e' : '#2563eb'; x.fill();
    fuente(esc, 26, 700); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(enviado ? 'Enviado ✓' : 'Enviar', cx, by + 1); x.restore();
    // dedo
    const dk = E.suave(c01((t - t0 - 0.9) / 0.6)), dx = cx + 60 * k, dy = by + 30 * k + (1 - dk) * 420 * k + (pulsa > 0 && pulsa < 1 ? 10 * k * Math.sin(pulsa * PI) : 0);
    x.translate(dx, dy); x.rotate(-0.25); const g = x.createLinearGradient(-40 * k, 0, 40 * k, 0); g.addColorStop(0, '#e9b48f'); g.addColorStop(0.6, '#f6cfae'); g.addColorStop(1, '#c98f6a');
    x.fillStyle = g; redondo(x, -38 * k, 0, 76 * k, 360 * k, 38 * k); x.fill(); x.fillStyle = 'rgba(255,240,230,0.6)'; redondo(x, -22 * k, 12 * k, 44 * k, 54 * k, 20 * k); x.fill();
    x.restore();
    if (t > t0 + 1.75 && t < t0 + 2.3) { const f = (t - t0 - 1.75) / 0.55; x.save(); x.strokeStyle = COL.verde; x.globalAlpha = 1 - f; x.lineWidth = 4 * k; x.beginPath(); x.arc(cx, by, (40 + f * 120) * k, 0, 7); x.stroke(); x.restore(); }
  };
  /* Cierre de un SHORT: oscurece y pone el letrero de VE.short «SIGUE A @randonautico». Solo con o.movil === true entra antes el movil «Envialo» (t0 .. t0+2,6). */
  D.cierre = function (esc, t, t0, o = {}) {
    if (t < t0) return; const x = esc.ctx, tl = o.movil === true ? t0 + (o.duracionMovil || 2.6) : t0 + 0.2;
    x.save(); x.fillStyle = `rgba(8,9,12,${0.85 * c01((t - t0) / 0.5)})`; x.fillRect(0, 0, esc.W, esc.H); x.restore();
    if (o.movil === true && t < tl + 0.4) { x.save(); x.globalAlpha *= 1 - c01((t - tl) / 0.4); D.movil(esc, t, t0 + 0.2, { captura: o.captura }); x.restore(); }
    if (t >= tl) VE.short.letrero(esc, t, tl + 0.15, { handle: o.handle || '@randonautico', cy: o.cy || esc.H * 0.45, logo: o.logo !== false });
  };
})(window.VE = window.VE || {});
