/* VOLUMEN — OTROS PARTICIPANTES DE LA CARRERA Y LA PISTA (metros; miran a +X, apoyados en y = 0)
     V.modelos.avestruz({ marcha:'corre'|'quieto', fase, t, pos, rot, esc })     biped: plumaje negro, alas y cola blancas, cuello largo, patas de dos dedos
     V.modelos.canguro({ marcha:'salta'|'quieto', fase, t, pos, rot, esc })      canguro rojo: salta con las dos patas, cola de balance, orejas largas
     V.modelos.tortuga({ marcha:'camina'|'quieto', fase, t, pos, rot, esc })     tortuga gigante: caparazon con placas, patas de columna
     V.modelos.bolt({ fase, amp, pos, rot, esc, pose })                          atleta velocista vestido (maniqui + equipacion amarilla y verde)
     V.modelos.pista({ largo, carriles })                                         pista de 100 m: 8 calles de 1,22 m, tartan rojo, lineas, meta y postes (x de 0 a largo)
     V.modelos.pista.carril(i)  -> z del centro de la calle i (1..8) */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, sn = Math.sin, cs = Math.cos, mx = Math.max;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const liso = (c, e) => Object.assign({ color: c, esp: 0.35, dureza: 40, envolver: 0.2 }, e || {});
  const mt = (mapa, e) => Object.assign({ color: '#ffffff', mapa, esp: 0.05, dureza: 10, envolver: 0.45, borde: 0.25 }, e || {});
  const el = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(26), esc: e3, pos: pos || [0, 0, 0], rot, mat });
  const cil = (r1, r2, h, mat, pos, rot) => V.nodo({ malla: MA.cilindro(r1, r2, h, 14), pos, rot, mat });
  const cap = (r1, r2, l, mat, pos, rot) => V.nodo({ malla: MA.capsula(r1, r2, l, 18), pos, rot, mat });
  const sm = (a, b, x) => { const t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  const trazos = (x, W, H, n, cols, largo, sem, alfa, ancho) => {
    const r = VE.rng('co|' + sem); x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = r() * W, y0 = r() * H, l = largo * (0.5 + r());
      x.globalAlpha = (0.05 + r() * 0.12) * (alfa || 1); x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = (ancho || 0.8) * (0.7 + r() * 0.8);
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 3, y0 + l); x.stroke(); }
    x.globalAlpha = 1;
  };
  const motas = (x, W, H, n, cols, rmin, rmax, sem, alfa) => {
    const r = VE.rng('cm|' + sem);
    for (let i = 0; i < n; i++) { x.globalAlpha = alfa * (0.4 + r() * 0.6); x.fillStyle = cols[Math.floor(r() * cols.length)]; const rr = rmin + r() * (rmax - rmin);
      x.beginPath(); x.ellipse(r() * W, r() * H, rr, rr * (0.5 + r() * 0.6), r() * 3, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  };
  const ojo = (pos, r, iris, lado) => [
    el(liso('#17100b', { esp: 0.7, dureza: 80 }), [r * 1.05, r, r * 0.9], pos, [0, lado * 0.3, 0]),
    el(liso(iris, { esp: 0.9, dureza: 100, emision: 0.1 }), [r * 0.8, r * 0.8, r * 0.7], [pos[0] + r * 0.22, pos[1], pos[2] + lado * r * 0.2], [0, lado * 0.3, 0]),
    el(liso('#050403', { esp: 0.9, dureza: 120 }), [r * 0.4, r * 0.4, r * 0.3], [pos[0] + r * 0.5, pos[1], pos[2] + lado * r * 0.3], [0, lado * 0.3, 0]),
    el(liso('#ffffff', { esp: 1, dureza: 200, emision: 0.7 }), [r * 0.13, r * 0.13, r * 0.1], [pos[0] + r * 0.62, pos[1] + r * 0.28, pos[2] + lado * r * 0.45])];

  // cuerpo de revolucion alargado en X: perfil f(s) -> [radio vertical, radio lateral, desplazamiento y]; s en -1..1
  const huevo = (clave, L, f, nu = 36, nv = 24) => MA.parametrica(nu, nv, (u, v) => {
    const s = u * 2 - 1, th = v * TAU, fin = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.6)), 0.5), p = f(s);
    return [s * L, p[2] + p[0] * fin * cs(th), p[1] * fin * sn(th)];
  }, { clave });

  /* ================================================================ AVESTRUZ */
  MO.avestruz = function (o = {}) {
    const t = o.t || 0, run = (o.marcha || 'corre') !== 'quieto', ph = (o.fase || 0) * TAU, K = 'av|';
    const pluma = V.textura(K + 'pluma', 512, 256, (x, W, H) => { x.fillStyle = '#14110d'; x.fillRect(0, 0, W, H); trazos(x, W, H, 5200, ['#2c261d', '#0a0806', '#3a3226'], 26, 'avp', 1.6, 1.6);
      for (let i = 0; i < 120; i++) { x.globalAlpha = 0.18; x.fillStyle = '#4a4033'; const r = VE.rng('avb' + i); x.beginPath(); x.ellipse(r() * W, r() * H, 14, 4, r() * 3, 0, TAU); x.fill(); } x.globalAlpha = 1; });
    const blanca = V.textura(K + 'blanca', 512, 256, (x, W, H) => { x.fillStyle = '#f1ede3'; x.fillRect(0, 0, W, H); trazos(x, W, H, 4200, ['#d9d2c0', '#ffffff', '#c8c0ac'], 28, 'avw', 1.6, 1.4); });
    const cuelloT = V.textura(K + 'cuello', 256, 256, (x, W, H) => { x.fillStyle = '#d8a99f'; x.fillRect(0, 0, W, H); motas(x, W, H, 160, ['#b98479', '#e8c0b6'], 2, 7, 'avc', 0.35); trazos(x, W, H, 900, ['#f1e6dc', '#9a6c62'], 6, 'avc2', 1, 0.8); });
    const pataT = V.textura(K + 'pata', 256, 256, (x, W, H) => { x.fillStyle = '#d3a193'; x.fillRect(0, 0, W, H); for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) { x.globalAlpha = 0.35; x.strokeStyle = '#8f6258'; x.lineWidth = 1.5; x.beginPath(); x.ellipse((i + (j % 2) * 0.5) * 22, j * 12, 10, 5.5, 0, 0, TAU); x.stroke(); } x.globalAlpha = 1; });
    const M = { pluma: mt(pluma, { envolver: 0.5 }), blanca: mt(blanca, { envolver: 0.5 }), cuello: mt(cuelloT), pata: mt(pataT), pico: liso('#c8998d', { esp: 0.5 }), garra: liso('#2a1f1a', { esp: 0.6 }) };
    const Lt = 0.46, Lm = 0.5, cadera = -0.3;
    const pierna = (p, z) => {
      const t1 = 0.8 * sn(p) * (run ? 1 : 0.0), t2 = (run ? -0.2 - 1.3 * mx(0, sn(p + 1.7)) : -0.1), t3 = -(t1 + t2) * 0.85 + 0.12;
      const pie = V.nodo({ pos: [0, -Lm, 0], rot: [0, 0, t3], hijos: [el(M.pata, [0.15, 0.028, 0.055], [0.1, -0.03, 0]), el(M.garra, [0.03, 0.022, 0.03], [0.255, -0.03, 0]), el(M.pata, [0.075, 0.026, 0.04], [0.06, -0.03, z > 0 ? -0.06 : 0.06]), el(M.garra, [0.02, 0.016, 0.02], [0.135, -0.03, z > 0 ? -0.06 : 0.06])] });
      const baja = V.nodo({ pos: [0, -Lt, 0], rot: [0, 0, t2], hijos: [el(M.pata, [0.06, 0.06, 0.06]), cap(0.052, 0.034, Lm, M.pata), pie] });
      return { nodo: V.nodo({ pos: [0.04, cadera, z], rot: [0, 0, t1], hijos: [el(M.pluma, [0.21, 0.22, 0.17], [0, 0.08, 0]), cap(0.075, 0.052, Lt, M.pata), baja] }), ext: Lt * cs(t1) + Lm * cs(t1 + t2) + 0.03 };
    };
    const A = pierna(ph, 0.14), B = pierna(ph + PI, -0.14), yb = mx(A.ext, B.ext) - cadera + (run ? 0.02 * sn(2 * ph) : 0);
    const seg = (len, r1, r2, ang, hijo) => V.nodo({ rot: [0, 0, ang], hijos: [cap(r1, r2, len, M.cuello), hijo ? V.nodo({ pos: [0, -len, 0], hijos: [hijo] }) : null].filter(Boolean) });
    const bob = run ? 0.08 * sn(2 * ph - 0.6) : 0.03 * sn(t * 1.3);
    const cabeza = V.nodo({ rot: [0, 0, -2.78 + bob * 0.5], hijos: [el(M.cuello, [0.085, 0.058, 0.056], [0.03, 0, 0]), el(M.pico, [0.07, 0.017, 0.042], [0.115, -0.012, 0]), el(M.pico, [0.07, 0.012, 0.038], [0.115, -0.03, 0]),
      el(liso('#7a5a52'), [0.012, 0.01, 0.012], [0.18, 0.0, 0.016]), el(liso('#7a5a52'), [0.012, 0.01, 0.012], [0.18, 0.0, -0.016]),
      ...[-1, 1].flatMap(s => [...ojo([0.04, 0.025, s * 0.048], 0.034, '#6a3f1a', s), el(liso('#0c0a08'), [0.03, 0.006, 0.012], [0.04, 0.062, s * 0.04], [0, 0, 0.3]), el(liso('#0c0a08'), [0.03, 0.006, 0.012], [0.035, 0.062, s * 0.025], [0, 0, 0.5])])] });
    const cuello = V.nodo({ pos: [0.46, 0.2, 0], hijos: [seg(0.45, 0.075, 0.052, PI - 0.7 + bob, seg(0.45, 0.052, 0.04, 0.7 - bob * 0.5, seg(0.36, 0.04, 0.032, -0.5 + bob * 0.3, cabeza)))] });
    const aleteo = run ? 0.28 * sn(2 * ph) : 0.04 * sn(t * 2);
    const ala = (s) => V.nodo({ pos: [0.02, 0.12, s * 0.26], rot: [s * (0.35 + aleteo), s * 0.15, -0.1], hijos: [el(M.blanca, [0.34, 0.12, 0.05], [-0.18, -0.06, s * 0.04]), el(M.blanca, [0.26, 0.09, 0.05], [-0.34, -0.12, s * 0.07], [0, 0, 0.1])] });
    const cola = [0, 1, 2, 3].map(i => el(M.blanca, [0.34, 0.06, 0.1], [-0.6 - i * 0.03, 0.2 - i * 0.05, (i - 1.5) * 0.075], [0, (i - 1.5) * 0.12, 0.35 + i * 0.04 + (run ? 0.06 * sn(ph * 2 + i) : 0)]));
    const cuerpo = V.nodo({ malla: huevo('av|cuerpo', 0.62, (s) => [0.36 * (1 + 0.06 * s), 0.32 * (1 + 0.06 * s), 0]), mat: M.pluma });
    const tronco = V.nodo({ pos: [0, yb, 0], rot: [0, 0, run ? 0.06 : 0.1], hijos: [cuerpo, el(M.pluma, [0.28, 0.18, 0.26], [-0.32, 0.1, 0]), A.nodo, B.nodo, ala(1), ala(-1), cuello, ...cola] });
    return V.nodo({ nombre: 'avestruz', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [tronco] });
  };

  /* ================================================================ CANGURO ROJO */
  MO.canguro = function (o = {}) {
    const t = o.t || 0, salta = (o.marcha || 'salta') !== 'quieto', ph = (o.fase || 0) * TAU, s = salta ? sn(ph) : 0, K = 'ca|';
    const piel = V.textura(K + 'piel', 512, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, W, 0);
      [[0, '#b1502a'], [0.2, '#b1502a'], [0.27, '#8e3a1c'], [0.34, '#b1502a'], [0.55, '#c0653a'], [0.62, '#e6d3b4'], [0.78, '#e6d3b4'], [0.9, '#c0653a'], [1, '#b1502a']].forEach(a => g.addColorStop(a[0], a[1])); x.fillStyle = g; x.fillRect(0, 0, W, H);
      trazos(x, W, H, 14000, ['#7a3216', '#d48a58', '#e7b58a'], 11, 'cap', 0.9, 0.9); });
    const pataT = V.textura(K + 'pata', 256, 256, (x, W, H) => { x.fillStyle = '#b1502a'; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,24,16,0.85)'); x.fillStyle = g; x.fillRect(0, 0, W, H); trazos(x, W, H, 5000, ['#7a3216', '#d48a58'], 9, 'cap2', 0.9, 0.9); });
    const cabT = V.textura(K + 'cab', 256, 256, (x, W, H) => { x.fillStyle = '#c0653a'; x.fillRect(0, 0, W, H); x.fillStyle = '#f0e4cf'; x.globalAlpha = 0.9; x.fillRect(0, H * 0.5, W, H * 0.5); x.fillStyle = '#2b1710'; x.globalAlpha = 0.7; x.fillRect(0, H * 0.35, W, H * 0.06); x.globalAlpha = 1; trazos(x, W, H, 3500, ['#7a3216', '#f6ead6'], 7, 'cap3', 0.8, 0.8); });
    const M = { piel: mt(piel), pata: mt(pataT), cab: mt(cabT), uña: liso('#241812', { esp: 0.6 }), nariz: liso('#1b1210', { esp: 0.6 }) };
    const L1 = 0.45, L2 = 0.6, L3 = 0.42;
    const t1 = -0.65 * cs(ph) + 0.05, t2 = salta ? -0.35 - 0.55 * mx(0, -s) - 1.0 * mx(0, s) : -0.3, flat = PI / 2 - (t1 + t2), t3 = flat - 0.55 * mx(0, s) * (salta ? 1 : 0);
    const ext = L1 * cs(t1) + L2 * cs(t1 + t2) + 0.07, yh = (salta ? ext + 0.5 * Math.pow(mx(0, s), 0.9) : ext) + 0.0;
    const pie = V.nodo({ pos: [0, -L2, 0], rot: [0, 0, t3], hijos: [cap(0.05, 0.04, L3, M.pata), el(M.pata, [0.06, 0.05, 0.055], [0, 0.0, 0]), el(M.uña, [0.035, 0.02, 0.025], [0.0, -L3 - 0.02, 0])] });
    const pata = (z) => V.nodo({ pos: [0, -0.05, z], rot: [0, 0, t1], hijos: [el(M.piel, [0.24, 0.34, 0.16], [0, -0.15, 0]), cap(0.12, 0.065, L1, M.piel), V.nodo({ pos: [0, -L1, 0], rot: [0, 0, t2], hijos: [el(M.pata, [0.07, 0.07, 0.07]), cap(0.07, 0.04, L2, M.pata), pie] })] });
    const psi = salta ? 0.62 + 0.1 * s : 1.1, cabH = salta ? 0.15 * sn(ph + 1) : 0.03 * sn(t * 1.5);
    const brazo = (z) => V.nodo({ pos: [0.62, 0.0, z], rot: [0, 0, 0.2 + 0.5 * (salta ? 1 : 0) * cs(ph) - 0.0], hijos: [cap(0.04, 0.03, 0.22, M.piel), V.nodo({ pos: [0, -0.22, 0], rot: [0, 0, -0.9], hijos: [cap(0.03, 0.025, 0.2, M.piel), el(M.nariz, [0.045, 0.016, 0.03], [-0.02, -0.22, 0])] })] });
    const oreja = (z) => V.nodo({ pos: [-0.03, 0.09, z], rot: [z > 0 ? 0.28 : -0.28, 0, 0.18], hijos: [el(M.cab, [0.045, 0.19, 0.05], [0, 0.14, 0]), el(liso('#ecd2c0'), [0.028, 0.16, 0.03], [0.012, 0.14, z > 0 ? -0.006 : 0.006])] });
    const cabeza = V.nodo({ pos: [0.9, 0.1, 0], rot: [0, 0, -psi + 0.25 + cabH * 0.2], hijos: [el(M.cab, [0.14, 0.11, 0.1], [0, 0, 0]), oreja(0.06), oreja(-0.06), el(M.cab, [0.2, 0.065, 0.065], [0.19, -0.04, 0], [0, 0, -0.15]), el(M.nariz, [0.04, 0.035, 0.055], [0.38, -0.025, 0]),
      ...[-1, 1].flatMap(sg => [...ojo([0.07, 0.055, sg * 0.082], 0.03, '#4a2a14', sg), el(liso('#f2e8d4'), [0.1, 0.008, 0.008], [0.2, -0.02, sg * 0.065])])] });
    const tronco = V.nodo({ pos: [0, 0, 0], rot: [0, 0, psi], hijos: [
      V.nodo({ malla: huevo('ca|cuerpo', 0.55, (u) => [0.3 * (1 + 0.1 * Math.sin(u * 1.4)), 0.24 * (1 + 0.1 * Math.sin(u * 1.4)), 0]), mat: M.piel, pos: [0.4, 0.0, 0] }),
      el(M.piel, [0.16, 0.14, 0.15], [0.84, 0.04, 0]), brazo(0.13), brazo(-0.13), cabeza] });
    const cola = V.nodo({ pos: [-0.12, 0.05, 0], rot: [0, 0, -1.5 + 0.14 * (salta ? sn(ph + 2) : 0)], hijos: [cap(0.13, 0.035, 1.15, M.pata), el(M.pata, [0.12, 0.11, 0.11], [0, 0.0, 0])] });
    return V.nodo({ nombre: 'canguro', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [V.nodo({ pos: [0, yh, 0], hijos: [tronco, pata(0.13), pata(-0.13), cola] })] });
  };

  /* ================================================================ TORTUGA GIGANTE */
  MO.tortuga = function (o = {}) {
    const t = o.t || 0, anda = (o.marcha || 'camina') !== 'quieto', ph = (o.fase || 0) * TAU, K = 'tg|';
    const cas = V.textura(K + 'cas', 1024, 512, (x, W, H) => { x.fillStyle = '#6f6040'; x.fillRect(0, 0, W, H); const r = VE.rng('tgc');
      // placas: u = vuelta, v = del borde (0) a la cima (1)
      const anillos = [0.0, 0.3, 0.62, 1.0], ns = [14, 10, 5];
      for (let a = 0; a < 3; a++) { const y0 = anillos[a] * H, y1 = anillos[a + 1] * H, n = ns[a];
        for (let i = 0; i < n; i++) { const x0 = (i + (a % 2) * 0.5) / n * W, x1 = (i + 1 + (a % 2) * 0.5) / n * W, g = x.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 4, (x0 + x1) / 2, (y0 + y1) / 2, (y1 - y0) * 0.8);
          g.addColorStop(0, ['#8d7c55', '#85754f', '#977f55'][Math.floor(r() * 3)]); g.addColorStop(1, '#5a4d33'); x.fillStyle = g; x.fillRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6);
          for (let k = 1; k < 7; k++) { x.strokeStyle = 'rgba(40,30,18,0.28)'; x.lineWidth = 1.3; x.strokeRect(x0 + 3 + k * (x1 - x0) / 15, y0 + 3 + k * (y1 - y0) / 15, (x1 - x0 - 6) - k * 2 * (x1 - x0) / 15, (y1 - y0 - 6) - k * 2 * (y1 - y0) / 15); } } }
      x.strokeStyle = '#26200f'; x.lineWidth = 6; for (const a of anillos) { x.beginPath(); x.moveTo(0, a * H); x.lineTo(W, a * H); x.stroke(); }
      for (let a = 0; a < 3; a++) for (let i = 0; i < ns[a]; i++) { const xx = (i + (a % 2) * 0.5) / ns[a] * W; x.beginPath(); x.moveTo(xx, anillos[a] * H); x.lineTo(xx, anillos[a + 1] * H); x.stroke(); }
      motas(x, W, H, 260, ['#3a3020', '#a39270'], 3, 14, 'tgc2', 0.15); });
    const piel = V.textura(K + 'piel', 256, 256, (x, W, H) => { x.fillStyle = '#8a7f6a'; x.fillRect(0, 0, W, H); for (let j = 0; j < 30; j++) { x.strokeStyle = `rgba(40,34,26,${0.25 + (j % 3) * 0.1})`; x.lineWidth = 2 + (j % 2); x.beginPath(); x.moveTo(0, j * 9); x.bezierCurveTo(W * 0.3, j * 9 + 5, W * 0.6, j * 9 - 4, W, j * 9 + 2); x.stroke(); }
      motas(x, W, H, 90, ['#6a6050', '#a89d86'], 5, 15, 'tgp', 0.3); });
    const escam = V.textura(K + 'escamas', 256, 256, (x, W, H) => { x.fillStyle = '#7d725c'; x.fillRect(0, 0, W, H); for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 2 ? '#9c8f74' : '#8d8167'; x.strokeStyle = '#3c3426'; x.lineWidth = 2; x.beginPath(); x.ellipse(i * 34 + (j % 2) * 16, j * 26, 16, 11, 0, 0, TAU); x.fill(); x.stroke(); } });
    const M = { cas: mt(cas, { envolver: 0.4 }), piel: mt(piel), escam: mt(escam), plas: liso('#cdbd96', { esp: 0.15 }), uña: liso('#d8cdb4', { esp: 0.3 }), pico: liso('#6e6049', { esp: 0.3 }) };
    const alto = 0.34, cascaron = MA.parametrica(40, 22, (u, v) => { const phi = u * TAU, rho = Math.cos(v * PI / 2), y = 0.62 * Math.pow(sn(v * PI / 2), 0.82) * (1 + 0.0), rb = 1 + 0.07 * sm(0.0, 0.15, 0.15 - v);
      return [0.62 * rb * rho * cs(phi) * (1 + 0.04 * cs(phi)), y, 0.5 * rb * rho * sn(phi)]; }, { clave: 'tg|cascaron' });
    const pata = (x0, z, p, del) => { const a = anda ? 0.32 * sn(p) : 0, lev = anda ? 0.1 * mx(0, sn(p + 1.6)) : 0;
      return V.nodo({ pos: [x0, alto + 0.04 + lev, z], rot: [0, 0, a], hijos: [cap(0.125, 0.1, alto, M.piel, [0, 0, 0]), el(M.piel, [0.14, 0.05, 0.14], [0.02, -alto, 0]), ...(del ? [0, 1, 2, 3].map(i => el(M.escam, [0.04, 0.05, 0.1], [0.12, -0.04 - i * 0.07, 0], [0, 0, 0.3]))  : []),
        ...[-1, 0, 1].map(k => el(M.uña, [0.03, 0.02, 0.025], [0.15, -alto + 0.0, k * 0.065]))] }); };
    const bob = anda ? 0.04 * sn(ph * 2) : 0.02 * sn(t);
    const cuello = V.nodo({ pos: [0.56, alto + 0.28, 0], rot: [0, 0, PI / 2 + 0.2 + bob], hijos: [cap(0.1, 0.075, 0.36, M.piel), V.nodo({ pos: [0, -0.36, 0], rot: [0, 0, -0.4 - bob * 2], hijos: [
      el(M.piel, [0.13, 0.085, 0.085], [0.0, -0.02, 0]), el(M.pico, [0.07, 0.028, 0.05], [0.0, -0.1, 0]),
      ...[-1, 1].flatMap(s => [...ojo([-0.04, -0.03, s * 0.075], 0.022, '#2e1c0e', s), el(M.piel, [0.045, 0.02, 0.025], [-0.045, 0.005, s * 0.07]), el(liso('#2a2018'), [0.01, 0.01, 0.01], [0.0, -0.11, s * 0.03])])] })] });
    return V.nodo({ nombre: 'tortuga', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: cascaron, mat: M.cas, pos: [0, alto + 0.08, 0] }), el(M.plas, [0.56, 0.05, 0.44], [0, alto + 0.06, 0]),
      pata(0.38, 0.33, ph, true), pata(0.38, -0.33, ph + PI, true), pata(-0.36, 0.33, ph + PI, false), pata(-0.36, -0.33, ph, false), cuello, el(M.piel, [0.07, 0.04, 0.04], [-0.64, alto + 0.12, 0])] });
  };

  /* ================================================================ BOLT (maniqui vestido) */
  MO.bolt = function (o = {}) {
    const piel = '#4a2d20', ama = '#f2c500', ver = '#0d7a3a', bl = '#f4f1ea';
    const pose = o.pose || V.pose.correr(o.fase || 0, o.amp == null ? 1 : o.amp);
    const colores = { pelvis: ver, muslo: piel, pierna: piel, pie: bl, vientre: ama, pecho: ama, cuello: piel, cabeza: piel, brazo: piel, antebrazo: piel, mano: piel, cintura: ama };
    const m = (c, e) => liso(c, Object.assign({ esp: 0.2 }, e || {}));
    const calzon = (z) => cil(0.082, 0.1, 0.24, m(ver), [0, -0.1, 0]);
    const eq = {
      cadera_d: [V.nodo({ pos: [0, -0.1, 0], malla: MA.cilindro(0.085, 0.098, 0.25, 18), mat: m(ver) })],
      cadera_i: [V.nodo({ pos: [0, -0.1, 0], malla: MA.cilindro(0.085, 0.098, 0.25, 18), mat: m(ver) })],
      tobillo_d: [el(m('#e8e4d8'), [0.04, 0.05, 0.045], [0, -0.01, 0]), V.nodo({ malla: MA.cilindro(0.045, 0.045, 0.05, 14), pos: [0, 0.04, 0], mat: m(ama) })],
      tobillo_i: [el(m('#e8e4d8'), [0.04, 0.05, 0.045], [0, -0.01, 0]), V.nodo({ malla: MA.cilindro(0.045, 0.045, 0.05, 14), pos: [0, 0.04, 0], mat: m(ama) })],
      cuello: [el(m('#1b130f', { esp: 0.1 }), [0.1, 0.07, 0.095], [0.012, 0.235, 0]),                                               // pelo corto
        el(m(piel, { esp: 0.3 }), [0.025, 0.03, 0.022], [0.0, 0.17, 0.095]), el(m(piel, { esp: 0.3 }), [0.025, 0.03, 0.022], [0.0, 0.17, -0.095]),   // orejas
        el(m(piel, { esp: 0.3 }), [0.03, 0.035, 0.03], [0.108, 0.17, 0]),                                                           // nariz
        el(m('#1b130f'), [0.028, 0.006, 0.03], [0.1, 0.205, 0.04], [0, 0, 0.1]), el(m('#1b130f'), [0.028, 0.006, 0.03], [0.1, 0.205, -0.04], [0, 0, 0.1]),
        el(m('#f4efe6', { esp: 0.4 }), [0.014, 0.014, 0.014], [0.098, 0.185, 0.04]), el(m('#f4efe6', { esp: 0.4 }), [0.014, 0.014, 0.014], [0.098, 0.185, -0.04]),
        el(m('#0a0706', { esp: 0.5 }), [0.009, 0.009, 0.009], [0.108, 0.185, 0.04]), el(m('#0a0706', { esp: 0.5 }), [0.009, 0.009, 0.009], [0.108, 0.185, -0.04]),
        el(m('#7a3a33', { esp: 0.4 }), [0.016, 0.007, 0.034], [0.098, 0.12, 0]),                                                      // boca
      ],
      tronco: [V.nodo({ malla: MA.cilindro(0.135, 0.155, 0.09, 18), pos: [0.0, 0.03, 0], mat: m(ver) })]
    };
    return MO.maniqui({ pose, colores, equipo: eq, apoyo: o.apoyo === undefined ? 'pies' : o.apoyo, piesX: o.piesX, pos: o.pos, rot: o.rot, esc: o.esc });
  };

  /* ================================================================ PISTA DE 100 m */
  const ANCHO = 1.22;
  MO.pista = function (o = {}) {
    const L = o.largo || 100, N = o.carriles || 8, W = ANCHO * N, K = 'pista|';
    const tartan = V.textura(K + 'tartan', 1024, 1024, (x, w, h) => {
      x.fillStyle = '#b3402d'; x.fillRect(0, 0, w, h); const r = VE.rng('tartan');
      for (let i = 0; i < 30000; i++) { x.globalAlpha = 0.2 + r() * 0.25; x.fillStyle = ['#8f2e1f', '#c85a40', '#a23624', '#d06a4c'][Math.floor(r() * 4)]; const q = 0.8 + r() * 1.6; x.fillRect(r() * w, r() * h, q, q); }
      x.globalAlpha = 1; x.fillStyle = '#f3efe6';
      for (let k = 0; k <= N; k++) { const y = k / N * h; x.fillRect(0, Math.min(h - 6, Math.max(0, y - 3)), w, 6); } });
    const hierba = V.textura(K + 'cesped', 512, 512, (x, w, h) => { x.fillStyle = '#3f7d34'; x.fillRect(0, 0, w, h); trazos(x, w, h, 7000, ['#2e6a28', '#5a9a44', '#2a5c24'], 12, 'hierba', 1.4, 1.2); });
    const damero = V.textura(K + 'damero', 128, 512, (x, w, h) => { for (let j = 0; j < 16; j++) for (let i = 0; i < 4; i++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f1ea'; x.fillRect(i * 32, j * 32, 32, 32); } });
    const hijos = [], paso = 10;
    for (let x0 = -paso; x0 < L + paso; x0 += paso) hijos.push(V.nodo({ malla: MA.plano(paso, W, 1), pos: [x0 + paso / 2, 0.0, 0], mat: mt(tartan, { esp: 0.12, dureza: 14, envolver: 0.35, borde: 0.1 }) }));
    hijos.push(V.nodo({ malla: MA.plano(L + 80, 40, 1), pos: [L / 2, -0.01, W / 2 + 20], mat: mt(hierba, { esp: 0.02 }) }), V.nodo({ malla: MA.plano(L + 80, 40, 1), pos: [L / 2, -0.01, -W / 2 - 20], mat: mt(hierba, { esp: 0.02 }) }));
    const fijo = o.meta !== false;      // meta:false -> pista sin meta ni salida (planos de seguimiento: el tartan es periodico y se desplaza)
    if (fijo) hijos.push(V.nodo({ malla: MA.plano(0.3, W, 1), pos: [L + 0.2, 0.004, 0], mat: mt(damero, { esp: 0.1 }) }));                       // meta (franja de fotofinish)
    if (fijo) hijos.push(V.nodo({ malla: MA.plano(0.05, W, 1), pos: [0.0, 0.004, 0], mat: liso('#f6f2ea', { esp: 0.1 }) }));                        // salida
    const poste = liso('#d9dde2', { esp: 0.5 });
    for (const sg of fijo ? [-1, 1] : []) {
      hijos.push(cil(0.07, 0.07, 3.2, poste, [L + 0.35, 1.6, sg * (W / 2 + 0.6)]));
      for (let d = 20; d < L; d += 20) hijos.push(V.nodo({ pos: [d, 0.15, sg * (W / 2 + 0.35)], hijos: [cil(0.035, 0.035, 0.3, liso('#f4f1ea')), el(liso('#f2c500'), [0.05, 0.05, 0.05], [0, 0.17, 0])] }));
      hijos.push(V.nodo({ malla: MA.caja(0.06, 0.5, 0.06, 0.01), pos: [-0.6, 0.25, sg * (W / 2 + 0.4)], mat: liso('#f4f1ea') }));
    }
    if (fijo) hijos.push(V.nodo({ malla: MA.caja(0.12, 0.3, W + 1.4, 0.03), pos: [L + 0.35, 3.1, 0], mat: liso('#f4f1ea', { esp: 0.3 }) }));         // travesano de meta
    if (fijo) hijos.push(V.nodo({ malla: MA.caja(0.125, 0.14, W + 1.42, 0.02), pos: [L + 0.35, 3.1, 0], mat: liso('#d1142f', { esp: 0.3 }) }));
    if (o.gradas !== false) {       // gradas lejanas a los dos lados (muro con publico pintado)
      const pub = V.textura(K + 'publico', 1024, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3b4252'); g.addColorStop(1, '#222733'); x.fillStyle = g; x.fillRect(0, 0, w, h); const r = VE.rng('publico');
        const cols = ['#d94f4f', '#e8c34a', '#4f8fd9', '#f0ece4', '#5bb36b', '#c75fb0', '#e38a3c', '#2d2f36'];
        for (let f = 0; f < 6; f++) for (let i = 0; i < 150; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.beginPath(); x.arc(i * 6.9 + r() * 3, 14 + f * 19 + r() * 3, 3.1, 0, TAU); x.fill(); }
        x.fillStyle = 'rgba(0,0,0,0.18)'; for (let f = 0; f < 6; f++) x.fillRect(0, 22 + f * 19, w, 2); });
      const mp = { color: '#ffffff', mapa: pub, esp: 0.02, dureza: 6, envolver: 0.5, borde: 0, dobleCara: true };
      hijos.push(V.nodo({ malla: MA.plano(L + 120, 9, 1), pos: [L / 2, 4.5, -W / 2 - 19], rot: [PI / 2, 0, 0], mat: mp }), V.nodo({ malla: MA.plano(L + 120, 9, 1), pos: [L / 2, 4.5, W / 2 + 19], rot: [-PI / 2, 0, 0], mat: mp }));
    }
    return V.nodo({ nombre: 'pista', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
  MO.pista.carril = (i, n = 8) => (i - (n + 1) / 2) * ANCHO;
  MO.pista.ANCHO = ANCHO;
})(window.VE);
