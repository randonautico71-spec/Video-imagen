/* REALISMO: paisajes pintados por capas con perspectiva atmosferica y luz direccional.
   VE.real.paisaje(esc, tg, { tipo, hora, a, semilla, deriva, nubes, noche })
     tipo: 'montanas' | 'lago' | 'llanura' | 'bosque' | 'costa' | 'desierto'      hora: alba | dia | atardecer | noche | tormenta
     a: 0..1 construccion (las capas entran de lejos a cerca)   deriva: px de paralaje   nubes: cuantas nubes a la deriva
   Cada capa se hornea UNA vez (cielo, cordilleras, colinas, agua con reflejo, bosque, suelo); por fotograma solo se pegan imagenes y se
   mueven las nubes. Devuelve { horizonte (y en px), capas } para colocar objetos encima con VE.real.objeto. */
(function (VE) {
  const R = VE.real, lerp = R.lerp, c01 = R.c01, PI = Math.PI, E = (v) => VE.ease.suave(c01(v));
  const ANCHO = 1.12;

  // ---------- cielo ----------
  R.cielo = function (esc, o) {
    const H = R.hora(o.hora), W = esc.W, Ht = esc.H, hz = (o.horizonte || 0.62) * Ht;
    return R.hornear(esc, 'cielo|' + (o.hora || 'dia') + '|' + hz + '|' + (o.semilla || ''), W, Ht, (x) => {
      const g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, H.cielo[0]); g.addColorStop(0.55, H.cielo[1]); g.addColorStop(1, H.cielo[2]); x.fillStyle = g; x.fillRect(0, 0, W, Ht);
      const r = VE.rng((o.semilla || 'c') + o.hora);
      if (H.estrellas > 0) for (let i = 0; i < 260 * H.estrellas; i++) { const sx = r() * W, sy = r() * hz * 0.92, b = Math.pow(r(), 3); x.fillStyle = `rgba(255,255,255,${(0.25 + b * 0.75) * H.estrellas})`; x.beginPath(); x.arc(sx, sy, 0.6 + b * 1.4, 0, 7); x.fill(); }
      if (H.sol) { const sx = H.sol.x * W, sy = H.sol.y * Ht, rr = H.sol.r * Ht; x.save(); x.globalCompositeOperation = 'lighter';
        const gg = x.createRadialGradient(sx, sy, 0, sx, sy, rr * 9); gg.addColorStop(0, R.alfa(H.luz, 0.55)); gg.addColorStop(0.18, R.alfa(H.luz, 0.22)); gg.addColorStop(1, R.alfa(H.luz, 0)); x.fillStyle = gg; x.fillRect(0, 0, W, Ht); x.restore();
        if (H.sol.luna) { R.bola(x, sx, sy, rr, '#fbfbf2', '#c9cfdd', -0.3, -0.3); x.fillStyle = 'rgba(120,130,150,0.28)'; [[-0.3, -0.1, 0.22], [0.25, 0.2, 0.17], [0.05, -0.4, 0.12], [-0.1, 0.45, 0.1]].forEach(([dx, dy, k]) => { x.beginPath(); x.arc(sx + dx * rr, sy + dy * rr, k * rr, 0, 7); x.fill(); }); }
        else { R.bola(x, sx, sy, rr, '#ffffff', H.sol.color, 0, 0); }
      }
      // banda de calima en el horizonte
      const cb = x.createLinearGradient(0, hz - Ht * 0.14, 0, hz + 2); cb.addColorStop(0, R.alfa(H.niebla, 0)); cb.addColorStop(1, R.alfa(H.niebla, 0.55)); x.fillStyle = cb; x.fillRect(0, hz - Ht * 0.14, W, Ht * 0.14 + 2);
    });
  };

  // ---------- cordillera: silueta fractal + relieve 2D (crestas y barrancos) sombreado por el gradiente en la direccion de la luz ----------
  R.cordillera = function (esc, o) {
    const H = R.hora(o.hora), Ht = esc.H, w = esc.W * ANCHO, d = o.dist == null ? 0.3 : o.dist;
    return R.hornear(esc, 'cord|' + [o.hora || 'dia', o.semilla, o.y, o.alto, o.dist, o.roca, o.nieve, o.freq].join('|'), w, Ht, (x) => {
      const n = R.ruido2(o.semilla), paso = 3, N = Math.ceil(w / paso), yb = o.y * Ht, amp = o.alto * Ht, f = o.freq || 2.4, alt = [];
      for (let i = 0; i <= N; i++) { const u = i * paso / w * f * 3; const v = n.fbm(u, 3.1, 5, 0.52), cresta = 1 - Math.abs(2 * n.fbm(u * 1.7 + 9, 1.3, 4, 0.5) - 1); alt.push(yb - amp * (Math.pow(v, 1.5) * 0.6 + Math.pow(cresta, 1.8) * 0.5)); }
      const P = R.tonos(o.roca || '#6f7b8c', H), blanco = R.mezcla('#ffffff', H.luz, 0.3), blancoSombra = R.mezcla('#cdd8ea', H.sombra, 0.5), fondo = Ht * (o.base || 1), top = Math.min.apply(null, alt), fin = Ht * (o.base || 1);
      const Z = (px, py, ai, sg) => { const warp = (n(py * 0.012, 5.3) - 0.5) * 70, q = (px + warp + (py - ai) * 0.5 * sg) * 0.011, r1 = 1 - Math.abs(2 * n.fbm(q, py * 0.0045, 4, 0.55) - 1), r2 = 1 - Math.abs(2 * n(q * 3.1 + 4, py * 0.013) - 1); return (yb - ai) * (1 - (py - ai) / (fin - ai) * 0.6) * 0.5 + amp * (r1 * 0.55 + r2 * 0.18); };
      const pasoY = 4, sm = []; for (let i = 0; i <= N; i++) { let a = 0, c = 0; for (let j = Math.max(1, i - 26); j <= Math.min(N - 1, i + 26); j++) { a += (alt[j + 1] - alt[j - 1]) / (2 * paso); c++; } sm.push(a / Math.max(1, c)); }
      x.save(); x.beginPath(); x.moveTo(0, fondo); alt.forEach((ay, i) => x.lineTo(i * paso, ay)); x.lineTo(w, fondo); x.closePath(); x.clip();
      for (let i = 1; i < N; i++) {
        const xx = i * paso, ai = alt[i], sg = sm[i] > 0 ? 1 : -1;
        for (let y = ai; y < fondo; y += pasoY) {
          const z0 = Z(xx - 9, y, ai, sg), z1 = Z(xx + 9, y, ai, sg), z2 = Z(xx, y - 9, ai, sg), z3 = Z(xx, y + 9, ai, sg), gx = (z1 - z0) / 18, gy = (z3 - z2) / 18;
          const mk = Math.max(1, Math.min(N - 1, i + Math.round((y - ai) * 0.55 * H.dir / paso))), macro = H.dir * sm[mk] * 3.4, l = c01(0.52 + macro + (-H.dir * gx) * 0.16 + gy * 0.05 - Math.min(0.1, (y - ai) / (amp * 6))), prof = (y - ai) / Math.max(40, fin - ai);
          let col = R.mezcla(P.sh, P.lit, l);
          const zalt = (yb - y) / amp; if (o.nieve != null && zalt + (n(xx * 0.02, y * 0.03) - 0.5) * 0.18 > o.nieve) col = R.mezcla(blancoSombra, blanco, c01(l * 1.2));
          col = R.mezcla(col, H.niebla, c01(d * 0.85 + Math.pow(prof, 2.2) * 0.4));
          x.fillStyle = col; x.fillRect(xx - 0.5, y, paso + 1, pasoY + 0.6);
        }
        const pend = (alt[i + 1] - alt[i - 1]) / (2 * paso), cara = c01(0.5 + H.dir * pend * 1.4);
        if (cara > 0.5) { x.fillStyle = R.alfa(P.rim, (cara - 0.5) * 1.2 * (1 - d)); x.fillRect(xx, ai - 0.6, paso, 2.2); }
      }
      x.restore();
    });
  };

  // ---------- colinas verdes/arena con hierba, motas y luz ----------
  R.colinas = function (esc, o) {
    const H = R.hora(o.hora), Ht = esc.H, w = esc.W * ANCHO, d = o.dist == null ? 0.2 : o.dist;
    return R.hornear(esc, 'col|' + [o.hora || 'dia', o.semilla, o.y, o.amp, o.dist, o.color].join('|'), w, Ht, (x) => {
      const n = R.ruido2(o.semilla), r = VE.rng(o.semilla + 'h'), P = R.tonos(o.color || '#5f9a46', H), paso = 3, N = Math.ceil(w / paso), yb = o.y * Ht, amp = o.amp * Ht, alt = [];
      for (let i = 0; i <= N; i++) alt.push(yb - amp * (n.fbm(i * paso / w * (o.freq || 3), 7.7, 4, 0.5) * 1.1 - 0.35));
      for (let i = 1; i < N; i++) { const xx = i * paso, pend = (alt[i + 1] - alt[i - 1]) / (2 * paso), cara = c01(0.55 + pend * H.dir * 1.2 * -1);
        const g = x.createLinearGradient(0, alt[i], 0, Ht); const lit = R.mezcla(R.mezcla(P.sh, P.lit, c01(cara + 0.1)), H.niebla, d), bajo = R.mezcla(R.oscurecer(P.sh, 0.25), H.niebla, d * 0.8);
        g.addColorStop(0, lit); g.addColorStop(0.35, R.mezcla(lit, bajo, 0.55)); g.addColorStop(1, bajo); x.fillStyle = g; x.fillRect(xx - 0.5, alt[i], paso + 1, Ht - alt[i]); }
      if (o.hierba !== false) for (let i = 0; i < w / 5; i++) { const xx = r() * w, k = Math.min(N - 1, Math.max(1, Math.round(xx / paso))), yy = alt[k] + r() * Ht * (o.hondo || 0.18), tam = lerp(2, 7, (yy - alt[k]) / (Ht * 0.18) + r() * 0.2) * (1 - d * 0.6);
        x.strokeStyle = R.mezcla(r() < 0.5 ? P.lit : P.mid, H.niebla, d); x.globalAlpha = 0.5; x.lineWidth = 1; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + (r() - 0.5) * tam, yy - tam * 1.6); x.stroke(); } x.globalAlpha = 1;
      (o.motas || []).forEach(([color, cuantas]) => { for (let i = 0; i < cuantas; i++) { const xx = r() * w, k = Math.min(N - 1, Math.max(1, Math.round(xx / paso))), yy = alt[k] + 6 + r() * Ht * 0.14; x.fillStyle = R.mezcla(color, H.niebla, d); x.beginPath(); x.arc(xx, yy, 1.6 + r() * 1.8, 0, 7); x.fill(); } });
      o._alt = alt; o._paso = paso;
    });
  };

  // ---------- agua: degradado del cielo, reflejo de la cordillera, destellos del sol/luna ----------
  R.agua = function (esc, o) {
    const H = R.hora(o.hora), W = esc.W, Ht = esc.H, yh = o.y * Ht;
    return R.hornear(esc, 'agua|' + [o.hora || 'dia', o.semilla, o.y, o.reflejo ? 1 : 0].join('|'), W, Ht, (x) => {
      const r = VE.rng(o.semilla + 'ag'), g = x.createLinearGradient(0, yh, 0, Ht); g.addColorStop(0, R.mezcla(H.cielo[2], H.niebla, 0.3)); g.addColorStop(0.35, R.mezcla(H.cielo[1], '#1a3a5a', 0.5)); g.addColorStop(1, R.mezcla(H.cielo[0], '#06182a', 0.65));
      x.fillStyle = g; x.fillRect(0, yh, W, Ht - yh);
      if (o.reflejo) { x.save(); x.beginPath(); x.rect(0, yh, W, Ht - yh); x.clip(); x.globalAlpha = 0.42; for (let b = 0; b < 26; b++) { const y0 = yh + (b / 26) * (Ht - yh), hh = (Ht - yh) / 26 + 1, dx = Math.sin(b * 1.7) * (1 + b * 0.25); x.save(); x.beginPath(); x.rect(0, y0, W, hh); x.clip(); x.translate(dx, 2 * yh); x.scale(1, -1); x.drawImage(o.reflejo.img, -(o.reflejo.w - W) / 2, 0, o.reflejo.w, Ht); x.restore(); } x.restore();
        const v = x.createLinearGradient(0, yh, 0, Ht); v.addColorStop(0, R.alfa(H.cielo[2], 0.0)); v.addColorStop(1, R.alfa('#06182a', 0.5)); x.fillStyle = v; x.fillRect(0, yh, W, Ht - yh); }
      if (H.sol) { const sx = H.sol.x * W; x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 90; i++) { const t = r(), yy = yh + 4 + t * t * (Ht - yh), ancho = lerp(10, 180, t) * (0.5 + r()), dx = (r() - 0.5) * lerp(40, 360, t); x.fillStyle = R.alfa(H.luz, (1 - t * 0.6) * 0.22 * (0.4 + r())); x.fillRect(sx + dx - ancho / 2, yy, ancho, lerp(1, 3.2, t)); } x.restore(); }
      for (let i = 0; i < 110; i++) { const t = r(), yy = yh + 6 + t * (Ht - yh), ancho = lerp(14, 120, t) * (0.4 + r()); x.fillStyle = R.alfa(r() < 0.5 ? '#ffffff' : H.sombra, 0.07); x.fillRect(r() * W, yy, ancho, lerp(0.8, 2, t)); }
    });
  };

  // ---------- bosque: filas de arboles horneados sobre una linea base ----------
  R.bosque = function (esc, o) {
    const H = R.hora(o.hora), Ht = esc.H, w = esc.W * ANCHO, d = o.dist == null ? 0.25 : o.dist;
    return R.hornear(esc, 'bos|' + [o.hora || 'dia', o.semilla, o.y, o.tam, o.n, o.dist, (o.figuras || []).join()].join('|'), w, Ht, (x) => {
      const r = VE.rng(o.semilla), fig = o.figuras || ['pino'];
      const lista = []; for (let i = 0; i < o.n; i++) lista.push([(i + r() * 0.9) / o.n * w, o.y * Ht + (r() - 0.5) * o.dispersion * Ht, o.tam * lerp(0.75, 1.25, r()), fig[Math.floor(r() * fig.length)], i]);
      lista.sort((a, b) => a[1] - b[1]);
      lista.forEach(([px, py, t, f, i]) => { const s = R.objeto(esc, f, { x: px, y: py, tam: t, hora: o.hora, semilla: o.semilla + f + (i % 5) }); });
      const v = x.createLinearGradient(0, 0, 0, Ht); x.globalCompositeOperation = 'source-atop'; x.fillStyle = R.alfa(H.niebla, d * 0.8); x.fillRect(0, 0, w, Ht); x.globalCompositeOperation = 'source-over';
    });
  };

  // ---------- composiciones ----------
  const PRESETS = {
    montanas: (o) => [
      { t: 'cord', semilla: 'm1', y: 0.58, alto: 0.38, dist: 0.62, roca: '#7d8da8', nieve: 0.62, freq: 2.0 },
      { t: 'cord', semilla: 'm2', y: 0.66, alto: 0.3, dist: 0.38, roca: '#697a92', nieve: 0.66, freq: 2.6 },
      { t: 'cord', semilla: 'm3', y: 0.74, alto: 0.2, dist: 0.2, roca: '#566a62', freq: 3.2 },
      { t: 'bosque', semilla: 'f1', y: 0.8, tam: 120, n: 40, dispersion: 0.03, dist: 0.2, figuras: ['pino'] },
      { t: 'col', semilla: 'c1', y: 0.84, amp: 0.1, dist: 0.0, color: '#4f8a3c', motas: [['#f3e063', 120], ['#ffffff', 60]] },
      { t: 'bosque', semilla: 'f2', y: 0.95, tam: 260, n: 7, dispersion: 0.04, dist: 0.0, figuras: ['pino', 'arbol'] }],
    lago: (o) => [
      { t: 'cord', semilla: 'l1', y: 0.6, alto: 0.34, dist: 0.58, roca: '#7d8da8', nieve: 0.6, freq: 2.2, id: 'lejana' },
      { t: 'cord', semilla: 'l2', y: 0.64, alto: 0.2, dist: 0.3, roca: '#5d7266', freq: 3.2, id: 'cercana' },
      { t: 'agua', y: 0.64, reflejo: 'cercana' },
      { t: 'bosque', semilla: 'f3', y: 0.665, tam: 70, n: 46, dispersion: 0.006, dist: 0.18, figuras: ['pino'] },
      { t: 'col', semilla: 'c2', y: 0.93, amp: 0.1, dist: 0, color: '#4f8a3c', hondo: 0.1, motas: [['#f3e063', 60]] },
      { t: 'bosque', semilla: 'f4', y: 1.0, tam: 330, n: 3, dispersion: 0.0, dist: 0, figuras: ['arbol', 'pino'] }],
    llanura: (o) => [
      { t: 'cord', semilla: 'p1', y: 0.6, alto: 0.12, dist: 0.6, roca: '#8394b0', freq: 2.6 },
      { t: 'col', semilla: 'p2', y: 0.66, amp: 0.05, dist: 0.5, color: '#6f9f58', freq: 2 },
      { t: 'col', semilla: 'p3', y: 0.74, amp: 0.07, dist: 0.28, color: '#5f9a46', freq: 2.4, motas: [['#ffffff', 40], ['#f0d14f', 50]] },
      { t: 'col', semilla: 'p4', y: 0.86, amp: 0.08, dist: 0.0, color: '#4f8a3c', freq: 1.8, motas: [['#f3e063', 140], ['#e8607a', 60], ['#ffffff', 80]] },
      { t: 'bosque', semilla: 'p5', y: 0.74, tam: 130, n: 6, dispersion: 0.03, dist: 0.25, figuras: ['arbol'] }],
    bosque: (o) => [
      { t: 'cord', semilla: 'b1', y: 0.55, alto: 0.2, dist: 0.62, roca: '#7d8da8', freq: 2.4 },
      { t: 'bosque', semilla: 'b2', y: 0.64, tam: 150, n: 60, dispersion: 0.015, dist: 0.5, figuras: ['pino'] },
      { t: 'bosque', semilla: 'b3', y: 0.74, tam: 230, n: 30, dispersion: 0.03, dist: 0.3, figuras: ['pino', 'arbol'] },
      { t: 'col', semilla: 'b4', y: 0.9, amp: 0.05, dist: 0, color: '#4a7f3a', hondo: 0.1 },
      { t: 'bosque', semilla: 'b5', y: 1.02, tam: 400, n: 3, dispersion: 0.02, dist: 0, figuras: ['pino', 'arbol'] }],
    costa: (o) => [
      { t: 'cord', semilla: 'k1', y: 0.58, alto: 0.1, dist: 0.7, roca: '#8394b0', freq: 3 },
      { t: 'agua', y: 0.58 },
      { t: 'col', semilla: 'k2', y: 0.9, amp: 0.1, dist: 0, color: '#c9ad78', hierba: false, hondo: 0.05 },
      { t: 'col', semilla: 'k3', y: 0.99, amp: 0.05, dist: 0, color: '#4f8a3c', hondo: 0.05 }],
    desierto: (o) => [
      { t: 'cord', semilla: 'd1', y: 0.6, alto: 0.1, dist: 0.5, roca: '#a98660', freq: 3 },
      { t: 'col', semilla: 'd2', y: 0.7, amp: 0.1, dist: 0.3, color: '#d2a86a', hierba: false, freq: 1.6 },
      { t: 'col', semilla: 'd3', y: 0.82, amp: 0.12, dist: 0.1, color: '#e2b878', hierba: false, freq: 1.3 },
      { t: 'col', semilla: 'd4', y: 0.95, amp: 0.1, dist: 0, color: '#d4a064', hierba: false, freq: 1.1 }]
  };
  R.presets = () => Object.keys(PRESETS);

  R.paisaje = function (esc, tg, o) {
    const H = R.hora(o.hora), tipo = o.tipo || 'montanas', cap = (o.capas || PRESETS[tipo](o)), a = o.a == null ? 1 : o.a, W = esc.W, Ht = esc.H, hz = (o.horizonte || 0.62);
    const x = esc.ctx; R.pegar(esc, R.cielo(esc, { hora: o.hora, horizonte: hz, semilla: o.semilla }), 0, Ht, { ax: 0, ay: 1 });
    const nu = o.nubes == null ? 4 : o.nubes;                                                    // nubes a la deriva, ANTES de las montanas
    for (let i = 0; i < nu; i++) { const r = VE.rng((o.semilla || 'n') + 'nb' + i), v = lerp(3, 9, r()), px = ((r() * W * 1.4 + tg * v) % (W * 1.4)) - W * 0.2, py = lerp(0.1, 0.34, r()) * Ht, t = lerp(130, 230, r());
      R.objeto(esc, 'nube', { x: px, y: py + t * 0.5, tam: t, hora: o.hora, semilla: 'n' + (i % 3), alfa: 0.92 * E(a * 2) }); }
    const refl = {}; let n = 0;
    cap.forEach((c, i) => { const alfa = E(a * 1.9 - i * 0.18), dx = (o.deriva == null ? 12 : o.deriva) * (i + 1) / cap.length * Math.sin(tg * 0.03);
      const base = Object.assign({ hora: o.hora }, c); let s;
      if (c.t === 'cord') { s = R.cordillera(esc, base); if (c.id) refl[c.id] = s; R.pegar(esc, s, W / 2 + dx, Ht, { ax: 0.5, ay: 1, alfa }); }
      else if (c.t === 'col') { s = R.colinas(esc, base); R.pegar(esc, s, W / 2 + dx, Ht, { ax: 0.5, ay: 1, alfa }); }
      else if (c.t === 'agua') { base.semilla = base.semilla || 'agua'; if (c.reflejo) base.reflejo = refl[c.reflejo]; s = R.agua(esc, base); R.pegar(esc, s, 0, Ht, { ax: 0, ay: 1, alfa }); }
      else if (c.t === 'bosque') { s = R.bosque(esc, base); R.pegar(esc, s, W / 2 + dx, Ht, { ax: 0.5, ay: 1, alfa }); } n++; });
    return { horizonte: hz * Ht, capas: n };
  };
})(window.VE = window.VE || {});
