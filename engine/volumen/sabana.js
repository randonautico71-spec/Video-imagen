/* VOLUMEN — SABANA: animales y objetos para el corto «fragilidad» (todo por codigo; texturas pintadas una vez).
   Convenio: igual que felinos.js (metros, el animal mira a +X, apoyado en y = 0, +Z lado). rz > 0 mueve la pata hacia +X.
     V.modelos.rinoceronte({ marcha: 'quieto'|'camina'|'trote', fase, cab, pos, rot, esc })        rinoceronte negro: 2 cuernos, labio prensil, piel con pliegues
     V.modelos.nu({ cria, levantar 0..1, marcha, fase, cab, pos, rot, esc })                        ñu azul (cria: sin cuernos, pelaje claro; levantar: de tumbado a de pie)
     V.modelos.bebe({ fase, cara: 'sonrie'|'llora'|'neutra', pos, rot, esc })                       bebe gateando (cuerpo ~0,65 m), con rasgos
     V.modelos.mano({ dorso, dedos 0..1 (cerrar), pos, rot, esc })                                  mano humana (largo ~0,19 m): uñas planas, piel fina
     V.modelos.tiburon({ t, boca, pos, rot, esc })                                                  tiburon blanco (4 m): dorso gris, vientre blanco, aletas, branquias
     V.modelos.pulpo({ t, pos, rot, esc })                                                          pulpo comun: manto, ojos de pupila horizontal, 8 brazos que ondulan
     V.modelos.acacia({ semilla, esc, pos })  ·  V.modelos.lanza({ pos, rot, esc })  ·  V.modelos.suelo_sabana({ r, clave })
     V.fondo.sabana(esc, cam, { hora: 'atardecer'|'dia'|'alba' })   cielo, sol y colinas lejanas con la linea del horizonte de la camara */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, M4 = V.m4, PI = Math.PI, sn = Math.sin, cs = Math.cos, mx = Math.max;
  const c01 = (v) => Math.max(0, Math.min(1, v)), mez = (a, b, p) => a + (b - a) * p, suave = (p) => p * p * (3 - 2 * p);
  const mt = (mapa, extra) => Object.assign({ color: '#ffffff', mapa, esp: 0.05, dureza: 10, envolver: 0.4, borde: 0.2 }, extra || {});
  const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
  const elip = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(28), esc: e3, pos: pos || [0, 0, 0], rot, mat });
  const eje = (a, b, c, pos, mat, rot) => V.nodo({ malla: MA.esfera(40), esc: [a, b, c], pos, rot: rot || [0, 0, PI / 2], mat });   // a = alto, b = largo (X), c = ancho
  /* trazos de pelo / pliegues sobre una textura */
  const fibras = (x, W, H, n, cols, len, sem, a0 = 0.07, a1 = 0.22, ancho = 1.2) => { const r = VE.rng(sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = len * (0.5 + r()); x.globalAlpha = a0 + r() * (a1 - a0); x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = ancho * (0.6 + r());
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 3, y0 + l); x.stroke(); } x.globalAlpha = 1; };
  const patas = (marcha, ph) => {           // ciclo de paso diagonal: [hombro, rodilla] por pata
    const A = marcha === 'trote' ? 0.55 : marcha === 'camina' ? 0.36 : 0, k = marcha === 'trote' ? 0.6 : 0.4, d = (f, off) => [A * sn(f), -k * mx(0, sn(f + 1.6))];
    return { fl: d(ph), fr: d(ph + PI), hl: d(ph + PI), hr: d(ph), bob: marcha === 'quieto' ? 0.003 * sn(ph * 0.5) : 0.02 * sn(2 * ph) };
  };

  // ================================================================= RINOCERONTE NEGRO
  MO.rinoceronte = function (o = {}) {
    const marcha = o.marcha || 'quieto', ph = (o.fase || 0) * 2 * PI, cab = o.cab == null ? -0.28 : o.cab, P = patas(marcha, ph);
    const tex = V.textura('sab|rino|piel', 1024, 512, (x, W, H) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6f6d69'); g.addColorStop(0.55, '#7f7b75'); g.addColorStop(1, '#948d84'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('rino|piel');
      for (let i = 0; i < 150; i++) { x.globalAlpha = 0.07 + r() * 0.12; x.fillStyle = r() < 0.6 ? '#a58f6f' : '#5d554d'; x.beginPath(); x.ellipse(r() * W, r() * H, 20 + r() * 70, 10 + r() * 40, r() * 3, 0, 7); x.fill(); }   // barro y sombras
      x.lineCap = 'round'; for (let i = 0; i < 70; i++) { const y0 = r() * H, x0 = r() * W, l = 60 + r() * 220; x.globalAlpha = 0.1 + r() * 0.14; x.strokeStyle = '#3f3831'; x.lineWidth = 2 + r() * 3;       // pliegues
        x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + l * 0.3, y0 + (r() - 0.5) * 24, x0 + l * 0.7, y0 + (r() - 0.5) * 24, x0 + l, y0 + (r() - 0.5) * 10); x.stroke();
        x.globalAlpha *= 0.5; x.strokeStyle = '#c9bca9'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0, y0 + 5); x.bezierCurveTo(x0 + l * 0.3, y0 + 5, x0 + l * 0.7, y0 + 5, x0 + l, y0 + 6); x.stroke(); }
      for (let i = 0; i < 9000; i++) { x.globalAlpha = 0.05 + r() * 0.08; x.fillStyle = r() < 0.5 ? '#2d2823' : '#d9cdb9'; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); } x.globalAlpha = 1;
    });
    const texCuerno = V.textura('sab|rino|cuerno', 128, 256, (x, W, H) => { x.fillStyle = '#4b4239'; x.fillRect(0, 0, W, H); fibras(x, W, H, 900, ['#2a231d', '#7a6d5e', '#3a3129'], 60, 'cuerno', 0.2, 0.5, 1.6);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(1, 'rgba(255,255,255,0.18)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
    const mR = mt(tex, { esp: 0.07, dureza: 14, envolver: 0.35 }), mC = mt(texCuerno, { esp: 0.25, dureza: 30 }), pezuña = liso('#2a2420', { esp: 0.2 });
    const pata = (xx, z, ang, del) => {
      const pie = V.nodo({ pos: [0, -0.3, 0], rot: [0, 0, ang[1] * -0.3], hijos: [elip(pezuña, [0.17, 0.07, 0.15], [0.04, -0.03, 0]), ...[-1, 0, 1].map(i => elip(liso('#17120f', { esp: 0.3 }), [0.05, 0.045, 0.045], [0.18, -0.03, i * 0.075]))] });
      const baja = V.nodo({ pos: [0, -0.42, 0], rot: [0, 0, ang[1]], hijos: [elip(mR, [0.16, 0.14, 0.15], [0, 0, 0]), V.nodo({ malla: MA.capsula(0.145, 0.115, 0.3, 20), mat: mR }), pie] });
      return V.nodo({ pos: [xx, 0.72, z], rot: [0, 0, ang[0]], hijos: [elip(mR, del ? [0.27, 0.32, 0.2] : [0.3, 0.34, 0.2], [0, 0.1, 0]), V.nodo({ malla: MA.capsula(0.22, 0.15, 0.42, 22), mat: mR }), baja] });
    };
    const horn = (x0, y0, r, len, tilt) => { const dx = -sn(tilt) * len / 2, dy = cs(tilt) * len / 2; return V.nodo({ malla: MA.cilindro(r, r * 0.12, len, 20), pos: [x0 + dx, y0 + dy, 0], rot: [0, 0, tilt], mat: mC }); };
    const ojo = (s) => V.nodo({ pos: [0.5, 0.1, s * 0.205], hijos: [elip(liso('#4a4038'), [0.05, 0.035, 0.03], [0, 0.005, 0]), elip(liso('#0c0907', { esp: 0.9, dureza: 100 }), [0.03, 0.03, 0.02], [0.012, 0, s * 0.012]), elip(liso('#ffffff', { esp: 1, dureza: 120 }), [0.008, 0.008, 0.006], [0.025, 0.012, s * 0.02])] });
    const oreja = (s) => V.nodo({ pos: [0.04, 0.27, s * 0.16], rot: [s * 0.45, 0, -0.1], hijos: [elip(mR, [0.07, 0.15, 0.04], [0, 0.07, 0]), elip(liso('#4b3b33'), [0.045, 0.11, 0.02], [0.012, 0.07, s * -0.012]), elip(liso('#2b221d'), [0.05, 0.04, 0.03], [0, 0.22, 0])] });
    const cabeza = V.nodo({ pos: [1.6, 0.98, 0], rot: [0, 0, cab], hijos: [
      eje(0.3, 0.52, 0.25, [0.28, 0, 0], mR), elip(mR, [0.22, 0.2, 0.2], [0.66, -0.08, 0]), elip(mR, [0.12, 0.09, 0.17], [0.88, -0.17, 0]),
      V.nodo({ pos: [0.9, -0.06, 0], rot: [0, 0, -0.5], hijos: [elip(mR, [0.07, 0.13, 0.13], [0, -0.07, 0])] }),   // labio superior prensil (rinoceronte negro)
      elip(liso('#2a211c', { esp: 0.4 }), [0.03, 0.016, 0.02], [0.95, -0.06, 0.06]), elip(liso('#2a211c', { esp: 0.4 }), [0.03, 0.016, 0.02], [0.95, -0.06, -0.06]),
      horn(0.86, -0.04, 0.13, 0.62, 0.38), horn(0.46, 0.22, 0.085, 0.3, 0.2), ojo(1), ojo(-1), oreja(1), oreja(-1)] });
    const tronco = V.nodo({ pos: [0, P.bob, 0], hijos: [
      eje(0.6, 1.3, 0.54, [0, 1.02, 0], mR), eje(0.66, 0.62, 0.56, [0.62, 1.05, 0], mR), eje(0.62, 0.56, 0.52, [-0.7, 1.02, 0], mR), elip(mR, [0.42, 0.44, 0.38], [1.22, 1.1, 0]),
      pata(0.72, 0.3, P.fl, true), pata(0.72, -0.3, P.fr, true), pata(-0.76, 0.3, P.hl, false), pata(-0.76, -0.3, P.hr, false), cabeza,
      V.nodo({ pos: [-1.28, 1.22, 0], rot: [0, 0, 0.12 + 0.1 * sn(ph)], hijos: [V.nodo({ malla: MA.capsula(0.045, 0.03, 0.75, 12), mat: mR }), elip(liso('#2b221c'), [0.05, 0.11, 0.05], [0, -0.78, 0])] })] });
    return V.nodo({ nombre: 'rinoceronte', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [tronco] });
  };
  MO.rinoceronte.cabeza = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc || 1; return [p[0] + 1.9 * e, p[1] + 0.95 * e, p[2]]; };
  MO.rinoceronte.cuerno = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc || 1; return [p[0] + 2.38 * e, p[1] + 1.12 * e, p[2]]; };

  // ================================================================= ÑU AZUL (adulto y cria)
  MO.nu = function (o = {}) {
    const cria = !!o.cria, lev = o.levantar == null ? 1 : c01(o.levantar), marcha = o.marcha || 'quieto', ph = (o.fase || 0) * 2 * PI, cab = o.cab == null ? -0.1 : o.cab, k = cria ? 0.62 : 1;
    const nom = cria ? 'cria' : 'adulto';
    const tex = V.textura('sab|nu|' + nom, 1024, 512, (x, W, H) => {
      const base = cria ? ['#a98a63', '#c2a67f', '#e1d2b3'] : ['#6c6862', '#7a766f', '#a8a39a'], r = VE.rng('nu|' + nom);
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, base[0]); g.addColorStop(0.25, base[1]); g.addColorStop(0.5, base[0]); g.addColorStop(0.75, base[2]); g.addColorStop(1, base[0]); x.fillStyle = g; x.fillRect(0, 0, W, H);
      fibras(x, W, H, 24000, [base[0], base[1], '#2d2a27', base[2]], 11, 'nupelo' + nom, 0.06, 0.2, 1);
      if (!cria) for (let i = 0; i < 26; i++) { const xx = (0.04 + 0.42 * r()) * W, yy = H * (0.05 + r() * 0.9), l = 30 + r() * 90; x.globalAlpha = 0.3 + r() * 0.4; x.strokeStyle = '#2a2725'; x.lineWidth = 3 + r() * 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + (r() - 0.5) * 12, yy + l); x.stroke(); }   // rayas oscuras del cuello y paleta
      x.globalAlpha = 1; });
    const mP = mt(tex, { esp: 0.05, dureza: 10 }), mN = liso(cria ? '#2b2420' : '#1b1917', { esp: 0.12, dureza: 14, envolver: 0.35 }), mCar = mt(V.textura('sab|nu|cara|' + nom, 256, 256, (x, W, H) => { x.fillStyle = cria ? '#3a2e26' : '#1d1b19'; x.fillRect(0, 0, W, H); fibras(x, W, H, 2500, ['#000', '#3a3632', '#12100f'], 8, 'nucara', 0.15, 0.4, 1); }), { esp: 0.1 });
    const ease = suave(lev), over = (1 - lev) * 0.18 * sn(lev * 9) * lev;      // pequeño tambaleo al ponerse en pie
    const mixA = (de, a) => [mez(de[0], a[0], ease) + over, mez(de[1], a[1], ease) - over];
    const P = patas(lev >= 1 ? marcha : 'quieto', ph);
    const fl = lev >= 1 ? P.fl : mixA([1.35, -2.5], P.fl), fr = lev >= 1 ? P.fr : mixA([1.2, -2.4], P.fr), hl = lev >= 1 ? P.hl : mixA([-1.25, 2.3], P.hl), hr = lev >= 1 ? P.hr : mixA([-1.1, 2.2], P.hr);
    const yAlto = cria ? 1.0 : 1.0, yb = lev >= 1 ? P.bob : mez(-0.62, 0, ease);
    const L1 = 0.5, L2 = 0.45, rr = (cria ? 0.075 : 0.085);
    const pata = (xx, z, ang, del) => V.nodo({ pos: [xx, 0.98, z], rot: [0, 0, ang[0]], hijos: [elip(mP, del ? [0.17, 0.22, 0.13] : [0.19, 0.26, 0.13], [0, 0.04, 0]), V.nodo({ malla: MA.capsula(rr * 1.5, rr, L1, 18), mat: mP }),
      V.nodo({ pos: [0, -L1, 0], rot: [0, 0, ang[1]], hijos: [elip(mP, [rr * 1.1, rr * 1.1, rr * 1.1]), V.nodo({ malla: MA.capsula(rr, rr * 0.62, L2, 16), mat: mP }),
        V.nodo({ pos: [0, -L2, 0], hijos: [elip(liso('#17130f', { esp: 0.4 }), [0.05, 0.05, 0.05], [0.02, -0.03, 0.012]), elip(liso('#17130f', { esp: 0.4 }), [0.05, 0.05, 0.05], [0.02, -0.03, -0.012])] })] })] });
    const cuerno = (s) => { const pts = [[0, 0.09, s * 0.07], [-0.02, 0.12, s * 0.2], [0, 0.1, s * 0.34], [0.04, 0.14, s * 0.43], [0.05, 0.26, s * 0.43], [0.02, 0.38, s * 0.37]];
      return V.nodo({ malla: MA.tubo(pts, (t) => 0.04 * (1 - t) + 0.011, 10, { clave: 'nucuerno' + s }), mat: liso('#2c2924', { esp: 0.45, dureza: 40 }) }); };
    const ojo = (s) => V.nodo({ pos: [0.17, 0.07, s * 0.115], hijos: [elip(liso('#c6b9a0'), [0.035, 0.03, 0.02]), elip(liso('#0b0908', { esp: 0.9, dureza: 100 }), [0.026, 0.026, 0.02], [0.01, 0, s * 0.006])] });
    const barba = []; for (let i = 0; i < 9; i++) barba.push(elip(mN, [0.045, 0.09 - i * 0.003, 0.05], [0.14 - i * 0.012, -0.12 - (i % 3) * 0.02, (i % 3 - 1) * 0.035]));
    const cabezaN = V.nodo({ pos: [0.95, 1.55, 0], rot: [0, 0, cab - 0.55], hijos: [
      eje(0.15, 0.32, 0.12, [0.16, 0, 0], mCar), elip(mCar, [0.145, 0.12, 0.17], [0.42, -0.02, 0]), elip(liso('#0f0e0d', { esp: 0.5 }), [0.025, 0.018, 0.03], [0.56, 0.05, 0.06]), elip(liso('#0f0e0d', { esp: 0.5 }), [0.025, 0.018, 0.03], [0.56, 0.05, -0.06]),
      ojo(1), ojo(-1), V.nodo({ pos: [0.0, 0.1, 0.1], rot: [0.6, 0, 0.3], hijos: [elip(mP, [0.035, 0.1, 0.02], [0, 0.05, 0])] }), V.nodo({ pos: [0.0, 0.1, -0.1], rot: [-0.6, 0, 0.3], hijos: [elip(mP, [0.035, 0.1, 0.02], [0, 0.05, 0])] }),
      ...(cria ? [] : [cuerno(1), cuerno(-1), ...barba])] });
    const cuello = V.nodo({ pos: [0.68, 1.12, 0], rot: [0, 0, 2.3], hijos: [V.nodo({ malla: MA.capsula(0.2, 0.15, 0.5, 20), mat: mP })] });
    const melena = []; if (!cria) for (let i = 0; i < 10; i++) { const u = i / 9; melena.push(elip(mN, [0.05, 0.12, 0.045], [mez(0.62, 0.0, 1 - u) - 0.1 * (1 - u) * 0, mez(1.55, 1.46, u) - 0.07 * (1 - u), 0])); }
    const tronco = V.nodo({ pos: [0, 0, 0], hijos: [V.nodo({ pos: [0, yb, 0], rot: [0, 0, 0.07], hijos: [
      eje(0.34, 0.62, 0.24, [0, 1.15, 0], mP), eje(0.4, 0.36, 0.27, [0.46, 1.19, 0], mP), eje(0.31, 0.3, 0.22, [-0.52, 1.1, 0], mP), cuello, ...melena,
      pata(0.46, 0.14, fl, true), pata(0.46, -0.14, fr, true), pata(-0.5, 0.13, hl, false), pata(-0.5, -0.13, hr, false), cabezaN,
      V.nodo({ pos: [-0.78, 1.2, 0], rot: [0, 0, 0.1 + 0.08 * sn(ph)], hijos: [V.nodo({ malla: MA.capsula(0.03, 0.025, 0.5, 10), mat: mN }), elip(mN, [0.07, 0.24, 0.06], [0, -0.62, 0])] })] })] });
    return V.nodo({ nombre: 'nu_' + nom, pos: o.pos, rot: o.rot, esc: (o.esc || 1) * k, hijos: [tronco] });
  };

  // ================================================================= BEBE GATEANDO
  MO.bebe = function (o = {}) {
    const ph = (o.fase || 0) * 2 * PI, cara = o.cara || 'sonrie';
    const piel = V.textura('sab|bebe|piel', 256, 256, (x, W, H) => { x.fillStyle = '#e9b790'; x.fillRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7); g.addColorStop(0, 'rgba(255,225,200,0.5)'); g.addColorStop(1, 'rgba(190,110,80,0.25)'); x.fillStyle = g; x.fillRect(0, 0, W, H); fibras(x, W, H, 1500, ['#d99f78', '#f6cfb0'], 4, 'bebe', 0.05, 0.14, 1); });
    const mS = mt(piel, { esp: 0.2, dureza: 22, envolver: 0.55, borde: 0.1 }), mPañal = liso('#f3f1ea', { esp: 0.1, envolver: 0.5 }), mPelo = liso('#2b1b12', { esp: 0.15, envolver: 0.5 });
    const brazo = (s, f) => { const a = 0.5 * sn(f); return V.nodo({ pos: [0.2, 0.29, s * 0.105], rot: [0, 0, a], hijos: [V.nodo({ malla: MA.capsula(0.034, 0.028, 0.14, 16), mat: mS }), V.nodo({ pos: [0, -0.14, 0], rot: [0, 0, -0.35 * mx(0, sn(f + 1.6)) - 0.1], hijos: [V.nodo({ malla: MA.capsula(0.028, 0.024, 0.11, 16), mat: mS }), elip(mS, [0.036, 0.022, 0.03], [0.012, -0.12, 0])] })] }); };
    const pierna = (s, f) => { const a = 1.15 + 0.45 * sn(f); return V.nodo({ pos: [-0.2, 0.2, s * 0.09], rot: [0, 0, a], hijos: [V.nodo({ malla: MA.capsula(0.05, 0.04, 0.17, 16), mat: mS }), V.nodo({ pos: [0, -0.17, 0], rot: [0, 0, -1.95 - 0.3 * sn(f + 0.8)], hijos: [V.nodo({ malla: MA.capsula(0.04, 0.03, 0.15, 16), mat: mS }), elip(mS, [0.03, 0.03, 0.045], [0.0, -0.16, 0])] })] }); };
    const lloro = cara === 'llora', sonrie = cara === 'sonrie';
    const ojo = (s) => V.nodo({ pos: [0.088, 0.02, s * 0.052], hijos: lloro ? [elip(liso('#2a1710'), [0.014, 0.004, 0.016], [0.0, 0, 0], [0, 0, 0.25 * s]), elip(liso('#8fd0ff', { esp: 0.9, dureza: 90, alfa: 0.8 }), [0.008, 0.02, 0.008], [0.004, -0.04, s * 0.01])] :
      [elip(liso('#fbf8f3'), [0.022, 0.026, 0.02]), elip(liso('#4b2c1b', { esp: 0.8, dureza: 90 }), [0.016, 0.018, 0.013], [0.01, 0, s * 0.004]), elip(liso('#050403', { esp: 0.9, dureza: 100 }), [0.008, 0.009, 0.007], [0.017, 0, s * 0.006]), elip(liso('#ffffff', { esp: 1, dureza: 120 }), [0.004, 0.004, 0.003], [0.02, 0.006, s * 0.01])] });
    const cabeza = V.nodo({ pos: [0.3, 0.33, 0], rot: [0, 0, 0.35 - 0.1 * sn(ph)], hijos: [
      elip(mS, [0.105, 0.108, 0.098], [0.04, 0.03, 0]), elip(mS, [0.075, 0.07, 0.085], [0.06, -0.02, 0]),
      elip(mPelo, [0.07, 0.04, 0.07], [0.0, 0.115, 0]), elip(mPelo, [0.02, 0.05, 0.015], [0.04, 0.15, 0]),       // mechon
      ojo(1), ojo(-1), elip(liso('#d99d7c', { esp: 0.3 }), [0.017, 0.014, 0.016], [0.112, -0.015, 0]),             // nariz
      elip(liso('#e9908c', { esp: 0.1 }), [0.026, 0.02, 0.02], [0.095, -0.012, 0.075], [0, 0.5, 0]), elip(liso('#e9908c', { esp: 0.1 }), [0.026, 0.02, 0.02], [0.095, -0.012, -0.075], [0, -0.5, 0]),  // mejillas
      elip(liso(lloro ? '#4a0f12' : '#b8514f', { esp: 0.4 }), lloro ? [0.012, 0.028, 0.03] : [0.01, sonrie ? 0.012 : 0.008, sonrie ? 0.036 : 0.026], [0.108, -0.058, 0]),   // boca
      elip(mS, [0.016, 0.026, 0.01], [0.04, 0.02, 0.1]), elip(mS, [0.016, 0.026, 0.01], [0.04, 0.02, -0.1])] });         // orejas
    const tronco = V.nodo({ pos: [0, 0.01 * sn(2 * ph), 0], hijos: [
      V.nodo({ malla: MA.capsula(0.105, 0.095, 0.34, 24), pos: [-0.1, 0.25, 0], rot: [0, 0, PI / 2 + 0.07], mat: mS }), elip(mPañal, [0.11, 0.1, 0.115], [-0.14, 0.22, 0]),
      brazo(1, ph), brazo(-1, ph + PI), pierna(1, ph + PI), pierna(-1, ph), cabeza] });
    return V.nodo({ nombre: 'bebe', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [tronco] });
  };
  MO.bebe.cabeza = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc || 1; return [p[0] + 0.34 * e, p[1] + 0.38 * e, p[2]]; };

  // ================================================================= MANO HUMANA
  MO.mano = function (o = {}) {
    const dorso = o.dorso !== false, cur = c01(o.dedos || 0), nom = 'mano';
    const piel = V.textura('sab|mano|piel', 256, 256, (x, W, H) => { x.fillStyle = '#e3b896'; x.fillRect(0, 0, W, H); fibras(x, W, H, 2500, ['#cf9d79', '#f3d0b4', '#b98563'], 6, 'mano', 0.05, 0.12, 1);
      x.strokeStyle = 'rgba(120,70,45,0.05)'; x.lineWidth = 1.2; for (let i = 0; i < 14; i++) { const y = (i + 0.5) / 14 * H; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + sn(i) * 2); x.stroke(); } });
    const mS = mt(piel, { esp: 0.25, dureza: 24, envolver: 0.6, borde: 0.15 }), mUña = liso('#f3d6c9', { esp: 0.7, dureza: 70, envolver: 0.3, borde: 0.2 }), z = dorso ? 1 : -1;
    // dedos como cadenas de tres falanges que se doblan hacia la palma (eje Z)
    const falange = (r, l, flex, hijo) => V.nodo({ rot: [flex * -z, 0, 0], hijos: [V.nodo({ malla: MA.capsula(r, r * 0.9, l, 14), rot: [0, 0, PI], mat: mS }), elip(mS, [r * 0.98, r * 0.98, r * 0.98], [0, l, 0]), hijo ? V.nodo({ pos: [0, l, 0], hijos: [hijo] }) : null].filter(Boolean) });
    const uña = (r, l) => V.nodo({ pos: [0, l * 0.82, z * r * 0.78], hijos: [V.nodo({ malla: MA.caja(r * 1.7, l * 0.62, r * 0.26, r * 0.1), mat: mUña }), V.nodo({ malla: MA.caja(r * 1.7, l * 0.07, r * 0.3, r * 0.1), pos: [0, -l * 0.2, 0], mat: liso('#e8c7b3', { esp: 0.3 }) })] });
    const dedoC = (x0, y0, largo, r, ang, k) => { const a = largo * 0.44, b = largo * 0.3, c = largo * 0.26, f = cur * k;
      return V.nodo({ pos: [x0, y0, 0], rot: [0, 0, ang], hijos: [falange(r, a, f * 1.2, falange(r * 0.92, b, f * 1.4, V.nodo({ hijos: [falange(r * 0.84, c, f * 1.0, null), uña(r * 0.84, c)] })))] }); };
    const dedos = [dedoC(-0.034, 0.088, 0.078, 0.0105, 0.05, 1), dedoC(-0.011, 0.094, 0.088, 0.011, 0.0, 1), dedoC(0.011, 0.091, 0.082, 0.0105, -0.03, 1), dedoC(0.032, 0.083, 0.064, 0.0095, -0.08, 1)];
    const pulgar = V.nodo({ pos: [-0.045, 0.02, 0], rot: [0, 0, 0.95 + cur * 0.4], hijos: [falange(0.0115, 0.04, cur * 0.5, falange(0.0105, 0.036, cur * 0.8, V.nodo({ hijos: [falange(0.0105, 0.01, 0, null), uña(0.0115, 0.04)] })))] });
    const palma = [V.nodo({ malla: MA.caja(0.088, 0.098, 0.03, 0.014), pos: [0, 0.046, 0], mat: mS }), V.nodo({ malla: MA.caja(0.07, 0.07, 0.034, 0.016), pos: [0, 0.0, 0], mat: mS })];
    const muñeca = V.nodo({ malla: MA.capsula(0.034, 0.039, 0.2, 20), pos: [0, 0.01, 0], rot: [0, 0, 0], mat: mS });
    return V.nodo({ nombre: nom, pos: o.pos, rot: o.rot, esc: o.esc, hijos: [...palma, muñeca, ...dedos, pulgar] });
  };
  MO.mano.punta = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc || 1; return [p[0], p[1] + 0.185 * e, p[2]]; };

  // ================================================================= TIBURON BLANCO
  MO.tiburon = function (o = {}) {
    const t = o.t || 0, ph = t * 2 * PI * 0.7, boca = c01(o.boca || 0), L = 4.0, nom = o.id || 'tib';
    const tex = V.textura('sab|tib|piel', 512, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#4f6672'); g.addColorStop(0.2, '#617986'); g.addColorStop(0.3, '#b9c6cd'); g.addColorStop(0.36, '#eef2f2'); g.addColorStop(0.64, '#eef2f2'); g.addColorStop(0.7, '#b9c6cd'); g.addColorStop(0.8, '#617986'); g.addColorStop(1, '#4f6672');
      x.fillStyle = g; x.fillRect(0, 0, W, H); fibras(x, W, H, 6000, ['#3d525d', '#9db0ba', '#ffffff'], 5, 'tib', 0.04, 0.12, 1); });
    const mS = mt(tex, { esp: 0.5, dureza: 55, envolver: 0.35, borde: 0.15 }), mA = liso('#566b77', { esp: 0.35, dureza: 40, envolver: 0.3 });
    const perfil = (u) => 0.43 * Math.pow(sn(PI * Math.pow(u, 0.82)), 0.8) * (0.25 + 0.75 * c01(u * 3.2));        // radio relativo (u: 0 cola, 1 morro)
    const doblez = (x) => 0.2 * sn(ph - x * 2.2) * (0.35 + 0.65 * c01((0.5 - x) * 1.8 + 0.4)) * (x < 0.15 ? 1 : 0.6);   // x en [-0.5..0.5] a lo largo
    const f = (u, v) => { const a = v * 2 * PI, r = perfil(u) * 0.62, xx = (u - 0.5) * L * 0.88, y = r * cs(a) * (cs(a) > 0 ? 1.0 : 0.8), zz = r * sn(a) * 0.92 + doblez(u - 0.5) * 0 + 0.2 * sn(ph - (u - 0.5) * 6.3) * (1 - u) * (1 - u) * L * 0.2;
      return [xx, y, zz]; };
    const cuerpo = V.nodo({ malla: MA.parametrica(70, 28, f, { dinamica: 'tib_' + nom }), mat: mS });
    const zCola = 0.2 * sn(ph + 3.2) * L * 0.2, angCola = 0.45 * sn(ph + 3.2);
    const poli = (pts, prof, clave) => V.nodo({ malla: MA.extrusion(pts, prof, clave), mat: mA });
    const dorsal = V.nodo({ pos: [0.1, 0.27, 0], hijos: [poli([[-0.4, 0], [0.5, 0], [0.3, 0.2], [0.14, 0.45], [-0.02, 0.78], [-0.18, 0.4], [-0.3, 0.12]], 0.03, 'tib|dorsal')] });
    const pectoral = (s) => V.nodo({ pos: [0.55, -0.13, s * 0.22], rot: [s * 1.0, s * 0.2, -0.55], hijos: [poli([[0, 0], [0.55, 0], [0.45, -0.1], [-0.25, -0.62], [-0.3, -0.5], [-0.15, -0.2]], 0.03, 'tib|pect')] });
    const cola = V.nodo({ pos: [-L * 0.44, 0.0, zCola], rot: [0, angCola, 0], hijos: [poli([[0.12, 0], [-0.05, 0.1], [-0.35, 0.75], [-0.6, 0.78], [-0.5, 0.3], [-0.52, 0], [-0.38, -0.34], [-0.1, -0.4], [0.1, -0.12]], 0.035, 'tib|cola')] });
    const pelvica = V.nodo({ pos: [-0.75, -0.2, 0], hijos: [poli([[0, 0], [0.18, 0], [-0.12, -0.26]], 0.5, 'tib|pelv')] });
    const ojo = (s) => V.nodo({ pos: [L * 0.31, 0.1, s * 0.2], hijos: [elip(liso('#0a0b0c', { esp: 0.9, dureza: 120 }), [0.055, 0.055, 0.04]), elip(liso('#fff', { esp: 1, dureza: 140 }), [0.012, 0.012, 0.008], [0.025, 0.02, s * 0.03])] });
    const branq = []; for (const s of [-1, 1]) for (let i = 0; i < 5; i++) branq.push(V.nodo({ pos: [L * 0.14 - i * 0.075, 0.03 - Math.abs(i - 2) * 0.01, s * 0.255 - s * 0.0], rot: [0, 0, 0.25], hijos: [elip(liso('#20262b', { esp: 0.2 }), [0.012, 0.13, 0.012], [0, 0, 0], [s * 0.3, 0, 0])] }));
    const dientes = []; if (boca > 0.01) for (let i = -4; i <= 4; i++) dientes.push(V.nodo({ malla: MA.cilindro(0.022, 0, 0.12, 6), pos: [L * 0.36 - Math.abs(i) * 0.025, -0.17 - boca * 0.04, i * 0.043], rot: [0, 0, PI], mat: liso('#f6f1e4', { esp: 0.6, dureza: 60 }) }));
    const boc = V.nodo({ pos: [L * 0.35, -0.16, 0], rot: [0, 0, -boca * 0.45], hijos: [elip(liso('#8c1e24', { esp: 0.3 }), [0.17, 0.02 + boca * 0.08, 0.15], [-0.03, 0, 0]), elip(liso('#17090a'), [0.18, 0.012, 0.16], [-0.03, 0.01 + boca * 0.04, 0])] });
    return V.nodo({ nombre: 'tiburon', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [cuerpo, dorsal, pectoral(1), pectoral(-1), cola, pelvica, ojo(1), ojo(-1), ...branq, boc, ...dientes] });
  };
  MO.tiburon.aleta = (o = {}) => { const p = o.pos || [0, 0, 0], e = o.esc || 1; return [p[0] + 0.0 * e, p[1] + 0.95 * e, p[2]]; };

  // ================================================================= PULPO
  MO.pulpo = function (o = {}) {
    const t = o.t || 0, ph = t * 2 * PI * 0.5, nom = o.id || 'pul';
    const tex = V.textura('sab|pulpo|piel', 256, 256, (x, W, H) => { x.fillStyle = '#c9503a'; x.fillRect(0, 0, W, H); const r = VE.rng('pulpo'); for (let i = 0; i < 700; i++) { x.globalAlpha = 0.1 + r() * 0.3; x.fillStyle = ['#e07a52', '#8f2f24', '#f0a27a', '#a53b2d'][Math.floor(r() * 4)]; x.beginPath(); x.arc(r() * W, r() * H, 1.5 + r() * 5, 0, 7); x.fill(); } x.globalAlpha = 1; });
    const mS = mt(tex, { esp: 0.5, dureza: 45, envolver: 0.5, borde: 0.3, fresnel: 0.2 }), mV = liso('#f2c8b0', { esp: 0.6, dureza: 60 });
    const manto = V.nodo({ malla: MA.esfera(32), esc: [0.34, 0.5, 0.34], pos: [0, 0.55, -0.12], rot: [0.5, 0, 0], mat: mS });
    const cab = elip(mS, [0.3, 0.27, 0.3], [0, 0.2, 0.0]);
    const ojo = (s) => V.nodo({ pos: [s * 0.23, 0.27, 0.12], hijos: [elip(mS, [0.1, 0.1, 0.09]), elip(liso('#d9b24a', { esp: 0.8, dureza: 90 }), [0.075, 0.075, 0.03], [s * 0.025, 0.0, 0.065]), elip(liso('#050403', { esp: 0.9, dureza: 110 }), [0.06, 0.012, 0.02], [s * 0.025, 0, 0.085])] });
    const brazos = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * PI, dx = cs(a), dz = sn(a), pts = []; const lon = 1.25 + 0.15 * sn(i * 2.3);
      for (let j = 0; j <= 18; j++) { const s = j / 18, r = 0.14 + 0.62 * s, curl = 0.35 * sn(ph * 1.3 + i * 0.9 - s * 4.2) * s * (1 + s), alt = 0.06 - 0.3 * Math.pow(s, 1.5) + 0.12 * s * sn(ph + i) - 0.0;
        pts.push([dx * r * lon * 0.85 + (-dz) * curl * 0.5, 0.04 + alt * 0.5 - 0.02 * s * s * 4 + 0.02, dz * r * lon * 0.85 + dx * curl * 0.5]); }
      brazos.push(V.nodo({ malla: MA.tubo(pts, (u) => 0.082 * Math.pow(1 - u, 0.9) + 0.008, 10, { dinamica: 'pul_' + nom + '_' + i }), mat: mS }));
      if (o.ventosas) for (let j = 3; j < 16; j += 2) { const p = pts[j], u = j / 18; brazos.push(elip(mV, [0.026 * (1 - u) + 0.008, 0.012, 0.026 * (1 - u) + 0.008], [p[0], p[1] - 0.05 * (1 - u) - 0.006, p[2]])); } }
    return V.nodo({ nombre: 'pulpo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [manto, cab, ojo(1), ojo(-1), ...brazos, elip(liso('#7a2a22'), [0.07, 0.05, 0.07], [0, 0.04, 0.05])] });
  };

  // ================================================================= ACACIA, LANZA, SUELO
  MO.acacia = function (o = {}) {
    const rn = VE.rng('acacia|' + (o.semilla || 1)), s = o.semilla || 1;
    const tronco = V.textura('sab|acacia|corteza', 128, 256, (x, W, H) => { x.fillStyle = '#4c3a2a'; x.fillRect(0, 0, W, H); fibras(x, W, H, 1600, ['#2a1f16', '#6d553d', '#352619'], 90, 'corteza', 0.2, 0.5, 2); });
    const hoja = V.textura('sab|acacia|copa', 256, 256, (x, W, H) => { x.fillStyle = '#6f7a3a'; x.fillRect(0, 0, W, H); const r = VE.rng('copa'); for (let i = 0; i < 2800; i++) { x.globalAlpha = 0.25 + r() * 0.45; x.fillStyle = ['#8b9a4a', '#56622b', '#a3ad5a', '#44501f'][Math.floor(r() * 4)]; x.beginPath(); x.arc(r() * W, r() * H, 1.2 + r() * 3.5, 0, 7); x.fill(); } x.globalAlpha = 1; });
    const mT = mt(tronco, { esp: 0.05 }), mH = mt(hoja, { esp: 0.04, envolver: 0.6, borde: 0.3 });
    const ramas = [], copas = [{ malla: MA.esfera(20), m: M4.mul(M4.tras(0, 0, 0), M4.esc(4.0, 0.55, 3.6)) }];
    for (let i = 0; i < 9; i++) { const a = rn() * 2 * PI, d = 1.2 + rn() * 1.5; copas.push({ malla: MA.esfera(16), m: M4.mul(M4.tras(Math.cos(a) * d, (rn() - 0.4) * 0.35, Math.sin(a) * d), M4.esc(1.7 + rn() * 0.9, 0.38 + rn() * 0.25, 1.5 + rn() * 0.8)) }); }
    const copa = V.nodo({ malla: MA.fusionar(copas, 'acacia|copa|' + s), pos: [0, 4.4, 0], mat: mH });
    ramas.push(V.nodo({ malla: MA.tubo([[0, 0, 0], [0.1, 1.3, 0.05], [0.0, 2.6, 0.0], [-0.2, 3.5, 0.1]], (u) => 0.26 * (1 - u * 0.55), 10, { clave: 'acacia|t0' }), mat: mT }));
    for (const [dx, dz] of [[1.4, 0.3], [-1.3, 0.6], [0.2, -1.5]]) ramas.push(V.nodo({ malla: MA.tubo([[0, 2.7, 0], [dx * 0.5, 3.4, dz * 0.5], [dx, 4.2, dz]], (u) => 0.12 * (1 - u * 0.5), 8, { clave: 'acacia|r' + dx + dz }), mat: mT }));
    return V.nodo({ nombre: 'acacia', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [...ramas, copa] });
  };
  MO.lanza = function (o = {}) {
    const asta = V.textura('sab|lanza|asta', 64, 256, (x, W, H) => { x.fillStyle = '#9a7648'; x.fillRect(0, 0, W, H); fibras(x, W, H, 500, ['#6f5230', '#c19a62', '#5a4126'], 120, 'asta', 0.2, 0.5, 1.2); });
    const silex = V.textura('sab|lanza|silex', 64, 64, (x, W, H) => { x.fillStyle = '#756c63'; x.fillRect(0, 0, W, H); const r = VE.rng('silex'); for (let i = 0; i < 40; i++) { x.globalAlpha = 0.25; x.fillStyle = r() < 0.5 ? '#3b3530' : '#a79c8e'; x.beginPath(); x.moveTo(r() * W, r() * H); x.lineTo(r() * W, r() * H); x.lineTo(r() * W, r() * H); x.fill(); } x.globalAlpha = 1; });
    return V.nodo({ nombre: 'lanza', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: MA.cilindro(0.018, 0.013, 2.0, 12), rot: [0, 0, PI / 2], mat: mt(asta, { esp: 0.2, dureza: 25 }) }),
      V.nodo({ pos: [1.07, 0, 0], rot: [0, 0, -PI / 2], hijos: [V.nodo({ malla: MA.extrusion([[0, -0.03], [0.026, -0.0], [0.03, 0.06], [0, 0.2], [-0.03, 0.06], [-0.026, -0.0]], 0.012, 'lanza|punta'), mat: mt(silex, { esp: 0.5, dureza: 50 }) })] }),
      V.nodo({ pos: [0.97, 0, 0], rot: [0, 0, PI / 2], hijos: [V.nodo({ malla: MA.toro(0.02, 0.006, 16, 6), mat: liso('#5b4730') })] })] });
  };
  MO.suelo_sabana = function (o = {}) {
    const r = o.r || 300, tex = V.textura('sab|suelo|' + (o.clave || 'a'), 1024, 1024, (x, W, H) => { const rn = VE.rng('suelo' + (o.clave || 'a')); x.fillStyle = '#b28a4d'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 260; i++) { x.globalAlpha = 0.1 + rn() * 0.16; x.fillStyle = ['#8f6c37', '#c8a766', '#9b7a3f', '#6f5a2b', '#d4b77a'][Math.floor(rn() * 5)]; x.beginPath(); x.ellipse(rn() * W, rn() * H, 30 + rn() * 140, 20 + rn() * 70, rn() * 3, 0, 7); x.fill(); }
      for (let i = 0; i < 26000; i++) { x.globalAlpha = 0.1 + rn() * 0.28; x.fillStyle = ['#6b5326', '#d9bf7e', '#8c6f35', '#c9a45a', '#4e3f1d', '#e6cf93'][Math.floor(rn() * 6)]; const q = 1 + rn() * 3.2; x.fillRect(rn() * W, rn() * H, q * (0.8 + rn() * 1.6), q); }
      for (let i = 0; i < 700; i++) { const x0 = rn() * W, y0 = rn() * H; x.globalAlpha = 0.18 + rn() * 0.2; x.strokeStyle = ['#5d4720', '#d2b46f', '#7e6330'][Math.floor(rn() * 3)]; x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (rn() - 0.5) * 7, y0 - 4 - rn() * 8); x.stroke(); }
      x.globalAlpha = 1; });
    tex.repetirV = true; const m = mt(tex, { esp: 0.02, dureza: 6, envolver: 0.3, borde: 0 }); m.repetir = [r / 5, r / 5];
    return V.nodo({ nombre: 'suelo_sabana', pos: o.pos, hijos: [V.nodo({ malla: MA.plano(r * 2, r * 2, 1), mat: m })] });
  };

  // ================================================================= FONDO DE SABANA (2D con la linea del horizonte de la camara)
  V.fondo = V.fondo || {};
  V.fondo.sabana = function (esc, cam, o = {}) {
    const x = esc.ctx, W = esc.W, H = esc.H, hora = o.hora || 'atardecer', f = V.v3.norm([cam.mira[0] - cam.pos[0], 0, cam.mira[2] - cam.pos[2]]);
    const lejos = V.proyectar(esc, cam, [cam.pos[0] + f[0] * 800, 0, cam.pos[2] + f[2] * 800]), yh = Math.max(-H, Math.min(2 * H, lejos.y));
    const PAL = { atardecer: ['#e2623a', '#f09a4a', '#f7cf86', '#f5e0b0'], dia: ['#4f93d6', '#8cc0ea', '#cfe4f0', '#f3ecd2'], alba: ['#35507f', '#c97a7e', '#f1b08a', '#f8dfae'] }[hora] || [];
    const g = x.createLinearGradient(0, Math.min(yh, H) - Math.max(H * 0.9, 1), 0, yh); g.addColorStop(0, PAL[0]); g.addColorStop(0.5, PAL[1]); g.addColorStop(0.85, PAL[2]); g.addColorStop(1, PAL[3]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const sx = (o.solX == null ? 0.62 : o.solX) * W, sy = yh - (o.solAlto == null ? 0.3 : o.solAlto) * H, rs = (o.solR || 0.12) * W;
    const hal = x.createRadialGradient(sx, sy, rs * 0.4, sx, sy, rs * 3.4); hal.addColorStop(0, 'rgba(255,238,190,0.65)'); hal.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = hal; x.fillRect(0, 0, W, H);
    const gs = x.createRadialGradient(sx, sy, rs * 0.1, sx, sy, rs); gs.addColorStop(0, '#fffdf0'); gs.addColorStop(0.7, hora === 'dia' ? '#fff7d8' : '#ffe6a0'); gs.addColorStop(1, hora === 'dia' ? '#ffeeb8' : '#ffc977'); x.fillStyle = gs; x.beginPath(); x.arc(sx, sy, rs, 0, 7); x.fill();
    const colinas = (alto, col, sem, n) => { const r = VE.rng('col' + sem); x.fillStyle = col; x.beginPath(); x.moveTo(0, yh + 4); let y = 0; for (let i = 0; i <= n; i++) { y = alto * (0.4 + 0.6 * Math.abs(sn(i * 1.7 + sem) * cs(i * 0.6)) + r() * 0.2); x.lineTo(W * i / n, yh - y * H); } x.lineTo(W, yh + 4); x.closePath(); x.fill(); };
    const tinte = hora === 'dia' ? ['#8aa5b0', '#7f9a82'] : hora === 'alba' ? ['#7b6d86', '#6a5a6b'] : ['#b8714a', '#8c4f33'];
    colinas(0.055, tinte[0], 1, 14); colinas(0.03, tinte[1], 5, 22);
    const bruma = x.createLinearGradient(0, yh - H * 0.05, 0, yh + H * 0.01); bruma.addColorStop(0, 'rgba(250,215,160,0)'); bruma.addColorStop(1, 'rgba(250,215,160,0.55)'); x.fillStyle = bruma; x.fillRect(0, yh - H * 0.05, W, H * 0.06);
    return { yh };
  };
})(window.VE);
