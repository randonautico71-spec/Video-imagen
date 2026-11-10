/* VOLUMEN — SOL, LUNA, HIELO, PLANTA Y SUBSUELO (para «¿qué pasaría si el Sol se apagara?», reutilizables).
     MO.sol({ k, t })               Sol con granulación, manchas y corona; k = 1 encendido … 0 apagado (se enfría a un rojo oscuro y pierde la corona)
     MO.luna({ k })                 Luna con mares y cráteres; k = luz que recibe (la ilumina la luz del ambiente)
     MO.frenteLuz({ r, a })         cáscara fina y brillante: el frente de la luz que se aleja de un punto (r radio, a opacidad)
     MO.tierraHielo({ k })          capas de hielo con borde irregular que avanzan desde los polos sobre una Tierra de radio 1 (k 0..1)
     MO.planta({ k, t })            planta de interior/campo con hojas con nervios; k = 0 sana, 1 seca y caída
     MO.subsuelo({ t, escarcha })   corte de terreno con capas, vena de calor y bacterias; el frente es una pared de corte (mira a +z)
     MO.refugio({ t, k })           cúpula semienterrada con puerta, ventanas cálidas y chimenea de vapor (k = luz de las ventanas)
   Todo procedural (lienzos y piezas); sin ficheros externos. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v)), sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const mez = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); };

  /* ---------------------------------------------------------------- SOL */
  const texSol = () => V.textura('sol|tex', 1024, 512, (x, W, H) => {
    const img = x.createImageData(W, H), d = img.data, rn = VE.real.ruido2('sol'), r2 = VE.real.ruido2('sol2');
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const a = i / W * TAU, la = (0.5 - j / H) * PI, nx = Math.cos(a) * Math.cos(la), nz = Math.sin(a) * Math.cos(la), ny = Math.sin(la);
      const g = rn.fbm(nx * 14 + ny * 9 + 3, nz * 14 + ny * 6, 4, 0.55), g2 = r2.fbm(nx * 46 + ny * 30, nz * 46 + ny * 21, 3, 0.5);   // granulos grandes y pequeños
      let v = 0.62 + 0.55 * (g - 0.5) + 0.22 * (g2 - 0.5);
      const k = (j * W + i) * 4;
      const cel = Math.pow(c01((g - 0.52) * 3), 2); v += 0.12 * cel;                                       // venas brillantes entre granulos
      let r = 255 * c01(v * 1.05), gg = 175 * c01(v * 0.92 + 0.08), b = 52 * c01(v * 0.6);
      d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const rr = VE.rng('manchas');   // manchas solares: nucleo oscuro y penumbra
    for (let n = 0; n < 7; n++) { const cx = rr() * W, cy = H * (0.3 + rr() * 0.4), s = 8 + rr() * 16;
      for (const dx of [0, W, -W]) { let g = x.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, s * 2.4); g.addColorStop(0, 'rgba(70,24,6,0.95)'); g.addColorStop(0.42, 'rgba(110,44,10,0.85)'); g.addColorStop(1, 'rgba(160,80,20,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(cx + dx, cy, s * 2.4, s * 1.5, 0, 0, TAU); x.fill(); } }
  });
  MO.sol = (o = {}) => {
    const k = o.k == null ? 1 : o.k, t = o.t || 0, hij = [];
    const col = mez('#3a1408', '#ffffff', Math.pow(k, 0.6));
    hij.push(nodo({ malla: MA.esfera(96), rot: [0.1, t * 0.05, 0], mat: { color: col, mapa: texSol(), esp: 0, envolver: 1, emision: 0.06 + 1.05 * k, borde: 0, dureza: 5 }, sinSombra: true }));
    if (k > 0.02) for (const [e, f, a, c] of [[1.04, 3.2, 0.9, '#ffb347'], [1.14, 2.4, 0.55, '#ff8a2a'], [1.32, 2.0, 0.32, '#ff6a1a'], [1.45, 1.6, 0.16, '#ff5a10']])
      hij.push(nodo({ malla: MA.esfera(48), esc: e * (1 + 0.012 * Math.sin(t * 1.7 + e * 5)), sinSombra: true, mat: { tipo: 'rayosx', color: c, fresnel: f, borde: 1.6, emision: 0.0, alfa: a * k, atraviesa: false } }));
    return nodo({ nombre: 'sol', pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };
  MO.frenteLuz = (o = {}) => nodo({ nombre: 'frente', pos: o.pos, esc: o.r || 1, sinSombra: true, hijos: [
    nodo({ malla: MA.esfera(64), sinSombra: true, mat: { tipo: 'rayosx', color: o.color || '#fff1c4', fresnel: 6, borde: 2.4, emision: 0.0, alfa: o.a == null ? 1 : o.a, atraviesa: false } }),
    nodo({ malla: MA.esfera(48), esc: 0.985, sinSombra: true, mat: { tipo: 'rayosx', color: o.color || '#ffb347', fresnel: 2.2, borde: 0.8, emision: 0.0, alfa: 0.3 * (o.a == null ? 1 : o.a), atraviesa: false } })] });

  /* ---------------------------------------------------------------- LUNA */
  const texLuna = () => V.textura('luna|tex', 1024, 512, (x, W, H) => {
    const img = x.createImageData(W, H), d = img.data, rn = VE.real.ruido2('luna');
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const a = i / W * TAU, la = (0.5 - j / H) * PI, cx = Math.cos(a) * Math.cos(la), cz = Math.sin(a) * Math.cos(la), cy = Math.sin(la);
      const g = rn.fbm(cx * 3 + cy * 1.7 + 8, cz * 3 + cy * 2.3, 5, 0.55), mar = sm(0.5, 0.58, rn.fbm(cx * 1.6 + 20, cz * 1.6 + cy, 3, 0.5));
      let v = 0.66 + 0.22 * (g - 0.5) - 0.2 * mar; const k = (j * W + i) * 4;
      d[k] = 255 * c01(v * 1.02); d[k + 1] = 255 * c01(v * 1.0); d[k + 2] = 255 * c01(v * 0.96); d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const rr = VE.rng('craters');
    for (let n = 0; n < 220; n++) { const cx = rr() * W, cy = H * (0.1 + rr() * 0.8), s = 2 + Math.pow(rr(), 2.5) * 20 * (1 / Math.max(0.35, Math.cos((cy / H - 0.5) * PI)));
      for (const dx of [0, W, -W]) { x.fillStyle = 'rgba(70,70,70,0.32)'; x.beginPath(); x.ellipse(cx + dx, cy, s, s * 0.8, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx + dx - s * 0.12, cy - s * 0.1, s * 0.95, s * 0.76, 0, 0.2, 3.2); x.stroke(); } }
  });
  MO.luna = (o = {}) => nodo({ nombre: 'luna', pos: o.pos, rot: o.rot, esc: o.esc, malla: MA.esfera(64), sinSombra: true, mat: { color: mez('#303642', '#ffffff', o.k == null ? 1 : o.k), mapa: texLuna(), esp: 0, dureza: 10, envolver: 0.1, borde: 0.0 } });

  /* ---------------------------------------------------------------- HIELO SOBRE LA TIERRA (radio 1) */
  const texHielo = (i, N) => V.textura('hielo|' + i + '|' + N, 1024, 512, (x, W, H) => {
    const img = x.createImageData(W, H), d = img.data, rn = VE.real.ruido2('hielo'), lim = 78 - i * (108 / (N - 1));    // latitud (grados) hasta la que llega esta capa
    for (let j = 0; j < H; j++) for (let ii = 0; ii < W; ii++) {
      const a = ii / W * TAU, lat = Math.abs(0.5 - j / H) * 180, cx = Math.cos(a), cz = Math.sin(a);
      const n = rn.fbm(cx * 3 + 11, cz * 3 + lat * 0.05, 5, 0.55) - 0.5, tx = rn.fbm(cx * 14, cz * 14 + lat * 0.2, 3, 0.5);
      const al = c01((lat - lim + n * 38) / 4), k = (j * W + ii) * 4, v = 0.9 + 0.1 * tx;
      d[k] = 232 * v; d[k + 1] = 242 * v; d[k + 2] = 255 * v; d[k + 3] = 255 * al;
    }
    x.putImageData(img, 0, 0);
  });
  MO.tierraHielo = (o = {}) => { const k = c01(o.k || 0), N = 5, hij = [];
    for (let i = 0; i < N; i++) { const a = c01(k * (N + 0.5) - i); if (a > 0.003) hij.push(nodo({ malla: MA.esfera(96), esc: 1.002 + i * 0.0006, sinSombra: true, mat: { color: '#ffffff', mapa: texHielo(i, N), esp: 0.4, dureza: 50, envolver: 0.1, alfa: a } })); }
    return nodo({ nombre: 'hielo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij }); };

  /* ---------------------------------------------------------------- PLANTA */
  const texHoja = (seco) => V.textura('hoja|' + (seco ? 's' : 'v'), 256, 512, (x, W, H) => {
    const rn = VE.rng('hoja' + seco), g = x.createLinearGradient(0, 0, W, 0);
    if (seco) { g.addColorStop(0, '#8a6430'); g.addColorStop(0.5, '#a87d3c'); g.addColorStop(1, '#7c5826'); } else { g.addColorStop(0, '#2f7a2c'); g.addColorStop(0.5, '#4fa83a'); g.addColorStop(1, '#2c7027'); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { x.fillStyle = seco ? `rgba(${rn() < 0.5 ? '70,44,16' : '200,160,80'},${0.06 + rn() * 0.1})` : `rgba(${rn() < 0.5 ? '20,70,20' : '150,210,90'},${0.05 + rn() * 0.09})`; x.beginPath(); x.ellipse(rn() * W, rn() * H, 3 + rn() * 14, 2 + rn() * 8, rn() * 3, 0, TAU); x.fill(); }
    x.strokeStyle = seco ? 'rgba(60,38,12,0.6)' : 'rgba(200,235,150,0.65)'; x.lineWidth = 5; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();     // nervio central
    x.lineWidth = 2; for (let i = 1; i < 14; i++) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(W / 2, H * i / 14); x.quadraticCurveTo(W / 2 + s * W * 0.2, H * (i / 14 + 0.02), W / 2 + s * W * 0.46, H * (i / 14 + 0.07)); x.stroke(); }
  });
  const mallaHoja = () => MA.parametrica(14, 8, (u, v) => { const s = u, w = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.75) * 0.5 * (1 - 0.25 * s), q = (v - 0.5) * 2; return [q * w, Math.sin(s * 1.1) * 0.05 * s - Math.abs(q) * w * 0.35, s]; }, { clave: 'hoja|malla' });
  MO.planta = (o = {}) => {
    const k = c01(o.k || 0), t = o.t || 0, hij = [], rn = VE.rng('planta' + (o.semilla || 0)), seco = sm(0.25, 0.8, k);
    const tallo = MA.tubo([[0, 0, 0], [0.02, 0.35, 0.01], [0.0, 0.7, -0.02], [-0.03, 1.0, 0.0]].map(p => p.map((c, i) => i === 0 ? c * (1 - 0.5 * k * seco) : c)), 0.035, 8, { clave: 'tallo|planta' });
    hij.push(nodo({ malla: tallo, mat: { color: mez('#3f7a2f', '#7a5d2e', seco), esp: 0.15, envolver: 0.3 }, rot: [0, 0, 0.5 * k * seco] }));
    const n = 9, hm = mallaHoja();
    for (let i = 0; i < n; i++) { const yy = 0.16 + i * 0.105, a = i * 2.4 + rn() * 0.4, L = 0.44 - 0.02 * i, cae = (0.1 + 0.9 * sm(0.15 + 0.04 * i, 0.85, k)) * 1.25, ang = 0.55 + cae;
      const mov = Math.sin(t * 1.2 + i) * 0.03 * (1 - k);
      hij.push(nodo({ pos: [0, yy, 0], rot: [0, a, 0], hijos: [nodo({ rot: [ang + mov, 0, 0], esc: [L, L, L], hijos: [
        nodo({ malla: hm, mat: { color: '#ffffff', mapa: texHoja(false), esp: 0.3, dureza: 40, envolver: 0.5, dobleCara: true, alfa: 1 - seco }, sinSombra: false }),
        nodo({ malla: hm, mat: { color: '#ffffff', mapa: texHoja(true), esp: 0.05, dureza: 10, envolver: 0.5, dobleCara: true, alfa: seco }, sinSombra: true })] })] })); }
    return nodo({ nombre: 'planta', pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };

  /* ---------------------------------------------------------------- SUBSUELO (corte) */
  const texCorte = () => V.textura('subsuelo|tex', 1024, 1024, (x, W, H) => {
    const rn = VE.real.ruido2('corte'), img = x.createImageData(W, H), d = img.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const y = j / H, n = rn.fbm(i * 0.012, j * 0.02, 4, 0.55), n2 = rn.fbm(i * 0.08, j * 0.08, 3, 0.5), ond = Math.sin(i * 0.011 + n * 5) * 0.02;
      let c;
      const yy = y + ond;
      if (yy < 0.13) c = [60 + 40 * n2, 42 + 28 * n2, 28 + 20 * n2];                         // suelo orgánico oscuro
      else if (yy < 0.36) c = [118 + 50 * n2, 86 + 36 * n2, 58 + 24 * n2];                  // arcilla
      else if (yy < 0.62) c = [128 + 40 * n, 122 + 40 * n, 116 + 40 * n];                   // roca
      else c = [110 + 30 * n, 98 + 30 * n, 94 + 24 * n];
      if (n2 > 0.66 && yy > 0.13) { c = c.map(v => v * 0.7); }                                   // piedras y huecos
      const calor = sm(0.55, 1, y); c = [c[0] + (255 - c[0]) * calor * 0.62, c[1] + (120 - c[1]) * calor * 0.5, c[2] + (30 - c[2]) * calor * 0.4];   // el calor sube desde el fondo
      const k = (j * W + i) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  });
  MO.subsuelo = (o = {}) => {
    const t = o.t || 0, W = o.ancho || 8, H = o.alto || 9, hij = [], rn = VE.rng('bact' + (o.semilla || 0)), esc = c01(o.escarcha || 0);
    hij.push(nodo({ malla: MA.plano(W, H, 1), pos: [0, -H / 2, 0], rot: [PI / 2, 0, 0], mat: { color: '#ffffff', mapa: texCorte(), esp: 0.05, dureza: 8, envolver: 0.6 }, sinSombra: true }));
    hij.push(nodo({ malla: MA.caja(W, 0.34 + 0.5 * esc, 0.9, 0.12), pos: [0, 0.0, -0.5], mat: { color: mez('#6a4a30', '#f0f6ff', esc), esp: 0.3, dureza: 40, envolver: 0.4 } }));          // capa superior: suelo -> escarcha
    const nb = o.bacterias == null ? 26 : o.bacterias;
    for (let i = 0; i < nb; i++) { const bx = (rn() - 0.5) * (W - 1), by = -(1.2 + rn() * (H - 3.4)), a = rn() * TAU, ph = rn() * 6;
      hij.push(nodo({ pos: [bx + Math.sin(t * 0.5 + ph) * 0.08, by + Math.cos(t * 0.4 + ph) * 0.06, 0.06], rot: [0, 0, a + Math.sin(t * 0.6 + ph) * 0.3], esc: 1.0 + rn() * 0.8, sinSombra: true,
        malla: MA.capsula(0.07, 0.07, 0.2, 10), mat: { color: '#7be0c4', tipo: 'brillo', esp: 0.7, dureza: 60, emision: 0.42, envolver: 0.5 } })); }
    return nodo({ nombre: 'subsuelo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };

  /* ---------------------------------------------------------------- REFUGIO */
  MO.refugio = (o = {}) => {
    const t = o.t || 0, k = o.k == null ? 1 : o.k, hij = [], metal = { color: '#8d96a0', tipo: 'brillo', esp: 0.9, dureza: 70, envolver: 0.2 };
    hij.push(nodo({ malla: MA.esfera(40), esc: [1.7, 1.15, 1.2], pos: [0, 0, 0], mat: metal }));
    for (const a of [-0.8, -0.3, 0.2, 0.7]) hij.push(nodo({ malla: MA.toro(1.0, 0.03, 40, 8), esc: [1.7, 1.15, 1.2], rot: [0, a, 0], mat: { color: '#5d6670', esp: 0.5 }, sinSombra: true }));
    hij.push(nodo({ malla: MA.caja(0.5, 0.78, 0.18, 0.05), pos: [0.0, 0.34, 1.12], rot: [0.18, 0, 0], mat: { color: '#b26a2c', esp: 0.3, envolver: 0.3 } }));                       // puerta
    for (const [wx, wy] of [[-0.82, 0.62], [0.82, 0.62]]) hij.push(nodo({ malla: MA.cilindro(0.15, 0.15, 0.08, 16), pos: [wx, wy, 1.01], rot: [PI / 2 - 0.4, 0, 0], sinSombra: true, mat: { color: '#ffcf70', emision: 0.4 + 0.9 * k, esp: 0.8 } }));
    hij.push(nodo({ malla: MA.cilindro(0.1, 0.12, 0.7, 14), pos: [-0.9, 1.1, -0.15], mat: { color: '#59616b', esp: 0.4 } }));                                                  // chimenea
    for (let i = 0; i < 6; i++) { const s = (t * 0.35 + i / 6) % 1; hij.push(nodo({ malla: MA.esfera(14), pos: [-0.9 + Math.sin(i * 2 + t) * 0.15 * s, 1.5 + s * 1.6, -0.15], esc: 0.12 + s * 0.3, sinSombra: true, mat: { color: '#e8eef4', alfa: 0.5 * (1 - s) * k, envolver: 0.8 } })); }
    return nodo({ nombre: 'refugio', pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };
})(window.VE = window.VE || {});
