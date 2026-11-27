/* VOLUMEN — FONDO DINAMICO «AURORA» (2D, tras la escena 3D). Capas horneadas una vez; por fotograma solo drawImage (sin ctx.filter ni shadowBlur).
     VE.vol.fondo.aurora(esc, t, {paleta:'noche'|'mar'|'calido'|'violeta', semilla, intensidad, rayos:true, orbes:true})
   t = tiempo continuo del vídeo (ctx.tg): así el fondo no se reinicia al cambiar de escena.
   Capas (de atrás adelante): degradado base · dos nebulosas que derivan en sentidos opuestos · cortinas de aurora que ondulan · haces de luz que giran lentos ·
   tres capas de estrellas con paralaje y parpadeo · orbes luminosos que suben como burbujas de sueño. */
(function (VE) {
  const V = VE.vol = VE.vol || {}, F = V.fondo = V.fondo || {};
  const PAL = {
    noche:   { base: ['#040820', '#0b1240', '#1a1046'], a: ['#4f73ff', '#8f5cff', '#22d3ff'], b: '#ff7ad9', rayo: '#9fb4ff' },
    violeta: { base: ['#0a0422', '#220a48', '#3a0f55'], a: ['#b06bff', '#ff6fd8', '#6f8bff'], b: '#7be7ff', rayo: '#e0b0ff' },
    mar:     { base: ['#01121a', '#05363f', '#0a5c58'], a: ['#2ff0c8', '#2aa8ff', '#86ffcf'], b: '#e0ffb0', rayo: '#a8fff0' },
    calido:  { base: ['#120619', '#2b1033', '#4a1a3a'], a: ['#ffb26b', '#ff6f91', '#ffd36b'], b: '#9fb4ff', rayo: '#ffd9a0' }
  };
  const mod = (a, n) => ((a % n) + n) % n;
  const hornear = (esc, clave, w, h, fn) => esc.cache.obtener('aur|' + clave + '|' + Math.round(w) + 'x' + Math.round(h) + '|' + esc.ss, () => {
    const c = document.createElement('canvas'); c.width = Math.round(w * esc.ss); c.height = Math.round(h * esc.ss); const x = c.getContext('2d'); x.scale(esc.ss, esc.ss); fn(x, w, h); return c; });
  const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

  F.aurora = function (esc, t, o = {}) {
    const P = PAL[o.paleta || 'noche'] || PAL.noche, sem = (o.semilla || 'aur') + (o.paleta || 'noche'), W = esc.W, H = esc.H, x = esc.ctx, I = o.intensidad == null ? 1 : o.intensidad;
    x.save();
    // 1. degradado base
    x.drawImage(hornear(esc, 'base|' + sem, W, H, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.base[0]); g.addColorStop(0.55, P.base[1]); g.addColorStop(1, P.base[2]); c.fillStyle = g; c.fillRect(0, 0, W, H); }), 0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    // 2. nebulosas (dos capas con derivas distintas = profundidad)
    for (let k = 0; k < 2; k++) {
      const NW = W * 1.5, NH = H * 1.35, neb = hornear(esc, 'neb' + k + '|' + sem, NW, NH, (c, w, h) => {
        const r = VE.rng(sem + 'n' + k);
        for (let i = 0; i < 34; i++) { const cx = r() * w, cy = r() * h, rr = (0.12 + r() * 0.3) * Math.max(W, H), col = P.a[Math.floor(r() * P.a.length)], g = c.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g.addColorStop(0, rgba(col, 0.20 + r() * 0.16)); g.addColorStop(0.55, rgba(col, 0.06)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } });
      const s = k ? -1 : 1, px = (-0.25 * W) + s * 0.13 * W * Math.sin(t * (0.10 + 0.04 * k) + k * 2), py = (-0.17 * H) + s * 0.10 * H * Math.cos(t * (0.075 + 0.03 * k) + k);
      x.globalAlpha = (k ? 0.55 : 0.85) * I; x.drawImage(neb, px, py, NW, NH);
    }
    // 3. cortinas de aurora (franjas verticales que ondulan)
    const cortinas = [{ y: 0.14, alt: 0.34, col: P.a[0], ph: 0.0, v: 0.55 }, { y: 0.46, alt: 0.30, col: P.a[2], ph: 2.1, v: 0.7 }, { y: 0.70, alt: 0.26, col: P.a[1], ph: 4.0, v: 0.45 }];
    cortinas.forEach((cu, ci) => {
      const cw = W * 1.2, ch = H * cu.alt, can = hornear(esc, 'cor' + ci + '|' + sem, cw, ch, (c, w, h) => {
        const r = VE.rng(sem + 'c' + ci);
        for (let px = 0; px < w; px += 2) { const q = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(px * 0.018 + 3 * Math.sin(px * 0.0051 + ci) + r() * 0.4), 2), g = c.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, rgba(cu.col, 0)); g.addColorStop(0.65, rgba(cu.col, 0.20 * q)); g.addColorStop(0.9, rgba(P.b, 0.16 * q)); g.addColorStop(1, rgba(cu.col, 0)); c.fillStyle = g; c.fillRect(px, 0, 2.4, h); } });
      const n = 26, sw = can.width / n, dw = cw / n, baseX = -0.1 * W + 0.06 * W * Math.sin(t * 0.12 * cu.v + cu.ph);
      x.globalAlpha = (0.5 + 0.22 * Math.sin(t * 0.5 * cu.v + cu.ph)) * I;
      for (let k = 0; k < n; k++) { const dy = H * cu.y + 0.045 * H * Math.sin(k * 0.42 + t * 0.7 * cu.v + cu.ph) + 0.02 * H * Math.sin(k * 0.9 - t * 0.4 + cu.ph); x.drawImage(can, k * sw, 0, sw + 1, can.height, baseX + k * dw, dy, dw + 1.5, ch); }
    });
    // 4. haces de luz que giran despacio desde arriba
    if (o.rayos !== false) {
      const L = Math.max(W, H) * 1.5, ray = hornear(esc, 'ray|' + sem, L, L * 0.5, (c, w, h) => { const r = VE.rng(sem + 'r');
        for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 0.9 + 0.1 + r() * 0.12, wd = 0.03 + r() * 0.05, g = c.createLinearGradient(w / 2, 0, w / 2 + Math.cos(a) * h * 1.6, Math.sin(a) * h * 1.6);
          g.addColorStop(0, rgba(P.rayo, 0.30)); g.addColorStop(1, rgba(P.rayo, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2 + Math.cos(a - wd) * h * 1.7, Math.sin(a - wd) * h * 1.7); c.lineTo(w / 2 + Math.cos(a + wd) * h * 1.7, Math.sin(a + wd) * h * 1.7); c.closePath(); c.fill(); } });
      x.save(); x.translate(W * 0.5, -H * 0.05); x.rotate(0.22 * Math.sin(t * 0.13)); x.globalAlpha = (0.30 + 0.12 * Math.sin(t * 0.4)) * I; x.drawImage(ray, -L / 2, 0, L, L * 0.5); x.restore();
    }
    // 5. estrellas con paralaje (3 capas) y parpadeo
    for (let k = 0; k < 3; k++) {
      const st = hornear(esc, 'est' + k + '|' + sem, W, H, (c, w, h) => { const r = VE.rng(sem + 's' + k), n = Math.round(w * h / (2600 - k * 500));
        for (let i = 0; i < n; i++) { const s = (0.5 + Math.pow(r(), 4) * 2.2) * (0.7 + k * 0.45); c.globalAlpha = 0.35 + r() * 0.65; c.fillStyle = r() < 0.15 ? '#cfe0ff' : (r() < 0.1 ? '#ffe2c0' : '#ffffff'); c.beginPath(); c.arc(r() * w, r() * h, s, 0, 7); c.fill(); } });
      const vel = [5, 12, 26][k], oy = mod(t * vel, H), ox = 14 * Math.sin(t * 0.09 + k) * (k + 1);
      x.globalAlpha = (0.55 + 0.30 * Math.sin(t * (1.1 + k * 0.7) + k * 2)) * I;
      x.drawImage(st, ox, oy, W, H); x.drawImage(st, ox, oy - H, W, H);
    }
    // 6. orbes que suben como burbujas de sueño
    if (o.orbes !== false) {
      const r = VE.rng(sem + 'o'), cols = P.a.concat([P.b]);
      for (let i = 0; i < 20; i++) {
        const sz = (24 + r() * 80) * esc.k, col = cols[i % cols.length], vel = 14 + r() * 36, x0 = r() * W, ph = r() * 9, y0 = r() * (H + 300), sp = hornear(esc, 'orb' + i + '|' + sem, sz * 2, sz * 2, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.4, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, w, h); });
        const yy = H + 150 - mod(y0 + t * vel * esc.k, H + 300), xx = x0 + 40 * Math.sin(t * 0.35 + ph) * esc.k;
        x.globalAlpha = (0.35 + 0.35 * Math.sin(t * 0.8 + ph)) * I; x.drawImage(sp, xx - sz, yy - sz, sz * 2, sz * 2);
      }
    }
    x.restore();
  };
})(window.VE);
