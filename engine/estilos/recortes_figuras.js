/* FIGURAS del estilo RECORTES (requiere engine/estilos/recortes.js).
   El personaje R.chica esta en recortes_chica.js (cargar despues de este fichero).
   R.obj[nombre](x, o)  objetos de tocador dibujados centrados en el origen, ~100-200 px:
     cepilloDientes, neceser({abierto}), turbante, crema, colorete, brocha, rimel, pintalabios, cepilloPelo, horquilla({color}), patito
   R.bano(x, piezas)    baño completo en coordenadas locales (suelo en y=0, ~900 px de ancho); piezas = {nombre: escala_pop}
     nombres: pared, suelo, banera, lavabo, espejo, estante, planta, toalla, alfombra, patito (la chica se dibuja aparte). */
(function (VE) {
  const R = VE.recorte;
  const mix = (a, b, u) => {
    const p = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',') + ')';
  };
  const lunares = (P, color, paso = 26, r = 4) => (x) => {        // relleno estampado de lunares
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    for (let y = Math.min(...ys); y < Math.max(...ys); y += paso)
      for (let X = Math.min(...xs) + ((y / paso) % 2 ? paso / 2 : 0); X < Math.max(...xs); X += paso) R.punto(x, X + rnd() * 4, y + rnd() * 4, r, color);
  };
  const flores = (P, fondo) => (x) => {                             // estampado floral pastel (neceser, toalla)
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    x.fillStyle = fondo; x.fillRect(Math.min(...xs) - 5, Math.min(...ys) - 5, Math.max(...xs) - Math.min(...xs) + 10, Math.max(...ys) - Math.min(...ys) + 10);
    let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const cols = ['#f4a3b5', '#a9c8ec', '#f7d38a', '#b9dcb0', '#e8b4e0'];
    for (let y = Math.min(...ys); y < Math.max(...ys); y += 22) for (let X = Math.min(...xs); X < Math.max(...xs); X += 24) {
      const cx = X + rnd() * 14, cy = y + rnd() * 14, c = cols[Math.floor(rnd() * cols.length)];
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; R.punto(x, cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 4.5, 3.6, c); }
      R.punto(x, cx, cy, 2.4, '#fff4d6');
      if (rnd() < .5) R.punto(x, cx + 10, cy + 6, 2.6, '#8fbf8a');
    }
  };

  /* El PERSONAJE (R.chica) vive en engine/estilos/recortes_chica.js. */
  R.mix = mix;

  /* ---------------- OBJETOS DE TOCADOR ---------------- */
  const O = R.obj = {};
  O.cepilloDientes = (x) => {
    R.forma(x, [[-70, -6], [30, -7], [56, -9], [60, 0], [56, 9], [30, 7], [-70, 6], [-76, 0]], { relleno: '#9fd6c6' });
    R.forma(x, R.rect(26, -24, 60, -8, 3), { relleno: '#ffffff' });
    for (let i = 0; i < 5; i++) R.linea(x, [[30 + i * 7, -23], [30 + i * 7, -10]], { ancho: 1.6, j: .2 });
    R.forma(x, R.elipse(42, -30, 16, 7, 8), { relleno: '#bfe9ff', ancho: 2 });                                // pasta
  };
  O.neceser = (x, o = {}) => {
    const cuerpo = [[-118, -52], [-40, -60], [40, -60], [118, -52], [128, 0], [122, 42], [0, 48], [-122, 42], [-128, 0]];
    if (o.abierto) {
      R.forma(x, [[-112, -54], [-60, -110], [60, -118], [112, -56], [0, -64]], { relleno: flores([[-112, -120], [112, -50]], '#f6ead8') });   // tapa abierta
      R.forma(x, R.elipse(0, -55, 112, 16, 14), { relleno: '#c98f9b' });
    }
    R.forma(x, cuerpo, { relleno: flores(cuerpo, '#f6ead8') });
    R.linea(x, [[-116, -50], [0, -57], [116, -50]], { trazo: '#8a6c62', ancho: 3, j: .5 });
    R.forma(x, R.rect(112, -60, 140, -46, 5), { relleno: '#d8d8de' });
    R.forma(x, R.elipse(148, -52, 9, 6, 8), { relleno: 'rgba(0,0,0,0)', ancho: 2.4 });
  };
  O.crema = (x) => {
    R.forma(x, R.rect(-42, -12, 42, 46, 10), { relleno: '#fff7f4' });
    R.forma(x, R.rect(-46, -40, 46, -10, 8), { relleno: '#f2a1b3' });
    R.forma(x, [[0, 30], [-10, 18], [-10, 10], [-4, 7], [0, 11], [4, 7], [10, 10], [10, 18]], { relleno: '#f2a1b3', ancho: 1.8, j: .3 });
  };
  O.colorete = (x) => {
    R.forma(x, R.elipse(0, -40, 42, 22, 16), { relleno: '#e9c77e' });
    R.forma(x, R.elipse(0, -40, 34, 16, 16), { relleno: (c) => { c.fillStyle = '#cfe8f7'; c.fillRect(-40, -60, 80, 40);
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, -30); c.lineTo(4, -54); c.moveTo(-2, -28); c.lineTo(14, -50); c.stroke(); }, ancho: 2.2 });
    R.forma(x, R.elipse(0, 10, 44, 26, 16), { relleno: '#e9c77e' });
    R.forma(x, R.elipse(0, 8, 34, 18, 16), { relleno: '#f38fa6', ancho: 2.2 });
  };
  O.brocha = (x) => {
    R.forma(x, [[-80, -4], [-10, -8], [-10, 8], [-80, 4], [-86, 0]], { relleno: '#f7c6d6' });
    R.forma(x, R.rect(-10, -10, 16, 10, 2), { relleno: '#e2e2e8' });
    R.forma(x, [[16, -10], [44, -22], [66, -14], [72, 0], [66, 14], [44, 22], [16, 10]], { relleno: (c) => {
      const g = c.createLinearGradient(16, 0, 72, 0); g.addColorStop(0, '#7a4a36'); g.addColorStop(.6, '#a8705a'); g.addColorStop(1, '#f38fa6'); c.fillStyle = g; c.fillRect(10, -30, 70, 60); } });
  };
  O.rimel = (x) => {
    R.forma(x, R.rect(-70, -11, -16, 11, 5), { relleno: '#2e2a2e' });
    R.forma(x, R.rect(-18, -4, 34, 4, 2), { relleno: '#c9c9cf', ancho: 2 });
    R.forma(x, R.elipse(46, 0, 16, 8, 10), { relleno: '#2e2a2e', ancho: 2 });
    for (let i = 0; i < 6; i++) R.linea(x, [[34 + i * 5, -10], [34 + i * 5, 10]], { ancho: 1.6, j: .3 });
  };
  O.pintalabios = (x) => {
    R.forma(x, R.rect(-15, 0, 15, 52, 3), { relleno: '#e9c77e' });
    R.forma(x, R.rect(-12, -14, 12, 2, 2), { relleno: '#f0d79c' });
    R.forma(x, [[-10, -14], [-10, -38], [-4, -48], [10, -56], [10, -14]], { relleno: '#d63c5a' });
    R.linea(x, [[-15, 18], [15, 18]], { ancho: 2, j: .3 });
  };
  O.cepilloPelo = (x) => {
    R.forma(x, [[-9, 10], [9, 10], [11, 96], [0, 104], [-11, 96]], { relleno: '#c58b5c' });
    R.forma(x, R.elipse(0, -38, 38, 52, 16), { relleno: '#c58b5c' });
    R.forma(x, R.elipse(0, -38, 29, 42, 16), { relleno: '#f5b6c6', ancho: 2.2 });
    for (let i = -2; i <= 2; i++) for (let j = -3; j <= 3; j++) if (i * i / 6 + j * j / 12 < 1) R.punto(x, i * 10, -38 + j * 11, 2.6, '#3a2626');
  };
  O.horquilla = (x, o = {}) => {
    R.forma(x, R.rect(-18, -6, 18, 6, 5), { relleno: o.color || '#a9d3f0', ancho: 2.2 });
    R.punto(x, -8, 0, 2, '#fff'); R.punto(x, 3, 0, 2, '#fff');
  };
  O.turbante = (x) => {                              // toalla enrollada en la cabeza (coordenadas del personaje)
    R.forma(x, [[-86, -896], [-96, -950], [-82, -1010], [-42, -1060], [10, -1080], [60, -1062], [93, -1012], [96, -950], [86, -896], [42, -926], [0, -934], [-42, -926]],
      { relleno: '#bfe4d4' });
    R.linea(x, [[-74, -958], [-10, -1000], [64, -1040]], { ancho: 2.6 });
    R.linea(x, [[-52, -1032], [30, -994], [88, -962]], { ancho: 2.6 });
  };
  O.patito = (x) => {
    R.forma(x, [[-30, 0], [-34, -20], [-20, -30], [10, -26], [30, -14], [26, 4], [0, 8]], { relleno: '#ffd85c' });
    R.forma(x, R.elipse(-16, -42, 16, 15, 10), { relleno: '#ffd85c' });
    R.forma(x, [[-32, -44], [-46, -40], [-32, -36]], { relleno: '#f39a3c', ancho: 2 });
    R.punto(x, -18, -46, 2.6, '#3a2626');
  };
  O.frasco = (x, o = {}) => {                        // botella de baño generica (o.forma: 0 alta, 1 redonda, 2 bomba)
    const c = o.color || '#bfe4d4';
    if (o.forma === 1) { R.forma(x, R.elipse(0, -26, 24, 26, 12), { relleno: c }); R.forma(x, R.rect(-8, -62, 8, -48, 2), { relleno: '#e9c77e' }); }
    else if (o.forma === 2) { R.forma(x, R.rect(-20, -60, 20, 0, 6), { relleno: c }); R.forma(x, R.rect(-5, -80, 5, -60, 1), { relleno: '#fff' }); R.forma(x, R.rect(-5, -86, 20, -78, 2), { relleno: '#fff' }); }
    else { R.forma(x, R.rect(-15, -70, 15, 0, 5), { relleno: c }); R.forma(x, R.rect(-7, -86, 7, -70, 2), { relleno: '#f2a1b3' }); }
    R.forma(x, R.rect(-9, -40, 9, -24, 2), { relleno: '#fff', ancho: 1.6 });
  };

  /* ---------------- BAÑO (vineta flotante, como una pieza recortada) ---------------- */
  R.bano = function (x, P = {}) {
    const pieza = (n, bx, by, fn) => { const s = P[n]; if (s > 0) R.con(x, bx, by, s, 0, fn); };
    pieza('pared', 0, 0, () => {
      const muro = [[-420, 0], [-420, -640], [-380, -760], [-250, -830], [0, -856], [250, -830], [380, -760], [420, -640], [420, 0]];
      R.forma(x, muro, { relleno: (c) => {
        c.fillStyle = '#d6efe6'; c.fillRect(-440, -880, 880, 900);
        c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 3;
        for (let y = -860; y < -300; y += 48) { c.beginPath(); c.moveTo(-440, y); c.lineTo(440, y); c.stroke(); }
        for (let X = -440; X < 440; X += 48) { c.beginPath(); c.moveTo(X, -880); c.lineTo(X, -300); c.stroke(); }
        c.fillStyle = '#f9dfe4'; c.fillRect(-440, -300, 880, 300);                       // zocalo rosa
        c.strokeStyle = 'rgba(255,255,255,0.8)';
        for (let X = -440; X < 440; X += 36) { c.beginPath(); c.moveTo(X, -300); c.lineTo(X, 0); c.stroke(); }
      } });
      R.linea(x, [[-420, -300], [420, -300]], { ancho: 2.6 });
    });
    pieza('suelo', 0, 0, () => {
      const s = [[-420, 0], [420, 0], [470, 160], [-470, 160]];
      R.forma(x, s, { relleno: (c) => {
        c.fillStyle = '#fff6f6'; c.fillRect(-480, -5, 960, 170);
        c.fillStyle = '#f6b9c4';
        for (let f = 0; f < 4; f++) for (let k = -10; k < 10; k++) if ((f + k) % 2 === 0) {
          const y0 = f * 40, y1 = y0 + 40, w0 = 840 + y0 * (100 / 160), w1 = 840 + y1 * (100 / 160), n = 20;
          c.beginPath(); c.moveTo(k * w0 / n, y0); c.lineTo((k + 1) * w0 / n, y0); c.lineTo((k + 1) * w1 / n, y1); c.lineTo(k * w1 / n, y1); c.fill();
        }
      } });
    });
    pieza('banera', -215, 70, () => {
      R.forma(x, R.rect(-185, -18, -165, 14, 5), { relleno: '#e9c77e' }); R.forma(x, R.rect(150, -18, 170, 14, 5), { relleno: '#e9c77e' });
      for (let i = 0; i < 9; i++) { const bx = -170 + i * 40; R.forma(x, R.elipse(bx, -258 - (i % 2) * 14, 30, 22, 9), { relleno: '#ffffff', ancho: 2.4 }); }
      R.forma(x, [[-205, -250], [200, -250], [190, -150], [160, -60], [110, -14], [-130, -14], [-180, -60], [-200, -150]], { relleno: '#fbfbf8' });
      R.linea(x, [[-205, -236], [200, -236]], { ancho: 2.4 });
      R.forma(x, [[-190, -250], [-190, -330], [-160, -350], [-130, -340], [-140, -330], [-162, -334], [-176, -322], [-176, -250]], { relleno: '#e9c77e', ancho: 2.6 });
    });
    pieza('patito', -110, -205, () => R.obj.patito(x));
    pieza('lavabo', 215, 40, () => {
      R.forma(x, [[-30, -300], [30, -300], [44, 0], [-44, 0]], { relleno: '#fbfbf8' });
      R.forma(x, [[-130, -390], [130, -390], [118, -330], [60, -300], [-60, -300], [-118, -330]], { relleno: '#fbfbf8' });
      R.linea(x, [[-128, -376], [128, -376]], { ancho: 2.4 });
      R.forma(x, [[-6, -392], [-6, -428], [26, -440], [40, -426], [32, -420], [16, -426], [8, -420], [8, -392]], { relleno: '#e9c77e', ancho: 2.6 });
      R.con(x, -86, -392, .55, 0, () => R.obj.frasco(x, { forma: 2, color: '#f6b9c4' }));
      R.con(x, 84, -392, .9, 0, () => { R.forma(x, R.rect(-16, -40, 16, 0, 5), { relleno: '#bfe4d4' }); R.con(x, 6, -52, .45, -1.3, () => R.obj.cepilloDientes(x)); });
    });
    pieza('espejo', 215, -560, () => {
      R.forma(x, R.elipse(0, 0, 120, 150, 22), { relleno: '#e9c77e' });
      R.forma(x, R.elipse(0, 0, 100, 130, 22), { relleno: (c) => {
        const g = c.createLinearGradient(-100, -130, 100, 130); g.addColorStop(0, '#e4f4fb'); g.addColorStop(1, '#bcdcec'); c.fillStyle = g; c.fillRect(-110, -140, 220, 280);
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 9; c.beginPath(); c.moveTo(-60, 10); c.lineTo(10, -90); c.moveTo(-40, 50); c.lineTo(40, -60); c.stroke(); }, ancho: 2.6 });
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; R.punto(x, Math.cos(a) * 110, Math.sin(a) * 140, 4, '#fff3cf'); }
    });
    pieza('estante', -250, -440, () => {
      R.forma(x, R.rect(-140, 0, 140, 16, 3), { relleno: '#d7a777' });
      R.con(x, -95, 0, 1, 0, () => O.frasco(x, { forma: 0, color: '#a9d3f0' }));
      R.con(x, -50, 0, 1, 0, () => O.frasco(x, { forma: 1, color: '#f6b9c4' }));
      R.con(x, 10, 0, .9, 0, () => O.frasco(x, { forma: 2, color: '#fff3cf' }));
      R.forma(x, R.rect(45, -50, 80, 0, 4), { relleno: '#fff7f4' }); R.linea(x, [[62, -50], [62, -62]], { ancho: 2 });   // vela
      R.forma(x, [[62, -64], [56, -74], [62, -86], [68, -74]], { relleno: '#ffcf5c', ancho: 1.8 });
      R.forma(x, R.rect(96, -40, 130, 0, 6), { relleno: '#f2a1b3' });
      for (const [a, b] of [[-20, -70], [0, -84], [22, -68]]) R.forma(x, [[113, -40], [113 + a * .5, -40 + b * .6], [113 + a, -40 + b], [113 + a * .7, -40 + b * .4]], { relleno: '#8fbf8a', ancho: 2 });
    });
    pieza('planta', -330, -840, () => {
      R.linea(x, [[0, 0], [-34, 170]], { ancho: 2 }); R.linea(x, [[0, 0], [34, 170]], { ancho: 2 }); R.linea(x, [[0, 0], [0, 172]], { ancho: 2 });
      R.forma(x, [[-44, 170], [44, 170], [34, 226], [-34, 226]], { relleno: '#e7b98a' });
      const hojas = [[-40, 180], [-58, 220], [-50, 262], [-62, 300], [40, 182], [56, 224], [48, 270], [10, 230], [-18, 240]];
      hojas.forEach(([hx, hy], i) => R.forma(x, R.elipse(hx, hy, 16, 9, 8, i % 2 ? .7 : -.7), { relleno: i % 3 ? '#8fbf8a' : '#a8d59c', ancho: 2 }));
      R.linea(x, [[-30, 210], [-50, 260], [-58, 310]], { trazo: '#5f8f5a', ancho: 2.4 });
      R.linea(x, [[30, 210], [46, 250], [44, 290]], { trazo: '#5f8f5a', ancho: 2.4 });
    });
    pieza('toalla', 385, -420, () => {
      R.forma(x, R.rect(-40, -8, 40, 8, 4), { relleno: '#e9c77e' });
      const t = [[-32, 0], [32, 0], [36, 170], [-36, 170]];
      R.forma(x, t, { relleno: (c) => { c.fillStyle = '#f4a7b9'; c.fillRect(-40, 0, 80, 172); c.fillStyle = '#fff'; c.fillRect(-40, 130, 80, 14); } });
    });
    pieza('alfombra', 10, 110, () => {
      R.forma(x, R.elipse(0, 0, 150, 38, 22), { relleno: '#f6b9c4' });
      R.forma(x, R.elipse(0, 0, 110, 26, 22), { relleno: '#fbdbe2', ancho: 2 });
    });
  };
})(window.VE = window.VE || {});
