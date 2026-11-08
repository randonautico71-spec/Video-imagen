/* VOLUMEN — BALLENAS. Unidades: metros. Cabeza hacia +X; la cola ondula en vertical (como los cetaceos).
     V.modelos.ballena({ tipo:'azul'|'livyatan'|'pequena', id, t, escala, pos, rumbo|rot, esc, alfa, boca 0..1, amp, ondas, vel })
        escala = largo total (azul 28, livyatan 15, pequena 5). 'livyatan': cabeza cuadrada ~1/3 del cuerpo, mandibula inferior estrecha y dientes en las dos mandibulas
        (proporcion real: dientes de ~0,024 del largo). 'azul': esbelta, aleta dorsal diminuta, garganta con pliegues, cabeza en U.
        Nodos con nombre: 'mandibula', 'cabeza', 'boca', 'morro', 'diente' (punta del diente mayor), 'ojo'. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo, M = V.m4;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const piel = (tipo) => V.textura('bal|' + tipo, 1024, 256, (x, W, H) => {                                          // x = cola -> hocico, y = vuelta (lomo 25 %, vientre 75 %)
    const c = tipo === 'azul' ? ['#6f8ca3', '#4f6d86', '#7f9bb0', '#b9cad6', '#d9e3ea'] : tipo === 'livyatan' ? ['#6b6560', '#4a4541', '#6f6a64', '#a39d94', '#bdb7ac'] : ['#9a8f7e', '#7a705f', '#a39886', '#d4cab6', '#e3dbc9'];
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c[0]); g.addColorStop(0.25, c[1]); g.addColorStop(0.42, c[2]); g.addColorStop(0.62, c[3]); g.addColorStop(0.8, c[4]); g.addColorStop(1, c[0]);
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('bal|' + tipo);
    if (tipo === 'azul') { for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(170,200,220,${0.05 + rn() * 0.1})`; x.beginPath(); x.ellipse(rn() * W, (0.05 + rn() * 0.4) * H, 6 + rn() * 14, 3 + rn() * 6, rn() * 3, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(40,60,80,0.35)'; x.lineWidth = 1.6; for (let i = 0; i < 20; i++) { const y = (0.58 + i * 0.016) * H; x.beginPath(); x.moveTo(W * 0.55, y); x.lineTo(W, y); x.stroke(); } }
    else { x.strokeStyle = 'rgba(25,22,20,0.28)'; x.lineWidth = 1.5; for (let i = 0; i < 90; i++) { const y = rn() * H * 0.9; x.beginPath(); x.moveTo(rn() * W, y); x.lineTo(rn() * W, y + (rn() - 0.5) * 22); x.stroke(); }
      for (let i = 0; i < 110; i++) { x.strokeStyle = `rgba(225,215,200,${0.2 + rn() * 0.3})`; x.lineWidth = 1 + rn() * 2; const a = rn() * W, b = (0.1 + rn() * 0.6) * H; x.beginPath(); x.moveTo(a, b); x.lineTo(a + 20 + rn() * 50, b + (rn() - 0.5) * 18); x.stroke(); } }
    for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(255,255,255,${0.015 + rn() * 0.04})`; x.fillRect(rn() * W, rn() * H, 1 + rn() * 3, 1); } });
  MO.ballena = (o = {}) => {
    const tipo = o.tipo || 'azul', L = o.escala == null ? 10 : o.escala, Lb = 0.85 * L, id = o.id || 'bal', t = o.t || 0, liv = tipo === 'livyatan';
    const amp = (o.amp == null ? 0.045 : o.amp) * L, ond = o.ondas == null ? 0.8 : o.ondas, fase = (o.vel == null ? 1.6 : o.vel) * t;
    const rMax = liv ? 0.1 : (tipo === 'azul' ? 0.062 : 0.075), uMax = liv ? 0.7 : 0.56;
    const prof = (u) => { if (u < uMax) return L * (0.011 + (rMax - 0.011) * Math.pow(sm(0, uMax, u), 0.85));
      const q = c01((u - uMax) / (1 - uMax)); if (liv) return L * rMax * Math.pow(Math.max(0, 1 - Math.pow(q, 9)), 0.5) * (1 - 0.05 * q); return L * rMax * Math.pow(Math.max(0, 1 - Math.pow(q, 2.2)), 0.5) * (1 - 0.25 * q * q); };
    const base = (u) => [-Lb / 2 + u * Lb, Math.sin(u * ond * TAU - fase) * amp * (Math.pow(1 - u, 1.5) + 0.03), 0];
    const marco = (u) => { const p = base(u), q = base(Math.min(1, u + 0.004)), p0 = base(Math.max(0, u - 0.004));
      let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const mm = Math.hypot(...T) || 1; T = T.map(v => v / mm);
      let S = [0, 0, 1]; const U = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]]; return { p, T, S, U, pitch: Math.atan2(T[1], T[0]) }; };
    const punto = (u, phi, k = 1) => { const r = prof(u), m = marco(u), a = r * 0.95 * k, b = r * (liv && u > uMax ? 0.95 : 1) * k, ca = Math.cos(phi) * a, sa = Math.sin(phi) * b;
      return [m.p[0] + m.S[0] * ca + m.U[0] * sa, m.p[1] + m.S[1] * ca + m.U[1] * sa, m.p[2] + m.S[2] * ca + m.U[2] * sa]; };
    const cuerpo = MA.parametrica(120, 22, (u, v) => punto(u, v * TAU), { dinamica: 'bal|c|' + id });
    const mat = { color: '#ffffff', mapa: piel(tipo), esp: 0.3, dureza: 30, envolver: 0.35, borde: 0.3 }, matF = { color: tipo === 'azul' ? '#4f6d86' : '#47413d', esp: 0.2, dureza: 20, envolver: 0.45, dobleCara: true };
    const ext = (pts, cl) => MA.extrusion(pts.map(p => [p[0] * L, p[1] * L]), 0.004 * L, 'bal|' + cl + '|' + L.toFixed(2));
    const fl = [[0.012, 0], [-0.01, 0.025], [-0.05, 0.08], [-0.085, 0.125], [-0.1, 0.13], [-0.095, 0.095], [-0.075, 0.055], [-0.06, 0.02], [-0.07, 0.0]];
    const fluke = ext(fl.concat(fl.slice(0, -1).reverse().map(p => [p[0], -p[1]])).slice(0, 17), 'fk');
    const aletaP = ext([[0.04, 0], [0.01, -0.02], [-0.06, -0.07], [-0.075, -0.065], [-0.05, -0.012], [-0.04, 0]], 'pe');
    const dors = ext([[0.03, 0], [0.004, 0.012], [-0.02, 0.03], [-0.035, 0.03], [-0.04, 0]], 'dr');
    const m0 = marco(0);
    const hijos = [nodo({ malla: cuerpo, mat }),
      nodo({ pos: [m0.p[0] - 0.012 * L, m0.p[1], m0.p[2]], rot: [0, 0, m0.pitch + 0.25 * Math.sin(fase * 0.5)], hijos: [nodo({ rot: [PI / 2, 0, 0], hijos: [nodo({ malla: fluke, mat: matF })] })] })];
    const mf = marco(tipo === 'azul' ? 0.12 : 0.17); hijos.push(nodo({ pos: punto(tipo === 'azul' ? 0.12 : 0.17, PI / 2 - 0.05, 0.99), rot: [0, 0, mf.pitch], hijos: [nodo({ malla: dors, mat: matF })] }));
    const up = tipo === 'azul' ? 0.7 : 0.8;
    for (const lado of [-1, 1]) hijos.push(nodo({ pos: punto(up, lado > 0 ? -0.5 : PI + 0.5, 0.97), rot: [lado * 0.9, 0, 0], hijos: [nodo({ malla: aletaP, mat: matF })] }));
    const xn = base(1)[0], rH = prof(uMax + 0.12), ang = c01(o.boca || 0) * 0.5;
    const ue = liv ? 0.9 : 0.93, Pe = punto(ue, 0.35, 1.0), re = 0.0045 * L * (tipo === 'azul' ? 1.3 : 1);
    for (const lado of [0, 1]) hijos.push(nodo({ nombre: lado ? 'ojo' : undefined, pos: punto(ue, lado ? PI - 0.35 : 0.35, 1.0), hijos: [nodo({ malla: MA.esfera(10), esc: re, mat: { color: '#17120f', esp: 0.8, dureza: 90, envolver: 0.2 } })] }));
    if (liv) {
      const yb = -rH * 0.78, xc = xn - 0.23 * L, nT = 9, dT = 0.024 * L, rT = 0.0042 * L;
      const diente = MA.cilindro(rT, 0, 1, 7, false), matD = { color: '#efe6cf', esp: 0.6, dureza: 60, envolver: 0.5, borde: 0.4 };
      const dientes = (inf) => { const ps = [], rn = VE.rng('liv|d' + inf); for (let i = 0; i < nT; i++) for (const z of [-1, 1]) { const x = lerp(xn - 0.03 * L, xc + 0.02 * L, i / (nT - 1)) - (inf ? xc : 0), ln = dT * (0.85 + 0.3 * rn()) * (1 - 0.25 * Math.abs(i / (nT - 1) - 0.4));
          ps.push({ malla: diente, m: M.mul(M.tras(x, (inf ? 0 : yb) + (inf ? ln * 0.5 : -ln * 0.5), z * rH * 0.28), M.mul(inf ? M.rotX(PI) : M.id(), M.esc(1, ln, 1))) }); } return MA.fusionar(ps, 'liv|dientes|' + inf + '|' + L.toFixed(2)); };
      hijos.push(nodo({ malla: dientes(false), mat: matD, nombre: 'diente' }),
        nodo({ nombre: 'mandibula', pos: [xc, yb, 0], rot: [0, 0, -ang], hijos: [nodo({ malla: dientes(true), mat: matD }), nodo({ malla: MA.esfera(14), esc: [0.12 * L, 0.014 * L, 0.03 * L], pos: [0.11 * L, -0.008 * L, 0], mat }),
          nodo({ malla: MA.esfera(10), esc: [0.1 * L, 0.004 * L, 0.024 * L], pos: [0.12 * L, 0.004 * L, 0], mat: { color: '#7a2c32', esp: 0.4 } })] }));
      hijos.push(nodo({ nombre: 'boca', pos: [xn - 0.03 * L, yb, 0], esc: 0.001 }));
    }
    hijos.push(nodo({ nombre: 'morro', pos: [xn, 0, 0], esc: 0.001 }), nodo({ nombre: 'cabeza', pos: [base(uMax + 0.1)[0], 0, 0], esc: 0.001 }));
    return nodo({ pos: o.pos, rot: o.rot || [0, o.rumbo || 0, 0], esc: o.esc, alfa: o.alfa, hijos });
  };
})(window.VE);
