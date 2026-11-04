/* ============================================================================================
   SUENO Y CUERPO (3D, temas de salud / sueno). Registrado en engine/video/index.html tras envases.js.
     V.modelos.cama({ pos })                                  colchon, somier, cabecero y almohada (la superficie del colchon esta en y = 0; cabeza hacia -Z)
     V.modelos.durmiente({ t, bulto, pos, piel, pelo, camiseta, sabana })
          persona tumbada boca arriba con rasgos (usa MO.cabeza), brazos sobre el colchon y sabana que sube hasta el pecho.
          bulto 0..1: la sabana se levanta a la altura de la cadera por una erección (silueta suave, estilizada, sin anatomia).
          t = tiempo (respiracion). El eje largo del cuerpo es Z (cabeza en z = -0.78, pies en +Z).
     V.modelos.cerebro({ t, pos, rot, esc, alerta, descanso, alfa })   cerebro estilizado (dos hemisferios, cerebelo y tronco) con zonas que brillan
     V.modelos.cerebro.punto(nombre)                          'alerta' | 'descanso' (local, para etiquetas)
   Revision: dibujar un fotograma con `vid.py qa <tema> --stills t`. */
(function () {
  const V = VE.vol, MO = V.modelos, MA = V.malla, nodo = V.nodo, PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------- cama */
  MO.cama = (o = {}) => {
    const madera = { color: '#5d3f2b', esp: 0.2, dureza: 30, envolver: 0.4 };
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      nodo({ malla: MA.caja(1.28, 0.3, 2.34, 0.09, 5), pos: [0, -0.15, 0.0], mat: { color: '#cdd8e6', esp: 0.05, envolver: 0.5 } }),         // colchon (cara superior en y = 0)
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
    const torso = nodo({ malla: MA.esfera(24), esc: [0.25, 0.1, 0.34], pos: [0, 0.095, -0.16], mat: matCam });                      // pecho bajo la sabana (solo asoma la camiseta)
    const sabana = nodo({ malla: MA.parametrica(56, 72, (u, v) => { const x = -0.74 + 1.48 * u, z = -0.4 + 1.54 * v; return [x, alturaSabana(x, z, bulto, resp), z]; }, { dinamica: 'sabana_' + (o.id || 0), abierta: true }),
      mat: { color: o.sabana || '#e7edf6', esp: 0.06, dureza: 12, envolver: 0.55, dobleCara: true } });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, hijos: [cabeza, torso, brazo(1), brazo(-1), sabana] });
  };

  /* ---------------------------------------------------------------- cerebro estilizado */
  const cerebroSup = (lado) => MA.parametrica(48, 36, (u, v) => {
    const th = u * TAU, fi = v * PI, r = 1 + 0.055 * Math.sin(7 * th + 2 * lado) * Math.sin(fi * 6) + 0.035 * Math.sin(11 * th) * Math.sin(fi * 9 + 1);
    const x = Math.sin(fi) * Math.cos(th), y = Math.cos(fi), z = Math.sin(fi) * Math.sin(th);
    return [lado * 0.42 + x * 0.52 * r * (lado * x > 0 ? 0.92 : 1), y * 0.52 * r * 0.88, z * 0.42 * r * 1.15]; }, { clave: 'sueno|cerebro|' + lado });
  MO.cerebro = (o = {}) => {
    const t = o.t || 0, al = o.alerta == null ? 0.5 : o.alerta, de = o.descanso == null ? 0.5 : o.descanso, rosa = { color: '#e8a3ad', esp: 0.4, dureza: 30, envolver: 0.45 };
    const brillo = (c, a, pos, r) => nodo({ malla: MA.esfera(14), esc: r, pos, mat: { color: c, tipo: 'plano', alfa: a } });
    return nodo({ pos: o.pos, rot: o.rot, esc: o.esc, alfa: o.alfa, hijos: [
      nodo({ malla: cerebroSup(1), mat: rosa }), nodo({ malla: cerebroSup(-1), mat: rosa }),
      nodo({ malla: MA.esfera(20), esc: [0.3, 0.17, 0.24], pos: [0, -0.4, -0.32], mat: { color: '#c98590', esp: 0.3, envolver: 0.45 } }),                            // cerebelo
      nodo({ malla: MA.capsula(0.09, 0.07, 0.34, 14), pos: [0, -0.34, -0.1], rot: [0.25, 0, 0], mat: { color: '#d99aa4', esp: 0.3, envolver: 0.45 } }),             // tronco
      brillo('#ffb830', al * (0.55 + 0.25 * Math.sin(t * 4)), [0, 0.08, 0.62], 0.14 + 0.03 * al), brillo('#ffb830', al * 0.35, [0, 0.08, 0.62], 0.24 + 0.05 * al),   // zona de alerta (delante)
      brillo('#5be0ff', de * (0.55 + 0.25 * Math.sin(t * 2.2)), [0, -0.3, -0.04], 0.12 + 0.03 * de), brillo('#5be0ff', de * 0.35, [0, -0.3, -0.04], 0.22 + 0.05 * de) ] });   // zona de descanso (abajo)
  };
  MO.cerebro.punto = (n) => n === 'alerta' ? [0, 0.08, 0.62] : [0, -0.3, -0.04];
})();
