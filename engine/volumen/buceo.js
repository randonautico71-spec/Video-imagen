/* VOLUMEN — BUCEO: cachalote, buceador en apnea y pulmon que se pliega (unidades: metros; el cachalote mira a +X, arriba +Y).
     V.modelos.cachalote({ t, escala, amp, vel, aleta, rayosx, resalta, colapso, pos, rot, esc })
        Physeter macrocephalus, ~16 m: cabeza enorme y cuadrada (un tercio del cuerpo), mandibula inferior estrecha y baja, espiraculo
        en la esquina izquierda del morro, joroba dorsal baja con crestas, aletas cortas, cola ancha. Ondula en vertical con t.
        rayosx: true -> el cuerpo pasa a contorno de rayos X y se ven pulmon, corazon, arterias y musculo.
        resalta: { pulmon, sangre, musculo } 0..1 (ilumina cada sistema); colapso 0..1 (cuanto se ha plegado el pulmon).
     V.modelos.buceador({ pose, colapso, pos, rot, esc })  apneista (neopreno negro, mascara, aletas largas), alto ~1,75; pose por defecto 'buceo' (brazos arriba)
     V.modelos.pulmon({ colapso, t, color, pos, rot, esc })  par de pulmones (largo ~1) con traquea rigida que no se pliega: colapso 0 = hinchados, 1 = plegados
   Probado en proyectos/cachalote. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const liso = (c, e) => Object.assign({ color: c, esp: 0.3, dureza: 36, envolver: 0.3 }, e || {});
  const ell = (mat, esc3, pos, rot) => V.nodo({ malla: MA.esfera(20), esc: esc3, pos: pos || [0, 0, 0], rot, mat });
  const sg = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

  /* ================================================================== CACHALOTE */
  const L = 16;
  const texCachalote = () => V.textura('cachalote|piel', 1024, 256, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H);            // v: 0 costado derecho, .25 dorso, .5 costado izquierdo, .75 vientre
    g.addColorStop(0, '#58606c'); g.addColorStop(0.15, '#4c535f'); g.addColorStop(0.25, '#3f4651'); g.addColorStop(0.4, '#555d69'); g.addColorStop(0.5, '#5d6571'); g.addColorStop(0.62, '#7d838c'); g.addColorStop(0.75, '#9a9ea4'); g.addColorStop(0.9, '#6a717c'); g.addColorStop(1, '#58606c');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const r = VE.rng('cachalotepiel');
    for (let i = 0; i < 1100; i++) { const cx = r() * W, cy = r() * H, rr = 6 + r() * 30, gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); const c = r() < 0.5 ? '30,36,46' : '170,176,186'; gg.addColorStop(0, `rgba(${c},${0.04 + r() * 0.09})`); gg.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    x.lineCap = 'round';                                        // arrugas: pasadas largas en la mitad trasera del cuerpo
    for (let i = 0; i < 520; i++) { const u0 = 0.06 + r() * 0.62, y0 = r() * H, l = 10 + r() * 46; x.strokeStyle = r() < 0.55 ? `rgba(20,24,32,${0.1 + r() * 0.2})` : `rgba(190,196,206,${0.06 + r() * 0.12})`; x.lineWidth = 0.8 + r() * 1.6;
      x.beginPath(); x.moveTo(u0 * W, y0); x.quadraticCurveTo(u0 * W + l * 0.5, y0 + (r() - 0.5) * 7, u0 * W + l, y0 + (r() - 0.5) * 3); x.stroke(); }
    x.strokeStyle = 'rgba(214,214,206,0.5)'; x.lineWidth = 3; x.lineCap = 'round';                // cicatrices de ventosas del calamar
    for (let i = 0; i < 14; i++) { const cx = (0.62 + r() * 0.28) * W, cy = (r() < 0.5 ? 0.46 + r() * 0.2 : 0.9 + r() * 0.1) * H; x.beginPath(); x.arc(cx, cy, 2 + r() * 5, 0, TAU); x.stroke(); }
    x.strokeStyle = 'rgba(225,225,215,0.75)'; x.lineWidth = 3.2;                                   // linea de la boca a ambos lados
    for (const v of [0.545, 0.955]) { x.beginPath(); x.moveTo(W * 0.74, H * v); x.bezierCurveTo(W * 0.84, H * (v + 0.008), W * 0.94, H * (v - 0.004), W, H * v); x.stroke(); }
  });
  const R0 = (u) => {                                             // radio del cuerpo en u (0 cola -> 1 morro)
    if (u < 0.1) return 0.05 + 0.25 * sm(0, 0.1, u);
    if (u < 0.45) return 0.3 + 1.05 * sm(0.1, 0.45, u);
    if (u < 0.955) return 1.35 + 0.17 * sm(0.45, 0.68, u);
    const s = (u - 0.955) / 0.045; return 1.52 * Math.pow(Math.max(0, 1 - s * s * s), 0.42);
  };
  MO.cachalote = function (o = {}) {
    const t = o.t || 0, s = o.escala == null ? 1 : o.escala, amp = (o.amp == null ? 0.55 : o.amp) * s, fase = (o.vel == null ? 2.2 : o.vel) * t, id = o.id || 'c', rx = !!o.rayosx, res = o.resalta || {};
    const ys = (u) => amp * Math.sin(u * 3.4 - fase) * Math.pow(1 - u, 1.4);
    const xs = (u) => (u - 0.5) * L * s;
    const cl = (u) => [xs(u), ys(u)];
    const ang = (u) => { const p = cl(Math.max(0, u - 0.01)), q = cl(Math.min(1, u + 0.01)); return Math.atan2(q[1] - p[1], q[0] - p[0]); };
    const malla = MA.parametrica(96, 28, (u, v) => {
      const hf = sm(0.55, 0.8, u), r = R0(u) * s, a = v * TAU, sy = Math.sin(a), cz = Math.cos(a), e = 1 - 0.28 * hf, p = cl(u), an = ang(u);
      const cy = r * (sy > 0 ? 1.03 + 0.07 * hf : 0.9) * sg(sy, e), czz = r * (1 - 0.15 * hf) * sg(cz, e);
      return [p[0] - Math.sin(an) * cy, p[1] + Math.cos(an) * cy, czz]; }, { dinamica: 'cachalote|' + id });
    const mat = rx ? { color: '#6cc4ff', tipo: 'rayosx', fresnel: 2.2, borde: 1.0, emision: 0.08 } : { color: '#ffffff', mapa: texCachalote(), esp: 0.35, dureza: 34, envolver: 0.4, borde: 0.35 };
    const skin = rx ? { color: '#6cc4ff', tipo: 'rayosx' } : liso('#4a515c', { esp: 0.3, envolver: 0.35 });
    const hijos = [V.nodo({ malla, mat })];
    /* mandibula inferior: estrecha, larga y baja */
    const pj = cl(0.82), aj = ang(0.82);
    hijos.push(V.nodo({ pos: [pj[0] + 0.1 * s, pj[1] - 1.33 * s, 0], rot: [0, 0, aj], hijos: [V.nodo({ malla: MA.caja(5.0 * s, 0.5 * s, 0.82 * s, 0.17 * s, 3), mat: rx ? skin : liso('#6a717b', { esp: 0.3 }) }),
      rx ? null : V.nodo({ malla: MA.caja(4.5 * s, 0.05 * s, 0.5 * s, 0.02 * s, 2), mat: liso('#e8e6dc', { esp: 0.2 }), pos: [0.1 * s, 0.24 * s, 0] })].filter(Boolean) }));
    if (!rx) {
      const pe = cl(0.985); hijos.push(ell(liso('#0b0d10', { esp: 0.2 }), [0.22 * s, 0.035 * s, 0.075 * s], [pe[0] - 0.22 * s, R0(0.97) * s * 1.1 + pe[1], 0.5 * s], [0, 0, -0.12]));   // espiraculo: esquina izquierda del morro
      const pey = cl(0.8); for (const k of [1, -1]) hijos.push(ell(liso('#080a0d', { esp: 0.8, dureza: 90 }), [0.075 * s, 0.075 * s, 0.05 * s], [pey[0], pey[1] - 0.18 * s, k * R0(0.8) * s * 0.84]));
    }
    /* joroba dorsal baja y crestas hacia la cola */
    const pdo = cl(0.33), ad = ang(0.33), rdo = R0(0.33) * s;
    const polD = [[0.9, 0], [0.12, 0.62], [-0.18, 0.5], [-0.75, 0]].reverse().map(q => [q[0] * s, q[1] * s]);
    hijos.push(V.nodo({ pos: [pdo[0], pdo[1] + rdo * 0.93, 0], rot: [0, 0, ad], hijos: [V.nodo({ malla: MA.extrusion(polD, 0.34 * s, 'cachalote|joroba'), mat: skin })] }));
    for (let i = 0; i < 4; i++) { const uu = 0.26 - i * 0.04, pc = cl(uu), ac = ang(uu), rc = R0(uu) * s;
      hijos.push(V.nodo({ pos: [pc[0], pc[1] + rc * 0.9, 0], rot: [0, 0, ac], hijos: [V.nodo({ malla: MA.extrusion([[0.35, 0], [0.05, 0.2], [-0.25, 0]].reverse().map(q => [q[0] * s, q[1] * s]), 0.12 * s, 'cachalote|cresta'), mat: skin })] })); }
    /* aletas pectorales: palas cortas y redondeadas */
    const polP = [[0.05, 0], [0.02, 0.07], [-0.05, 0.14], [-0.13, 0.17], [-0.15, 0.1], [-0.11, 0.0]].reverse().map(q => [q[0] * 7.5 * s, q[1] * 7.5 * s]);
    const ap = (o.aleta || 0) + 0.2 * Math.sin(fase * 0.8);
    for (const k of [1, -1]) { const up = 0.62, pp = cl(up);
      hijos.push(V.nodo({ pos: [pp[0], pp[1] - R0(up) * s * 0.62, k * R0(up) * s * 0.8], rot: [0, 0, ang(up)], hijos: [V.nodo({ rot: [k * (-0.7 + ap), 0, 0], hijos: [V.nodo({ rot: [k * PI / 2, 0, 0], hijos: [V.nodo({ malla: MA.extrusion(polP, 0.05 * s, 'cachalote|pect'), mat: skin })] })] })] })); }
    /* cola: aleta caudal ancha con muesca */
    const p0 = cl(0.015), a0 = ang(0.015);
    const polC = [[0.0, 0], [-0.03, 0.06], [-0.09, 0.15], [-0.15, 0.2], [-0.13, 0.1], [-0.09, 0.03], [-0.1, 0], [-0.09, -0.03], [-0.13, -0.1], [-0.15, -0.2], [-0.09, -0.15], [-0.03, -0.06]].reverse().map(q => [q[0] * 11.2 * s, q[1] * 11.2 * s]);
    hijos.push(V.nodo({ pos: [p0[0] + 0.3 * s, p0[1], 0], rot: [0, 0, a0], hijos: [V.nodo({ rot: [PI / 2, 0, 0], hijos: [V.nodo({ malla: MA.extrusion(polC, 0.11 * s, 'cachalote|cola'), mat: skin })] })] }));

    /* interior (rayos X): musculo, sangre, corazon y pulmon */
    if (rx) {
      const brillo = (a, c0, c1, k) => ({ color: a > 0.01 ? c1 : c0, esp: 0.4, dureza: 40, envolver: 0.5, emision: 0.1 + 0.3 * a, sinSombra: true });
      const mM = brillo(res.musculo || 0, '#2a4f7e', '#ff8a2b'), mS = brillo(res.sangre || 0, '#4a2a52', '#ff2a3d'), mP = brillo(res.pulmon || 0, '#2f6a88', '#ff8fc0');
      for (let i = 0; i < 7; i++) { const uu = 0.12 + i * 0.075, pc = cl(uu); for (const k of [1, -1]) hijos.push(ell(mM, [0.7 * s, R0(uu) * s * 0.4, R0(uu) * s * 0.34], [pc[0], pc[1] + 0.05 * s, k * R0(uu) * s * 0.52])); }   // musculo en bandas a lo largo de los flancos
      const a1 = cl(0.03), a2 = cl(0.55);
      hijos.push(V.nodo({ malla: MA.tubo([[a1[0], a1[1], 0], [xs(0.2), ys(0.2) - 0.1 * s, 0], [xs(0.4), ys(0.4) - 0.25 * s, 0], [a2[0], a2[1] - 0.3 * s, 0]], 0.13 * s, 12, { }), mat: mS }));   // arteria principal
      for (const k of [1, -1]) hijos.push(V.nodo({ malla: MA.tubo([[xs(0.5), ys(0.5) - 0.2 * s, 0], [xs(0.5), ys(0.5) + 0.3 * s, k * 0.5 * s], [xs(0.42), ys(0.42) + 0.2 * s, k * 0.7 * s]], 0.07 * s, 10, {}), mat: mS }));
      hijos.push(ell(mS, [0.42 * s, 0.38 * s, 0.4 * s], [xs(0.47), ys(0.47) - 0.45 * s, 0]));                                                                                           // corazon
      const pl = cl(0.6);
      hijos.push(V.nodo({ pos: [pl[0] + 0.5 * s, pl[1] + 0.35 * s, 0], esc: s, hijos: [MO.pulmon({ colapso: o.colapso || 0, color: res.pulmon > 0.01 ? '#e8427f' : '#2f6a88', brillo: res.pulmon || 0, escala: 2.8 })] }));
    }
    return V.nodo({ nombre: 'cachalote', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  /* ================================================================== PULMON */
  MO.pulmon = function (o = {}) {
    const c = c01(o.colapso || 0), s = o.escala == null ? 1 : o.escala, col = o.color || '#f08aa4', br = o.brillo || 0, id = Math.round(c * 40);
    const lobo = (k) => MA.parametrica(40, 28, (u, v) => {                // elipsoide: largo (x) 1, alto (y) y ancho (z) se reducen al plegarse, con pliegues
      const th = u * PI, ph = v * TAU, af = 0.6 + 0.4 * (0.5 - 0.5 * Math.cos(th)), hx = 0.5 * (1 - 0.35 * c), hy = 0.42 * af * (1 - 0.8 * c), hz = 0.22 * af * (1 - 0.55 * c);
      const pl = 1 + c * 0.22 * Math.sin(ph * 5 + th * 3) * Math.sin(th);
      return [hx * Math.cos(th) * pl, hy * Math.sin(th) * Math.sin(ph) * pl + 0.02, hz * Math.sin(th) * Math.cos(ph) * pl * (k ? 1 : 1)]; }, { clave: 'pulmon|' + k + '|' + id });
    const mat = { color: col, esp: 0.5, dureza: 40, envolver: 0.5, borde: 0.4, emision: 0.08 + 0.22 * br };
    const rig = { color: '#bfe7ff', esp: 0.7, dureza: 60, envolver: 0.3, emision: 0.1 + 0.15 * br };
    const h = [];
    for (const k of [1, -1]) h.push(V.nodo({ malla: lobo(0), mat, pos: [0, 0, k * 0.27 * (1 - 0.35 * c)] }));
    h.push(V.nodo({ malla: MA.tubo([[0.62, 0.0, 0], [0.34, 0.03, 0], [0.12, 0.05, 0]], 0.035, 10, {}), mat: rig }));                     // traquea rigida
    for (const k of [1, -1]) h.push(V.nodo({ malla: MA.tubo([[0.12, 0.05, 0], [0.0, 0.0, k * 0.15], [-0.2, -0.02, k * 0.27]], 0.026, 10, {}), mat: rig }));   // bronquios rigidos
    return V.nodo({ nombre: 'pulmon', pos: o.pos, rot: o.rot, esc: [s * (o.esc || 1), s * (o.esc || 1), s * (o.esc || 1)], hijos: h });
  };

  /* ================================================================== BUCEADOR EN APNEA */
  V.poses.buceo = Object.assign({}, V.poses.de_pie, { tronco: 0, cuello: 6, hombro_d: 172, hombro_i: 172, codo_d: 4, codo_i: 4, abrir: 3, cadera_d: 0, cadera_i: 0, rodilla_d: 2, rodilla_i: 2, tobillo_d: -35, tobillo_i: -35 });
  V.poses.nadar = Object.assign({}, V.poses.de_pie, { tronco: 8, cuello: 12, hombro_d: 160, hombro_i: 160, codo_d: 8, codo_i: 8, abrir: 4, cadera_d: 18, cadera_i: -14, rodilla_d: 16, rodilla_i: 6, tobillo_d: -30, tobillo_i: -30 });
  MO.buceador = function (o = {}) {
    const neo = '#12161d', piel = '#d9a37e', fin = '#e8b21d';
    const colores = { pecho: neo, vientre: neo, cintura: neo, pelvis: neo, cuello: neo, cabeza: neo, brazo: neo, antebrazo: neo, mano: piel, muslo: neo, pierna: neo, pie: neo };
    const aleta = (m) => V.nodo({ malla: MA.caja(0.72, 0.014, 0.19, 0.006, 2), mat: liso(fin, { esp: 0.4 }), pos: [0.5, -0.04, 0], rot: [0, 0, -0.12] });
    const mascara = [V.nodo({ malla: MA.esfera(16), esc: [0.04, 0.05, 0.088], pos: [0.1, 0.18, 0], mat: liso('#0c1218', { esp: 0.6 }) }), V.nodo({ malla: MA.esfera(16), esc: [0.012, 0.036, 0.07], pos: [0.138, 0.185, 0], mat: liso('#7fd0ff', { esp: 1, dureza: 90, emision: 0.25 }) })];
    return MO.maniqui({ pose: o.pose || 'buceo', colores, pos: o.pos, rot: o.rot, esc: o.esc, apoyo: o.apoyo, suelo: o.suelo, equipo: { tobillo_d: [aleta()], tobillo_i: [aleta()], cuello: mascara } });
  };
})(window.VE = window.VE || {});
