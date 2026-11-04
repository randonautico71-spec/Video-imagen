/* VOLUMEN — FELINOS (unidades: metros; el animal mira a +X, apoyado en y = 0, cuerpo a ~0,95 m). Piel pintada una vez (pelo a trazos,
   rayas del tigre, melena del leon) y rasgos propios de cada especie: ojos de iris ambar con pupila redonda, nariz, bigotes, colmillos,
   orejas redondas, almohadillas, garras retractiles, cola con borla (leon) o anillos (tigre).
     V.modelos.felino({ especie: 'leon'|'tigre', marcha, fase, boca, garras, zarpazo, cab, agachado, pitch, cola, pos, rot, esc })
        marcha: 'quieto' | 'camina' | 'trote' | 'galope' | 'acecho' (agazapado)
        fase: vueltas del ciclo de paso (1 = un ciclo completo; usar fase = t * frecuencia)
        boca 0..1 (mandibula abierta, rugido) · garras 0..1 (sacadas) · zarpazo 0..1 (la pata delantera derecha golpea) · cab: cabeza arriba/abajo (rad)
        agachado 0..1 · pitch: inclinacion del cuerpo (rad, + = morro arriba) · cola: balanceo extra (rad)
     V.modelos.felino.cabeza(esp, opciones)  punto aproximado de la cabeza en el mundo (para etiquetas)
   Convenio: igual que el maniqui (+X delante, +Y arriba, +Z lado). rz > 0 = la pata/hocico se mueve hacia delante/arriba (+X).
   Probado en proyectos/felinos_test. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, M4 = V.m4, PI = Math.PI;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const ESP = {
    leon:  { pel: '#c79b5e', cla: '#ecdab0', osc: '#6f5128', iris: '#cf9326', nariz: '#a8706a', labio: '#2a1a16', melena: true, rayas: false,
             alto: 1.0, largo: 1.0, grueso: 1.0, patas: 1.0, cabeza: 0.96 },
    tigre: { pel: '#d96f18', cla: '#f6efe0', osc: '#15100b', iris: '#d9a31c', nariz: '#d98e86', labio: '#201513', melena: false, rayas: true,
             alto: 0.97, largo: 1.1, grueso: 1.12, patas: 0.94, cabeza: 1.06 }
  };
  MO.felino = function (o = {}) {
    const E0 = ESP[o.especie || 'leon'] || ESP.leon, nom = o.especie || 'leon', E = o.hembra ? Object.assign({}, E0, { melena: false }) : E0;
    const rng = VE.rng('felino|' + nom);
    // ---------------------------------------------------------------- pieles pintadas (una vez)
    const pelo = (x, W, H, n, cols, largo, vert) => {
      const r = VE.rng('pelo' + nom + W + cols.join(''));
      x.lineCap = 'round';
      for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = largo * (0.5 + r()), c = cols[Math.floor(r() * cols.length)];
        x.globalAlpha = 0.07 + r() * 0.16; x.strokeStyle = c; x.lineWidth = 0.7 + r() * 1.0; x.beginPath(); x.moveTo(x0, y0);
        x.lineTo(x0 + (r() - 0.5) * 3 * (vert ? 1 : 3), y0 + l * (vert ? 1 : 0.2) + (vert ? 0 : (r() - 0.5) * 3)); x.stroke(); }
      x.globalAlpha = 1;
    };
    // cuerpo: u = vuelta (dorso en 0,25 · lado +Z en 0 · vientre en 0,75), v = largo (0 cola, 1 pecho)
    const texCuerpo = V.textura('fel|' + nom + '|cuerpo', 1024, 512, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, E.pel); g.addColorStop(0.18, E.pel); g.addColorStop(0.25, E.osc + ''); g.addColorStop(0.32, E.pel); g.addColorStop(0.5, E.pel); g.addColorStop(0.62, E.cla); g.addColorStop(0.75, E.cla); g.addColorStop(0.88, E.pel); g.addColorStop(1, E.pel);
      x.fillStyle = E.pel; x.fillRect(0, 0, W, H); x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      pelo(x, W, H, 26000, [E.osc, E.pel, E.cla, E.pel], 12, true);
      if (E.rayas) {
        const r = VE.rng('rayas|' + nom);
        for (let k = 0; k < 26; k++) { const yk = (k + 0.5) / 26 * H + (r() - 0.5) * 8, ancho = 12 + r() * 14, fase = r() * 6, esp = 0.17 + r() * 0.06;
          for (let xx = W * (0.25 - esp); xx <= W * (0.25 + esp); xx += 3) { const q = Math.abs(xx - W * 0.25) / (W * esp), h = ancho * Math.pow(1 - q, 0.6) * (0.55 + 0.45 * Math.sin(xx * 0.05 + fase)) + 2;
            x.globalAlpha = 0.94; x.fillStyle = E.osc; x.fillRect(xx, yk + Math.sin(xx * 0.03 + fase) * 6 - h / 2, 4, h); } }
        for (let k = 0; k < 40; k++) { const yk = r() * H, x0 = W * (0.25 + (r() - 0.5) * 0.3); x.globalAlpha = 0.85; x.fillStyle = E.osc; x.beginPath(); x.ellipse(x0, yk, 5 + r() * 7, 2 + r() * 3, 0, 0, 7); x.fill(); }
        x.globalAlpha = 1;
      }
    });
    const texPata = V.textura('fel|' + nom + '|pata', 256, 256, (x, W, H) => {
      x.fillStyle = E.pel; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,255,0.18)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      pelo(x, W, H, 6000, [E.osc, E.pel, E.cla], 10, true);
      if (E.rayas) { const r = VE.rng('rayasP'); x.fillStyle = E.osc; for (let k = 0; k < 7; k++) { const y = (k + 0.4 + r() * 0.3) / 7 * H * 0.85; x.globalAlpha = 0.9; x.fillRect(0, y, W * (0.6 + r() * 0.25), 6 + r() * 5); } x.globalAlpha = 1; }
    });
    const texPaw = V.textura('fel|' + nom + '|paw', 128, 128, (x, W, H) => { x.fillStyle = E.pel; x.fillRect(0, 0, W, H); x.globalAlpha = 0.45; x.fillStyle = E.cla; x.fillRect(0, 0, W, H); x.globalAlpha = 1; pelo(x, W, H, 1200, [E.pel, E.cla, E.osc], 8, true); });
    const texCab = V.textura('fel|' + nom + '|cab', 512, 256, (x, W, H) => {
      x.fillStyle = E.pel; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(60,35,10,0.35)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,245,220,0.5)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      pelo(x, W, H, 6000, [E.osc, E.pel, E.cla], 7, true);
    });
    const texHocico = V.textura('fel|' + nom + '|hocico', 256, 128, (x, W, H) => { x.fillStyle = E.cla; x.fillRect(0, 0, W, H); pelo(x, W, H, 1500, [E.pel, E.cla, '#ffffff'], 6, true); x.fillStyle = E.osc; x.globalAlpha = 0.5; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(W * (0.35 + (i % 7) * 0.05), H * (0.45 + Math.floor(i / 7) * 0.12), 2.5, 0, 7); x.fill(); } x.globalAlpha = 1; });
    const texMelena = V.textura('fel|' + nom + '|melena', 512, 512, (x, W, H) => {
      x.fillStyle = '#6a4420'; x.fillRect(0, 0, W, H); const r = VE.rng('mel'); const cols = ['#2f1d0e', '#4a2c12', '#8a5a2a', '#b98640', '#d8aa5c', '#1f130a'];
      x.lineCap = 'round'; for (let i = 0; i < 9000; i++) { x.globalAlpha = 0.35 + r() * 0.5; x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = 1.5 + r() * 2.5; const x0 = r() * W, y0 = r() * H; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 6, y0 + 14 + r() * 26); x.stroke(); } x.globalAlpha = 1;
    });
    const texCola = V.textura('fel|' + nom + '|cola', 128, 256, (x, W, H) => {
      x.fillStyle = E.pel; x.fillRect(0, 0, W, H); pelo(x, W, H, 1400, [E.osc, E.pel, E.cla], 10, true);
      if (E.rayas) { x.fillStyle = E.osc; for (let k = 0; k < 9; k++) { x.globalAlpha = 0.95; x.fillRect(0, H * (0.06 + k * 0.1), W, 9 + k); } x.fillRect(0, H * 0.93, W, H * 0.07); x.globalAlpha = 1; }
    });
    const mt = (mapa, extra) => Object.assign({ color: '#ffffff', mapa, esp: 0.04, dureza: 10, envolver: 0.45, borde: 0.25 }, extra || {});
    const mCuerpo = mt(texCuerpo), mPata = mt(texPata), mPaw = mt(texPaw), mCab = mt(texCab), mHoc = mt(texHocico), mMel = mt(texMelena, { envolver: 0.55 }), mCola = mt(texCola);
    const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
    const S = o.esc, escE = (a, b, c) => [a, b, c];
    // ---------------------------------------------------------------- medidas de la especie
    const Lx = E.largo, G = E.grueso, L1 = 0.38 * E.patas, L2 = 0.36 * E.patas, yb0 = 0.9 * E.alto;
    // ---------------------------------------------------------------- parametros de pose
    const marcha = o.marcha || 'quieto', ph = (o.fase || 0) * 2 * PI, ag = c01(o.agachado || (marcha === 'acecho' ? 1 : 0)), boca = c01(o.boca || 0), gar = c01(o.garras || 0), zar = c01(o.zarpazo || 0);
    const sn = Math.sin, cs = Math.cos, mx = Math.max;
    let fl, fr, hl, hr, bob = 0, pitch = o.pitch || 0, cab = (o.cab == null ? -0.12 : o.cab), colaR = o.cola || 0, arco = 0;
    const del = (a1, a2, a3 = 0) => [a1, a2, a3], tra = (a1, a2, a3 = 0) => [a1, a2, a3];
    const base = { f: [0.02, -0.04, 0.0], h: [0.40, -0.60, 0.2] };
    if (marcha === 'galope') {
      const A = 1.0;
      fl = [0.15 + A * sn(ph), -0.2 - 0.95 * mx(0, sn(ph + 1.5)), 0.2 * sn(ph + 1)]; fr = [0.15 + A * sn(ph + 0.55), -0.2 - 0.95 * mx(0, sn(ph + 2.05)), 0.2 * sn(ph + 1.5)];
      hl = [0.35 + 0.95 * sn(ph + 2.9), -0.7 - 0.9 * mx(0, sn(ph + 4.4)), 0.3 * sn(ph + 3.2)]; hr = [0.35 + 0.95 * sn(ph + 3.45), -0.7 - 0.9 * mx(0, sn(ph + 4.95)), 0.3 * sn(ph + 3.7)];
      bob = 0.07 * sn(2 * ph + 0.9); pitch += 0.12 * sn(ph + 0.6); arco = 0.1 * sn(ph + 0.3); cab += 0.08 * sn(ph + 2.2); colaR += 0.22 * sn(ph + 1.2);
    } else if (marcha === 'trote' || marcha === 'camina') {
      const A = marcha === 'trote' ? 0.62 : 0.42, k = marcha === 'trote' ? 0.7 : 0.45;
      fl = [0.02 + A * sn(ph), -0.1 - k * mx(0, sn(ph + 1.6)), 0]; fr = [0.02 + A * sn(ph + PI), -0.1 - k * mx(0, sn(ph + PI + 1.6)), 0];
      hl = [0.4 + A * sn(ph + PI), -0.62 - k * mx(0, sn(ph + PI + 1.6)), 0.2]; hr = [0.4 + A * sn(ph), -0.62 - k * mx(0, sn(ph + 1.6)), 0.2];
      bob = 0.025 * sn(2 * ph); pitch += 0.03 * sn(ph); colaR += 0.12 * sn(ph + 1);
    } else if (marcha === 'acecho') {
      const A = 0.22; fl = [0.35 + A * sn(ph), -0.8, 0.3]; fr = [0.35 + A * sn(ph + PI), -0.8, 0.3]; hl = [0.85 + 0.15 * sn(ph + PI), -1.35, 0.5]; hr = [0.85 + 0.15 * sn(ph), -1.35, 0.5];
      bob = 0.01 * sn(2 * ph); cab = -0.28; colaR += 0.1 * sn(ph);
    } else { fl = base.f.slice(); fr = base.f.slice(); hl = base.h.slice(); hr = base.h.slice(); bob = 0.004 * sn(ph * 0.5); }
    if (ag > 0 && marcha !== 'acecho') { fl = [fl[0] + 0.3 * ag, fl[1] - 0.6 * ag, fl[2]]; fr = [fr[0] + 0.3 * ag, fr[1] - 0.6 * ag, fr[2]]; hl = [hl[0] + 0.45 * ag, hl[1] - 0.7 * ag, hl[2]]; hr = [hr[0] + 0.45 * ag, hr[1] - 0.7 * ag, hr[2]]; }
    if (zar > 0) { const s = zar; fr = [0.2 + 1.2 * s, -0.4 - 0.7 * s, 0.4 * s]; fl = [fl[0] + 0.1 * s, fl[1], fl[2]]; pitch += 0.12 * s; }
    const yb = yb0 - 0.2 * ag * (marcha === 'acecho' ? 1.4 : 1) + bob;
    // ---------------------------------------------------------------- piezas
    const bolaFur = (r, m, pos) => V.nodo({ malla: MA.esfera(20), esc: r, pos, mat: m });
    const elip = (mat, esc3, pos, rot) => V.nodo({ malla: MA.esfera(28), esc: esc3, pos: pos || [0, 0, 0], rot: rot, mat });
    const eje = (a, b, c, pos, mat) => V.nodo({ malla: MA.esfera(40), esc: [a, b, c], pos, rot: [0, 0, PI / 2], mat });   // elipsoide alargado en X (a = alto, b = largo, c = ancho)
    const garra = (pos, rz, esc3) => V.nodo({ malla: MA.cilindro(0.012, 0, 0.075, 8), pos, rot: [0, 0, rz], esc: esc3, mat: liso('#f1ead8', { esp: 0.5, dureza: 60 }) });
    const pata = (x, z, ang, delante) => {
      const r1 = (delante ? 0.125 : 0.135) * G, r2 = 0.088 * G;
      const paw = V.nodo({ pos: [0, -L2, 0], rot: [0, 0, ang[2]], hijos: [
        elip(mPaw, [0.115 * G, 0.058 * G, 0.085 * G], [0.06, -0.035, 0]),
        garra([0.175, -0.06, 0.03], PI / 2 - 0.45, gar), garra([0.185, -0.06, 0.0], PI / 2 - 0.4, gar), garra([0.175, -0.06, -0.03], PI / 2 - 0.45, gar)] });
      const lower = V.nodo({ pos: [0, -L1, 0], rot: [0, 0, ang[1]], hijos: [
        bolaFur(r2 * 1.02, mPata, [0, 0, 0]), V.nodo({ malla: MA.capsula(r2 * 0.95, 0.07 * G, L2, 20), mat: mPata }), paw] });
      return V.nodo({ pos: [x, delante ? -0.13 : -0.11, z], rot: [0, 0, ang[0]], hijos: [
        elip(mPata, delante ? [0.19 * G, 0.22 * G, 0.12 * G] : [0.22 * G, 0.24 * G, 0.13 * G], [0, 0.05, 0]),
        V.nodo({ malla: MA.capsula(r1, r2, L1, 22), mat: mPata }), lower] });
    };
    // cola: tres tramos con balanceo; leon: borla oscura; tigre: anillos
    const colaNodo = () => {
      const seg = (len, r1, r2, ang, hijo) => V.nodo({ rot: [0, 0, ang], hijos: [V.nodo({ malla: MA.capsula(r1, r2, len, 14), mat: mCola }), hijo ? V.nodo({ pos: [0, -len, 0], hijos: [hijo] }) : null].filter(Boolean) });
      const punta = E.melena ? V.nodo({ pos: [0, -0.1, 0], hijos: [elip(mMel, [0.065, 0.14, 0.065], [0, -0.0, 0])] }) : elip(liso(E.osc), [0.045, 0.06, 0.045], [0, -0.03, 0]);
      const base = -PI / 2 - 0.35 + colaR * 0.6;
      return V.nodo({ pos: [-0.74 * Lx, 0.12, 0], hijos: [seg(0.34, 0.052 * G, 0.045, base, seg(0.34, 0.045, 0.04, 0.45 + colaR * 0.9, seg(0.28, 0.04, 0.034, 0.5 + colaR, punta)))] });
    };
    // cabeza
    const cabeza = () => {
      const k = E.cabeza, h = [];
      h.push(elip(mCab, [0.20 * k, 0.165 * k, 0.16 * k], [0, 0, 0]));                                    // craneo
      h.push(elip(mHoc, [0.12 * k, 0.078 * k, 0.088 * k], [0.175 * k, -0.045 * k, 0]));                   // hocico
      h.push(elip(liso(E.nariz, { esp: 0.5 }), [0.032, 0.024, 0.04], [0.29 * k, -0.012 * k, 0]));         // nariz
      h.push(elip(liso(E.osc, { esp: 0.1 }), [0.02, 0.012, 0.02], [0.288 * k, -0.045 * k, 0.0]));         // surco bajo la nariz
      for (const s of [-1, 1]) {
        h.push(elip(liso('#1a110c'), [0.034, 0.03, 0.026], [0.125 * k, 0.05 * k, s * 0.092 * k], [0, s * 0.45, 0]));                      // contorno del ojo
        h.push(elip(liso(E.iris, { esp: 0.8, dureza: 90, emision: 0.12 }), [0.026, 0.026, 0.02], [0.134 * k, 0.05 * k, s * 0.099 * k], [0, s * 0.45, 0]));   // iris
        h.push(elip(liso('#050403', { esp: 0.9, dureza: 110 }), [0.013, 0.013, 0.01], [0.143 * k, 0.05 * k, s * 0.103 * k], [0, s * 0.45, 0]));            // pupila
        h.push(elip(liso(E.osc), [0.05, 0.012, 0.018], [0.12 * k, 0.085 * k, s * 0.088 * k], [0, s * 0.4, s * 0.15]));                  // ceja
        // orejas redondas
        h.push(V.nodo({ pos: [-0.05 * k, 0.15 * k, s * 0.105 * k], rot: [s * 0.35, s * 0.25, 0], hijos: [
          elip(mCab, [0.05, 0.062, 0.022]), elip(liso(E.osc, { esp: 0.05 }), [0.044, 0.056, 0.014], [0.004, 0, s * -0.012]), E.rayas ? elip(liso('#f6efe0'), [0.022, 0.026, 0.006], [-0.014, 0.012, s * -0.024]) : null].filter(Boolean) }));
        // bigotes
        for (let i = 0; i < 4; i++) h.push(V.nodo({ malla: MA.cilindro(0.0028, 0.0012, 0.2, 6), pos: [0.23 * k, (-0.02 - i * 0.012) * k, s * (0.085 + i * 0.004) * k], rot: [s * (1.15 + i * 0.12), 0, PI / 2 - 0.14 + i * 0.1], mat: liso('#f3eee2', { esp: 0.6 }) }));
        // colmillos superiores
        h.push(V.nodo({ malla: MA.cilindro(0.016, 0, 0.085, 8), pos: [0.255 * k, -0.095 * k - 0.02, s * 0.05 * k], mat: liso('#f4eedd', { esp: 0.6, dureza: 70 }) }));
        if (E.rayas) {   // tigre: patillas blancas, rayas de la cara, mancha clara sobre el ojo
          h.push(elip(liso('#f7f0e2', { esp: 0.05 }), [0.08, 0.05, 0.03], [0.02 * k, -0.075 * k, s * 0.145 * k], [0, s * 0.25, 0]));
          for (let i = 0; i < 3; i++) h.push(elip(liso(E.osc, { esp: 0.05 }), [0.052 - i * 0.008, 0.007, 0.012], [0.02 * k - i * 0.012, (0.03 - i * 0.032) * k, s * 0.153 * k], [0, s * 0.35, s * (0.35 - i * 0.18)]));
          h.push(elip(liso('#f7f0e2', { esp: 0.05 }), [0.028, 0.016, 0.016], [0.105 * k, 0.098 * k, s * 0.085 * k], [0, s * 0.3, 0]));
        }
      }
      if (E.rayas) for (let i = 0; i < 3; i++) h.push(elip(liso(E.osc, { esp: 0.05 }), [0.052, 0.006, 0.01], [0.04 * k, 0.158 * k, (i - 1) * 0.035 * k], [0, 1.5708, 0]));
      // mandibula
      h.push(V.nodo({ pos: [0.05 * k, -0.085 * k, 0], rot: [0, 0, -boca * 0.95], hijos: [
        elip(mHoc, [0.115 * k, 0.034 * k, 0.07 * k], [0.12 * k, -0.01 * k, 0]),
        elip(liso('#5a1a1c', { esp: 0.6, dureza: 40 }), [0.1 * k, 0.02, 0.055 * k], [0.12 * k, 0.012 * k, 0]),                // interior de la boca
        elip(liso('#c8666a', { esp: 0.5 }), [0.07 * k, 0.014, 0.036 * k], [0.12 * k, 0.02, 0]),                               // lengua
        ...[-1, 1].map(s => V.nodo({ malla: MA.cilindro(0, 0.013, 0.065, 8), pos: [0.215 * k, 0.04 * k, s * 0.036 * k], mat: liso('#f4eedd', { esp: 0.6, dureza: 70 }) })) ] }));
      h.push(elip(liso('#4a0f12', { esp: 0.4 }), [0.09 * k, 0.012 * k * (0.4 + boca * 2.5), 0.06 * k], [0.15 * k, -0.095 * k, 0]));
      if (E.melena) {
        const partes = [{ malla: MA.esfera(28), m: M4.mul(M4.tras(-0.2, -0.03, 0), M4.esc(0.24, 0.27, 0.27)) }], r = VE.rng('melenaPartes');
        for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * PI + r() * 0.3, rho = 0.16 + r() * 0.1, tam = 0.085 + r() * 0.06;
          partes.push({ malla: MA.esfera(16), m: M4.mul(M4.tras(-0.15 - r() * 0.18, Math.cos(a) * rho * 1.2 - 0.03, Math.sin(a) * rho * 1.15), M4.esc(tam * 1.4, tam * 1.7, tam * 1.15)) }); }
        for (let i = 0; i < 12; i++) { const a = (i / 11 - 0.5) * 2.4; partes.push({ malla: MA.esfera(16), m: M4.mul(M4.tras(-0.28 - r() * 0.14, -0.2 - r() * 0.12, Math.sin(a) * 0.24), M4.esc(0.12, 0.17 + r() * 0.05, 0.1)) }); }
        h.push(V.nodo({ malla: MA.fusionar(partes, 'melena|fus|v3'), mat: mMel, pos: [0.0, 0, 0] }));
      }
      return V.nodo({ pos: [0.8 * Lx, 0.19 + 0.03 * ag, 0], rot: [0, 0, cab], hijos: h });
    };
    // tronco: pecho profundo, lomo y cadera, cuello grueso
    const tronco = V.nodo({ pos: [0, yb, 0], rot: [0, 0, pitch], hijos: [
      eje(0.30 * G, 0.64 * Lx, 0.26 * G, [0, 0, 0], mCuerpo),
      eje(0.33 * G, 0.36 * Lx, 0.27 * G, [0.36 * Lx, -0.02, 0], mCuerpo),
      eje(0.30 * G, 0.34 * Lx, 0.27 * G, [-0.4 * Lx, 0.0, 0], mCuerpo),
      V.nodo({ malla: MA.esfera(28), esc: [0.22 * G, 0.28 * Lx, 0.2 * G], pos: [0.68 * Lx, 0.14, 0], rot: [0, 0, PI / 2 - 0.5], mat: mCuerpo }),
      V.nodo({ rot: [0, 0, arco * 0.5], hijos: [] }),
      pata(0.42 * Lx, 0.185 * G, fl, true), pata(0.42 * Lx, -0.185 * G, fr, true),
      pata(-0.50 * Lx, 0.2 * G, hl, false), pata(-0.50 * Lx, -0.2 * G, hr, false),
      colaNodo(), cabeza()] });
    return V.nodo({ nombre: 'felino_' + nom, pos: o.pos, rot: o.rot, esc: S, hijos: [tronco] });
  };
  MO.felino.cabeza = function (esp, o = {}) { const p = o.pos || [0, 0, 0], e = o.esc || 1, ry = (o.rot && o.rot[1]) || 0; const dx = 0.9 * e * (ESP[esp] || ESP.leon).largo; return [p[0] + Math.cos(ry) * dx, p[1] + 1.15 * e, p[2] - Math.sin(ry) * dx]; };
})(window.VE);
