/* REALISMO: base comun. Ilustracion "pintada" (volumen, luz direccional, textura, perspectiva atmosferica), NO contornos de luz.
   Todo se HORNEA una vez en lienzos (esc.cache.obtener) y por fotograma solo se pegan imagenes: sin ctx.filter ni shadowBlur.
   Una HORA del dia (VE.real.horas) fija cielo, color de la luz, de la sombra y de la niebla, y la comparten objetos y paisajes
   para que todo case. La luz viene de la izquierda (dir = -1) o de la derecha (dir = 1). */
(function (VE) {
  const R = VE.real = {};
  const c01 = (v) => Math.max(0, Math.min(1, v)), lerp = (a, b, t) => a + (b - a) * t;
  R.c01 = c01; R.lerp = lerp;

  // ---------- color ----------
  const rgb = (c) => VE.color.aRGB(c);
  R.mezcla = (a, b, t) => { const p = rgb(a), q = rgb(b); t = c01(t); return `rgb(${Math.round(lerp(p[0], q[0], t))},${Math.round(lerp(p[1], q[1], t))},${Math.round(lerp(p[2], q[2], t))})`; };
  R.alfa = (c, a) => VE.color.a(c, a);
  R.aclarar = (c, t) => R.mezcla(c, '#ffffff', t);
  R.oscurecer = (c, t) => R.mezcla(c, '#000000', t);

  // ---------- horas del dia ----------
  /* cielo: [cenit, medio, horizonte]; luz: color de la luz principal; sombra: color de las caras en sombra (azulado);
     niebla: color de la lejania; sol: {x,y} fraccion de pantalla, color, r; dir: lado de donde viene la luz; estrellas 0..1 */
  R.horas = {
    alba:      { cielo: ['#3b4f8f', '#d98c8c', '#ffd2a0'], luz: '#ffd6a8', sombra: '#3a3f6e', niebla: '#f1c3b0', sol: { x: 0.22, y: 0.56, color: '#fff0c8', r: 0.07 }, dir: -1, estrellas: 0.15, brillo: 0.95 },
    dia:       { cielo: ['#2f6fd0', '#6fa8e8', '#cfe6f8'], luz: '#fff4dc', sombra: '#3a4e8a', niebla: '#c4d9ee', sol: { x: 0.24, y: 0.2, color: '#fffbe8', r: 0.05 }, dir: -1, estrellas: 0, brillo: 1 },
    atardecer: { cielo: ['#2a2f6e', '#c9618a', '#ffb866'], luz: '#ffbf80', sombra: '#2c2a62', niebla: '#e9a37e', sol: { x: 0.72, y: 0.5, color: '#fff0b8', r: 0.075 }, dir: 1, estrellas: 0.25, brillo: 0.92 },
    noche:     { cielo: ['#04081c', '#0b1740', '#1c2f66'], luz: '#9fb4ff', sombra: '#050a22', niebla: '#1a2b5a', sol: { x: 0.72, y: 0.2, color: '#eaf0ff', r: 0.035, luna: true }, dir: 1, estrellas: 1, brillo: 0.6 },
    tormenta:  { cielo: ['#20262f', '#3c4654', '#6d7886'], luz: '#c8d2e0', sombra: '#1a2028', niebla: '#59636f', sol: null, dir: -1, estrellas: 0, brillo: 0.7 }
  };
  R.hora = (h) => { const o = R.horas[h || 'dia']; if (!o) throw new Error('Hora desconocida: ' + h + '. Hay: ' + Object.keys(R.horas).join(', ')); return o; };

  // ---------- ruido (determinista) ----------
  R.ruido2 = function (semilla) {
    const r = VE.rng(semilla), v = new Float32Array(512 * 512).map(() => r());
    const g = (x, y) => v[((y & 511) << 9) | (x & 511)];
    const val = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
      return lerp(lerp(g(xi, yi), g(xi + 1, yi), u), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u), w); };
    val.fbm = (x, y, o = 4, gan = 0.5) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += val(x * f, y * f) * a; n += a; a *= gan; f *= 2.03; } return s / n; };
    return val;
  };

  // ---------- lienzos y horneado ----------
  /* Hornea un sprite de (w x h) unidades de diseno; fn(ctx, w, h) dibuja en unidades de diseno. Se devuelve {img,w,h}. */
  R.hornear = function (esc, clave, w, h, fn) {
    return esc.cache.obtener('real|' + clave + '|' + esc.ss, () => {
      const ss = esc.ss, c = VE.atlas.lienzo(w * ss, h * ss), x = c.getContext('2d'); x.scale(ss, ss); x.lineJoin = 'round'; x.lineCap = 'round';
      const prev = esc.ctx; esc.ctx = x; try { fn(x, w, h); } finally { esc.ctx = prev; }
      return { img: c, w, h };
    });
  };
  R.pegar = function (esc, s, px, py, o = {}) {
    const x = esc.ctx, k = o.escala == null ? 1 : o.escala; x.save(); if (o.alfa != null) x.globalAlpha *= o.alfa;
    x.translate(px, py); if (o.espejo) x.scale(-1, 1); if (o.rot) x.rotate(o.rot);
    x.drawImage(s.img, -s.w * k * (o.ax == null ? 0.5 : o.ax), -s.h * k * (o.ay == null ? 1 : o.ay), s.w * k, s.h * k); x.restore();
  };

  // ---------- pintura ----------
  const ruta = (x, pts, cerrar = true) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); if (cerrar) x.closePath(); };
  R.ruta = ruta;
  /* Cara iluminada: relleno con degradado en la direccion de la luz entre `claro` y `oscuro`. */
  R.cara = function (x, pts, claro, oscuro, ang = Math.PI / 2, borde) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.hypot(x1 - x0, y1 - y0) / 2, dx = Math.cos(ang) * r, dy = Math.sin(ang) * r;
    const g = x.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy); g.addColorStop(0, claro); g.addColorStop(1, oscuro);
    ruta(x, pts); x.fillStyle = g; x.fill(); if (borde) { x.strokeStyle = borde; x.lineWidth = 1.2; x.stroke(); }
  };
  /* Motas de textura (piedra, corteza, hojas) recortadas a una ruta. */
  R.textura = function (x, pts, semilla, o = {}) {
    const r = VE.rng(semilla); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    x.save(); ruta(x, pts); x.clip(); const n = o.n || Math.round((x1 - x0) * (y1 - y0) / (o.dens || 90));
    for (let i = 0; i < n; i++) { const px = lerp(x0, x1, r()), py = lerp(y0, y1, r()), s = lerp(o.min || 1.2, o.max || 4, r());
      x.globalAlpha = (o.alfa || 0.14) * (0.4 + r() * 0.6); x.fillStyle = r() < (o.claras == null ? 0.4 : o.claras) ? (o.claro || '#fff') : (o.oscuro || '#000');
      if (o.ladrillo) x.fillRect(px, py, s * 3, s * 0.9); else { x.beginPath(); x.ellipse(px, py, s, s * (o.alto || 0.7), r() * 3, 0, 7); x.fill(); } }
    x.restore();
  };
  /* Suelta una sombra proyectada suave (elipse con degradado radial) bajo un objeto. */
  R.sombraSuelo = function (x, cx, cy, rx, ry, a = 0.4, col = '#000') {
    x.save(); x.translate(cx, cy); x.scale(1, ry / rx); const g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, R.alfa(col, a)); g.addColorStop(0.6, R.alfa(col, a * 0.5)); g.addColorStop(1, R.alfa(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, 7); x.fill(); x.restore();
  };
  /* Bola de luz difusa (nubes, copas, bruma): degradado radial con el centro iluminado. */
  R.bola = function (x, cx, cy, r, claro, oscuro, ox = -0.3, oy = -0.35) {
    const g = x.createRadialGradient(cx + r * ox, cy + r * oy, r * 0.05, cx, cy, r); g.addColorStop(0, claro); g.addColorStop(1, oscuro); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  };
})(window.VE = window.VE || {});
