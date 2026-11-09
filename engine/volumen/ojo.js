/* ============================================================================================
   OJO, SANGRE Y MOLECULAS (3D, para temas de salud / cuerpo). Registrado en engine/video/index.html tras sueno.js.
     V.modelos.ojo({ rojo, abierto, mira, esc, pos, rot, rayosx, alfa, rasgos })
          globo ocular de radio 1 (mira a +X): esclerotica con capilares pintados (rojo 0..1 = cuanto se enrojece: mas vasos, mas gruesos
          y mas rojos), iris con fibras, pupila, cornea brillante y parpados con pestanas. abierto 0..1. mira = [dy, dz] giro del globo (rad).
          rasgos:false -> solo el globo (sin parpados). rayosx:true -> globo transparente con el cristalino y los vasos (vista interior).
     V.modelos.ojo.puntoIris(o)       punto del iris en el mundo (para etiquetas): { pos, rot, esc }
     V.modelos.globulo({ pos, rot, esc })      globulo rojo (disco bicóncavo), radio 0.46 en el plano XZ
     V.modelos.vaso({ t, radio, largo, flujo, nGlobulos, semilla, alfa, esc, pos, rot })
          tramo de vaso sanguineo a lo largo de Z (translucido) con globulos rojos que avanzan (flujo) y puntitos de plasma;
          radio se anima desde fuera para la vasodilatacion.
     V.modelos.thc({ t, esc, pos, rot, brillo })   molecula estilizada de THC (3 anillos y cadena lateral): carbono gris, oxigeno rojo
     V.modelos.receptor({ pos, rot, esc, activo })  receptor de membrana (haz de 7 helices) que se ilumina al acoplarse la molecula
     V.modelos.sofa({ color, pos, rot, esc })  sofa de tres plazas: frente hacia +X, asiento a 0,46 de alto
     V.modelos.lampara({ pos, esc, encendida }) lampara de pie con pantalla
   Revision: dibujar un fotograma con `vid.py qa <tema> --stills t`. */
(function (VE) {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;
  const c01 = (v) => Math.max(0, Math.min(1, v));

  /* ---------------------------------------------------------------- textura del ojo (equirrectangular; el frente, +X, esta en u = 0,25 v = 0,5) */
  const NIV = 12;
  const texOjo = (nivel) => V.textura('ojo|tex|' + nivel, 1024, 512, (x, W, H) => {
    const k = nivel / (NIV - 1), s = H / PI, cx = W * 0.25, cy = H * 0.5, rn = VE.rng('ojo' + nivel);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e7ddd2'); g.addColorStop(0.5, '#f4eee6'); g.addColorStop(1, '#e4d9cd'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const lava = x.createRadialGradient(cx, cy, 0.5 * s, cx, cy, 1.7 * s);
    lava.addColorStop(0, `rgba(214,80,76,${0.30 * k})`); lava.addColorStop(1, `rgba(222,110,104,${0.46 * k})`); x.fillStyle = lava; x.fillRect(0, 0, W, H);
    // capilares: lineas ramificadas que salen del borde del iris (mas numerosas, gruesas y rojas con el nivel)
    const vaso = (ang, r0, len, w, a, prof) => {
      let px = cx + Math.cos(ang) * r0 * s, py = cy + Math.sin(ang) * r0 * s, dir = ang; x.lineCap = 'round';
      const pasos = 16;
      for (let i = 0; i < pasos; i++) {
        dir += (rn() - 0.5) * 0.35; const l = len / pasos * s, nx = px + Math.cos(dir) * l, ny = py + Math.sin(dir) * l, f = 1 - i / pasos * 0.65;
        x.strokeStyle = `rgba(${150 + 60 * k | 0},${24 + 10 * (1 - k) | 0},${30},${a * (0.55 + 0.45 * f)})`; x.lineWidth = Math.max(0.6, w * f); x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke();
        if (prof < 2 && i > 3 && i % 5 === 0 && rn() < 0.7) vaso(dir + (rn() < 0.5 ? -1 : 1) * (0.5 + rn() * 0.5), 0, len * (1 - i / pasos) * 0.7, w * 0.6, a * 0.85, prof + 1, 0);
        px = nx; py = ny;
      }
    };
    const n = Math.round(10 + 40 * k), a0 = 0.16 + 0.78 * k, w0 = 0.7 + 3.6 * k;
    for (let i = 0; i < n; i++) { const ang = i / n * TAU + rn() * 0.4; vaso(ang, 0.55 + rn() * 0.1, 0.35 + rn() * 0.75 + 0.5 * k, w0 * (0.6 + rn() * 0.8), a0, 0); }
    // iris
    const ri = 0.52 * s, rp = 0.2 * s;
    const ig = x.createRadialGradient(cx, cy, rp * 0.8, cx, cy, ri); ig.addColorStop(0, '#6a4521'); ig.addColorStop(0.55, '#8d6030'); ig.addColorStop(1, '#4b2f17');
    x.fillStyle = ig; x.beginPath(); x.arc(cx, cy, ri, 0, TAU); x.fill();
    for (let i = 0; i < 110; i++) { const a = rn() * TAU, r1 = rp * (1 + rn() * 0.3), r2 = ri * (0.72 + rn() * 0.28); x.strokeStyle = `rgba(${200 + rn() * 40 | 0},${150 + rn() * 50 | 0},${80 + rn() * 30 | 0},${0.12 + rn() * 0.18})`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); x.stroke(); }
    x.strokeStyle = 'rgba(25,14,8,0.85)'; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, ri - 1, 0, TAU); x.stroke();          // anillo limbal
    x.fillStyle = '#080605'; x.beginPath(); x.arc(cx, cy, rp, 0, TAU); x.fill();                                                 // pupila
  });
  const texInterior = () => V.textura('ojo|tex|rx', 512, 256, (x, W, H) => { x.fillStyle = '#143a52'; x.fillRect(0, 0, W, H); const rn = VE.rng('ojorx');
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(120,210,255,${0.12 + rn() * 0.2})`; x.lineWidth = 1 + rn() * 2; x.beginPath(); let px = rn() * W, py = rn() * H; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += (rn() - 0.3) * 60; py += (rn() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } });

  MO.ojo = (o = {}) => {
    const niv = Math.round(c01(o.rojo || 0) * (NIV - 1)), ab = o.abierto == null ? 1 : c01(o.abierto), rx = !!o.rayosx, mira = o.mira || [0, 0];
    const piel = o.piel || '#d9a982', sombra = o.sombra || '#c98f6a', hij = [];
    const mapa = rx ? { color: '#ffffff', mapa: texInterior(), tipo: 'rayosx', fresnel: 1.6, alfa: 0.5 } : { color: '#ffffff', mapa: texOjo(niv), esp: 0.45, dureza: 55, envolver: 0.3, borde: 0.6 };
    const globo = [nodo({ malla: MA.esfera(48), mat: mapa })];
    if (!rx) {
      globo.push(nodo({ malla: MA.esfera(32), esc: [0.62, 0.62, 0.62], pos: [0.55, 0, 0], mat: { color: '#e8f4ff', tipo: 'brillo', esp: 1, dureza: 140, alfa: 0.1, envolver: 0.1 } }));               // cornea
      globo.push(nodo({ malla: MA.esfera(10), esc: 0.055, pos: [1.0, 0.16, 0.14], mat: { color: '#ffffff', tipo: 'plano' } }));                                                                // brillo
      globo.push(nodo({ malla: MA.esfera(8), esc: 0.028, pos: [1.0, -0.12, -0.1], mat: { color: '#ffffff', tipo: 'plano', alfa: 0.6 } }));
    } else {
      globo.push(nodo({ malla: MA.esfera(24), esc: [0.22, 0.3, 0.3], pos: [0.62, 0, 0], mat: { tipo: 'rayosx', color: '#ffd9a0', alfa: 0.7 } }));                                           // cristalino
      globo.push(nodo({ malla: MA.esfera(24), esc: [0.5, 0.5, 0.5], pos: [0.68, 0, 0], mat: { tipo: 'rayosx', color: '#9fe0ff', alfa: 0.3 } }));
    }
    hij.push(nodo({ rot: [0, mira[0] || 0, mira[1] || 0], hijos: globo }));
    if (o.rasgos !== false && !rx) {
      const m = (c, e) => Object.assign({ color: c, esp: 0.18, dureza: 22, envolver: 0.35 }, e || {});
      const abre = 0.62 * ab;                                  // semi-apertura vertical del ojo
      hij.push(nodo({ malla: MA.esfera(40), esc: [1.0, 0.95, 1.32], pos: [0.12, 0.5 + abre + 0.5, 0], rot: [0, 0, 0.0], mat: m(piel) }));                // parpado superior
      hij.push(nodo({ malla: MA.esfera(40), esc: [1.0, 0.8, 1.3], pos: [0.1, -0.5 - abre * 0.85 - 0.45, 0], mat: m(sombra) }));                        // parpado inferior
      for (let i = 0; i < 17; i++) { const t = i / 16 - 0.5, z = t * 2.3, y = 0.5 + abre - 0.02 - Math.abs(t) * 0.3 + (1 - ab) * 0.0;
        hij.push(nodo({ malla: MA.capsula(0.016, 0.006, 0.34, 8), pos: [0.88 - Math.abs(t) * 0.25, y + 0.01, z * 0.92], rot: [-t * 0.9, 0, -1.15 + Math.abs(t) * 0.3 + (1 - ab) * 0.5], mat: { color: '#1e140f', esp: 0.05 } })); }
    }
    return nodo({ nombre: 'ojo', pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: hij });
  };

  /* ---------------------------------------------------------------- globulo rojo */
  const PERF_GLOB = [[0, 0.08], [0.18, 0.1], [0.34, 0.15], [0.44, 0.11], [0.46, 0.0], [0.44, -0.11], [0.34, -0.15], [0.18, -0.1], [0, -0.08]];
  MO.globulo = (o = {}) => nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, malla: MA.torno(PERF_GLOB, 18, 'globulo'), mat: { color: '#c4202a', esp: 0.5, dureza: 40, envolver: 0.5, borde: 0.4 } });

  /* ---------------------------------------------------------------- vaso sanguineo */
  MO.vaso = (o = {}) => {
    const t = o.t || 0, R = o.radio == null ? 1 : o.radio, L = o.largo || 8, n = o.nGlobulos || 26, fl = o.flujo == null ? 0.6 : o.flujo, rn = VE.rng('vaso' + (o.semilla || 0)), hij = [];
    hij.push(nodo({ malla: MA.cilindro(1, 1, L, 40, false), rot: [PI / 2, 0, 0], esc: [R, 1, R], mat: { color: '#e08a7a', tipo: 'brillo', esp: 0.4, dureza: 40, alfa: o.alfaPared == null ? 0.22 : o.alfaPared, dobleCara: true, envolver: 0.4 } }));
    for (let i = 0; i < n; i++) {
      const a = rn() * TAU, r = Math.sqrt(rn()) * 0.66 * R, z0 = rn(), vel = fl * (0.7 + 0.6 * (1 - (r / R) * (r / R))), z = ((z0 + t * vel / L * 1.0) % 1) * L - L / 2, yaw = rn() * TAU;
      hij.push(MO.globulo({ pos: [r * Math.cos(a), r * Math.sin(a), z], rot: [PI / 2 + (rn() - 0.5) * 0.9, yaw, (rn() - 0.5) * 0.9], esc: o.escGlobulo || 0.42 }));
    }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: hij });
  };

  /* ---------------------------------------------------------------- THC (estilizado: 3 anillos hexagonales fusionados + cadena lateral) */
  const molecula = () => {
    const A = [], B = [], at = [], enl = [], s3 = Math.sqrt(3);
    const anillo = (cx, cy) => { const v = []; for (let k = 0; k < 6; k++) { const a = PI / 6 + k * PI / 3; v.push([cx + Math.cos(a), cy + Math.sin(a)]); } return v; };
    const rings = [anillo(0, 0), anillo(s3 * Math.cos(PI / 3), s3 * Math.sin(PI / 3)), anillo(s3 * Math.cos(PI / 3) + s3, s3 * Math.sin(PI / 3))];
    const ya = (p) => at.findIndex(q => Math.hypot(q.p[0] - p[0], q.p[1] - p[1]) < 0.05);
    for (const rg of rings) { const idx = []; for (const p of rg) { let i = ya(p); if (i < 0) { i = at.length; at.push({ p, e: 'C' }); } idx.push(i); } for (let k = 0; k < 6; k++) { const a = idx[k], b = idx[(k + 1) % 6]; if (!enl.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) enl.push([a, b]); } }
    at[ya(rings[1][2])].e = 'O'; at[ya(rings[1][3])].e = 'O';
    // grupo OH y cadena
    const p0 = rings[0][4], o1 = [p0[0] - 0.5, p0[1] - 0.9]; at.push({ p: o1, e: 'O' }); enl.push([ya(p0), at.length - 1]);
    let prev = ya(rings[0][3]), px = rings[0][3][0], py = rings[0][3][1];
    for (let i = 0; i < 5; i++) { px -= 0.85; py += (i % 2 ? 0.5 : -0.5) * 0.9 + 0.2; at.push({ p: [px, py], e: 'C' }); enl.push([prev, at.length - 1]); prev = at.length - 1; }
    return { at, enl };
  };
  MO.thc = (o = {}) => {
    const { at, enl } = molecula(), t = o.t || 0, br = o.brillo == null ? 0.25 : o.brillo, hij = [], k = 0.16, cm = at.reduce((s, a) => [s[0] + a.p[0], s[1] + a.p[1]], [0, 0]).map(v => v / at.length);
    const P = (a) => [(a.p[0] - cm[0]) * k, (a.p[1] - cm[1]) * k, 0.06 * k * Math.sin(a.p[0] * 3 + a.p[1] * 2)];
    for (const a of at) hij.push(nodo({ malla: MA.esfera(14), pos: P(a), esc: a.e === 'O' ? 0.17 * 1.0 : 0.13, mat: { color: a.e === 'O' ? '#e0343b' : '#5d6672', esp: 0.7, dureza: 80, envolver: 0.3, emision: br } }));
    for (const [i, j] of enl) { const p = P(at[i]), q = P(at[j]), d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], l = Math.hypot(...d), ang = Math.atan2(d[1], d[0]);
      hij.push(nodo({ malla: MA.cilindro(0.028, 0.028, l, 8, false), pos: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], rot: [0, 0, ang - PI / 2], mat: { color: '#c9d1da', esp: 0.4, dureza: 40, emision: br * 0.6 } })); }
    return nodo({ pos: o.pos, rot: [0, 0.35 * Math.sin(t * 0.8), 0.1 * Math.sin(t * 0.6)].map((v, i) => v + ((o.rot || [0, 0, 0])[i] || 0)), esc: o.esc, alfa: o.alfa, hijos: hij });
  };

  /* ---------------------------------------------------------------- receptor de membrana (7 helices) */
  MO.receptor = (o = {}) => {
    const ac = c01(o.activo || 0), hij = [], col = ac > 0.5 ? '#3fd0ff' : '#8a7cd8', em = 0.1 + 0.7 * ac;
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = 0.1; hij.push(nodo({ malla: MA.cilindro(0.045, 0.045, 0.5, 12), pos: [r * Math.cos(a), 0.0, r * Math.sin(a)], rot: [0.1 * Math.sin(a), 0, 0.1 * Math.cos(a)], mat: { color: col, esp: 0.5, dureza: 60, envolver: 0.3, emision: em } })); }
    hij.push(nodo({ malla: MA.esfera(14), esc: [0.16, 0.05, 0.16], pos: [0, 0.27, 0], mat: { color: col, emision: em, esp: 0.4 } }));
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: hij });
  };

  /* ---------------------------------------------------------------- sofa y lampara */
  MO.sofa = (o = {}) => {
    const c = o.color || '#6b5a78', tela = (col) => ({ color: col || c, esp: 0.05, dureza: 10, envolver: 0.6, borde: 0.7 }), oscuro = '#4a3d56', h = [];
    h.push(nodo({ malla: MA.caja(0.95, 0.3, 2.3, 0.07, 4), pos: [0, 0.22, 0], mat: tela(oscuro) }));                                   // base
    h.push(nodo({ malla: MA.caja(0.28, 0.5, 2.3, 0.1, 4), pos: [-0.35, 0.65, 0], mat: tela() }));                                       // respaldo
    for (const z of [-1, 1]) h.push(nodo({ malla: MA.caja(0.95, 0.34, 0.24, 0.1, 4), pos: [0, 0.5, z * 1.1], mat: tela() }));            // brazos
    for (let i = -1; i <= 1; i++) h.push(nodo({ malla: MA.caja(0.66, 0.16, 0.62, 0.07, 4), pos: [0.08, 0.45 - 0.0, i * 0.66], mat: tela('#7a688a') }));   // asientos (cara superior a ~0,53)
    for (let i = -1; i <= 1; i++) h.push(nodo({ malla: MA.caja(0.22, 0.46, 0.6, 0.09, 4), pos: [-0.19, 0.78, i * 0.66], rot: [0, 0, 0.14], mat: tela('#7a688a') })); // respaldos
    for (const x of [-1, 1]) for (const z of [-1, 1]) h.push(nodo({ malla: MA.cilindro(0.04, 0.03, 0.12, 12), pos: [x * 0.38, 0.06, z * 1.0], mat: { color: '#2b2118', esp: 0.2 } }));
    h.push(nodo({ malla: MA.caja(0.2, 0.34, 0.34, 0.1, 4), pos: [-0.05, 0.72, 0.82], rot: [0.1, 0.3, 0.25], mat: tela('#d9a24a') }));          // cojin
    return nodo({ nombre: 'sofa', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  MO.lampara = (o = {}) => {
    const on = o.encendida !== false;
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.cilindro(0.16, 0.16, 0.03, 20), pos: [0, 0.015, 0], mat: { color: '#2b2118', esp: 0.4, dureza: 40 } }),
      nodo({ malla: MA.cilindro(0.015, 0.015, 1.45, 10), pos: [0, 0.74, 0], mat: { color: '#b0873a', tipo: 'brillo', esp: 0.8, dureza: 80 } }),
      nodo({ malla: MA.cilindro(0.14, 0.24, 0.3, 24, false), pos: [0, 1.55, 0], mat: { color: on ? '#ffe2a8' : '#d8c8a8', esp: 0.1, envolver: 0.7, emision: on ? 0.7 : 0, dobleCara: true } })] });
  };
})(window.VE);
