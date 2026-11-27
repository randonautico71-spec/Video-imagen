/* VOLUMEN — MODELOS DE HISTORIA (unidades: metros).
     V.modelos.barco_vikingo({ vela, escudos, remos })   nave de unos 20 m, proa hacia +Z, linea de flotacion en y = 0
     V.modelos.vikingo({ pose, apoyo, suelo, rot, tunica, semilla, sinEscudo, sinHacha })   maniqui vestido: casco redondo con nasal,
         barba, tunica, escudo redondo en el brazo izquierdo y hacha en la mano derecha
     V.modelos.castillo({ lado, alto, puerta, golpe, t })  recinto cuadrado: cuatro torres, murallas almenadas, puerta de dos hojas hacia +Z (puerta 0..1 abierta), torre del homenaje
     V.modelos.defensor({ pose, semilla })               arquero con casco conico, sobreveste y arco (pose 'arquero')
     V.efectos.flecha(de, a, t0, dur, t)  ·  V.efectos.astillas(semilla, origen, t0, t, {n, suelo})   combate determinista (todo depende de t)
   Nota historica: los cascos con cuernos son una invencion del siglo XIX; aqui el casco es redondo con nasal. */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI;

  // ---------------------------------------------------------------- texturas
  const texTablas = (c) => V.textura('tablas|' + c, 512, 256, (x, W, H) => {
    // u (ancho) = vuelta a la seccion del casco (tracas de tingladillo); el ultimo tramo es la cubierta
    x.fillStyle = c; x.fillRect(0, 0, W, H); const r = VE.rng('tablas');
    for (let i = 0; i < 26; i++) { const x0 = i / 26 * W * 0.96; x.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; x.fillRect(x0, 0, W * 0.96 / 26, H); x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(x0, 0, 2, H); x.fillStyle = 'rgba(255,220,170,0.12)'; x.fillRect(x0 + 2, 0, 2, H); }
    x.fillStyle = 'rgba(40,22,10,0.55)'; x.fillRect(W * 0.96, 0, W * 0.04, H);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; x.fillRect(r() * W, r() * H, 1 + r() * 3, 1); }
  });
  const texVela = (a, b) => V.textura('vela|' + a + b, 256, 256, (x, W, H) => { const n = 7; for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * W / n, 0, W / n + 1, H); }
    const r = VE.rng('vela'); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.05})`; x.fillRect(0, r() * H, W, 1); } });
  const texEscudo = (a, b) => V.textura('escudo|' + a + b, 256, 64, (x, W, H) => { const n = 4; for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * W / n, 0, W / n + 1, H); }
    x.fillStyle = 'rgba(60,40,20,0.9)'; x.fillRect(0, H * 0.82, W, H * 0.18); });                 // borde de cuero (final del perfil)
  const texPiedra = (c) => { const t = V.textura('piedra|' + c, 512, 512, (x, W, H) => {
    x.fillStyle = c; x.fillRect(0, 0, W, H); const r = VE.rng('piedra'), filas = 8;
    for (let f = 0; f < filas; f++) { let x0 = f % 2 ? -W / 10 : 0; const y = f * H / filas;
      while (x0 < W) { const w = W * (0.14 + r() * 0.12), k = 0.82 + r() * 0.3; x.fillStyle = `rgba(${k > 1 ? '255,240,220' : '0,0,0'},${Math.abs(1 - k) * 0.5})`; x.fillRect(x0 + 2, y + 2, w - 4, H / filas - 4);
        x.fillStyle = 'rgba(30,25,20,0.55)'; x.fillRect(x0, y, 2.5, H / filas); x0 += w; }
      x.fillStyle = 'rgba(30,25,20,0.55)'; x.fillRect(0, y, W, 2.5); }
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.06})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  }); t.repetirV = true; return t; };

  // ---------------------------------------------------------------- barco vikingo
  MO.barco_vikingo = function (o = {}) {
    const L = 20, Wd = 4.6, madera = o.madera || '#7a4a26', mt = { color: '#ffffff', mapa: texTablas(madera), esp: 0.25, dureza: 30, envolver: 0.2 };
    const quilla = (t) => 0.5 * Math.pow(Math.abs(t), 6), borda = (t) => 1.25 + 1.7 * Math.pow(Math.abs(t), 4.5);
    const secs = []; for (let i = 0; i <= 30; i++) { const t = -1 + 2 * i / 30, z = t * L / 2, w = Math.max(0.06, Wd / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.2)), 0.55)), yb = borda(t), yk = quilla(t), s = [];
      for (let k = 0; k <= 16; k++) { const f = k / 16 * PI; s.push([-w * Math.cos(f), yb - (yb - yk) * Math.pow(Math.sin(f), 0.6), z]); } secs.push(s); }
    const casco = MA.loft(secs, 'drakkar|casco');
    const hijos = [V.nodo({ nombre: 'casco', malla: casco, mat: mt, pos: [0, -0.75, 0] })];
    // proa: cuello de dragon; popa: cola en espiral
    const tip = (sg) => [0, borda(1) - 0.75, sg * L / 2];
    const cuello = []; for (let i = 0; i <= 20; i++) { const a = i / 20; cuello.push([0, borda(1) - 0.75 + a * 1.9, L / 2 + Math.sin(a * PI * 0.8) * 0.9 - a * 0.1]); }
    hijos.push(V.nodo({ malla: MA.tubo(cuello, (u) => 0.22 - 0.08 * u, 12, { clave: 'drakkar|cuello' }), mat: { color: madera, esp: 0.25 } }));
    const cab = cuello[20];
    hijos.push(V.nodo({ nombre: 'dragon', pos: [cab[0], cab[1] + 0.05, cab[2] + 0.15], rot: [-0.25, 0, 0], hijos: [
      V.nodo({ malla: MA.esfera(16), esc: [0.2, 0.22, 0.32], mat: { color: madera, esp: 0.3 } }),
      V.nodo({ malla: MA.cilindro(0.15, 0.05, 0.55, 12), pos: [0, -0.04, 0.42], rot: [PI / 2, 0, 0], mat: { color: madera } }),
      V.nodo({ malla: MA.esfera(8), esc: 0.05, pos: [0.13, 0.08, 0.12], mat: { tipo: 'plano', color: '#ffcf4a' } }), V.nodo({ malla: MA.esfera(8), esc: 0.05, pos: [-0.13, 0.08, 0.12], mat: { tipo: 'plano', color: '#ffcf4a' } }),
      V.nodo({ malla: MA.cilindro(0.04, 0.0, 0.3, 8), pos: [0.08, 0.22, -0.12], rot: [-0.6, 0, 0], mat: { color: madera } }), V.nodo({ malla: MA.cilindro(0.04, 0.0, 0.3, 8), pos: [-0.08, 0.22, -0.12], rot: [-0.6, 0, 0], mat: { color: madera } })] }));
    const cola = []; for (let i = 0; i <= 26; i++) { const a = i / 26, r = 0.9 * (1 - a * 0.7), an = a * PI * 1.6; cola.push([0, borda(1) - 0.75 + 0.9 + Math.sin(an) * r * 1.2 - (1 - a) * 0.0, -L / 2 - 0.9 + Math.cos(an) * r * 0.9 + 0.0]); }
    cola.unshift(tip(-1));
    hijos.push(V.nodo({ malla: MA.tubo(cola, (u) => 0.2 - 0.12 * u, 10, { clave: 'drakkar|cola' }), mat: { color: madera, esp: 0.25 } }));
    // escudos en la borda
    const cE = o.escudos || [['#d9b23a', '#9b2b22'], ['#2c4f8a', '#e8e1cf'], ['#1f1f1f', '#d9b23a'], ['#9b2b22', '#e8e1cf']];
    for (const sg of [1, -1]) for (let i = 0; i < 13; i++) { const z = -L * 0.34 + i * L * 0.68 / 12, t = z / (L / 2), w = Wd / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.2)), 0.55), y = borda(t) - 0.75 - 0.32, c = cE[i % cE.length];
      hijos.push(V.nodo({ pos: [sg * (w + 0.06), y, z], rot: [0, 0, -sg * PI / 2], hijos: [
        V.nodo({ malla: MA.cilindro(0.42, 0.42, 0.04, 24), mat: { color: '#ffffff', mapa: texEscudo(c[0], c[1]), esp: 0.2 } }),
        V.nodo({ malla: MA.esfera(10), esc: [0.09, 0.06, 0.09], pos: [0, 0.03, 0], mat: { color: '#9a9a9a', tipo: 'brillo' } })] })); }
    // mastil, verga y vela abombada
    const mm = { color: '#5a3a1e', esp: 0.2 };
    hijos.push(V.nodo({ malla: MA.cilindro(0.13, 0.1, 9.5, 12), pos: [0, 4.6, 0.6], mat: mm }));
    if (o.vela !== false) {
      const recogida = o.vela === 'recogida';
      hijos.push(V.nodo({ malla: MA.cilindro(0.09, 0.09, 7, 10), pos: [0, recogida ? 6.4 : 8.6, 0.85], rot: [0, 0, PI / 2], mat: mm }));
      if (!recogida) {
        const vela = MA.parametrica(16, 12, (u, v) => [(u - 0.5) * 6.6, 8.5 - v * 5.6, 0.95 + 0.9 * Math.sin(PI * u) * Math.sin(PI * (0.15 + 0.85 * v))], { clave: 'drakkar|vela', abierta: true });
        hijos.push(V.nodo({ malla: vela, mat: { color: '#ffffff', mapa: texVela('#a8322a', '#efe6d2'), dobleCara: true, esp: 0.05, envolver: 0.45, borde: 0.4 } }));
      }
    }
    // remos
    if (o.remos !== false) for (const sg of [1, -1]) for (let i = 0; i < 8; i++) { const z = -L * 0.3 + i * L * 0.6 / 7;
      hijos.push(V.nodo({ pos: [sg * (Wd / 2 + 0.2), 0.45, z], rot: [0, 0, sg * (PI / 2 - 0.55)], hijos: [V.nodo({ malla: MA.cilindro(0.045, 0.045, 4.6, 6), pos: [0, -1.6, 0], mat: mm }), V.nodo({ malla: MA.caja(0.03, 0.9, 0.22, 0.01), pos: [0, -3.7, 0], mat: mm })] })); }
    return V.nodo({ nombre: 'barco_vikingo', pos: o.pos, rot: o.rot, esc: o.esc, m: o.m, hijos });
  };

  // ---------------------------------------------------------------- vikingo
  const PALETAS = [{ tunica: '#7b2e22', calzas: '#5a4b38' }, { tunica: '#2f4f7a', calzas: '#4a3f33' }, { tunica: '#5d6b3a', calzas: '#3f3a33' }, { tunica: '#8a6a3a', calzas: '#4d4036' }, { tunica: '#6a3550', calzas: '#3d3a40' }];
  const BARBAS = ['#b5562a', '#e0b562', '#5a3b22', '#8a8a86', '#3a2a1e'];
  MO.vikingo = function (o = {}) {
    const r = VE.rng(o.semilla || 'vk'), p = PALETAS[Math.floor(r() * PALETAS.length)], barba = BARBAS[Math.floor(r() * BARBAS.length)], piel = '#e2b48c';
    const M = V.maniquiMedidas, hierro = { tipo: 'brillo', color: '#8d9399', esp: 0.8, dureza: 70 }, cuero = { color: '#4a3020', esp: 0.1 };
    const casco = MA.torno(MA.arco(0, 1, PI / 2, -0.15, 12), 24, 'vk|casco');
    const equipo = {
      cuello: [V.nodo({ pos: [0.015, M.cuello + 0.14, 0], hijos: [
        V.nodo({ malla: casco, esc: [0.108, 0.115, 0.102], mat: Object.assign({ dobleCara: true }, hierro) }),
        V.nodo({ malla: MA.caja(0.022, 0.12, 0.02, 0.006), pos: [0.105, -0.05, 0], mat: hierro }),
        V.nodo({ malla: MA.toro(1, 0.06, 32, 8), esc: [0.108, 0.12, 0.102], pos: [0, -0.005, 0], mat: hierro })] }),
        V.nodo({ malla: MA.esfera(16), esc: [0.065, 0.085, 0.078], pos: [0.065, M.cuello + 0.035, 0], mat: { color: barba, envolver: 0.5, esp: 0.05 } }),
        V.nodo({ malla: MA.esfera(12), esc: [0.04, 0.09, 0.07], pos: [-0.05, M.cuello + 0.06, 0], mat: { color: barba, envolver: 0.5, esp: 0.05 } })],
      maniqui: [V.nodo({ malla: MA.cilindro(0.165, 0.24, 0.34, 20), pos: [0.0, -0.1, 0], mat: { color: p.tunica, envolver: 0.3, esp: 0.05 } }),
        V.nodo({ malla: MA.toro(1, 0.18, 32, 8), esc: [0.15, 0.12, 0.175], pos: [0, 0.08, 0], mat: cuero })]
    };
    if (!o.sinEscudo) equipo.codo_i = [V.nodo({ pos: [0.02, -0.13, -0.07], rot: [PI / 2, 0, 0], hijos: [
      V.nodo({ malla: MA.cilindro(0.42, 0.42, 0.035, 28), mat: { color: '#ffffff', mapa: texEscudo(...[['#d9b23a', '#9b2b22'], ['#2c4f8a', '#e8e1cf'], ['#9b2b22', '#e8e1cf']][Math.floor(r() * 3)]), esp: 0.2 } }),
      V.nodo({ malla: MA.esfera(12), esc: [0.09, 0.05, 0.09], pos: [0, -0.03, 0], mat: hierro })] })];
    if (!o.sinHacha) equipo.codo_d = [V.nodo({ pos: [0, -M.antebrazo - 0.05, 0], rot: [0, 0, PI / 2 - 0.2], hijos: [
      V.nodo({ malla: MA.cilindro(0.018, 0.018, 0.85, 8), pos: [0, -0.25, 0], mat: { color: '#6a4a2a' } }),
      V.nodo({ malla: MA.extrusion([[0, 0], [0.16, -0.04], [0.2, -0.16], [0.1, -0.12], [0, -0.1]], 0.012, 'vk|hoja'), pos: [0.0, -0.62, 0], rot: [0, 0, PI / 2], mat: hierro })] })];
    const colores = { cabeza: piel, mano: piel, cuello: piel, pecho: p.tunica, vientre: p.tunica, cintura: p.tunica, brazo: p.tunica, antebrazo: piel, pelvis: p.tunica, muslo: p.calzas, pierna: p.calzas, pie: '#3a2818' };
    return MO.maniqui({ pose: o.pose, pos: o.pos, rot: o.rot, esc: o.esc, apoyo: o.apoyo, suelo: o.suelo, piesX: o.piesX, colores, equipo });
  };

  // ---------------------------------------------------------------- defensor (arquero)
  MO.defensor = function (o = {}) {
    const r = VE.rng(o.semilla || 'df'), sobre = ['#2e4a7a', '#7a2e2e', '#3d5e3a'][Math.floor(r() * 3)], malla = '#8e9298', piel = '#dcb090', M = V.maniquiMedidas;
    const hierro = { tipo: 'brillo', color: '#9aa0a6', esp: 0.8, dureza: 70 };
    const arco = []; for (let i = 0; i <= 16; i++) { const a = (i / 16 - 0.5) * 2.3; arco.push([Math.cos(a) * 0.62 - 0.62 + 0.18, Math.sin(a) * 0.62, 0]); }
    const equipo = {
      cuello: [V.nodo({ pos: [0.015, M.cuello + 0.15, 0], hijos: [V.nodo({ malla: MA.cilindro(0.0, 0.11, 0.17, 20), pos: [0, 0.03, 0], mat: hierro }), V.nodo({ malla: MA.toro(1, 0.07, 24, 6), esc: [0.11, 0.1, 0.105], pos: [0, -0.055, 0], mat: hierro })] })],
      maniqui: [V.nodo({ malla: MA.cilindro(0.17, 0.25, 0.4, 20), pos: [0, -0.12, 0], mat: { color: sobre, envolver: 0.3 } })],
      codo_i: [V.nodo({ pos: [0, -M.antebrazo - 0.05, 0], hijos: [V.nodo({ malla: MA.tubo(arco, 0.014, 6, { clave: 'arco' }), mat: { color: '#5a3a1e' } })] })]
    };
    const colores = { cabeza: piel, mano: piel, cuello: malla, pecho: sobre, vientre: sobre, cintura: sobre, brazo: malla, antebrazo: malla, pelvis: sobre, muslo: '#4a4038', pierna: '#4a4038', pie: '#2e2418' };
    return MO.maniqui({ pose: o.pose || 'arquero', pos: o.pos, rot: o.rot, esc: o.esc, apoyo: o.apoyo, suelo: o.suelo, colores, equipo });
  };

  // ---------------------------------------------------------------- combate: flechas y astillas (deterministas, funcion de t)
  const EF = V.efectos = {};
  /* Flecha disparada en t0 desde 'de' hacia 'a' en 'dur' segundos (parabola). Devuelve el nodo o null; al llegar queda clavada 'queda' segundos. */
  EF.flecha = function (de, a, t0, dur, t, o = {}) {
    if (t < t0) return null; const g = 9.8 * (o.gravedad == null ? 1 : o.gravedad), k = Math.min(t - t0, dur), queda = o.queda == null ? 4 : o.queda;
    if (t - t0 > dur + queda) return null;
    const v0 = [(a[0] - de[0]) / dur, (a[1] - de[1]) / dur + 0.5 * g * dur, (a[2] - de[2]) / dur];
    const p = [de[0] + v0[0] * k, de[1] + v0[1] * k - 0.5 * g * k * k, de[2] + v0[2] * k], vel = [v0[0], v0[1] - g * k, v0[2]];
    let m = V.m4.base(vel, Math.abs(V.v3.norm(vel)[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0], p);
    if (t - t0 >= dur) m = V.m4.mul(m, V.m4.tras(0, 0, 0.25));         // clavada: la punta entra en el suelo
    return V.nodo({ m, hijos: [
      V.nodo({ malla: MA.cilindro(0.013, 0.013, 0.8, 6), pos: [0, 0, -0.4], rot: [PI / 2, 0, 0], mat: { color: '#7a5a34' } }),
      V.nodo({ malla: MA.cilindro(0.03, 0.0, 0.09, 6), pos: [0, 0, 0.04], rot: [PI / 2, 0, 0], mat: { tipo: 'brillo', color: '#8a8f95' } }),
      V.nodo({ malla: MA.caja(0.005, 0.07, 0.14, 0.002), pos: [0, 0, -0.74], mat: { color: '#e8e2d4' } }), V.nodo({ malla: MA.caja(0.07, 0.005, 0.14, 0.002), pos: [0, 0, -0.74], mat: { color: '#e8e2d4' } })] });
  };
  /* Astillas / cascotes que saltan desde 'origen' en t0 (n piezas, gravedad, rebote en y = suelo). */
  EF.astillas = function (semilla, origen, t0, t, o = {}) {
    const k = t - t0, vida = o.vida || 1.6; if (k < 0 || k > vida) return []; const r = VE.rng(semilla), n = o.n || 14, out = [], g = 9.8, suelo = o.suelo == null ? -1e9 : o.suelo, v = o.vel || 5;
    for (let i = 0; i < n; i++) { const dir = [(r() - 0.5) * 2, 0.4 + r(), (o.haciaZ || 1) * (0.3 + r())], s = v * (0.5 + r() * 0.8), tam = (o.tam || 0.12) * (0.5 + r());
      const p = [origen[0] + dir[0] * s * k, Math.max(suelo + tam / 2, origen[1] + dir[1] * s * k - 0.5 * g * k * k), origen[2] + dir[2] * s * k];
      out.push(V.nodo({ malla: MA.caja(tam, tam * 0.3, tam * 2.2, tam * 0.05), pos: p, rot: [k * 9 * r(), k * 7 * r(), k * 11 * r()], alfa: Math.min(1, (vida - k) * 3), mat: { color: o.color || '#7a5230' } })); }
    return out;
  };

  // ---------------------------------------------------------------- castillo
  MO.castillo = function (o = {}) {
    const S = o.lado || 26, Hm = o.alto || 11, piedra = o.piedra || '#a39a8c', tejado = o.tejado || '#5b3a35', h = S / 2;
    const mp = (rep) => ({ color: '#ffffff', mapa: texPiedra(piedra), repetir: rep, esp: 0.05, envolver: 0.15, borde: 0.3 });
    const hijos = [], almenas = (n, f) => { for (let i = 0; i < n; i++) hijos.push(f(i)); };
    const torre = (x, z, R, alto) => {
      hijos.push(V.nodo({ malla: MA.cilindro(R, R * 1.08, alto, 28, true), pos: [x, alto / 2, z], mat: mp([4, alto / 3]) }));
      hijos.push(V.nodo({ malla: MA.cilindro(R + 0.35, R + 0.35, 0.8, 28, true), pos: [x, alto + 0.1, z], mat: mp([4, 0.3]) }));
      almenas(12, (i) => { const a = i / 12 * 2 * PI; return V.nodo({ malla: MA.caja(0.9, 1.0, 0.6, 0.05), pos: [x + Math.sin(a) * (R + 0.1), alto + 0.95, z + Math.cos(a) * (R + 0.1)], rot: [0, a, 0], mat: mp([0.3, 0.3]) }); });
      hijos.push(V.nodo({ malla: MA.cilindro(0.01, R + 0.6, R * 1.7, 28, true), pos: [x, alto + 0.6 + R * 0.85, z], mat: { color: tejado, esp: 0.15, envolver: 0.2 } }));
    };
    const muro = (x, z, largo, rotY) => {
      hijos.push(V.nodo({ malla: MA.caja(largo, Hm, 2.2, 0.08), pos: [x, Hm / 2, z], rot: [0, rotY, 0], mat: mp([largo / 6, Hm / 3]) }));
      const n = Math.floor(largo / 1.6); for (let i = 0; i < n; i++) { const d = -largo / 2 + (i + 0.5) * largo / n;
        hijos.push(V.nodo({ malla: MA.caja(0.85, 0.95, 2.3, 0.05), pos: [x + Math.cos(rotY) * d, Hm + 0.45, z - Math.sin(rotY) * d], rot: [0, rotY, 0], mat: mp([0.3, 0.3]) })); }
    };
    // cimientos: roca bajo el recinto para que no quede en el aire si el terreno no es plano
    if (o.cimientos !== 0) hijos.push(V.nodo({ malla: MA.caja(S + 2.4, 10, S + 2.4, 0.3), pos: [0, -5.05, 0], mat: mp([(S + 2.4) / 6, 3]) }));
    muro(0, -h, S, 0); muro(-h, 0, S, PI / 2); muro(h, 0, S, PI / 2);
    muro(-h / 2 - 1.6, h, h - 3.2, 0); muro(h / 2 + 1.6, h, h - 3.2, 0);              // frente con hueco para la puerta
    for (const [x, z] of [[-h, -h], [h, -h], [-h, h], [h, h]]) torre(x, z, 3.2, Hm + 5);
    // puerta: dos torres pequenas y arco oscuro
    torre(-3.6, h + 0.6, 2.0, Hm + 2); torre(3.6, h + 0.6, 2.0, Hm + 2);
    hijos.push(V.nodo({ malla: MA.caja(5.2, Hm - 4, 2.4, 0.05), pos: [0, Hm - 2, h], mat: mp([1, 1.5]) }));
    const arco = [[-1.8, 0], [1.8, 0]]; for (let i = 0; i <= 12; i++) { const a = i / 12 * PI; arco.push([1.8 * Math.cos(a), 4 + 1.8 * Math.sin(a)]); } arco.splice(1, 0);
    const arcoP = [[-1.8, 0], [1.8, 0]].concat(Array.from({ length: 13 }, (_, i) => { const a = i / 12 * PI; return [1.8 * Math.cos(a), 4.2 + 1.8 * Math.sin(a)]; }));
    hijos.push(V.nodo({ malla: MA.extrusion(arcoP, 0.3, 'castillo|arco'), pos: [0, 0, h + 1.15], mat: { tipo: 'plano', color: '#1c1610' } }));
    // puerta de dos hojas: puerta 0 = cerrada, 1 = abierta hacia dentro; golpe 0..1 = sacudida de un impacto
    const ab = o.puerta || 0, gp = o.golpe || 0, roble = { color: '#6b4524', esp: 0.15, envolver: 0.2 }, herraje = { tipo: 'brillo', color: '#3a3a3a', esp: 0.5 };
    if (ab < 0.999) for (const sg of [-1, 1]) {
      const hoja = [V.nodo({ malla: MA.caja(1.78, 5.9, 0.25, 0.03), pos: [-sg * 0.89, 2.95, 0], mat: roble })];
      for (const y of [1.2, 3.0, 4.8]) hoja.push(V.nodo({ malla: MA.caja(1.7, 0.16, 0.06, 0.01), pos: [-sg * 0.89, y, 0.15], mat: herraje }));
      hijos.push(V.nodo({ pos: [sg * 1.8, 0, h + 1.38], rot: [gp * 0.02 * sg, sg * ab * 1.35 + gp * 0.03 * sg, 0], hijos: hoja }));
    }
    // torre del homenaje
    hijos.push(V.nodo({ malla: MA.caja(9, Hm + 12, 9, 0.1), pos: [0, (Hm + 12) / 2, -2], mat: mp([2, (Hm + 12) / 3]) }));
    for (const [dx, dz, ry] of [[0, 4.5, 0], [0, -4.5, 0], [4.5, 0, PI / 2], [-4.5, 0, PI / 2]]) for (let i = 0; i < 5; i++) { const d = -3.6 + i * 1.8;
      hijos.push(V.nodo({ malla: MA.caja(0.9, 1.0, 0.6, 0.05), pos: [dx + Math.cos(ry) * d, Hm + 12.5, -2 + dz - Math.sin(ry) * d], rot: [0, ry, 0], mat: mp([0.3, 0.3]) })); }
    // estandarte que ondea
    const t = o.t || 0, ban = MA.parametrica(10, 6, (u, v) => [u * 2.6, -v * 1.4, Math.sin(u * 4 - t * 5) * 0.25 * u], { dinamica: 'castillo|bandera', abierta: true });
    hijos.push(V.nodo({ malla: MA.cilindro(0.06, 0.06, 4, 8), pos: [0, Hm + 14, -2], mat: { color: '#3a2a1a' } }));
    hijos.push(V.nodo({ malla: ban, pos: [0.05, Hm + 15.9, -2], mat: { color: o.bandera || '#c8a23a', dobleCara: true, esp: 0.1, envolver: 0.4 } }));
    return V.nodo({ nombre: 'castillo', pos: o.pos, rot: o.rot, esc: o.esc, hijos });
  };
})(window.VE = window.VE || {});
