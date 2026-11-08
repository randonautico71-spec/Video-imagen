/* VOLUMEN — PECES (loro, lábrido, pez cebra larva, tetra de superficie y de cueva) Y CAPULLO DE MOCO. Unidades: metros. Todo por codigo; las pieles se pintan una vez.
     V.modelos.pez({ especie, id, t, escala, pos, rumbo|rot, esc, alfa, amp, ondas, vel, ruta, vidrio, resp, cerebro, fase, ojoAbierto })
        especie: 'loro' (pez loro: cuerpo alto turquesa-rosa, pico de dientes fusionados) | 'labrido' (Coris julis: delgado, banda naranja en zigzag, mancha negra en el opérculo)
               | 'cebra' (larva de pez cebra TRANSPARENTE, cabeza grande y ojos grandes; cerebro 0..1 = actividad que se ilumina dentro de la cabeza)
               | 'tetra' (Astyanax de río: plateado con banda oscura y ojo) | 'cueva' (Astyanax de cueva: rosado pálido, SIN ojos, aletas translúcidas).
        Cabeza hacia +X; sin párpados (el ojo siempre está abierto). resp 0..1 amplitud del bombeo del opérculo. vidrio 0..1 -> cuerpo translúcido.
        Nodos con nombre: 'cabeza', 'ojo', 'boca', 'cerebro'.
     V.modelos.capullo({ escala, pos, rot, alfa, t })   envoltura de moco translúcida (para el pez loro, escala = largo del pez). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const cr = (arr, u) => { const n = arr.length, s = c01(u) * (n - 1), i = Math.min(n - 2, Math.floor(s)), f = s - i, p0 = arr[Math.max(0, i - 1)], p1 = arr[i], p2 = arr[i + 1], p3 = arr[Math.min(n - 1, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f); };

  const escamas = (x, W, H, col, n, a) => { for (let j = 0; j < n; j++) for (let i = 0; i < n * 3; i++) { const cx = (i + (j % 2) * 0.5) * W / (n * 3), cy = (j + 0.5) * H / n; x.strokeStyle = col; x.globalAlpha = a; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, W / (n * 3) * 0.7, -0.3, PI * 0.9); x.stroke(); } x.globalAlpha = 1; };
  const grad = (x, W, H, stops) => { const g = x.createLinearGradient(0, 0, 0, H); stops.forEach(([p, c]) => g.addColorStop(p, c)); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  /* texturas: x = cola(0) -> hocico(W); y = vuelta (lomo 25 %, vientre 75 %) */
  const PIEL = {
    loro: () => V.textura('pez|loro', 1024, 256, (x, W, H) => { grad(x, W, H, [[0, '#2aa79a'], [0.25, '#1f8a8f'], [0.45, '#3fc2a8'], [0.62, '#e58aa6'], [0.78, '#f2b4c2'], [0.92, '#e58aa6'], [1, '#2aa79a']]);
      const r = VE.rng('loro'); x.fillStyle = 'rgba(120,60,200,0.35)'; x.fillRect(W * 0.82, 0, W * 0.18, H);
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,190,120,${0.1 + r() * 0.2})`; x.fillRect(W * 0.84 + r() * W * 0.14, r() * H, 14 + r() * 24, 2); }
      escamas(x, W, H, 'rgba(10,60,70,0.55)', 14, 0.7); }),
    labrido: () => V.textura('pez|lab', 1024, 256, (x, W, H) => { grad(x, W, H, [[0, '#2f6f78'], [0.2, '#1c4f63'], [0.35, '#3c8a6c'], [0.5, '#6aa070'], [0.7, '#e8e0c8'], [0.9, '#e8e0c8'], [1, '#2f6f78']]);
      x.fillStyle = '#f08a1c'; for (const cy of [0, 0.5]) { x.beginPath(); for (let i = 0; i <= 40; i++) { const px = W * (0.12 + 0.72 * i / 40), py = H * (cy + 0.02 * Math.sin(i * 1.25)) ; x.lineTo(px, py - 12); } for (let i = 40; i >= 0; i--) { const px = W * (0.12 + 0.72 * i / 40), py = H * (cy + 0.02 * Math.sin(i * 1.25)); x.lineTo(px, py + 12); } x.fill(); }
      x.fillStyle = '#1b6dc8'; x.fillRect(W * 0.8, H * 0.08, W * 0.2, H * 0.2); escamas(x, W, H, 'rgba(0,30,40,0.45)', 12, 0.6); }),
    cebra: () => V.textura('pez|cebra', 512, 128, (x, W, H) => { x.fillStyle = '#e9f1f3'; x.fillRect(0, 0, W, H); const r = VE.rng('cebra');
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(40,40,50,${0.25 + r() * 0.4})`; x.beginPath(); x.arc(r() * W * 0.95, H * (r() < 0.5 ? 0.22 + r() * 0.06 : 0.0 + r() * 0.04), 1.4 + r() * 2, 0, 7); x.fill(); } }),
    tetra: () => V.textura('pez|tetra', 1024, 256, (x, W, H) => { grad(x, W, H, [[0, '#9aa7ab'], [0.25, '#6f7f84'], [0.4, '#c4ccce'], [0.6, '#e6eaea'], [0.8, '#f3f5f4'], [1, '#9aa7ab']]);
      x.fillStyle = 'rgba(35,45,50,0.55)'; for (const cy of [0, 0.5]) x.fillRect(W * 0.1, H * (cy - 0.06), W * 0.7, H * 0.12); escamas(x, W, H, 'rgba(255,255,255,0.35)', 12, 0.6); }),
    cueva: () => V.textura('pez|cueva', 1024, 256, (x, W, H) => { grad(x, W, H, [[0, '#e9c9bf'], [0.25, '#e2b9ae'], [0.5, '#f2dad2'], [0.75, '#f8ebe4'], [1, '#e9c9bf']]); const r = VE.rng('cueva');
      for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(190,120,110,${0.04 + r() * 0.06})`; x.fillRect(r() * W, r() * H, 3, 3); } escamas(x, W, H, 'rgba(255,255,255,0.3)', 12, 0.5); }),
  };
  const aletaDorsal = (len, h, atras) => { const pts = [], n = 16; for (let i = 0; i <= n; i++) { const f = i / n, x = len / 2 - len * f, y = h * Math.pow(Math.sin(Math.PI * Math.pow(f, atras || 0.8)), 0.8); pts.push([x, y]); } pts.push([-len / 2, 0]); return pts; };
  /* radios (fraccion del largo) en 9 puntos de cola a hocico */
  const ESP = {
    loro:    { hv: [0.012, 0.03, 0.055, 0.125, 0.168, 0.168, 0.15, 0.118, 0.06], hw: 0.5, L: 0.55, ojo: 0.02, ojoCol: '#d9a441', tex: 'loro', aleta: '#2aa79a', aleta2: '#e58aa6',
             dors: aletaDorsal(0.4, 0.09, 0.9), dorsU: 0.6, dorsK: 1.0, anal: 0.7, pectK: 1.0,
             cola: [[0.01, 0.02], [-0.05, 0.07], [-0.12, 0.16], [-0.135, 0.16], [-0.1, 0.04], [-0.09, 0], [-0.1, -0.04], [-0.135, -0.16], [-0.12, -0.16], [-0.05, -0.07], [0.01, -0.02]], pico: true },
    labrido: { hv: [0.01, 0.03, 0.05, 0.075, 0.09, 0.09, 0.08, 0.058, 0.022], hw: 0.62, L: 0.22, ojo: 0.022, ojoCol: '#f2b830', tex: 'labrido', aleta: '#5aa0b0', aleta2: '#f08a1c',
             dors: aletaDorsal(0.5, 0.06, 1.0), dorsU: 0.55, dorsK: 1.0, anal: 0.9, pectK: 0.9,
             cola: [[0, 0.012], [-0.05, 0.05], [-0.1, 0.07], [-0.12, 0.03], [-0.12, -0.03], [-0.1, -0.07], [-0.05, -0.05], [0, -0.012]], opercula: '#1b2530' },
    cebra:   { hv: [0.004, 0.012, 0.02, 0.03, 0.045, 0.07, 0.085, 0.07, 0.03], hw: 0.95, L: 0.5, ojo: 0.05, ojoCol: '#15151a', escl: '#2a2a30', tex: 'cebra', aleta: '#dfeff2', aleta2: '#dfeff2', transparente: true,
             dors: aletaDorsal(0.7, 0.03, 1.0), dorsU: 0.3, dorsK: 1.0, anal: 0.0, pectK: 0.7,
             cola: [[0, 0.01], [-0.08, 0.045], [-0.17, 0.05], [-0.24, 0.02], [-0.25, 0], [-0.24, -0.02], [-0.17, -0.05], [-0.08, -0.045], [0, -0.01]] },
    tetra:   { hv: [0.012, 0.032, 0.062, 0.1, 0.115, 0.11, 0.095, 0.07, 0.028], hw: 0.5, L: 0.12, ojo: 0.028, ojoCol: '#c8c8c0', tex: 'tetra', aleta: '#c9a8a0', aleta2: '#c9a8a0',
             dors: [[0.05, 0], [0.02, 0.05], [-0.03, 0.09], [-0.06, 0.06], [-0.06, 0]], dorsU: 0.55, dorsK: 1.0, anal: 1.0, pectK: 0.9,
             cola: [[0, 0.015], [-0.06, 0.07], [-0.12, 0.1], [-0.1, 0.02], [-0.09, 0], [-0.1, -0.02], [-0.12, -0.1], [-0.06, -0.07], [0, -0.015]] },
    cueva:   { hv: [0.012, 0.032, 0.062, 0.1, 0.115, 0.11, 0.095, 0.07, 0.028], hw: 0.5, L: 0.12, ojo: 0, ojoCol: '#e2b9ae', tex: 'cueva', aleta: '#f1d9d2', aleta2: '#f1d9d2', translucidaAleta: true,
             dors: [[0.05, 0], [0.02, 0.05], [-0.03, 0.09], [-0.06, 0.06], [-0.06, 0]], dorsU: 0.55, dorsK: 1.0, anal: 1.0, pectK: 0.9,
             cola: [[0, 0.015], [-0.06, 0.07], [-0.12, 0.1], [-0.1, 0.02], [-0.09, 0], [-0.1, -0.02], [-0.12, -0.1], [-0.06, -0.07], [0, -0.015]] },
  };

  MO.pez = (o = {}) => {
    const esp = o.especie || 'loro', S = ESP[esp], L = o.escala == null ? S.L : o.escala, id = o.id || esp, t = o.t || 0;
    const amp = (o.amp == null ? 0.05 : o.amp) * L, ond = o.ondas == null ? 0.8 : o.ondas, fase = (o.vel == null ? 3 : o.vel) * t;
    const hvF = (u) => { const cap = u > 0.95 ? Math.sqrt(Math.max(0.0, 1 - Math.pow((u - 0.95) / 0.05, 2))) : 1; return Math.max(0.002, cr(S.hv, u) * cap) * L; };
    const base = (u) => o.ruta ? o.ruta(u, L) : [-L / 2 + u * L, 0, Math.sin(u * ond * TAU - fase) * amp * (Math.pow(1 - u, 1.5) + 0.03)];
    const marco = (u) => { const p = base(u), q = base(Math.min(1, u + 0.004)), p0 = base(Math.max(0, u - 0.004)); let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const m = Math.hypot(...T) || 1; T = T.map(v => v / m);
      let Sx = [T[2], 0, -T[0]]; const ms = Math.hypot(...Sx) || 1; Sx = Sx.map(v => v / ms); const U = [T[1] * Sx[2] - T[2] * Sx[1], T[2] * Sx[0] - T[0] * Sx[2], T[0] * Sx[1] - T[1] * Sx[0]]; return { p, T, S: Sx, U, yaw: Math.atan2(-T[2], T[0]) }; };
    const opW = 1 + 0.06 * (o.resp || 0) * Math.sin(t * 6);                                                         // el opérculo late al respirar
    const punto = (u, phi, k = 1) => { const b = hvF(u), a = b * S.hw, m = marco(u), ca = Math.cos(phi) * a * k, sa = Math.sin(phi) * b * k;
      return [m.p[0] + m.S[0] * ca + m.U[0] * sa, m.p[1] + m.S[1] * ca + m.U[1] * sa, m.p[2] + m.S[2] * ca + m.U[2] * sa]; };
    const trans = !!S.transparente, vid = trans ? 0.34 : 1 - 0.75 * c01(o.vidrio || 0);
    const cuerpo = MA.parametrica(110, 20, (u, v) => punto(u, v * TAU), { dinamica: 'pez|c|' + id });
    const mat = { color: '#ffffff', mapa: PIEL[S.tex](), esp: esp === 'cueva' ? 0.5 : 0.45, dureza: 40, envolver: 0.3, borde: 0.3 };
    const matAl = (c) => { const q = { color: c, esp: 0.2, dureza: 20, envolver: 0.5, dobleCara: true, borde: 0.2 }; if (trans || S.translucidaAleta) q.alfa = 0.5; return q; };
    const ext = (pts, cl, k = 1) => MA.extrusion(pts.map(p => [p[0] * L * k, p[1] * L * k]), 0.003 * L * k, 'pez|' + esp + '|' + cl + '|' + L.toFixed(3));
    const fin = (u, phi, malla, rotL, m2) => { const mr = marco(u), P = punto(u, phi, 0.8); return nodo({ pos: P, rot: [0, mr.yaw, 0], hijos: [nodo({ malla, rot: rotL, mat: m2 })] }); };
    const mt = marco(0);
    const hijos = [nodo({ malla: cuerpo, mat, alfa: vid }),
      nodo({ pos: [mt.p[0] - 0.005 * L, mt.p[1], mt.p[2]], rot: [0, mt.yaw, 0.12 * Math.sin(fase + 0.6)], hijos: [nodo({ malla: ext(S.cola, 'cola'), mat: matAl(S.aleta) })] }),
      fin(S.dorsU, PI / 2 - 0.02, ext(S.dors, 'dors'), [0, 0, 0], matAl(S.aleta2 || S.aleta))];
    if (S.anal > 0) hijos.push(fin(0.3, -PI / 2 + 0.05, ext([[0.06, 0], [0.04, -0.05], [-0.04, -0.07], [-0.07, -0.02], [-0.07, 0]].map(p => [p[0] * S.anal, p[1] * S.anal]), 'an'), [0, 0, 0], matAl(S.aleta)));
    const pect = ext([[0.03, 0], [0.0, 0.045], [-0.06, 0.07], [-0.075, 0.02], [-0.04, 0]].map(p => [p[0] * S.pectK, p[1] * S.pectK]), 'pe'), mp = matAl(S.aleta), aleteo = 0.15 * Math.sin(t * 7);
    hijos.push(fin(0.7, -0.25, pect, [0.9 + aleteo, 0, 0], mp), fin(0.7, PI + 0.25, pect, [-0.9 - aleteo, 0, 0], mp));
    /* ---- cabeza: ojos (sin párpados), opérculo, boca ---- */
    for (const lado of [0, 1]) {
      const ue = 0.89, Pe = punto(ue, lado ? PI - 0.2 : 0.2, 1.0), re = S.ojo * L, yw = marco(ue).yaw;
      if (S.ojo > 0) {
        hijos.push(nodo({ pos: Pe, rot: [0, yw, 0], hijos: [nodo({ malla: MA.esfera(14), esc: re * 1.05, mat: { color: S.escl || '#d8d8d0', esp: 0.5, dureza: 50, envolver: 0.25 } }),
          nodo({ malla: MA.esfera(14), esc: re * 0.78, pos: [re * 0.12, 0, (lado ? 1 : -1) * re * 0.32], mat: { color: S.ojoCol, esp: 0.8, dureza: 90, envolver: 0.2 } }),
          nodo({ nombre: lado ? 'ojo' : undefined, malla: MA.esfera(14), esc: re * 0.46, pos: [re * 0.2, 0, (lado ? 1 : -1) * re * 0.7], mat: { color: '#050505', esp: 0.95, dureza: 120, tipo: 'plano' } })] }));
      } else {                                                                                                          // cueva: piel cerrada sobre la cuenca
        hijos.push(nodo({ malla: MA.esfera(10), pos: Pe, esc: [0.012 * L, 0.012 * L, 0.004 * L], rot: [0, yw, 0], mat: { color: '#d9a99d', tipo: 'plano' } }));
      }
      const uo = 0.8, Po = punto(uo, lado ? PI - 0.08 : 0.08, 1.0), bo = hvF(uo);
      hijos.push(nodo({ malla: MA.esfera(12), pos: Po, rot: [0, marco(uo).yaw, lado ? -0.12 : 0.12], esc: [0.03 * L * opW, bo * 0.78, 0.01 * L], mat: { color: S.opercula || '#ffffff', mapa: S.opercula ? undefined : mat.mapa, esp: 0.4, dureza: 40, envolver: 0.3, alfa: 0.35, tipo: 'plano' }, sinSombra: true }));
    }
    const mh = marco(1), Pn = base(1);
    hijos.push(nodo({ nombre: 'cabeza', pos: punto(0.85, PI / 2, 1), esc: 0.001 }), nodo({ nombre: 'boca', pos: [Pn[0] - 0.002 * L, Pn[1] - 0.01 * L, Pn[2]], esc: 0.001 }));
    if (S.pico) {                                                                                                     // loro: pico de dientes fusionados
      const rp = hvF(0.97);
      hijos.push(nodo({ malla: MA.esfera(14), pos: [Pn[0] - 0.012 * L, Pn[1] + rp * 0.18, Pn[2]], esc: [0.03 * L, rp * 0.5, rp * S.hw * 0.78], mat: { color: '#9fe0d4', esp: 0.7, dureza: 60, envolver: 0.35 } }),
        nodo({ malla: MA.esfera(14), pos: [Pn[0] - 0.01 * L, Pn[1] - rp * 0.32, Pn[2]], esc: [0.026 * L, rp * 0.4, rp * S.hw * 0.7], mat: { color: '#7fd2c4', esp: 0.7, dureza: 60, envolver: 0.35 } }));
    } else if (esp !== 'cebra') {
      const rb = hvF(0.985);
      hijos.push(nodo({ malla: MA.esfera(10), pos: [Pn[0] - 0.012 * L, Pn[1] - rb * 0.3, Pn[2]], esc: [0.02 * L, rb * 0.12, rb * S.hw * 0.5], mat: { color: esp === 'cueva' ? '#d49a90' : '#5b3b3b', tipo: 'plano' } }));
    }
    if (trans) {                                                                                                      // cerebro iluminado + notocorda (larva transparente)
      const k = c01(o.cerebro == null ? 0 : o.cerebro), cols = ['#59e0ff', '#ff6fb0', '#ffe066', '#8cff9a'];
      for (let i = 0; i < 14; i++) { const r = VE.rng('cer' + i), u = 0.79 + r() * 0.15, ph = PI / 2 + (r() - 0.5) * 1.0, pul = 0.35 + 0.65 * Math.max(0, Math.sin(t * (2 + r() * 4) + r() * 6)), P = punto(u, ph, 0.55 + r() * 0.3);
        hijos.push(nodo({ nombre: i === 0 ? 'cerebro' : undefined, malla: MA.esfera(8), pos: P, esc: (0.011 + 0.008 * pul * k + 0.003 * r()) * L, mat: { color: cols[i % 4], emision: 0.5 + 2.0 * k * pul, tipo: 'plano' }, sinSombra: true })); }
      for (let i = 0; i < 12; i++) hijos.push(nodo({ malla: MA.esfera(6), pos: punto(0.08 + i * 0.06, PI / 2 * 0 + 0.0, 0.0), esc: 0.004 * L, mat: { color: '#ffffff', emision: 0.6, tipo: 'plano' }, sinSombra: true }));
    }
    return nodo({ pos: o.pos, rot: o.rot || [0, o.rumbo || 0, 0], esc: o.esc, alfa: o.alfa, hijos });
  };

  MO.capullo = (o = {}) => { const L = o.escala || 0.5, t = o.t || 0;
    const m = MA.parametrica(40, 24, (u, v) => { const th = u * PI, ph = v * TAU, bump = 1 + 0.03 * Math.sin(ph * 5 + t) * Math.sin(th * 3); return [Math.cos(th) * 0.68 * L * bump, Math.sin(th) * Math.sin(ph) * 0.36 * L * bump, Math.sin(th) * Math.cos(ph) * 0.3 * L * bump]; }, { dinamica: 'capullo|' + L.toFixed(2) });
    return nodo({ pos: o.pos, rot: o.rot, alfa: o.alfa, hijos: [nodo({ malla: m, mat: { color: '#c9ecff', alfa: 0.28, emision: 0.35, esp: 0.8, dureza: 70, envolver: 0.5, dobleCara: true, tipo: 'plano' }, sinSombra: true })] }); };
})(window.VE);
