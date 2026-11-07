/* VOLUMEN — MORENAS Y ARRECIFE (unidades: metros). Todo por codigo; pieles y rocas se pintan UNA vez.
     V.modelos.morena({ especie, id, t, escala, pos, rumbo, rot, alfa, boca, giro, cabeceo, amp, ondas, vel, ruta, apoyo, faringea, res })
        especie: 'helena' (morena mediterranea, parda con manchas amarillas) | 'javanicus' (morena gigante, leopardo con mancha oscura en la branquia)
                 | 'sathete' (morena serpiente gigante, parda lisa y muy larga) o un objeto como los de V.modelos.morena.especies.
        Cuerpo comprimido a los lados con aleta dorsal y anal continuas, SIN aletas pectorales, piel con mucosidad, cabeza en cuna con mandibula
        inferior articulada (boca 0..1), dientes curvos hacia atras, tubos nasales anteriores, ojo pequeno y abertura branquial (bombea al respirar).
        faringea 0..1: (solo se ve en rayosx) mandibulas faringeas que saltan hacia delante. ruta(u, L) -> [x,y,z]: linea central propia (u 0 = cola, 1 = cuello).
        Cabeza hacia +X. Nodos con nombre para anclar grafismos con V.posicion: 'cabeza', 'boca', 'ojo', 'branquia', 'faringe'.
     V.modelos.morena.largo(especie, escala)  largo total en metros.
     V.modelos.mero({ id, t, escala, pos, rumbo, sacude, boca })   mero coralino (Plectropomus): rojizo con puntos azules, boca grande, aletas y cola.
     V.modelos.pececillo({ id, t, escala, pos, rumbo, color })    pez pequeno plateado (presa / banco de fondo).
     V.modelos.manoBuzo({ pos, rot, esc, dedos })                 antebrazo de neopreno y mano con guante (hacia +X, muneca en el origen).
     V.modelos.roca({ semilla, esc, pos, rot, color })            roca irregular con algas y coralina.
     V.modelos.coral({ semilla, alto, color, pos, rumbo })        coral ramificado.
     V.modelos.arena({ w, d, pos })                               fondo de arena. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo, M4 = V.m4;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const sg = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
  const mezc = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

  /* ---------------------------------------------------------------- texturas */
  const manchaIrr = (x, cx, cy, r, col, a, rn, H) => {                         // mancha irregular (3-4 elipses solapadas); se repite en la costura vertical
    x.fillStyle = col; x.globalAlpha = a;
    const n = 3 + Math.floor(rn() * 2), partes = [];
    for (let i = 0; i < n; i++) partes.push([(rn() - 0.5) * r * 0.9, (rn() - 0.5) * r * 0.9, r * (0.45 + rn() * 0.5), r * (0.35 + rn() * 0.45), rn() * PI]);
    for (const dy of [0, -H, H]) { if (dy && Math.abs(cy + dy - H / 2) > H / 2 + r * 1.2) continue;
      for (const p of partes) { x.beginPath(); x.ellipse(cx + p[0], cy + dy + p[1], p[2], p[3], p[4], 0, TAU); x.fill(); } }
    x.globalAlpha = 1;
  };
  const ESP = {
    helena:    { largo: 1.0, b: 0.050, a: 0.030, cab: 0.130, iris: '#cdb24a', fin: '#3a2616', aleta: '#5a3d22', dorso: '#2c1c0f', flanco: '#47321f', vientre: '#6b5233', m1: '#ead06c', m2: '#f6ecb4', modo: 'puntos' },
    javanicus: { largo: 2.0, b: 0.046, a: 0.030, cab: 0.125, iris: '#c9c08a', fin: '#8f7440', aleta: '#9a7f45', dorso: '#85693a', flanco: '#a98c58', vientre: '#cdb987', m1: '#4a3318', m2: '#2d1f0e', modo: 'leopardo' },
    sathete:   { largo: 3.9, b: 0.026, a: 0.018, cab: 0.085, iris: '#bfae80', fin: '#4f4131', aleta: '#5c4c38', dorso: '#3a2d1c', flanco: '#5a4730', vientre: '#8a7656', m1: '#3d3125', m2: '#2c2319', modo: 'liso' },
  };
  const pielCuerpo = (n) => { const e = ESP[n]; return V.textura('mor|piel|' + n, 1024, 256, (x, W, H) => {   // x = largo (cola -> cuello), y = vuelta (lomo 25 %, vientre 75 %)
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, e.flanco); g.addColorStop(0.25, e.dorso); g.addColorStop(0.5, e.flanco); g.addColorStop(0.62, e.vientre); g.addColorStop(0.9, e.vientre); g.addColorStop(1, e.flanco);
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('mor|c|' + n);
    if (e.modo === 'puntos') {                                                                                   // helena: marmoleado oscuro con manchas amarillas
      for (let i = 0; i < 520; i++) manchaIrr(x, rn() * W, rn() * H, 4 + rn() * 8, '#150c05', 0.22 + rn() * 0.2, rn, H);
      for (let i = 0; i < 1500; i++) { const cy = rn() * H, vientre = cy > H * 0.55 && cy < H * 0.95; if (vientre && rn() < 0.6) continue; manchaIrr(x, rn() * W, cy, (vientre ? 1.4 : 1.8) + rn() * (vientre ? 2 : 4), rn() < 0.7 ? e.m1 : e.m2, 0.55 + rn() * 0.4, rn, H); }
    } else if (e.modo === 'leopardo') {                                                                          // javanicus: manchas pardas grandes, mas claras en el vientre
      for (let i = 0; i < 380; i++) { const cy = rn() * H, vientre = cy > H * 0.6 && cy < H * 0.92; manchaIrr(x, rn() * W, cy, (vientre ? 6 : 10) + rn() * (vientre ? 8 : 16), e.m1, (vientre ? 0.25 : 0.55) + rn() * 0.3, rn, H); }
      for (let i = 0; i < 700; i++) manchaIrr(x, rn() * W, rn() * H, 2 + rn() * 4.5, e.m2, 0.35 + rn() * 0.4, rn, H);
      for (const cy of [0, H * 0.5, H]) { const gr = x.createRadialGradient(W * 0.94, cy, 2, W * 0.94, cy, 54); gr.addColorStop(0, 'rgba(22,12,5,0.95)'); gr.addColorStop(0.6, 'rgba(22,12,5,0.8)'); gr.addColorStop(1, 'rgba(22,12,5,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(W * 0.94, cy, 54, 40, 0, 0, TAU); x.fill(); }   // mancha oscura de la branquia
    } else {
      for (let i = 0; i < 400; i++) manchaIrr(x, rn() * W, rn() * H, 6 + rn() * 14, e.m1, 0.08 + rn() * 0.12, rn, H);
    }
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + rn() * 0.05})`; x.fillRect(rn() * W, rn() * H, 1 + rn() * 2, 1); }
  }); };
  const pielCabeza = (n) => { const e = ESP[n]; return V.textura('mor|cabeza|' + n, 256, 400, (x, W, H) => {      // x = largo (cuello -> hocico), y = vuelta (lomo 25 %, boca 50 %)
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, e.flanco); g.addColorStop(0.25, e.dorso); g.addColorStop(0.5, e.flanco); g.addColorStop(0.75, e.vientre); g.addColorStop(1, e.flanco);
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('mor|h|' + n);
    if (e.modo === 'puntos') { for (let i = 0; i < 260; i++) manchaIrr(x, rn() * W, rn() * H, 5 + rn() * 9, '#150c05', 0.22 + rn() * 0.2, rn, H);
      for (let i = 0; i < 900; i++) manchaIrr(x, rn() * W, rn() * H, 1.6 + rn() * 4.2, rn() < 0.7 ? e.m1 : e.m2, 0.6 + rn() * 0.35, rn, H); }
    else if (e.modo === 'leopardo') { for (let i = 0; i < 160; i++) manchaIrr(x, rn() * W, rn() * H, 4 + rn() * 9, e.m1, 0.4 + rn() * 0.3, rn, H);
      for (let i = 0; i < 500; i++) manchaIrr(x, rn() * W, rn() * H, 1.5 + rn() * 3, e.m2, 0.4 + rn() * 0.4, rn, H); }
    else { for (let i = 0; i < 200; i++) manchaIrr(x, rn() * W, rn() * H, 4 + rn() * 10, e.m1, 0.1 + rn() * 0.12, rn, H); }
  }); };
  const pielMero = () => V.textura('mor|mero', 1024, 256, (x, W, H) => {                                         // x = cola -> hocico
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#b3532f'); g.addColorStop(0.25, '#7d3320'); g.addColorStop(0.5, '#b3532f'); g.addColorStop(0.62, '#e4b392'); g.addColorStop(0.9, '#ecc7a9'); g.addColorStop(1, '#b3532f');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('mero');
    for (let i = 0; i < 520; i++) manchaIrr(x, rn() * W, rn() * H, 8 + rn() * 14, '#5a1f12', 0.1 + rn() * 0.14, rn, H);
    for (let i = 0; i < 1900; i++) { const cx = rn() * W, cy = rn() * H, cabeza = cx > W * 0.7, r = cabeza ? 1.6 + rn() * 2.2 : 2.2 + rn() * 3.2;
      x.fillStyle = 'rgba(20,40,80,0.55)'; x.beginPath(); x.arc(cx, cy, r + 1.2, 0, TAU); x.fill(); x.fillStyle = cabeza ? '#7fd8ff' : '#58b8f0'; x.globalAlpha = 0.9; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalAlpha = 1; }
  });
  const pielPez = (c) => V.textura('mor|pez|' + c, 256, 128, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a5a78'); g.addColorStop(0.45, c); g.addColorStop(0.55, '#e8eef2'); g.addColorStop(1, '#fbfcfd'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rn = VE.rng('pez' + c); for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(255,255,255,${0.04 + rn() * 0.12})`; x.beginPath(); x.arc(rn() * W, rn() * H, 1 + rn() * 2.5, 0, TAU); x.fill(); } });
  const pielRoca = (k, base) => V.textura('mor|roca|' + k, 512, 512, (x, W, H) => {
    x.fillStyle = base || '#6b6255'; x.fillRect(0, 0, W, H); const rn = VE.rng('roca' + k);
    const pts = (n, col, a0, a1, r0, r1) => { for (let i = 0; i < n; i++) { x.fillStyle = col; x.globalAlpha = a0 + rn() * (a1 - a0); x.beginPath(); x.arc(rn() * W, rn() * H, r0 + rn() * (r1 - r0), 0, TAU); x.fill(); } x.globalAlpha = 1; };
    pts(700, '#8a8070', 0.05, 0.25, 3, 22); pts(600, '#2a251e', 0.1, 0.4, 3, 24);
    pts(90, '#6a7a3a', 0.06, 0.22, 10, 36); pts(40, '#3f5a3a', 0.06, 0.18, 14, 36);                  // algas
    pts(40, '#b87a82', 0.1, 0.3, 4, 14); pts(25, '#d0a860', 0.08, 0.25, 3, 9);                    // coralina rosa y esponjas
    pts(900, '#d8d2c0', 0.04, 0.2, 1, 3); });
  const pielArena = () => V.textura('mor|arena', 512, 512, (x, W, H) => {
    x.fillStyle = '#b9a77c'; x.fillRect(0, 0, W, H); const rn = VE.rng('arena');
    for (let j = 0; j < 22; j++) { x.strokeStyle = `rgba(255,244,214,${0.08 + rn() * 0.1})`; x.lineWidth = 2 + rn() * 3; x.beginPath(); for (let i = 0; i <= 24; i++) { const px = i / 24 * W, py = (j + 0.5) / 22 * H + Math.sin(i * 0.9 + j) * 7; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    for (let i = 0; i < 3500; i++) { x.fillStyle = rn() < 0.5 ? `rgba(70,55,35,${0.05 + rn() * 0.2})` : `rgba(255,248,225,${0.05 + rn() * 0.2})`; x.fillRect(rn() * W, rn() * H, 1 + rn() * 2, 1 + rn() * 2); } });

  /* ================================================================ MORENA ================================================================ */
  const dame = (e) => typeof e === 'string' ? ESP[e] : e;
  const nombreEsp = (e) => typeof e === 'string' ? e : (e.nombre || 'helena');
  MO.morena = (o = {}) => {
    const nom = nombreEsp(o.especie || 'helena'), e = dame(o.especie || 'helena'), id = o.id || 'mor', s = o.escala == null ? 1 : o.escala, t = o.t || 0;
    const L = e.largo * s, bH = e.b * L, aW = e.a * L, hl = e.cab * L, Lb = L - 0.85 * hl;
    const amp = (o.amp == null ? 0.05 : o.amp) * L, ond = o.ondas == null ? 1.3 : o.ondas, fase = (o.vel == null ? 2.0 : o.vel) * t, apoyo = o.apoyo !== false;
    const forma = (u) => { const cola = u < 0.3 ? 0.06 + 0.94 * Math.pow(Math.sin(u / 0.3 * PI / 2), 0.9) : 1; const g = cola * (1 + 0.07 * Math.sin(PI * c01((u - 0.15) / 0.8))); return [aW * g, bH * g]; };
    const base0 = (u) => o.ruta ? o.ruta(u, L) : [-L / 2 + u * Lb, 0, Math.sin(u * ond * TAU - fase) * amp * (0.3 + 0.7 * (1 - u))];
    const base = (u) => { const p = base0(u); return apoyo ? [p[0], p[1] + forma(u)[1], p[2]] : p; };
    const marco = (u) => { const p = base(u), q = base(Math.min(1, u + 0.004)), p0 = base(Math.max(0, u - 0.004));
      let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const m = Math.hypot(...T) || 1; T = T.map(v => v / m);
      let S = [T[2], 0, -T[0]]; const ms = Math.hypot(...S) || 1; S = S.map(v => v / ms);
      const U = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]]; return { p, T, S, U }; };
    const punto = (u, phi, k = 1) => { const [a, b] = forma(u), m = marco(u), ca = Math.cos(phi) * a * k, sa = Math.sin(phi), sy = (sa > 0 ? sa : sa * 0.9) * b * k;
      return [m.p[0] + m.S[0] * ca + m.U[0] * sy, m.p[1] + m.S[1] * ca + m.U[1] * sy, m.p[2] + m.S[2] * ca + m.U[2] * sy]; };
    const NU = o.res || 150;
    const cuerpo = MA.parametrica(NU, 20, (u, v) => punto(u, v * TAU, 1 - 0.1 * sm(0.9, 1, u)), { dinamica: 'mor|c|' + id });
    const matPiel = { color: '#ffffff', mapa: pielCuerpo(nom), esp: 0.42, dureza: 40, envolver: 0.3, borde: 0.3 }, matCab = { color: '#ffffff', mapa: pielCabeza(nom), esp: 0.42, dureza: 40, envolver: 0.3, borde: 0.3 };
    /* aletas dorsal y anal (cintas continuas, sin pectorales) */
    const cinta = (cl, u0, u1, abajo, f0) => MA.parametrica(70, 2, (q, v) => { const u = lerp(u0, u1, q), m = marco(u), P = punto(u, abajo ? -PI / 2 : PI / 2, 1.0), h = forma(u)[1] * f0 * 0.6 * (0.25 + 0.75 * sm(0.03, 0.22, u)) * (1 + 0.06 * Math.sin(q * 60)) * (1 - 0.5 * sm(0.92, 1, u)), d = abajo ? -1 : 1;
      return [P[0] + m.U[0] * h * d * v - m.U[0] * d * 0.002, P[1] + m.U[1] * h * d * v, P[2] + m.U[2] * h * d * v]; }, { dinamica: cl, abierta: true });
    const matAleta = { color: e.aleta, alfa: 0.96, esp: 0.12, dureza: 14, envolver: 0.5, dobleCara: true };
    /* ---- cabeza: marco local (origen = extremo del cuerpo, +X hacia delante) ---- */
    const mc = marco(1), P = mc.p, yaw = Math.atan2(-mc.T[2], mc.T[0]) + (o.giro || 0), cab = o.cabeceo || 0;
    const hHW = (u) => aW * (1.04 + 0.24 * sm(0, 0.4, u)) * (1 - 0.58 * sm(0.4, 0.98, u));
    const hTop = (u) => bH * (1 + 0.04 * sm(0, 0.3, u) - 0.56 * sm(0.4, 0.98, u));
    const hBot = (u) => -bH * (0.08 + 0.1 * u);
    const capa = (u) => u > 0.9 ? Math.sqrt(Math.max(0.0004, 1 - Math.pow((u - 0.9) / 0.1, 2))) : 1;
    const N = 3 / 2;                                                                                           // exponente 2/3 de la superelipse (n = 3)
    const hPunto = (u, phi, k = 1) => { const c = capa(u), hw = hHW(u) * c * k, yt = hTop(u), yb = hBot(u), hy = (yt - yb) / 2 * c * k; return [u * hl, (yt + yb) / 2 + sg(Math.sin(phi), 1 / N) * hy, sg(Math.cos(phi), 1 / N) * hw]; };
    const clv = nom + '|' + L.toFixed(3);
    const cabezaMalla = MA.parametrica(44, 28, (u, v) => hPunto(lerp(1, -0.14, u), v * TAU), { clave: 'mor|cab|' + clv });
    const xh = 0.28 * hl, yh = hBot(0.28);
    const jaula = MA.parametrica(34, 24, (u0, v) => { const u = 1 - u0, xr = lerp(-0.25 * hl, 0.72 * hl, u), ua = (xh + xr) / hl, c = (u < 0.08 ? Math.sqrt(Math.max(0.0004, 1 - Math.pow((0.08 - u) / 0.08, 2))) : 1) * (u > 0.9 ? Math.sqrt(Math.max(0.0004, 1 - Math.pow((u - 0.9) / 0.1, 2))) : 1);
      const ytop = hBot(ua) - yh, D = bH * (0.92 - 0.45 * sm(0.15, 1, u)) * c, hw = 0.9 * hHW(ua) * c, ph = v * TAU; return [xr, ytop - D / 2 + sg(Math.sin(ph), 1 / N) * D / 2, sg(Math.cos(ph), 1 / N) * hw]; }, { clave: 'mor|jaula|' + clv });
    const diente = MA.cilindro(bH * 0.03, 0, 1, 6, false);
    const dientes = (inf) => { const partes = [], rn = VE.rng('dientes' + nom + inf);
      const fila = (n, u0, u1, kz, f) => { for (let i = 0; i < n; i++) for (const lado of [1, -1]) { const q = n > 1 ? i / (n - 1) : 0.5, u = lerp(u0, u1, q), ln = bH * (0.13 + 0.1 * Math.sin(PI * (0.15 + 0.7 * q))) * (0.85 + 0.3 * rn()) * f;
          const x = inf ? (xh - xh + u * hl - xh) : u * hl, zz = lado * (inf ? 0.9 : 1) * hHW(u) * kz * (u > 0.9 ? capa(u) : 1), yy = inf ? (hBot(u) - yh) : hBot(u);
          partes.push({ malla: diente, m: M4.mul(M4.tras(x, yy + (inf ? ln / 2 : -ln / 2), zz), M4.mul(inf ? M4.rotX(PI) : M4.id(), M4.mul(M4.rotZ(-0.25), M4.esc(1, ln, 1)))) }); } };
      if (inf) { fila(8, 0.12, 0.97, 0.78, 1); fila(4, 0.5, 0.92, 0.38, 0.8); } else { fila(9, 0.42, 0.97, 0.8, 1); fila(4, 0.5, 0.88, 0.36, 0.75); }
      return MA.fusionar(partes, 'mor|dientes|' + (inf ? 'i' : 's') + '|' + clv); };
    const matDiente = { color: '#f3ecd8', esp: 0.65, dureza: 60, envolver: 0.5, borde: 0.4 };
    const vid = 1 - 0.7 * c01(o.vidrio || 0), ang = c01(o.boca == null ? 0 : o.boca) * 0.62, bomba = o.respira == null ? 0 : o.respira;
    const ojoU = 0.43, ojoPhi = 0.6, pe = hPunto(ojoU, ojoPhi, 0.97), re = bH * 0.11, nrm = [0.1, 0.45, pe[2] > 0 ? 1 : -1], nl = Math.hypot(...nrm), nn = nrm.map(v => v / nl);
    const hijosCab = [
      nodo({ malla: cabezaMalla, mat: matCab, alfa: vid }),
      nodo({ nombre: 'boca', pos: [hl * 0.99, hBot(0.99) + bH * 0.05, 0], esc: 0.001 }),
      nodo({ nombre: 'jaula_pivote', pos: [xh, yh, 0], rot: [0, 0, -ang], hijos: [
        nodo({ malla: jaula, mat: matCab, alfa: vid }),
        nodo({ malla: dientes(true), mat: matDiente }),
        nodo({ malla: MA.esfera(14), esc: [hl * 0.3, bH * 0.04, hHW(0.5) * 0.7], pos: [hl * 0.34, -bH * 0.05, 0], mat: { color: '#9a3e44', esp: 0.5, dureza: 40, envolver: 0.4 } }),             // lengua / suelo de la boca
      ] }),
      nodo({ malla: dientes(false), mat: matDiente }),
      nodo({ malla: MA.esfera(14), esc: [hl * 0.36, bH * 0.035, hHW(0.55) * 0.62], pos: [hl * 0.66, hBot(0.66) + bH * 0.02, 0], mat: { color: '#6e2830', esp: 0.4, dureza: 30, envolver: 0.4 } }),   // paladar
    ];
    for (const lado of [1, -1]) {
      const pe2 = [pe[0], pe[1], Math.abs(pe[2]) * lado];
      hijosCab.push(nodo({ nombre: lado > 0 ? 'ojo' : 'ojo_i', pos: pe2, hijos: [
        nodo({ malla: MA.esfera(14), esc: re, mat: { color: e.iris, esp: 0.85, dureza: 110, envolver: 0.2 } }),
        nodo({ malla: MA.esfera(10), esc: re * 0.62, pos: [nn[0] * re * 0.5, nn[1] * re * 0.5, nn[2] * lado * re * 0.5], mat: { color: '#050403', esp: 0.9, dureza: 120, tipo: 'plano' } }),
        nodo({ malla: MA.esfera(8), esc: re * 0.16, pos: [nn[0] * re * 0.95 + re * 0.15, nn[1] * re * 0.95 + re * 0.2, nn[2] * lado * re * 0.8], mat: { color: '#ffffff', tipo: 'plano' }, sinSombra: true }) ] }));
      const pt = hPunto(0.95, lado > 0 ? 0.8 : PI - 0.8, 1.0);                                                  // tubo nasal anterior
      hijosCab.push(nodo({ malla: MA.cilindro(bH * 0.06, bH * 0.05, bH * 0.22, 8, true), pos: [pt[0] - bH * 0.1, pt[1] + bH * 0.1, pt[2]], rot: [0, 0, 0], mat: { color: '#9b7a4a', esp: 0.4, dureza: 30, envolver: 0.4 } }));
      const pn = hPunto(0.36, lado > 0 ? 1.12 : PI - 1.12, 1.0);                                                 // nariz posterior
      hijosCab.push(nodo({ malla: MA.esfera(8), esc: [bH * 0.06, bH * 0.04, bH * 0.06], pos: pn, mat: { color: '#0a0705', tipo: 'plano' } }));
      hijosCab.push(nodo({ nombre: lado > 0 ? 'branquia' : 'branquia_i', malla: MA.esfera(10), esc: [bH * 0.09, bH * 0.17 * (1 + 0.55 * bomba), bH * 0.04], pos: [0.0, -bH * 0.12, lado * (forma(1)[0] * 0.98)], mat: { color: '#2a1a0e', esp: 0.2, dureza: 12, tipo: 'plano' } }));   // abertura branquial
    }
    if (o.faringea != null) {                                                                                    // mandibulas faringeas (en la garganta)
      const f = c01(o.faringea), cono = MA.cilindro(bH * 0.018, 0, 1, 5, false);
      const x0 = lerp(0.08 * hl, 0.56 * hl, f);
      hijosCab.push(nodo({ nombre: 'faringe', pos: [x0, -bH * 0.12, 0], hijos: [-1, 1].map(lado => nodo({ pos: [0, 0, lado * bH * 0.2], hijos: [
        nodo({ malla: MA.esfera(12), esc: [hl * 0.2, bH * 0.07, bH * 0.1], mat: { color: '#efe3bf', esp: 0.5, dureza: 40, emision: 0.5, tipo: 'plano' } }),
        ...[0, 1, 2, 3, 4].map(i => nodo({ malla: cono, pos: [hl * (-0.1 + i * 0.05), bH * 0.05, 0], rot: [PI, 0, 0.5], esc: [1, bH * (0.16 + 0.03 * Math.sin(i * 2)), 1], mat: { color: '#fff8e0', emision: 0.6, tipo: 'plano' }, sinSombra: true })) ] })) }));
    }
    const hijos = [
      nodo({ malla: cuerpo, mat: matPiel }),
      nodo({ malla: cinta('mor|d|' + id, 0.04, 0.9, false, 0.5), mat: matAleta }),
      nodo({ malla: cinta('mor|a|' + id, 0.04, 0.6, true, 0.32), mat: matAleta }),
      nodo({ nombre: 'cabeza', pos: P, rot: [0, yaw, cab], hijos: hijosCab }),
    ];
    return nodo({ pos: o.pos, rot: o.rot || [0, o.rumbo || 0, 0], alfa: o.alfa, hijos });
  };
  MO.morena.especies = ESP;
  MO.morena.largo = (e, s = 1) => dame(e).largo * s;

  /* ================================================================ MERO ================================================================ */
  MO.mero = (o = {}) => {
    const s = o.escala == null ? 1 : o.escala, L = 0.9 * s, t = o.t || 0, id = o.id || 'mero', bm = 0.16 * L, sac = o.sacude || 0, amp = 0.035 * L, fase = 3.2 * t;
    const fprof = (q) => Math.sin(PI * Math.pow(c01(q), 1.16));
    const cx = (q) => lerp(-L / 2, L * 0.5, q), cz = (q) => Math.sin(q * 5 - fase) * amp * (1 - q) * 1.0 + Math.sin(t * 24) * 0.012 * L * sac * q;
    const cuerpo = MA.parametrica(70, 20, (u, v) => { const q = u, f = fprof(q), b = bm * Math.max(0.03, f), a = b * 0.5, ph = v * TAU, sa = Math.sin(ph);
      return [cx(q), bm * 1.0 + (sa > 0 ? sa : sa * 0.92) * b, cz(q) + Math.cos(ph) * a]; }, { dinamica: 'mero|c|' + id });
    const mat = { color: '#ffffff', mapa: pielMero(), esp: 0.4, dureza: 40, envolver: 0.3, borde: 0.3 }, aleta = { color: '#c4562c', alfa: 0.92, esp: 0.1, dureza: 12, envolver: 0.5, dobleCara: true };
    const dorsal = [[0, 0]]; for (let i = 0; i <= 11; i++) dorsal.push([i * 0.045, 0.085 + 0.025 * Math.sin(i * 1.7) + (i > 7 ? -0.012 * (i - 7) : 0)]); dorsal.push([0.52, 0]);
    const aDor = MA.extrusion(dorsal.map(p => [p[0] * L, p[1] * L]), 0.004 * L, 'mero|dor|' + L.toFixed(2));
    const aAnal = MA.extrusion([[0, 0], [0.04, -0.07], [0.12, -0.075], [0.2, -0.04], [0.22, 0]].map(p => [p[0] * L, p[1] * L]), 0.004 * L, 'mero|anal|' + L.toFixed(2));
    const cola = MA.extrusion([[0, 0.012], [-0.07, 0.085], [-0.13, 0.1], [-0.155, 0.04], [-0.15, -0.04], [-0.13, -0.1], [-0.07, -0.085], [0, -0.012]].map(p => [p[0] * L, p[1] * L]), 0.004 * L, 'mero|cola|' + L.toFixed(2));
    const pect = MA.esfera(12);
    const qj = 0.9, hy = bm * 1.0, abre = c01(o.boca || 0) * 0.5;
    const ojoQ = 0.8, ojoB = bm * fprof(ojoQ);
    const hijos = [
      nodo({ malla: cuerpo, mat }),
      nodo({ malla: aDor, pos: [cx(0.3), bm + bm * fprof(0.45) * 0.97 - 0.035 * L, cz(0.3)], mat: aleta }),
      nodo({ malla: aAnal, pos: [cx(0.46), bm - bm * fprof(0.55) * 0.9 + 0.03 * L, cz(0.46)], mat: aleta }),
      nodo({ malla: cola, pos: [cx(0.02), bm, cz(0.02)], rot: [0, Math.sin(fase * 1.0) * 0.35, 0], mat: aleta }),
      ...[1, -1].map(k => nodo({ malla: pect, esc: [0.07 * L, 0.012 * L, 0.04 * L], pos: [cx(0.72), bm * 0.85, cz(0.72) + k * bm * 0.5], rot: [0, 0, -0.3 + 0.25 * Math.sin(t * 6 + k)], mat: aleta })),
      nodo({ malla: MA.esfera(16), esc: [0.11 * L, 0.04 * L, 0.052 * L], pos: [cx(0.89), hy - bm * 0.36 - abre * 0.07, cz(0.89)], rot: [0, 0, -abre * 0.8], mat }),                  // mandibula inferior (prominente)
      nodo({ malla: MA.esfera(14), esc: [0.1 * L, 0.012 * L + abre * 0.03 * L, 0.04 * L], pos: [cx(0.9), hy - bm * 0.25 - abre * 0.04, cz(0.9)], mat: { color: '#3a0f12', tipo: 'plano' } }),    // interior de la boca
      ...[1, -1].map(k => nodo({ pos: [cx(ojoQ), bm + ojoB * 0.35, cz(ojoQ) + k * bm * 0.46], hijos: [
        nodo({ malla: MA.esfera(14), esc: 0.03 * L, mat: { color: '#e8b64a', esp: 0.85, dureza: 110, envolver: 0.2 } }),
        nodo({ malla: MA.esfera(10), esc: 0.019 * L, pos: [0.012 * L, 0.004 * L, k * 0.017 * L], mat: { color: '#050403', tipo: 'plano' } }) ] })),
    ];
    return nodo({ pos: o.pos, rot: [0, (o.rumbo || 0) + Math.sin(t * 24) * 0.35 * sac, 0], alfa: o.alfa, hijos });
  };

  /* ================================================================ PECECILLO ================================================================ */
  MO.pececillo = (o = {}) => {
    const s = o.escala == null ? 1 : o.escala, t = o.t || 0, c = o.color || '#6a8fb0', L = 0.13 * s, aleta = { color: '#9fb4c4', alfa: 0.85, dobleCara: true, esp: 0.1 };
    const cola = MA.extrusion([[0, 0.01], [-0.07, 0.08], [-0.095, 0.0], [-0.07, -0.08], [0, -0.01]].map(p => [p[0] * L * 1.5, p[1] * L * 1.5]), 0.003 * L, 'pez|cola');
    return nodo({ pos: o.pos, rot: [0, o.rumbo || 0, o.cabeceo || 0], alfa: o.alfa, hijos: [
      nodo({ malla: MA.esfera(16), esc: [L * 0.5, L * 0.19, L * 0.1], mat: { color: '#fff', mapa: pielPez(c), esp: 0.7, dureza: 70, envolver: 0.3, borde: 0.4 } }),
      nodo({ malla: cola, pos: [-L * 0.46, 0, 0], rot: [0, Math.sin(t * 14 + (o.id || 'p').length) * 0.45, 0], mat: aleta }),
      nodo({ malla: MA.esfera(8), esc: [L * 0.1, L * 0.11, L * 0.012], pos: [-L * 0.05, L * 0.17, 0], mat: aleta }),
      ...[1, -1].map(k => nodo({ malla: MA.esfera(8), esc: L * 0.034, pos: [L * 0.32, L * 0.04, k * L * 0.075], mat: { color: '#0b0b0e', esp: 0.9, dureza: 90 } })) ] });
  };

  /* ================================================================ MANO DE BUZO ================================================================ */
  MO.manoBuzo = (o = {}) => {
    const d = c01(o.dedos == null ? 0.2 : o.dedos), neo = { color: '#1d2027', esp: 0.4, dureza: 35, envolver: 0.35 }, guante = { color: '#454c59', esp: 0.35, dureza: 30, envolver: 0.4 };
    const dedo = (z, lar, k) => nodo({ pos: [0.095, 0, z], rot: [0, 0, -0.1 - d * 0.9 * k], hijos: [
      nodo({ malla: MA.capsula(0.0115, 0.0105, lar, 8), rot: [0, 0, PI / 2], mat: guante }),
      nodo({ pos: [lar, 0, 0], rot: [0, 0, -d * 0.9], hijos: [nodo({ malla: MA.capsula(0.0105, 0.009, lar * 0.8, 8), rot: [0, 0, PI / 2], mat: guante })] }) ] });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: MA.capsula(0.046, 0.038, 0.34, 14), rot: [0, 0, -PI / 2], mat: neo }),
      nodo({ malla: MA.cilindro(0.04, 0.04, 0.03, 16, true), rot: [0, 0, PI / 2], pos: [0.0, 0, 0], mat: { color: '#3b4048', esp: 0.3, dureza: 30 } }),
      nodo({ malla: MA.caja(0.105, 0.036, 0.09, 0.014, 4), pos: [0.055, 0, 0], mat: guante }),
      dedo(-0.032, 0.05, 1), dedo(-0.011, 0.056, 1.05), dedo(0.011, 0.052, 1), dedo(0.032, 0.044, 0.95),
      nodo({ pos: [0.035, -0.012, 0.05], rot: [0.6, 0.5, -0.35 - d * 0.4], hijos: [nodo({ malla: MA.capsula(0.012, 0.01, 0.055, 8), rot: [0, 0, PI / 2], mat: guante })] }) ] });
  };

  /* ================================================================ ARRECIFE ================================================================ */
  const mallaRoca = (sem) => { const r = VE.rng('roca|' + sem), f = [r() * 6, r() * 6, r() * 6, r() * 6];
    return MA.parametrica(40, 28, (u, v) => { const a = u * TAU, th = v * PI, n = 0.2 * Math.sin(3 * a + f[0]) * Math.sin(2 * th + f[1]) + 0.12 * Math.sin(5 * a - 2 * th + f[2]) + 0.07 * Math.sin(9 * th + 4 * a + f[3]);
      const rr = 1 + n, p = [Math.sin(th) * Math.sin(a) * rr, Math.cos(th) * rr, Math.sin(th) * Math.cos(a) * rr]; p[1] = Math.max(p[1], -0.32); return p; }, { clave: 'roca|m|' + sem }); };
  MO.roca = (o = {}) => nodo({ malla: mallaRoca(o.semilla || 1), pos: o.pos, rot: o.rot, esc: o.esc == null ? 1 : o.esc, alfa: o.alfa, mat: { color: o.color || '#ffffff', mapa: pielRoca('a'), esp: 0.1, dureza: 10, envolver: 0.35, borde: 0.3 } });
  const mallaCoral = (sem, alto) => { const r = VE.rng('coral|' + sem), partes = [], v3 = V.v3;
    const rama = (p, d, lar, rad, prof) => { const pts = []; for (let i = 0; i <= 4; i++) { const q = i / 4; pts.push([p[0] + d[0] * lar * q + (r() - 0.5) * lar * 0.06, p[1] + d[1] * lar * q, p[2] + d[2] * lar * q + (r() - 0.5) * lar * 0.06]); }
      partes.push({ malla: MA.tubo(pts, (q) => rad * (1 - 0.7 * q), 5, { clave: 'coral|t|' + sem + '|' + partes.length }) }); if (prof <= 0) return;
      const fin = pts[4], n = 2 + (r() < 0.5 ? 1 : 0); for (let i = 0; i < n; i++) { const a = r() * TAU, inc = 0.45 + r() * 0.45, nd = v3.norm([d[0] + Math.sin(a) * inc, d[1] * 0.9 + 0.25, d[2] + Math.cos(a) * inc]); rama(fin, nd, lar * (0.62 + r() * 0.15), rad * 0.72, prof - 1); } };
    rama([0, 0, 0], [0, 1, 0], alto * 0.4, alto * 0.05, 3); return MA.fusionar(partes, 'coral|' + sem + '|' + alto); };
  MO.coral = (o = {}) => nodo({ malla: mallaCoral(o.semilla || 1, o.alto || 0.4), pos: o.pos, rot: [0, o.rumbo || 0, 0], esc: o.esc, alfa: o.alfa, mat: { color: o.color || '#e2745c', esp: 0.3, dureza: 30, envolver: 0.4, borde: 0.3 } });
  MO.arena = (o = {}) => nodo({ malla: MA.plano(o.w || 40, o.d || 40, 1), pos: o.pos, mat: { color: '#ffffff', mapa: pielArena(), repetir: [10, 10], esp: 0.04, dureza: 8, envolver: 0.4 } });
})(window.VE);
