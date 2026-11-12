/* ESTILO RECORTES (stop-motion de muñecas de papel sobre tela vichy).
   Herramienta del motor, reutilizable en cualquier video. Lo que define el estilo:
   - Fondo de cuadros vichy con textura de tela, HORNEADO una vez (sin coste por fotograma).
   - Ilustracion plana pastel con contorno oscuro fino que "tiembla" (boil) en cada paso, como dibujo a mano.
   - Movimiento a saltos: el tiempo se cuantiza a R.FPS pasos/s (10 = "en treses" a 30 fps). Las apariciones son
     un "pop" de 3 pasos (pequeño, se pasa, asienta) y los desplazamientos van por posiciones discretas.
   Uso:
     R.paso(t)                                  -> inicia el fotograma (cuantiza t, reinicia la semilla del temblor)
     R.vichy(ancho, alto, {base, raya, celda})  -> canvas horneado
     R.forma(x, pts, {relleno, trazo, cerrado, j})  /  R.linea(x, pts, {trazo, ancho})
     R.con(x, tx, ty, s, rot, fn)               -> dibuja fn() en coordenadas locales escaladas (contorno constante)
     R.pop(t, t0) -> escala 0..1.15  ·  R.mover(t, t0, t1, a, b, ease) -> [x,y] a saltos
   Las figuras (chica, objetos de tocador, baño) estan en engine/estilos/recortes_figuras.js. */
(function (VE) {
  const R = VE.recorte = VE.recorte || {};
  R.FPS = 10;                 // pasos por segundo de la animacion (stop-motion)
  R.TINTA = '#3a2626';        // color del contorno
  R.LW = 3.2;                 // grosor del contorno en px de diseño
  R.J = 1.3;                  // amplitud del temblor en px de diseño
  R.k = 1;                    // escala acumulada (para mantener grosor y temblor constantes)
  let paso = 0, id = 0;

  R.paso = function (t) { paso = Math.floor(t * R.FPS + 1e-6); id = 0; R.k = 1; return paso / R.FPS; };
  R.tq = (t) => Math.floor(t * R.FPS + 1e-6) / R.FPS;     // tiempo cuantizado

  function h(a, b, c) {      // hash determinista -> [-1, 1]
    let n = (a * 374761393 + b * 668265263 + c * 1442695041) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
    return ((n >>> 0) / 4294967295) * 2 - 1;
  }

  function camino(x, P, cerrado) {
    const n = P.length; if (n < 2) return;
    x.moveTo(P[0][0], P[0][1]);
    const seg = cerrado ? n : n - 1;
    for (let i = 0; i < seg; i++) {
      const p1 = P[i], p2 = P[(i + 1) % n];
      const p0 = cerrado ? P[(i - 1 + n) % n] : (i === 0 ? p1 : P[i - 1]);
      const p3 = cerrado ? P[(i + 2) % n] : (i + 2 >= n ? p2 : P[i + 2]);
      x.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
                      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (cerrado) x.closePath();
  }
  function temblar(P, j) {
    const s = ++id, a = (j == null ? R.J : j) / R.k;
    return P.map((p, i) => [p[0] + a * h(paso, s, i * 2), p[1] + a * h(paso, s, i * 2 + 1)]);
  }
  R.trazar = function (x, pts, cerrado = true, j) { const P = temblar(pts, j); x.beginPath(); camino(x, P, cerrado); return P; };

  /* Forma rellena con contorno a mano. relleno puede ser color o funcion(x) que pinta dentro (se recorta a la forma). */
  R.forma = function (x, pts, o = {}) {
    const P = R.trazar(x, pts, o.cerrado !== false, o.j);
    if (o.relleno) {
      if (typeof o.relleno === 'function') {     // el relleno pinta sus propios caminos: se rehace la silueta para el contorno
        x.save(); x.clip(); o.relleno(x); x.restore(); x.beginPath(); camino(x, P, o.cerrado !== false);
      }
      else { x.fillStyle = o.relleno; x.fill(); }
    }
    if (o.trazo !== false) {
      x.lineWidth = (o.ancho || R.LW) / R.k; x.lineJoin = x.lineCap = 'round';
      x.strokeStyle = o.trazo || R.TINTA; x.stroke();
    }
  };
  R.linea = function (x, pts, o = {}) {
    R.trazar(x, pts, false, o.j);
    x.lineWidth = (o.ancho || R.LW) / R.k; x.lineJoin = x.lineCap = 'round';
    x.strokeStyle = o.trazo || R.TINTA; x.stroke();
  };
  R.elipse = function (cx, cy, rx, ry, n = 14, rot = 0) {
    const P = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, X = Math.cos(a) * rx, Y = Math.sin(a) * ry;
      P.push([cx + X * Math.cos(rot) - Y * Math.sin(rot), cy + X * Math.sin(rot) + Y * Math.cos(rot)]);
    }
    return P;
  };
  R.rect = (x0, y0, x1, y1, r = 0) => r ? [[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]]
                                        : [[x0, y0], [(x0 + x1) / 2, y0], [x1, y0], [x1, (y0 + y1) / 2], [x1, y1], [(x0 + x1) / 2, y1], [x0, y1], [x0, (y0 + y1) / 2]];
  R.espejo = (P) => P.map(p => [-p[0], p[1]]).reverse();
  R.punto = function (x, cx, cy, r, color) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fillStyle = color; x.fill(); };

  /* Transformacion local: el contorno y el temblor se mantienen constantes en pantalla. */
  R.con = function (x, tx, ty, s, rot, fn) {
    if (!(s > 0.001)) return;
    const k0 = R.k; x.save(); x.translate(tx, ty); if (rot) x.rotate(rot); x.scale(s, s); R.k = k0 * s;
    try { fn(); } finally { x.restore(); R.k = k0; }
  };

  /* POP de aparicion en pasos: 0 -> 0.55 -> 1.15 -> 0.95 -> 1. Con t1 (opcional) desaparece al reves. */
  R.pop = function (t, t0, t1) {
    const S = [0.55, 1.15, 0.95];
    const f = (u) => { const k = Math.floor((u + 1e-6) * R.FPS); return k < 0 ? 0 : k < S.length ? S[k] : 1; };
    let e = f(R.tq(t) - t0);
    if (t1 != null && t >= t1) { const k = Math.floor((R.tq(t) - t1 + 1e-6) * R.FPS); e = k <= 0 ? 1.1 : k === 1 ? 0.6 : 0; }
    return e;
  };
  R.ease = { lin: u => u, sale: u => 1 - Math.pow(1 - u, 3), entra: u => u * u * u, io: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    rebote: u => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + .75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + .9375; return n * (u -= 2.625 / d) * u + .984375; } };
  R.mover = function (t, t0, t1, a, b, ease = R.ease.io) {
    const u = Math.max(0, Math.min(1, (R.tq(t) - t0) / (t1 - t0))), e = ease(u);
    return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
  };
  R.entre = (t, a, b) => t >= a && t < b;
  R.u = (t, a, b) => Math.max(0, Math.min(1, (R.tq(t) - a) / (b - a)));

  /* Tela vichy horneada: dos juegos de rayas semitransparentes (el cruce sale mas oscuro) + grano de tela. */
  R.vichy = function (W, H, o = {}) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const base = o.base || '#fbe9ea', raya = o.raya || 'rgba(244,150,160,0.34)', cel = o.celda || 40;
    x.fillStyle = base; x.fillRect(0, 0, W, H);
    x.fillStyle = raya;
    for (let y = 0; y < H; y += cel * 2) x.fillRect(0, y, W, cel);
    for (let X = 0; X < W; X += cel * 2) x.fillRect(X, 0, cel, H);
    let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const g = o.grano == null ? 1 : o.grano, n = Math.round(W * H / 30 * g);          // hilos: trazos cortos claros y oscuros
    for (let i = 0; i < n; i++) {
      const px = rnd() * W, py = rnd() * H, hz = rnd() < .5, l = 2 + rnd() * 5;
      x.fillStyle = rnd() < .5 ? 'rgba(255,255,255,0.22)' : 'rgba(150,60,70,0.10)';
      if (hz) x.fillRect(px, py, l, 1); else x.fillRect(px, py, 1, l);
    }
    const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);   // vineta muy suave
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(120,40,50,0.10)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    return c;
  };

  /* Destello de 4 puntas (brillos de "listo"). */
  R.destello = function (x, cx, cy, r, color = '#fff6c8') {
    const k = r * 0.28;
    R.forma(x, [[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]],
      { relleno: color, ancho: 2.2, j: 0.6 });
  };

  /* Texto que se escribe solo (revelado a saltos de izquierda a derecha) con un lapiz en la punta. */
  R.escribir = function (x, txt, cx, cy, tam, u, o = {}) {
    x.save(); x.font = `${o.peso || 600} ${tam}px ${o.fuente || 'Fredoka, sans-serif'}`; x.textAlign = 'left'; x.textBaseline = 'middle';
    const w = x.measureText(txt).width, x0 = cx - w / 2, hasta = x0 + w * Math.max(0, Math.min(1, u));
    x.beginPath(); x.rect(x0 - 10, cy - tam, hasta - x0 + 10, tam * 2); x.clip();
    x.fillStyle = o.color || R.TINTA; x.fillText(txt, x0 + (h(paso, 999, 1) * .8), cy + (h(paso, 999, 2) * .8));
    x.restore();
    if (u > 0 && u < 1) {   // lapiz
      R.con(x, hasta + 8, cy + tam * .15, tam / 110, -0.6, () => {
        R.forma(x, R.rect(-8, -70, 8, 0), { relleno: '#f7c6d0' });
        R.forma(x, [[-8, 0], [8, 0], [0, 22]], { relleno: '#f3dcb8' });
        R.forma(x, R.rect(-8, -84, 8, -70), { relleno: '#e98fa3' });
      });
    }
  };
})(window.VE = window.VE || {});
