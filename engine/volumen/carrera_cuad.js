/* VOLUMEN — CUADRUPEDOS DE LA CARRERA (unidades: metros; miran a +X, apoyados en y = 0; mismo convenio que felinos.js).
     V.modelos.cuadrupedo({ especie, marcha, fase, boca, cab, cola, t, trompa, pos, rot, esc })
        especie: 'elefante' | 'hipopotamo' | 'cerdo' | 'facoquero' | 'caballo' | 'galgo' | 'berrendo'
        marcha: 'quieto' | 'camina' | 'trote' | 'galope' · fase: vueltas del ciclo de paso (usar fase = distancia / zancada)
        boca 0..1 · cab: cabeza arriba/abajo (rad) · cola: balanceo (rad) · t: segundos (orejas, parpadeo) · trompa: 0..1 (elefante: la levanta)
     V.modelos.cuadrupedo.cabeza(especie, {pos, esc, rot}) -> punto aproximado de la cabeza (para etiquetas)
   Piel pintada una vez (arrugas del elefante, cerdas, pelaje a trazos, manchas) y rasgos propios de cada especie. Revisar en fotogramas. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v)), sn = Math.sin, cs = Math.cos, mx = Math.max;
  const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
  const mt = (mapa, e) => Object.assign({ color: '#ffffff', mapa, esp: 0.04, dureza: 10, envolver: 0.45, borde: 0.25 }, e || {});
  const el = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(28), esc: e3, pos: pos || [0, 0, 0], rot, mat });
  const eje = (a, b, c, pos, mat) => V.nodo({ malla: MA.esfera(40), esc: [a, b, c], pos, rot: [0, 0, PI / 2], mat });   // a = semieje vertical, b = largo (X), c = ancho
  const cono = (r, h, mat, pos, rot) => V.nodo({ malla: MA.cilindro(r, 0.0, h, 14), pos, rot, mat });
  const cil = (r1, r2, h, mat, pos, rot) => V.nodo({ malla: MA.cilindro(r1, r2, h, 16), pos, rot, mat });

  /* ---------------------------------------------------------------- pintura de pieles (una vez por especie) */
  const pelo = (x, W, H, n, cols, largo, sem, alfa) => {
    const r = VE.rng('cpelo|' + sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = largo * (0.5 + r()), c = cols[Math.floor(r() * cols.length)];
      x.globalAlpha = (0.03 + r() * 0.07) * (alfa || 1); x.strokeStyle = c; x.lineWidth = 0.6 + r() * 0.7; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 3, y0 + l); x.stroke(); }
    x.globalAlpha = 1;
  };
  const arrugas = (x, W, H, n, col, sem, alfa, grosor, largo) => {
    const r = VE.rng('carr|' + sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const y = r() * H, x0 = r() * W, l = W * (largo || 0.2) * (0.4 + r());
      x.globalAlpha = alfa * (0.3 + r() * 0.7); x.strokeStyle = col; x.lineWidth = (grosor || 2) * (0.5 + r()); x.beginPath(); x.moveTo(x0, y);
      x.bezierCurveTo(x0 + l * 0.3, y + (r() - 0.5) * 9, x0 + l * 0.7, y + (r() - 0.5) * 9, x0 + l, y + (r() - 0.5) * 6); x.stroke(); }
    x.globalAlpha = 1;
  };
  const motas = (x, W, H, n, cols, rmin, rmax, sem, alfa) => {
    const r = VE.rng('cmota|' + sem);
    for (let i = 0; i < n; i++) { const cx = r() * W, cy = r() * H, rr = rmin + r() * (rmax - rmin), c = cols[Math.floor(r() * cols.length)];
      x.globalAlpha = alfa * (0.4 + r() * 0.6); x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rr, rr * (0.5 + r() * 0.6), r() * 3, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  };

  /* ---------------------------------------------------------------- especies */
  const Q = {
    elefante: {
      pel: '#7b756f', osc: '#58524d', cla: '#8d867e', cpata: '#716b65', pie: '#4f4a45', cab: '#7b756f', pelos: 900, pcols: ['#3e3935', '#a39b92'], largoPelo: 7, mezcla: 0.55,
      extra(x, W, H) { arrugas(x, W, H, 160, '#2f2b28', 'ele', 0.3, 2.2, 0.16); arrugas(x, W, H, 120, '#a8a097', 'eleb', 0.14, 1.4, 0.16);
        { const r = VE.rng('eleX'); x.lineCap = 'round'; for (let i = 0; i < 2600; i++) { const x0 = r() * W, y0 = r() * H, ang = (r() - 0.5) * 2.4 + (r() < 0.45 ? 1.5708 : 0), l = 14 + r() * 46; x.globalAlpha = 0.07 + r() * 0.13; x.strokeStyle = r() < 0.75 ? '#2c2824' : '#b4aba0'; x.lineWidth = 0.8 + r() * 1.6; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + Math.cos(ang) * l * 0.5 + (r() - 0.5) * 8, y0 + Math.sin(ang) * l * 0.5 + (r() - 0.5) * 8, x0 + Math.cos(ang) * l, y0 + Math.sin(ang) * l); x.stroke(); } x.globalAlpha = 1; } motas(x, W, H, 120, ['#9d8b76', '#a99679'], 14, 60, 'elpol', 0.16); },
      yb: 2.42, tronco: { a: 0.84, b: 1.5, c: 0.78 }, pecho: { x: 0.88, a: 0.8, b: 0.7, c: 0.72 }, grupa: { x: -0.95, a: 0.8, b: 0.65, c: 0.72 },
      pata: { L1: 1.14, L2: 1.08, r1d: 0.34, r1t: 0.38, r2: 0.26, r3: 0.23, dx: 1.0, tx: -1.05, z: 0.5, pie: 'elefante' },
      cuello: { x: 1.5, y: 0.5, ln: 0.5, r1: 0.52, r2: 0.46, elev: 0.08 }, gait: { A: 0.5, K: 0.55 }, cabeza: 'elefante', cola: 'elefante', hip: 1.0
    },
    hipopotamo: {
      pel: '#7d6762', osc: '#5a4643', cla: '#c9988c', cpata: '#745f5b', pie: '#5a4643', cab: '#7d6762', pelos: 0, pcols: ['#000'], largoPelo: 4, mezcla: 0.8,
      extra(x, W, H) { motas(x, W, H, 260, ['#a8787a', '#9a6e6c', '#5d4947'], 8, 40, 'hip', 0.22); arrugas(x, W, H, 160, '#3b2d2c', 'hipa', 0.35, 2, 0.18);
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,230,220,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,230,220,0.1)'); x.fillStyle = g; x.fillRect(0, 0, W, H); },
      yb: 0.98, tronco: { a: 0.66, b: 1.2, c: 0.74 }, pecho: { x: 0.7, a: 0.64, b: 0.55, c: 0.7 }, grupa: { x: -0.75, a: 0.64, b: 0.55, c: 0.7 },
      pata: { L1: 0.36, L2: 0.34, r1d: 0.26, r1t: 0.27, r2: 0.2, r3: 0.19, dx: 0.7, tx: -0.78, z: 0.42, pie: 'hipopotamo' },
      cuello: { x: 1.15, y: 0.18, ln: 0.35, r1: 0.5, r2: 0.46, elev: 0.0 }, gait: { A: 0.55, K: 0.5 }, cabeza: 'hipopotamo', cola: 'corta', hip: 1.0
    },
    cerdo: {
      pel: '#eab9b0', osc: '#d89c94', cla: '#f6d6cd', cpata: '#e7b0a6', pie: '#4a3b36', cab: '#eab9b0', pelos: 5000, pcols: ['#f8e6dc', '#caa097', '#fff'], largoPelo: 5, mezcla: 0.5,
      extra(x, W, H) { motas(x, W, H, 6, ['#3a302c'], 22, 46, 'cer', 0.8); motas(x, W, H, 260, ['#cf8f86', '#f6d6cd'], 5, 22, 'cerb', 0.22); },
      yb: 0.62, tronco: { a: 0.3, b: 0.55, c: 0.27 }, pecho: { x: 0.34, a: 0.3, b: 0.3, c: 0.26 }, grupa: { x: -0.38, a: 0.32, b: 0.28, c: 0.27 },
      pata: { L1: 0.2, L2: 0.22, r1d: 0.07, r1t: 0.09, r2: 0.05, r3: 0.04, dx: 0.33, tx: -0.36, z: 0.14, pie: 'pezuna' },
      cuello: { x: 0.6, y: 0.1, ln: 0.18, r1: 0.19, r2: 0.17, elev: 0.05 }, gait: { A: 0.9, K: 0.8 }, cabeza: 'cerdo', cola: 'rizada', hip: 1.0
    },
    facoquero: {
      pel: '#6c5b4d', osc: '#3b2f27', cla: '#8b7a69', cpata: '#5e4f43', pie: '#2f2620', cab: '#6c5b4d', pelos: 7000, pcols: ['#2a2019', '#8d7c6b', '#4a3b30'], largoPelo: 8, mezcla: 0.6,
      extra(x, W, H) { motas(x, W, H, 160, ['#4d3f34', '#7f6f5f'], 6, 24, 'fac', 0.22); },
      yb: 0.74, tronco: { a: 0.3, b: 0.5, c: 0.25 }, pecho: { x: 0.34, a: 0.34, b: 0.3, c: 0.25 }, grupa: { x: -0.36, a: 0.3, b: 0.26, c: 0.25 },
      pata: { L1: 0.27, L2: 0.3, r1d: 0.075, r1t: 0.09, r2: 0.045, r3: 0.035, dx: 0.33, tx: -0.35, z: 0.14, pie: 'pezuna' },
      cuello: { x: 0.58, y: 0.14, ln: 0.2, r1: 0.2, r2: 0.18, elev: 0.15 }, gait: { A: 1.0, K: 0.9 }, cabeza: 'facoquero', cola: 'penacho', hip: 1.0
    },
    caballo: {
      pel: '#7d4120', osc: '#3b1e10', cla: '#9d5b32', cpata: '#7d4120', pie: '#171009', cab: '#7d4120', pelos: 9000, pcols: ['#4a2512', '#a8683c', '#2a160c'], largoPelo: 6, mezcla: 0.6,
      extra(x, W, H) { const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0.18, 'rgba(255,220,170,0)'); g.addColorStop(0.3, 'rgba(255,215,160,0.22)'); g.addColorStop(0.45, 'rgba(255,215,160,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        motas(x, W, H, 60, ['#5f3015', '#a96b3b'], 20, 70, 'cab', 0.14); },
      yb: 1.4, tronco: { a: 0.36, b: 0.66, c: 0.24 }, pecho: { x: 0.45, a: 0.4, b: 0.3, c: 0.22 }, grupa: { x: -0.48, a: 0.4, b: 0.34, c: 0.26 },
      pata: { L1: 0.6, L2: 0.69, r1d: 0.1, r1t: 0.125, r2: 0.055, r3: 0.04, dx: 0.5, tx: -0.55, z: 0.15, pie: 'casco' },
      cuello: { x: 0.62, y: 0.2, ln: 0.78, r1: 0.17, r2: 0.1, elev: 0.95 }, gait: { A: 1.0, K: 1.0 }, cabeza: 'caballo', cola: 'caballo', hip: 1.0
    },
    galgo: {
      pel: '#c99c66', osc: '#7a512b', cla: '#f1e8d8', cpata: '#c99c66', pie: '#efe3d0', cab: '#c99c66', pelos: 7000, pcols: ['#8a6038', '#e0b27a', '#f6ecdc'], largoPelo: 5, mezcla: 0.55,
      extra(x, W, H) { arrugas(x, W, H, 230, '#4a2f18', 'gal', 0.3, 2.4, 0.36); },
      yb: 0.78, tronco: { a: 0.2, b: 0.42, c: 0.115 }, pecho: { x: 0.28, a: 0.27, b: 0.28, c: 0.125 }, grupa: { x: -0.36, a: 0.23, b: 0.28, c: 0.135 },
      pata: { L1: 0.33, L2: 0.36, r1d: 0.05, r1t: 0.065, r2: 0.03, r3: 0.022, dx: 0.3, tx: -0.38, z: 0.085, pie: 'galgo' },
      cuello: { x: 0.44, y: 0.07, ln: 0.4, r1: 0.075, r2: 0.055, elev: 0.85 }, gait: { A: 1.05, K: 1.0 }, cabeza: 'galgo', cola: 'galgo', hip: 1.0
    },
    berrendo: {
      pel: '#c58946', osc: '#8e5826', cla: '#fbf6ec', cpata: '#c58946', pie: '#2b2118', cab: '#c58946', pelos: 9000, pcols: ['#a56a2e', '#e3b274', '#fff'], largoPelo: 6, mezcla: 0.65,
      extra(x, W, H) { x.fillStyle = '#fbf6ec'; x.globalAlpha = 0.95; x.beginPath(); x.ellipse(W * 0.25, H * 0.06, W * 0.2, H * 0.1, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(W * 0.75, H * 0.06, W * 0.2, H * 0.1, 0, 0, TAU); x.fill(); x.globalAlpha = 1; },
      yb: 0.93, tronco: { a: 0.25, b: 0.46, c: 0.17 }, pecho: { x: 0.32, a: 0.28, b: 0.26, c: 0.16 }, grupa: { x: -0.36, a: 0.25, b: 0.26, c: 0.17 },
      pata: { L1: 0.38, L2: 0.42, r1d: 0.06, r1t: 0.075, r2: 0.035, r3: 0.025, dx: 0.33, tx: -0.38, z: 0.1, pie: 'pezunaFina' },
      cuello: { x: 0.42, y: 0.08, ln: 0.42, r1: 0.1, r2: 0.07, elev: 0.9 }, gait: { A: 1.0, K: 1.0 }, cabeza: 'berrendo', cola: 'corta', hip: 1.0
    }
  };

  /* ---------------------------------------------------------------- ojos (esclera oscura, iris, pupila, brillo) */
  const ojo = (pos, r, iris, lado, pupila) => [
    el(liso('#1b120d', { esp: 0.7, dureza: 80 }), [r * 1.05, r, r * 0.9], pos, [0, lado * 0.3, 0]),
    el(liso(iris, { esp: 0.9, dureza: 100, emision: 0.1 }), [r * 0.82, r * 0.82, r * 0.7], [pos[0] + r * 0.22, pos[1], pos[2] + lado * r * 0.2], [0, lado * 0.3, 0]),
    el(liso('#050403', { esp: 0.9, dureza: 120 }), pupila ? [r * 0.3, r * 0.7, r * 0.3] : [r * 0.42, r * 0.42, r * 0.3], [pos[0] + r * 0.5, pos[1], pos[2] + lado * r * 0.3], [0, lado * 0.3, 0]),
    el(liso('#ffffff', { esp: 1, dureza: 200, emision: 0.7 }), [r * 0.13, r * 0.13, r * 0.1], [pos[0] + r * 0.62, pos[1] + r * 0.28, pos[2] + lado * r * 0.45])];
  const hex = (c, k) => { const p = VE.color.aRGB(c); return `rgb(${Math.round(p[0] * k)},${Math.round(p[1] * k)},${Math.round(p[2] * k)})`; };

  /* ---------------------------------------------------------------- cabezas (origen = nuca; +X delante) */
  const CAB = {
    caballo(E, o, M) {
      const h = [], b = c01(o.boca || 0);
      h.push(el(M.cab, [0.19, 0.14, 0.12], [0.06, 0, 0]));                                              // craneo
      h.push(el(M.cab, [0.24, 0.1, 0.095], [0.27, -0.065, 0], [0, 0, -0.22]));                           // cara
      h.push(el(M.cab, [0.14, 0.092, 0.086], [0.5, -0.155, 0], [0, 0, -0.35]));                          // hocico
      h.push(el(liso('#241710', { esp: 0.2 }), [0.06, 0.07, 0.085], [0.62, -0.19, 0], [0, 0, -0.35])); // morro oscuro
      for (const s of [-1, 1]) {
        h.push(el(liso('#120a06', { esp: 0.2 }), [0.028, 0.02, 0.012], [0.63, -0.15, s * 0.045], [0, 0, -0.4]));             // ollar
        h.push(...ojo([0.14, 0.055, s * 0.108], 0.03, '#3a2210', s, false));
        h.push(el(M.cab, [0.032, 0.012, 0.03], [0.14, 0.088, s * 0.1]));                                 // parpado
        h.push(V.nodo({ pos: [0.0, 0.14, s * 0.07], rot: [s * 0.12, 0, s * 0.14], hijos: [cono(0.04, 0.17, M.cab, [0, 0.08, 0]), cono(0.026, 0.12, liso('#c9857a'), [0, 0.07, s * 0.012])] }));   // oreja
      }
      h.push(V.nodo({ pos: [0.18, -0.215, 0], rot: [0, 0, -b * 0.9], hijos: [el(M.cab, [0.2, 0.052, 0.06], [0.14, 0.04, 0]), el(liso('#3b0f0f'), [0.14, 0.012, 0.04], [0.16, 0.085, 0]), el(liso('#c0646a'), [0.1, 0.01, 0.03], [0.14, 0.09, 0])] }));
      h.push(el(liso('#3b1c0e'), [0.07, 0.1, 0.02], [0.02, 0.12, 0]));                                    // flequillo
      return h;
    },
    galgo(E, o, M) {
      const h = [], b = c01(o.boca || 0);
      h.push(el(M.cab, [0.11, 0.078, 0.068], [0.03, 0, 0]));
      h.push(el(M.cab, [0.2, 0.052, 0.046], [0.19, -0.03, 0], [0, 0, -0.1]));
      h.push(el(liso('#1c1410', { esp: 0.6 }), [0.026, 0.02, 0.03], [0.385, -0.03, 0]));                 // trufa
      h.push(el(liso('#ede2d1'), [0.025, 0.02, 0.012], [0.01, 0.09, 0]));
      for (const s of [-1, 1]) {
        h.push(...ojo([0.115, 0.03, s * 0.057], 0.017, '#4a2b12', s, false));
        h.push(V.nodo({ pos: [-0.02, 0.06, s * 0.055], rot: [s * 0.55, s * 0.3, -0.7], hijos: [el(liso('#9c7447'), [0.07, 0.014, 0.04], [-0.05, 0, 0]), el(liso('#d9a8a0'), [0.05, 0.008, 0.026], [-0.05, -0.006, 0])] }));  // oreja en rosa
        h.push(el(liso('#f4ecde'), [0.12, 0.012, 0.012], [0.2, -0.078, s * 0.04]));                       // belfo
      }
      h.push(V.nodo({ pos: [0.06, -0.06, 0], rot: [0, 0, -b * 0.8], hijos: [el(M.cab, [0.15, 0.022, 0.034], [0.1, 0.0, 0]), el(liso('#bf5c60'), [0.1, 0.01, 0.025], [0.12, 0.014, 0]), ...[-1, 1].map(s => cono(0.006, 0.03, liso('#f6f0e2'), [0.2, 0.025, s * 0.02], [0, 0, 0]))] }));
      return h;
    },
    berrendo(E, o, M) {
      const h = [], b = c01(o.boca || 0);
      h.push(el(M.cab, [0.13, 0.1, 0.085], [0.03, 0, 0]));
      h.push(el(M.cab, [0.18, 0.068, 0.058], [0.2, -0.045, 0], [0, 0, -0.18]));
      h.push(el(liso('#17110c', { esp: 0.5 }), [0.05, 0.045, 0.06], [0.36, -0.085, 0]));               // morro negro
      h.push(el(liso('#17110c', { esp: 0.4 }), [0.12, 0.03, 0.03], [0.3, -0.085, 0]));
      h.push(el(liso('#1a130d'), [0.07, 0.03, 0.062], [0.24, -0.01, 0]));
      for (const s of [-1, 1]) {
        h.push(...ojo([0.115, 0.045, s * 0.082], 0.028, '#2e1c0e', s, true));
        h.push(el(liso('#faf6ee'), [0.06, 0.012, 0.012], [0.08, -0.06, s * 0.092]));                      // rayas de la cara
        h.push(V.nodo({ pos: [-0.04, 0.09, s * 0.06], rot: [s * 0.35, 0, s * 0.25], hijos: [el(M.cab, [0.025, 0.09, 0.045], [0, 0.07, 0]), el(liso('#e8d3c0'), [0.016, 0.07, 0.028], [0.006, 0.07, 0])] }));  // oreja
        // cuerno con su punta (la «horquilla» que da nombre al animal)
        h.push(V.nodo({ pos: [0.03, 0.09, s * 0.045], rot: [s * 0.1, 0, 0], hijos: [cil(0.022, 0.015, 0.22, liso('#1d1812', { esp: 0.5 }), [0, 0.11, 0]), cil(0.014, 0.0, 0.1, liso('#1d1812', { esp: 0.5 }), [-0.04, 0.235, 0], [0, 0, 0.5]), cil(0.015, 0.0, 0.07, liso('#1d1812', { esp: 0.5 }), [0.02, 0.255, 0], [0, 0, -0.5]), cil(0.014, 0.0, 0.08, liso('#1d1812', { esp: 0.5 }), [-0.02, 0.2, 0], [0, 0, 0.2])] }));
      }
      h.push(V.nodo({ pos: [0.07, -0.09, 0], rot: [0, 0, -b * 0.8], hijos: [el(M.cab, [0.12, 0.024, 0.036], [0.1, 0, 0]), el(liso('#bd6a6a'), [0.08, 0.01, 0.024], [0.12, 0.013, 0])] }));
      return h;
    },
    cerdo(E, o, M) {
      const h = [], b = c01(o.boca || 0);
      h.push(el(M.cab, [0.2, 0.17, 0.155], [0.05, 0, 0]));
      h.push(el(M.cab, [0.17, 0.095, 0.1], [0.24, -0.06, 0], [0, 0, -0.18]));
      h.push(V.nodo({ pos: [0.38, -0.085, 0], rot: [0, 0, PI / 2 - 0.0], hijos: [cil(0.07, 0.075, 0.05, liso('#e39c96', { esp: 0.5 }), [0, 0, 0], [0, 0, 0])] }));
      h.push(el(liso('#e39c96', { esp: 0.5 }), [0.03, 0.075, 0.075], [0.405, -0.085, 0]));              // disco del hocico
      for (const s of [-1, 1]) {
        h.push(el(liso('#4a1f1f', { esp: 0.3 }), [0.01, 0.026, 0.016], [0.433, -0.085, s * 0.034]));      // ollares
        h.push(...ojo([0.17, 0.06, s * 0.112], 0.022, '#3d2514', s, false));
        h.push(el(liso('#f2e3d8'), [0.07, 0.012, 0.012], [0.16, 0.085, s * 0.095]));                      // pestañas claras
        h.push(V.nodo({ pos: [0.03, 0.13, s * 0.09], rot: [s * 0.5, s * 0.3, -0.5], hijos: [el(M.cab, [0.1, 0.012, 0.075], [0.06, 0, 0]), el(liso('#d98f87'), [0.08, 0.008, 0.055], [0.06, -0.004, 0])] }));   // oreja caída
      }
      h.push(V.nodo({ pos: [0.12, -0.12, 0], rot: [0, 0, -b * 0.7], hijos: [el(M.cab, [0.1, 0.025, 0.06], [0.1, 0, 0]), el(liso('#bd5f66'), [0.07, 0.012, 0.04], [0.1, 0.014, 0])] }));
      return h;
    },
    facoquero(E, o, M) {
      const h = [], b = c01(o.boca || 0), mw = liso('#f1e8d3', { esp: 0.6, dureza: 60 });
      h.push(el(M.cab, [0.26, 0.2, 0.22], [0.08, 0, 0]));
      h.push(el(M.cab, [0.2, 0.1, 0.14], [0.3, -0.06, 0], [0, 0, -0.2]));
      h.push(el(liso('#241a14', { esp: 0.5 }), [0.04, 0.08, 0.1], [0.46, -0.09, 0]));
      for (const s of [-1, 1]) {
        h.push(el(liso('#120b07'), [0.01, 0.022, 0.014], [0.495, -0.085, s * 0.03]));
        h.push(...ojo([0.2, 0.085, s * 0.15], 0.025, '#3a2410', s, false));
        h.push(el(liso('#7d6c5b', { esp: 0.4 }), [0.04, 0.045, 0.04], [0.22, 0.0, s * 0.19]));            // verruga bajo el ojo
        h.push(el(liso('#7d6c5b', { esp: 0.4 }), [0.035, 0.035, 0.035], [0.4, 0.03, s * 0.11]));           // verruga del hocico
        h.push(V.nodo({ pos: [0.38, -0.12, s * 0.09], rot: [s * 0.2, 0, 0.0], hijos: [V.nodo({ rot: [0, 0, 0], hijos: [cono(0.028, 0.34, mw, [0.0, 0.17, 0], [0, 0, 0.0])] })] }));     // colmillo superior
        h.push(V.nodo({ pos: [0.02, 0.17, s * 0.1], rot: [s * 0.6, 0, -0.4], hijos: [el(M.cab, [0.04, 0.09, 0.05], [0, 0.06, 0]), el(liso('#c9a49a'), [0.026, 0.07, 0.03], [0.008, 0.06, 0])] }));  // oreja
      }
      h.push(V.nodo({ pos: [0.18, -0.14, 0], rot: [0, 0, -b * 0.7], hijos: [el(M.cab, [0.14, 0.03, 0.08], [0.1, 0, 0]), el(liso('#a85a5d'), [0.09, 0.012, 0.05], [0.1, 0.016, 0])] }));
      return h;
    },
    hipopotamo(E, o, M) {
      const h = [], b = c01(o.boca || 0), mw = liso('#efe4cb', { esp: 0.55, dureza: 60 }), rosa = liso('#c98d86', { esp: 0.4 }), cav = liso('#7a2a2e', { esp: 0.5 });
      h.push(el(M.cab, [0.52, 0.42, 0.56], [0.18, 0.06, 0]));                                            // craneo / mejillas
      h.push(el(M.cab, [0.5, 0.26, 0.5], [0.58, -0.04, 0], [0, 0, -0.04]));                              // mandibula superior
      h.push(el(rosa, [0.14, 0.24, 0.46], [0.96, -0.02, 0]));                                            // labio ancho
      for (const s of [-1, 1]) {
        h.push(el(M.cab, [0.07, 0.07, 0.06], [0.86, 0.19, s * 0.15]));                                   // abultamiento del ollar
        h.push(el(liso('#150d0b'), [0.03, 0.02, 0.025], [0.9, 0.235, s * 0.15]));                         // ollar
        h.push(el(M.cab, [0.09, 0.08, 0.09], [0.35, 0.37, s * 0.3]));                                    // ojo saliente
        h.push(...ojo([0.4, 0.4, s * 0.34], 0.036, '#5a3a22', s, false));
        h.push(V.nodo({ pos: [0.16, 0.44, s * 0.2], rot: [s * 0.4, 0, 0], hijos: [el(M.cab, [0.05, 0.075, 0.04], [0, 0.04, 0]), el(liso('#b98a84'), [0.03, 0.05, 0.02], [0.01, 0.04, 0])] }));   // oreja
        for (const q of [0, 1]) h.push(cono(0.032, 0.14, mw, [1.0 - q * 0.06, 0.04, s * (0.1 + q * 0.06)], [0, 0, 0]));    // incisivos superiores
      }
      h.push(V.nodo({ pos: [0.3, -0.22, 0], rot: [0, 0, -b * 0.75], hijos: [el(M.cab, [0.5, 0.16, 0.44], [0.3, -0.02, 0]), el(rosa, [0.12, 0.2, 0.4], [0.76, 0.0, 0]), el(cav, [0.45, 0.025, 0.36], [0.3, 0.12, 0]), el(liso('#d98c8c'), [0.34, 0.02, 0.24], [0.3, 0.135, 0]),
        ...[-1, 1].map(s => cil(0.05, 0.03, 0.34, mw, [0.62, 0.2, s * 0.26], [0, 0, 0.28]))] }));        // colmillos inferiores
      return h;
    },
    elefante(E, o, M) {
      const h = [], t = o.t || 0, tr = c01(o.trompa || 0), mw = liso('#e9dcbd', { esp: 0.5, dureza: 60 });
      h.push(el(M.cab, [0.62, 0.7, 0.52], [0.32, 0.1, 0]));                                              // craneo con cupula
      h.push(el(M.cab, [0.34, 0.5, 0.36], [0.74, -0.18, 0]));                                            // cara
      h.push(el(M.cab, [0.2, 0.3, 0.3], [0.5, 0.62, 0]));                                                // frente
      for (const s of [-1, 1]) {
        h.push(...ojo([0.78, 0.0, s * 0.34], 0.04, '#6b4226', s, false));
        h.push(el(M.cab, [0.06, 0.02, 0.05], [0.78, 0.045, s * 0.335]));                                 // parpado
        h.push(el(liso('#2b2420'), [0.07, 0.008, 0.01], [0.77, 0.08, s * 0.33], [0, 0, 0.1]));            // pestañas
        // oreja africana: gran pantalla fina con borde rugoso, que se mueve con t
        h.push(V.nodo({ pos: [0.05, 0.28, s * 0.5], rot: [s * (0.18 + 0.06 * sn(t * 2.4 + s)), s * (0.5 + 0.07 * sn(t * 2.4 + s)), 0], hijos: [
          el(M.oreja, [0.04, 0.72, 0.62], [0, -0.38, s * 0.26]), el(liso('#a98d88', { esp: 0.1 }), [0.034, 0.6, 0.5], [s * 0.03, -0.38, s * 0.26])] }));
        // colmillo: tubo curvo liso (sale junto a la base de la trompa, baja y se curva hacia delante y arriba)
        h.push(V.nodo({ malla: MA.tubo(V.suavizar([[0.86, -0.3, s * 0.2], [1.08, -0.48, s * 0.25], [1.42, -0.6, s * 0.3], [1.78, -0.52, s * 0.33], [2.08, -0.33, s * 0.34]], 18), (q) => 0.075 * Math.pow(0.16, q), 12, { clave: 'ele|colmillo|' + s }), mat: mw }));
      }
      // trompa: cuatro tramos con anillos y movimiento suave
      const rt = (len, r1, r2, ang, hijo) => V.nodo({ rot: [0, 0, ang], hijos: [V.nodo({ malla: MA.capsula(r1, r2, len, 22), mat: M.trompa }), hijo ? V.nodo({ pos: [0, -len, 0], hijos: [hijo] }) : null].filter(Boolean) });
      const sw = 0.1 * sn(t * 1.7), alz = tr * 1.1;
      const punta = V.nodo({ pos: [0, -0.02, 0], hijos: [el(liso('#6a625b', { esp: 0.2 }), [0.05, 0.07, 0.05], [0.0, -0.02, 0]), el(liso('#3a322d'), [0.02, 0.035, 0.012], [0.035, -0.05, 0.016]), el(liso('#3a322d'), [0.02, 0.035, 0.012], [0.035, -0.05, -0.016])] });
      if (!o.trompaTubo) h.push(V.nodo({ pos: [0.95, -0.12, 0], hijos: [rt(0.62, 0.27, 0.2, 0.5 - alz * 0.3 + sw, rt(0.55, 0.2, 0.15, 0.2 - alz * 0.7 + sw, rt(0.5, 0.15, 0.11, -0.2 - alz * 0.7 - sw, rt(0.42, 0.11, 0.09, -0.45 - alz * 0.6 - sw, punta))))] }));
      // boca bajo la trompa
      h.push(V.nodo({ pos: [0.82, -0.52, 0], rot: [0, 0, -c01(o.boca || 0) * 0.5], hijos: [el(M.cab, [0.14, 0.05, 0.14], [0.0, 0, 0]), el(liso('#8a4a4c'), [0.1, 0.02, 0.1], [0.02, 0.03, 0])] }));
      return h;
    }
  };

  /* ---------------------------------------------------------------- colas */
  const COLA = {
    elefante(E, M, c, t) { return V.nodo({ rot: [0, 0, 1.2 + c * 0.5], hijos: [V.nodo({ malla: MA.capsula(0.07, 0.035, 0.9, 12), mat: M.cola }), el(liso('#2d2622'), [0.09, 0.14, 0.09], [0.0, -0.95, 0])] }); },
    corta(E, M, c) { return V.nodo({ rot: [0, 0, 1.0 + c * 0.6], hijos: [V.nodo({ malla: MA.capsula(0.05, 0.03, 0.22, 10), mat: M.cola }), el(liso('#2d2622'), [0.03, 0.05, 0.03], [0, -0.24, 0])] }); },
    rizada(E, M, c) { return V.nodo({ rot: [0, 0, 0.2 + c], hijos: [V.nodo({ malla: MA.toro(0.05, 0.016, 20, 8), rot: [0, 0, 0], mat: M.cola, pos: [0, 0.02, 0] }), V.nodo({ malla: MA.toro(0.035, 0.014, 16, 8), rot: [0, 0, 0], mat: M.cola, pos: [0, 0.08, 0] })] }); },
    penacho(E, M, c) { return V.nodo({ rot: [0, 0, -2.5 + c * 0.4], hijos: [V.nodo({ malla: MA.capsula(0.03, 0.02, 0.3, 10), mat: M.cola }), V.nodo({ pos: [0, -0.32, 0], hijos: [el(liso('#2a2019'), [0.05, 0.14, 0.05], [0, -0.08, 0]), el(liso('#3a2d22'), [0.04, 0.1, 0.07], [0, -0.1, 0])] })] }); },
    caballo(E, M, c) { return V.nodo({ rot: [0, 0, 0.55 + c], hijos: [V.nodo({ malla: MA.capsula(0.07, 0.05, 0.3, 14), mat: M.cola }), V.nodo({ pos: [0, -0.25, 0], rot: [0, 0, 0.2 + c * 0.6], hijos: [el(M.crin, [0.1, 0.5, 0.08], [0.0, -0.3, 0]), el(M.crin, [0.07, 0.35, 0.07], [0.02, -0.45, 0.03])] })] }); },
    galgo(E, M, c) { const seg = (len, r1, r2, ang, hijo) => V.nodo({ rot: [0, 0, ang], hijos: [V.nodo({ malla: MA.capsula(r1, r2, len, 10), mat: M.cola }), hijo ? V.nodo({ pos: [0, -len, 0], hijos: [hijo] }) : null].filter(Boolean) });
      return seg(0.28, 0.04, 0.032, 1.3 + c * 0.4, seg(0.28, 0.032, 0.024, -0.3 + c * 0.5, seg(0.24, 0.024, 0.014, -0.5 + c * 0.5))); }
  };

  /* ---------------------------------------------------------------- patas: pies */
  const PIE = {
    elefante(E, M, G) { return [el(M.pata, [0.22, 0.12, 0.24], [0.04, -0.05, 0]), ...[-0.1, 0, 0.1].map(z => el(liso('#c9bfae', { esp: 0.2 }), [0.035, 0.05, 0.04], [0.26, -0.05, z * 1.4]))]; },
    hipopotamo(E, M) { return [el(M.pata, [0.2, 0.1, 0.2], [0.05, -0.05, 0]), ...[-0.12, -0.04, 0.04, 0.12].map(z => el(liso('#3a2c29', { esp: 0.3 }), [0.04, 0.05, 0.04], [0.23, -0.05, z]))]; },
    pezuna(E, M) { return [el(M.pata, [0.07, 0.05, 0.06], [0.02, -0.03, 0]), ...[-1, 1].map(z => el(liso(E.pie, { esp: 0.6, dureza: 60 }), [0.04, 0.03, 0.026], [0.07, -0.04, z * 0.026]))]; },
    pezunaFina(E, M) { return [el(M.pata, [0.045, 0.04, 0.04], [0.01, -0.03, 0]), ...[-1, 1].map(z => el(liso(E.pie, { esp: 0.6, dureza: 60 }), [0.045, 0.035, 0.02], [0.05, -0.045, z * 0.018]))]; },
    casco(E, M) { return [el(M.pata, [0.05, 0.05, 0.04], [0.0, -0.03, 0]), V.nodo({ malla: MA.cilindro(0.052, 0.07, 0.08, 18), pos: [0.02, -0.095, 0], rot: [0, 0, -0.15], mat: liso('#1c130d', { esp: 0.7, dureza: 80 }) })]; },
    galgo(E, M) { return [el(M.pata, [0.055, 0.03, 0.03], [0.04, -0.03, 0]), ...[-1, 0, 1].map(z => el(liso('#3b2c22', { esp: 0.5 }), [0.012, 0.01, 0.012], [0.095, -0.04, z * 0.015]))]; }
  };

  /* ---------------------------------------------------------------- marcha (mismas fases que felinos.js, con amplitud y levantamiento por especie) */
  function marcha(m, ph, G, ag) {
    const A = G.A, K = G.K, a = (v) => v * A;
    let fl, fr, hl, hr, bob = 0, pitch = 0, cab = 0, cola = 0;
    if (m === 'galope') {
      fl = [0.15 + a(sn(ph)), -0.2 - 0.95 * K * mx(0, sn(ph + 1.5)), 0]; fr = [0.15 + a(sn(ph + 0.55)), -0.2 - 0.95 * K * mx(0, sn(ph + 2.05)), 0];
      hl = [0.35 + a(0.95 * sn(ph + 2.9)), -0.7 - 0.9 * K * mx(0, sn(ph + 4.4)), 0]; hr = [0.35 + a(0.95 * sn(ph + 3.45)), -0.7 - 0.9 * K * mx(0, sn(ph + 4.95)), 0];
      bob = 0.06 * sn(2 * ph + 0.9); pitch = 0.1 * sn(ph + 0.6); cab = 0.08 * sn(ph + 2.2); cola = 0.22 * sn(ph + 1.2);
    } else if (m === 'trote' || m === 'camina') {
      const Ar = a(m === 'trote' ? 0.62 : 0.42), k = (m === 'trote' ? 0.7 : 0.45) * K;
      fl = [0.02 + Ar * sn(ph), -0.1 - k * mx(0, sn(ph + 1.6)), 0]; fr = [0.02 + Ar * sn(ph + PI), -0.1 - k * mx(0, sn(ph + PI + 1.6)), 0];
      hl = [0.3 + Ar * sn(ph + PI), -0.5 - k * mx(0, sn(ph + PI + 1.6)), 0]; hr = [0.3 + Ar * sn(ph), -0.5 - k * mx(0, sn(ph + 1.6)), 0];
      bob = 0.02 * sn(2 * ph); pitch = 0.025 * sn(ph); cola = 0.12 * sn(ph + 1);
    } else { fl = [0.02, -0.04, 0]; fr = fl.slice(); hl = [0.25, -0.45, 0]; hr = hl.slice(); bob = 0.004 * sn(ph * 0.5); }
    return { fl, fr, hl, hr, bob, pitch, cab, cola };
  }


  /* cuerpo de una sola pieza: seccion elipsoidal con perfil suave (pecho y grupa abultados, vientre mas recogido) */
  const sm = (a, b, x) => { const t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function cuerpoMalla(nom, E) {
    const T = E.tronco, Lh = T.b * 1.2, NU = 40, NV = 28;
    return MA.parametrica(NU, NV, (u, v) => {
      const s = u * 2 - 1, th = v * TAU, fin = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 3.2)), 0.5);
      const bulto = 1 + 0.07 * sm(0.1, 0.8, s) + 0.08 * sm(-0.1, -0.7, -s) - 0.06 * Math.exp(-Math.pow((s + 0.1) / 0.35, 2));
      const ry = T.a * 1.04 * bulto * fin, rz = T.c * 1.05 * bulto * fin, cy = Math.cos(th), sy = Math.sin(th);
      return [s * Lh, ry * cy * (cy < 0 ? 0.88 : 1), rz * sy];
    }, { clave: 'car|cuerpo|' + nom });
  }

  /* ---------------------------------------------------------------- el modelo */
  /* Trompa como tubo continuo por una polilinea (coordenadas del modelo, y = altura sobre el suelo). Radio: de 0,27 en la base a 0,075 en la punta. */
  function trompaNodo(pts, M, id) {
    const r = (t) => 0.27 * Math.pow(0.075 / 0.27, Math.pow(t, 0.85)) * (1 + 0.05 * Math.sin(t * 60));
    const fin = pts[pts.length - 1];
    return V.nodo({ hijos: [V.nodo({ malla: MA.tubo(pts, r, 14, { dinamica: 'trompa|' + id }), mat: M.trompa }), el(M.trompa, [0.078, 0.078, 0.078], fin)] });
  }
  /* Catmull-Rom: suaviza una lista de puntos de control a n puntos. */
  V.suavizar = function (c, n) {
    const out = [], m = c.length - 1;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) * m, k = Math.min(m - 1, Math.floor(u)), t = u - k, p0 = c[Math.max(0, k - 1)], p1 = c[k], p2 = c[k + 1], p3 = c[Math.min(m, k + 2)];
      out.push([0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t)));
    }
    return out;
  };

  MO.cuadrupedo = function (o = {}) {
    const nom = o.especie || 'caballo', E = Q[nom];
    if (!E) throw new Error('cuadrupedo: especie desconocida ' + nom);
    const K = 'car|' + nom;
    const cuerpo = V.textura(K + '|cuerpo', 1024, 512, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, W, 0);
      [[0, E.pel], [0.18, E.pel], [0.25, E.osc], [0.32, E.pel], [0.5, E.pel], [0.62, E.cla], [0.75, E.cla], [0.88, E.pel], [1, E.pel]].forEach(s => g.addColorStop(s[0], s[1]));
      x.fillStyle = E.pel; x.fillRect(0, 0, W, H); x.globalAlpha = E.mezcla; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      E.extra(x, W, H); if (E.pelos) pelo(x, W, H, E.pelos * 3, E.pcols, E.largoPelo, nom);
    });
    const pata = V.textura(K + '|pata', 256, 256, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, E.cpata); g.addColorStop(0.7, E.cpata); g.addColorStop(1, E.pie);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      if (nom === 'elefante' || nom === 'hipopotamo') { arrugas(x, W, H, 160, '#2f2b28', K + 'pa', 0.5, 2.4, 0.5); motas(x, W, H, 40, ['#9d8b76'], 10, 30, K + 'pb', 0.2); }
      else if (E.pelos) pelo(x, W, H, 2400, E.pcols, E.largoPelo, nom + 'pata');
      if (nom === 'galgo') { x.fillStyle = '#f1e8d8'; x.fillRect(0, H * 0.62, W, H * 0.38); pelo(x, W, H, 900, ['#e8d9c0', '#fff'], 8, 'galpie'); }
      if (nom === 'berrendo') { x.fillStyle = '#fbf6ec'; x.globalAlpha = 0.9; x.fillRect(0, H * 0.45, W, H * 0.55); x.globalAlpha = 1; }
    });
    const cab = V.textura(K + '|cab', 512, 256, (x, W, H) => {
      x.fillStyle = E.cab; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,240,220,0.3)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      if (nom === 'elefante' || nom === 'hipopotamo') { arrugas(x, W, H, 160, '#2f2b28', K + 'ca', 0.5, 2.2, 0.35); }
      if (nom === 'hipopotamo') motas(x, W, H, 80, ['#b9807c', '#5d4947'], 6, 24, K + 'cb', 0.25);
      if (nom === 'facoquero') { motas(x, W, H, 50, ['#e8dccb'], 12, 40, K + 'cc', 0.22); }
      if (nom === 'berrendo') { x.fillStyle = '#17110c'; x.globalAlpha = 0.8; x.fillRect(0, H * 0.2, W, H * 0.12); x.globalAlpha = 1; }
      if (nom === 'caballo') { x.fillStyle = '#1a0f09'; x.globalAlpha = 0.55; x.fillRect(0, H * 0.7, W, H * 0.3); x.globalAlpha = 1; }
      if (E.pelos) pelo(x, W, H, 4000, E.pcols, Math.max(4, E.largoPelo - 2), nom + 'cab');
    });
    const colaT = V.textura(K + '|cola', 128, 256, (x, W, H) => { x.fillStyle = nom === 'caballo' ? '#2b140a' : (nom === 'elefante' ? '#6a625b' : E.pel); x.fillRect(0, 0, W, H); pelo(x, W, H, 1600, nom === 'caballo' ? ['#1a0c06', '#4a2512', '#0e0704'] : E.pcols, 12, nom + 'cola'); });
    const crinT = V.textura(K + '|crin', 256, 256, (x, W, H) => { x.fillStyle = '#1b0e07'; x.fillRect(0, 0, W, H); const r = VE.rng('crin' + nom); x.lineCap = 'round';
      for (let i = 0; i < 2600; i++) { const x0 = r() * W, y0 = r() * H; x.globalAlpha = 0.25 + r() * 0.5; x.strokeStyle = ['#0b0503', '#2e180c', '#4d2a14', '#140a05'][Math.floor(r() * 4)]; x.lineWidth = 1 + r() * 1.5; x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + 4, y0 + 20, x0 - 4, y0 + 40, x0 + (r() - 0.5) * 8, y0 + 60 + r() * 30); x.stroke(); } x.globalAlpha = 1; });
    const orejaT = V.textura(K + '|oreja', 256, 256, (x, W, H) => { x.fillStyle = '#85796f'; x.fillRect(0, 0, W, H); arrugas(x, W, H, 200, '#4a423b', K + 'or', 0.4, 2, 0.5); const r = VE.rng('vena'); x.strokeStyle = 'rgba(150,90,100,0.35)'; x.lineWidth = 2;
      for (let i = 0; i < 28; i++) { x.beginPath(); const a = r() * W, b = r() * H; x.moveTo(a, 0); x.bezierCurveTo(a + 20, b * 0.4, a - 20, b * 0.7, a + (r() - 0.5) * 60, H); x.stroke(); }
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(40,30,30,0.45)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
    const trompaT = V.textura(K + '|trompa', 256, 512, (x, W, H) => { x.fillStyle = '#767068'; x.fillRect(0, 0, W, H); const r = VE.rng('trompa');
      for (let k = 0; k < 60; k++) { const y = (k + r() * 0.3) / 60 * H; x.strokeStyle = `rgba(35,30,27,${0.35 + r() * 0.3})`; x.lineWidth = 2 + r() * 2.5; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y + 4, W * 0.7, y - 4, W, y + r() * 3); x.stroke();
        x.strokeStyle = 'rgba(165,158,148,0.25)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, y + 4); x.lineTo(W, y + 4); x.stroke(); }
      pelo(x, W, H, 600, ['#3e3935', '#9b948c'], 14, 'trpel'); });
    const M = { cuerpo: mt(cuerpo), pata: mt(pata), cab: mt(cab), cola: mt(colaT), crin: mt(crinT, { envolver: 0.55 }), oreja: mt(orejaT, { envolver: 0.5 }), trompa: mt(trompaT) };

    const P = E.pata, T = E.tronco, G = E.gait, ph = (o.fase || 0) * TAU, m = o.marcha || 'quieto';
    const g = o.gait || marcha(m, ph, G);
    const yb = E.yb + g.bob, pitch = (o.pitch || 0) + g.pitch, cabR = (o.cab == null ? 0 : o.cab) + g.cab, colaR = (o.cola || 0) + g.cola;
    // pata de dos tramos: musculo del hombro/muslo, canilla y pie
    const pataN = (x, z, ang, del) => {
      const r1 = del ? P.r1d : P.r1t, L1 = P.L1, L2 = P.L2;
      const pie = V.nodo({ pos: [0, -L2, 0], rot: [0, 0, ang[2]], hijos: PIE[P.pie](E, M) });
      const lower = V.nodo({ pos: [0, -L1, 0], rot: [0, 0, ang[1]], hijos: [el(M.pata, [P.r2 * 1.05, P.r2 * 1.05, P.r2 * 1.05], [0, 0, 0]), V.nodo({ malla: MA.capsula(P.r2 * 0.98, P.r3, L2, 20), mat: M.pata }), pie] });
      return V.nodo({ pos: [x, -0.12, z], rot: [0, 0, ang[0]], hijos: [el(M.pata, del ? [r1 * 1.25, L1 * 0.36, r1 * 1.1] : [r1 * 1.3, L1 * 0.4, r1 * 1.1], [0, -L1 * 0.12, 0]), V.nodo({ malla: MA.capsula(r1, P.r2, L1, 22), mat: M.pata }), lower] });
    };
    const Cu = E.cuello, elev = Cu.elev + cabR * 0.6;
    const cabNodo = V.nodo({ pos: [0, -Cu.ln, 0], rot: [0, 0, -(PI / 2 + elev) + (E.cabeza === 'caballo' ? -0.95 : E.cabeza === 'galgo' ? -0.55 : E.cabeza === 'berrendo' ? -0.5 : E.cabeza === 'elefante' ? 0.0 : E.cabeza === 'hipopotamo' ? -0.05 : -0.2 + 0 * cabR) + cabR * 0.4], hijos: CAB[E.cabeza](E, o, M) });
    const cuello = V.nodo({ pos: [Cu.x, Cu.y, 0], rot: [0, 0, PI / 2 + elev], hijos: [
      V.nodo({ malla: MA.capsula(Cu.r1, Cu.r2, Cu.ln, 26), mat: E.cabeza === 'caballo' || E.cabeza === 'galgo' || E.cabeza === 'berrendo' ? M.pata : M.cuerpo }), cabNodo,
      ...(E.cabeza === 'caballo' ? [0.04, 0.16, 0.28, 0.4, 0.52, 0.64, 0.76].map((u, i) => el(M.crin, [0.08, 0.05, 0.015], [Cu.r1 * (1 - u * 0.4) + 0.03, -u * Cu.ln, 0.012 + 0.01 * i % 2], [0, 0, -0.5])) : []),
      ...(E.cabeza === 'facoquero' ? [0.02, 0.1, 0.2, 0.3, 0.4, 0.5].map((u) => el(liso('#2a2019'), [0.14, 0.05, 0.012], [Cu.r1 * 0.9, -u * Cu.ln * 1.2, 0], [0, 0, -0.9])) : [])] });
    // melena del facoquero a lo largo del lomo; crines del caballo hasta la cruz ya van en el cuello
    const lomo = nom === 'facoquero' ? [0.5, 0.35, 0.2, 0.05, -0.1, -0.25].map((u) => el(liso('#2a2019'), [0.11, 0.045, 0.01], [u, T.a * 0.98, 0], [0, 0, -0.9 + u * 0.5])) : [];
    const tronco = V.nodo({ pos: [0, yb, 0], rot: [0, 0, pitch], hijos: [
      V.nodo({ malla: cuerpoMalla(nom, E), mat: M.cuerpo }),
      eje(T.a * 0.8, T.b * 0.5, T.c * 0.9, [T.b * 0.78, T.a * 0.12, 0], M.cuerpo),               // base del cuello (se funde con el pecho)
      pataN(P.dx, P.z, g.fl, true), pataN(P.dx, -P.z, g.fr, true), pataN(P.tx, P.z, g.hl, false), pataN(P.tx, -P.z, g.hr, false),
      V.nodo({ pos: [-T.b * 1.2 * 0.95, T.a * 0.35, 0], hijos: [COLA[E.cola](E, M, colaR)] }), cuello, ...lomo] });
    const tubo = o.trompaTubo ? trompaNodo(o.trompaTubo, M, o.trompaId || 'ele') : null;
    return V.nodo({ nombre: 'cuad_' + nom, pos: o.pos, rot: o.rot, esc: o.esc, hijos: tubo ? [tronco, tubo] : [tronco] });
  };
  /* Marcha con apoyo real: cada pie queda quieto en el suelo durante el apoyo; la fase sale de la DISTANCIA recorrida (dist, m).
       MO.cuadrupedo.pasos(especie, { dist, zancada, duty, alza, bajar, cab }) -> objeto para la opcion `gait` de MO.cuadrupedo
       zancada: m por ciclo · duty: fraccion de apoyo (0,6-0,75) · alza: altura del pie al avanzar · bajar: cuanto baja el cuerpo (m, flexiona las patas)
       Con dist multiplo de zancada/4 las cuatro patas acaban en el suelo (para frenar sin dejar un pie en el aire). */
  MO.cuadrupedo.pasos = function (esp, o = {}) {
    const E = Q[esp], P = E.pata, S = o.zancada || 2.4, duty = o.duty || 0.65, alza = o.alza == null ? 0.2 : o.alza, dist = o.dist || 0, bajar = o.bajar || 0;
    const OFF = { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, A = duty * S / 2, suelo = o.suelo == null ? 0.17 : o.suelo;
    const bob = -bajar - 0.03 + (o.quieto ? 0.006 * Math.sin((o.t || 0) * 1.6) : 0.035 * Math.abs(Math.sin(Math.PI * dist / S * 2)) * (o.movil == null ? 1 : o.movil));
    const hipY = E.yb + bob - 0.12, g = { bob, pitch: 0, cab: o.cab || 0, cola: 0.12 * Math.sin(dist / S * TAU), pies: {} };
    for (const k of ['fl', 'fr', 'hl', 'hr']) {
      const front = k[0] === 'f', u = o.quieto ? duty * 0.5 : (((dist / S + OFF[k]) % 1) + 1) % 1, fbx = u < duty ? A - 2 * A * (u / duty) : -A + 2 * A * (0.5 - 0.5 * Math.cos(Math.PI * (u - duty) / (1 - duty)));
      const fy = suelo + (u >= duty ? alza * Math.sin(Math.PI * (u - duty) / (1 - duty)) : 0), hx = front ? P.dx : P.tx;
      const L1 = P.L1, L2 = P.L2, vx = fbx * 0.85, vy = fy - hipY, D = Math.min(Math.hypot(vx, vy), L1 + L2 - 0.01), psi = Math.atan2(vx, -vy);
      const al = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)))), s = front ? 1 : -1, t1 = psi + s * al;
      const kx = L1 * Math.sin(t1), ky = -L1 * Math.cos(t1), sx = vx - kx, sy = vy - ky, t2 = Math.atan2(sx, -sy);
      g[k] = [t1, t2 - t1, -t2 + (u >= duty ? 0.25 * Math.sin(Math.PI * (u - duty) / (1 - duty)) : 0)];
      g.pies[k] = [hx + vx, fy];
    }
    return g;
  };
  /* Origen de la trompa (modelo, y = altura sobre el suelo) para una pose: MO.cuadrupedo.trompaBase(especie, { gait, cab }) -> [x, y] */
  MO.cuadrupedo.cabezaPt = function (esp, o = {}, lx = 0, ly = 0) {
    const E = Q[esp], Cu = E.cuello, g = o.gait || { bob: 0, pitch: 0, cab: 0 }, cabR = (o.cab || 0) + (g.cab || 0), elev = Cu.elev + cabR * 0.6, ph = cabR * 0.4;
    const hx = Cu.x + Cu.ln * Math.cos(elev), hy = Cu.y + Cu.ln * Math.sin(elev);
    return [hx + lx * Math.cos(ph) - ly * Math.sin(ph), hy + lx * Math.sin(ph) + ly * Math.cos(ph) + E.yb + (g.bob || 0)];
  };
  MO.cuadrupedo.trompaBase = (esp, o = {}) => MO.cuadrupedo.cabezaPt(esp, o, 0.95, -0.12);
  MO.cuadrupedo.cabeza = function (esp, o = {}) { const E = Q[esp] || Q.caballo, p = o.pos || [0, 0, 0], e = o.esc == null ? 1 : o.esc, ry = (o.rot && o.rot[1]) || 0, dx = (E.cuello.x + E.cuello.ln * 0.6) * e;
    return [p[0] + Math.cos(ry) * dx, p[1] + (E.yb + E.cuello.y + E.cuello.ln * 0.7) * e, p[2] - Math.sin(ry) * dx]; };
})(window.VE);
