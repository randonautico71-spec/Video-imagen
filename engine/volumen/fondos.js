/* VOLUMEN — FONDOS 2D para escenas 3D (horneados una vez; por fotograma solo drawImage).
     VE.vol.fondo.espacio(esc, {semilla, brillo})      negro azulado con estrellas y polvo
     VE.vol.fondo.estudio(esc, {pared, foco:[x,y]})    pared calida con un foco de luz (interior)
     VE.vol.fondo.plano(esc, {color})                  azul de plano tecnico con reticula (para el modo rayos X)
     VE.vol.fondo.cielo(esc, {hora, sol, horizonte})   cielo de VE.real.horas (alba, dia, atardecer, noche, tormenta) para exteriores 3D
   Todos aceptan {a} (opacidad) para fundir de uno a otro. */
(function (VE) {
  const V = VE.vol = VE.vol || {}, F = V.fondo = {};
  const hornear = (esc, clave, fn) => esc.cache.obtener('volfondo|' + clave + '|' + esc.W + 'x' + esc.H + '|' + esc.ss, () => {
    const c = document.createElement('canvas'); c.width = Math.round(esc.W * esc.ss); c.height = Math.round(esc.H * esc.ss); const x = c.getContext('2d'); x.scale(esc.ss, esc.ss); fn(x, esc.W, esc.H); return c; });
  const pegar = (esc, c, a) => { const x = esc.ctx; x.save(); if (a != null) x.globalAlpha *= a; x.drawImage(c, 0, 0, esc.W, esc.H); x.restore(); };
  F.espacio = function (esc, o = {}) {
    pegar(esc, hornear(esc, 'espacio|' + (o.semilla || 'e'), (x, W, H) => {
      const g = x.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.8); g.addColorStop(0, '#0d1838'); g.addColorStop(0.6, '#060b1e'); g.addColorStop(1, '#02040c');
      x.fillStyle = g; x.fillRect(0, 0, W, H); const r = VE.rng(o.semilla || 'e');
      for (let i = 0; i < 26; i++) { const cx = r() * W, cy = r() * H, rr = (0.1 + r() * 0.3) * Math.max(W, H), h = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
        h.addColorStop(0, `rgba(${r() < 0.5 ? '80,110,200' : '140,90,170'},0.05)`); h.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = h; x.fillRect(0, 0, W, H); }
      const n = Math.round(W * H / 1400); for (let i = 0; i < n; i++) { const s = Math.pow(r(), 6) * 2.4 + 0.35; x.globalAlpha = 0.25 + r() * 0.75; x.fillStyle = r() < 0.15 ? '#cfe0ff' : (r() < 0.1 ? '#ffe2c0' : '#ffffff');
        x.beginPath(); x.arc(r() * W, r() * H, s, 0, 7); x.fill(); } x.globalAlpha = 1;
    }), o.a);
  };
  F.estudio = function (esc, o = {}) {
    const pared = o.pared || '#5b3b55', foco = o.foco || [0.3, 0.25];
    pegar(esc, hornear(esc, 'estudio|' + pared + '|' + foco, (x, W, H) => {
      x.fillStyle = pared; x.fillRect(0, 0, W, H); const fx = foco[0] * W, fy = foco[1] * H, R = Math.max(W, H) * 0.75, g = x.createRadialGradient(fx, fy, 0, fx, fy, R);
      g.addColorStop(0, 'rgba(255,190,130,0.42)'); g.addColorStop(0.35, 'rgba(230,140,110,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const v = x.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(10,5,20,0.35)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,5,10,0.4)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
    }), o.a);
  };
  F.plano = function (esc, o = {}) {
    const c = o.color || '#0b1f4d';
    pegar(esc, hornear(esc, 'plano|' + c, (x, W, H) => {
      const g = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75); g.addColorStop(0, c); g.addColorStop(1, '#030918'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const p = Math.round(Math.min(W, H) / 22); x.strokeStyle = 'rgba(120,170,255,0.07)'; x.lineWidth = 1;
      for (let i = 0; i <= W; i += p) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let j = 0; j <= H; j += p) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
      x.strokeStyle = 'rgba(120,170,255,0.13)'; for (let i = 0; i <= W; i += p * 5) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let j = 0; j <= H; j += p * 5) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    }), o.a);
  };

  /* Cielo de una hora del dia (colores de VE.real.horas): degradado, sol o luna y nubes suaves. sol: {x, y} en fraccion de pantalla (o null). */
  F.cielo = function (esc, o = {}) {
    const H0 = VE.real.hora(o.hora || 'atardecer'), sol = o.sol === undefined ? H0.sol : o.sol;
    pegar(esc, hornear(esc, 'cielo|' + (o.hora || 'atardecer') + '|' + JSON.stringify(sol) + '|' + (o.horizonte || 0.55) + '|' + (o.nubes == null ? 1 : o.nubes), (x, W, H) => {
      const hz = (o.horizonte || 0.55) * H, g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, H0.cielo[0]); g.addColorStop(0.55, H0.cielo[1]); g.addColorStop(1, H0.niebla || H0.cielo[2]);
      x.fillStyle = g; x.fillRect(0, 0, W, H); x.fillStyle = H0.niebla || H0.cielo[2]; x.fillRect(0, hz, W, H - hz);
      if (sol) { const sx = sol.x * W, sy = sol.y * H, R = Math.max(W, H) * 0.5, h = x.createRadialGradient(sx, sy, 0, sx, sy, R);
        h.addColorStop(0, VE.color.a(sol.color, 0.65)); h.addColorStop(0.15, VE.color.a(sol.color, 0.25)); h.addColorStop(1, VE.color.a(sol.color, 0)); x.fillStyle = h; x.fillRect(0, 0, W, H);
        x.fillStyle = sol.color; x.beginPath(); x.arc(sx, sy, sol.r * Math.min(W, H) * 0.8, 0, 7); x.fill(); }
      const r = VE.rng('cielo' + (o.hora || '')), n = Math.round(14 * (o.nubes == null ? 1 : o.nubes));
      for (let i = 0; i < n; i++) { const cx = r() * W, cy = hz * (0.12 + r() * 0.75), w = W * (0.25 + r() * 0.45);
        for (let k = 0; k < 22; k++) { const px = cx + (r() - 0.5) * w, py = cy + (r() - 0.5) * w * 0.06, rr = w * (0.07 + r() * 0.1), q = x.createRadialGradient(px, py - rr * 0.3, 0, px, py, rr);
          q.addColorStop(0, VE.color.a(H0.luz, 0.16)); q.addColorStop(0.6, VE.color.a(H0.cielo[1], 0.09)); q.addColorStop(1, VE.color.a(H0.cielo[1], 0)); x.fillStyle = q; x.beginPath(); x.ellipse(px, py, rr * 3, rr * 0.7, 0, 0, 7); x.fill(); } }
    }), o.a);
  };

  /* Grafismos 2D anclados a puntos 3D (se dibujan DESPUES de V.render). */
  /* Linea por puntos 3D proyectados. o: {color, ancho, discontinua:[a,b], progreso 0..1, oculta(p)->true si el punto esta tapado (se dibuja tenue)} */
  V.linea = function (esc, cam, pts, o = {}) {
    const x = esc.ctx, n = pts.length, hasta = (o.progreso == null ? 1 : o.progreso) * (n - 1); if (hasta <= 0) return;
    const P = pts.map(p => V.proyectar(esc, cam, p)); x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = (o.ancho || 5) * esc.k; x.strokeStyle = o.color || '#ffd36b';
    if (o.discontinua) x.setLineDash(o.discontinua.map(v => v * esc.k));
    let tramoOculto = null; x.beginPath();   // null = sin tramo abierto
    for (let i = 0; i <= Math.ceil(hasta) && i < n; i++) {
      if (!P[Math.min(i, n - 1)].delante) { if (i) x.stroke(); x.beginPath(); tramoOculto = null; continue; }
      let q = P[i]; if (i > hasta) { const k = hasta - Math.floor(hasta); q = { x: P[i - 1].x + (P[i].x - P[i - 1].x) * k, y: P[i - 1].y + (P[i].y - P[i - 1].y) * k }; }
      const oc = o.oculta ? o.oculta(pts[Math.min(i, n - 1)]) : false;
      if (tramoOculto === null || oc !== tramoOculto) { if (tramoOculto !== null) { x.lineTo(q.x, q.y); x.globalAlpha = tramoOculto ? 0.18 : 1; x.stroke(); x.beginPath(); } x.moveTo(q.x, q.y); tramoOculto = oc; }
      else x.lineTo(q.x, q.y);
    }
    x.globalAlpha = tramoOculto ? 0.18 : 1; x.stroke(); x.restore();
  };
  /* Punto luminoso (marcador) en un punto 3D. */
  V.marcador = function (esc, cam, p, o = {}) {
    const q = V.proyectar(esc, cam, p); if (!q.delante) return q; const x = esc.ctx, r = (o.radio || 12) * esc.k, a = o.a == null ? 1 : o.a; if (a <= 0) return q;
    x.save(); x.globalAlpha *= a; esc.pegar(esc.cache.halo(Math.round(r * 4), o.color || '#ffd36b', 0.3), q.x, q.y, 1);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(q.x, q.y, r * 0.55, 0, 7); x.fill(); x.lineWidth = 3 * esc.k; x.strokeStyle = o.color || '#ffd36b'; x.beginPath(); x.arc(q.x, q.y, r * (0.9 + 0.5 * (o.pulso || 0)), 0, 7); x.stroke(); x.restore(); return q;
  };
})(window.VE = window.VE || {});
