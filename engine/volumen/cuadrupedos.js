/* VOLUMEN — CUADRUPEDOS: guepardo, berrendo, springbok, ñu azul y gacela de Thompson (unidades: metros, cabeza hacia +X, patas en y = 0).
     V.modelos.cuadrupedo({ especie, fase, modo, amp, boca, cabeza, pos, rumbo, escala, alfa })
        especie: 'guepardo' | 'berrendo' | 'springbok' | 'nu' | 'gacela'  (o un objeto como los de V.modelos.cuadrupedo.especies)
        fase: vueltas de zancada (una vuelta = un ciclo completo de galope); modo: 'galope' (defecto) | 'trote' | 'quieto'
        amp: amplitud de la zancada 0..1 (1 = galope a tope); boca: 0..1 (jadeo: boca abierta y lengua); cabeza: grados de cabeza hacia abajo (pastar/jadear)
        torax: 0..1 cuanto se hincha el pecho al respirar (jadeo, rayos X)
     Torso en dos mitades que se doblan (columna del guepardo), patas de dos tramos delante y tres detras (corvejon), cuello, cabeza con ojos, orejas,
     cuernos propios de cada especie, cola articulada. Pelaje pintado una vez (manchas del guepardo, culo blanco del berrendo, franja del springbok...).
     V.modelos.cuadrupedo.zancada(especie) -> metros por vuelta de fase a galope (para casar el paso con la velocidad y que no patine). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, D = PI / 180;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const ESP = {
    guepardo:  { h: 0.80, L: 1.12, Rc: 0.165, Rw: 0.10, Rh: 0.125, lat: 0.78, cuello: { l: 0.30, r1: 0.075, r2: 0.052, ang: 22 }, cabeza: { l: 0.20, an: 0.068, al: 0.07 }, cola: { l: 0.80, r: 0.034 },
                 color: '#c9a25a', claro: '#f0e5c6', oscuro: '#241b13', manchas: true, lagrima: true, paso: { A: 44, F: 75, S: 9, zancada: 7.0 }, pies: '#cdb27a' },
    berrendo:  { h: 0.88, L: 1.20, Rc: 0.205, Rw: 0.18, Rh: 0.185, lat: 0.72, cuello: { l: 0.40, r1: 0.1, r2: 0.066, ang: 50 }, cabeza: { l: 0.30, an: 0.07, al: 0.082 }, cola: { l: 0.10, r: 0.03 },
                 color: '#b5702f', claro: '#f7f2ea', oscuro: '#1e1913', cuernos: 'berrendo', culoBlanco: true, bandas: true, mascara: true, paso: { A: 38, F: 55, S: 5, zancada: 6.2 }, pies: '#1b1612' },
    springbok: { h: 0.78, L: 1.00, Rc: 0.165, Rw: 0.14, Rh: 0.145, lat: 0.72, cuello: { l: 0.34, r1: 0.08, r2: 0.05, ang: 52 }, cabeza: { l: 0.26, an: 0.058, al: 0.07 }, cola: { l: 0.20, r: 0.02 },
                 color: '#bf8648', claro: '#fcf8f0', oscuro: '#5a3316', cuernos: 'lira', franja: true, caraBlanca: true, paso: { A: 38, F: 55, S: 5, zancada: 5.4 }, pies: '#2a2018' },
    nu:        { h: 1.35, L: 1.75, Rc: 0.30, Rw: 0.255, Rh: 0.235, lat: 0.7, cuello: { l: 0.46, r1: 0.15, r2: 0.105, ang: 8 }, cabeza: { l: 0.50, an: 0.11, al: 0.15 }, cola: { l: 0.60, r: 0.022 },
                 color: '#6e6e73', claro: '#8d8d93', oscuro: '#1b1b1e', cuernos: 'nu', barba: true, rayas: true, paso: { A: 32, F: 48, S: 4, zancada: 7.2 }, pies: '#1b1b1e' },
    gacela:    { h: 0.62, L: 0.82, Rc: 0.125, Rw: 0.10, Rh: 0.105, lat: 0.72, cuello: { l: 0.27, r1: 0.06, r2: 0.04, ang: 52 }, cabeza: { l: 0.21, an: 0.045, al: 0.055 }, cola: { l: 0.20, r: 0.02 },
                 color: '#c28850', claro: '#fcf8f0', oscuro: '#231710', cuernos: 'gacela', franja: true, caraBlanca: true, paso: { A: 38, F: 55, S: 5, zancada: 4.6 }, pies: '#2a2018' },
  };
  // ------------------------------------------------------------ pelaje (se pinta una vez)
  /* u (horizontal): 0 = vientre, 0,25 = flanco, 0,5 = lomo; v (vertical): 0 = extremo delantero del tramo, 1 = trasero. s = posicion del cuerpo (0 grupa, 1 pecho). */
  function pelaje(nom, e, sA, sB) {
    return V.textura('cuad|pelo2|' + nom + '|' + sA, 512, 512, (x0, W, H, cv) => {
      const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const x = tmp.getContext('2d');
      const S = (y) => sB - (sB - sA) * y / H, rn = VE.rng('cuad' + nom + sA);
      const g = x.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, e.claro); g.addColorStop(0.1, e.claro); g.addColorStop(0.24, e.color); g.addColorStop(0.5, e.color); g.addColorStop(0.76, e.color); g.addColorStop(0.9, e.claro); g.addColorStop(1, e.claro);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const ob = x.createLinearGradient(0, 0, W, 0); ob.addColorStop(0.35, 'rgba(0,0,0,0)'); ob.addColorStop(0.5, 'rgba(40,20,5,0.22)'); ob.addColorStop(0.65, 'rgba(0,0,0,0)'); x.fillStyle = ob; x.fillRect(0, 0, W, H);   // lomo mas oscuro
      if (e.manchas) {                                                          // guepardo: manchas negras redondas, mas finas en el vientre
        for (let i = 0; i < 900; i++) { const u = 0.1 + rn() * 0.8, v = rn(), rr = 6 + rn() * 8; if (Math.abs(u - 0.5) > 0.4) continue;
          x.fillStyle = `rgba(28,20,12,${0.78 + rn() * 0.2})`; x.beginPath(); x.ellipse(u * W, v * H, rr * 0.8, rr, 0, 0, TAU); x.fill(); }
      }
      if (e.culoBlanco) {                                                       // berrendo: grupa blanca y vientre blanco con borde irregular
        for (const lado of [0.27, 0.73]) { const gr = x.createRadialGradient(lado * W, H * 1.0, 10, lado * W, H * 0.98, H * 0.34); gr.addColorStop(0, '#fbf8f2'); gr.addColorStop(0.75, '#f7f2ea'); gr.addColorStop(1, 'rgba(247,242,234,0)');
          if (sA < 0.2) { x.fillStyle = gr; x.beginPath(); x.ellipse(lado * W, H * 0.95, W * 0.2, H * 0.38, 0, 0, TAU); x.fill(); } }
        x.fillStyle = e.claro; x.fillRect(0, 0, W * 0.2, H); x.fillRect(W * 0.8, 0, W * 0.2, H);
      }
      if (e.franja) {                                                           // springbok / gacela: banda oscura entre el lomo y el vientre blanco
        x.fillStyle = e.oscuro; x.globalAlpha = 0.9; x.fillRect(W * 0.16, 0, W * 0.07, H); x.fillRect(W * 0.77, 0, W * 0.07, H); x.globalAlpha = 1;
        x.fillStyle = e.claro; x.fillRect(0, 0, W * 0.15, H); x.fillRect(W * 0.85, 0, W * 0.15, H);
      }
      if (e.rayas) {                                                            // ñu: bandas oscuras verticales en cuello y paleta
        for (let k = 0; k < 9; k++) { const yv = (0.62 + k * 0.045); if (yv > sB + 0.01 || yv < sA - 0.01) continue; const y = (sB - yv) / (sB - sA) * H;
          x.fillStyle = 'rgba(20,20,22,0.55)'; x.fillRect(W * 0.12, y, W * 0.76, H * 0.022); }
      }
      for (let i = 0; i < 2600; i++) { const px = rn() * W, py = rn() * H; x.fillStyle = rn() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'; x.fillRect(px, py, 1.5, 7 + rn() * 7); }   // pelo
      x0.drawImage(tmp, W * 0.25, 0); x0.drawImage(tmp, -W * 0.75, 0);          // el vientre queda abajo (en el torno, u = 0 mira al costado)
    });
  }
  function pelajeLiso(nom, e, claroAbajo, cuello) {                                          // cuello y patas
    return V.textura('cuad|liso|' + nom + (claroAbajo ? 'c' : '') + (cuello ? 'n' : ''), 256, 256, (x, W, H) => {
      const rn = VE.rng('liso' + nom); x.fillStyle = e.color; x.fillRect(0, 0, W, H);
      if (e.manchas) for (let i = 0; i < 260; i++) { const u = rn(), v = rn(), rr = 4 + rn() * 5; x.fillStyle = `rgba(28,20,12,${0.78 + rn() * 0.2})`; x.beginPath(); x.ellipse(u * W, v * H, rr * 0.8, rr, 0, 0, TAU); x.fill(); }
      if (e.bandas && cuello) { x.fillStyle = e.claro; x.fillRect(0, H * 0.55, W, H * 0.12); x.fillStyle = e.oscuro; x.globalAlpha = 0.5; x.fillRect(0, H * 0.7, W, H * 0.08); x.globalAlpha = 1; }
      if (claroAbajo && !e.manchas) { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, e.color); g.addColorStop(1, e.claro); x.fillStyle = g; x.fillRect(0, 0, W, H); }
      for (let i = 0; i < 900; i++) { x.fillStyle = rn() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; x.fillRect(rn() * W, rn() * H, 1.5, 6 + rn() * 6); }
    });
  }
  // ------------------------------------------------------------ geometria
  const radio = (e, s) => { const base = e.Rw + (e.Rh - e.Rw) * Math.exp(-Math.pow((s - 0.12) / 0.15, 2)) + (e.Rc - e.Rw) * Math.exp(-Math.pow((s - 0.74) / 0.2, 2));
    return base * Math.sqrt(Math.max(0.0001, 1 - Math.pow(Math.abs(1 - 2 * s), 7))); };
  /* tramo de torso entre s0 y s1 (0 grupa .. 1 pecho) con eje Y local, origen en s = 0,5 */
  const tramo = (e, s0, s1, k, abierto) => { const n = 24, p = [[0, (s1 - 0.5) * e.L + 0.002]], w = 0.04, rampa = (v) => { v = c01(v); return v * v * (3 - 2 * v); };
    for (let i = 0; i <= n; i++) { const s = s1 - (s1 - s0) * i / n; let f = 1;
      if (abierto === 'delantera') f = rampa((s - s0) / w); else if (abierto === 'trasera') f = rampa((s1 - s) / w);
      p.push([Math.max(0.002, radio(e, s) * k * f), (s - 0.5) * e.L]); }
    p.push([0, (s0 - 0.5) * e.L - 0.002]); return MA.torno(p, 36); };
  const memo = new Map(), una = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
  const rotZ = (g) => [0, 0, g * D];
  const bola = (r, pos, mat, esc) => V.nodo({ malla: MA.esfera(16), esc: esc || r, pos, mat });
  const cuernos = (e, mat) => {
    const par = (pts, rad, z, extra) => [1, -1].map(l => V.nodo({ malla: una('cuerno|' + JSON.stringify(pts) + rad, () => MA.tubo(pts.map(p => [p[0], p[1], p[2]]), rad, 10)), pos: [0, 0, l * z], esc: [1, 1, l], mat }));
    if (e.cuernos === 'berrendo') return [...par([[0, 0, 0], [-0.008, 0.07, 0.006], [-0.02, 0.14, 0.01], [-0.06, 0.2, 0.012], [-0.115, 0.215, 0.01]], (t) => 0.017 * (1 - 0.7 * t), 0.045),
      ...par([[-0.015, 0.1, 0.008], [0.015, 0.14, 0.012], [0.05, 0.175, 0.012]], (t) => 0.011 * (1 - 0.8 * t), 0.045)];
    if (e.cuernos === 'lira') return par([[0, 0, 0], [-0.012, 0.09, 0.02], [-0.01, 0.17, 0.05], [0.008, 0.23, 0.045], [0.04, 0.27, 0.025]], (t) => 0.014 * (1 - 0.75 * t), 0.035);
    if (e.cuernos === 'gacela') return par([[0, 0, 0], [-0.02, 0.09, 0.008], [-0.06, 0.17, 0.004], [-0.1, 0.22, -0.01]], (t) => 0.011 * (1 - 0.7 * t), 0.03);
    if (e.cuernos === 'nu') return par([[0, 0, 0], [0, -0.01, 0.1], [0.02, -0.05, 0.19], [0.07, -0.03, 0.24], [0.12, 0.05, 0.25], [0.15, 0.15, 0.23]], (t) => 0.034 * (1 - 0.8 * t), 0.075);
    return [];
  };
  const cabeza = (e, o, mats) => {
    const H = e.cabeza, hl = H.l, an = H.an, al = H.al, boca = o.boca || 0, oc = mats.oscuro, rostro = e.caraBlanca ? mats.claro : mats.cuerpo;
    const mand = V.nodo({ pos: [hl * 0.3, -al * 0.5, 0], rot: rotZ(-boca * 26), hijos: [
      V.nodo({ malla: MA.esfera(14), esc: [hl * 0.36, al * 0.3, an * 0.55], pos: [hl * 0.3, -al * 0.06, 0], mat: boca > 0.05 ? mats.boca : mats.claroDirecto }),
      boca > 0.3 ? V.nodo({ malla: MA.esfera(12), esc: [hl * 0.26, al * 0.12, an * 0.38], pos: [hl * 0.3, al * 0.04, 0], mat: mats.lengua }) : null ].filter(Boolean) });
    const hijos = [
      V.nodo({ malla: MA.esfera(20), esc: [hl * 0.34, al, an], pos: [hl * 0.2, 0, 0], mat: mats.cuerpo }),
      V.nodo({ malla: MA.esfera(18), esc: [hl * 0.38, al * 0.66, an * 0.72], pos: [hl * 0.62, -al * 0.18, 0], mat: rostro }),
      V.nodo({ malla: MA.esfera(12), esc: [hl * 0.05, al * 0.2, an * 0.34], pos: [hl * 0.97, -al * 0.08, 0], mat: oc }),
      mand, ...cuernos(e, mats.cuerno).map(c => { c.pos = [hl * 0.1 + c.pos[0], al * 0.8, c.pos[2]]; return c; }) ];
    for (const l of [1, -1]) {
      hijos.push(bola(al * 0.2, [hl * 0.42, al * 0.32, l * an * 0.84], mats.ojo, [al * 0.2, al * 0.2, al * 0.14]));
      hijos.push(bola(al * 0.06, [hl * 0.44, al * 0.4, l * an * 0.95], mats.brillo));
      if (e.cuernos) hijos.push(V.nodo({ malla: MA.cilindro(al * 0.26, 0.001, al * 1.3, 10), pos: [hl * 0.05, al * 1.0, l * an * 1.0], rot: [l * 32 * D, 0, 12 * D], mat: mats.cuerpo }));
      else hijos.push(bola(al * 0.3, [hl * 0.04, al * 0.82, l * an * 0.72], mats.oscuroOreja, [al * 0.3, al * 0.32, al * 0.18]));
      if (e.lagrima) hijos.push(V.nodo({ malla: MA.esfera(8), esc: [an * 0.05, al * 0.78, an * 0.05], pos: [hl * 0.5, -al * 0.12, l * an * 0.8], rot: [l * -12 * D, 0, 8 * D], mat: oc }));
      if (e.mascara) hijos.push(bola(al * 0.3, [hl * 0.82, -al * 0.16, l * an * 0.34], mats.oscuro, [al * 0.35, al * 0.22, an * 0.2]));
    }
    if (e.barba) hijos.push(V.nodo({ malla: MA.capsula(an * 0.35, an * 0.1, hl * 0.5, 10), pos: [hl * 0.46, -al * 0.55, 0], rot: [0, 0, 10 * D], mat: mats.oscuro }));
    return V.nodo({ nombre: 'cabeza', hijos });
  };
  // ------------------------------------------------------------ el animal
  const GAIT = { galope: [0, 0.07, 0.5, 0.57], trote: [0, 0.5, 0.5, 0], quieto: [0, 0, 0, 0] };    // fase de: delantera izq., delantera der., trasera izq., trasera der.
  MO.cuadrupedo = function (o = {}) {
    const e = typeof o.especie === 'string' ? ESP[o.especie] : (o.especie || ESP.guepardo), nom = typeof o.especie === 'string' ? o.especie : 'x', modo = o.modo || 'galope';
    const ph = o.fase || 0, amp = modo === 'quieto' ? 0 : (o.amp == null ? 1 : o.amp), P = e.paso, h = e.h, L = e.L, k = amp;
    const PA = o.piel == null ? 1 : o.piel, mat = (color, extra) => Object.assign({ color, esp: 0.14, dureza: 18, envolver: 0.3 }, PA < 1 ? { alfa: PA } : {}, extra);
    const mats = { cuerpo: mat(e.color), claro: mat(e.claro), claroDirecto: mat(e.claro), oscuro: mat(e.oscuro), oscuroOreja: mat(e.oscuro), cuerno: mat(e.oscuro, { esp: 0.4, dureza: 40 }),
      ojo: mat('#0c0907', { esp: 0.85, dureza: 90 }), brillo: mat('#ffffff', { tipo: 'plano' }), boca: mat('#4a1a1c'), lengua: mat('#d0627a', { esp: 0.4, dureza: 30 }) };
    const pie = mat(e.pies, { esp: 0.2 });
    const cuerpoR = mat('#ffffff', { mapa: pelaje(nom, e, 0, 0.55), esp: 0.16, dureza: 22, envolver: 0.35, alfa: PA }), cuerpoF = mat('#ffffff', { mapa: pelaje(nom, e, 0.46, 1), esp: 0.16, dureza: 22, envolver: 0.35, alfa: PA });
    const piel = (cl, cu) => mat('#ffffff', { mapa: pelajeLiso(nom, e, cl, cu), esp: 0.14, dureza: 20, envolver: 0.35, alfa: PA });
    const yT = h * 0.8 + h * 0.05 * -Math.cos(4 * PI * ph) * k, Rc = e.Rc, Rh = e.Rh;
    const sw = (p) => Math.max(0, Math.cos(TAU * p)), sn = (p) => Math.sin(TAU * p);
    const fases = GAIT[modo] || GAIT.galope;
    const legF = yT - Rc * 0.3 - h * 0.05 * -Math.cos(4 * PI * ph) * k, kF = Rc * 0.3, uF = legF * 0.5, lF = legF * 0.5;
    const pataD = (lado, p) => {
      const th = P.A * k * sn(p), fl = (8 + P.F * k * sw(p)) * (modo === 'quieto' ? 0 : 1);
      return V.nodo({ nombre: 'pata_d' + (lado > 0 ? 'd' : 'i'), pos: [L * 0.22, -Rc * 0.28, lado * Rc * e.lat * 0.62], rot: rotZ(th), hijos: [
        bola(kF * 1.05, [0, 0, 0], piel(false)), V.nodo({ malla: MA.capsula(kF, kF * 0.6, uF, 14), mat: piel(false) }),
        V.nodo({ pos: [0, -uF, 0], rot: rotZ(-fl), hijos: [bola(kF * 0.62, [0, 0, 0], piel(true)), V.nodo({ malla: MA.capsula(kF * 0.56, kF * 0.36, lF * 0.93, 14), mat: piel(true) }),
          V.nodo({ pos: [0.012, -lF * 0.95, 0], rot: rotZ(-(th * 0.4)), hijos: [V.nodo({ malla: MA.esfera(12), esc: [kF * 0.78, kF * 0.42, kF * 0.5], pos: [kF * 0.35, -kF * 0.2, 0], mat: pie })] })] })] });
    };
    const legH = yT - Rh * 0.2, K = legH / 0.954, kH = Rh * 0.27;
    const pataT = (lado, p) => {
      const th = P.A * k * sn(p), ext = c01(-th / Math.max(1, P.A)) * (k > 0 ? 1 : 0), swf = sw(p) * k;
      const m1 = -(60 * (1 - ext) + 22 * swf), m2 = 45 * (1 - ext) + 40 * swf;
      return V.nodo({ nombre: 'pata_t' + (lado > 0 ? 'd' : 'i'), pos: [-L * 0.3, -Rh * 0.2, lado * Rh * e.lat * 0.62], rot: rotZ(25 + th), hijos: [
        V.nodo({ malla: MA.esfera(18), esc: [Rh * 0.62, Rh * 0.78, Rh * 0.52], pos: [0, -Rh * 0.2, 0], mat: piel(false) }),
        V.nodo({ malla: MA.capsula(kH * 1.35, kH * 0.8, K * 0.34, 14), mat: piel(false) }),
        V.nodo({ pos: [0, -K * 0.34, 0], rot: rotZ(m1), hijos: [bola(kH * 0.8, [0, 0, 0], piel(false)), V.nodo({ malla: MA.capsula(kH * 0.8, kH * 0.5, K * 0.38, 14), mat: piel(true) }),
          V.nodo({ pos: [0, -K * 0.38, 0], rot: rotZ(m2), hijos: [bola(kH * 0.5, [0, 0, 0], piel(true)), V.nodo({ malla: MA.capsula(kH * 0.5, kH * 0.34, K * 0.33, 14), mat: piel(true) }),
            V.nodo({ pos: [0.012, -K * 0.34, 0], rot: rotZ(-(25 + th + m1 + m2) * 0.9), hijos: [V.nodo({ malla: MA.esfera(12), esc: [kH * 1.0, kH * 0.5, kH * 0.62], pos: [kH * 0.4, -kH * 0.2, 0], mat: pie })] })] })] })] });
    };
    // columna: la mitad trasera y la delantera se doblan en sentidos contrarios (guepardo: casi 10 grados)
    const d = P.S * k * sn(ph), resp = o.torax ? 1 + 0.08 * o.torax * Math.sin(ph * TAU) : 1;
    const cu = e.cuello, ang = cu.ang + (modo === 'galope' ? -3 * k : 0) - (o.cabeza ? 0 : 0), baja = o.cabeza || 0;
    const cuelloAng = ang - baja * 0.8, cabAng = -(baja * 0.5);
    const delantera = V.nodo({ nombre: 'pecho', pos: [0, yT, 0], rot: rotZ(d * 0.6), esc: [resp, 1, resp], hijos: [
      V.nodo({ malla: tramo(e, 0.46, 1, 1, 'delantera'), rot: [0, 0, -PI / 2], esc: [1, 1, 0.84], mat: cuerpoF }),
      ...(o.organos ? [[1, -1].map(l => V.nodo({ nombre: 'pulmon', malla: MA.esfera(20), esc: [L * 0.13, Rc * 0.72, Rc * 0.36], pos: [L * 0.16, Rc * 0.08, l * Rc * 0.4], mat: mat('#ee8fa6', { esp: 0.4, dureza: 30, alfa: 1 }) })), V.nodo({ nombre: 'corazon', malla: MA.esfera(18), esc: [Rc * 0.38, Rc * 0.5, Rc * 0.36], pos: [L * 0.3, -Rc * 0.38, 0], mat: mat('#c1272d', { esp: 0.5, dureza: 40, alfa: 1 }) })].flat() : []),
      pataD(1, ph + fases[1]), pataD(-1, ph + fases[0]),
      V.nodo({ nombre: 'cuello', pos: [L * 0.38, Rc * 0.45, 0], rot: rotZ(90 + cuelloAng), hijos: [
        V.nodo({ malla: MA.capsula(cu.r1, cu.r2, cu.l, 16), mat: piel(false, true) }), bola(cu.r1, [0, 0, 0], piel(false, true)),
        ...(o.collar ? [V.nodo({ malla: MA.toro(cu.r1 * 0.9, cu.r1 * 0.16, 24, 10), pos: [0, -cu.l * 0.38, 0], mat: mat('#15181c') }), V.nodo({ malla: MA.caja(cu.r1 * 0.9, cu.r1 * 0.55, cu.r1 * 0.9, cu.r1 * 0.12), pos: [0, -cu.l * 0.38 + cu.r1 * 0.2, cu.r1 * 1.05], rot: [0, 0, 0], mat: mat('#2b3037') }), V.nodo({ malla: MA.esfera(8), esc: cu.r1 * 0.1, pos: [cu.r1 * 0.34, -cu.l * 0.38 + cu.r1 * 0.3, cu.r1 * 1.45], mat: mat('#5be08a', { tipo: 'plano' }) })] : []),
        ...(o.organos ? [V.nodo({ malla: MA.capsula(cu.r2 * 0.26, cu.r2 * 0.26, cu.l * 0.78, 12), pos: [0, cu.r1 * 0.2, 0], mat: mat('#f3d9e0', { esp: 0.5, dureza: 40, alfa: 1 }) })] : []),
        V.nodo({ pos: [0, -cu.l, 0], rot: rotZ(-(90 + cuelloAng) - cabAng - (e.h > 1 ? 10 : 22)), hijos: [cabeza(e, o, mats)] })] })] });
    const colaL = e.cola.l, tr = e.cola.r, ts = 0.22 * k * sn(ph + 0.25) + 0.03 * Math.sin(ph * TAU * 2);
    const cola = V.nodo({ nombre: 'cola', pos: [-L * 0.5, Rh * 0.3, 0], rot: rotZ(-90 - 16 + ts * 45), hijos: [
      V.nodo({ malla: MA.capsula(tr, tr * 0.8, colaL * 0.5, 10), mat: piel(false) }),
      V.nodo({ pos: [0, -colaL * 0.5, 0], rot: rotZ(ts * 45 + 12), hijos: [V.nodo({ malla: MA.capsula(tr * 0.8, e.manchas ? tr * 0.7 : tr * 0.5, colaL * 0.5, 10), mat: e.manchas ? mats.oscuro : piel(false) }),
        e.manchas ? V.nodo({ malla: MA.capsula(tr * 0.8, tr * 0.8, colaL * 0.1, 10), pos: [0, -colaL * 0.25, 0], mat: mats.claro }) : null ].filter(Boolean) })] });
    const trasera = V.nodo({ nombre: 'grupa', pos: [0, yT, 0], rot: rotZ(-d), hijos: [
      V.nodo({ malla: tramo(e, 0, 0.55, 0.99, 'trasera'), rot: [0, 0, -PI / 2], esc: [1, 1, 0.84], mat: cuerpoR }), pataT(1, ph + fases[3]), pataT(-1, ph + fases[2]), cola] });
    const vientre = V.nodo({ nombre: 'vientre', pos: [0, yT - Rc * 0.2, 0], mat: undefined });
    return V.nodo({ nombre: 'cuadrupedo', pos: (o.pos || [0, 0, 0]).slice(), rot: [0, o.rumbo || 0, 0], esc: o.escala == null ? 1 : o.escala, alfa: o.alfa, hijos: [delantera, trasera, vientre] });
  };
  MO.cuadrupedo.especies = ESP;
  MO.cuadrupedo.zancada = (esp) => (typeof esp === 'string' ? ESP[esp] : esp).paso.zancada;
})(window.VE);
