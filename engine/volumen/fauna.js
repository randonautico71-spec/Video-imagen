/* VOLUMEN — FAUNA DEL SUEÑO (unidades: metros; el animal mira a +X y se apoya en y = 0). Modelos con aspecto real: pelaje a trazos, rasgos propios de cada especie.
     V.modelos.perro({ t, sacudida, pos, rot, esc })          perro dorado dormido boca abajo, cabeza sobre las patas; respira y sacude las patas (sacudida 0..1)
     V.modelos.rata({ t, pos, rot, esc })                     rata parda dormida (orejas redondas rosadas, cola con anillos, bigotes, incisivos, manos rosadas)
     V.modelos.pinzon({ t, dormido, canta, pos, rot, esc })   pinzon cebra macho en una rama; dormido 0..1 = cabeza escondida entre las plumas; canta 0..1 abre el pico
     V.modelos.pulpo({ t, tinte, textura, pos, rot, esc })    pulpo comun en el fondo: 8 brazos con ventosas que se mueven; tinte: color de la piel (cambia con el sueno activo)
     V.modelos.cerebro({ t, actividad, color, pos, rot, esc }) cerebro humano (2 hemisferios con surcos, cerebelo, tronco); dentro: 'hipocampo', 'amigdala' (visibles en rayos X)
     V.modelos.cama({ pos })                                  cama con colchon, almohada, manta y cabecero (cabeza hacia -X; superficie del colchon a y = 0,46)
     V.modelos.laberinto({ n, celda, semilla })               laberinto de paredes bajas; V.modelos.laberinto.camino(n, celda, semilla) -> [[x,z]...] solucion
   Nodos con nombre para V.posicion: perro 'cabeza_perro', pinzon 'cabeza_pinzon', pulpo 'ojo_pulpo', cerebro 'hipocampo' | 'amigdala' | 'corteza', rata 'cabeza_rata'.
   Revisar siempre en fotogramas (qa --stills). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v)), sn = Math.sin, cs = Math.cos;
  const hex = (c) => VE.color.aRGB(c);
  const mezclaHex = (a, b, k) => { const p = hex(a), q = hex(b); return `rgb(${Math.round(p[0] + (q[0] - p[0]) * k)},${Math.round(p[1] + (q[1] - p[1]) * k)},${Math.round(p[2] + (q[2] - p[2]) * k)})`; };
  const elip = (mat, e, pos, rot, nombre) => V.nodo({ malla: MA.esfera(24), esc: e, pos: pos || [0, 0, 0], rot, mat, nombre });
  /* elipsoide alargado en X (a = alto, b = largo, c = ancho); la textura va de la cola (v = 0) a la cabeza (v = 1); dorso en u = 0,25 */
  const eje = (a, b, c, pos, mat, nombre) => V.nodo({ malla: MA.esfera(36), esc: [a, b, c], pos: pos || [0, 0, 0], rot: [0, 0, PI / 2], mat, nombre });
  const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
  const mateP = (mapa, e) => Object.assign({ color: '#ffffff', mapa, esp: 0.04, dureza: 10, envolver: 0.45, borde: 0.25 }, e || {});

  /* pelaje pintado una vez: lado (u = 0 y 0,5), dorso (u = 0,25), vientre (u = 0,75); trazos de pelo a lo largo de v */
  function pelaje(clave, W, H, o) {
    return V.textura(clave, W, H, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, o.lado); g.addColorStop(0.1, o.lado); g.addColorStop(0.2, o.dorso); g.addColorStop(0.3, o.dorso); g.addColorStop(0.4, o.lado); g.addColorStop(0.5, o.lado);
      g.addColorStop(0.6, o.vientre); g.addColorStop(0.9, o.vientre); g.addColorStop(1, o.lado);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng(clave); x.lineCap = 'round';
      for (let i = 0; i < o.n; i++) {
        const x0 = r() * W, y0 = r() * H, l = o.largo * (0.5 + r()), c = o.cols[Math.floor(r() * o.cols.length)];
        x.globalAlpha = 0.07 + r() * 0.17; x.strokeStyle = c; x.lineWidth = 0.6 + r() * 1.1; x.beginPath(); x.moveTo(x0, y0);
        x.lineTo(x0 + (r() - 0.5) * 3, y0 + l); x.stroke();
      }
      x.globalAlpha = 1; if (o.extra) o.extra(x, W, H, r);
    });
  }

  // ======================================================================== PERRO (dorado, dormido boca abajo)
  MO.perro = function (o = {}) {
    const t = o.t || 0, resp = sn(t * 2.3), sac = c01(o.sacudida || 0), pat = sac * sn(t * 15), pat2 = sac * sn(t * 11 + 1);
    const d = { lado: '#c4934f', dorso: '#a06f36', vientre: '#e8cd96', cols: ['#7d5226', '#c4934f', '#ecd39f', '#a87b3f'], n: 26000, largo: 12 };
    const tCuerpo = pelaje('perro|cuerpo', 1024, 512, d), tPata = pelaje('perro|pata', 256, 256, Object.assign({}, d, { n: 5000, largo: 9 })), tCab = pelaje('perro|cabeza', 512, 256, Object.assign({}, d, { n: 9000, largo: 8, dorso: '#b78443' }));
    const tOreja = pelaje('perro|oreja', 256, 256, Object.assign({}, d, { lado: '#a8782f', dorso: '#8e6224', vientre: '#a8782f', cols: ['#6e4818', '#a8782f', '#c4934f'], n: 5000, largo: 12 }));
    const mC = mateP(tCuerpo), mP = mateP(tPata), mH = mateP(tCab), mO = mateP(tOreja);
    const negro = liso('#161111', { esp: 0.9, dureza: 90 }), h = [];
    // cuerpo tumbado (respira)
    h.push(eje(0.205 * (1 + 0.025 * resp), 0.42, 0.2, [0, 0.2, 0], mC, 'torso_perro'));
    h.push(eje(0.215 * (1 + 0.03 * resp), 0.2, 0.2, [0.24, 0.2, 0], mC));
    for (const s of [-1, 1]) {
      h.push(elip(mC, [0.2, 0.17, 0.13], [-0.25, 0.17, s * 0.17]));                                                    // anca
      h.push(elip(mP, [0.17, 0.065, 0.07], [-0.07, 0.065, s * 0.21 + s * pat2 * 0.0], [0, s * 0.15, 0]));                  // muslo doblado
      h.push(elip(mP, [0.085, 0.045, 0.06], [0.08 + 0.02 * pat2, 0.045, s * 0.21]));                                       // pata trasera
      // brazos estirados hacia delante: cabeza apoyada encima
      h.push(elip(mP, [0.22, 0.07, 0.075], [0.5 + 0.03 * pat * (s > 0 ? 1 : 0.3), 0.07 + 0.012 * Math.abs(pat) * (s > 0 ? 1 : 0), s * 0.125]));
      h.push(elip(mP, [0.085, 0.048, 0.065], [0.7 + 0.04 * pat * (s > 0 ? 1 : 0.3), 0.05 + 0.014 * Math.abs(pat) * (s > 0 ? 1 : 0), s * 0.125]));
      for (let i = -1; i <= 1; i++) h.push(elip(liso('#6d4a24', { esp: 0.1 }), [0.004, 0.003, 0.008], [0.776 + 0.04 * pat * (s > 0 ? 1 : 0.3), 0.07, s * 0.125 + i * 0.022]));   // hendiduras entre dedos
    }
    // cabeza apoyada sobre las patas
    const cab = [];
    cab.push(elip(mH, [0.145, 0.12, 0.115], [0, 0, 0]));                                                               // craneo
    cab.push(elip(mH, [0.15, 0.062, 0.075], [0.15, -0.035, 0]));                                                       // hocico
    cab.push(elip(mateP(pelaje('perro|boca', 256, 128, Object.assign({}, d, { lado: '#e1c38a', dorso: '#d8b676', vientre: '#efe0bb', n: 3000, largo: 6 }))), [0.14, 0.03, 0.082], [0.15, -0.085, 0]));   // labio inferior claro
    cab.push(elip(negro, [0.04, 0.032, 0.05], [0.285, -0.012, 0]));                                                    // nariz
    cab.push(elip(liso('#ffffff', { esp: 1, dureza: 120, emision: 0.0, alfa: 0.35 }), [0.012, 0.008, 0.016], [0.3, 0.005, 0.015]));
    cab.push(elip(liso('#3b1c1c', { esp: 0.2 }), [0.12, 0.006, 0.07], [0.15, -0.055, 0]));                              // linea de la boca
    for (const s of [-1, 1]) {
      cab.push(elip(liso('#4a3118', { esp: 0.2 }), [0.034, 0.007, 0.018], [0.075, 0.032, s * 0.098], [0, s * -0.25, s * -0.1]));      // parpado cerrado
      cab.push(elip(liso('#2a1b0e', { esp: 0.2 }), [0.028, 0.005, 0.012], [0.075, 0.028, s * 0.1], [0, s * -0.25, s * -0.1]));
      cab.push(elip(mH, [0.04, 0.012, 0.028], [0.085, 0.062, s * 0.092], [0, s * -0.2, s * 0.12]));                         // ceja
      cab.push(V.nodo({ pos: [-0.015, 0.0, s * 0.125], rot: [s * 0.55 + sn(t * 2.3 + 1) * 0.015, s * 0.1, -0.5], hijos: [elip(mO, [0.055, 0.115, 0.022], [0, -0.08, 0])] }));   // oreja caida
      for (let i = 0; i < 4; i++) cab.push(V.nodo({ malla: MA.cilindro(0.0016, 0.0007, 0.09, 5), pos: [0.22, -0.03 - i * 0.008, s * (0.06 + i * 0.005)], rot: [s * (1.2 + i * 0.1), 0, PI / 2 - 0.1 - i * 0.1], mat: liso('#f1e6cf', { esp: 0.5 }) }));   // bigotes
    }
    h.push(V.nodo({ nombre: 'cabeza_perro', pos: [0.6, 0.15 + 0.004 * resp, 0], rot: [0, 0, -0.06], hijos: cab }));
    // cola en gancho
    const cola = [[-0.4, 0.1, 0.1], [-0.52, 0.09, 0.22], [-0.46, 0.08, 0.34], [-0.36, 0.08, 0.38]];
    h.push(V.nodo({ malla: MA.tubo(cola, (u) => 0.045 - 0.022 * u, 12, { clave: 'perro|cola' }), mat: mC }));
    h.push(elip(mP, [0.05, 0.05, 0.06], [-0.34, 0.08, 0.38]));
    return V.nodo({ nombre: 'perro', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  // ======================================================================== RATA parda dormida
  MO.rata = function (o = {}) {
    const t = o.t || 0, resp = sn(t * 4.2);
    const d = { lado: '#8a7560', dorso: '#6b5645', vientre: '#cdbfae', cols: ['#4d3b2e', '#8a7560', '#b59f86', '#3a2c22', '#a89279'], n: 22000, largo: 8 };
    const tC = pelaje('rata|cuerpo', 1024, 512, d), tH = pelaje('rata|cabeza', 512, 256, Object.assign({}, d, { n: 7000, largo: 5 }));
    const mC = mateP(tC), mH = mateP(tH), rosa = liso('#e3a6a0', { esp: 0.3, dureza: 30, envolver: 0.4 }), rosaOsc = liso('#c98780', { esp: 0.25 }), negro = liso('#0e0b0b', { esp: 0.95, dureza: 100 });
    const tCola = V.textura('rata|cola', 128, 512, (x, W, H, c) => {                       // anillos de escamas
      c.repetirV = true; x.fillStyle = '#d6a29b'; x.fillRect(0, 0, W, H); const r = VE.rng('colarata');
      for (let i = 0; i < 64; i++) { x.globalAlpha = 0.5; x.fillStyle = '#9f6c66'; x.fillRect(0, i * H / 64, W, 2.4); x.globalAlpha = 0.18; x.fillStyle = '#ffffff'; x.fillRect(0, i * H / 64 + 3, W, 2); }
      for (let i = 0; i < 700; i++) { x.globalAlpha = 0.08 + r() * 0.1; x.fillStyle = '#6b4a45'; x.fillRect(r() * W, r() * H, 2, 2); } x.globalAlpha = 1; });
    const h = [], rr = 1 + 0.03 * resp;
    h.push(eje(0.05 * rr, 0.115, 0.05, [0, 0.05, 0], mC, 'torso_rata'));
    h.push(elip(mC, [0.055 * rr, 0.052, 0.06], [-0.085, 0.05, 0]));                                                  // grupa
    h.push(eje(0.05, 0.06, 0.05, [0.075, 0.05, 0], mC));
    const cab = [];
    cab.push(elip(mH, [0.042, 0.04, 0.036], [0, 0, 0]));                                                              // craneo
    cab.push(V.nodo({ malla: MA.esfera(24), esc: [0.044, 0.02, 0.019], pos: [0.047, -0.012, 0], rot: [0, 0, -0.18], mat: mateP(pelaje('rata|hocico', 256, 128, Object.assign({}, d, { lado: '#bba58c', dorso: '#a38c73', vientre: '#d8c9b4', n: 2500, largo: 4 }))) }));   // hocico afilado
    cab.push(elip(rosa, [0.009, 0.008, 0.012], [0.09, -0.017, 0]));                                                    // nariz
    cab.push(elip(rosaOsc, [0.003, 0.003, 0.004], [0.097, -0.017, 0.006])); cab.push(elip(rosaOsc, [0.003, 0.003, 0.004], [0.097, -0.017, -0.006]));   // fosas
    for (const s of [-1, 1]) {
      cab.push(V.nodo({ malla: MA.caja(0.003, 0.009, 0.004, 0.0012, 2), pos: [0.086, -0.036, s * 0.004], mat: liso('#f1ead6', { esp: 0.6 }) }));   // incisivos
      cab.push(elip(liso('#33231f', { esp: 0.3 }), [0.011, 0.0025, 0.005], [0.03, 0.007, s * 0.032], [0, s * -0.35, 0]));               // ojo cerrado
      cab.push(V.nodo({ pos: [-0.012, 0.034, s * 0.03], rot: [s * 0.45, s * 0.3, 0], hijos: [elip(liso('#d8938c', { esp: 0.2, envolver: 0.5 }), [0.025, 0.028, 0.0045]), elip(liso('#eeb2ab', { esp: 0.15, envolver: 0.5 }), [0.019, 0.022, 0.004], [0.002, 0, s * -0.003])] }));   // oreja redonda y fina
      for (let i = 0; i < 5; i++) cab.push(V.nodo({ malla: MA.cilindro(0.0007, 0.0003, 0.085, 4), pos: [0.074, -0.014 - i * 0.004, s * (0.012 + i * 0.002)], rot: [s * (1.05 + i * 0.13), 0, PI / 2 - 0.35 + i * 0.16], mat: liso('#e9e2d2', { esp: 0.5 }) }));   // bigotes
    }
    h.push(V.nodo({ nombre: 'cabeza_rata', pos: [0.135, 0.044, 0], rot: [0, 0, -0.22], hijos: cab }));
    for (const s of [-1, 1]) {
      h.push(elip(rosa, [0.026, 0.01, 0.014], [-0.045, 0.01, s * 0.05]));                                              // patas traseras
      h.push(elip(rosa, [0.014, 0.009, 0.012], [0.125, 0.011, s * 0.03]));                                             // manos
      for (let i = -1; i <= 1; i++) h.push(V.nodo({ malla: MA.capsula(0.0028, 0.0022, 0.016, 8), pos: [0.138, 0.009, s * 0.03 + i * 0.006], rot: [0, 0, -PI / 2], mat: rosa }));
    }
    const cola = []; for (let i = 0; i <= 16; i++) { const a = -0.3 + i / 16 * 3.6; cola.push([-0.115 - 0.01 * i / 16 + 0.14 * (cs(a) - 1) * 0, 0.009 + 0.004 * sn(i), 0.07 + 0.11 * sn(a) - 0.0]); }
    for (let i = 0; i <= 16; i++) { const a = i / 16 * 3.8; cola[i] = [-0.1 - 0.12 * sn(a * 0.8), 0.009, 0.06 + 0.13 * (1 - cs(a * 0.8)) * 0.9]; }
    h.push(V.nodo({ malla: MA.tubo(cola, (u) => 0.0085 - 0.0055 * u, 10, { clave: 'rata|cola' }), mat: { color: '#ffffff', mapa: tCola, repetir: [1, 14], esp: 0.15, dureza: 20, envolver: 0.4, borde: 0.2 } }));
    return V.nodo({ nombre: 'rata', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  // ======================================================================== PINZON CEBRA en una rama
  MO.pinzon = function (o = {}) {
    const t = o.t || 0, sl = c01(o.dormido == null ? 1 : o.dormido), can = c01(o.canta || 0), resp = sn(t * 3.1);
    const tCu = V.textura('pinzon|cuerpo', 512, 512, (x, W, H) => {                                 // u: dorso 0,25 · vientre 0,75 ; v: cola 0 -> pecho 1
      const g = x.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#9b6a3e'); g.addColorStop(0.1, '#a2663a'); g.addColorStop(0.22, '#8f8d89'); g.addColorStop(0.3, '#8f8d89'); g.addColorStop(0.42, '#a2663a'); g.addColorStop(0.5, '#9b6a3e');
      g.addColorStop(0.62, '#eeeae2'); g.addColorStop(0.9, '#eeeae2'); g.addColorStop(1, '#9b6a3e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('pinzon'); x.lineCap = 'round';
      for (let i = 0; i < 9000; i++) { const x0 = r() * W, y0 = r() * H; x.globalAlpha = 0.08 + r() * 0.15; x.strokeStyle = ['#6e6b66', '#b9b5ad', '#8a5c34', '#f3efe6'][Math.floor(r() * 4)]; x.lineWidth = 0.8 + r(); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 2, y0 + 7 + r() * 7); x.stroke(); }
      for (let i = 0; i < 220; i++) { const u = (r() < 0.5 ? 0.34 + r() * 0.1 : 0.04 + r() * 0.1) * W, v = (0.35 + r() * 0.4) * H; x.globalAlpha = 0.95; x.fillStyle = '#fbf8f0'; x.beginPath(); x.arc(u, v, 2.2 + r() * 1.6, 0, 7); x.fill(); }   // flancos con motas blancas
      x.globalAlpha = 1; const y0 = H * 0.7, y1 = H * 0.94;                                          // pecho: barras finas negras y blancas (el «zebra»)
      for (let k = 0; k < 14; k++) { const y = y0 + (y1 - y0) * k / 13; x.fillStyle = '#151210'; x.globalAlpha = 0.85; x.fillRect(W * 0.47, y, W * 0.53, (y1 - y0) / 28); x.fillRect(0, y, W * 0.07, (y1 - y0) / 28); }
      x.globalAlpha = 1; x.fillStyle = '#151210'; x.fillRect(W * 0.56, H * 0.62, W * 0.34, H * 0.05);   // banda negra del pecho
    });
    const tCa = V.textura('pinzon|cabeza', 256, 256, (x, W, H) => { x.fillStyle = '#9a9894'; x.fillRect(0, 0, W, H); const r = VE.rng('pinzonc');
      for (let i = 0; i < 3500; i++) { x.globalAlpha = 0.12 + r() * 0.15; x.strokeStyle = ['#7a7773', '#b9b5ad', '#8d8a86'][Math.floor(r() * 3)]; x.lineWidth = 1; x.beginPath(); const x0 = r() * W, y0 = r() * H; x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 2, y0 + 5 + r() * 5); x.stroke(); } x.globalAlpha = 1; });
    const mCu = mateP(tCu, { esp: 0.08, borde: 0.4 }), mCa = mateP(tCa, { esp: 0.08, borde: 0.4 });
    const naranja = liso('#e0561a', { esp: 0.7, dureza: 60, envolver: 0.3 }), cheek = liso('#d9731f', { esp: 0.05, envolver: 0.5 }), h = [];
    // rama
    const rama = V.textura('rama', 256, 256, (x, W, H, c) => { c.repetirV = true; x.fillStyle = '#5d4630'; x.fillRect(0, 0, W, H); const r = VE.rng('rama'); for (let i = 0; i < 1600; i++) { x.globalAlpha = 0.25; x.fillStyle = r() < 0.5 ? '#3a2a1a' : '#7d6244'; x.fillRect(r() * W, r() * H, 1 + r() * 2, 8 + r() * 30); } x.globalAlpha = 1; });
    h.push(V.nodo({ malla: MA.cilindro(0.0095, 0.0105, 0.5, 14, true), mat: { color: '#ffffff', mapa: rama, repetir: [1, 3], esp: 0.05, dureza: 10, envolver: 0.3 }, pos: [0, 0.0, 0], rot: [PI / 2, 0, 0], nombre: 'rama' }));
    const cuerpo = [], rb = 1 + 0.045 * resp;
    cuerpo.push(eje(0.034 * rb, 0.052, 0.032 * rb, [0, 0, 0], mCu, 'torso_pinzon'));
    cuerpo.push(V.nodo({ malla: MA.esfera(20), esc: [0.04, 0.012, 0.027], pos: [-0.002, 0.003, 0.03], rot: [-0.18, 0, 0.12], mat: mateP(V.textura('pinzon|ala', 128, 128, (x, W, H) => { x.fillStyle = '#6f6a63'; x.fillRect(0, 0, W, H); const r = VE.rng('ala'); for (let i = 0; i < 2000; i++) { x.globalAlpha = 0.2; x.strokeStyle = ['#4a4640', '#9a948a'][i % 2]; x.beginPath(); const x0 = r() * W, y0 = r() * H; x.moveTo(x0, y0); x.lineTo(x0 + 8, y0 + 1); x.stroke(); } x.globalAlpha = 1; for (let i = 0; i < 40; i++) { x.fillStyle = '#e9e3d5'; x.fillRect(r() * W, r() * H, 3, 3); } })) }));
    cuerpo.push(V.nodo({ malla: MA.esfera(20), esc: [0.04, 0.012, 0.027], pos: [-0.002, 0.003, -0.03], rot: [0.18, 0, 0.12], mat: mateP(tCa) }));
    // cola con barras blancas y negras
    const tCol = V.textura('pinzon|cola', 128, 128, (x, W, H) => { x.fillStyle = '#25221f'; x.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { x.fillStyle = '#f2eee4'; x.fillRect(0, i * 22 + 8, W, 8); } });
    cuerpo.push(V.nodo({ malla: MA.caja(0.085, 0.004, 0.034, 0.002, 2), pos: [-0.092, -0.01, 0], rot: [0, 0, 0.12], mat: mateP(tCol, { esp: 0.05 }) }));
    // cabeza (se gira hacia atras al dormir: el pico queda entre las plumas del hombro)
    const cab = [];
    cab.push(elip(mCa, [0.027, 0.026, 0.026], [0, 0, 0]));
    for (const s of [-1, 1]) {
      cab.push(elip(cheek, [0.011, 0.011, 0.004], [0.004, -0.007, s * 0.0235]));                                       // mancha naranja de la mejilla
      cab.push(elip(liso('#141010'), [0.006, 0.013, 0.0035], [0.01, -0.017, s * 0.022]));                              // lagrima negra
      if (sl > 0.5) cab.push(elip(liso('#2a2420'), [0.0085, 0.0018, 0.003], [0.013, 0.007, s * 0.0235]));              // ojo cerrado
      else cab.push(elip(liso('#0b0909', { esp: 0.95, dureza: 100 }), [0.0045, 0.0045, 0.0035], [0.013, 0.007, s * 0.0235]));
    }
    const pico = c01(can) * 0.5;
    cab.push(V.nodo({ pos: [0.024, -0.004, 0], rot: [0, 0, PI / 2 - pico * 0.5], hijos: [V.nodo({ malla: MA.cilindro(0.0085, 0.0016, 0.021, 12, true), mat: naranja, pos: [0, -0.0105, 0] })] }));
    cab.push(V.nodo({ pos: [0.024, -0.007, 0], rot: [0, 0, PI / 2 + pico * 0.7], hijos: [V.nodo({ malla: MA.cilindro(0.0062, 0.0014, 0.017, 12, true), mat: naranja, pos: [0, -0.0085, 0] })] }));
    const gx = mix(0.036, 0.012, sl), gy = mix(0.034, 0.047, sl), gz = sl * 0.012;
    cuerpo.push(V.nodo({ nombre: 'cabeza_pinzon', pos: [gx, gy, gz], rot: [0, PI * sl, -0.1 * sl], hijos: cab }));
    // patas naranjas con dedos agarrados a la rama
    for (const s of [-1, 1]) {
      h.push(V.nodo({ malla: MA.cilindro(0.0022, 0.0022, 0.035, 6), mat: naranja, pos: [0.004, 0.02, s * 0.011] }));
      for (const dx of [-0.011, 0.0, 0.011]) h.push(V.nodo({ malla: MA.capsula(0.0022, 0.0018, 0.018, 6), mat: naranja, pos: [0.004 + dx, 0.011, s * 0.011], rot: [0, 0, 0.0] }));
    }
    h.push(V.nodo({ pos: [0, 0.058, 0], rot: [0, 0, 0.35 - 0.1 * sl], hijos: cuerpo }));
    return V.nodo({ nombre: 'pinzon', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
    function mix(a, b, k) { return a + (b - a) * k; }
  };

  // ======================================================================== PULPO comun en el fondo
  MO.pulpo = function (o = {}) {
    const t = o.t || 0, tinte = o.tinte || '#e6d8c6', moteado = c01(o.moteado == null ? 0 : o.moteado), resp = sn(t * 1.6);
    const pieles = [0, 1].map(k => V.textura('pulpo|piel|' + k, 512, 512, (x, W, H) => {
      const r = VE.rng('pulpo' + k); x.fillStyle = k ? '#b3a79a' : '#d9d0c4'; x.fillRect(0, 0, W, H);
      const n = k ? 5200 : 1800;
      for (let i = 0; i < n; i++) { const cx = r() * W, cy = r() * H, rr = (k ? 3 : 2) + r() * (k ? 7 : 4); x.globalAlpha = (k ? 0.3 : 0.14) + r() * 0.3; x.fillStyle = ['#5d4636', '#8a6b52', '#2f2219', '#c9b69f'][Math.floor(r() * 4)]; x.beginPath(); x.ellipse(cx, cy, rr, rr * (0.6 + r() * 0.5), r() * 3, 0, 7); x.fill(); }
      for (let i = 0; i < 260; i++) { x.globalAlpha = 0.5; x.fillStyle = '#efe7da'; x.beginPath(); x.arc(r() * W, r() * H, 2 + r() * 3, 0, 7); x.fill(); }
      x.globalAlpha = 1;
    }));
    const mPiel = mateP(pieles[moteado > 0.5 ? 1 : 0], { color: tinte, esp: 0.35, dureza: 24, envolver: 0.5, borde: 0.55 });
    const ven = V.textura('pulpo|ventosas', 128, 512, (x, W, H, c) => {                            // brazo: u = vuelta (la panza en 0,25), v = largo; dos hileras de ventosas en la panza
      c.repetirV = true; x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++) for (const q of [0.2, 0.3]) { const cx = q * W, cy = (i + (q > 0.25 ? 0.5 : 0)) * H / 16; x.fillStyle = '#e8c7bf'; x.beginPath(); x.ellipse(cx, cy, W * 0.055, H / 36, 0, 0, 7); x.fill(); x.strokeStyle = '#8c5d55'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#b98a82'; x.beginPath(); x.ellipse(cx, cy, W * 0.026, H / 80, 0, 0, 7); x.fill(); }
    });
    const mBrazoPiel = mateP(pieles[0], { color: tinte, esp: 0.3, dureza: 24, envolver: 0.5, borde: 0.5 });
    const h = [];
    // manto y cabeza
    h.push(V.nodo({ malla: MA.esfera(40), esc: [0.095 * (1 + 0.03 * resp), 0.085 * (1 + 0.03 * resp), 0.08], pos: [-0.07, 0.115, 0], rot: [0, 0, 0.55], mat: mPiel, nombre: 'manto_pulpo' }));
    h.push(elip(mPiel, [0.065, 0.058, 0.07], [0.02, 0.075, 0]));
    // ojos saltones con pupila horizontal (cerrada a ratos)
    const abre = o.ojosAbiertos == null ? 0.25 : o.ojosAbiertos;
    for (const s of [-1, 1]) {
      const ojo = [elip(mPiel, [0.026, 0.026, 0.02], [0, 0, 0]), elip(liso('#c8a24a', { esp: 0.9, dureza: 90 }), [0.0215, 0.0215, 0.012], [0.006, 0.004, s * 0.011]),
        elip(liso('#070606', { esp: 1, dureza: 120 }), [0.016 * (0.4 + 0.6 * abre), 0.0035, 0.0045], [0.015, 0.006, s * 0.018])];
      h.push(V.nodo({ nombre: s > 0 ? 'ojo_pulpo' : 'ojo_pulpo_i', pos: [0.035, 0.095, s * 0.066], rot: [0, s * 0.5, 0], hijos: ojo }));
    }
    h.push(V.nodo({ malla: MA.capsula(0.012, 0.009, 0.045, 12), mat: mPiel, pos: [0.05, 0.05, 0.034], rot: [0, 0, 1.2] }));              // sifon
    // 8 brazos: curvas que se mueven despacio (tubos dinamicos)
    const brazos = 8, L = 0.28;
    for (let i = 0; i < brazos; i++) {
      const a0 = (i + 0.5) / brazos * TAU + 0.2, pts = [], n = 28, ph = i * 1.7, curl = (i % 2 ? 1 : -1) * (1.3 + 0.2 * sn(i * 2.3));
      for (let k = 0; k <= n; k++) {
        const u = k / n, rad = 0.035 + L * u, ang = a0 + curl * u * u * 0.9 + 0.35 * sn(t * 0.9 + ph + u * 3.2) * u, lev = 0.012 + 0.02 * sn(t * 0.7 + ph) * u * (1 - u) + (u > 0.8 ? (u - 0.8) * 0.12 : 0) + 0.02 * (1 - u);
        pts.push([0.0 + rad * cs(ang) * 1.0 + 0.02, lev + 0.012, rad * sn(ang)]);
      }
      h.push(V.nodo({ malla: MA.tubo(pts, (u) => 0.021 * Math.pow(1 - u, 0.8) + 0.0018, 14, { dinamica: 'pulpo|brazo' + i }), mat: Object.assign({}, mBrazoPiel, { mapa: V.textura('pulpo|brazo|' + (moteado > 0.5 ? 1 : 0), 256, 512, (x, W, H, c) => { c.repetirV = true; x.drawImage(pieles[moteado > 0.5 ? 1 : 0], 0, 0, W, H); x.globalCompositeOperation = 'multiply'; x.drawImage(ven, 0, 0, W, H); x.globalCompositeOperation = 'source-over'; }), repetir: [1, 2] }) }));
    }
    return V.nodo({ nombre: 'pulpo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  // ======================================================================== CEREBRO humano
  MO.cerebro = function (o = {}) {
    const act = o.actividad == null ? 0.4 : o.actividad, col = o.color || '#6ee7f9', t = o.t || 0;
    const tex = V.textura('cerebro|piel', 512, 512, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dca7a1'); g.addColorStop(1, '#c78d88'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('cerebrotex'); for (let i = 0; i < 1400; i++) { x.globalAlpha = 0.05 + r() * 0.08; x.fillStyle = ['#b57470', '#e7bdb7', '#a96563'][Math.floor(r() * 3)]; x.beginPath(); x.ellipse(r() * W, r() * H, 6 + r() * 22, 3 + r() * 14, r() * 3, 0, 7); x.fill(); }
      x.strokeStyle = '#9d3f45'; x.lineCap = 'round'; for (let i = 0; i < 90; i++) { x.globalAlpha = 0.28; x.lineWidth = 0.8 + r() * 1.1; x.beginPath(); let px = r() * W, py = r() * H; x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } x.globalAlpha = 1;
    });
    const mat = { color: '#ffffff', mapa: tex, esp: 0.34, dureza: 34, envolver: 0.4, borde: 0.35 };
    const surco = (d) => {                                                                          // surcos estrechos entre circunvoluciones anchas
      const a = Math.sin(d[0] * 11 + 2.2 * Math.sin(d[1] * 7 + d[2] * 5) + d[1] * 3), b = Math.sin(d[1] * 10 - d[2] * 8 + 1.9 * Math.sin(d[0] * 6 + d[2] * 4.5)), c = Math.sin(d[2] * 12 + d[0] * 5 + 2 * Math.sin(d[1] * 8 + d[0] * 3));
      const g = (q) => Math.pow(1 - Math.abs(q), 6); return Math.max(g(a), g(b) * 0.9, g(c) * 0.8); };
    const hemi = (s) => MA.parametrica(110, 72, (u, v) => {
      const ph = u * TAU, th = v * PI; let dx = Math.sin(th) * Math.sin(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.cos(ph);
      const f = surco([dx, dy, dz * s]), rr = 1 - 0.075 * f + 0.012 * Math.sin(dx * 5 + dz * 4), q = s * dz, qz = (q > 0 ? q : q * 0.1);
      const bajo = dy < 0 ? 1 + 0.18 * dy : 1;                                                       // base algo mas plana
      return [dx * 0.56 * rr, dy * 0.4 * rr * bajo, s * (0.18 + qz * 0.27 * rr)];
    }, { clave: 'cerebro|hemi' + s });
    const cereb = MA.parametrica(80, 56, (u, v) => { const ph = u * TAU, th = v * PI, dx = Math.sin(th) * Math.sin(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.cos(ph), r = 1 - 0.045 * (0.5 + 0.5 * Math.sin(dy * 62)); return [-0.44 + dx * 0.19 * r, -0.27 + dy * 0.125 * r, dz * 0.27 * r]; }, { clave: 'cerebro|cereb' });
    const hijos = [], brillo = { tipo: 'rayosx', color: col, alfa: act, fresnel: 2.2, borde: 1.3, emision: 0.1 };
    for (const s of [-1, 1]) { hijos.push(V.nodo({ malla: hemi(s), mat, nombre: 'hemisferio' + (s > 0 ? '_d' : '_i') })); hijos.push(V.nodo({ malla: hemi(s), mat: brillo, esc: 1.012, sinSombra: true })); }
    hijos.push(V.nodo({ malla: cereb, mat: Object.assign({}, mat, { color: '#e3b5ae' }), nombre: 'cerebelo' }));
    hijos.push(V.nodo({ malla: MA.capsula(0.062, 0.045, 0.3, 20), mat: Object.assign({}, mat, { color: '#e8c3bb' }), pos: [-0.17, -0.2, 0], rot: [0, 0, 0.42], nombre: 'tronco' }));
    for (const s of [-1, 1]) {                                                                       // temporal: bulto bajo y delante
      hijos.push(V.nodo({ malla: MA.esfera(28), esc: [0.22, 0.12, 0.13], pos: [0.12, -0.22, s * 0.3], rot: [0, 0, 0.1], mat }));
      hijos.push(V.nodo({ nombre: s > 0 ? 'hipocampo' : 'hipocampo_i', malla: MA.tubo([[0.17, -0.2, s * 0.22], [0.08, -0.17, s * 0.27], [-0.05, -0.15, s * 0.28], [-0.2, -0.17, s * 0.24], [-0.3, -0.2, s * 0.2]], (u) => 0.036 - 0.014 * u, 12, { clave: 'cerebro|hipo' + s }),
        mat: { tipo: 'rayosx', color: '#ffd36b', alfa: 1, fresnel: 1.6, borde: 1.6, emision: 0.5 } }));
      hijos.push(V.nodo({ nombre: s > 0 ? 'amigdala' : 'amigdala_i', malla: MA.esfera(20), esc: [0.055, 0.045, 0.045], pos: [0.2, -0.2, s * 0.22], mat: { tipo: 'rayosx', color: '#ff7a8f', alfa: 1, fresnel: 1.4, borde: 1.6, emision: 0.55 } }));
    }
    hijos.push(V.nodo({ nombre: 'corteza', pos: [0.5, 0.12, 0.2] }));
    return V.nodo({ nombre: 'cerebro', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  // ======================================================================== CAMA
  MO.cama = function (o = {}) {
    const mad = liso('#6b4a2f', { esp: 0.3, dureza: 30 }), colch = liso('#cfd7e6', { esp: 0.05, envolver: 0.5 }), manta = V.textura('cama|manta', 512, 512, (x, W, H) => { x.fillStyle = '#34507f'; x.fillRect(0, 0, W, H); const r = VE.rng('manta'); for (let i = 0; i < 28; i++) { x.globalAlpha = 0.12; x.fillStyle = i % 2 ? '#4a6a9c' : '#26406a'; x.fillRect(0, i * H / 28, W, H / 56); } for (let i = 0; i < 3000; i++) { x.globalAlpha = 0.07; x.fillStyle = '#9fb6d8'; x.fillRect(r() * W, r() * H, 2, 6); } x.globalAlpha = 1; });
    const h = [];
    h.push(V.nodo({ malla: MA.caja(2.2, 0.26, 1.15, 0.06), mat: liso('#3a2a1c'), pos: [0.2, 0.19, 0] }));                              // somier
    h.push(V.nodo({ malla: MA.caja(2.1, 0.2, 1.08, 0.07), mat: colch, pos: [0.2, 0.36, 0] }));                                           // colchon (superficie a y = 0,46)
    for (const [x, z] of [[-0.82, -0.52], [-0.82, 0.52], [1.22, -0.52], [1.22, 0.52]]) h.push(V.nodo({ malla: MA.caja(0.09, 0.2, 0.09, 0.02), mat: mad, pos: [x, 0.1, z] }));
    h.push(V.nodo({ malla: MA.caja(0.08, 0.8, 1.2, 0.025), mat: mad, pos: [-0.88, 0.5, 0] }));                                            // cabecero
    h.push(V.nodo({ malla: MA.esfera(28), esc: [0.3, 0.075, 0.42], mat: liso('#eef0f6', { esp: 0.05, envolver: 0.6 }), pos: [-0.66, 0.53, 0] }));   // almohada
    h.push(V.nodo({ malla: MA.caja(1.25, 0.12, 1.14, 0.05), mat: { color: '#ffffff', mapa: manta, esp: 0.04, envolver: 0.5 }, pos: [0.5, 0.6, 0] }));  // manta
    h.push(V.nodo({ malla: MA.caja(0.16, 0.13, 1.16, 0.06), mat: liso('#e9edf6', { esp: 0.05, envolver: 0.5 }), pos: [-0.14, 0.62, 0] }));    // doblez de la sabana
    return V.nodo({ nombre: 'cama', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  // ======================================================================== LABERINTO
  const laberinto = (n, semilla) => {                                                               // DFS con semilla: pasadizos entre celdas y solucion (BFS)
    const r = VE.rng(semilla), pas = new Set(), vis = new Set(), clave = (a, b) => (a < b ? a + '-' + b : b + '-' + a), id = (i, j) => j * n + i;
    const pila = [[0, 0]]; vis.add(0);
    while (pila.length) { const [i, j] = pila[pila.length - 1], vec = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !vis.has(id(a, b)));
      if (!vec.length) { pila.pop(); continue; } const [a, b] = vec[Math.floor(r() * vec.length)]; pas.add(clave(id(i, j), id(a, b))); vis.add(id(a, b)); pila.push([a, b]); }
    const prev = new Map([[0, -1]]), cola = [0];
    while (cola.length) { const c = cola.shift(), i = c % n, j = Math.floor(c / n); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue; const q = id(ni, nj); if (prev.has(q) || !pas.has(clave(c, q))) continue; prev.set(q, c); cola.push(q); } }
    const sol = []; for (let c = id(n - 1, n - 1); c !== -1; c = prev.get(c)) sol.push(c); sol.reverse();
    return { pas, sol, clave, id };
  };
  MO.laberinto = function (o = {}) {
    const n = o.n || 6, s = o.celda || 0.3, sem = o.semilla || 'laberinto', L = laberinto(n, sem), W = n * s, partes = [], gr = 0.022, al = 0.1;
    const pared = (cx, cz, w, d) => partes.push({ malla: MA.caja(w, al, d, 0.004, 1), m: V.m4.tras(cx, al / 2 + 0.018, cz) });
    for (let i = 0; i <= n; i++) { pared(-W / 2 + i * s, 0, gr, W + gr); pared(0, -W / 2 + i * s, W + gr, gr); }                // todas las lineas
    const quitar = [];
    const cel = (i, j) => [-W / 2 + (i + 0.5) * s, -W / 2 + (j + 0.5) * s];
    // las paredes internas con pasadizo se sustituyen: se rehace sin ellas
    partes.length = 0;
    pared(0, -W / 2, W + gr, gr); pared(0, W / 2, W + gr, gr); pared(-W / 2, 0, gr, W + gr); pared(W / 2, 0, gr, W + gr);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      if (i < n - 1 && !L.pas.has(L.clave(L.id(i, j), L.id(i + 1, j)))) pared(-W / 2 + (i + 1) * s, -W / 2 + (j + 0.5) * s, gr, s + gr);
      if (j < n - 1 && !L.pas.has(L.clave(L.id(i, j), L.id(i, j + 1)))) pared(-W / 2 + (i + 0.5) * s, -W / 2 + (j + 1) * s, s + gr, gr);
    }
    const tm = V.textura('lab|tablero', 256, 256, (x, W, H) => { x.fillStyle = '#d8c7a2'; x.fillRect(0, 0, W, H); const r = VE.rng('tablero'); for (let i = 0; i < 1500; i++) { x.globalAlpha = 0.1; x.fillStyle = r() < 0.5 ? '#8c7650' : '#f1e5c6'; x.fillRect(r() * W, r() * H, 1 + r() * 4, 1); } x.globalAlpha = 1; });
    return V.nodo({ nombre: 'laberinto', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: MA.caja(W + 0.1, 0.018, W + 0.1, 0.006, 1), mat: { color: '#ffffff', mapa: tm, esp: 0.05, envolver: 0.4 }, pos: [0, 0.009, 0] }),
      V.nodo({ malla: MA.fusionar(partes, 'lab|paredes|' + n + '|' + s + '|' + sem), mat: liso('#a98a5a', { esp: 0.12, envolver: 0.35 }) })] });
  };
  MO.laberinto.camino = (n = 6, s = 0.3, sem = 'laberinto') => { const L = laberinto(n, sem), W = n * s; return L.sol.map(c => [-W / 2 + ((c % n) + 0.5) * s, -W / 2 + (Math.floor(c / n) + 0.5) * s]); };
})(window.VE);
