/* Esqueleto humano de pie (cráneo, columna, caja torácica, pelvis, brazos y piernas) con material intercambiable.
   Mira a +X, arriba +Y, el origen está en el suelo (entre los pies). Altura ≈ 1,75.
     V.modelos.esqueleto({ mat: {color, esp, dureza, ...}, matB: material de las juntas/discos (opcional), ang: {cadera, rodilla, hombro, codo (rad, ambos lados), cadera_d/_i...}, tronco: inclinación (rad, +adelante), pos, rot, esc })
   Flexión: cadera + = muslo adelante; rodilla + = pantorrilla atrás; hombro + = brazo adelante; codo + = antebrazo adelante. */
(function (VE) {
  'use strict';
  const V = VE.vol, MA = V.malla, MO = V.modelos, PI = Math.PI, sn = Math.sin, cs = Math.cos;
  const elip = (mat, e3, pos, rot) => V.nodo({ malla: MA.esfera(24), esc: e3, pos: pos || [0, 0, 0], rot, mat });

  MO.esqueleto = function (o = {}) {
    const m = Object.assign({ color: '#e9dfc4', esp: 0.2, dureza: 25, envolver: 0.45, borde: 0.25 }, o.mat || {});
    const mB = o.matB || m, A = o.ang || {};
    const g = (n) => A[n] || 0;
    // hueso largo: caña + dos cabezas (extremos), de (0,0,0) hacia -Y
    const largo = (L, r, rEx, ex) => V.nodo({ hijos: [V.nodo({ malla: MA.capsula(r * 1.18, r, L, 14), mat: m }), elip(m, [rEx, rEx * 0.9, rEx], [0, 0, 0]), elip(m, [rEx * (ex || 1), rEx * 0.9, rEx * (ex || 1)], [0, -L, 0])] });
    const pierna = (lado) => {
      const z = lado * 0.095, ch = g('cadera') + g('cadera_' + (lado > 0 ? 'd' : 'i')), rd = g('rodilla') + g('rodilla_' + (lado > 0 ? 'd' : 'i'));
      const pie = V.nodo({ pos: [0, -0.43, 0], rot: [0, 0, rd - ch], hijos: [elip(m, [0.06, 0.03, 0.04], [0.05, -0.03, 0]), V.nodo({ malla: MA.caja(0.2, 0.025, 0.07, 0.01), pos: [0.07, -0.05, 0], mat: m })] });
      const tibia = V.nodo({ pos: [0, -0.45, 0], rot: [0, 0, -rd], hijos: [largo(0.43, 0.017, 0.04, 1), V.nodo({ malla: MA.capsula(0.009, 0.007, 0.36, 8), pos: [-0.02, -0.04, 0.032 * lado], mat: m }), pie] });
      return V.nodo({ pos: [0, -0.02, z], rot: [0, 0, ch], hijos: [V.nodo({ pos: [0.0, 0, 0.0], hijos: [largo(0.45, 0.021, 0.045, 1.1)] }), V.nodo({ pos: [-0.015, 0, 0], rot: [0, 0, 0.0] }), tibia, elip(mB, [0.045, 0.04, 0.045], [0.02, -0.45, 0]) ] });
    };
    const brazo = (lado) => {
      const z = lado * 0.2, hb = g('hombro') + g('hombro_' + (lado > 0 ? 'd' : 'i')), co = g('codo') + g('codo_' + (lado > 0 ? 'd' : 'i'));
      const mano = V.nodo({ pos: [0, -0.26, 0], hijos: [V.nodo({ malla: MA.caja(0.035, 0.09, 0.075, 0.012), pos: [0, -0.05, 0], mat: m }), ...[-0.03, -0.01, 0.01, 0.03].map((dz) => V.nodo({ malla: MA.capsula(0.008, 0.006, 0.08, 6), pos: [0, -0.095, dz], mat: m }))] });
      const ant = V.nodo({ pos: [0, -0.31, 0], rot: [0, 0, co], hijos: [largo(0.26, 0.013, 0.025, 0.9), mano] });
      return V.nodo({ pos: [0, 0, z], rot: [0, 0, hb], hijos: [largo(0.31, 0.017, 0.035, 1), ant] });
    };
    // caja torácica: 10 pares de costillas + esternón
    const costillas = [];
    for (let i = 0; i < 10; i++) {
      const y = 1.46 - i * 0.032, R = i < 7 ? 0.1 + 0.012 * Math.min(i, 4) : 0.15 - 0.01 * (i - 6), prof = i < 7 ? 0.085 + 0.012 * Math.min(i, 4) : 0.13 - 0.012 * (i - 6), cierre = i < 7 ? 1 : 0.72 - 0.08 * (i - 7);
      for (const lado of [1, -1]) {
        const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14, a = u * PI * 0.92 * cierre + 0.0; pts.push([-0.04 + prof * 0.9 * (sn(a) * 0.9 + (1 - cs(a)) * 0.1 * 0) - 0.0, y - 0.03 * u - 0.04 * u * u, lado * R * cs(a) * 0.98 + lado * 0.0]); }
        // arco: de la espalda (x<0) hacia delante (x>0) rodeando por el lado
        const arco = []; for (let k = 0; k <= 14; k++) { const u = k / 14, a = u * PI * 0.5 * (i < 7 ? 1.0 : 0.85) + 0.18; arco.push([-0.045 + (prof + 0.045) * sn(a) / sn(PI / 2 * 1), y - 0.04 * u + 0.012 * sn(u * PI), lado * R * cs(a)]); }
        costillas.push(V.nodo({ malla: MA.tubo(arco, 0.0085, 6, { clave: 'esq|rib|' + i + '|' + lado }), mat: m }));
      }
    }
    const esternon = V.nodo({ malla: MA.caja(0.022, 0.22, 0.05, 0.008), pos: [0.115, 1.34, 0], rot: [0, 0, 0.07], mat: m });
    // columna: vértebras con curvas suaves
    const col = [], N = 24;
    for (let i = 0; i < N; i++) { const s = i / (N - 1), y = 0.99 + s * 0.52, x = -0.045 + 0.03 * sn(s * PI * 2.2 + 0.3) * (s < 0.9 ? 1 : 0.3), r = 0.022 + 0.012 * (1 - s) * (1 - s) + (s > 0.8 ? -0.006 : 0);
      col.push(V.nodo({ pos: [x, y, 0], hijos: [V.nodo({ malla: MA.cilindro(r, r * 1.02, 0.017, 14), mat: m }), V.nodo({ malla: MA.caja(0.02, 0.02, 0.012 + r * 1.4, 0.004), pos: [-r - 0.008, 0, 0], mat: m })] })); }
    const pelvis = V.nodo({ pos: [-0.01, 0.93, 0], hijos: [
      elip(m, [0.05, 0.1, 0.12], [-0.03, 0.06, 0.09], [0.0, 0, 0.1]), elip(m, [0.05, 0.1, 0.12], [-0.03, 0.06, -0.09], [0.0, 0, -0.1]),
      elip(m, [0.06, 0.07, 0.09], [0.0, -0.03, 0.06]), elip(m, [0.06, 0.07, 0.09], [0.0, -0.03, -0.06]),
      V.nodo({ malla: MA.caja(0.05, 0.1, 0.1, 0.02), pos: [-0.075, 0.0, 0], rot: [0, 0, -0.2], mat: m }),
      V.nodo({ malla: MA.torno ? MA.caja(0.03, 0.04, 0.05, 0.01) : MA.caja(0.03, 0.04, 0.05, 0.01), pos: [0.085, -0.04, 0], mat: m })] });
    // cráneo + mandíbula
    const craneo = V.nodo({ pos: [0.01, 1.66, 0], rot: [0, 0, g('cuello')], hijos: [
      elip(m, [0.105, 0.105, 0.085], [0, 0.0, 0]), elip(m, [0.075, 0.055, 0.07], [0.05, -0.065, 0]),
      elip({ color: '#1a1410', esp: 0.1 }, [0.03, 0.03, 0.026], [0.075, -0.0, 0.037]), elip({ color: '#1a1410', esp: 0.1 }, [0.03, 0.03, 0.026], [0.075, -0.0, -0.037]),
      V.nodo({ malla: MA.caja(0.03, 0.03, 0.02, 0.01), pos: [0.098, -0.04, 0], mat: { color: '#1a1410', esp: 0.1 } }),
      V.nodo({ malla: MA.caja(0.07, 0.03, 0.1, 0.012), pos: [0.07, -0.115, 0], mat: m })] });
    const clav = (lado) => V.nodo({ malla: MA.capsula(0.009, 0.009, 0.2, 8), pos: [0.05, 1.475, lado * 0.01], rot: [lado * (PI / 2 - 0.05), 0, 0], mat: m });
    const hombros = (lado) => V.nodo({ pos: [0.0, 1.455, 0], hijos: [V.nodo({ pos: [0, 0, 0], hijos: [brazo(lado)] })] });
    const tronco = V.nodo({ pos: [0, 0.93, 0], rot: [0, 0, -(o.tronco || 0)], hijos: [V.nodo({ pos: [0, -0.93, 0], hijos: [...col, ...costillas, esternon, craneo, clav(1), clav(-1), hombros(1), hombros(-1)] })] });
    return V.nodo({ nombre: 'esqueleto', pos: o.pos, rot: o.rot, esc: o.esc, hijos: [pelvis, V.nodo({ pos: [0, 0.92, 0], hijos: [pierna(1), pierna(-1)] }), tronco] });
  };
})(window.VE);
