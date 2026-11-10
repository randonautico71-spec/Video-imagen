/* ============================================================================================
   DEMODEX, PIEL, PORO Y FOLICULO (3D, tema piel / ácaros de la cara). Registrado en engine/video/index.html tras ojo.js.
   Escala: el ácaro adulto mide 1 (≈0,3 mm reales); el pelo fino, ≈0,2 de grosor; el poro, ≈0,8 de diámetro.
     V.modelos.demodex({ t, etapa, paso, fase, esc, pos, rot, alfa, nombre })
          ácaro adulto (largo 1 a lo largo de +X, cabeza en +X, vientre hacia -Y): cuerpo alargado y translúcido con anillos,
          podosoma con 4 pares de patas cortas con garras, gnatosoma con quelíceros y palpos.
          etapa: 'adulto' | 'deutoninfa' | 'protoninfa' | 'larva' (3 pares de patas) | 'huevo'. paso 0..1 = cuanto camina (patas); fase = desfase.
     V.modelos.pelo({ largo, radio, curva, color, pos, rot, esc, clave })   pelo con cutícula, crece hacia +Y desde el origen
     V.modelos.piel({ radio, semilla, poros, poroRadio, pelo, sebo })   superficie de piel (plano XZ, y = 0) con un poro central abierto
          (embudo oscuro con un pelo y sebo) y poros pequeños con vello alrededor
     V.modelos.foliculo({ t, largo, radio, acaros, sebo, semilla })   corte del folículo (vertical, boca en y = 0, hacia -Y) con el pelo,
          ácaros agarrados con la cabeza hacia abajo y gotas de sebo
     V.modelos.glandula({ t, huevos, semilla })   glándula sebácea lobulada y translúcida con huevos de ácaro
   Revisión: `vid.py qa <tema> --stills t`.
   ============================================================================================ */
(function (VE) {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const suave = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };

  /* ---------------------------------------------------------------- textura del cuerpo del ácaro (u a lo largo, v alrededor) */
  const texAcaro = () => V.textura('demodex|tex', 512, 128, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6efdc'); g.addColorStop(0.5, '#fffaf0'); g.addColorStop(1, '#eadfc4'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rn = VE.rng('demodex');
    // tubo digestivo / contenido amarillento visible por transparencia (zona media y trasera)
    const t = x.createLinearGradient(W * 0.1, 0, W * 0.85, 0); t.addColorStop(0, 'rgba(176,138,70,0)'); t.addColorStop(0.3, 'rgba(176,138,70,0.55)'); t.addColorStop(0.7, 'rgba(150,108,48,0.5)'); t.addColorStop(1, 'rgba(176,138,70,0)');
    x.fillStyle = t; for (let k = 0; k < 2; k++) { x.beginPath(); x.ellipse(W * 0.5, H * (0.3 + 0.4 * k), W * 0.38, H * 0.1, 0, 0, TAU); x.fill(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(150,118,70,${0.06 + rn() * 0.1})`; x.beginPath(); x.ellipse(rn() * W, rn() * H, 3 + rn() * 8, 2 + rn() * 5, 0, 0, TAU); x.fill(); }
  });

  /* ---------------------------------------------------------------- mallas del ácaro */
  const RAD = (s) => {       // s = 0 cola ... 1 cabeza; radio del cuerpo
    const cola = suave(0, 0.1, s), medio = 0.060 + 0.032 * suave(0.1, 0.62, s), delante = 1 - 0.55 * suave(0.86, 0.97, s);
    return Math.sqrt(Math.max(0, 1 - Math.pow(1 - cola, 2))) * medio * delante * (1 + 0.075 * Math.sin(s * TAU * 20) * suave(0.06, 0.25, s) * (1 - suave(0.8, 0.9, s)));
  };
  const mallaCuerpo = () => MA.parametrica(90, 18, (u, v) => { const s = 1 - u, x = -0.55 + s * 1.02, r = RAD(s), ph = v * TAU; return [x, Math.sin(ph) * r * 0.96, Math.cos(ph) * r]; }, { clave: 'demodex|cuerpo' });
  const mallaPata = (largo, r1, r2) => MA.capsula(r1, r2, largo, 8);

  /* una pata: 2 segmentos y garra; lado = ±1 */
  const pata = (lado, x, ang, bal, L) => {
    const seg2 = nodo({ pos: [0, -0.07 * L, 0], rot: [0, 0, bal * 0.9 + 0.25], hijos: [
      nodo({ malla: mallaPata(0.06 * L, 0.014 * L, 0.011 * L), mat: { color: '#efe6cc', esp: 0.2, dureza: 20, envolver: 0.5, borde: 0.4 } }),
      nodo({ malla: MA.cilindro(0.008 * L, 0.0015 * L, 0.03 * L, 5), pos: [0.004 * L, -0.074 * L, 0], rot: [0, 0, 0.4], mat: { color: '#a58a58', esp: 0.3, dureza: 30 } })] });
    return nodo({ pos: [x, -0.03 * L, lado * 0.066 * L], rot: [-lado * (0.95 + ang), 0, bal * 0.7], hijos: [
      nodo({ malla: mallaPata(0.08 * L, 0.02 * L, 0.014 * L), mat: { color: '#f3ead2', esp: 0.2, dureza: 20, envolver: 0.5, borde: 0.4 } }), seg2] });
  };

  MO.demodex = (o = {}) => {
    const et = o.etapa || 'adulto', t = o.t || 0, paso = c01(o.paso == null ? 0.5 : o.paso), ph = o.fase || 0;
    const mat = { color: '#ffffff', mapa: texAcaro(), esp: 0.35, dureza: 30, envolver: 0.6, borde: 0.55, alfa: o.alfaCuerpo };
    if (et === 'huevo') return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, nombre: o.nombre, hijos: [
      nodo({ malla: MA.esfera(20), esc: [0.17, 0.095, 0.095], mat: { color: '#f4efe0', esp: 0.5, dureza: 50, envolver: 0.6, borde: 0.6, alfa: 0.92 } }),
      nodo({ malla: MA.esfera(10), esc: [0.07, 0.04, 0.04], pos: [0.02, 0, 0], mat: { color: '#d9c590', esp: 0.2, dureza: 20, alfa: 0.7 } })] });
    const F = { adulto: [1, 4], deutoninfa: [0.82, 4], protoninfa: [0.62, 4], larva: [0.44, 3] }[et] || [1, 4];
    const L = F[0], npar = F[1], hij = [];
    hij.push(nodo({ malla: mallaCuerpo(), mat }));
    // gnatosoma: cabeza pequeña, palpos y quelíceros
    hij.push(nodo({ malla: MA.esfera(14), esc: [0.055, 0.04, 0.046], pos: [0.5, 0, 0], mat: { color: '#e3d6b4', esp: 0.3, dureza: 30, envolver: 0.5, borde: 0.4 } }));
    for (const z of [-1, 1]) {
      hij.push(nodo({ malla: MA.capsula(0.011, 0.007, 0.05, 6), pos: [0.54, -0.012, z * 0.026], rot: [-z * 0.3, 0, PI / 2 + 0.2], mat: { color: '#d8c8a0', esp: 0.3, dureza: 30 } }));            // palpos
      hij.push(nodo({ malla: MA.cilindro(0.006, 0.0012, 0.06, 5), pos: [0.575, 0.004, z * 0.011], rot: [0, 0, -PI / 2], mat: { color: '#8c6e3c', esp: 0.5, dureza: 60 } }));                  // quelíceros (estiletes)
    }
    // patas (en el tercio delantero): par por par con paso alternado
    const pos = [0.38, 0.29, 0.2, 0.11].slice(0, npar), caminar = Math.sin(t * 5.5 + ph);
    pos.forEach((x, i) => { for (const lado of [-1, 1]) { const b = (lado > 0 ? 1 : -1) * ((i % 2) ? 1 : -1) * caminar * paso * 0.6; hij.push(pata(lado, x, i * 0.05, b, 1)); } });
    // ondulación de gusano al reptar
    const ond = Math.sin(t * 3 + ph) * 0.07 * (0.4 + paso);
    const cuerpo = nodo({ rot: [0, ond, 0], esc: L, hijos: hij });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, nombre: o.nombre, hijos: [cuerpo] });
  };

  /* ---------------------------------------------------------------- pelo */
  MO.pelo = (o = {}) => {
    const L = o.largo || 3, r = o.radio || 0.1, cv = o.curva == null ? 0.25 : o.curva, n = 28, pts = [];
    for (let i = 0; i <= n; i++) { const s = i / n; pts.push([Math.sin(s * PI * 0.5) * cv * L * 0.5 * s, s * L, Math.sin(s * 2.1) * cv * L * 0.18 * s]); }
    const clave = o.clave || ('pelo|' + L + '|' + r + '|' + cv);
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, nombre: o.nombre, malla: MA.tubo(pts, (s) => r * (1 - 0.72 * Math.pow(s, 2.2)) * (1 + 0.05 * Math.sin(s * 120)), 10, { clave }),
      mat: { color: o.color || '#4a3426', esp: 0.5, dureza: 45, envolver: 0.4, borde: 0.4, tipo: 'brillo' } });
  };

  /* ---------------------------------------------------------------- piel con poro abierto (campo de alturas + textura) */
  const SPAN = 7, GRID = 250;
  const listaPoros = (semilla, rp) => { const rn = VE.rng('piel' + semilla), L = []; for (let i = 0; i < 70 && L.length < 54; i++) { const px = (rn() * 2 - 1) * (SPAN - 0.5), pz = (rn() * 2 - 1) * (SPAN - 0.5), s = 0.11 + rn() * 0.15, pelo = rn() < 0.62, ok = Math.hypot(px, pz) > 1.5 && L.every(q => Math.hypot(q.x - px, q.z - pz) > 0.6); if (ok) L.push({ x: px, z: pz, s, pelo, a: rn() * TAU, l: 1.4 + rn() * 1.6, c: 0.4 + rn() * 0.5 }); } return L; };
  const alturaPiel = (x, z, rp, poros) => {
    const r = Math.hypot(x, z); let y = 0;
    if (r < rp * 1.06) { const q = r / (rp * 1.06); y -= 1.3 * Math.pow(1 - q * q, 0.5); }
    y += 0.075 * Math.exp(-Math.pow((r - rp * 1.28) / (rp * 0.34), 2));
    for (const q of poros) { const d = Math.hypot(x - q.x, z - q.z); if (d < q.s * 1.5) { const u = d / q.s; y -= u < 1 ? q.s * 1.0 * Math.pow(1 - u * u, 0.6) : 0; y += 0.02 * q.s * Math.exp(-Math.pow((d - q.s * 1.15) / (q.s * 0.3), 2)) * 4; } }
    const g1 = Math.pow(Math.abs(Math.sin((x * 0.95 + z * 0.55) * 5.6 + 0.9 * Math.sin(z * 1.7))), 34), g2 = Math.pow(Math.abs(Math.sin((x * -0.55 + z * 0.95) * 5.0 + 0.8 * Math.sin(x * 1.5))), 34);
    return y - 0.014 * g1 - 0.012 * g2 + 0.011 * Math.sin(x * 11.3 + z * 7.1) * Math.sin(z * 9.7 - x * 5.3);
  };
  const texPiel = (semilla, rp, poros) => V.textura('piel|tex|' + semilla + '|' + rp, 1024, 1024, (x, W, H) => {
    const img = x.createImageData(W, H), d = img.data, S = SPAN * 2;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const X = (i / W - 0.5) * S, Z = (j / H - 0.5) * S, k = (j * W + i) * 4;
      const g1 = Math.pow(Math.abs(Math.sin((X * 0.95 + Z * 0.55) * 5.6 + 0.9 * Math.sin(Z * 1.7))), 34), g2 = Math.pow(Math.abs(Math.sin((X * -0.55 + Z * 0.95) * 5.0 + 0.8 * Math.sin(X * 1.5))), 34);
      const n = 0.5 + 0.25 * Math.sin(X * 3.1 + Math.sin(Z * 2.3)) + 0.25 * Math.sin(Z * 4.7 - X * 1.9 + Math.sin(X * 5.1));
      const gr = 1 - 0.28 * (g1 + g2), v = (0.9 + 0.2 * n) * gr;
      d[k] = Math.min(255, 218 * v); d[k + 1] = Math.min(255, 166 * v * (1 - 0.06 * n)); d[k + 2] = Math.min(255, 138 * v * (1 - 0.1 * n)); d[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const pu = (X) => (X / S + 0.5) * W, pv = (Z) => (Z / S + 0.5) * H, esc = W / S;
    const poro = (X, Z, r, osc) => { const cx = pu(X), cy = pv(Z), g = x.createRadialGradient(cx, cy, 0, cx, cy, r * esc * 1.9); g.addColorStop(0, `rgba(${osc},${Math.round(osc * 0.45)},${Math.round(osc * 0.35)},0.95)`); g.addColorStop(0.55, `rgba(${osc},${Math.round(osc * 0.5)},${Math.round(osc * 0.4)},0.7)`); g.addColorStop(1, 'rgba(120,60,50,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * esc * 1.9, 0, TAU); x.fill(); };
    poro(0, 0, rp, 70); for (const q of poros) poro(q.x, q.z, q.s, 110);
    // el borde de la textura se funde con el color medio (más allá hay un plano liso)
    const e = x.createRadialGradient(W / 2, H / 2, W * 0.36, W / 2, H / 2, W * 0.72); e.addColorStop(0, 'rgba(213,160,132,0)'); e.addColorStop(1, 'rgba(213,160,132,1)'); x.fillStyle = e; x.fillRect(0, 0, W, H);
  });
  MO.piel = (o = {}) => {
    const rp = o.poroRadio || 0.42, hij = [], sem = o.semilla || 0, tinte = o.color || '#ffffff', poros = listaPoros(sem, rp).slice(0, o.poros == null ? 54 : o.poros);
    const malla = MA.parametrica(GRID, GRID, (u, v) => { const x = (u - 0.5) * SPAN * 2, z = (v - 0.5) * SPAN * 2; return [x, alturaPiel(x, z, rp, poros), z]; }, { clave: 'piel|malla|' + sem + '|' + rp + '|' + poros.length });
    const mat = { color: tinte, mapa: texPiel(sem, rp, poros), esp: 0.28, dureza: 34, envolver: 0.55, borde: 0.2 };
    hij.push(nodo({ malla, mat, sinSombra: true }), nodo({ malla: MA.plano(90, 90, 1), pos: [0, -4, 0], mat: { color: tinte === '#ffffff' ? '#d5a084' : tinte, esp: 0.2, dureza: 20, envolver: 0.5 }, sinSombra: true }));
    if (o.sebo !== false) hij.push(nodo({ malla: MA.esfera(16), esc: [rp * 0.7, 0.14, rp * 0.7], pos: [0, -0.98, 0], mat: { color: '#e8b94c', tipo: 'brillo', esp: 0.9, dureza: 90, alfa: 0.9, envolver: 0.4 } }));
    if (o.pelo !== false) hij.push(MO.pelo({ largo: o.largoPelo || 4.6, radio: 0.1, curva: 0.5, pos: [rp * 0.14, -1.2, 0], color: o.colorPelo }));
    poros.forEach((q, i) => { if (q.pelo) hij.push(MO.pelo({ largo: q.l, radio: 0.04, curva: q.c, pos: [q.x, -q.s * 0.7, q.z], rot: [0, q.a, 0], color: '#6a5040', clave: 'pelo|v|' + (i % 6) + '|' + q.l.toFixed(1) })); });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, nombre: o.nombre, hijos: hij });
  };

  /* ---------------------------------------------------------------- folículo en corte (vertical) */
  MO.foliculo = (o = {}) => {
    const t = o.t || 0, L = o.largo || 5, R = o.radio || 0.62, rn = VE.rng('foli' + (o.semilla || 0)), hij = [];
    hij.push(nodo({ malla: MA.cilindro(R, R * 1.05, L, 36, false), pos: [0, -L / 2, 0], mat: { color: '#e29b8a', tipo: 'brillo', esp: 0.5, dureza: 40, alfa: 0.2, dobleCara: true, envolver: 0.5 }, sinSombra: true }));
    hij.push(nodo({ malla: MA.esfera(24), pos: [0, -L, 0], esc: [R * 1.4, R * 0.9, R * 1.4], mat: { color: '#d98d7c', tipo: 'brillo', esp: 0.4, dureza: 35, alfa: 0.55, envolver: 0.5 } }));        // bulbo
    hij.push(MO.pelo({ largo: L + 1.6, radio: 0.12, curva: 0.0, pos: [0, -L + 0.3, 0], color: '#5a4030' }));
    const ac = o.acaros || [{ y: 1.2, a: 0 }, { y: 2.1, a: 2.2 }, { y: 2.9, a: 4.2 }, { y: 1.7, a: 5.2 }];
    ac.forEach((q, i) => {
      const y = -q.y + Math.sin(t * 0.8 + i * 1.7) * 0.06 * (q.mueve == null ? 1 : q.mueve), ang = q.a, rad = 0.2 + (i % 2) * 0.04;
      hij.push(nodo({ pos: [Math.cos(ang) * rad, y, Math.sin(ang) * rad], rot: [0, -ang, -PI / 2 + Math.sin(t * 1.3 + i) * 0.04], hijos: [MO.demodex({ t, fase: i * 1.9, paso: 0.12, esc: q.esc || 1, nombre: 'acaro' + i })] }));
    });
    const ns = o.sebo == null ? 14 : o.sebo;
    for (let i = 0; i < ns; i++) { const a = rn() * TAU, d = 0.16 + rn() * (R - 0.25), y = -L * (0.1 + 0.85 * rn()) + Math.sin(t * 0.6 + i) * 0.05, s = 0.035 + rn() * 0.04;
      hij.push(nodo({ malla: MA.esfera(10), pos: [Math.cos(a) * d, y, Math.sin(a) * d], esc: s, mat: { color: '#f2c24d', tipo: 'brillo', esp: 0.9, dureza: 90, alfa: 0.9, envolver: 0.4 } })); }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };

  /* ---------------------------------------------------------------- glándula sebácea con huevos */
  MO.glandula = (o = {}) => {
    const t = o.t || 0, rn = VE.rng('gland' + (o.semilla || 0)), hij = [];
    const lob = [[0, 0, 0, 0.62]]; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = 0.62 + (i % 2) * 0.1; lob.push([Math.cos(a) * r, Math.sin(a) * r * 1.0, (i % 3 - 1) * 0.22, 0.34 + 0.06 * (i % 3)]); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 1.0, r = 0.98; lob.push([Math.cos(a) * r, Math.sin(a) * r, (i % 2 ? 0.2 : -0.25), 0.25]); }
    lob.forEach(([x, y, z, s], i) => hij.push(nodo({ malla: MA.esfera(22), pos: [x, y, z], esc: s, mat: { color: i === 0 ? '#f3c970' : '#efb85a', tipo: 'brillo', esp: 0.6, dureza: 50, alfa: i === 0 ? 0.22 : 0.4, envolver: 0.7, borde: 0.6 }, sinSombra: true })));
    const nh = o.huevos == null ? 0 : o.huevos;
    for (let i = 0; i < nh; i++) { const a = rn() * TAU, d = 0.1 + rn() * 0.3; hij.push(MO.demodex({ etapa: 'huevo', pos: [Math.cos(a) * d, Math.sin(a) * d, rn() * 0.2], rot: [rn() * PI, rn() * PI, rn() * PI] })); }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: hij });
  };
})(window.VE);
