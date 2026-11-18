/* VOLUMEN — PRIMATES Y PESAS (metros; miran a +X, apoyados en y = 0)
     V.modelos.gorila({ fase, amp, modo, pos, rot, esc, palo, brazoD })   gorila macho de espalda plateada, 1,75 m. modo 'anda' | 'embiste' | 'quieto'
                                                                            fase 0..1 = ciclo de la marcha; amp = amplitud; brazoD = angulo del hombro derecho (rad) si se fuerza; palo = rama en la mano derecha
     V.modelos.barra({ kg, pos, rot, esc })                                 barra olimpica con discos (eje en Z), kg decide los discos
     V.modelos.craneo({ tipo:'humano'|'gorila', mandibula, pos, rot, esc }) craneo y mandibula (mandibula = apertura en rad) */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, sn = Math.sin, cs = Math.cos;
  const liso = (c, e) => Object.assign({ color: c, esp: 0.08, dureza: 8, envolver: 0.4 }, e || {});
  const el = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(24), esc: e3, pos: pos || [0, 0, 0], rot, mat });
  const cap = (r1, r2, l, mat, pos, rot, hijos) => V.nodo({ malla: MA.capsula(r1, r2, l, 16), pos, rot, mat, hijos });
  const PEL = liso('#575049', { esp: 0.2, dureza: 14, envolver: 0.6, borde: 0.45 }), PLA = liso('#b0ada6', { esp: 0.15, dureza: 14, envolver: 0.55, borde: 0.3 }), PIEL = liso('#1c1a19', { esp: 0.4, dureza: 30, envolver: 0.4, borde: 0.3 }), OJO = liso('#2a1608', { esp: 0.8, dureza: 90 }), BLA = liso('#f3eee4', { esp: 0.7, dureza: 90 });
  const HUESO = liso('#e9dfc9', { esp: 0.25, dureza: 30, envolver: 0.3 }), CER = liso('#d98a94', { esp: 0.35, dureza: 24 });

  MO.gorila = function (o = {}) {
    const amp = o.amp == null ? 1 : o.amp, modo = o.modo || 'anda', w = (o.fase || 0) * 2 * PI, em = modo === 'embiste', q = modo === 'quieto';
    const A = q ? 0 : (em ? 0.9 : 0.55) * amp, bob = q ? 0.006 * sn(w) : Math.abs(cs(w)) * (em ? 0.09 : 0.045) * amp;
    const sw = (ph) => A * sn(w + ph), pit = em ? 0.28 : 0.04 + 0.02 * sn(w);
    const brazo = (s, ph, forzado) => {
      const a = forzado != null ? forzado : sw(ph), fl = 0.18 + 0.35 * Math.max(0, -sn(w + ph)) * amp * (q ? 0 : 1);
      const mano = [el(PEL, [0.13, 0.095, 0.1], [0.02, -0.76, 0]), el(PIEL, [0.09, 0.05, 0.085], [0.05, -0.8, 0])];
      if (o.palo && s > 0) mano.push(cap(0.016, 0.012, 1.5, liso('#6b4a2a', { esp: 0.05 }), [0.06, -0.72, 0], [0, 0, 0.5]));
      return V.nodo({ pos: [0.1, 1.3, 0.55 * s], rot: [0, 0, a], hijos: [cap(0.19, 0.15, 0.48, PEL), V.nodo({ pos: [0, -0.46, 0], rot: [0, 0, fl], hijos: [cap(0.15, 0.115, 0.76, PEL), ...mano] })] });
    };
    const pierna = (s, ph) => {
      const a = -sw(ph) * 0.9, fl = 0.35 + 0.5 * Math.max(0, sn(w + ph)) * amp * (q ? 0 : 1);
      return V.nodo({ pos: [-0.02, 0.64, 0.2 * s], rot: [0, 0, a], hijos: [cap(0.18, 0.13, 0.36, PEL), V.nodo({ pos: [0, -0.34, 0], rot: [0, 0, -fl], hijos: [cap(0.125, 0.09, 0.34, PEL), el(PIEL, [0.17, 0.05, 0.1], [0.07, -0.37, 0])] })] });
    };
    const cabeza = V.nodo({ pos: [0.42, 1.58, 0], rot: [0, 0, -0.05 - pit * 0.3], hijos: [
      el(PEL, [0.22, 0.2, 0.19]), el(PEL, [0.2, 0.12, 0.1], [-0.08, 0.18, 0]), el(PEL, [0.1, 0.055, 0.17], [0.14, 0.06, 0]),            // craneo, cresta, arco superciliar
      el(PIEL, [0.14, 0.12, 0.14], [0.18, -0.05, 0]), el(PIEL, [0.16, 0.09, 0.13], [0.12, -0.16, 0]),                                   // hocico y mandibula
      el(liso('#050505', { esp: 0.5 }), [0.025, 0.02, 0.025], [0.31, -0.02, 0.045]), el(liso('#050505', { esp: 0.5 }), [0.025, 0.02, 0.025], [0.31, -0.02, -0.045]),
      el(OJO, [0.028, 0.026, 0.026], [0.2, 0.06, 0.08]), el(OJO, [0.028, 0.026, 0.026], [0.2, 0.06, -0.08])] });
    return V.nodo({ nombre: 'gorila', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ pos: [0, bob, 0], rot: [0, 0, pit], hijos: [
      el(PEL, [0.30, 0.24, 0.30], [0.02, 0.63, 0]), el(PEL, [0.40, 0.52, 0.47], [0.09, 1.0, 0]), el(PEL, [0.30, 0.2, 0.6], [0.08, 1.27, 0]),
      el(PLA, [0.3, 0.34, 0.33], [-0.12, 1.15, 0]),                                                                                      // lomo plateado
      cap(0.13, 0.1, 0.3, PEL, [0.2, 1.52, 0], [0, 0, -0.6]),                                                                            // cuello
      cabeza, brazo(1, 0, o.brazoD), brazo(-1, PI), pierna(1, PI), pierna(-1, 0)] })] });
  };

  MO.barra = function (o = {}) {
    const kg = o.kg == null ? 501 : o.kg, n = Math.max(1, Math.min(8, Math.round(kg / 70))), acero = liso('#b9bdc4', { esp: 0.8, dureza: 90 }), neg = liso('#16171a', { esp: 0.5, dureza: 40 });
    const hijos = [V.nodo({ malla: MA.cilindro(0.014, 0.014, 2.2, 14), rot: [PI / 2, 0, 0], mat: acero })];
    for (const s of [1, -1]) for (let i = 0; i < n; i++) hijos.push(V.nodo({ malla: MA.cilindro(0.225, 0.225, 0.04, 28), rot: [PI / 2, 0, 0], pos: [0, 0, s * (0.5 + i * 0.045)], mat: i % 2 ? liso('#c0392b', { esp: 0.4 }) : neg }));
    return V.nodo({ nombre: 'barra', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  MO.craneo = function (o = {}) {
    const g = o.tipo === 'gorila', ap = o.mandibula || 0, OSC = liso('#17120e', { esp: 0.05, envolver: 0.2 }), DIE = liso('#f7f3ea', { esp: 0.6, dureza: 60 });
    const base = g ? [el(HUESO, [0.2, 0.17, 0.15]), el(HUESO, [0.2, 0.06, 0.04], [-0.04, 0.17, 0]), el(HUESO, [0.09, 0.05, 0.16], [0.13, 0.04, 0]), el(HUESO, [0.15, 0.1, 0.1], [0.2, -0.07, 0]),
        ...[1, -1].map(s => el(OSC, [0.05, 0.05, 0.04], [0.17, 0.01, 0.075 * s])), el(OSC, [0.035, 0.05, 0.03], [0.33, -0.03, 0]),
        ...[-3, -2, -1, 0, 1, 2, 3].map(i => el(DIE, [0.018, 0.028, 0.013], [0.325 - Math.abs(i) * 0.012, -0.135, i * 0.026])),
        ...[1, -1].map(s => el(DIE, [0.014, 0.05, 0.014], [0.3, -0.16, 0.062 * s]))]
      : [el(HUESO, [0.105, 0.115, 0.095]), el(HUESO, [0.06, 0.06, 0.07], [0.07, -0.07, 0]),
        ...[1, -1].map(s => el(OSC, [0.03, 0.03, 0.026], [0.085, 0.01, 0.04 * s])), el(OSC, [0.018, 0.03, 0.016], [0.115, -0.04, 0]),
        ...[-3, -2, -1, 0, 1, 2, 3].map(i => el(DIE, [0.011, 0.016, 0.009], [0.118 - Math.abs(i) * 0.006, -0.108, i * 0.016]))];
    const mand = V.nodo({ pos: g ? [0.04, -0.12, 0] : [0.02, -0.1, 0], rot: [0, 0, -ap], hijos: [el(HUESO, g ? [0.15, 0.04, 0.1] : [0.07, 0.035, 0.065], g ? [0.14, -0.03, 0] : [0.05, -0.02, 0]),
      ...[-3, -2, -1, 0, 1, 2, 3].map(i => el(DIE, g ? [0.016, 0.024, 0.012] : [0.01, 0.014, 0.008], g ? [0.285 - Math.abs(i) * 0.012, 0.0, i * 0.024] : [0.115 - Math.abs(i) * 0.006, 0.01, i * 0.015]))] });
    return V.nodo({ nombre: 'craneo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [...base, mand] });
  };
  /* Cerebro con corteza y cerebelo. r = radio de la esfera equivalente (m); cb = tamano relativo del cerebelo; resalta: 0..1 tine el cerebelo de cian. */
  MO.cerebro = function (o = {}) {
    const r = o.r || 0.0686, cb = o.cb == null ? 0.42 : o.cb, hl = o.resalta || 0, CBM = liso(hl > 0 ? '#5fd0e8' : '#b86a76', { esp: 0.35, dureza: 24, envolver: 0.5 });
    return V.nodo({ nombre: 'cerebro', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      el(CER, [r, r * 0.88, r * 0.95]), el(liso('#c27a86'), [r * 0.5, r * 0.35, r * 0.97], [0, r * 0.5, 0]),
      el(CBM, [r * cb * 1.1, r * cb * 0.8, r * cb * 1.2], [-r * 0.62, -r * 0.52, 0]),                    // cerebelo
      cap(r * 0.12, r * 0.09, r * 0.22, liso('#d9a7ad'), [r * 0.12, -r * 0.62, 0], [0, 0, 0.2])] });         // tronco encefalico
  };
})(window.VE = window.VE || {});
