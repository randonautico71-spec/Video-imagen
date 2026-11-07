/* VOLUMEN — TIBURON TIGRE DE ARENA (Carcharias taurus) Y UTERO. Unidades: metros. Todo por codigo; la piel se pinta una vez.
     V.modelos.tiburon({ id, t, escala, pos, rumbo|rot, alfa, boca 0..1, amp, ondas, vel, ruta(u,L), embrion, vidrio, cicatriz 0..1, estomago 0..1, aire })
        escala = largo total en metros (2.5 = adulto). Cabeza hacia +X. Cuerpo con ondulacion lateral (mas en la cola), cola heterocerca, 2 dorsales,
        pectorales grandes, anal, 5 hendiduras branquiales, ojo pequeno y mandibula inferior articulada con dientes largos y finos que sobresalen.
        embrion:true -> cria uterina (color salmon, ojo grande, saco vitelino y dientes grandes). vidrio 0..1 -> cuerpo translucido (para ver el utero).
        Nodos con nombre: 'boca', 'cabeza', 'aleta_pect', 'estomago', 'morro'.
     V.modelos.utero({ id, t, largo, radio, pos, rot, alfa, hijos })   saco alargado translucido rosado (el contenido se pasa en hijos).
     V.modelos.huevo({ pos, r, alfa })                                 huevo sin fecundar (esfera ambar).
     V.modelos.superficie({ y, w })                                    plano de la superficie del mar visto desde abajo. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, nodo = V.nodo;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;

  const manchaIrr = (x, cx, cy, r, col, a, rn, H) => {
    x.fillStyle = col; x.globalAlpha = a;
    const n = 2 + Math.floor(rn() * 2);
    for (let i = 0; i < n; i++) for (const dy of [0, -H, H]) { x.beginPath(); x.ellipse(cx + (rn() - 0.5) * r, cy + dy + (rn() - 0.5) * r, r * (0.5 + rn() * 0.5), r * (0.4 + rn() * 0.4), rn() * PI, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  };
  const pielAdulto = () => V.textura('tib|piel', 1024, 256, (x, W, H) => {                                     // x = cola -> hocico, y = vuelta (lomo 25 %, vientre 75 %)
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8c8a80'); g.addColorStop(0.25, '#5d5c56'); g.addColorStop(0.42, '#8f8c81'); g.addColorStop(0.55, '#c9c5b8'); g.addColorStop(0.75, '#ece9de'); g.addColorStop(0.92, '#c9c5b8'); g.addColorStop(1, '#8c8a80');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('tib|p');
    for (let i = 0; i < 300; i++) { const cx = rn() * W * 0.8, cy = (0.1 + rn() * 0.45) * H; manchaIrr(x, cx, cy, 3 + rn() * 7, rn() < 0.6 ? '#9a5a3a' : '#6b3b26', 0.3 + rn() * 0.4, rn, H); }   // manchas rojizas en el cuerpo posterior
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + rn() * 0.05})`; x.fillRect(rn() * W, rn() * H, 1 + rn() * 3, 1); }
  });
  const pielEmbrion = () => V.textura('tib|embrion', 512, 128, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d99a78'); g.addColorStop(0.25, '#c47a5a'); g.addColorStop(0.5, '#e0a98a'); g.addColorStop(0.75, '#f4d9bd'); g.addColorStop(1, '#d99a78');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('tib|e'); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(120,50,30,${0.04 + rn() * 0.1})`; x.fillRect(rn() * W, rn() * H, 2, 2); } });

  MO.tiburon = (o = {}) => {
    const emb = !!o.embrion, L = o.escala == null ? 2.5 : o.escala, Lb = 0.83 * L, id = o.id || 'tib', t = o.t || 0;
    const amp = (o.amp == null ? 0.05 : o.amp) * L, ond = o.ondas == null ? 0.9 : o.ondas, fase = (o.vel == null ? 2.2 : o.vel) * t;
    const hp = emb ? 1.25 : 1;                                                                                    // cabeza mas grande en el embrion
    const prof = (u) => { const cola = 0.021 + 0.084 * Math.pow(sm(0, 0.62, u), 0.8); const q = c01((u - 0.62) / 0.38), cab = Math.pow(Math.max(0, 1 - q * q), 0.62);
      return (u < 0.62 ? cola : Math.max(0.004, 0.105 * cab * (u > 0.97 ? Math.sqrt(Math.max(0.05, 1 - Math.pow((u - 0.97) / 0.03, 2))) : 1))) * L * (1 + (hp - 1) * sm(0.5, 0.75, u)); };
    const base = (u) => o.ruta ? o.ruta(u, L) : [-Lb / 2 + u * Lb, 0, Math.sin(u * ond * TAU - fase) * amp * (Math.pow(1 - u, 1.6) * 1.0 + 0.04)];
    const marco = (u) => { const p = base(u), q = base(Math.min(1, u + 0.004)), p0 = base(Math.max(0, u - 0.004));
      let T = [q[0] - p0[0], q[1] - p0[1], q[2] - p0[2]]; const m = Math.hypot(...T) || 1; T = T.map(v => v / m);
      let S = [T[2], 0, -T[0]]; const ms = Math.hypot(...S) || 1; S = S.map(v => v / ms);
      const U = [T[1] * S[2] - T[2] * S[1], T[2] * S[0] - T[0] * S[2], T[0] * S[1] - T[1] * S[0]]; return { p, T, S, U, yaw: Math.atan2(-T[2], T[0]) }; };
    const punto = (u, phi, k = 1) => { const r = prof(u), m = marco(u), a = r * 0.86 * k, b = r * k, ca = Math.cos(phi) * a, sa = Math.sin(phi) * b;
      return [m.p[0] + m.S[0] * ca + m.U[0] * sa, m.p[1] + m.S[1] * ca + m.U[1] * sa, m.p[2] + m.S[2] * ca + m.U[2] * sa]; };
    const vid = 1 - 0.78 * c01(o.vidrio || 0);
    const cuerpo = MA.parametrica(130, 22, (u, v) => punto(u, v * TAU), { dinamica: 'tib|c|' + id });
    const mat = { color: '#ffffff', mapa: emb ? pielEmbrion() : pielAdulto(), esp: 0.35, dureza: 36, envolver: 0.3, borde: 0.3 };
    const aleta = { color: emb ? '#c8896a' : '#6d6b63', esp: 0.2, dureza: 20, envolver: 0.45, dobleCara: true, borde: 0.3 }, aleta2 = { color: emb ? '#e6b595' : '#8a877d', esp: 0.2, dureza: 20, envolver: 0.45, dobleCara: true };
    const ext = (pts, cl, k = 1) => MA.extrusion(pts.map(p => [p[0] * L * k, p[1] * L * k]), 0.0035 * L * k, 'tib|' + cl + '|' + L.toFixed(2));
    const dorsal1 = ext([[0.05, 0], [0.025, 0.045], [-0.012, 0.085], [-0.032, 0.095], [-0.03, 0.05], [-0.045, 0]], 'd1');
    const dorsal2 = ext([[0.04, 0], [0.01, 0.04], [-0.02, 0.078], [-0.04, 0.085], [-0.038, 0.04], [-0.05, 0]], 'd2');
    const anal = ext([[0.04, 0], [0.012, -0.035], [-0.025, -0.07], [-0.045, -0.07], [-0.04, -0.03], [-0.05, 0]], 'an');
    const pect = ext([[0.05, 0], [0.012, 0.06], [-0.07, 0.17], [-0.085, 0.175], [-0.062, 0.07], [-0.055, 0]], 'pe');
    const pelv = ext([[0.03, 0], [-0.01, 0.045], [-0.045, 0.05], [-0.04, 0.01], [-0.04, 0]], 'pv');
    const cola = ext([[0.01, 0.012], [-0.045, 0.07], [-0.11, 0.17], [-0.145, 0.2], [-0.15, 0.175], [-0.115, 0.075], [-0.125, 0.03], [-0.14, 0.0], [-0.15, -0.075], [-0.165, -0.1], [-0.12, -0.09], [-0.065, -0.05], [0.0, -0.012]], 'cola');
    const fin = (u, phi, malla, rotL, m2) => { const mr = marco(u), P = punto(u, phi, 0.98); return nodo({ pos: P, rot: [0, mr.yaw, 0], hijos: [nodo({ malla, rot: rotL, mat: m2 || aleta })] }); };
    const mt = marco(0.0), tailYaw = mt.yaw;
    const hijos = [nodo({ malla: cuerpo, mat, alfa: vid }),
      fin(0.55, PI / 2 - 0.05, dorsal1, [0, 0, 0]), fin(0.2, PI / 2 - 0.02, dorsal2, [0, 0, 0]), fin(0.17, -PI / 2 + 0.05, anal, [0, 0, 0]),
      fin(0.72, -0.62, pect, [1.15, 0, 0]), fin(0.72, PI + 0.62, pect, [-1.15, 0, 0]), fin(0.33, -0.72, pelv, [1.0, 0, 0]), fin(0.33, PI + 0.72, pelv, [-1.0, 0, 0]),
      nodo({ pos: [mt.p[0] - 0.01 * L, mt.p[1], mt.p[2]], rot: [0, tailYaw, 0.1 * Math.sin(fase * 1.0 + 0.6)], hijos: [nodo({ malla: cola, mat: aleta })] })];
    hijos[4].nombre = 'aleta_pect';
    /* ---- cabeza: hendiduras, ojos, boca ---- */
    for (const lado of [0, 1]) {
      const ph = lado ? PI - 0.05 : 0.05;
      for (let i = 0; i < 5; i++) { const u = 0.84 - i * 0.022, P = punto(u, ph + (lado ? -0.25 : 0.25), 1.0);
        hijos.push(nodo({ malla: MA.esfera(8), pos: P, rot: [0, marco(u).yaw, 0], esc: [0.003 * L, 0.036 * L, 0.0045 * L], mat: { color: '#1c1a17', tipo: 'plano' } })); }
      const ue = 0.93, Pe = punto(ue, lado ? PI - 0.42 : 0.42, 1.0), re = (emb ? 0.019 : 0.0085) * L;
      hijos.push(nodo({ pos: Pe, rot: [0, marco(ue).yaw, 0], hijos: [nodo({ malla: MA.esfera(12), esc: re * 0.95, mat: { color: emb ? '#a06a45' : '#5a4a2a', esp: 0.5, dureza: 40, envolver: 0.2 } }),
        nodo({ malla: MA.esfera(12), esc: re * 0.6, pos: [re * 0.1, 0, (lado ? 1 : -1) * re * 0.5], mat: { color: '#050505', esp: 0.9, dureza: 100, tipo: 'plano' } })] }));
    }
    const xn = base(1)[0], nariz = marco(1), rB = prof(0.9), xb = base(0.9), yb = -rB * 0.62;
    const ang = c01(o.boca || 0) * 0.55, xc = base(0.86)[0] + 0.01 * L;
    const diente = MA.cilindro(0.0028 * L * (emb ? 1.8 : 1), 0, 1, 6, false), matD = { color: '#f4efe0', esp: 0.65, dureza: 60, envolver: 0.5, borde: 0.4 };
    const dientes = (inf) => { const parts = [], rn = VE.rng('tib|d' + inf), n = inf ? 11 : 13;
      for (let i = 0; i < n; i++) { const s = (i / (n - 1)) * 2 - 1, x = lerp(xn - 0.02 * L, xc, Math.pow(Math.abs(s), 1.6)) , z = s * rB * 0.74, ln = (0.02 + 0.014 * (1 - Math.abs(s))) * L * (emb ? 1.5 : 1) * (0.85 + 0.3 * rn());
        parts.push({ malla: diente, m: V.m4.mul(V.m4.tras(x - (inf ? xc : 0), (inf ? 0 : yb) + (inf ? ln * 0.5 : -ln * 0.5), z), V.m4.mul(inf ? V.m4.rotX(PI) : V.m4.id(), V.m4.mul(V.m4.rotZ(0.12), V.m4.esc(1, ln, 1)))) }); }
      return MA.fusionar(parts, 'tib|dientes|' + inf + '|' + L.toFixed(2) + emb); };
    const mandibula = nodo({ nombre: 'mandibula', pos: [xc, yb, 0], rot: [0, 0, -ang], hijos: [
      nodo({ malla: dientes(true), mat: matD }),
      nodo({ malla: MA.esfera(14), esc: [(xn - xc) * 0.46, rB * 0.3, rB * 0.6], pos: [(xn - xc) * 0.42, -rB * 0.1, 0], mat }),
      nodo({ malla: MA.esfera(12), esc: [(xn - xc) * 0.45, rB * 0.05, rB * 0.55], pos: [(xn - xc) * 0.5, rB * 0.02, 0], mat: { color: '#7a2c32', esp: 0.4, dureza: 30, envolver: 0.4 } })] });
    hijos.push(nodo({ malla: dientes(false), mat: matD }), mandibula);
    hijos.push(nodo({ nombre: 'boca', pos: [xn - 0.02 * L, yb, 0], esc: 0.001 }), nodo({ nombre: 'morro', pos: [xn, 0, 0], esc: 0.001 }), nodo({ nombre: 'cabeza', pos: [xb[0], 0, 0], esc: 0.001 }));
    if (ang > 0.05) hijos.push(nodo({ malla: MA.esfera(12), esc: [(xn - xc) * 0.5, rB * 0.18 * ang * 2, rB * 0.6], pos: [lerp(xc, xn, 0.5), yb - rB * 0.1 * ang, 0], mat: { color: '#3a0c12', tipo: 'plano' } }));
    if (o.estomago != null) hijos.push(nodo({ nombre: 'estomago', malla: MA.esfera(16), pos: punto(0.62, -PI / 2, 0.6), esc: [0.06 * L * (0.4 + o.estomago), 0.032 * L * (0.4 + o.estomago), 0.045 * L * (0.4 + o.estomago)], mat: { color: '#bfe9ff', alfa: 0.4, emision: 0.4, esp: 0.8, dureza: 60, tipo: 'plano' }, sinSombra: true }));
    if (emb) hijos.push(nodo({ malla: MA.esfera(14), esc: [0.07 * L, 0.06 * L, 0.06 * L], pos: punto(0.55, -PI / 2, 1.0), mat: { color: '#f2c14e', esp: 0.5, dureza: 40, envolver: 0.4 } }));
    if (o.cicatriz) { const c = c01(o.cicatriz); for (let i = 0; i < 3; i++) hijos.push(nodo({ malla: MA.esfera(8), esc: [0.02 * L, 0.004 * L, 0.003 * L], pos: punto(0.74 + i * 0.012, -0.3, 1.0), rot: [0, marco(0.74).yaw, 0.5], mat: { color: '#8c2f2a', tipo: 'plano' }, alfa: c })); }
    return nodo({ pos: o.pos, rot: o.rot || [0, o.rumbo || 0, 0], esc: o.esc, alfa: o.alfa, hijos });
  };

  MO.utero = (o = {}) => {
    const len = o.largo || 1.0, R = o.radio || 0.13, id = o.id || 'ut', t = o.t || 0;
    const m = MA.parametrica(40, 24, (u, v) => { const q = Math.abs(2 * u - 1), r = R * Math.pow(Math.max(0, 1 - Math.pow(q, 6)), 0.5) * (1 + 0.04 * Math.sin(u * 14 + t * 0.8)); return [(u - 0.5) * len, Math.sin(v * TAU) * r, Math.cos(v * TAU) * r]; }, { dinamica: 'ut|' + id });
    return nodo({ pos: o.pos, rot: o.rot, alfa: o.alfa, hijos: [nodo({ malla: m, mat: { color: '#e08aa0', alfa: 0.3, esp: 0.5, dureza: 30, envolver: 0.5, dobleCara: true, emision: 0.15 } }), ...(o.hijos || [])] });
  };
  MO.huevo = (o = {}) => nodo({ malla: MA.esfera(14), pos: o.pos, esc: o.r || 0.02, alfa: o.alfa, mat: { color: '#ffd36a', esp: 0.7, dureza: 60, envolver: 0.4, emision: 0.25 } });
  MO.superficie = (o = {}) => nodo({ malla: MA.plano(o.w || 60, o.w || 60, 1), pos: [0, o.y || 0, 0], rot: [PI, 0, 0], mat: { color: '#bfeaff', alfa: 0.5, emision: 0.8, tipo: 'plano', dobleCara: true }, sinSombra: true });
})(window.VE);
