/* VOLUMEN — ABISMO (fondo marino profundo). Unidades: metros. Todo por codigo; las pieles se pintan UNA vez.
     V.modelos.rape({ id, t, escala, macho, pos, rumbo, alfa, boca })     rape abisal (Melanocetus): cuerpo globoso pardo casi negro, boca enorme de
        dientes finos translucidos, ojos pequenos, caña con señuelo (esca) luminoso. Hacia +X. macho: version diminuta (torpedo palido, ojos grandes).
     V.modelos.calamar({ id, t, escala, pos, rumbo, alfa })               calamar gigante (Architeuthis): manto con aletas romboidales, cabeza con dos ojos
        enormes, 8 brazos con ventosas y 2 tentaculos con maza. Brazos hacia +X, manto hacia -X.
     V.modelos.gusanos({ semilla, n, t, pos, alfa })                      colonia de gusanos tubicolas (Riftia): tubo blanco y penacho rojo
     V.modelos.chimenea({ alto, t, humo, pos })                           fumarola negra: torre rugosa de sulfuros, borde incandescente y humo
     V.modelos.cangrejo({ t, pos, rumbo, escala, color })                 cangrejo palido de fondo (8 patas, 2 pinzas, ojos en tallo)
     V.modelos.lago({ r, t, pos })                                        lago de salmuera: crater de mejillones con superficie turquesa
     V.modelos.suelo({ semilla, x0, x1, z0, z1, alto(x,z) })              suelo de sedimento fino
     V.fondo.agua(esc, { prof (0..1), a })                                 fondo 2D de agua: del azul de superficie al negro del abismo
   Revision: demo/abismo.html (rape | calamar | chimenea | lago). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, TAU = PI * 2, c01 = (v) => Math.max(0, Math.min(1, v));
  const sm = (a, b, x) => { x = c01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const nodo = V.nodo;

  /* ---- texturas (una vez) ---- */
  const ruido = (x, W, H, rn, n, c, a0, a1, r0, r1) => { for (let i = 0; i < n; i++) { x.fillStyle = c; x.globalAlpha = a0 + rn() * (a1 - a0); x.beginPath(); x.arc(rn() * W, rn() * H, r0 + rn() * (r1 - r0), 0, TAU); x.fill(); } x.globalAlpha = 1; };
  const pielRape = () => V.textura('abismo|rape', 512, 256, (x, W, H) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b1411'); g.addColorStop(0.5, '#2a1f19'); g.addColorStop(1, '#3a2c24'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rn = VE.rng('rape|piel'); ruido(x, W, H, rn, 900, '#5a463a', 0.05, 0.22, 2, 9); ruido(x, W, H, rn, 500, '#0b0807', 0.1, 0.35, 2, 10);
    for (let i = 0; i < 2600; i++) { const cx = rn() * W, cy = rn() * H; x.fillStyle = `rgba(150,120,96,${0.1 + rn() * 0.25})`; x.beginPath(); x.arc(cx, cy, 0.8 + rn() * 1.2, 0, TAU); x.fill(); }   // denticulos de la piel
  });
  const pielMacho = () => V.textura('abismo|macho', 256, 128, (x, W, H) => { x.fillStyle = '#b79c82'; x.fillRect(0, 0, W, H); const rn = VE.rng('macho'); ruido(x, W, H, rn, 300, '#7c6350', 0.05, 0.2, 2, 7); });
  const pielCalamar = () => V.textura('abismo|calamar', 512, 256, (x, W, H) => {          // x = vuelta (lomo en 25 %, vientre en 75 %), y = largo
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#d79a85'); g.addColorStop(0.25, '#7b2a22'); g.addColorStop(0.5, '#b8604c'); g.addColorStop(0.75, '#e6b6a2'); g.addColorStop(1, '#d79a85');
    x.fillStyle = g; x.fillRect(0, 0, W, H); const rn = VE.rng('calamar|piel');
    for (let i = 0; i < 1800; i++) { const cx = rn() * W, cy = rn() * H, dorsal = 1 - Math.min(1, Math.abs(cx / W - 0.25) * 4); x.fillStyle = `rgba(${70 + rn() * 70},${14 + rn() * 20},${14 + rn() * 14},${0.18 + rn() * 0.45 * (0.4 + dorsal)})`; x.beginPath(); x.ellipse(cx, cy, 1.5 + rn() * 3.5, 1.2 + rn() * 2.6, 0, 0, TAU); x.fill(); }   // cromatoforos
    ruido(x, W, H, rn, 500, '#ffe9de', 0.04, 0.14, 1, 4);
  });
  const pielBrazo = () => V.textura('abismo|brazo', 128, 256, (x, W, H) => {              // ventosas en la cara inferior (u = 0.5)
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#8e3a2e'); g.addColorStop(0.5, '#d7a08c'); g.addColorStop(1, '#8e3a2e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rn = VE.rng('brazo'); ruido(x, W, H, rn, 220, '#521610', 0.1, 0.4, 1, 3);
    for (let j = 0; j < 20; j++) for (const dx of [-9, 9]) { const cx = W * 0.5 + dx, cy = (j + 0.5 + (dx > 0 ? 0.5 : 0)) * H / 20.5, r = 7 * (1 - 0.35 * j / 20);
      x.fillStyle = '#f2d9cb'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.strokeStyle = '#7a2c22'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#a54a3a'; x.beginPath(); x.arc(cx, cy, r * 0.5, 0, TAU); x.fill(); }
  });
  const pielGusano = () => V.textura('abismo|tubo', 64, 128, (x, W, H) => { x.fillStyle = '#ece4d2'; x.fillRect(0, 0, W, H); const rn = VE.rng('tubo'); ruido(x, W, H, rn, 160, '#b6a98c', 0.1, 0.4, 1, 3); for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(120,100,70,0.16)'; x.fillRect(0, i * H / 9 + rn() * 4, W, 3); } });
  const pielRoca = (clave, base, claro, oscuro) => V.textura('abismo|roca|' + clave, 256, 256, (x, W, H) => { x.fillStyle = base; x.fillRect(0, 0, W, H); const rn = VE.rng('roca' + clave); ruido(x, W, H, rn, 500, claro, 0.05, 0.25, 2, 14); ruido(x, W, H, rn, 500, oscuro, 0.1, 0.4, 2, 16); });
  const pielCangrejo = (color) => V.textura('abismo|cangrejo|' + color, 128, 128, (x, W, H) => { x.fillStyle = color; x.fillRect(0, 0, W, H); const rn = VE.rng('cang'); ruido(x, W, H, rn, 200, '#fff6ee', 0.05, 0.2, 1, 4); ruido(x, W, H, rn, 160, '#6a4a3a', 0.05, 0.18, 1, 4); });

  /* ============================== RAPE ABISAL ============================== */
  const mallaCuerpoRape = () => MA.parametrica(56, 36, (u, v) => {                          // u: vuelta (0..1), v: de la cola (0) al hocico (1) sobre el eje X
    const s = v * 2 - 1, x = s * 0.5, redondo = Math.sqrt(Math.max(0, 1 - s * s)), r = Math.pow(redondo, 0.78);
    const a = u * TAU, h = 0.43 * r * (1 + 0.05 * Math.sin(s * 5)), w = 0.35 * r;
    return [x, Math.cos(a) * h + 0.02 * (1 - s) * r, Math.sin(a) * w];
  }, { clave: 'rape|cuerpo' });
  const dientesRape = () => {                                                              // conos finos en arco alrededor del hocico (arriba cuelgan, abajo apuntan arriba)
    const partes = [], n = 22, cono = MA.cilindro(0.016, 0, 0.14, 6, false);
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, ph = lerp(-1.25, 1.25, f), largo = (0.55 + 0.9 * Math.pow(Math.sin(f * PI), 0.8)) * (0.8 + 0.4 * ((i * 37) % 7) / 7);
      const arriba = k === 0, x = 0.31 + 0.2 * Math.cos(ph) - (arriba ? 0 : 0.03), z = 0.22 * Math.sin(ph) * 1.25, y = arriba ? -0.045 : -0.118;
      const m = V.m4.mul(V.m4.tras(x, y, z), V.m4.mul(V.m4.rotY(-ph * 0.6), V.m4.mul(V.m4.rotX(arriba ? 0 : PI), V.m4.esc(1, largo, 1))));
      partes.push({ malla: cono, m: V.m4.mul(m, V.m4.tras(0, -0.05, 0)) });
    }
    return MA.fusionar(partes, 'rape|dientes');
  };
  MO.rape = (o = {}) => {
    const s = o.escala == null ? 1 : o.escala, t = o.t || 0, id = o.id || 'rape', macho = !!o.macho, sway = Math.sin(t * 1.6 + id.length) * 0.05;
    if (macho) {
      return nodo({ pos: o.pos, rot: [0, o.rumbo || 0, 0], esc: s, alfa: o.alfa, hijos: [
        nodo({ malla: MA.esfera(20), esc: [0.5, 0.11, 0.1], mat: { color: '#fff', mapa: pielMacho(), esp: 0.3, dureza: 30, envolver: 0.4 } }),
        nodo({ malla: MA.esfera(14), esc: [0.22, 0.07, 0.06], pos: [-0.46, 0, 0], mat: { color: '#9a8068', esp: 0.2, dureza: 20 } }),
        ...[1, -1].map(k => nodo({ malla: MA.esfera(12), esc: 0.075, pos: [0.38, 0.03, 0.085 * k], mat: { color: '#0a0806', esp: 0.9, dureza: 90 } })),
        ...[1, -1].map(k => nodo({ malla: MA.esfera(8), esc: 0.03, pos: [0.47, 0.01, 0.05 * k], mat: { color: '#d8c3a8' } })) ] });          // fosas olfativas
    }
    const brillo = o.brillo == null ? 1 : o.brillo, abre = o.boca == null ? 0.5 : o.boca;
    const pts = []; for (let i = 0; i <= 14; i++) { const q = i / 14; pts.push([0.26 + 0.52 * q + 0.04 * Math.sin(t * 1.2) * q, 0.38 + 0.36 * Math.sin(q * PI * 0.72) - 0.2 * q * q + sway * q, 0]); }
    const fin = pts[pts.length - 1];
    const tail = []; for (let i = 0; i <= 10; i++) { const q = i / 10; tail.push([-0.42 - 0.55 * q, -0.01 + 0.04 * Math.sin(q * 3 + t * 2) * q, 0.07 * Math.sin(q * 4 - t * 2.4) * q]); }
    return nodo({ pos: o.pos, rot: [0, o.rumbo || 0, 0], esc: s, alfa: o.alfa, hijos: [
      nodo({ nombre: 'cuerpo', malla: mallaCuerpoRape(), mat: { color: '#fff', mapa: pielRape(), esp: 0.28, dureza: 26, envolver: 0.35, borde: 0.5 } }),
      nodo({ nombre: 'vientre', pos: [-0.05, -0.38, 0], esc: 0.001 }),
      /* mandibula inferior: sobresale hacia delante y arriba (rasgo del grupo) */
      nodo({ malla: MA.esfera(24), esc: [0.3, 0.13, 0.3], pos: [0.36, -0.2 - 0.1 * (abre - 0.5), 0], rot: [0, 0, 0.18], mat: { color: '#fff', mapa: pielRape(), esp: 0.25, dureza: 26, envolver: 0.35 } }),
      nodo({ malla: MA.esfera(20), esc: [0.24, 0.085 + 0.05 * abre, 0.27], pos: [0.4, -0.085 - 0.04 * (abre - 0.5), 0], mat: { color: '#3a0d14', tipo: 'plano' } }),    // interior de la boca
      nodo({ malla: dientesRape(), pos: [0, -0.04 * (abre - 0.5), 0], mat: { color: '#eef3ea', alfa: 0.88, esp: 0.7, dureza: 60, envolver: 0.5, borde: 0.8 }, sinSombra: true }),
      ...[1, -1].map(k => nodo({ pos: [0.27, 0.12, 0.28 * k], hijos: [
        nodo({ malla: MA.esfera(14), esc: 0.036, mat: { color: '#0b0a09', esp: 0.95, dureza: 100 } }),
        nodo({ malla: MA.esfera(10), esc: 0.018, pos: [0.025, 0.02, 0.02 * k], mat: { color: '#ffffff', tipo: 'plano' } }) ] })),
      /* aletas */
      ...[1, -1].map(k => nodo({ malla: MA.esfera(12), esc: [0.12, 0.012, 0.07], pos: [0.02, -0.12, 0.34 * k], rot: [0.5 * k, 0, 0.2 * Math.sin(t * 3 + k)], mat: { color: '#463a33', alfa: 0.9, esp: 0.1 } })),
      nodo({ malla: MA.tubo(tail, (q) => 0.2 * (1 - 0.82 * q), 10, { dinamica: 'rape|cola|' + id }), mat: { color: '#fff', mapa: pielRape(), esp: 0.2, dureza: 20, envolver: 0.35 } }),
      nodo({ malla: MA.esfera(16), esc: [0.02, 0.22, 0.34], pos: [tail[10][0] - 0.03, tail[10][1], tail[10][2]], mat: { color: '#5a4a40', alfa: 0.85, esp: 0.1 } }),
      /* cana (illicium) y esca luminosa */
      nodo({ malla: MA.tubo(pts, 0.011, 6, { dinamica: 'rape|cana|' + id }), mat: { color: '#2d2420', esp: 0.2, dureza: 20 } }),
      nodo({ nombre: 'esca', pos: fin, hijos: [
        nodo({ malla: MA.esfera(18), esc: 0.052, mat: { color: '#bdfbff', emision: 1, tipo: 'plano' }, sinSombra: true }),
        nodo({ malla: MA.esfera(16), esc: 0.11 * (0.9 + 0.1 * Math.sin(t * 3)) * brillo, mat: { color: '#7be9ff', alfa: 0.18 * brillo, tipo: 'plano' }, sinSombra: true }),
        ...[0, 1, 2, 3, 4].map(i => nodo({ malla: MA.tubo([[0, 0, 0], [0.02 * Math.cos(i * 1.3), -0.06 - 0.03 * (i % 2), 0.025 * Math.sin(i * 1.3)], [0.03 * Math.cos(i * 1.3), -0.11, 0.035 * Math.sin(i * 1.3)]], 0.004, 5, { clave: 'rape|fil|' + i }), mat: { color: '#bdfbff', emision: 0.9, tipo: 'plano' }, sinSombra: true })) ] }),
    ] });
  };
  /* posicion aproximada (mundo local sin rumbo) de la esca para anclar grafismos */
  MO.rape.esca = (o = {}) => { const s = o.escala == null ? 1 : o.escala, p = o.pos || [0, 0, 0], a = o.rumbo || 0, x = 0.78 * s, y = 0.3 * s; return [p[0] + x * Math.cos(a), p[1] + y, p[2] - x * Math.sin(a)]; };

  /* ============================== CALAMAR GIGANTE ============================== */
  const cuerpoCalamar = () => MA.parametrica(40, 40, (u, v) => {                           // v: de la punta del manto (0) a la cabeza (1); x de -1.2 a 0
    const x = lerp(-1.25, -0.04, v), r = 0.115 * (v < 0.06 ? Math.sqrt(v / 0.06) * 0.5 : 0.5 + 0.5 * sm(0.04, 0.35, v)) * (1 + 0.06 * Math.sin(v * 9)) * (v > 0.9 ? 1 - 0.35 * sm(0.9, 1, v) : 1), a = u * TAU;
    return [x, Math.cos(a) * r, Math.sin(a) * r * 0.97];
  }, { clave: 'calamar|manto' });
  const aletaCalamar = () => MA.extrusion([[0, -0.2], [0.24, 0], [0, 0.2], [-0.04, 0]], 0.012, 'calamar|aleta');
  const brazoPts = (n, largo, ang, ondas, t, ph, caida) => { const p = []; for (let i = 0; i <= n; i++) { const q = i / n; p.push([q * largo, caida * q * q + 0.045 * largo * Math.sin(q * ondas * TAU - t * 2.2 + ph) * q * (ang[0]), 0.045 * largo * Math.cos(q * ondas * TAU - t * 1.8 + ph) * q * (ang[1])]); } return p; };
  MO.calamar = (o = {}) => {
    const s = o.escala == null ? 1 : o.escala, t = o.t || 0, id = o.id || 'cal', pulso = 1 + 0.035 * Math.sin(t * 2.2);
    const hijos = [
      nodo({ malla: cuerpoCalamar(), esc: [1, pulso, pulso], mat: { color: '#fff', mapa: pielCalamar(), esp: 0.35, dureza: 40, envolver: 0.4, borde: 0.5 } }),
      ...[1, -1].map(k => nodo({ malla: aletaCalamar(), pos: [-1.2, 0, 0.0], rot: [PI / 2 * k, 0, 0], esc: [1, 1, 1], mat: { color: '#fff', mapa: pielCalamar(), esp: 0.2, dureza: 20, envolver: 0.4 } })),
      nodo({ malla: MA.esfera(24), esc: [0.15, 0.12, 0.12], pos: [0.04, 0, 0], mat: { color: '#c0634f', esp: 0.3, dureza: 30, envolver: 0.4 } }),
    ];
    for (const k of [1, -1]) hijos.push(nodo({ pos: [0.06, 0.015, 0.125 * k], hijos: [                      // ojo: iris ambar con pupila horizontal y brillo
      nodo({ malla: MA.esfera(24), esc: 0.115, mat: { color: '#d9a64a', esp: 0.95, dureza: 120, envolver: 0.2 } }),
      nodo({ malla: MA.esfera(20), esc: [0.082, 0.05, 0.02], pos: [0.045, 0, 0.1 * k], rot: [0, k * 0.5, 0], mat: { color: '#05060a', esp: 0.9, dureza: 110, tipo: 'plano' } }),
      nodo({ malla: MA.esfera(10), esc: 0.018, pos: [0.075, 0.05, 0.09 * k], mat: { color: '#ffffff', tipo: 'plano' }, sinSombra: true }),
      nodo({ malla: MA.toro(0.116, 0.011, 28, 8), rot: [PI / 2, 0, 0], pos: [0, 0, 0], esc: 1, mat: { color: '#e8e0c8', esp: 0.5, dureza: 40 } }) ] }));
    const ang = [0.2, 0.5, 0.8, 1.1, 1.6, 2.0, 2.4, 2.9];                                                // 8 brazos repartidos en corona
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2, rad = 0.07, largo = 0.68 + 0.1 * Math.sin(i * 2.1), ex = Math.cos(a), ez = Math.sin(a);
      const pts = brazoPts(18, largo, [1, 1], 1.3, t, i * 0.9, 0.0).map(p => [0.12 + p[0], p[2] * 0.4 + ex * rad + ex * p[0] * 0.18 + 0.02, ez * rad + ez * p[0] * 0.22 + p[1] * 0.4 - 0.03 + 0.03 * p[0]]);
      hijos.push(nodo({ malla: MA.tubo(pts, (q) => 0.034 * (1 - 0.88 * Math.pow(q, 0.85)), 8, { dinamica: `cal|b|${id}|${i}` }), mat: { color: '#fff', mapa: pielBrazo(), esp: 0.25, dureza: 24, envolver: 0.4 } }));
    }
    for (const k of [1, -1]) {                                                                         // 2 tentaculos largos con maza
      const pts = brazoPts(26, 1.5, [1, 1], 1.1, t, k * 1.7, 0.0).map(p => [0.14 + p[0], p[2] * 0.35 + 0.05, 0.05 * k + k * p[0] * 0.16 + p[1] * 0.4]);
      hijos.push(nodo({ malla: MA.tubo(pts, (q) => 0.016 + 0.03 * sm(0.78, 0.9, q) * (1 - 0.7 * sm(0.95, 1, q)), 8, { dinamica: `cal|t|${id}|${k}` }), mat: { color: '#fff', mapa: pielBrazo(), esp: 0.25, dureza: 24, envolver: 0.4 } }));
    }
    hijos.push(nodo({ malla: MA.esfera(12), esc: 0.05, pos: [0.19, -0.01, 0], mat: { color: '#150808' } }));   // pico
    return nodo({ pos: o.pos, rot: [0, o.rumbo || 0, 0], esc: s, alfa: o.alfa, hijos });
  };
  MO.calamar.ojo = (o = {}) => { const s = o.escala == null ? 1 : o.escala, p = o.pos || [0, 0, 0], a = o.rumbo || 0, x = 0.06 * s, z = 0.2 * s; return [p[0] + x * Math.cos(a) + z * Math.sin(a), p[1] + 0.015 * s, p[2] - x * Math.sin(a) + z * Math.cos(a)]; };

  /* ============================== GUSANOS TUBICOLAS ============================== */
  MO.gusanos = (o = {}) => {
    const n = o.n || 14, rn = VE.rng('gus|' + (o.semilla || 'g')), t = o.t || 0, hijos = [];
    hijos.push(nodo({ malla: MA.esfera(16), esc: [0.34, 0.1, 0.34], pos: [0, 0.0, 0], mat: { color: '#fff', mapa: pielRoca('base', '#2a2623', '#5a4b3e', '#0b0908'), esp: 0.1, dureza: 10 } }));
    for (let i = 0; i < n; i++) {
      const a = rn() * TAU, d = Math.sqrt(rn()) * 0.27, h = 0.5 + rn() * 0.55, curva = (rn() - 0.5) * 0.45, ph = rn() * 6, r = 0.016 + rn() * 0.012, ap = (rn() - 0.5) * 0.5;
      const sw = 0.03 * Math.sin(t * 1.3 + ph);
      const pts = []; for (let k = 0; k <= 10; k++) { const q = k / 10; pts.push([curva * q * q + sw * q, h * q, ap * q * q]); }
      const tope = pts[10], clave = 'gus|' + n + '|' + i + '|' + (o.semilla || 'g');
      hijos.push(nodo({ pos: [Math.cos(a) * d, 0.04, Math.sin(a) * d], hijos: [
        nodo({ malla: MA.tubo(pts, r, 8, { dinamica: 'gus|t|' + clave }), mat: { color: '#fff', mapa: pielGusano(), esp: 0.35, dureza: 40, envolver: 0.4 } }),
        nodo({ pos: tope, hijos: [
          nodo({ malla: MA.esfera(12), esc: [r * 1.7, r * 4.6, r * 1.7], pos: [0, r * 3.8, 0], mat: { color: '#d0152b', esp: 0.5, dureza: 40, envolver: 0.5 } }),
          ...[0, 1, 2, 3, 4, 5].map(j => nodo({ malla: MA.cilindro(r * 0.5, r * 0.18, r * 7, 6, false), pos: [Math.cos(j * 1.05 + ph) * r * 1.5, r * 5.2, Math.sin(j * 1.05 + ph) * r * 1.5], rot: [Math.sin(j * 1.05 + ph) * 0.35, 0, -Math.cos(j * 1.05 + ph) * 0.35], mat: { color: '#e42a40', esp: 0.4, dureza: 30, envolver: 0.5 } })) ] }) ] }));
    }
    return nodo({ pos: o.pos, alfa: o.alfa, esc: o.escala == null ? 1 : o.escala, hijos });
  };

  /* ============================== FUMAROLA NEGRA ============================== */
  const torreChimenea = (alto) => MA.parametrica(40, 40, (u, v) => {
    const y = v * alto, a = u * TAU, base = 0.55 * (1 - 0.75 * Math.pow(v, 0.6)) + 0.11, rug = 1 + 0.18 * Math.sin(a * 5 + v * 9) * Math.sin(v * 13 + 1) + 0.1 * Math.sin(a * 11 - v * 21) + 0.12 * Math.sin(v * 6) * Math.cos(a * 3);
    const r = base * rug * (v > 0.96 ? 1 + (v - 0.96) * 2.5 : 1);
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  }, { clave: 'chimenea|' + alto });
  MO.chimenea = (o = {}) => {
    const alto = o.alto || 3, t = o.t || 0, hijos = [nodo({ malla: torreChimenea(alto), mat: { color: '#fff', mapa: pielRoca('chim', '#2b2a2c', '#6f5a48', '#0a0a0c'), esp: 0.12, dureza: 12, envolver: 0.2, borde: 0.4 } })];
    hijos.push(nodo({ malla: MA.cilindro(0.2, 0.2, 0.02, 24, true), pos: [0, alto * 1.0, 0], mat: { color: '#ff8a3a', emision: 1, tipo: 'plano' }, sinSombra: true }));
    hijos.push(nodo({ malla: MA.esfera(16), esc: [0.34, 0.12, 0.34], pos: [0, alto + 0.04, 0], mat: { color: '#ffb066', alfa: 0.32, tipo: 'plano' }, sinSombra: true }));
    if (o.humo !== false) { const rn = VE.rng('humo'); for (let i = 0; i < 26; i++) { const ph = ((t * 0.26 + rn()) % 1), r0 = 0.14 + ph * 0.75, dx = (rn() - 0.5) * 0.5 * ph + 0.22 * ph * Math.sin(ph * 5 + i), dz = (rn() - 0.5) * 0.5 * ph;
      hijos.push(nodo({ malla: MA.esfera(10), esc: r0, pos: [dx, alto + 0.1 + ph * 3.4, dz], mat: { color: i % 3 ? '#1b1a1c' : '#2c2a2e', alfa: 0.5 * (1 - ph) * Math.min(1, ph * 8), tipo: 'plano' }, sinSombra: true })); } }
    return nodo({ pos: o.pos, esc: o.escala == null ? 1 : o.escala, alfa: o.alfa, hijos });
  };

  /* ============================== CANGREJO ============================== */
  MO.cangrejo = (o = {}) => {
    const s = o.escala == null ? 1 : o.escala, t = o.t || 0, mat = { color: '#fff', mapa: pielCangrejo(o.color || '#e6d2c0'), esp: 0.4, dureza: 40, envolver: 0.4, borde: 0.4 }, hijos = [];
    hijos.push(nodo({ malla: MA.esfera(24), esc: [0.17, 0.065, 0.14], pos: [0, 0.13, 0], mat }));
    hijos.push(nodo({ malla: MA.esfera(16), esc: [0.1, 0.04, 0.1], pos: [-0.12, 0.12, 0], mat }));
    for (const k of [1, -1]) {
      hijos.push(nodo({ pos: [0.13, 0.17, 0.045 * k], hijos: [nodo({ malla: MA.cilindro(0.008, 0.008, 0.045, 6), mat }), nodo({ malla: MA.esfera(10), esc: 0.017, pos: [0, 0.028, 0], mat: { color: '#0b0b0b', esp: 0.9, dureza: 90 } })] }));
      const sw = 0.1 * Math.sin(t * 1.5 + k);
      for (let i = 0; i < 4; i++) {                                                                  // patas: dos segmentos
        const a = lerp(-0.5, 0.65, i / 3) + (i > 1 ? 0.2 : 0), c = Math.cos(a), sn = Math.sin(a), mv = 0.07 * Math.sin(t * 2 + i * 1.6 + k);
        hijos.push(nodo({ pos: [0.04 - i * 0.045, 0.13, 0.11 * k], rot: [k * (0.9 + mv), 0, 0.5 - 0.25 * i * 0.2], hijos: [
          nodo({ malla: MA.capsula(0.014, 0.011, 0.16, 8), mat }),
          nodo({ pos: [0, -0.16, 0], rot: [-k * 1.2, 0, 0], hijos: [nodo({ malla: MA.capsula(0.011, 0.005, 0.15, 8), mat })] }) ] }));
      }
      hijos.push(nodo({ pos: [0.15, 0.13, 0.12 * k], rot: [0, k * 0.5, 0], hijos: [                                // brazos con pinza
        nodo({ malla: MA.capsula(0.026, 0.02, 0.15, 8), rot: [0, 0, -PI / 2 + 0.3], mat }),
        nodo({ pos: [0.15, 0.03, 0], rot: [0, 0, 0.3 + 0.25 * Math.sin(t * 2 + k)], hijos: [nodo({ malla: MA.esfera(14), esc: [0.065, 0.032, 0.03], mat }), nodo({ malla: MA.esfera(10), esc: [0.045, 0.015, 0.018], pos: [0.065, -0.012, 0], mat })] }) ] }));
    }
    return nodo({ pos: o.pos, rot: [0, o.rumbo || 0, 0], esc: s, alfa: o.alfa, hijos });
  };

  /* ============================== LAGO DE SALMUERA ============================== */
  MO.lago = (o = {}) => {
    const r = o.r || 3.2, t = o.t || 0, rn = VE.rng('lago'), hijos = [];
    const superficie = MA.parametrica(40, 14, (u, v) => { const a = u * TAU, rr = v * r * 0.93; return [Math.cos(a) * rr, 0.16 + 0.012 * Math.sin(rr * 4 - t * 1.6 + a * 3) * v, Math.sin(a) * rr]; }, { dinamica: 'lago|sup', abierta: true });
    hijos.push(nodo({ malla: superficie, mat: { color: '#58d8d0', alfa: 0.85, esp: 0.85, dureza: 90, envolver: 0.3, borde: 0.4, dobleCara: true } }));
    hijos.push(nodo({ malla: MA.toro(r, 0.42, 64, 16), esc: [1, 0.34, 1], pos: [0, 0.1, 0], mat: { color: '#fff', mapa: pielRoca('cuenca', '#4b4338', '#c9b99c', '#15110d'), esp: 0.1, dureza: 10, envolver: 0.3 } }));
    for (let i = 0; i < 240; i++) {                                                                       // mejillones del borde
      const a = rn() * TAU, rr = r + (rn() - 0.4) * 0.6, e = 0.05 + rn() * 0.05, sombra = rn() < 0.7 ? '#1a1f33' : '#2b3150';
      hijos.push(nodo({ malla: MA.esfera(8), esc: [e * 1.7, e, e], pos: [Math.cos(a) * rr, 0.22 + rn() * 0.08, Math.sin(a) * rr], rot: [rn() * 0.6, rn() * TAU, rn() * 0.6], mat: { color: sombra, esp: 0.6, dureza: 60, envolver: 0.3 } }));
    }
    return nodo({ pos: o.pos, alfa: o.alfa, hijos });
  };

  /* ============================== SUELO DE SEDIMENTO ============================== */
  MO.suelo = (o = {}) => {
    const x0 = o.x0 == null ? -30 : o.x0, x1 = o.x1 == null ? 30 : o.x1, z0 = o.z0 == null ? -40 : o.z0, z1 = o.z1 == null ? 8 : o.z1, sem = o.semilla || 's', alto = o.alto || ((x, z) => 0.18 * Math.sin(x * 0.7 + sem.length) * Math.cos(z * 0.6) + 0.07 * Math.sin(x * 2.3 + z * 1.7));
    const tex = V.textura('abismo|suelo|' + (o.color || 'g'), 512, 512, (x, W, H) => { x.fillStyle = o.color || '#6a6256'; x.fillRect(0, 0, W, H); const rn = VE.rng('suelo' + sem); ruido(x, W, H, rn, 1400, '#8c8372', 0.04, 0.2, 2, 14); ruido(x, W, H, rn, 1200, '#2a2620', 0.05, 0.25, 2, 12); });
    const malla = MA.parametrica(70, 70, (u, v) => { const X = lerp(x0, x1, u), Z = lerp(z0, z1, v); return [X, alto(X, Z), Z]; }, { clave: 'suelo|' + [x0, x1, z0, z1, sem].join(',') });
    return nodo({ nombre: 'suelo', malla, mat: { color: '#fff', mapa: tex, repetir: [6, 6], esp: 0.04, dureza: 8, envolver: 0.3 } });
  };

  /* ============================== FONDO 2D DE AGUA ============================== */
  V.fondo.agua = function (esc, o = {}) {
    const niv = Math.round(c01(o.prof == null ? 0.5 : o.prof) * 40), clave = 'volfondo|agua|' + niv + '|' + esc.W + 'x' + esc.H + '|' + esc.ss;
    const c = esc.cache.obtener(clave, () => {
      const cv = document.createElement('canvas'); cv.width = Math.round(esc.W * esc.ss); cv.height = Math.round(esc.H * esc.ss); const x = cv.getContext('2d'); x.scale(esc.ss, esc.ss);
      const p = niv / 40, W = esc.W, H = esc.H, mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k))), A = [[40, 150, 175], [11, 58, 105], [4, 14, 40], [1, 3, 10]];
      const col = (q) => { const f = c01(q) * 3, i = Math.min(2, Math.floor(f)); return mix(A[i], A[i + 1], f - i); }, top = col(p), bot = col(Math.min(1, p + 0.18));
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgb(${top})`); g.addColorStop(1, `rgb(${bot})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const rn = VE.rng('rayos' + niv), luz = 1 - sm(0, 0.55, p);
      if (luz > 0.02) for (let i = 0; i < 9; i++) { const cx = rn() * W, w = 40 + rn() * 120, gr = x.createLinearGradient(cx, 0, cx + 200 * (rn() - 0.5), H * 0.8); gr.addColorStop(0, `rgba(170,230,240,${0.16 * luz})`); gr.addColorStop(1, 'rgba(170,230,240,0)');
        x.fillStyle = gr; x.beginPath(); x.moveTo(cx - w, 0); x.lineTo(cx + w, 0); x.lineTo(cx + w * 3, H); x.lineTo(cx - w * 3, H); x.fill(); }
      const v = x.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
      return cv; });
    const x = esc.ctx; x.save(); if (o.a != null) x.globalAlpha *= o.a; x.drawImage(c, 0, 0, esc.W, esc.H); x.restore();
  };
})(window.VE);
