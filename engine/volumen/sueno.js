/* ============================================================================================
   SUENO Y CUERPO (3D, temas de salud / sueno). Registrado en engine/video/index.html tras envases.js.
     V.modelos.cama({ pos })                                  colchon, somier, cabecero y almohada (la superficie del colchon esta en y = 0; cabeza hacia -Z)
     V.modelos.durmiente({ t, bulto, pos, piel, pelo, camiseta, sabana })
          persona tumbada boca arriba con rasgos (usa MO.cabeza), brazos sobre el colchon y sabana que sube hasta el pecho.
          bulto 0..1: la sabana se levanta a la altura de la cadera por una erección (silueta suave, estilizada, sin anatomia).
          t = tiempo (respiracion). El eje largo del cuerpo es Z (cabeza en z = -0.78, pies en +Z).
     V.modelos.cerebro({ t, pos, rot, esc, alerta, descanso, alfa })   cerebro con circunvoluciones (dos hemisferios con giros y surcos, cerebelo con laminillas, tronco) y zonas que brillan
     V.modelos.cerebro.punto(nombre)                          'alerta' | 'descanso' (local, para etiquetas)
   Revision: dibujar un fotograma con `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------- cama */
  MO.cama = (o = {}) => {
    const madera = { color: '#5d3f2b', esp: 0.2, dureza: 30, envolver: 0.4 };
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(1.28, 0.3, 2.34, 0.09, 5), pos: [0, -0.15, 0.0], mat: { color: '#6f86a8', esp: 0.05, envolver: 0.5 } }),         // colchon (cara superior en y = 0)
      nodo({ malla: MA.caja(1.42, 0.3, 2.5, 0.04, 4), pos: [0, -0.45, 0.0], mat: madera }),                                                   // somier
      nodo({ malla: MA.caja(1.42, 1.0, 0.1, 0.04, 4), pos: [0, 0.2, -1.27], mat: madera }),                                                  // cabecero
      nodo({ malla: MA.caja(0.66, 0.15, 0.44, 0.07, 5), pos: [0, 0.075, -0.8], mat: { color: '#f4f6fa', esp: 0.05, envolver: 0.5 } }) ] });  // almohada
  };

  /* ---------------------------------------------------------------- sabana con bulto */
  const suav = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const alturaSabana = (x, z, bulto, resp) => {
    const torso = 0.155 * Math.exp(-(Math.pow(Math.abs(x) / 0.27, 3.5) + Math.pow(Math.abs(z - 0.02) / 0.54, 6)));
    let piernas = 0; for (const s of [-1, 1]) piernas = Math.max(piernas, 0.108 * Math.exp(-(Math.pow(Math.abs(x - s * 0.115) / 0.115, 3) + Math.pow(Math.abs(z - 0.78) / 0.52, 6))));
    const dz = z - 0.2, sz = dz < 0 ? 0.11 : 0.07, tienda = bulto * 0.125 * Math.exp(-(x * x) / (2 * 0.045 * 0.045) - (dz * dz) / (2 * sz * sz));
    let h = Math.max(torso * (1 + resp), piernas, 0.012) + tienda;
    h += 0.004 * Math.sin(17 * z + 6 * x) * Math.min(1, h * 9);                                        // arrugas suaves
    const lado = Math.max(0, Math.abs(x) - 0.6); return h - lado * 3.2;                                     // cae por los lados del colchon
  };

  MO.durmiente = (o = {}) => {
    const t = o.t || 0, bulto = o.bulto || 0, resp = 0.022 * Math.sin(t * 1.25), piel = o.piel || '#d9a982', pelo = o.pelo || '#2d1f16', cam = o.camiseta || '#4b6a8a';
    const matPiel = { color: piel, esp: 0.18, dureza: 22, envolver: 0.35 }, matCam = { color: cam, esp: 0.08, envolver: 0.4 };
    /* cabeza: cara hacia +Y, coronilla hacia -Z y cuello hacia los pies (rot Y -90 despues de Z +90) */
    const cabeza = nodo({ pos: [0, 0.205, -0.8], rot: [0, -PI / 2, 0], hijos: [nodo({ rot: [0, 0, PI / 2], hijos: [MO.cabeza({ piel, pelo, ropa: cam })] })] });
    const brazo = (k) => nodo({ pos: [0.34 * k, 0.065, -0.47], hijos: [
      nodo({ malla: MA.capsula(0.055, 0.048, 0.3, 14), rot: [-PI / 2, 0, 0], mat: matCam }),
      nodo({ malla: MA.capsula(0.045, 0.036, 0.3, 14), pos: [0, 0, 0.3], rot: [-PI / 2, 0, 0], mat: matPiel }),
      nodo({ malla: MA.esfera(14), esc: [0.04, 0.03, 0.05], pos: [0, 0, 0.67], mat: matPiel }) ] });
    const torso = nodo({ malla: MA.esfera(24), esc: [0.24, 0.062, 0.27], pos: [0, 0.05, -0.4], mat: matCam });                      // pecho bajo la sabana (solo asoma la camiseta)
    const sabana = nodo({ malla: MA.parametrica(56, 72, (u, v) => { const x = -0.74 + 1.48 * u, z = -0.4 + 1.54 * v; return [x, alturaSabana(x, z, bulto, resp), z]; }, { dinamica: 'sabana_' + (o.id || 0), abierta: true }),
      mat: { color: o.sabana || '#f1f3f7', esp: 0.06, dureza: 12, envolver: 0.55, dobleCara: true } });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [cabeza, torso, brazo(1), brazo(-1), sabana] });
  };

  /* ---------------------------------------------------------------- cerebro con circunvoluciones
     Hemisferios con giros y surcos (ruido en 3D con distorsion), fisura interhemisferica, surco lateral (de Silvio) y central, lobulo
     temporal colgando, cerebelo con laminillas y tronco con protuberancia. Cada hemisferio lleva su textura (surcos oscuros, giros claros,
     vasos finos) pintada una vez en un lienzo. */
  const ih = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967295; };
  const vn = (x, y, z) => { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), fx = x - X, fy = y - Y, fz = z - Z, a = fx * fx * (3 - 2 * fx), b = fy * fy * (3 - 2 * fy), c = fz * fz * (3 - 2 * fz);
    const l = (p, q, k) => p + (q - p) * k;
    return l(l(l(ih(X, Y, Z), ih(X + 1, Y, Z), a), l(ih(X, Y + 1, Z), ih(X + 1, Y + 1, Z), a), b), l(l(ih(X, Y, Z + 1), ih(X + 1, Y, Z + 1), a), l(ih(X, Y + 1, Z + 1), ih(X + 1, Y + 1, Z + 1), a), b), c); };
  const sm = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const CB = 0.13, AX = 0.29, BY = 0.40, CZ = 0.69;                                  // centro y semiejes de cada hemisferio
  /* superficie del hemisferio: devuelve posicion y 'g' (0 = fondo del surco, 1 = cresta del giro) */
  const hemi = (lado, u, v) => {
    const th = u * TAU, fi = v * PI, sx = -Math.sin(fi) * Math.cos(th), sy = Math.sin(fi) * Math.sin(th), sz = Math.cos(fi);
    let ex = sx * AX, y = sy * BY, z = sz * CZ; const y0 = y;
    if (y < 0) y *= 0.62;
    ex *= 1 - 0.2 * sm(0.12, 0.58, z) - 0.14 * sm(-0.28, -0.58, z);                      // frente y occipital mas estrechos
    const tl = Math.exp(-Math.pow((z - 0.03) / 0.21, 2)) * sm(-0.02, -0.2, y0);          // lobulo temporal
    y -= 0.1 * tl; let xl = CB + ex + 0.05 * tl;
    const nx = ex / (AX * AX), ny = y0 / (BY * BY), nz = z / (CZ * CZ), nl = Math.hypot(nx, ny, nz) || 1;
    const s0 = lado * 7.3;
    const qx = xl * 15 + s0, qy = y * 15, qz = z * 15;
    const wx = vn(qx * 0.4 + 9, qy * 0.4, qz * 0.4) * 2 - 1, wy = vn(qx * 0.4, qy * 0.4 + 4, qz * 0.4 + 7) * 2 - 1, wz = vn(qx * 0.4 + 2, qy * 0.4 + 5, qz * 0.4) * 2 - 1;
    const n1 = vn(qx + wx * 2.2, qy + wy * 2.2, qz + wz * 2.2), n2 = vn(qx * 2.1 + 3, qy * 2.1, qz * 2.1 + 5);
    const nn = 0.78 * n1 + 0.22 * n2, g = Math.pow(sm(0.0, 0.3, Math.abs(2 * nn - 1)), 0.8) * (0.55 + 0.45 * sm(0.02, 0.12, xl));   // 0 en el surco
    const gc = sm(0.0, 0.085, Math.abs(2 * nn - 1)) * (0.6 + 0.4 * sm(0.02, 0.12, xl));   // surco fino para el color
    let prof = 0.027 * (g - 1);
    const silvio = Math.exp(-Math.pow((y0 + 0.07) / 0.034, 2)) * sm(0.1, 0.28, xl) * sm(-0.3, -0.02, z) * sm(0.55, 0.22, z);   // surco lateral
    const central = Math.exp(-Math.pow((z - (0.08 - 0.28 * (xl - 0.12))) / 0.02, 2)) * sm(0.05, 0.25, y0) * sm(0.03, 0.12, xl);
    prof -= 0.026 * silvio + 0.018 * central;
    const sc = lado * 0.0 + 1, px = Math.max(xl + nx / nl * prof, 0.018);
    return { p: [lado * px, y + ny / nl * prof, z + nz / nl * prof], g: gc * (1 - 0.9 * Math.min(1, silvio + central)), v: n2, xl, y };
  };
  const HEMI_TX = {};
  const texHemi = (lado) => {
    if (HEMI_TX[lado]) return HEMI_TX[lado];
    const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const r = hemi(lado, i / (W - 1), j / (H - 1)), g = r.g, k = 4 * (j * W + i);
      const tono = 0.5 + 0.5 * vn(r.xl * 4 + lado, r.y * 4, 3), vas = Math.abs(2 * vn(r.xl * 17 + 5, r.y * 17, lado * 3 + 2) - 1) < 0.045 ? 1 : 0;
      let R = 104 + g * (116 + 10 * tono), G = 58 + g * (104 + 8 * tono), B = 70 + g * (100 + 4 * tono);                // surco granate -> giro rosado
      if (vas && g > 0.35) { R = R * 0.72 + 150 * 0.28; G *= 0.74; B *= 0.78; }                                         // vasos finos
      im.data[k] = R; im.data[k + 1] = G; im.data[k + 2] = B; im.data[k + 3] = 255;
    }
    x.putImageData(im, 0, 0); HEMI_TX[lado] = c; return c;
  };
  const mallaHemi = (lado) => MA.cache('sueno|hemi3b|' + lado, () => {                  // el hemisferio derecho sale con las caras al reves: se invierte el orden de los triangulos y las normales
    const m = MA.parametrica(260, 170, (u, v) => hemi(lado, u, v).p);
    if (lado > 0) { const ix = m.idx; for (let i = 0; i < ix.length; i += 3) { const q = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = q; } for (let i = 0; i < m.nor.length; i++) m.nor[i] = -m.nor[i]; }
    return m; });
  /* cerebelo: dos lobulos con laminillas finas horizontales */
  const cereb = (u, v) => { const th = u * TAU, fi = v * PI, sx = Math.sin(fi) * Math.cos(th), sy = Math.cos(fi), sz = Math.sin(fi) * Math.sin(th);
    const ax = 0.33, by = 0.16, cz = 0.2, yy = sy * by, fol = 0.5 + 0.5 * Math.sin(yy * 150 + 2.2 * vn(sx * 3, sy * 3, sz * 3));
    const d = 0.008 * (fol - 1) - 0.01 * Math.exp(-Math.pow(sx / 0.07, 2)) * sm(-0.2, 0.6, sz);                               // laminillas y hendidura central
    const r = 1 + d / 0.2; return { p: [sx * ax * r, yy * r, sz * cz * r], f: fol }; };
  let TEX_CB = null;
  const texCereb = () => { if (TEX_CB) return TEX_CB; const W = 256, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const f = cereb(i / (W - 1), j / (H - 1)).f, k = 4 * (j * W + i); im.data[k] = 120 + f * 90; im.data[k + 1] = 66 + f * 70; im.data[k + 2] = 74 + f * 66; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); TEX_CB = c; return c; };
  MO.cerebro = (o = {}) => {
    const t = o.t || 0, al = o.alerta == null ? 0.5 : o.alerta, de = o.descanso == null ? 0.5 : o.descanso;
    const mH = (lado) => ({ color: '#ffffff', mapa: texHemi(lado), esp: 0.45, dureza: 34, envolver: 0.5, borde: 0.3 });
    const brillo = (c, a, pos, r) => nodo({ malla: MA.esfera(14), esc: r, pos, mat: { color: c, tipo: 'plano', alfa: a } });
    const tronco = MA.tubo([[0, -0.22, 0.1], [0, -0.32, 0.07], [0, -0.45, 0.0], [0, -0.6, -0.08], [0, -0.74, -0.14]], (k) => 0.085 + 0.045 * Math.exp(-Math.pow((k - 0.35) / 0.17, 2)) - 0.03 * k, 22);
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: mallaHemi(1), mat: mH(1) }), nodo({ malla: mallaHemi(-1), mat: mH(-1) }),
      nodo({ malla: MA.parametrica(90, 70, (u, v) => cereb(u, v).p, { clave: 'sueno|cereb3' }), pos: [0, -0.34, -0.42], mat: { color: '#ffffff', mapa: texCereb(), esp: 0.3, dureza: 26, envolver: 0.45 } }),   // cerebelo
      nodo({ malla: tronco, mat: { color: '#d2a2a2', esp: 0.35, dureza: 26, envolver: 0.45 } }), nodo({ malla: MA.esfera(14), esc: 0.055, pos: [0, -0.74, -0.14], mat: { color: '#d2a2a2', esp: 0.3, envolver: 0.45 } }),                                                                                                      // tronco del encefalo
      brillo('#ffb830', al * (0.55 + 0.25 * Math.sin(t * 4)), [0, 0.08, 0.62], 0.14 + 0.03 * al), brillo('#ffb830', al * 0.35, [0, 0.08, 0.62], 0.24 + 0.05 * al),   // zona de alerta (delante)
      brillo('#5be0ff', de * (0.55 + 0.25 * Math.sin(t * 2.2)), [0, -0.3, -0.04], 0.12 + 0.03 * de), brillo('#5be0ff', de * 0.35, [0, -0.3, -0.04], 0.22 + 0.05 * de) ] });   // zona de descanso (abajo)
  };
  MO.cerebro.punto = (n) => n === 'alerta' ? [0, 0.08, 0.62] : [0, -0.3, -0.04];
})();
