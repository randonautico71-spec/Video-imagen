/* VOLUMEN — MODELOS: objetos montados con piezas de VE.vol.malla y texturas pintadas por codigo.
   Cada modelo devuelve un nodo (arbol) que se coloca con pos/rot/esc como cualquier otro. Las texturas se pintan UNA vez.
     V.modelos.tierra({nubes, atmosfera, semilla})      globo de radio 1 con costas reales (Natural Earth), nubes y atmosfera
     V.modelos.avion({color, acento})                   avion de pasajeros, largo 1, morro hacia +Z, alas en X
     V.modelos.maniqui({pose, color, resaltar})         figura articulada de madera (ver V.poses y V.pose.mezclar)
     V.modelos.silla({color})                           silla de madera, asiento a 0,46 de alto, frente hacia +X
     V.modelos.nube({semilla, color})                   nube de bolas fundidas
     V.modelos.arbol({semilla, tipo: 'copa'|'pino'})    arbol estilizado
     V.modelos.sala({pared, suelo})                     suelo de tarima y pared (escenario de interior)
   Maniqui: {pose, apoyo: 'pies', piesX, suelo} coloca solo la figura sobre el suelo (ver mas abajo); resaltar: {muslo_d: '#ff7a3d', ...} colorea piezas.
   Geografia: V.geo.punto(lat, lon, r) (grados) coincide con la textura de la Tierra; V.geo.ruta(a, b, n, altura) gran circulo;
   V.geo.visible(p, cam) si un punto del globo mira a la camara.
   Nuevos modelos: V.modelos.<nombre> = (o) => V.nodo({...}). Revisar en demo/volumen.html. */
(function (VE) {
  const V = VE.vol = VE.vol || {}, MA = V.malla, MO = V.modelos = {}, PI = Math.PI, D = PI / 180;
  const TEX = new Map();
  const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  /* Textura pintada una vez y compartida (clave -> lienzo). */
  V.textura = (clave, w, h, fn) => { if (TEX.has(clave)) return TEX.get(clave); const c = lienzo(w, h); fn(c.getContext('2d'), w, h, c); TEX.set(clave, c); return c; };

  // ---------------------------------------------------------------- geografia
  const G = V.geo = {};
  G.punto = (lat, lon, r = 1) => { const la = lat * D, lo = lon * D; return [-Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, -Math.cos(la) * Math.cos(lo) * r]; };
  G.latlon = (p) => { const r = V.v3.lon(p); return [Math.asin(p[1] / r) / D, Math.atan2(-p[0], -p[2]) / D]; };
  /* Gran circulo entre a=[lat,lon] y b=[lat,lon]: n+1 puntos a radio 1 + altura(t) (numero o funcion de t 0..1). */
  G.ruta = function (a, b, n = 64, altura = 0) {
    const p = V.v3.norm(G.punto(a[0], a[1])), q = V.v3.norm(G.punto(b[0], b[1])), w = Math.acos(Math.max(-1, Math.min(1, V.v3.punto(p, q)))), o = [];
    for (let i = 0; i <= n; i++) { const t = i / n, s = Math.sin(w) || 1, k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s, h = typeof altura === 'function' ? altura(t) : altura;
      const d = V.v3.norm([p[0] * k1 + q[0] * k2, p[1] * k1 + q[1] * k2, p[2] * k1 + q[2] * k2]); o.push(V.v3.por(d, 1 + h)); }
    return o;
  };
  /* Punto y direccion en una ruta (t 0..1) para colocar un vehiculo: devuelve la matriz (morro +Z hacia delante, +Y hacia fuera del globo). */
  G.enRuta = function (ruta, t, alabeo = 0) {
    const n = ruta.length - 1, f = Math.max(0, Math.min(n - 1e-6, t * n)), i = Math.floor(f), k = f - i;
    const p = V.v3.mezcla(ruta[i], ruta[i + 1], k), d = V.v3.res(ruta[Math.min(n, i + 1)], ruta[i]);
    let m = V.m4.base(d, V.v3.norm(p), p); if (alabeo) m = V.m4.mul(m, V.m4.rotZ(alabeo)); return { pos: p, m };
  };
  G.visible = (p, cam, r = 1) => V.v3.punto(p, cam.pos) > r * r * 1.0005;
  /* Distancia de gran circulo en km (radio medio 6371 km). */
  G.distancia = (a, b) => 6371 * Math.acos(Math.max(-1, Math.min(1, V.v3.punto(G.punto(a[0], a[1]), G.punto(b[0], b[1])))));

  // ---------------------------------------------------------------- Tierra
  function anillos() {
    if (G._anillos) return G._anillos; const s = VE.TIERRA_COSTAS; if (!s) throw new Error('Falta engine/volumen/tierra_datos.js');
    G._anillos = s.split(';').map(r => { const v = r.split(',').map(Number), o = []; let x = 0, y = 0; for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; o.push([x / 20, y / 20]); } return o; });
    return G._anillos;
  }
  G.anillos = anillos;
  /* Textura de la Tierra (equirectangular, ancho w). El color se calcula pixel a pixel a 4096 como mucho (oceano y tierra por separado)
     y la costa se recorta con los poligonos a la resolucion final: costa nitida aunque la textura sea de 8192. */
  function texTierra(w, sem) {
    return V.textura('tierra|' + w + '|' + sem, w, w / 2, (x, W, H) => {
      const cw = Math.min(W, 4096), ch = cw / 2, X = (lon, ww) => (lon + 180) / 360 * ww, Y = (lat, hh) => (90 - lat) / 180 * hh;
      const poligonos = (cx, ww, hh) => { cx.beginPath(); for (const r of anillos()) { r.forEach((p, i) => i ? cx.lineTo(X(p[0], ww), Y(p[1], hh)) : cx.moveTo(X(p[0], ww), Y(p[1], hh))); cx.closePath(); } };
      const m = lienzo(cw, ch), mx = m.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, cw, ch); mx.fillStyle = '#fff'; poligonos(mx, cw, ch); mx.fill();
      const b = lienzo(cw, ch), bx = b.getContext('2d'); bx.filter = `blur(${Math.round(cw / 300)}px)`; bx.drawImage(m, 0, 0); bx.filter = 'none';   // plataforma costera (una vez)
      const B = bx.getImageData(0, 0, cw, ch).data, oc = mx.createImageData(cw, ch), ti = mx.createImageData(cw, ch), O = oc.data, T = ti.data;
      const rn = VE.real && VE.real.ruido2 ? VE.real.ruido2(sem) : null, nz = (a, c, o) => rn ? rn.fbm(a, c, o) : 0.5;
      const caja = (la, lo, a0, a1, o0, o1, s) => Math.max(0, Math.min(1, Math.min(Math.min(la - a0, a1 - la), Math.min(lo - o0, o1 - lo)) / s));
      const desierto = (la, lo) => Math.max(caja(la, lo, 14, 33, -17, 35, 6), caja(la, lo, 13, 33, 35, 60, 5), caja(la, lo, 25, 38, 50, 72, 5) * 0.8, caja(la, lo, 37, 48, 88, 118, 5) * 0.7,
        caja(la, lo, -33, -19, 116, 146, 5) * 0.85, caja(la, lo, -28, -18, 14, 26, 4) * 0.6, caja(la, lo, -30, -15, -72, -68, 2) * 0.6, caja(la, lo, 28, 40, -118, -103, 4) * 0.5);
      for (let j = 0; j < ch; j++) { const la = 90 - (j + 0.5) / ch * 180, al = Math.abs(la);
        for (let i = 0; i < cw; i++) { const k = (j * cw + i) * 4, lo = (i + 0.5) / cw * 360 - 180, cst = B[k] / 255, cl = Math.cos(la * D), px = cl * Math.sin(lo * D), pz = cl * Math.cos(lo * D), py = Math.sin(la * D);
          const n = nz(px * 9 + pz * 4 + 40, py * 9 + pz * 6 + 40, 4), n2 = nz(px * 38 + pz * 17 + 90, py * 38 - pz * 21 + 90, 3);   // ruido sobre la esfera (sin pellizco en los polos)
          O[k] = 24 + 10 * n + 10 * cst; O[k + 1] = 52 + 24 * n + 40 * cst; O[k + 2] = 112 + 30 * n + 50 * cst; O[k + 3] = 255;
          const ds = desierto(la, lo), hielo = Math.min(1, Math.max(0, (al - 62) / 8) * (la < 0 || (lo > -75 && lo < -10) ? 1 : 0.35) + (la < -60 ? 1 : 0));
          let lr = 62 + 40 * n + 14 * n2, lg = 112 + 40 * n + 16 * n2 - Math.max(0, al - 45) * 0.8, lb = 52 + 16 * n;
          if (al < 15) { lr -= 18; lg -= 8; lb -= 6; }
          lr += (204 - lr) * ds + 20 * n2 * ds; lg += (168 - lg) * ds; lb += (110 - lb) * ds; lr += (236 - lr) * hielo; lg += (242 - lg) * hielo; lb += (248 - lb) * hielo;
          T[k] = lr; T[k + 1] = lg; T[k + 2] = lb; T[k + 3] = 255; } }
      const lo = lienzo(cw, ch), lt = lienzo(cw, ch); lo.getContext('2d').putImageData(oc, 0, 0); lt.getContext('2d').putImageData(ti, 0, 0);
      x.imageSmoothingQuality = 'high'; x.drawImage(lo, 0, 0, W, H);
      x.save(); poligonos(x, W, H); x.clip(); x.drawImage(lt, 0, 0, W, H); x.restore();
      x.strokeStyle = 'rgba(20,40,30,0.35)'; x.lineWidth = Math.max(1, W / 4096); poligonos(x, W, H); x.stroke();   // linea de costa fina
    });
  }
  /* Nubes: muchas manchas suaves (ensanchadas con 1/cos(lat) para que en la esfera sean redondas), agrupadas y sin nubes en los polos. */
  function texNubes(w, sem) {
    return V.textura('nubes|' + w + '|' + sem, w, w / 2, (x, W, H) => {
      const r = VE.rng(sem + 'nubes'), sprite = lienzo(128, 128), sx = sprite.getContext('2d'), g = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0.42)'); g.addColorStop(0.45, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 128, 128);
      const grupos = 420;
      for (let gI = 0; gI < grupos; gI++) {
        // latitudes con mas nubes: zona de convergencia (~5) y latitudes medias (~45-60); pocas en los subtropicos y nada en los polos
        let la; const q = r(); la = q < 0.25 ? (r() - 0.5) * 16 + 5 : (q < 0.62 ? 40 + r() * 22 : -(40 + r() * 22)); if (q > 0.9) la = (r() - 0.5) * 120;
        const lo = r() * 360 - 180, tam = 0.8 + r() * 3.5, n = 10 + Math.floor(r() * 34), ang = (r() - 0.5) * 1.2;
        for (let i = 0; i < n; i++) { const d = r() * tam * 1.6, a = ang + (r() - 0.5) * 0.9, l2 = la + Math.sin(a) * d * 0.5, o2 = lo + Math.cos(a) * d * 1.6;
          if (Math.abs(l2) > 72) continue; const cs = Math.max(0.25, Math.cos(l2 * D)), rr = (0.25 + r() * 0.9) * W / 360 * (1 + tam * 0.2);
          const px = (o2 + 180) / 360 * W, py = (90 - l2) / 180 * H;
          for (const dx of [0, W, -W]) x.drawImage(sprite, px + dx - rr / cs, py - rr, rr * 2 / cs, rr * 2); }
      }
    });
  }
  MO.tierra = function (o = {}) {
    const sem = o.semilla || 'tierra', res = o.resolucion || 4096;   // 8192 para planos muy cercanos (mas memoria)
    const hijos = [V.nodo({ nombre: 'superficie', malla: MA.esfera(o.segmentos || 192), mat: { color: '#ffffff', mapa: texTierra(res, sem), esp: 0.28, dureza: 40, envolver: 0.05, borde: 0.4 } })];
    if (o.nubes !== false) hijos.push(V.nodo({ nombre: 'nubes', malla: MA.esfera(o.segmentos || 192), esc: 1.012, rot: [0, o.giroNubes || 0, 0], sinSombra: true, mat: { color: '#ffffff', mapa: texNubes(2048, sem), alfa: o.nubes == null || o.nubes === true ? 0.9 : o.nubes, desvanecer: 0.35, esp: 0, envolver: 0.1, borde: 0.2 } }));
    if (o.atmosfera !== false) hijos.push(V.nodo({ nombre: 'atmosfera', malla: MA.esfera(72), esc: 1.035, mat: { tipo: 'rayosx', color: o.colorAtmosfera || '#5fa8ff', fresnel: 3, borde: 1.3, emision: 0.0, atraviesa: false, alfa: typeof o.atmosfera === 'number' ? o.atmosfera : 1 } }));
    return V.nodo({ nombre: 'tierra', hijos, pos: o.pos, rot: o.rot, esc: o.esc });
  };

  // ---------------------------------------------------------------- avion de pasajeros
  function perfilAla(c, t, n = 14) {               // NACA 00xx simetrico, de borde de salida a borde de ataque y vuelta (en z, y)
    const yt = (x) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4), o = [];
    for (let i = 0; i < n; i++) { const x = 0.5 * (1 + Math.cos(i / n * PI)); o.push([x, yt(x)]); }
    for (let i = 0; i < n; i++) { const x = 0.5 * (1 - Math.cos(i / n * PI)); o.push([x, -yt(x)]); }
    return o.map(([x, y]) => [x * c, y * c]);      // x: 0 = ataque, c = salida
  }
  /* Ala (o estabilizador) por secciones: lista de {span, z (borde de ataque), y, cuerda, grosor}. eje 'x' (horizontal) o 'y' (deriva). */
  function ala(secs, eje, clave) {
    return MA.loft(secs.map(s => perfilAla(s.cuerda, s.grosor || 0.12).map(([c, e]) => eje === 'x' ? [s.span, s.y + e, s.z - c] : [e, s.span, s.z - c])), clave);
  }
  function texFuselaje(acento) {
    return V.textura('fuselaje|' + acento, 1024, 512, (x, W, H) => {
      // u (ancho) = vuelta alrededor (0 = panza, 0,5 = techo, 0,25 = derecha), v (alto) = morro (0) a cola (1)
      x.fillStyle = '#f4f5f7'; x.fillRect(0, 0, W, H);
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#b9c0c9'); g.addColorStop(0.18, '#f4f5f7'); g.addColorStop(0.82, '#f4f5f7'); g.addColorStop(1, '#b9c0c9');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (const lado of [0.29, 0.71]) {                       // franja y ventanillas a cada lado
        x.fillStyle = acento; x.fillRect(lado * W - W * 0.012, H * 0.06, W * 0.024, H * 0.86);
        x.fillStyle = '#1d2733'; for (let v = 0.13; v < 0.84; v += 0.016) { x.beginPath(); x.ellipse((lado + (lado < 0.5 ? 0.04 : -0.04)) * W, v * H, W * 0.006, H * 0.0055, 0, 0, 7); x.fill(); }
        x.fillStyle = '#26323f'; x.fillRect((lado + (lado < 0.5 ? 0.07 : -0.11)) * W, H * 0.035, W * 0.04, H * 0.022);   // cabina
      }
      x.fillStyle = '#c9ced6'; for (const v of [0.3, 0.55]) x.fillRect(0.2 * W, v * H, 0.02 * W, 0.04 * H);   // puertas
    });
  }
  MO.avion = function (o = {}) {
    const blanco = o.color || '#f4f5f7', acento = o.acento || '#1f5fbf', L = 1, R = 0.055;
    const perfil = [[0, 0.5]].concat(MA.arco(0.5 - 0.11, 0.11, PI / 2, 0.02, 10).map(([r, y]) => [r * R / 0.11, y])).concat([[R, 0.2], [R, -0.18], [R * 0.82, -0.3], [R * 0.45, -0.43], [R * 0.18, -0.5], [0, -0.5]]);
    const cuerpo = MA.torno(perfil, 40, 'avion|fuselaje');
    const mAla = (sg) => ala([{ span: sg * 0.05, z: 0.13, y: -0.025, cuerda: 0.27, grosor: 0.13 }, { span: sg * 0.2, z: 0.03, y: -0.012, cuerda: 0.17, grosor: 0.12 }, { span: sg * 0.52, z: -0.16, y: 0.03, cuerda: 0.07, grosor: 0.1 }], 'x', 'avion|ala' + sg);
    const mEst = (sg) => ala([{ span: sg * 0.02, z: -0.33, y: 0.012, cuerda: 0.13, grosor: 0.1 }, { span: sg * 0.2, z: -0.43, y: 0.03, cuerda: 0.05, grosor: 0.1 }], 'x', 'avion|est' + sg);
    const deriva = ala([{ span: 0.03, z: -0.29, y: 0, cuerda: 0.2, grosor: 0.1 }, { span: 0.23, z: -0.43, y: 0, cuerda: 0.07, grosor: 0.1 }], 'y', 'avion|deriva');
    const gondola = MA.torno([[0, 0.09], [0.02, 0.09], [0.034, 0.082], [0.036, 0.05], [0.032, -0.04], [0.02, -0.07], [0, -0.07]], 28, 'avion|gondola');
    const matB = { color: blanco, esp: 0.45, dureza: 50, envolver: 0.15 }, matA = { color: acento, esp: 0.4, dureza: 40 }, matG = { color: '#cfd4db', esp: 0.5, dureza: 50 };
    const motor = (sg) => V.nodo({ pos: [sg * 0.19, -0.065, 0.1], hijos: [
      V.nodo({ malla: gondola, mat: matG, rot: [PI / 2, 0, 0] }),
      V.nodo({ malla: MA.cilindro(0.028, 0.028, 0.004, 24), mat: { tipo: 'plano', color: '#20262e' }, pos: [0, 0, 0.091], rot: [PI / 2, 0, 0] }),
      V.nodo({ malla: MA.caja(0.012, 0.05, 0.08, 0.004, 2), mat: matB, pos: [0, 0.04, -0.01] })] });
    return V.nodo({ nombre: 'avion', pos: o.pos, rot: o.rot, esc: o.esc, m: o.m, hijos: [
      V.nodo({ nombre: 'fuselaje', malla: cuerpo, rot: [PI / 2, 0, 0], mat: Object.assign({ mapa: texFuselaje(acento) }, matB, { color: '#ffffff' }) }),
      V.nodo({ nombre: 'ala_d', malla: mAla(1), mat: matB }), V.nodo({ nombre: 'ala_i', malla: mAla(-1), mat: matB }),
      V.nodo({ malla: mEst(1), mat: matB }), V.nodo({ malla: mEst(-1), mat: matB }),
      V.nodo({ nombre: 'deriva', malla: deriva, mat: matA, pos: [0, 0.03, 0] }),
      motor(1), motor(-1)] });
  };

  // ---------------------------------------------------------------- maniqui articulado
  /* Poses en grados. Convenio (la figura mira hacia +X; vista lateral = camara en +Z):
     tronco: inclinacion hacia delante; cuello; cadera_d/i: flexion (muslo hacia delante); rodilla_d/i: flexion (pierna hacia atras);
     tobillo_d/i; hombro_d/i: flexion (brazo hacia delante); codo_d/i: flexion; abrir: separacion de brazos (abduccion). */
  const POSES = V.poses = {
    de_pie:   { tronco: 0, cuello: 0, cadera_d: 0, cadera_i: 0, rodilla_d: 0, rodilla_i: 0, tobillo_d: 0, tobillo_i: 0, hombro_d: 4, hombro_i: -4, codo_d: 10, codo_i: 10, abrir: 6 },
    sentado:  { tronco: -4, cuello: 0, cadera_d: 90, cadera_i: 88, rodilla_d: 88, rodilla_i: 86, tobillo_d: 0, tobillo_i: 0, hombro_d: 8, hombro_i: 4, codo_d: 58, codo_i: 52, abrir: 8 },
    inclinado:{ tronco: 44, cuello: -14, cadera_d: 96, cadera_i: 94, rodilla_d: 112, rodilla_i: 110, tobillo_d: 18, tobillo_i: 18, hombro_d: 30, hombro_i: 26, codo_d: 50, codo_i: 46, abrir: 6 },
    saludar:  { tronco: 0, cuello: -4, cadera_d: 0, cadera_i: 0, rodilla_d: 0, rodilla_i: 0, tobillo_d: 0, tobillo_i: 0, hombro_d: 150, hombro_i: -4, codo_d: 40, codo_i: 10, abrir: 20 },
    cubrirse: { tronco: 14, cuello: -6, cadera_d: 30, cadera_i: 10, rodilla_d: 40, rodilla_i: 30, tobillo_d: 0, tobillo_i: 0, hombro_d: 20, hombro_i: 165, codo_d: 60, codo_i: 20, abrir: 10 },
    arquero:  { tronco: 4, cuello: 0, cadera_d: 8, cadera_i: -6, rodilla_d: 6, rodilla_i: 4, tobillo_d: 0, tobillo_i: 0, hombro_d: 92, hombro_i: 96, codo_d: 150, codo_i: 4, abrir: 0 },
    pensar:   { tronco: 6, cuello: 12, cadera_d: 0, cadera_i: 0, rodilla_d: 0, rodilla_i: 0, tobillo_d: 0, tobillo_i: 0, hombro_d: 30, hombro_i: 20, codo_d: 140, codo_i: 70, abrir: 4 }
  };
  V.pose = {
    mezclar(a, b, p) { a = typeof a === 'string' ? POSES[a] : a; b = typeof b === 'string' ? POSES[b] : b; const o = {}; for (const k in a) o[k] = a[k] + ((b[k] == null ? a[k] : b[k]) - a[k]) * p; return o; },
    /* Ciclo de andar (fase en vueltas: 0..1 = un paso de cada pierna). */
    andar(fase, amp = 1) { const s = Math.sin(fase * 2 * PI), c = Math.cos(fase * 2 * PI);
      return { tronco: 4 * amp, cuello: -2, cadera_d: 24 * s * amp, cadera_i: -24 * s * amp, rodilla_d: (12 + 28 * Math.max(0, -c)) * amp, rodilla_i: (12 + 28 * Math.max(0, c)) * amp,
        tobillo_d: 0, tobillo_i: 0, hombro_d: -22 * s * amp, hombro_i: 22 * s * amp, codo_d: 20, codo_i: 20, abrir: 6 }; },
    /* Golpe de hacha (fase en vueltas): sube el brazo derecho y lo baja de golpe; el impacto es en fase 0,55. */
    hachazo(fase) { const f = ((fase % 1) + 1) % 1, k = f < 0.45 ? f / 0.45 : (f < 0.55 ? 1 - (f - 0.45) / 0.1 : 0), s = k * k * (3 - 2 * k);
      return { tronco: 18 - 22 * s, cuello: -8, cadera_d: 30, cadera_i: -5, rodilla_d: 25, rodilla_i: 10, tobillo_d: 0, tobillo_i: 0, hombro_d: 50 + 120 * s, hombro_i: 60, codo_d: 20 + 40 * s, codo_i: 70, abrir: 8 }; },
    correr(fase, amp = 1) { const s = Math.sin(fase * 2 * PI), c = Math.cos(fase * 2 * PI);
      return { tronco: 14 * amp, cuello: -8, cadera_d: 50 * s * amp, cadera_i: -50 * s * amp, rodilla_d: (30 + 70 * Math.max(0, -c)) * amp, rodilla_i: (30 + 70 * Math.max(0, c)) * amp,
        tobillo_d: 0, tobillo_i: 0, hombro_d: -50 * s * amp, hombro_i: 50 * s * amp, codo_d: 90, codo_i: 90, abrir: 8 }; }
  };
  /* Medidas (altura total ~1,75). Origen del maniqui = centro de la pelvis (articulacion de las caderas). */
  const MED = V.maniquiMedidas = { muslo: 0.43, pierna: 0.42, pie: 0.21, tronco: 0.46, brazo: 0.29, antebrazo: 0.26, cuello: 0.07, cadera: 0.09, hombro: 0.17, alturaPelvis: 0.9 };
  MO.maniqui = function (o = {}) {
    const P = Object.assign({}, POSES.de_pie, typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || {})), r = (g) => g * D;
    const madera = o.color || '#e2a565', res = o.resaltar || {}, k = MED, Sg = (n) => Math.max(5, Math.round(n * (o.detalle || 1)));   // detalle < 1: menos poligonos (multitudes)
    const col = o.colores || {}, colDe = (n) => col[n] || col[n.replace(/_[di]$/, '')];
    const mapas = o.mapas || {}, mapaDe = (n) => mapas[n] || mapas[n.replace(/_[di]$/, '')];   // mapas: { pecho: <canvas> } (rayas de una camiseta...)
    const mat = (nombre) => { const mp = res[nombre] ? null : mapaDe(nombre);
      return { color: mp ? '#ffffff' : (res[nombre] || colDe(nombre) || madera), mapa: mp || undefined, esp: o.colores ? 0.12 : 0.3, dureza: 26, envolver: 0.25, emision: res[nombre] ? 0.08 : 0 }; };
    const bola = (rad, nombre, pos) => V.nodo({ nombre: nombre + '_art', malla: MA.esfera(Sg(24)), esc: rad, pos: pos || [0, 0, 0], mat: mat(nombre) });
    const pierna = (lado, z) => {
      const nm = (s) => s + '_' + lado;
      return V.nodo({ nombre: nm('cadera'), pos: [0, -0.02, z], rot: [0, -r(P.abrir_piernas || 0) * (z > 0 ? 1 : -1), r(P[nm('cadera')])], hijos: [   // abrir_piernas: a horcajadas (jinete)
        bola(0.068, nm('muslo')),
        V.nodo({ nombre: nm('muslo'), malla: MA.capsula(0.07, 0.052, k.muslo, Sg(28)), mat: mat(nm('muslo')) }),
        V.nodo({ nombre: nm('rodilla'), pos: [0, -k.muslo, 0], rot: [0, 0, -r(P[nm('rodilla')])], hijos: [
          bola(0.05, nm('pierna')),
          V.nodo({ nombre: nm('pierna'), malla: MA.capsula(0.05, 0.037, k.pierna, Sg(28)), mat: mat(nm('pierna')) }),
          V.nodo({ nombre: nm('tobillo'), pos: [0, -k.pierna, 0], rot: [0, 0, r(P[nm('tobillo')])], hijos: [
            bola(0.036, nm('pie')),
            V.nodo({ nombre: nm('pie'), malla: MA.capsula(0.038, 0.03, k.pie, Sg(20)), rot: [0, 0, PI / 2 + 0.12], pos: [-0.03, -0.035, 0], esc: [1, 1, 1.15], mat: mat(nm('pie')) })] })] })] });
    };
    const brazo = (lado, z) => {
      const nm = (s) => s + '_' + lado, ab = -r(P.abrir) * (z > 0 ? 1 : -1);
      return V.nodo({ nombre: nm('hombro'), pos: [0, k.tronco - 0.07, z], rot: [ab, 0, r(P[nm('hombro')])], hijos: [
        bola(0.048, nm('brazo')),
        V.nodo({ nombre: nm('brazo'), malla: MA.capsula(0.045, 0.036, k.brazo, Sg(24)), mat: mat(nm('brazo')) }),
        V.nodo({ nombre: nm('codo'), pos: [0, -k.brazo, 0], rot: [0, 0, r(P[nm('codo')])], hijos: [
          bola(0.036, nm('antebrazo')),
          V.nodo({ nombre: nm('antebrazo'), malla: MA.capsula(0.036, 0.028, k.antebrazo, Sg(24)), mat: mat(nm('antebrazo')) }),
          V.nodo({ nombre: nm('mano'), malla: MA.capsula(0.034, 0.026, 0.09, Sg(18)), pos: [0, -k.antebrazo - 0.02, 0], esc: [0.8, 1, 1.15], mat: mat(nm('mano')) })] })] });
    };
    const tronco = V.nodo({ nombre: 'tronco', rot: [0, 0, -r(P.tronco)], hijos: [
      V.nodo({ nombre: 'vientre', malla: MA.esfera(Sg(32)), pos: [0.0, 0.13, 0], esc: [0.1, 0.12, 0.13], mat: mat('vientre') }),
      V.nodo({ nombre: 'pecho', malla: MA.esfera(Sg(32)), pos: [0.0, 0.33, 0], esc: [0.12, 0.17, 0.17], mat: mat('pecho') }),
      bola(0.05, 'cintura', [0, 0.06, 0]),
      V.nodo({ nombre: 'cuello', pos: [0, k.tronco + 0.02, 0], rot: [0, 0, -r(P.cuello)], hijos: [
        V.nodo({ malla: MA.capsula(0.032, 0.035, k.cuello, Sg(16)), pos: [0, k.cuello, 0], mat: mat('cuello') }),
        V.nodo({ nombre: 'cabeza', malla: MA.esfera(Sg(32)), pos: [0.015, k.cuello + 0.11, 0], esc: [0.095, 0.125, 0.09], mat: mat('cabeza') })] }),
      brazo('d', 0.19), brazo('i', -0.19)] });
    const pelvis = V.nodo({ nombre: 'pelvis', malla: MA.esfera(Sg(32)), pos: [0, 0.0, 0], esc: [0.12, 0.1, 0.16], mat: mat('pelvis') });
    /* equipo: piezas colgadas de una articulacion: { cuello, tronco, hombro_d, codo_d, codo_i, cadera_d, rodilla_i, maniqui (pelvis), ... }: [nodos] */
    const raiz = V.nodo({ nombre: 'maniqui', pos: (o.pos || [0, 0, 0]).slice(), rot: o.rot, esc: o.esc, hijos: [pelvis, tronco, pierna('d', 0.085), pierna('i', -0.085)] });
    /* apoyo: 'pies' -> se sube o baja la figura para que el pie mas bajo toque el suelo (y = o.suelo, 0 por defecto);
       piesX: ademas se desplaza en X para que los pies queden en esa X (los pies no patinan al cambiar de pose). */
    if (o.apoyo === 'pies') {
      let minY = 1e9, sx = 0, n = 0;
      for (const e of V.aplanar(raiz)) if (/^pie_/.test(e.n.nombre || '')) { const s = Math.hypot(e.M[4], e.M[5], e.M[6]);
        for (const q of [[0, 0, 0], [0, -k.pie, 0], [0, -k.pie * 0.5, 0]]) { const w = V.m4.ap(e.M, q); minY = Math.min(minY, w[1] - 0.034 * s); } const c = V.m4.ap(e.M, [0, -k.pie * 0.5, 0]); sx += c[0]; n++; }
      raiz.pos[1] += (o.suelo || 0) - minY; if (o.piesX != null && n) raiz.pos[0] += o.piesX - sx / n;
    }
    if (o.equipo) { const buscar = (n, nom) => { if (!n) return null; if (n.nombre === nom) return n; for (const h of n.hijos || []) { const r = buscar(h, nom); if (r) return r; } return null; };
      for (const k in o.equipo) { const g = k === 'maniqui' ? raiz : buscar(raiz, k); if (!g) throw new Error('maniqui: no hay articulacion ' + k); g.hijos = (g.hijos || []).concat(o.equipo[k]); } }
    return raiz;
  };

  // ---------------------------------------------------------------- silla
  MO.silla = function (o = {}) {
    const c = o.color || '#9b5a2e', m = { color: c, esp: 0.35, dureza: 30, envolver: 0.2 }, a = 0.46, w = 0.46, d = 0.44, g = 0.035, h = [];
    h.push(V.nodo({ malla: MA.caja(d, 0.04, w, 0.01), mat: m, pos: [0, a, 0] }));
    for (const x of [-1, 1]) for (const z of [-1, 1]) { const alto = x < 0 ? 0.95 : a; h.push(V.nodo({ malla: MA.caja(g, alto, g, 0.008), mat: m, pos: [x * (d / 2 - g / 2), alto / 2, z * (w / 2 - g / 2)] })); }
    h.push(V.nodo({ malla: MA.caja(g * 0.8, 0.07, w - g, 0.008), mat: m, pos: [-d / 2 + g / 2, 0.88, 0] }));
    h.push(V.nodo({ malla: MA.caja(g * 0.8, 0.05, w - g, 0.008), mat: m, pos: [-d / 2 + g / 2, 0.72, 0] }));
    for (const z of [-1, 1]) h.push(V.nodo({ malla: MA.caja(d - g, 0.025, 0.02, 0.006), mat: m, pos: [0, 0.16, z * (w / 2 - g / 2)] }));
    return V.nodo({ nombre: 'silla', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };

  // ---------------------------------------------------------------- nube, arbol, sala
  MO.nube = function (o = {}) {
    const sem = o.semilla || 'nube', rng = VE.rng(sem), partes = [];
    for (let i = 0; i < (o.bolas || 9); i++) { const t = i / ((o.bolas || 9) - 1) - 0.5, r = 0.32 + 0.22 * (1 - Math.abs(t) * 1.6) + rng() * 0.1;
      partes.push({ malla: MA.esfera(24), m: V.m4.mul(V.m4.tras(t * 1.7, r * 0.45 + rng() * 0.1, (rng() - 0.5) * 0.4), V.m4.esc(r, r * 0.85, r)) }); }
    return V.nodo({ nombre: 'nube', pos: o.pos, rot: o.rot, esc: o.esc, malla: MA.fusionar(partes, 'nube|' + sem + '|' + (o.bolas || 9)),
      mat: { color: o.color || '#ffffff', esp: 0.05, envolver: 0.6, borde: 0.8, alfa: o.alfa } });
  };
  MO.arbol = function (o = {}) {
    const sem = o.semilla || 'arbol', rng = VE.rng(sem), tronco = { color: '#6b4a2f', envolver: 0.2 }, hoja = { color: o.color || (o.tipo === 'pino' ? '#2f6b45' : '#4f8f3e'), envolver: 0.35, esp: 0.08, borde: 0.6 }, h = [];
    if (o.tipo === 'pino') {
      h.push(V.nodo({ malla: MA.cilindro(0.06, 0.08, 0.5, 14), mat: tronco, pos: [0, 0.25, 0] }));
      for (let i = 0; i < 4; i++) h.push(V.nodo({ malla: MA.cilindro(0.02, 0.5 - i * 0.1, 0.55, 20), mat: hoja, pos: [0, 0.6 + i * 0.32, 0], rot: [0, rng() * 3, 0] }));
    } else {
      h.push(V.nodo({ malla: MA.cilindro(0.06, 0.1, 1, 14), mat: tronco, pos: [0, 0.5, 0] }));
      const partes = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 2 * PI + rng(), r = 0.32 + rng() * 0.15, d = i ? 0.3 : 0;
        partes.push({ malla: MA.esfera(20), m: V.m4.mul(V.m4.tras(Math.cos(a) * d, 1.25 + (i ? rng() * 0.3 : 0.15), Math.sin(a) * d), V.m4.esc(r)) }); }
      h.push(V.nodo({ malla: MA.fusionar(partes, 'copa|' + sem), mat: hoja }));
    }
    return V.nodo({ nombre: 'arbol', pos: o.pos, rot: o.rot, esc: o.esc, hijos: h });
  };
  function texTarima(c) {
    return V.textura('tarima|' + c, 1024, 1024, (x, W, H) => {
      const r = VE.rng('tarima'); x.fillStyle = c; x.fillRect(0, 0, W, H); const n = 8;
      for (let i = 0; i < n; i++) { let y = 0; while (y < H) { const l = H * (0.3 + r() * 0.5); x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,220,180'},${0.04 + r() * 0.06})`; x.fillRect(i * W / n, y, W / n, l);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(i * W / n, y, W / n, 2); y += l; }
        x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(i * W / n, 0, 2, H); }
      for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; x.fillRect(r() * W, r() * H, 1 + r() * 2, 10 + r() * 60); }
    });
  }
  MO.sala = function (o = {}) {
    const suelo = o.suelo || '#7a4a2c', pared = o.pared || '#5a3a52', a = o.ancho || 12, f = o.fondo || 8;
    return V.nodo({ nombre: 'sala', hijos: [
      V.nodo({ nombre: 'suelo', malla: MA.plano(a, f, 1), mat: { color: '#ffffff', mapa: texTarima(suelo), esp: 0.15, dureza: 20, envolver: 0.1, borde: 0 } }),
      V.nodo({ nombre: 'pared', malla: MA.plano(a, 6, 1), pos: [0, 3, -f / 2 + 0.6], rot: [PI / 2, 0, 0], mat: { color: pared, esp: 0.02, envolver: 0.3, borde: 0 } }),
      V.nodo({ nombre: 'zocalo', malla: MA.caja(a, 0.12, 0.03, 0.005), pos: [0, 0.06, -f / 2 + 0.62], mat: { color: R(pared) } })] });
  };
  const R = (c) => { const v = VE.color.aRGB(c); return `rgb(${v[0] * 0.55 | 0},${v[1] * 0.55 | 0},${v[2] * 0.55 | 0})`; };
})(window.VE = window.VE || {});
