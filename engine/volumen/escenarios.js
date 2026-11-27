/* VOLUMEN — ESCENARIOS EXTERIORES: terreno por funcion de altura y mar con oleaje.
     V.modelos.terreno({ alto(x,z), x0, x1, z0, z1, n, semilla, colores })   malla de alturas con textura pintada segun altura y pendiente
         (arena junto al agua, espuma en la orilla, hierba, roca en las pendientes). Devuelve el nodo; V.terrenoAlto(x, z) = altura.
     V.modelos.mar({ t, color, nivel, olas, extension })                     plano de agua con olas (malla dinamica, mas fina en el centro)
   Unidades recomendadas: metros (una persona = 1,75). */
(function (VE) {
  const V = VE.vol, MA = V.malla, MO = V.modelos;

  MO.terreno = function (o) {
    const f = o.alto, x0 = o.x0 == null ? -80 : o.x0, x1 = o.x1 == null ? 80 : o.x1, z0 = o.z0 == null ? -140 : o.z0, z1 = o.z1 == null ? 40 : o.z1, n = o.n || 160, sem = o.semilla || 'terreno';
    const C = Object.assign({ arena: '#d8c08c', arenaMojada: '#a99268', hierba: '#5f8a3a', hierba2: '#7c9a45', roca: '#8a8178', espuma: '#f4f6f2', fondo: '#6f8f86' }, o.colores || {});
    const clave = 'terreno|' + sem + '|' + [x0, x1, z0, z1, n].join(',');
    const malla = MA.parametrica(n, Math.round(n * (z1 - z0) / (x1 - x0)), (u, v) => { const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * v; return [x, f(x, z), z]; }, { clave });
    const R = o.resolucion || 1024, tex = V.textura(clave + '|tex|' + R, R, R, (x, W, H) => {
      const img = x.createImageData(W, H), d = img.data, rn = VE.real.ruido2(sem), rgb = (c) => VE.color.aRGB(c), K = {}; for (const k in C) K[k] = rgb(C[k]);
      const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], c01 = (v) => Math.max(0, Math.min(1, v));
      const ex = (x1 - x0) / W;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const X = x0 + (x1 - x0) * (i + 0.5) / W, Z = z0 + (z1 - z0) * (j + 0.5) / H, h = f(X, Z), gx = (f(X + ex * 2, Z) - f(X - ex * 2, Z)) / (ex * 4), gz = (f(X, Z + ex * 2) - f(X, Z - ex * 2)) / (ex * 4);
        const pend = Math.hypot(gx, gz), nz = rn.fbm(X * 0.08, Z * 0.08, 4), nz2 = rn.fbm(X * 0.5 + 9, Z * 0.5, 3);
        let c = mezcla(K.hierba, K.hierba2, c01(nz * 1.6 - 0.3));
        c = mezcla(c, K.arena, c01((2.0 + nz * 0.8 - h) / 0.6));                     // arena junto al agua
        c = mezcla(c, K.arenaMojada, c01((0.35 - h) / 0.3));
        c = mezcla(c, K.roca, c01((pend - 0.65 + nz2 * 0.3) / 0.25));                // roca en pendientes
        c = mezcla(c, K.fondo, c01((-0.4 - h) / 1.5));                                // fondo bajo el agua
        const esp = Math.max(0, 1 - Math.abs(h - 0.05 - 0.1 * Math.sin(X * 0.4)) / 0.22) * (0.6 + 0.4 * nz2); c = mezcla(c, K.espuma, c01(esp));
        const v = 0.88 + 0.24 * nz2, k = (j * W + i) * 4; d[k] = c[0] * v; d[k + 1] = c[1] * v; d[k + 2] = c[2] * v; d[k + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    });
    V.terrenoAlto = f;
    return V.nodo({ nombre: 'terreno', malla, mat: { color: '#ffffff', mapa: tex, esp: 0.05, dureza: 10, envolver: 0.15, borde: 0.15 } });
  };

  MO.mar = function (o = {}) {
    const t = o.t || 0, A = o.olas == null ? 1 : o.olas, E = o.extension || 700, n = o.n || 110, y0 = o.nivel || 0;
    const ola = (x, z) => y0 + A * (0.16 * Math.sin(x * 0.21 + z * 0.13 + t * 1.3) + 0.1 * Math.sin(x * -0.11 + z * 0.37 + t * 1.9) + 0.05 * Math.sin(x * 0.7 + z * 0.55 + t * 2.7));
    V.marAlto = ola;
    const malla = MA.parametrica(n, n, (u, v) => { const a = u * 2 - 1, b = v * 2 - 1, x = Math.sign(a) * a * a * E + (o.cx || 0), z = Math.sign(b) * b * b * E + (o.cz || 0); return [x, ola(x, z), z]; }, { dinamica: o.nombre || 'mar' });
    return V.nodo({ nombre: 'mar', malla, mat: { tipo: 'brillo', color: o.color || '#2f6f8f', alfa: o.alfa == null ? 0.86 : o.alfa, esp: 0.9, dureza: 90, envolver: 0.05, borde: o.reflejo == null ? 0.7 : o.reflejo, colorBorde: o.colorBorde } });
  };
})(window.VE = window.VE || {});
