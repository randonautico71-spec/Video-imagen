/* ============================================================================================
   ENVASES DE BEBIDA (3D): botella de cristal, lata, botella de plastico (PET) y vaso. Registrado en engine/video/index.html tras oido.js.
     V.modelos.envase({ tipo, pos, rot, esc, nivel, corte, alfa, liquido, tapa })
        tipo   'cristal' | 'lata' | 'pet' | 'vaso'          (tamano real en metros: 0.21 / 0.12 / 0.25 / 0.11 de alto; usar esc 6-14 en planos cercanos)
        nivel  0..1 fraccion de bebida (def. 0.85)           liquido  color de la bebida (def. cola oscura)    tapa  false = sin tapa/anilla
        corte  { a0, a1 } angulos (rad) del sector que se QUITA para ver la pared por dentro (con capa interior en lata: el recubrimiento)
     V.modelos.envase.alto(tipo)            altura real
     V.modelos.envase.punto(tipo, y01, lado) punto local de la pared (y01 0..1 de la altura, lado = angulo en rad) para anclar etiquetas / particulas
   Revision: `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;

  /* perfiles [r, y] de ARRIBA a ABAJO (metros) */
  const PERFIL = {
    cristal: [[0.0125, 0.215], [0.0155, 0.213], [0.0155, 0.205], [0.0125, 0.200], [0.0125, 0.185], [0.0135, 0.168], [0.0185, 0.145], [0.0285, 0.118], [0.0315, 0.10], [0.0315, 0.012], [0.029, 0.004], [0.02, 0.0]],
    lata: [[0.0245, 0.1225], [0.0262, 0.1218], [0.0262, 0.1168], [0.0325, 0.1128], [0.033, 0.1085], [0.033, 0.0155], [0.0325, 0.012], [0.0262, 0.0055], [0.0225, 0.0]],
    pet: [[0.0105, 0.248], [0.0105, 0.234], [0.0125, 0.228], [0.0205, 0.205], [0.0305, 0.18], [0.0325, 0.165], [0.0325, 0.03], [0.0305, 0.014], [0.0235, 0.005], [0.0125, 0.0]],
    vaso: [[0.037, 0.11], [0.0355, 0.108], [0.0255, 0.004], [0.0225, 0.0]]
  };
  MO.envase = MO.envase || {};
  const alto = tipo => PERFIL[tipo][0][1];

  /* r e y interpolados a lo largo del perfil (v 0..1, de arriba a abajo) */
  const interp = (p, v) => { const f = v * (p.length - 1), i = Math.min(p.length - 2, Math.floor(f)), k = f - i; return [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k]; };
  /* recorta el perfil por debajo de y = nivel, desplazandolo hacia dentro (grosor) y cerrando la superficie con r = 0 */
  const recortar = (p, nivel, grosor) => { const r = [[0, nivel]]; let prev = null;
    for (const [rr, yy] of p) { if (yy <= nivel) { if (prev && !r.length - 1) {} r.push([Math.max(0.002, rr - grosor), yy]); } else prev = [rr, yy]; }
    if (r.length > 1 && prev && p.find(q => q[1] <= nivel)) { const a = prev, b = p.find(q => q[1] <= nivel), k = (a[1] - nivel) / (a[1] - b[1]); r.splice(1, 0, [Math.max(0.002, a[0] + (b[0] - a[0]) * k - grosor), nivel]); }
    r.push([0, 0.002 + 0.0005]); return r; };
  /* pared como superficie abierta (sector u0..u1 en vueltas), con desplazamiento radial dr: permite ver el corte */
  const pared = (p, a0, a1, dr, clave) => MA.parametrica(40, 40, (u, v) => { const [r, y] = interp(p, v), th = a0 + (a1 - a0) * u; return [(r + dr) * Math.cos(th), y, -(r + dr) * Math.sin(th)]; }, { clave, abierta: true });

  MO.envase = Object.assign((o = {}) => {
    const tipo = o.tipo || 'cristal', p = PERFIL[tipo], H = p[0][1], nivel = (o.nivel == null ? 0.85 : o.nivel) * H * (tipo === 'lata' ? 0.98 : 0.93) + 0.004;
    const col = o.liquido || '#3a1a0a', rx = !!o.rayosx, corte = o.corte, hijos = [];
    const vidrio = (c, a) => rx ? { tipo: 'rayosx', color: '#9fd8ff', alfa: 0.32 } : { color: c, tipo: 'brillo', esp: 0.9, dureza: 90, alfa: a };
    const bebida = nodo({ malla: MA.torno(recortar(p, Math.min(nivel, H - 0.004), tipo === 'lata' ? 0.0012 : 0.0028), 40, 'env|liq|' + tipo + '|' + nivel.toFixed(3)), mat: rx ? { tipo: 'rayosx', color: '#ffb066', alfa: 0.28 } : { color: col, esp: 0.5, dureza: 40, envolver: 0.3, alfa: 0.92 } });
    const tapa = o.tapa !== false;
    if (tipo === 'lata') {
      const sec = corte ? [corte.a1, corte.a0 + TAU] : [0, TAU];
      const cuerpoMat = rx ? { tipo: 'rayosx', color: '#cfd6e0', alfa: 0.55 } : { color: '#b3191f', tipo: 'brillo', esp: 0.8, dureza: 70 };
      const plateado = rx ? { tipo: 'rayosx', color: '#cfd6e0', alfa: 0.55 } : { color: '#cdd2da', tipo: 'brillo', esp: 1, dureza: 120 };
      if (!corte) hijos.push(nodo({ malla: MA.torno(p, 48, 'env|lata'), mat: cuerpoMat }));
      else {
        const k = corte.a0.toFixed(2) + '|' + corte.a1.toFixed(2), plata = { color: '#cdd2da', tipo: 'brillo', esp: 1, dureza: 120, dobleCara: true }, oro = { color: '#e9b94a', esp: 0.3, dobleCara: true };
        const cara = (a, d0, d1, mat, c) => nodo({ malla: MA.parametrica(2, 40, (u, v) => { const [r, y] = interp(p, v), rr = r + d0 + (d1 - d0) * u; return [rr * Math.cos(a), y, -rr * Math.sin(a)]; }, { clave: 'env|lata|cara|' + c + '|' + a.toFixed(2), abierta: true }), mat });
        hijos.push(nodo({ malla: pared(p, sec[0], sec[1], 0.0012, 'env|lata|pared|' + k), mat: Object.assign({ dobleCara: true }, cuerpoMat) }));      // aluminio (rojo por fuera)
        hijos.push(nodo({ malla: pared(p, sec[0], sec[1], -0.0012, 'env|lata|metal|' + k), mat: plata }));                                                 // aluminio (plata por dentro)
        hijos.push(nodo({ malla: pared(p, sec[0], sec[1], -0.0024, 'env|lata|liner|' + k), mat: rx ? { tipo: 'rayosx', color: '#ffd06a', alfa: 0.7, dobleCara: true } : oro }));   // recubrimiento polimerico
        for (const a of [sec[0], sec[1]]) { hijos.push(cara(a, -0.0012, 0.0012, plata, 'm')); hijos.push(cara(a, -0.0024, -0.0012, oro, 'o')); }                // caras del corte (grosor exagerado para verse)
        hijos.push(nodo({ malla: MA.esfera(24), esc: [0.0235, 0.0007, 0.0235], pos: [0, 0.0045, 0], mat: oro }));
      }
      hijos.push(nodo({ malla: MA.torno([[0, 0.1228], [0.0242, 0.1228], [0.0245, 0.1222]], 40, 'env|lata|tapa'), mat: plateado }));
      if (tapa) hijos.push(nodo({ malla: MA.torno([[0.0105, 0.1252], [0.0145, 0.1252], [0.0155, 0.1235], [0.0105, 0.1228]], 32, 'env|lata|anilla'), pos: [0.004, 0, 0], mat: plateado }));
      if (!corte) hijos.push(bebida);
    } else {
      const c = tipo === 'cristal' ? '#7fbf9b' : (tipo === 'pet' ? '#9fd0f2' : '#cfe8f2'), a = tipo === 'cristal' ? 0.42 : (tipo === 'pet' ? 0.3 : 0.28);
      const mat = vidrio(c, a);
      if (!corte) hijos.push(nodo({ malla: MA.torno(p, 48, 'env|' + tipo), mat }));
      else hijos.push(nodo({ malla: pared(p, corte.a1, corte.a0 + TAU, 0, 'env|' + tipo + '|pared|' + corte.a0.toFixed(2) + '|' + corte.a1.toFixed(2)), mat: Object.assign({ dobleCara: true }, mat) }));
      hijos.push(bebida);
      if (tipo === 'cristal' && tapa) hijos.push(nodo({ malla: MA.torno([[0.0, 0.2215], [0.0145, 0.2215], [0.0175, 0.2185], [0.0178, 0.2125], [0.0165, 0.2135], [0.0, 0.2135]], 36, 'env|chapa'), mat: rx ? { tipo: 'rayosx', color: '#cfd6e0', alfa: 0.7 } : { color: '#c8202c', tipo: 'brillo', esp: 0.6, dureza: 60 } }));
      if (tipo === 'pet' && tapa) hijos.push(nodo({ malla: MA.torno([[0.0, 0.2555], [0.0125, 0.2555], [0.0135, 0.2535], [0.0135, 0.2335], [0.0, 0.2335]], 32, 'env|tapon'), mat: rx ? { tipo: 'rayosx', color: '#cfd6e0', alfa: 0.7 } : { color: '#c8202c', esp: 0.5, dureza: 50 } }));
      if (tipo === 'pet' && !rx) hijos.push(nodo({ malla: MA.torno([[0.0328, 0.134], [0.0328, 0.056], [0.0316, 0.056], [0.0316, 0.134]], 40, 'env|etiqueta'), mat: rx ? { tipo: 'rayosx', color: '#ff6a5a', alfa: 0.4 } : { color: '#c8202c', esp: 0.2, dureza: 20 } }));   // etiqueta de papel
    }
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos });
  }, MO.envase);
  MO.envase.alto = alto;
  MO.envase.punto = (tipo, y01, lado = 0) => { const p = PERFIL[tipo], [r, y] = interp(p, 1 - y01); return [(r) * Math.cos(lado), y, -(r) * Math.sin(lado)]; };
})();
