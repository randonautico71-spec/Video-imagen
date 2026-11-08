/* VOLUMEN — CABALLERO MEDIEVAL (unidades: metros; sobre el maniqui articulado, mira hacia +X).
     V.modelos.caballero({ era, pose, escudo, espada, semilla, emblema, pos, rot, esc, apoyo, suelo, piesX })
         era: 'mallas' (c. 1200: cofia y camisote de malla, sobrevesta con cruz, yelmo con nasal)
              'placas' (c. 1420: arnes completo de placas, bacinete con visera)
         escudo: true/false (triangular pintado, en el brazo izquierdo; por defecto true en 'mallas')
         espada: 'armas' (una mano, hoja ~75 cm) | 'larga' (dos manos, hoja ~95 cm) | null    (en la mano derecha)
     V.modelos.escudo_triangular({ campo, figura, alto, ancho })   escudo suelto (frente hacia +Z, arriba +Y, punta abajo)
     V.modelos.espada({ tipo })  espada suelta (puno en el origen, hoja hacia +Y): 'armas' | 'larga'
   Fuentes de las medidas: espada de armas 69-81 cm de hoja (Oakeshott 1960); espada larga 80-110 cm (Oakeshott 1980/1994);
   armadura completa hacia 1420 y escudo pequeno relegado a los torneos (The Met). Ver proyectos/escudos_caballeros/datos.md. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI;

  // ---------------------------------------------------------------- texturas
  const texMalla = V.textura('cab|malla', 128, 128, (x, W, H) => {
    x.fillStyle = '#4a5057'; x.fillRect(0, 0, W, H); const n = 24, s = W / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const cx = (i + (j % 2 ? 0.5 : 0)) * s, cy = j * s * 0.62 + s * 0.3;
      x.strokeStyle = (i + j) % 3 ? '#a7aeb5' : '#c9cfd5'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, s * 0.42, 0, 7); x.stroke();
      x.strokeStyle = 'rgba(20,22,26,0.7)'; x.lineWidth = 1; x.beginPath(); x.arc(cx + 0.6, cy + 0.8, s * 0.42, 0.4, 2.4); x.stroke(); }
  });
  texMalla.repetirV = true;
  const texMadera = V.textura('cab|madera', 128, 128, (x, W, H) => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, W, H); const r = VE.rng('mad');
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '30,18,8' : '140,100,60'},${0.1 + r() * 0.2})`; x.fillRect(r() * W, 0, 1 + r() * 2, H); } });
  const texCuero = V.textura('cab|cuero', 64, 64, (x, W, H) => { x.fillStyle = '#4a3020'; x.fillRect(0, 0, W, H); const r = VE.rng('cu'); for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.15})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1); } });

  // sobrevesta con cruz: u recorre la vuelta (se pinta la cruz delante y detras)
  const texSobre = (c, cruz) => V.textura('cab|sobre|' + c + cruz, 512, 256, (x, W, H) => {
    x.fillStyle = c; x.fillRect(0, 0, W, H); const r = VE.rng('sob');
    for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.06})`; x.fillRect(r() * W, r() * H, 1 + r() * 3, 1); }
    x.fillStyle = cruz; for (const cu of [0.25, 0.75]) { const X = cu * W; x.fillRect(X - W * 0.017, H * 0.1, W * 0.034, H * 0.66); x.fillRect(X - W * 0.07, H * 0.2, W * 0.14, H * 0.09); }
  });

  // ---------------------------------------------------------------- escudo triangular
  const texEscudo = (campo, figura) => V.textura('cab|escudo|' + campo + figura, 256, 384, (x, W, H) => {
    x.fillStyle = campo; x.fillRect(0, 0, W, H); const r = VE.rng('esc');
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`; x.fillRect(r() * W, r() * H, 20 + r() * 80, 1 + r() * 3); }
    x.fillStyle = figura;                                                        // cruz ancha + borde
    x.fillRect(W / 2 - 24, 14, 48, H * 0.72); x.fillRect(W * 0.14, H * 0.2, W * 0.72, 46);
    x.strokeStyle = figura; x.lineWidth = 8; x.strokeRect(10, 10, W - 20, H - 20);
    x.strokeStyle = 'rgba(40,24,10,0.95)'; x.lineWidth = 18; x.strokeRect(0, 0, W, H);       // canto de madera
  });
  const mallaEscudo = (alto, ancho) => MA.parametrica(24, 28, (u, v) => {
    const w = ancho / 2 * Math.pow(1 - v, 0.6) * (v < 0.05 ? 0.94 + 0.06 * Math.sqrt(v / 0.05) : 1), a = 2 * u - 1;
    return [a * w, -v * alto, 0.085 * (1 - a * a) * (1 - 0.45 * v) * (ancho / 0.46)];
  }, { clave: 'cab|escudo|' + alto + '|' + ancho });
  MO.escudo_triangular = function (o = {}) {
    const alto = o.alto || 0.82, ancho = o.ancho || 0.46, campo = o.campo || '#9b2b22', figura = o.figura || '#e8d9a0';
    return V.nodo({ nombre: 'escudo', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [
      V.nodo({ malla: mallaEscudo(alto, ancho), mat: { color: '#ffffff', mapa: texEscudo(campo, figura), esp: 0.25, dureza: 30, envolver: 0.2, dobleCara: true } })] });
  };

  // ---------------------------------------------------------------- espadas (puno en el origen, hoja hacia +Y)
  const acero = { tipo: 'brillo', color: '#c7cdd3', esp: 1.1, dureza: 120 }, placaM = { tipo: 'brillo', color: '#7f8a96', esp: 1.05, dureza: 70, envolver: 0.3 }, hierro = { tipo: 'brillo', color: '#8d9399', esp: 0.8, dureza: 70 };
  MO.espada = function (o = {}) {
    const larga = o.tipo === 'larga', L = larga ? 0.95 : 0.76, w0 = larga ? 0.021 : 0.027, t0 = 0.0042, guarda = larga ? 0.27 : 0.2, puno = larga ? 0.25 : 0.1;
    const secs = []; for (let i = 0; i <= 10; i++) { const a = i / 10, y = 0.02 + a * L, w = i === 10 ? 0.0012 : w0 * (1 - 0.62 * Math.pow(a, larga ? 1.3 : 1.7)), t = t0 * (1 - 0.5 * a);
      secs.push([[-w, y, 0], [0, y, t], [w, y, 0], [0, y, -t]]); }
    const hoja = MA.loft(secs, 'cab|hoja|' + (larga ? 'l' : 'a'), { tapas: true });
    const hijos = [
      V.nodo({ malla: hoja, mat: acero }),
      V.nodo({ malla: MA.caja(0.008, L * 0.62, 0.0022, 0.001), pos: [0, 0.03 + L * 0.31, 0.0045], mat: { tipo: 'brillo', color: '#7d858d', esp: 0.5 } }),
      V.nodo({ malla: MA.caja(0.008, L * 0.62, 0.0022, 0.001), pos: [0, 0.03 + L * 0.31, -0.0045], mat: { tipo: 'brillo', color: '#7d858d', esp: 0.5 } }),
      V.nodo({ malla: MA.caja(guarda, 0.024, 0.028, 0.008), pos: [0, 0.006, 0], mat: hierro }),
      V.nodo({ malla: MA.esfera(10), esc: [0.017, 0.017, 0.034], pos: [guarda / 2, 0.006, 0], mat: hierro }), V.nodo({ malla: MA.esfera(10), esc: [0.017, 0.017, 0.034], pos: [-guarda / 2, 0.006, 0], mat: hierro }),
      V.nodo({ malla: MA.cilindro(0.0155, 0.0155, puno, 14), pos: [0, -puno / 2 - 0.004, 0], mat: { color: '#ffffff', mapa: texCuero, esp: 0.1 } }),
      V.nodo({ malla: MA.esfera(14), esc: larga ? [0.034, 0.02, 0.034] : [0.028, 0.026, 0.028], pos: [0, -puno - 0.016, 0], mat: hierro })];
    return V.nodo({ nombre: 'espada_' + (o.tipo || 'armas'), pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };

  // ---------------------------------------------------------------- caballero
  const mallaCil = (r1, r2, h, pos, rot) => V.nodo({ malla: MA.cilindro(r1, r2, h, 20), pos, rot, mat: { color: '#ffffff', mapa: texMalla, repetir: [4, 6], esp: 0.55, dureza: 40, envolver: 0.25 } });
  const placa = (r1, r2, h, pos, rot) => V.nodo({ malla: MA.cilindro(r1, r2, h, 22), pos, rot, mat: placaM });
  const bola = (r, pos, esc) => V.nodo({ malla: MA.esfera(18), esc: esc || r, pos, mat: placaM });
  const oro = { tipo: 'brillo', color: '#c9a24a', esp: 0.9, dureza: 60 };
  MO.caballero = function (o = {}) {
    const era = o.era || 'mallas', M = V.maniquiMedidas, placas = era === 'placas', r = VE.rng(o.semilla || 'cab');
    const sobre = o.sobrevesta || '#e9e4d4', cruz = o.cruz || '#a8221a', piel = '#dcb090';
    const tieneEscudo = o.escudo == null ? !placas : o.escudo, espada = o.espada === undefined ? (placas ? 'larga' : 'armas') : o.espada;
    const equipo = { cuello: [], maniqui: [], tronco: [], hombro_d: [], hombro_i: [], codo_d: [], codo_i: [], cadera_d: [], cadera_i: [], rodilla_d: [], rodilla_i: [], tobillo_d: [], tobillo_i: [] };
    if (!placas) {
      // ---- c. 1200: cofia de malla, yelmo con nasal, camisote, sobrevesta con cruz
      const cab = [0.015, M.cuello + 0.14, 0];
      equipo.cuello.push(V.nodo({ pos: [0.015, M.cuello + 0.11, 0], hijos: [
        V.nodo({ malla: MA.esfera(24), esc: [0.103, 0.132, 0.097], mat: { color: '#ffffff', mapa: texMalla, repetir: [5, 4], esp: 0.5, dureza: 40, envolver: 0.3 } }),
        V.nodo({ malla: MA.cilindro(0.0, 0.108, 0.15, 24), pos: [0, 0.075, 0], mat: Object.assign({ dobleCara: true }, hierro) }),
        V.nodo({ malla: MA.toro(1, 0.07, 32, 8), esc: [0.108, 0.12, 0.102], pos: [0, 0.01, 0], mat: hierro }),
        V.nodo({ malla: MA.caja(0.016, 0.11, 0.022, 0.005), pos: [0.108, -0.02, 0], mat: hierro }),
        V.nodo({ malla: MA.esfera(10), esc: [0.012, 0.012, 0.012], pos: [0.108, 0.04, 0], mat: hierro })] }));
      equipo.maniqui.push(V.nodo({ malla: MA.torno([[0, 0.5], [0.11, 0.49], [0.185, 0.43], [0.205, 0.33], [0.185, 0.13], [0.175, 0.02], [0.2, -0.15], [0.265, -0.42], [0.29, -0.6], [0.0, -0.6]], 36, 'cab|sobre'), esc: [0.78, 1, 1.0], mat: { color: '#ffffff', mapa: texSobre(sobre, cruz), esp: 0.05, envolver: 0.35 } }),
        V.nodo({ malla: MA.toro(1, 0.2, 32, 8), esc: [0.17, 0.13, 0.19], pos: [0, 0.09, 0], mat: { color: '#ffffff', mapa: texCuero, esp: 0.1 } }));
      equipo.hombro_d.push(mallaCil(0.054, 0.045, 0.29, [0, -0.145, 0])); equipo.hombro_i.push(mallaCil(0.054, 0.045, 0.29, [0, -0.145, 0]));
      equipo.codo_d.push(mallaCil(0.044, 0.036, 0.27, [0, -0.135, 0])); equipo.codo_i.push(mallaCil(0.044, 0.036, 0.27, [0, -0.135, 0]));
      equipo.cadera_d.push(mallaCil(0.078, 0.059, 0.43, [0, -0.215, 0])); equipo.cadera_i.push(mallaCil(0.078, 0.059, 0.43, [0, -0.215, 0]));
      equipo.rodilla_d.push(mallaCil(0.059, 0.043, 0.42, [0, -0.21, 0])); equipo.rodilla_i.push(mallaCil(0.059, 0.043, 0.42, [0, -0.21, 0]));
    } else {
      // ---- c. 1420: arnes completo de placas
      const bas = MA.torno([[0, 0.155], [0.045, 0.15], [0.085, 0.125], [0.105, 0.075], [0.112, 0.005], [0.108, -0.045], [0.1, -0.085], [0.0, -0.085]], 28, 'cab|bacinete');
      equipo.cuello.push(V.nodo({ pos: [0.015, M.cuello + 0.115, 0], hijos: [
        V.nodo({ malla: bas, esc: [1.0, 1.0, 0.94], mat: Object.assign({ dobleCara: true }, placaM) }),
        V.nodo({ malla: MA.esfera(24), esc: [0.072, 0.104, 0.093], pos: [0.042, -0.012, 0], mat: placaM }),
        V.nodo({ malla: MA.caja(0.014, 0.014, 0.112, 0.004), pos: [0.108, 0.026, 0], mat: { tipo: 'plano', color: '#0b0d10' } }),
        V.nodo({ malla: MA.caja(0.016, 0.1, 0.012, 0.004), pos: [0.112, -0.018, 0], mat: { tipo: 'brillo', color: '#c9d0d8', esp: 1.1, dureza: 100 } }),
        V.nodo({ malla: MA.caja(0.012, 0.008, 0.012, 0.002), pos: [0.108, -0.034, 0.03], mat: { tipo: 'plano', color: '#0b0d10' } }), V.nodo({ malla: MA.caja(0.012, 0.008, 0.012, 0.002), pos: [0.108, -0.034, -0.03], mat: { tipo: 'plano', color: '#0b0d10' } }),
        V.nodo({ malla: MA.caja(0.012, 0.008, 0.012, 0.002), pos: [0.104, -0.056, 0.03], mat: { tipo: 'plano', color: '#0b0d10' } }), V.nodo({ malla: MA.caja(0.012, 0.008, 0.012, 0.002), pos: [0.104, -0.056, -0.03], mat: { tipo: 'plano', color: '#0b0d10' } }),
        V.nodo({ malla: MA.toro(1, 0.05, 32, 8), esc: [0.112, 0.12, 0.105], pos: [0, -0.07, 0], mat: placaM }),
        V.nodo({ malla: MA.cilindro(0.1, 0.12, 0.08, 24), pos: [0, -0.13, 0], mat: placaM }),
        V.nodo({ malla: MA.cilindro(0.0, 0.022, 0.2, 14), pos: [-0.075, 0.17, 0], rot: [0, 0, 0.55], mat: { color: cruz, esp: 0.05, envolver: 0.4 } }),
        V.nodo({ malla: MA.esfera(12), esc: [0.02, 0.02, 0.02], pos: [-0.02, 0.15, 0], mat: oro })] }));
      equipo.tronco.push(V.nodo({ malla: MA.esfera(28), esc: [0.135, 0.205, 0.192], pos: [0.012, 0.325, 0], mat: placaM }),
        V.nodo({ malla: MA.caja(0.012, 0.3, 0.03, 0.004), pos: [0.138, 0.32, 0], rot: [0, 0, -0.06], mat: { tipo: 'brillo', color: '#e1e6ea', esp: 1.2, dureza: 140 } }),
        V.nodo({ malla: MA.cilindro(0.15, 0.17, 0.12, 26), esc: [0.82, 1, 1.0], pos: [0, 0.07, 0], mat: placaM }));
      for (let i = 0; i < 3; i++) equipo.maniqui.push(V.nodo({ malla: MA.cilindro(0.15 + i * 0.018, 0.18 + i * 0.02, 0.075, 26), esc: [0.8, 1, 1.12], pos: [0, -0.015 - i * 0.06, 0], mat: placaM }));
      equipo.maniqui.push(V.nodo({ malla: MA.toro(1, 0.2, 32, 8), esc: [0.155, 0.13, 0.19], pos: [0, 0.05, 0], mat: { color: cruz, esp: 0.1, envolver: 0.3 } }));
            equipo.cuello.push(mallaCil(0.1, 0.125, 0.07, [0.015, -0.16, 0]));
      equipo.maniqui.push(V.nodo({ malla: MA.cilindro(0.2, 0.15, 0.22, 26), esc: [0.8, 1, 1.12], pos: [0, 0.12, 0], mat: placaM }), V.nodo({ malla: MA.toro(1, 0.012, 32, 6), esc: [0.17, 0.17, 0.2], pos: [0, 0.0, 0], rot: [PI / 2, 0, 0], mat: oro }));
      for (const l of ['d', 'i']) {
        equipo['hombro_' + l].push(bola(0.09, [0, 0.0, 0], [0.1, 0.08, 0.105]), V.nodo({ malla: MA.esfera(18), esc: [0.1, 0.05, 0.105], pos: [0.0, -0.06, 0], mat: placaM }), V.nodo({ malla: MA.esfera(18), esc: [0.092, 0.04, 0.096], pos: [0.0, -0.1, 0], mat: placaM }), placa(0.058, 0.052, 0.29, [0, -0.17, 0]));
        equipo['codo_' + l].push(bola(0.05, [-0.014, 0, 0], [0.056, 0.052, 0.068]), V.nodo({ malla: MA.cilindro(0.01, 0.045, 0.06, 14), pos: [-0.05, 0, 0], rot: [0, 0, PI / 2], mat: oro }), placa(0.053, 0.042, 0.23, [0, -0.15, 0]),
          V.nodo({ malla: MA.capsula(0.046, 0.038, 0.1, 16), pos: [0, -M.antebrazo - 0.025, 0], esc: [1.0, 1, 1.2], mat: placaM }),
          V.nodo({ malla: MA.caja(0.03, 0.05, 0.075, 0.008), pos: [0.005, -M.antebrazo - 0.105, 0], mat: placaM }));
        equipo['cadera_' + l].push(placa(0.097, 0.07, 0.4, [0, -0.215, 0]));
        equipo['rodilla_' + l].push(bola(0.065, [0.016, 0, 0], [0.07, 0.07, 0.072]), V.nodo({ malla: MA.cilindro(0.01, 0.05, 0.07, 14), pos: [0.0, 0, 0.0], rot: [PI / 2, 0, 0], esc: [1, 1, 1], mat: oro }), placa(0.067, 0.047, 0.38, [0, -0.215, 0]));
        equipo['tobillo_' + l].push(V.nodo({ malla: MA.capsula(0.05, 0.04, M.pie, 18), rot: [0, 0, PI / 2 + 0.12], pos: [-0.03, -0.035, 0], esc: [1.2, 1, 1.25], mat: placaM }),
          V.nodo({ malla: MA.cilindro(0.0, 0.04, 0.12, 14), pos: [0.2, -0.06, 0], rot: [0, 0, -PI / 2 - 0.12], esc: [1, 1, 1.25], mat: placaM }));
      }
    }
    if (tieneEscudo) equipo.codo_i.push(V.nodo({ pos: [0.07, -0.12, -0.13], rot: [0, PI * 0.68, 0.06], hijos: [
      MO.escudo_triangular({ campo: o.campo || '#9b2b22', figura: o.figura || '#e8d9a0', pos: [0, 0.25, 0] })] }));
    if (espada) equipo.codo_d.push(V.nodo({ pos: [0, -M.antebrazo - 0.045, 0], rot: o.rotEspada || [0, 0, -2.5], hijos: [
      MO.espada({ tipo: espada, pos: [0, 0.03, 0] })] }));
    const col = placas ? { cabeza: piel, cuello: '#6b7078', pecho: '#6b7078', vientre: '#6b7078', cintura: '#555a60', brazo: '#6b7078', antebrazo: '#6b7078', mano: '#6b7078', pelvis: '#555a60', muslo: '#6b7078', pierna: '#6b7078', pie: '#555a60' }
      : { cabeza: piel, cuello: '#4a4d52', pecho: sobre, vientre: sobre, cintura: sobre, brazo: '#4a4d52', antebrazo: '#4a4d52', mano: '#6a4a30', pelvis: sobre, muslo: '#4a4d52', pierna: '#4a4d52', pie: '#3a2818' };
    for (const k of Object.keys(equipo)) if (!equipo[k].length) delete equipo[k];
    return MO.maniqui({ pose: o.pose, pos: o.pos, rot: o.rot, esc: o.esc, apoyo: o.apoyo, suelo: o.suelo, piesX: o.piesX, colores: col, equipo });
  };
})(window.VE = window.VE || {});
