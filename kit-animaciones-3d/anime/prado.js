/* ESTILO ANIME PINTADO · una caminante (personaje propio) cruza un prado junto al mar.
   Fondo pintado por código en capas con paralaje: cielo con cúmulos de tres tonos, mar con destellos, costa con pueblo,
   colina con arbustos, prado con trazos de hierba y valla, y flores en primer plano. Personaje 2D con contorno fino y
   sombra plana (cel-shading), ciclo de andar, pelo y cintas del sombrero al viento. Las capas se pintan una vez (caché).
   node bin/estilo.cjs anime_prado salida --stills 0,0.4,0.8 --extra anime/prado.js
   node bin/estilo.cjs anime_prado salida.mp4 --seg 8 --fps 30 --extra anime/prado.js */
(function () {
  const W = 1080, H = 1920, TAU = Math.PI * 2, HOR = 640, SUELO = 1700, V = 560, X0 = 470;
  const rnd = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  // ---------------------------------------------------------------- cielo y cúmulos (cada bola de nube con sombra, tono medio y luz)
  function cumulo(g0, cx, base, w, h, r) {
    const cv = lienzo(g0.canvas.width, g0.canvas.height), g = cv.getContext('2d');
    const P = [];
    for (let i = 0; i < 70; i++) { const u = r() * 2 - 1, alt = (1 - u * u) * h, f = Math.pow(r(), .8), y = base - f * alt, rad = (34 + r() * 70) * (w / 700) * (.55 + .7 * (1 - f)); P.push([cx + u * w / 2, y, rad]); }
    P.sort((a, b) => a[1] - b[1]);
    g.save(); g.beginPath(); g.rect(cx - w, base - h * 2 - 300, w * 2, h * 2 + 300); g.clip();
    // masa con degradado (blanca arriba, azulada abajo) y lóbulos marcados con un borde de sombra abajo-derecha y una luz arriba-izquierda
    const top = base - h * 1.1, gm = g.createLinearGradient(0, top, 0, base); gm.addColorStop(0, '#ffffff'); gm.addColorStop(.55, '#eef3fb'); gm.addColorStop(1, '#b4c6e2');
    g.fillStyle = gm; g.beginPath(); for (const [x, y, rd] of P) { g.moveTo(x + rd, y); g.arc(x, y, rd, 0, TAU); } g.fill();
    g.lineCap = 'round';
    const fuera = ([x, y, rd]) => !P.some(q => q[2] !== rd && Math.hypot(x - q[0], y - rd * .85 - q[1]) < q[2] * .95);   // bola en el borde superior de la nube
    for (const [x, y, rd] of P.filter(fuera)) { const alto = 1 - (base - y) / h;
      if (alto < .75) { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = rd * .1; g.beginPath(); g.arc(x + rd * .05, y + rd * .05, rd * .82, Math.PI * 1.08, Math.PI * 1.55); g.stroke(); } }
    const gb = g.createLinearGradient(0, base - h * .35, 0, base); gb.addColorStop(0, 'rgba(140,165,205,0)'); gb.addColorStop(1, 'rgba(140,165,205,.45)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = gb; g.fillRect(cx - w, base - h * .35, w * 2, h * .35 + 2); g.globalCompositeOperation = 'source-over';
    g.restore(); g0.drawImage(cv, 0, 0);
  }
  function cielo() {
    const c = lienzo(W + 260, HOR + 80), g = c.getContext('2d'), r = rnd(11);
    const gr = g.createLinearGradient(0, 0, 0, HOR + 80); gr.addColorStop(0, '#1450c4'); gr.addColorStop(.4, '#2a78de'); gr.addColorStop(.8, '#86bff0'); gr.addColorStop(1, '#d4eafb');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    // cirros: trazos largos y finos arriba a la izquierda
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(235,244,255,${.25 + r() * .35})`; g.beginPath(); g.ellipse(r() * 700, 60 + r() * 260, 60 + r() * 160, 3 + r() * 6, -.12 + r() * .08, 0, TAU); g.fill(); }
    // nubes: un cúmulo apoyado en el horizonte y varios más pequeños (no tocan el centro, donde va la cabeza del personaje)
    const nubes = lienzo(c.width, c.height), gn = nubes.getContext('2d');
    cumulo(gn, 900, HOR - 20, 820, 520, r); cumulo(gn, 1180, HOR - 70, 420, 300, r);
    cumulo(gn, 130, HOR - 10, 420, 200, r); cumulo(gn, 330, 300, 360, 150, r); cumulo(gn, 620, HOR + 10, 360, 120, r);
    g.drawImage(nubes, 0, 0);
    return c;
  }
  // ---------------------------------------------------------------- mar, costa y pueblo
  function mar() {
    const c = lienzo(W + 400, 460), g = c.getContext('2d'), r = rnd(5), h0 = 40;
    const gr = g.createLinearGradient(0, h0, 0, 460); gr.addColorStop(0, '#4d93e0'); gr.addColorStop(.15, '#2c74d0'); gr.addColorStop(1, '#1d5bbd'); g.fillStyle = gr; g.fillRect(0, h0, c.width, 460);
    g.fillStyle = 'rgba(230,245,255,.75)'; g.fillRect(0, h0, c.width, 3);
    for (let k = 0; k < 900; k++) { const y = h0 + 6 + Math.pow(r(), 1.6) * 400, s = .3 + (y - h0) / 400; g.fillStyle = `rgba(255,255,255,${.15 + r() * .5})`; g.fillRect(r() * c.width, y, (6 + r() * 26) * s, 1.5 + s * 1.5); }
    // costa lejana a la derecha (bruma)
    g.fillStyle = '#7fa6c4'; g.beginPath(); g.moveTo(760, h0 + 1); for (let x = 760; x <= c.width; x += 20) g.lineTo(x, h0 - 6 - 10 * Math.sin(x * .01) - (x - 760) * .02); g.lineTo(c.width, h0 + 1); g.fill();
    // cabo con pueblo a la izquierda
    const cresta = x => h0 - 30 + Math.pow(x / 520, 1.6) * 260 + 10 * Math.sin(x * .03);
    g.fillStyle = '#5d8f68'; g.beginPath(); g.moveTo(0, 460); g.lineTo(0, cresta(0)); for (let x = 0; x <= 520; x += 10) g.lineTo(x, cresta(x)); g.lineTo(560, 460); g.fill();
    g.fillStyle = '#4a7d55'; for (let k = 0; k < 140; k++) { const x = r() * 500, y = cresta(x) + 4 + r() * 30; g.beginPath(); g.arc(x, y, 6 + r() * 12, 0, TAU); g.fill(); }
    for (let k = 0; k < 90; k++) { const x = 30 + r() * 440, y = cresta(x) + 16 + r() * (170 - x * .2), w = 7 + r() * 7, hh = 6 + r() * 5;
      g.fillStyle = pick(r, ['#f4efe4', '#efe3cc', '#e9e2d6', '#f7f2ea']); g.fillRect(x, y, w, hh); g.fillStyle = pick(r, ['#cf6438', '#b9503a', '#d87a45']); g.beginPath(); g.moveTo(x - 2, y + 1); g.lineTo(x + w / 2, y - 6); g.lineTo(x + w + 2, y + 1); g.fill(); g.fillStyle = 'rgba(60,60,80,.35)'; g.fillRect(x + w * .6, y, w * .4, hh); }
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 560; x += 10) g.lineTo(x + 6, cresta(x) + 8 + 200 * Math.pow(x / 560, 3)); g.stroke();
    return c;
  }
  // ---------------------------------------------------------------- colina lejana con arbustos
  function colina() {
    const TW = 2160, c = lienzo(TW, 520), g = c.getContext('2d'), r = rnd(9);
    const cr = x => 60 + 22 * Math.sin(x / TW * TAU * 2) + 12 * Math.sin(x / TW * TAU * 5 + 1);
    const gr = g.createLinearGradient(0, 30, 0, 520); gr.addColorStop(0, '#b6dc72'); gr.addColorStop(.4, '#8cc650'); gr.addColorStop(1, '#6fb444');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 520); for (let x = 0; x <= TW; x += 8) g.lineTo(x, cr(x)); g.lineTo(TW, 520); g.fill();
    for (let k = 0; k < 26; k++) { const x0 = r() * TW, n = 2 + Math.floor(r() * 5);
      for (let j = 0; j < n; j++) { const x = (x0 + j * 26) % TW, y = cr(x) + 6, rd = 14 + r() * 20; g.fillStyle = '#3e7d36'; g.beginPath(); g.arc(x + 3, y - rd * .4 + 4, rd, 0, TAU); g.fill(); g.fillStyle = '#5a9b40'; g.beginPath(); g.arc(x - 3, y - rd * .5, rd * .8, 0, TAU); g.fill(); g.fillStyle = '#7fbb52'; g.beginPath(); g.arc(x - 7, y - rd * .7, rd * .4, 0, TAU); g.fill(); } }
    for (let k = 0; k < 2500; k++) { const x = r() * TW, y = cr(x) + 12 + r() * 480; g.strokeStyle = pick(r, ['#a7d466', '#7cbc49', '#93c95a']); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 6 - r() * 6); g.stroke(); }
    return c;
  }
  // ---------------------------------------------------------------- prado donde anda el personaje: hierba a trazos, florecillas y valla
  function prado() {
    const TW = 2160, HH = 940, c = lienzo(TW, HH), g = c.getContext('2d'), r = rnd(21);
    const cr = x => 70 + 30 * Math.sin(x / TW * TAU) + 14 * Math.sin(x / TW * TAU * 3 + 2);
    const gr = g.createLinearGradient(0, 40, 0, HH); gr.addColorStop(0, '#8fd05a'); gr.addColorStop(.25, '#69bb45'); gr.addColorStop(.7, '#4ea53b'); gr.addColorStop(1, '#3f9334');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, HH); for (let x = 0; x <= TW; x += 8) g.lineTo(x, cr(x)); g.lineTo(TW, HH); g.fill();
    // manchas de luz y sombra de nubes
    for (let k = 0; k < 14; k++) { g.fillStyle = r() < .5 ? 'rgba(190,235,120,.22)' : 'rgba(30,90,40,.14)'; g.beginPath(); g.ellipse(r() * TW, 160 + r() * 700, 160 + r() * 260, 30 + r() * 60, 0, 0, TAU); g.fill(); }
    // trazos de hierba inclinados por el viento, más grandes cuanto más cerca
    for (let k = 0; k < 16000; k++) { const x = r() * TW, yy = r(), y = cr(x) + 10 + yy * (HH - cr(x)), s = .4 + yy * 1.6, L = (8 + r() * 16) * s;
      g.strokeStyle = pick(r, ['#a9df6c', '#82c851', '#5aab3f', '#3f8f33', '#9bd45e', '#71b947']); g.lineWidth = 1.2 + s * 1.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L * .1, y - L * .6, x + L * .45, y - L); g.stroke(); }
    for (let k = 0; k < 260; k++) { const x = r() * TW, y = cr(x) + 30 + r() * 600, s = .5 + (y / HH); g.fillStyle = pick(r, ['#ffffff', '#fff3a0', '#ffe066', '#f6d7f5']); g.beginPath(); g.arc(x, y, 2.2 * s, 0, TAU); g.fill(); }
    // valla de madera al fondo del prado
    const vy = x => cr(x) + 110;
    g.lineCap = 'round';
    for (let x = 40; x < TW; x += 260) { g.strokeStyle = '#5b3f2a'; g.lineWidth = 16; g.beginPath(); g.moveTo(x, vy(x) + 70); g.lineTo(x, vy(x) - 40); g.stroke(); g.strokeStyle = '#a9794e'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 2, vy(x) + 66); g.lineTo(x - 2, vy(x) - 36); g.stroke(); }
    for (const dy of [-18, 22]) { g.strokeStyle = '#5b3f2a'; g.lineWidth = 11; g.beginPath(); for (let x = 0; x <= TW; x += 20) g.lineTo(x, vy(x) + dy); g.stroke(); g.strokeStyle = '#b8875a'; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= TW; x += 20) g.lineTo(x, vy(x) + dy - 2); g.stroke(); }
    for (let k = 0; k < 500; k++) { const x = r() * TW, y = vy(x) + 60 + r() * 30; g.strokeStyle = pick(r, ['#6fbb47', '#4f9f3b']); g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y - 16 - r() * 12); g.stroke(); }
    return c;
  }
  // ---------------------------------------------------------------- primer plano: hierba alta y flores (margaritas, ranúnculos y espigas moradas)
  function flores() {
    const TW = 2160, HH = 460, c = lienzo(TW, HH), g = c.getContext('2d'), r = rnd(33);
    g.lineCap = 'round';
    for (let k = 0; k < 1400; k++) { const x = r() * TW, h = 40 + r() * 160, b = r() * .5 + .2; g.strokeStyle = pick(r, ['#2f7d2e', '#3f9334', '#56aa3d', '#2a6b2a']); g.lineWidth = 3 + r() * 4; g.beginPath(); g.moveTo(x, HH); g.quadraticCurveTo(x + h * b * .3, HH - h * .6, x + h * b, HH - h); g.stroke(); }
    const tallo = (x, h) => { g.strokeStyle = '#3c8a33'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, HH); g.quadraticCurveTo(x + 8, HH - h * .5, x + 4, HH - h); g.stroke(); return [x + 4, HH - h]; };
    for (let k = 0; k < 120; k++) { const x = r() * TW, tipo = r(), h = 50 + r() * 140;
      if (tipo < .45) { const [fx, fy] = tallo(x, h), R = 14 + r() * 10; for (let p = 0; p < 12; p++) { const a = p / 12 * TAU; g.fillStyle = p % 2 ? '#ffffff' : '#f1f4f8'; g.beginPath(); g.ellipse(fx + Math.cos(a) * R * .55, fy + Math.sin(a) * R * .35, R * .5, R * .2, a, 0, TAU); g.fill(); }
        g.fillStyle = '#f2b51f'; g.beginPath(); g.arc(fx, fy, R * .28, 0, TAU); g.fill(); g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(fx - 2, fy - 2, R * .16, 0, TAU); g.fill(); }
      else if (tipo < .75) { const [fx, fy] = tallo(x, h * .8), R = 9 + r() * 5; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU - Math.PI / 2; g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(fx + Math.cos(a) * R * .55, fy + Math.sin(a) * R * .45, R * .55, 0, TAU); g.fill(); } g.fillStyle = '#e59a0c'; g.beginPath(); g.arc(fx, fy, R * .3, 0, TAU); g.fill(); }
      else { const [fx, fy] = tallo(x, h * 1.1); for (let j = 0; j < 9; j++) { g.fillStyle = j % 2 ? '#b884d8' : '#9a63c4'; g.beginPath(); g.ellipse(fx + (j % 2 ? 5 : -5), fy + j * 9, 7, 5, 0, 0, TAU); g.fill(); } } }
    return c;
  }
  const tira = (ctx, img, off, y) => { const w = img.width, o = ((off % w) + w) % w; ctx.drawImage(img, -o, y); ctx.drawImage(img, w - o, y); };

  // ---------------------------------------------------------------- personaje: contorno fino y sombra plana (la luz viene de delante, arriba)
  const LINEA = '#2a2220';
  const COL = { piel: ['#fbd9c0', '#eaae8f'], pelo: ['#7a4a31', '#56321f'], camisa: ['#f6f9fd', '#c4d1e6'], pant: ['#3a5876', '#263c53'], zap: ['#8d5634', '#62391f'],
    somb: ['#f2d27d', '#cfa04a'], cinta: ['#de4b4b', '#a93131'], bolso: ['#b07444', '#7d4c2a'] };
  const lejos = c => [c[1], '#' + c[1].slice(1).match(/../g).map(h => Math.round(parseInt(h, 16) * .78).toString(16).padStart(2, '0')).join('')];
  function parte(ctx, p, col, ox = 9, oy = -8, lw = 6) { ctx.lineJoin = 'round'; ctx.strokeStyle = LINEA; ctx.lineWidth = lw; ctx.stroke(p); ctx.fillStyle = col[1]; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.translate(ox, oy); ctx.fillStyle = col[0]; ctx.fill(p); ctx.restore(); }
  function capsula(ax, ay, bx, by, r1, r2) { const th = Math.atan2(by - ay, bx - ax), p = new Path2D(); p.arc(ax, ay, r1, th + Math.PI / 2, th + 3 * Math.PI / 2); p.arc(bx, by, r2, th - Math.PI / 2, th + Math.PI / 2); p.closePath(); return p; }
  const poli = (pts, cerrar = true) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (cerrar) p.closePath(); return p; };
  function zapato(ax, ay, fa) { const c = Math.cos(fa), s = Math.sin(fa), T = (x, y) => [ax + x * c - y * s, ay + x * s + y * c], p = new Path2D();
    const P = [T(-24, -10), T(-27, 22), T(70, 24), T(84, 14), T(70, -2), T(22, -12)]; p.moveTo(...P[0]); p.lineTo(...P[1]); p.lineTo(...P[2]); p.quadraticCurveTo(...T(90, 22), ...P[3]); p.quadraticCurveTo(...T(80, 0), ...P[4]); p.lineTo(...P[5]); p.closePath(); return p; }

  function caminante(ctx, t) {
    const PER = 1.1, ph = t / PER * TAU, L1 = 200, L2 = 196, AMP = .36;
    const pierna = off => { const f = ph + off, th = AMP * Math.sin(f), kb = .07 + .95 * Math.pow(Math.max(0, Math.cos(f)), 2), k = [L1 * Math.sin(th), L1 * Math.cos(th)], a = [k[0] + L2 * Math.sin(th - kb), k[1] + L2 * Math.cos(th - kb)];
      const fa = Math.cos(f) > 0 ? .35 * Math.cos(f) * Math.sin(f + .6) : -.45 * Math.pow(Math.max(0, -Math.sin(f)), 3) * Math.max(0, -Math.cos(f)) * 2; return { k, a, fa }; };
    const PL = pierna(Math.PI), PC = pierna(0);   // lejana y cercana
    const hy = SUELO - 26 - Math.max(PL.a[1], PC.a[1]), hx = X0, sx = hx + 10, sy = hy - 285, hcx = sx + 22, hcy = sy - 112, viento = Math.sin(t * 7.3) * .5 + Math.sin(t * 11.1) * .3;
    const brazo = off => { const f = ph + off, a = -.5 * Math.sin(f), e = [135 * Math.sin(a), 135 * Math.cos(a)], a2 = a + .35 + .45 * Math.max(0, Math.sin(f + Math.PI)), m = [e[0] + 120 * Math.sin(a2), e[1] + 120 * Math.cos(a2)]; return { e, m }; };
    const BL = brazo(0), BC = brazo(Math.PI);
    const dibPierna = (P, far) => { const kx = hx + P.k[0], ky = hy + P.k[1], ax = hx + P.a[0], ay = hy + P.a[1], c = far ? lejos : x => x;
      parte(ctx, capsula(hx, hy, kx, ky, 44, 35), c(COL.pant)); parte(ctx, capsula(kx, ky, ax, ay, 35, 29), c(COL.pant));
      parte(ctx, capsula(ax, ay - 30, ax, ay - 2, 33, 33), c(COL.pant));   // vuelta del pantalón
      parte(ctx, zapato(ax, ay + 4, P.fa), c(COL.zap)); };
    const dibBrazo = (B, far) => { const ex = sx + B.e[0], ey = sy + 20 + B.e[1], mx = sx + B.m[0], my = sy + 20 + B.m[1], c = far ? lejos : x => x;
      parte(ctx, capsula(sx, sy + 20, ex, ey, 30, 25), c(COL.camisa)); parte(ctx, capsula(ex, ey, ex + (mx - ex) * .45, ey + (my - ey) * .45, 25, 23), c(COL.camisa));
      parte(ctx, capsula(ex + (mx - ex) * .42, ey + (my - ey) * .42, mx, my, 18, 16), c(COL.piel)); const mano = new Path2D(); mano.ellipse(mx + 2, my + 8, 21, 25, 0, 0, TAU); parte(ctx, mano, c(COL.piel)); };
    // sombra en la hierba
    ctx.fillStyle = 'rgba(25,75,25,.32)'; ctx.beginPath(); ctx.ellipse(hx + 20, SUELO + 2, 175, 20, 0, 0, TAU); ctx.fill();
    const CAB = 1.32, cabeza = f => { ctx.save(); ctx.translate(hcx, hcy + 70); ctx.scale(CAB, CAB); ctx.translate(-hcx, -hcy - 70); f(); ctx.restore(); };
    // cintas del sombrero (detrás de todo)
    cabeza(() => {
    for (const [dy, lg] of [[0, 1], [16, .8]]) { const pts = [], pts2 = []; for (let i = 0; i <= 10; i++) { const u = i / 10, x = hcx - 58 - u * 170 * lg, y = hcy - 74 + dy + u * 40 + Math.sin(t * 9 - u * 5 + dy) * 22 * u * (1 + viento * .4), w = 10 - u * 4; pts.push([x, y - w]); pts2.unshift([x, y + w]); } parte(ctx, poli(pts.concat(pts2)), COL.cinta, 4, -4, 5); }
    });
    dibBrazo(BL, true); dibPierna(PL, true);
    const pelvis = new Path2D(); pelvis.ellipse(hx, hy, 58, 46, 0, 0, TAU); parte(ctx, pelvis, COL.pant);
    dibPierna(PC, false);
    // camisa (por fuera del pantalón) con bolso en bandolera
    const tor = new Path2D(); tor.moveTo(sx - 62, sy + 8); tor.quadraticCurveTo(sx - 10, sy - 18, sx + 46, sy + 2); tor.quadraticCurveTo(sx + 78, sy + 70, sx + 62, sy + 160); tor.quadraticCurveTo(sx + 56, sy + 230, sx + 70, sy + 318); tor.quadraticCurveTo(sx, sy + 334, sx - 72, sy + 316); tor.quadraticCurveTo(sx - 58, sy + 220, sx - 70, sy + 130); tor.quadraticCurveTo(sx - 82, sy + 50, sx - 62, sy + 8); tor.closePath();
    parte(ctx, tor, COL.camisa, 12, -10);
    ctx.strokeStyle = 'rgba(120,140,170,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx + 40, sy + 20); ctx.quadraticCurveTo(sx + 36, sy + 160, sx + 44, sy + 300); ctx.stroke();   // tapeta de la camisa
    const sw = Math.sin(ph * 2) * .06, bx = hx - 82, by = hy - 40; ctx.save(); ctx.translate(bx + 40, by); ctx.rotate(sw); const bolso = new Path2D(); bolso.roundRect(-40, 0, 84, 92, 14); parte(ctx, bolso, COL.bolso, 6, -6); const tapa = new Path2D(); tapa.roundRect(-42, -2, 88, 42, 12); parte(ctx, tapa, COL.bolso, 6, -6); ctx.fillStyle = '#e8c15a'; ctx.fillRect(-4, 30, 10, 14); ctx.restore();
    ctx.lineCap = 'round'; ctx.strokeStyle = LINEA; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(sx + 28, sy + 6); ctx.quadraticCurveTo(sx - 10, sy + 160, bx + 36, by + 4); ctx.stroke(); ctx.strokeStyle = COL.bolso[0]; ctx.lineWidth = 9; ctx.stroke();
    // cuello y cabeza de perfil
    parte(ctx, capsula(sx + 6, sy + 10, hcx - 4, hcy + 80, 22, 20), COL.piel);
    cabeza(() => {
    const pelo = new Path2D(), pv = viento * 10;
    pelo.moveTo(hcx + 62, hcy - 46); pelo.quadraticCurveTo(hcx + 20, hcy - 112, hcx - 60, hcy - 82); pelo.quadraticCurveTo(hcx - 108, hcy - 20, hcx - 96 - pv, hcy + 70); pelo.quadraticCurveTo(hcx - 70 - pv, hcy + 92, hcx - 44, hcy + 76); pelo.quadraticCurveTo(hcx - 30, hcy + 40, hcx - 20, hcy + 10); pelo.closePath();
    parte(ctx, pelo, COL.pelo, 8, -8);
    const cara = new Path2D(); cara.moveTo(hcx - 30, hcy - 82); cara.quadraticCurveTo(hcx + 50, hcy - 90, hcx + 70, hcy - 30); cara.quadraticCurveTo(hcx + 78, hcy - 6, hcx + 80, hcy + 10); cara.quadraticCurveTo(hcx + 90, hcy + 22, hcx + 80, hcy + 30); cara.quadraticCurveTo(hcx + 82, hcy + 42, hcx + 76, hcy + 50); cara.quadraticCurveTo(hcx + 74, hcy + 66, hcx + 56, hcy + 76); cara.quadraticCurveTo(hcx + 20, hcy + 92, hcx - 18, hcy + 66); cara.quadraticCurveTo(hcx - 40, hcy + 20, hcx - 30, hcy - 82); cara.closePath();
    parte(ctx, cara, COL.piel, 10, -6);
    const oreja = new Path2D(); oreja.ellipse(hcx - 8, hcy + 16, 15, 21, -.1, 0, TAU); parte(ctx, oreja, COL.piel, 4, -4, 5);
    ctx.strokeStyle = '#d58c70'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hcx - 8, hcy + 16, 8, -1.2, 1.4); ctx.stroke();
    ctx.fillStyle = 'rgba(255,130,130,.42)'; ctx.beginPath(); ctx.ellipse(hcx + 44, hcy + 38, 20, 10, 0, 0, TAU); ctx.fill();
    // ojo anime de perfil: iris alto, brillo y pestaña
    const ex = hcx + 54, ey = hcy + 6; ctx.fillStyle = '#3a2218'; ctx.beginPath(); ctx.ellipse(ex, ey, 10, 19, .05, 0, TAU); ctx.fill(); ctx.fillStyle = '#7b4a26'; ctx.beginPath(); ctx.ellipse(ex + 1, ey + 5, 7, 12, .05, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 2, ey - 7, 4.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 3, ey + 9, 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = LINEA; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 14, ey - 20); ctx.quadraticCurveTo(ex, ey - 26, ex + 14, ey - 16); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex + 12, ey - 16); ctx.lineTo(ex + 19, ey - 20); ctx.stroke();
    ctx.strokeStyle = COL.pelo[1]; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(ex - 14, ey - 38); ctx.quadraticCurveTo(ex + 2, ey - 44, ex + 16, ey - 36); ctx.stroke();
    ctx.strokeStyle = '#b5584c'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(hcx + 66, hcy + 54); ctx.quadraticCurveTo(hcx + 72, hcy + 57, hcx + 77, hcy + 53); ctx.stroke();
    // flequillo
    const fle = poli([[hcx - 30, hcy - 84], [hcx + 40, hcy - 92], [hcx + 72, hcy - 46], [hcx + 62, hcy - 30], [hcx + 50, hcy - 46], [hcx + 40, hcy - 24], [hcx + 24, hcy - 50], [hcx + 8, hcy - 22], [hcx - 4, hcy - 52], [hcx - 20, hcy - 20]]); parte(ctx, fle, COL.pelo, 8, -8, 5);
    // sombrero de paja: ala, copa y cinta
    const ala = new Path2D(); ala.ellipse(hcx + 6, hcy - 66, 150, 26, -.07, 0, TAU); parte(ctx, ala, COL.somb, 6, -8);
    const copa = new Path2D(); copa.moveTo(hcx - 66, hcy - 66); copa.bezierCurveTo(hcx - 70, hcy - 150, hcx + 66, hcy - 156, hcx + 62, hcy - 72); copa.quadraticCurveTo(hcx, hcy - 58, hcx - 66, hcy - 66); copa.closePath(); parte(ctx, copa, COL.somb, 10, -8);
    ctx.save(); ctx.clip(copa); ctx.fillStyle = COL.cinta[0]; ctx.beginPath(); ctx.moveTo(hcx - 80, hcy - 96); ctx.quadraticCurveTo(hcx, hcy - 112, hcx + 80, hcy - 98); ctx.lineTo(hcx + 80, hcy - 60); ctx.lineTo(hcx - 80, hcy - 60); ctx.fill(); ctx.fillStyle = COL.cinta[1]; ctx.fillRect(hcx - 80, hcy - 74, 160, 14); ctx.restore(); ctx.strokeStyle = LINEA; ctx.lineWidth = 6; ctx.stroke(copa);
    ctx.strokeStyle = 'rgba(160,110,40,.55)'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(hcx + 6, hcy - 66, 150 - Math.abs(k) * 0, 26, -.07, Math.PI * .05 + k * .02, Math.PI * .95); }
    });
    // brazo cercano por delante
    dibBrazo(BC, false);
  }
  // pétalos que vuelan con el viento
  function petalos(ctx, t) { for (let k = 0; k < 16; k++) { const s = (k * 97.3) % 1, sp = 260 + (k % 5) * 70, x = W + 100 - ((t * sp + k * 241) % (W + 300)), y = 300 + ((k * 173) % 1300) + Math.sin(t * 2 + k) * 40, a = t * 3 + k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = k % 3 ? 'rgba(255,255,255,.9)' : 'rgba(255,228,120,.9)'; ctx.beginPath(); ctx.ellipse(0, 0, 7 + s * 4, 3.5, 0, 0, TAU); ctx.fill(); ctx.restore(); } }

  let C = null;
  ESC.anime_prado = (ctx, t = 0) => {
    if (!C) C = { cielo: cielo(), mar: mar(), colina: colina(), prado: prado(), flores: flores() };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(C.cielo, -t * 7, 0);
    ctx.drawImage(C.mar, -t * 16, HOR - 40);
    tira(ctx, C.colina, t * 80, HOR + 250);
    tira(ctx, C.prado, t * V, 1000);
    caminante(ctx, t);
    tira(ctx, C.flores, t * V * 1.55, H - 460);
    petalos(ctx, t);
  };
})();
