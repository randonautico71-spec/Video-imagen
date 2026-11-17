/* VOLUMEN — MITOLOGIA Y FAUNA PEQUENA: aguila, lagartija y roca encadenada (Prometeo).
     V.modelos.aguila({aleteo, pos, rot, esc})     aguila real, mira hacia +X, envergadura ~2, aleteo = angulo de las alas en radianes (0 = planeando, +arriba)
     V.modelos.lagartija({cola, nueva, pos, rot, esc})   lagartija verde, mira hacia +X, largo ~0,5; cola = fraccion de la cola original (1 entera),
                                                          nueva = fraccion de cola regenerada (mas clara) que crece desde el corte
     V.modelos.roca_cadenas({pos, rot, esc})        roca grande con argollas y cadenas (para el castigo de Prometeo); altura ~2,2, cara plana hacia +X */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const liso = (c, o = {}) => Object.assign({ color: c, esp: 0.1, dureza: 20, envolver: 0.4, borde: 0.3 }, o);
  const sm = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

  /* ================================================================== AGUILA */
  const AN = 12;
  const alaSec = (u, signo) => {                              // seccion del ala en u (0 hombro .. 1 punta), coordenadas absolutas
    const c = 0.44 - 0.2 * Math.pow(u, 1.3), xle = 0.13 - 0.16 * u * u, th = 0.032 * (1 - 0.62 * u), z = signo * (0.1 + 0.95 * u), caida = -0.05 * u * u, pts = [];
    for (let i = 0; i < AN; i++) { const a = TAU * i / AN, xc = 0.5 + 0.5 * Math.cos(a), sa = Math.sin(a); pts.push([xle - c * xc, th * sa * (sa > 0 ? 1 : 0.45) + caida, z]); }
    return pts;
  };
  const alaMalla = (u0, u1, signo, rel) => {
    const n = 5, sec = []; for (let k = 0; k <= n; k++) sec.push(alaSec(u0 + (u1 - u0) * k / n, signo).map(p => [p[0] - rel[0], p[1] - rel[1], p[2] - rel[2]]));
    return MA.loft(sec, 'aguila|ala|' + u0 + '|' + u1 + '|' + signo, { tapas: true });
  };
  const texAla = () => V.textura('aguila|ala', 256, 256, (x, W, H) => {                    // v (filas) = de hombro (arriba) a punta (abajo)
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7a5530'); g.addColorStop(0.45, '#5c3f22'); g.addColorStop(0.8, '#3b2915'); g.addColorStop(1, '#22170c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const r = VE.rng('aguilaala'); x.lineCap = 'round';
    for (let i = 0; i < 1400; i++) { const x0 = r() * W, y0 = r() * H; x.globalAlpha = 0.12 + r() * 0.2; x.strokeStyle = ['#a07848', '#2a1c0e', '#6b4a28', '#c09a60'][Math.floor(r() * 4)]; x.lineWidth = 1 + r() * 1.4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 14, y0 + 6 + r() * 14); x.stroke(); }
    x.globalAlpha = 0.5; x.fillStyle = '#c9a56a'; for (let i = 0; i < 12; i++) x.fillRect(0, H * (0.12 + i * 0.012), W, 2);                                         // cubiertas claras
  });
  MO.aguila = function (o = {}) {
    const ang = o.aleteo || 0, mAla = { color: '#ffffff', mapa: texAla(), esp: 0.12, dureza: 18, envolver: 0.4, borde: 0.35, dobleCara: true };
    const tCu = V.textura('aguila|cuerpo', 256, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3d22'); g.addColorStop(0.5, '#7a5530'); g.addColorStop(1, '#8c6a40'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('aguilacu'); x.lineCap = 'round'; for (let i = 0; i < 2600; i++) { const x0 = r() * W, y0 = r() * H; x.globalAlpha = 0.12 + r() * 0.2; x.strokeStyle = ['#3d2812', '#a98450', '#2e1d0c'][Math.floor(r() * 3)]; x.lineWidth = 1 + r(); x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (r() - 0.5) * 6, y0 + 4 + r() * 8); x.stroke(); } });
    const tCa = V.textura('aguila|cabeza', 128, 128, (x, W, H) => { x.fillStyle = '#b08a4e'; x.fillRect(0, 0, W, H); const r = VE.rng('aguilaca'); x.lineCap = 'round'; for (let i = 0; i < 900; i++) { x.globalAlpha = 0.2 + r() * 0.2; x.strokeStyle = ['#7c5a2e', '#d6b273', '#8c6836'][Math.floor(r() * 3)]; x.lineWidth = 1; x.beginPath(); const x0 = r() * W, y0 = r() * H; x.moveTo(x0, y0); x.lineTo(x0 + 3, y0 + 7); x.stroke(); } });
    const mCu = { color: '#ffffff', mapa: tCu, esp: 0.1, dureza: 16, envolver: 0.4, borde: 0.35 }, mCa = { color: '#ffffff', mapa: tCa, esp: 0.1, dureza: 16, envolver: 0.4, borde: 0.35 };
    const pico = liso('#2c2824', { esp: 0.6, dureza: 50 }), cera = liso('#e6b92a', { esp: 0.4 }), pata = liso('#e2b727', { esp: 0.3 }), garra = liso('#16120e', { esp: 0.6, dureza: 60 });
    const pl1 = liso('#6b4a28', { esp: 0.1, dureza: 18, dobleCara: true }), pl2 = liso('#3f2a14', { esp: 0.1, dureza: 18, dobleCara: true }), pl3 = liso('#c9a56a', { esp: 0.1, dureza: 18 });
    const ala = (signo) => V.nodo({ pos: [0.05, 0.1, signo * 0.08], rot: [-signo * ang, 0, 0], hijos: [
      V.nodo({ malla: MA.esfera(24), esc: [0.25, 0.022, 0.32], pos: [0.0, 0, signo * 0.3], mat: pl1 }),
      V.nodo({ malla: MA.esfera(24), esc: [0.18, 0.016, 0.3], pos: [-0.05, -0.005, signo * 0.45], mat: pl3 }),
      V.nodo({ pos: [0.0, -0.01, signo * 0.62], rot: [-signo * ang * 0.5, 0, 0], hijos: [
        V.nodo({ malla: MA.esfera(24), esc: [0.2, 0.014, 0.34], pos: [-0.04, 0, signo * 0.2], mat: pl2 }),
        V.nodo({ malla: MA.esfera(20), esc: [0.1, 0.01, 0.2], pos: [-0.12, 0, signo * 0.42], mat: pl2 })] })] });
    const cola = V.nodo({ malla: MA.esfera(20), esc: [0.22, 0.012, 0.1], pos: [-0.52, 0.0, 0], rot: [0, 0, -0.1], mat: liso('#4a3320', { esp: 0.08, dobleCara: true }) });
    const cab = V.nodo({ pos: [0.38, 0.1, 0], hijos: [
      V.nodo({ malla: MA.esfera(24), esc: [0.1, 0.088, 0.085], mat: mCa }),
      V.nodo({ malla: MA.cilindro(0.0, 0.04, 0.12, 14, true), pos: [0.12, -0.01, 0], rot: [0, 0, -PI / 2 - 0.35], mat: pico }),
      V.nodo({ malla: MA.cilindro(0.045, 0.04, 0.04, 14, true), pos: [0.075, 0.008, 0], rot: [0, 0, -PI / 2 - 0.2], mat: cera }),
      ...[-1, 1].flatMap(s => [V.nodo({ malla: MA.esfera(14), esc: [0.022, 0.02, 0.012], pos: [0.045, 0.028, s * 0.07], mat: liso('#0b0907', { esp: 0.95, dureza: 100 }) }),
        V.nodo({ malla: MA.esfera(14), esc: [0.03, 0.01, 0.02], pos: [0.045, 0.052, s * 0.065], rot: [s * 0.4, 0, 0], mat: liso('#6e4c26') })])] });
    const patas = [-1, 1].map(s => V.nodo({ pos: [0.04, -0.1, s * 0.06], rot: [0, 0, -0.5], hijos: [
      V.nodo({ malla: MA.capsula(0.032, 0.022, 0.12, 14), mat: pata }),
      ...[-0.03, 0, 0.03].map(z => V.nodo({ malla: MA.cilindro(0.012, 0.0, 0.07, 8, true), pos: [0.03, -0.14, z], rot: [0, 0, 0.5 + 0.2], mat: garra }))] }));
    return V.nodo({ nombre: 'aguila', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: MA.esfera(32), esc: [0.4, 0.14, 0.16], mat: mCu }), V.nodo({ malla: MA.esfera(24), esc: [0.22, 0.13, 0.15], pos: [0.2, 0.04, 0], mat: mCu }), cab, cola, ala(1), ala(-1), ...patas] });
  };

  /* ================================================================== LAGARTIJA */
  const lagSec = (u, L) => {                                                  // seccion del cuerpo en u (0 cola .. 1 hocico), eje X
    const pts = [], x = -L / 2 + L * u, e = u < 0.08 ? Math.sqrt(1 - Math.pow((0.08 - u) / 0.08, 2)) : u > 0.93 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.93) / 0.07, 2))) : 1;
    const w = e * (0.045 + 0.02 * sm(0.1, 0.45, u) - 0.02 * sm(0.7, 1, u)), h = e * (0.03 + 0.012 * sm(0.1, 0.45, u) - 0.012 * sm(0.7, 1, u));
    for (let i = 0; i < 14; i++) { const a = TAU * i / 14; pts.push([x, h * Math.sin(a) * (Math.sin(a) > 0 ? 1 : 0.75), w * Math.cos(a)]); }
    return pts;
  };
  MO.lagartija = function (o = {}) {
    const cola = o.cola == null ? 1 : o.cola, nueva = o.nueva || 0, L = 0.26;
    const tex = V.textura('lagartija|piel', 256, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4f7a2c'); g.addColorStop(0.5, '#6f9a3a'); g.addColorStop(1, '#b9c97a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = VE.rng('lagartija'); for (let i = 0; i < 900; i++) { const cx = r() * W, cy = r() * H; x.globalAlpha = 0.15 + r() * 0.25; x.fillStyle = r() < 0.5 ? '#2f4a18' : '#d6e08a'; x.beginPath(); x.arc(cx, cy, 1.5 + r() * 3, 0, TAU); x.fill(); }
      x.globalAlpha = 0.5; x.fillStyle = '#2b3d14'; x.fillRect(0, H * 0.28, W, H * 0.06); x.fillRect(0, H * 0.66, W, H * 0.04); });
    const mP = { color: '#ffffff', mapa: tex, esp: 0.45, dureza: 32, envolver: 0.4, borde: 0.35 }, mN = liso('#a9c06a', { esp: 0.4, dureza: 30 }), ojo = liso('#0a0805', { esp: 0.95, dureza: 100 });
    const curva = (t) => [-L / 2 - 0.3 * t, 0.0, 0.05 * Math.sin(t * 5.2) * t];
    const hijos = [V.nodo({ malla: MA.esfera(24), esc: [L / 2 + 0.01, 0.03, 0.04], mat: mP })];
    const bola = (t, r, m) => V.nodo({ malla: MA.esfera(12), esc: r, pos: curva(t), mat: m });
    const nc = 16; for (let i = 0; i < nc; i++) { const t = (i / nc) * cola; if (t <= cola) hijos.push(bola(t + 0.02, 0.034 * (1 - 0.85 * (i / nc)) , mP)); }
    if (nueva > 0.01) { const nn = 8; for (let i = 0; i < nn; i++) { const t = cola + (i / nn) * nueva * 0.6; hijos.push(bola(t + 0.02, 0.03 * (1 - 0.8 * (i / nn)), mN)); } }
    hijos.push(V.nodo({ malla: MA.esfera(18), esc: [0.04, 0.028, 0.036], pos: [L / 2 + 0.03, 0.0, 0], mat: mP }));                     // cabeza
    for (const s of [-1, 1]) hijos.push(V.nodo({ malla: MA.esfera(10), esc: 0.009, pos: [L / 2 + 0.02, 0.02, s * 0.028], mat: ojo }));
    const pata = (x, s, d) => V.nodo({ pos: [x, -0.005, s * 0.05], rot: [s * (0.9 - d * 0.5), 0, 0.15 * s], hijos: [V.nodo({ malla: MA.capsula(0.011, 0.008, 0.07, 10), mat: mP }), V.nodo({ malla: MA.capsula(0.009, 0.006, 0.05, 10), pos: [0, -0.07, 0.0], rot: [-s * 0.9, 0, 0], mat: mP })] });
    hijos.push(pata(0.08, 1, 0), pata(0.08, -1, 1), pata(-0.07, 1, 1), pata(-0.07, -1, 0));
    return V.nodo({ nombre: 'lagartija', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  /* ================================================================== ROCA CON CADENAS */
  MO.roca_cadenas = function (o = {}) {
    const rn = (a, b, c) => Math.sin(a * 3.1 + b * 2.3) * Math.cos(b * 4.7 - c * 1.9) * 0.5 + Math.sin(c * 5.3 + a * 1.7) * 0.25;
    const roca = MA.parametrica(60, 40, (u, v) => { const lon = u * TAU, lat = (v - 0.5) * PI, dx = Math.cos(lat) * Math.cos(lon), dy = Math.sin(lat), dz = Math.cos(lat) * Math.sin(lon);
      const r = 1 + 0.14 * rn(dx * 2, dy * 2, dz * 2) + 0.05 * rn(dx * 7, dy * 7, dz * 7); let py = dy * 1.4 * r; if (py < -0.3) py = -0.3; return [dx * 0.95 * r, py, dz * 0.8 * r]; }, { clave: 'roca|prometeo' });
    const tex = V.textura('roca|grano', 512, 512, (x, W, H) => { x.fillStyle = '#7d7468'; x.fillRect(0, 0, W, H); const r = VE.rng('roca'); for (let i = 0; i < 700; i++) { const cx = r() * W, cy = r() * H, rr = 6 + r() * 34, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); const c = r() < 0.5 ? '56,50,44' : '160,150,134'; g.addColorStop(0, `rgba(${c},${0.12 + r() * 0.16})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      x.strokeStyle = 'rgba(40,36,30,0.5)'; x.lineWidth = 1.6; for (let i = 0; i < 40; i++) { let px = r() * W, py = r() * H; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 60; py += (r() - 0.2) * 40; x.lineTo(px, py); } x.stroke(); } });
    const hierro = liso('#4a4d52', { esp: 0.6, dureza: 40 }), eslabon = (p, rot) => V.nodo({ malla: MA.toro(0.07, 0.02, 20, 8), pos: p, rot, mat: hierro });
    const cad = (a, b, n) => { const l = []; for (let i = 0; i <= n; i++) { const t = i / n; l.push(eslabon([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.1 * Math.sin(t * PI), a[2] + (b[2] - a[2]) * t], [i % 2 ? PI / 2 : 0, 0.3, 0])); } return l; };
    return V.nodo({ nombre: 'roca_cadenas', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: roca, mat: { color: '#ffffff', mapa: tex, esp: 0.08, dureza: 12, envolver: 0.4, borde: 0.35 } })
    ] });
  };
})(VE);
