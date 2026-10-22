/* REALISMO: objetos reales dibujados con volumen (caras iluminadas/en sombra, cilindros con degradado, textura de piedra/corteza/hojas).
   VE.real.objeto(esc, nombre, { x, y, tam, hora, semilla, espejo, alfa }) -> (x,y) es el CENTRO DE LA BASE; tam = ALTO en unidades de diseno.
   Cada objeto se hornea una vez por (nombre, hora, semilla, variante). Para anadir uno: VE.real.definirObjeto(nombre, {w, h, dibujar(x, w, h, H, T, o)}).
   La geometria se dibuja SIEMPRE con la luz a la izquierda; si la hora trae la luz a la derecha, se espeja el lienzo. */
(function (VE) {
  const R = VE.real, lerp = R.lerp, DEF = {}, PI = Math.PI;
  R.definirObjeto = (n, d) => { DEF[n] = d; };
  R.objetos = () => Object.keys(DEF);

  /* Tonos de un material segun la hora: lit (cara a la luz), mid, sh (sombra), rim (borde de luz). */
  const tonos = (base, H) => { base = R.oscurecer(base, (1 - H.brillo) * 1.1); const lit = R.mezcla(R.aclarar(base, 0.22), H.luz, 0.38 * H.brillo), sh = R.oscurecer(R.mezcla(base, H.sombra, 0.62), 0.12);
    return { lit, mid: R.mezcla(lit, sh, 0.45), sh, rim: R.aclarar(H.luz, 0.35) }; };
  R.tonos = tonos;

  R.objeto = function (esc, nombre, o) {
    const d = DEF[nombre]; if (!d) throw new Error('Objeto desconocido: ' + nombre + '. Hay: ' + R.objetos().join(', '));
    const H = R.hora(o.hora), esp = o.dir != null ? o.dir : H.dir, sem = o.semilla || nombre, tam = o.tam || 300;
    const clave = [nombre, o.hora || 'dia', sem, o.variante || '', Math.round(tam), esp].join('|');
    const w = d.w * tam / d.h, h = tam;
    const s = R.hornear(esc, 'obj|' + clave, w, h, (x) => {
      x.save(); x.scale(w / d.w, h / d.h);
      if (esp > 0) { x.translate(d.w, 0); x.scale(-1, 1); }
      d.dibujar(x, d.w, d.h, H, tonos, { semilla: sem, variante: o.variante, noche: o.hora === 'noche' }); x.restore();
    });
    R.pegar(esc, s, o.x, o.y, { espejo: o.espejo, alfa: o.alfa });
    return s;
  };

  /* ---------- CASTILLO ---------- */
  R.definirObjeto('castillo', { w: 560, h: 400, dibujar(x, w, h, H, T, o) {
    const P = T('#b9a07a', H), PT = T('#8a4a3a', H), base = h - 18;
    R.sombraSuelo(x, w * 0.5, base + 6, w * 0.5, 16, 0.45, H.sombra);
    const ladrillos = (x0, x1, top, sem) => { R.textura(x, [[x0, top], [x1, top], [x1, base], [x0, base]], sem, { ladrillo: 1, dens: 90, alfa: 0.12, min: 2, max: 3.6 });
      x.strokeStyle = R.alfa(P.sh, 0.35); x.lineWidth = 1; for (let y = top + 12; y < base; y += 12) { x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke(); } };
    const torre = (cx, ancho, top, roof) => {
      const x0 = cx - ancho / 2, g = x.createLinearGradient(x0, 0, x0 + ancho, 0); g.addColorStop(0, P.rim); g.addColorStop(0.12, P.lit); g.addColorStop(0.6, P.mid); g.addColorStop(1, P.sh);
      x.fillStyle = g; x.fillRect(x0, top, ancho, base - top); ladrillos(x0, x0 + ancho, top, o.semilla + 't' + cx);
      const vo = ancho * 0.14; R.cara(x, [[x0 - vo, top], [x0 + ancho + vo, top], [x0 + ancho + vo, top + 10], [x0 - vo, top + 10]], P.lit, P.sh, 0);
      if (roof) { const gg = x.createLinearGradient(x0, 0, x0 + ancho, 0); gg.addColorStop(0, PT.lit); gg.addColorStop(0.55, PT.mid); gg.addColorStop(1, PT.sh);
        x.fillStyle = gg; x.beginPath(); x.moveTo(x0 - vo - 3, top); x.lineTo(cx, top - roof); x.lineTo(x0 + ancho + vo + 3, top); x.closePath(); x.fill();
        x.strokeStyle = R.alfa(PT.sh, 0.5); x.lineWidth = 1; for (let k = 1; k < 7; k++) { const t = k / 7, yy = top - roof + roof * t, hw = (ancho / 2 + vo + 3) * t; x.beginPath(); x.moveTo(cx - hw, yy); x.lineTo(cx + hw, yy); x.stroke(); } }
      for (let k = 0; k < 2; k++) { const wy = top + 42 + k * 62; x.fillStyle = '#1a1410'; x.fillRect(cx - 3, wy, 6, 24); if (o.noche) { x.fillStyle = 'rgba(255,190,90,0.9)'; x.fillRect(cx - 2, wy + 2, 4, 20); } }
    };
    const muro = (x0, x1, top) => {
      const g = x.createLinearGradient(0, top, 0, base); g.addColorStop(0, P.lit); g.addColorStop(1, P.mid); x.fillStyle = g; x.fillRect(x0, top, x1 - x0, base - top); ladrillos(x0, x1, top, o.semilla + 'm' + x0);
      for (let xx = x0; xx < x1 - 16; xx += 30) { R.cara(x, [[xx, top - 14], [xx + 16, top - 14], [xx + 16, top], [xx, top]], P.lit, P.mid, 0); x.fillStyle = R.alfa(P.sh, 0.55); x.fillRect(xx + 12, top - 14, 4, 14); }
      const gb = x.createLinearGradient(0, base - 40, 0, base); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, R.alfa(H.sombra, 0.5)); x.fillStyle = gb; x.fillRect(x0, base - 40, x1 - x0, 40);
    };
    muro(40, 520, base - 150);
    torre(96, 74, base - 260, 80); torre(464, 74, base - 260, 80);
    const kx = 218, kw = 124, kt = base - 330;
    R.cara(x, [[kx, kt], [kx + kw, kt], [kx + kw, base], [kx, base]], P.lit, P.mid, 0);
    R.cara(x, [[kx + kw, kt], [kx + kw + 36, kt + 14], [kx + kw + 36, base], [kx + kw, base]], P.sh, R.oscurecer(P.sh, 0.2), PI / 2);
    ladrillos(kx, kx + kw + 36, kt, o.semilla + 'k');
    for (let xx = kx; xx < kx + kw - 14; xx += 28) R.cara(x, [[xx, kt - 16], [xx + 16, kt - 16], [xx + 16, kt], [xx, kt]], P.lit, P.mid, 0);
    for (let k = 0; k < 2; k++) { const wx = kx + 30 + k * 52, wy = kt + 56; x.fillStyle = '#17110d'; x.beginPath(); x.moveTo(wx, wy + 34); x.lineTo(wx, wy + 10); x.arc(wx + 9, wy + 10, 9, PI, 0); x.lineTo(wx + 18, wy + 34); x.closePath(); x.fill();
      if (o.noche) { x.fillStyle = 'rgba(255,196,100,0.95)'; x.fillRect(wx + 3, wy + 10, 12, 22); } x.strokeStyle = P.rim; x.lineWidth = 1.2; x.stroke(); }
    const px = w / 2 - 28; x.fillStyle = '#120d0a'; x.beginPath(); x.moveTo(px, base); x.lineTo(px, base - 52); x.arc(px + 28, base - 52, 28, PI, 0); x.lineTo(px + 56, base); x.closePath(); x.fill();
    x.strokeStyle = '#4a3a2a'; x.lineWidth = 2; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(px + k * 11, base - 74); x.lineTo(px + k * 11, base); x.stroke(); } for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(px + 2, base - 14 - k * 14); x.lineTo(px + 54, base - 14 - k * 14); x.stroke(); }
    x.strokeStyle = P.rim; x.lineWidth = 3; x.beginPath(); x.moveTo(px - 3, base); x.lineTo(px - 3, base - 52); x.arc(px + 28, base - 52, 31, PI, 0); x.lineTo(px + 59, base); x.stroke();
    x.strokeStyle = '#2a2018'; x.lineWidth = 3; x.beginPath(); x.moveTo(kx + 62, kt - 16); x.lineTo(kx + 62, kt - 70); x.stroke();
    x.fillStyle = '#b3262e'; x.beginPath(); x.moveTo(kx + 63, kt - 68); x.quadraticCurveTo(kx + 90, kt - 62, kx + 108, kt - 70); x.lineTo(kx + 100, kt - 56); x.lineTo(kx + 108, kt - 42); x.quadraticCurveTo(kx + 90, kt - 50, kx + 63, kt - 44); x.closePath(); x.fill();
  } });

  /* ---------- ARBOL FRONDOSO ---------- */
  R.definirObjeto('arbol', { w: 320, h: 400, dibujar(x, w, h, H, T, o) {
    const r = VE.rng(o.semilla), M = T('#5a4330', H), base = h - 6; R.sombraSuelo(x, w * 0.5, base, w * 0.34, 14, 0.4, H.sombra);
    const tg = x.createLinearGradient(w * 0.42, 0, w * 0.6, 0); tg.addColorStop(0, M.lit); tg.addColorStop(0.5, M.mid); tg.addColorStop(1, M.sh);
    x.fillStyle = tg; x.beginPath(); x.moveTo(w * 0.42, base); x.bezierCurveTo(w * 0.46, base - 70, w * 0.45, base - 110, w * 0.46, base - 150); x.lineTo(w * 0.55, base - 150); x.bezierCurveTo(w * 0.55, base - 110, w * 0.56, base - 70, w * 0.6, base); x.closePath(); x.fill();
    x.strokeStyle = R.alfa(M.sh, 0.6); x.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const xx = w * (0.44 + r() * 0.14); x.beginPath(); x.moveTo(xx, base - r() * 20); x.bezierCurveTo(xx + 3, base - 50, xx - 3, base - 90, xx + 1, base - 100 - r() * 40); x.stroke(); }
    x.strokeStyle = M.mid; x.lineWidth = 9; x.beginPath(); x.moveTo(w * 0.5, base - 120); x.quadraticCurveTo(w * 0.36, base - 160, w * 0.3, base - 205); x.stroke(); x.beginPath(); x.moveTo(w * 0.52, base - 130); x.quadraticCurveTo(w * 0.66, base - 170, w * 0.72, base - 215); x.stroke();
    const verde = o.variante === 'otonyo' ? '#b8742a' : '#3f8a3c', hojas = T(verde, H), cx = w * 0.5, cy = h * 0.34, bolas = [];
    for (let i = 0; i < 70; i++) { const a = r() * PI * 2, d = Math.sqrt(r()); bolas.push([cx + Math.cos(a) * d * w * 0.4, cy + Math.sin(a) * d * h * 0.27, lerp(26, 46, r()), d]); }
    bolas.sort((a, b) => a[1] - b[1]);
    const lz = (bx, by) => R.c01(0.5 - (bx - cx) / (w * 0.8) + (cy - by) / (h * 0.55));
    bolas.forEach(([bx, by, br]) => { const l = lz(bx, by); R.bola(x, bx, by, br, R.mezcla(hojas.sh, hojas.lit, l + 0.15), R.mezcla(R.oscurecer(hojas.sh, 0.35), hojas.mid, l * 0.7), -0.35, -0.4); });
    for (let i = 0; i < 260; i++) { const a = r() * PI * 2, d = Math.sqrt(r()), bx = cx + Math.cos(a) * d * w * 0.42, by = cy + Math.sin(a) * d * h * 0.28;
      x.fillStyle = R.mezcla(hojas.mid, hojas.lit, lz(bx, by) + 0.2); x.globalAlpha = 0.55; x.beginPath(); x.ellipse(bx, by, 3.2, 2, r() * 3, 0, 7); x.fill(); } x.globalAlpha = 1;
  } });

  /* ---------- PINO ---------- */
  R.definirObjeto('pino', { w: 200, h: 420, dibujar(x, w, h, H, T, o) {
    const r = VE.rng(o.semilla), V = T('#2c6a45', H), M = T('#5a4330', H), base = h - 6, cx = w / 2; R.sombraSuelo(x, cx, base, w * 0.4, 10, 0.4, H.sombra);
    x.fillStyle = M.mid; x.fillRect(cx - 7, base - 50, 14, 50); x.fillStyle = M.sh; x.fillRect(cx + 1, base - 50, 6, 50);
    const pisos = 7;
    for (let i = 0; i < pisos; i++) { const t = i / (pisos - 1), yb = base - 30 - t * (h - 130), ancho = lerp(w * 0.48, w * 0.14, t), alto = lerp(92, 60, t), yt = yb - alto, n = 8, izq = [[cx, yt]], der = [[cx, yt]];
      for (let k = n; k >= 0; k--) { const u = k / n, dx = ancho * u, j = (k % 2 ? 7 : 0) + r() * 2.5, dy = yb - j - (1 - u) * 0; izq.push([cx - dx, dy]); der.push([cx + dx, dy]); }
      izq.push([cx, yb - 2]); der.push([cx, yb - 2]);
      R.cara(x, izq, V.lit, V.mid, 1.2); R.cara(x, der, V.mid, R.oscurecer(V.sh, 0.2), 1.2);
      x.strokeStyle = R.alfa(R.oscurecer(V.sh, 0.5), 0.45); x.lineWidth = 1.3; for (let k = 0; k < 6; k++) { const yy = lerp(yt + 12, yb - 3, k / 6), ww = ancho * ((yy - yt) / alto); x.beginPath(); x.moveTo(cx - ww, yy + 4); x.quadraticCurveTo(cx, yy - 4, cx + ww, yy + 4); x.stroke(); } }
  } });

  /* ---------- ROCA ---------- */
  R.definirObjeto('roca', { w: 300, h: 200, dibujar(x, w, h, H, T, o) {
    const r = VE.rng(o.semilla), G = T(o.variante === 'arenisca' ? '#b08a60' : '#7d8088', H), base = h - 4; R.sombraSuelo(x, w * 0.5, base - 2, w * 0.5, 14, 0.5, H.sombra);
    const N = 11, pts = [[w * 0.02, base]]; for (let i = 0; i < N; i++) { const u = i / (N - 1), rr = lerp(0.85, 1.0, r()); pts.push([w / 2 - Math.cos(u * PI) * w * 0.48 * rr, base - Math.sin(u * PI) * h * 0.9 * rr]); } pts.push([w * 0.98, base]);
    const c = [w / 2 + lerp(-20, 10, r()), base - h * 0.45];
    R.ruta(x, pts); x.fillStyle = G.mid; x.fill();
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], mx = (a[0] + b[0]) / 2, l = R.c01(0.5 + (c[0] - mx) / (w * 0.8) + (r() - 0.5) * 0.3);
      R.ruta(x, [a, b, c]); x.fillStyle = R.mezcla(G.sh, G.lit, l); x.fill(); x.strokeStyle = R.alfa(G.sh, 0.3); x.lineWidth = 0.8; x.stroke(); }
    R.textura(x, pts, o.semilla + 'rt', { dens: 55, alfa: 0.13, min: 1, max: 3.5 });
    x.strokeStyle = G.rim; x.globalAlpha = 0.5; x.lineWidth = 2; x.beginPath(); pts.slice(1, 5).forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.globalAlpha = 1;
  } });

  /* ---------- NUBE (cumulo con volumen) ---------- */
  R.definirObjeto('nube', { w: 560, h: 240, dibujar(x, w, h, H, T, o) {
    const r = VE.rng(o.semilla), tor = H === R.horas.tormenta, luz = tor ? '#a9b4c4' : R.mezcla('#ffffff', H.luz, 0.55), med = tor ? '#68727f' : R.mezcla('#e4ecf8', H.niebla, 0.45), baj = tor ? '#3a424d' : R.mezcla('#a9b9d4', H.sombra, 0.5);
    const bolas = []; for (let i = 0; i < 70; i++) { const u = r(), alto = Math.pow(Math.sin(u * PI), 0.8), rad = lerp(22, 62, r()) * (0.45 + 0.7 * alto); bolas.push([w * (0.1 + u * 0.8), h - 34 - rad * 0.3 - r() * h * 0.55 * alto, rad]); }
    bolas.sort((a, b) => b[1] - a[1]);
    bolas.forEach(([cx, cy, rad]) => { const t = R.c01((h - cy) / (h * 0.8)), lado = R.c01(0.5 - (cx - w / 2) / w * 0.5), col = R.mezcla(R.mezcla(baj, med, t * 1.4), luz, R.c01(t * t * 1.1 + lado * 0.25)), g = x.createRadialGradient(cx - rad * 0.2, cy - rad * 0.3, rad * 0.1, cx, cy, rad);
      g.addColorStop(0, R.alfa(col, 0.95)); g.addColorStop(0.62, R.alfa(col, 0.85)); g.addColorStop(1, R.alfa(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill(); });
    const g = x.createLinearGradient(0, h - 56, 0, h - 14); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, R.alfa(baj, 0.5)); x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, h - 56, w, 56); x.globalCompositeOperation = 'source-over';
  } });

  /* ---------- CASA ---------- */
  R.definirObjeto('casa', { w: 300, h: 250, dibujar(x, w, h, H, T, o) {
    const P = T('#e3d3b0', H), R2 = T('#a0452f', H), base = h - 6; R.sombraSuelo(x, w * 0.5, base, w * 0.5, 12, 0.45, H.sombra);
    const fx0 = 30, fx1 = 190, ft = base - 100; R.cara(x, [[fx0, ft], [fx1, ft], [fx1, base], [fx0, base]], P.lit, P.mid, 1.3); R.cara(x, [[fx1, ft], [270, ft + 4], [270, base], [fx1, base]], P.sh, R.oscurecer(P.sh, 0.15), 1.4);
    R.textura(x, [[fx0, ft], [fx1, ft], [fx1, base], [fx0, base]], o.semilla + 'w', { n: 260, alfa: 0.08, min: 1, max: 2.4 });
    R.cara(x, [[fx0 - 14, ft + 2], [110, ft - 78], [fx1 + 6, ft + 2]], R2.lit, R2.mid, 1.1); R.cara(x, [[fx1 + 6, ft + 2], [110, ft - 78], [190, ft - 70], [284, ft + 6]], R2.mid, R2.sh, 1.5);
    x.strokeStyle = R.alfa(R2.sh, 0.5); x.lineWidth = 1; for (let k = 1; k < 7; k++) { const t = k / 7, yy = ft + 2 - 80 * t; x.beginPath(); x.moveTo(fx0 - 14 + 94 * t, yy); x.lineTo(fx1 + 6 - 86 * t, yy); x.stroke(); }
    const ch = T('#8a8076', H); R.cara(x, [[210, ft - 70], [226, ft - 70], [226, ft - 18], [210, ft - 18]], ch.lit, ch.sh, 0);
    x.fillStyle = '#4a2c1e'; x.fillRect(90, base - 54, 34, 54); x.strokeStyle = P.rim; x.lineWidth = 2; x.strokeRect(88, base - 56, 38, 56);
    [[50, base - 80], [146, base - 80]].forEach(([wx, wy]) => { x.fillStyle = o.noche ? '#ffcf7a' : '#2a3a52'; x.fillRect(wx, wy, 28, 34); x.strokeStyle = P.rim; x.lineWidth = 2.4; x.strokeRect(wx, wy, 28, 34); x.beginPath(); x.moveTo(wx + 14, wy); x.lineTo(wx + 14, wy + 34); x.moveTo(wx, wy + 17); x.lineTo(wx + 28, wy + 17); x.stroke(); });
    x.fillStyle = P.sh; x.fillRect(214, base - 74, 38, 28); x.fillStyle = o.noche ? '#ffcf7a' : '#2a3a52'; x.fillRect(220, base - 70, 26, 20);
  } });

  /* ---------- VELERO ---------- */
  R.definirObjeto('velero', { w: 320, h: 340, dibujar(x, w, h, H, T, o) {
    const C = T('#5b3a26', H), V = T('#fff7e6', H), base = h - 70;
    R.cara(x, [[30, base - 10], [290, base - 10], [250, base + 40], [70, base + 40]], C.lit, C.sh, PI / 2); x.fillStyle = '#b3262e'; x.fillRect(40, base - 2, 244, 7);
    x.strokeStyle = C.sh; x.lineWidth = 6; x.beginPath(); x.moveTo(160, base - 10); x.lineTo(160, 22); x.stroke();
    R.cara(x, [[156, 30], [156, base - 22], [50, base - 22]], V.lit, V.sh, 0.3); R.cara(x, [[166, 40], [166, base - 22], [262, base - 22]], V.mid, V.sh, 0.8);
    x.fillStyle = '#b3262e'; x.beginPath(); x.moveTo(160, 22); x.lineTo(196, 32); x.lineTo(160, 40); x.closePath(); x.fill();
  } });

  /* ---------- MOLINO ---------- */
  R.definirObjeto('molino', { w: 300, h: 380, dibujar(x, w, h, H, T, o) {
    const P = T('#dad2c2', H), R2 = T('#7a4a34', H), base = h - 6, cx = 130; R.sombraSuelo(x, cx + 10, base, 100, 12, 0.45, H.sombra);
    const torre = [[cx - 62, base], [cx - 40, base - 220], [cx + 40, base - 220], [cx + 62, base]]; const g = x.createLinearGradient(cx - 62, 0, cx + 62, 0); g.addColorStop(0, P.rim); g.addColorStop(0.15, P.lit); g.addColorStop(0.65, P.mid); g.addColorStop(1, P.sh); R.ruta(x, torre); x.fillStyle = g; x.fill();
    R.textura(x, torre, o.semilla, { n: 300, alfa: 0.1, min: 1, max: 2.6 });
    const gt = x.createLinearGradient(cx - 52, 0, cx + 52, 0); gt.addColorStop(0, R2.lit); gt.addColorStop(0.6, R2.mid); gt.addColorStop(1, R2.sh); R.ruta(x, [[cx - 52, base - 218], [cx, base - 290], [cx + 52, base - 218]]); x.fillStyle = gt; x.fill();
    x.fillStyle = '#2a1a12'; x.fillRect(cx - 14, base - 54, 28, 54); x.fillStyle = '#1a1612'; x.fillRect(cx - 8, base - 170, 16, 26);
    x.fillStyle = '#3a2a20'; x.beginPath(); x.arc(cx + 8, base - 236, 9, 0, 7); x.fill();
    [0.35, 0.35 + PI / 2, 0.35 + PI, 0.35 + PI * 1.5].forEach(a => { x.save(); x.translate(cx + 8, base - 236); x.rotate(a); x.fillStyle = '#5a3d2a'; x.fillRect(-4, -118, 8, 118); x.fillStyle = 'rgba(240,232,214,0.92)'; x.fillRect(4, -116, 30, 54); x.strokeStyle = '#5a3d2a'; x.lineWidth = 1.2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(4, -116 + k * 13.5); x.lineTo(34, -116 + k * 13.5); x.stroke(); } x.strokeRect(4, -116, 30, 54); x.restore(); });
  } });

  /* ---------- FARO ---------- */
  R.definirObjeto('faro', { w: 200, h: 440, dibujar(x, w, h, H, T, o) {
    const P = T('#efe8dc', H), Rj = T('#b3262e', H), base = h - 6, cx = 100; R.sombraSuelo(x, cx, base, 88, 12, 0.5, H.sombra);
    for (let i = 0; i < 5; i++) { const y0 = base - i * 62, y1 = y0 - 62, a0 = lerp(54, 28, i / 5), a1 = lerp(54, 28, (i + 1) / 5), col = i % 2 ? Rj : P, g = x.createLinearGradient(cx - a0, 0, cx + a0, 0);
      g.addColorStop(0, col.rim); g.addColorStop(0.15, col.lit); g.addColorStop(0.65, col.mid); g.addColorStop(1, col.sh); R.ruta(x, [[cx - a0, y0], [cx - a1, y1], [cx + a1, y1], [cx + a0, y0]]); x.fillStyle = g; x.fill(); }
    const top = base - 5 * 62; R.cara(x, [[cx - 38, top], [cx + 38, top], [cx + 38, top + 8], [cx - 38, top + 8]], P.lit, P.sh, 0);
    x.fillStyle = o.noche ? '#fff0a0' : '#8fb0c8'; x.fillRect(cx - 20, top - 36, 40, 36); x.strokeStyle = P.sh; x.lineWidth = 3; x.strokeRect(cx - 20, top - 36, 40, 36); x.beginPath(); x.moveTo(cx, top - 36); x.lineTo(cx, top); x.stroke();
    R.ruta(x, [[cx - 26, top - 36], [cx, top - 62], [cx + 26, top - 36]]); x.fillStyle = Rj.mid; x.fill();
    x.fillStyle = '#3a2a20'; x.fillRect(cx - 9, base - 40, 18, 40);
  } });

  /* ---------- RAYO (dinamico: se llama cada fotograma) ----------
     VE.real.rayo(esc, { x0, y0, x1, y1, semilla, progreso 0..1, destello 0..1, color }): trazo irregular con ramas y resplandor azulado. */
  R.rayo = function (esc, o) {
    const x = esc.ctx, k = esc.k, r = VE.rng(o.semilla || 'rayo'), prog = o.progreso == null ? 1 : o.progreso; if (prog <= 0) return;
    const camino = (ax, ay, bx, by, desv, prof) => { let pts = [[ax, ay], [bx, by]]; for (let it = 0; it < prof; it++) { const n = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, d = (r() - 0.5) * desv * l; n.push(a, [mx + nx * d, my + ny * d]); } n.push(pts[pts.length - 1]); pts = n; } return pts; };
    const tronco = camino(o.x0, o.y0, o.x1, o.y1, 0.5, 6), ramas = []; for (let i = 0; i < 5; i++) { const p = tronco[Math.floor(lerp(tronco.length * 0.2, tronco.length * 0.85, r()))], dir = r() < 0.5 ? -1 : 1, l = lerp(80, 220, r()) * k; ramas.push(camino(p[0], p[1], p[0] + dir * l * lerp(0.4, 0.9, r()), p[1] + l * lerp(0.6, 1.0, r()), 0.6, 4)); }
    const dib = (pts, an, al) => { const n = Math.max(2, Math.round(pts.length * prog)); x.beginPath(); pts.slice(0, n).forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.lineWidth = an; x.globalAlpha = al; x.stroke(); };
    x.save(); x.lineJoin = 'round'; x.lineCap = 'round'; x.globalCompositeOperation = 'lighter'; const d = o.destello == null ? 1 : o.destello, col = o.color || '#9fc4ff';
    x.strokeStyle = col; [[34, 0.05], [18, 0.1], [9, 0.22]].forEach(([w, a]) => { dib(tronco, w * k, a * d); ramas.forEach(b => dib(b, w * 0.5 * k, a * 0.7 * d)); });
    x.strokeStyle = '#ffffff'; dib(tronco, 3.6 * k, 0.95 * d); ramas.forEach(b => dib(b, 1.8 * k, 0.8 * d)); x.restore();
  };
})(window.VE = window.VE || {});
