'use strict';
// ESCENA 'tierra_plana' · Texturas procedurales: «¿Qué pasaría si la Tierra fuera plana?» (disco → agua al centro → roca que se redondea → Ceres → Tierra real).
// Se carga con:  node bin/estilo.cjs tierra_plana <salida> --extra estilos/escena_tierra_plana.js
// Texturas horneadas una vez (ruido fractal) y muestreadas por píxel: sin ctx.filter ni shadowBlur por fotograma.
ESC.tierra_plana = (() => {
  const LW = 540, LH = 960, SEA = .47, D_EDGE = .05;
  const SUN = norm([-0.55, 0.62, 0.55]);
  const TAU = Math.PI * 2;
  let BK = null, cvs = null, g2 = null, img = null;

  // ---------- utilidades ----------
  const bil = (A, w, h, u, v, wrap) => {
    if (wrap) { u = ((u % w) + w) % w; } else u = u < 0 ? 0 : u > w - 1.001 ? w - 1.001 : u;
    v = v < 0 ? 0 : v > h - 1.001 ? h - 1.001 : v;
    const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, x1 = wrap ? (x0 + 1) % w : x0 + 1, i0 = y0 * w, i1 = (y0 + 1) * w;
    return (A[i0 + x0] * (1 - fx) + A[i0 + x1] * fx) * (1 - fy) + (A[i1 + x0] * (1 - fx) + A[i1 + x1] * fx) * fy;
  };
  const ss = (a, b, x) => { const t = (x - a) / (b - a); return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); };
  const mx3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function bake() {
    if (BK) return BK;
    const DN = 1024, SW = 1024, SH = 512, CW = 512, CH = 256;
    const HD = new Float32Array(DN * DN), MD = new Float32Array(DN * DN), CD = new Float32Array(DN * DN);
    for (let i = 0; i < DN; i++) for (let j = 0; j < DN; j++) {
      const x = j / DN * 2 - 1, z = i / DN * 2 - 1, k = i * DN + j;
      HD[k] = fbm3(x * 2.1 + 7, .5, z * 2.1, 6); MD[k] = fbm3(x * 1.7 + 90, 2.5, z * 1.7, 4); CD[k] = ss(.5, .7, fbm3(x * 3.2 + 30, 5, z * 3.2, 5));
    }
    const HS = new Float32Array(SW * SH), MS = new Float32Array(SW * SH), CS = new Float32Array(SW * SH);
    for (let i = 0; i < SH; i++) { const lat = (.5 - (i + .5) / SH) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let j = 0; j < SW; j++) { const lon = (j + .5) / SW * TAU, n0 = cl * Math.cos(lon), n2 = cl * Math.sin(lon), k = i * SW + j;
        HS[k] = fbm3(n0 * 1.6 + 7, sl * 1.6, n2 * 1.6, 6); MS[k] = fbm3(n0 * 1.4 + 90, sl * 1.4, n2 * 1.4, 4); CS[k] = ss(.5, .68, fbm3(n0 * 2.6 + 30, sl * 5.2, n2 * 2.6, 5)); } }
    // Ceres: albedo gris con cráteres y mancha brillante (tipo Occator)
    const HC = new Float32Array(CW * CH);
    for (let i = 0; i < CH; i++) { const lat = (.5 - (i + .5) / CH) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
      for (let j = 0; j < CW; j++) { const lon = (j + .5) / CW * TAU, n = [cl * Math.cos(lon), sl, cl * Math.sin(lon)];
        let a = .30 + .17 * fbm3(n[0] * 5 + 11, n[1] * 5, n[2] * 5, 5);
        for (const [sc, ofs] of [[6, 3], [13, 9]]) { const p = [n[0] * sc + ofs, n[1] * sc + ofs, n[2] * sc + ofs], c0 = p.map(Math.floor);
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const cx = c0[0] + dx, cy = c0[1] + dy, cz = c0[2] + dz;
            if (hash3(cx + 5, cy, cz) > .55) continue;
            const q = [cx + hash3(cx, cy + 17, cz), cy + hash3(cx + 31, cy, cz), cz + hash3(cx, cy, cz + 47)], rr = .16 + .3 * hash3(cx, cy, cz + 9), d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / rr;
            if (d < 1) a *= 1 - .26 * (1 - d * d); else if (d < 1.22) a *= 1 + .18 * (1 - (d - 1) / .22); } }
        const dl = Math.min(Math.abs(lon - 4.17), TAU - Math.abs(lon - 4.17)), da = Math.hypot(dl * cl, lat - .345); a += .45 * ss(.07, 0, da) + .2 * ss(.12, 0, Math.hypot(dl * cl - .1, lat - .3));
        HC[i * CW + j] = a; } }
    // estrellas
    const STW = 2048, STH = 1024, ST = new Float32Array(STW * STH), R = rng(5);
    for (let k = 0; k < 5200; k++) { const x = R() * STW | 0, y = R() * STH | 0, b = Math.pow(R(), 3.2) * .9 + .1; ST[y * STW + x] = Math.max(ST[y * STW + x], b);
    }
    // lugar de océano en el disco (para el plano del agua)
    let best = 9, ox = .4, oz = .3;
    for (let a = 0; a < 48; a++) for (const rr of [.3, .4, .5, .6]) { const x = rr * Math.cos(a / 48 * TAU), z = rr * Math.sin(a / 48 * TAU); let s = 0;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) s += HD[Math.min(DN - 1, Math.max(0, ((z * .5 + .5) * DN | 0) + dy * 14)) * DN + Math.min(DN - 1, Math.max(0, ((x * .5 + .5) * DN | 0) + dx * 14))];
      s /= 81; if (s < best) { best = s; ox = x; oz = z; } }
    BK = { DN, SW, SH, CW, CH, HD, MD, CD, HS, MS, CS, HC, ST, STW, STH, ox, oz };
    cvs = mk(LW, LH); g2 = cvs.getContext('2d'); img = g2.createImageData(LW, LH);
    return BK;
  }

  // ---------- color del terreno ----------
  function ocean(h) { return mx3([26, 112, 150], [5, 26, 66], ss(0, .16, SEA - h)); }
  function tierra(h, m) {
    let c = mx3([58, 106, 46], [152, 134, 84], ss(.40, .66, m + (h - .55) * .55));
    c = mx3(c, [214, 196, 146], .75 * ss(SEA + .018, SEA + .004, h));
    if (h > .62) c = mx3(c, [120, 106, 94], ss(.62, .70, h));
    if (h > .72) c = mx3(c, [238, 242, 248], ss(.72, .78, h));
    return c;
  }
  const lecho = (h, m) => mx3([84, 66, 48], [150, 128, 94], ss(.30, .50, h + (m - .5) * .3));

  // ---------- cámara con splines Hermite sobre claves ----------
  function interpKeys(K, t, f) {
    let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
    const a = K[i], b = K[i + 1], p = K[Math.max(0, i - 1)], q = K[Math.min(K.length - 1, i + 2)], h = b.t - a.t, s = clamp((t - a.t) / h, 0, 1);
    const h00 = 2 * s ** 3 - 3 * s * s + 1, h10 = s ** 3 - 2 * s * s + s, h01 = -2 * s ** 3 + 3 * s * s, h11 = s ** 3 - s * s;
    const one = (va, vb, vp, vq) => { const m0 = (vb - vp) / (b.t - p.t) * h * (i > 0 ? 1 : 0), m1 = (vq - va) / (q.t - a.t) * h * (i < K.length - 2 ? 1 : 0); return h00 * va + h10 * m0 + h01 * vb + h11 * m1; };
    return f(a, b, p, q, one);
  }
  const normN = v => norm(v);
  function claves() {
    const { ox, oz } = bake(), N = normN([.30, .35, .89]), T = normN(cross([0, 1, 0], N));
    const E = (alt) => mul(N, 1 + alt), L = (alt, down) => { const e = E(alt); return add(add(e, mul(T, 1)), mul(N, -down)); };
    return [
      { t: 0, e: [.55, .012, .8], g: [.45, .004, -.5], fov: 62, roll: 0 },
      { t: 1.8, e: [.5, .013, .45], g: [.45, .0035, -.5], fov: 62, roll: -9 },
      { t: 3.5, e: [.46, .016, .12], g: [.5, .003, -.5], fov: 62, roll: -17 },
      { t: 5.0, e: [.4, .08, -.25], g: [.2, -.01, -.8], fov: 60, roll: -11 },
      { t: 6.6, e: [.1, .9, 1.5], g: [0, -.1, -.2], fov: 54, roll: -3 },
      { t: 8.6, e: [.5, 2.0, 3.9], g: [0, -.05, 0], fov: 52, roll: 0 },
      { t: 11.8, e: [-.6, 2.0, 3.9], g: [0, 0, 0], fov: 52, roll: 0 },
      { t: 15.5, e: [-.1, 1.7, 3.9], g: [.1, 0, 0], fov: 52, roll: 0 },
      { t: 18.4, e: [.2, 1.2, 3.0], g: [.2, 0, .05], fov: 50, roll: 0 },
      { t: 21.7, e: [.35, .55, 1.8], g: [.3, .06, 0], fov: 48, roll: 0 },
      { t: 25.1, e: [.5, .36, 2.45], g: [.5, .1, 0], fov: 52, roll: 0 },
      { t: 28.2, e: [.5, .34, 2.4], g: [.5, .1, 0], fov: 52, roll: 0 },
      { t: 32.8, e: [.56, .3, 2.3], g: [.56, .11, 0], fov: 52, roll: 0 },
      { t: 33.3, e: [ox + .5, .25, oz + .9], g: [ox, 0, oz], fov: 54, roll: 0 },
      { t: 35.6, e: [ox + .08, .05, oz + .32], g: [ox, .0, oz - .1], fov: 58, roll: 0 },
      { t: 37.6, e: [0, .30, 1.9], g: [0, .03, 0], fov: 50, roll: 0 },
      { t: 40.1, e: [.5, .22, 1.5], g: [0, .05, 0], fov: 50, roll: 0 },
      { t: 44.8, e: [1.1, .16, .8], g: [.3, .03, 0], fov: 55, roll: 0 },
      { t: 48.8, e: [.95, .08, .55], g: [.55, .02, 0], fov: 58, roll: 0 },
      { t: 50.4, e: [1.4, .5, 1.3], g: [.3, 0, 0], fov: 52, roll: 0 },
      { t: 52.5, e: [2.2, 1.5, 3.0], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 54.5, e: [3.2, 1.2, 3.2], g: [0, 0, 0], fov: 48, roll: 0 },
      { t: 56.5, e: [2.6, .6, 3.4], g: [0, 0, 0], fov: 48, roll: 0 },
      { t: 58.9, e: [-.9, .7, 3.9], g: [0, 0, 0], fov: 48, roll: 0 },
      { t: 61.2, e: [-2.2, .5, 3.4], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 63.5, e: [-1.0, .8, 4.6], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 66.2, e: [1.2, .6, 4.6], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 68.2, e: [.2, .05, 5.2], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 70.5, e: [-1.5, .5, 5.0], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 72.3, e: mul(N, 4.6), g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 74.3, e: E(.9), g: mul(L(.9, .5), .55), fov: 54, roll: 0 },
      { t: 75.8, e: E(.14), g: L(.14, .14), fov: 62, roll: 0 },
      { t: 77.5, e: E(.035), g: L(.035, .018), fov: 66, roll: 0 },
      { t: 79.2, e: E(.8), g: mul(N, .1), fov: 56, roll: 0 },
      { t: 81.0, e: [2.2, 1.0, 4.3], g: [0, 0, 0], fov: 50, roll: 0 },
      { t: 85, e: [-1.8, .9, 4.6], g: [0, 0, 0], fov: 50, roll: 0 },
    ];
  }
  let KS = null;
  function camaraT(t) {
    if (!KS) KS = claves();
    const C = interpKeys(KS, t, (a, b, p, q, one) => ({
      e: [0, 1, 2].map(k => one(a.e[k], b.e[k], p.e[k], q.e[k])), g: [0, 1, 2].map(k => one(a.g[k], b.g[k], p.g[k], q.g[k])),
      fov: one(a.fov, b.fov, p.fov, q.fov), roll: one(a.roll, b.roll, p.roll, q.roll) }));
    if (t > 72) { const L = Math.hypot(...C.e); if (L < 1.03) C.e = mul(C.e, 1.03 / L); } // la cámara nunca entra en el planeta
    return C;
  }

  // ---------- cielo ----------
  const hazeC = [172, 200, 228], midC = [80, 130, 204], deepC = [14, 32, 88];
  function atmo(e) { return e < .14 ? mx3(hazeC, midC, ss(0, .14, e)) : mx3(midC, deepC, ss(.14, .55, e)); }

  // ---------- pasada de fondo: estrellas + atmósfera ----------
  function pasoFondo(D, cam, ground) {
    const { ST, STW, STH } = BK, { f, r, u, fl } = cam;
    for (let py = 0; py < LH; py++) for (let px = 0; px < LW; px++) {
      const dx = (px + .5 - LW / 2) / fl, dy = -(py + .5 - LH / 2) / fl;
      let rx = f[0] + r[0] * dx + u[0] * dy, ry = f[1] + r[1] * dx + u[1] * dy, rz = f[2] + r[2] * dx + u[2] * dy; const il = 1 / Math.hypot(rx, ry, rz); rx *= il; ry *= il; rz *= il;
      const lon = Math.atan2(rz, rx), lat = Math.asin(ry), sx = (lon / TAU + .5) * STW, sy = (.5 - lat / Math.PI) * STH;
      const sv = ST[(sy | 0) * STW + (sx | 0)] * 255, i = (py * LW + px) * 4;
      let c0 = 2 + sv * .96, c1 = 3 + sv * .97, c2 = 8 + sv;
      if (ground && ground.K > 0) {
        const el = rx * ground.up[0] + ry * ground.up[1] + rz * ground.up[2] - ground.eh;
        if (el > -.05) { const w = ground.K * ss(-.05, .0, el) * (1 - ss(.12, .6, el)), a = atmo(Math.max(0, el)), sg = Math.pow(Math.max(0, rx * SUN[0] + ry * SUN[1] + rz * SUN[2]), 24) * 55;
          c0 = c0 + (a[0] + sg - c0) * w; c1 = c1 + (a[1] + sg * .9 - c1) * w; c2 = c2 + (a[2] + sg * .7 - c2) * w; } }
      D[i] = c0; D[i + 1] = c1; D[i + 2] = c2; D[i + 3] = 255;
    }
  }

  // ---------- pasada del disco ----------
  function pasoDisco(D, cam, t, par) {
    const { HD, MD, CD, DN } = BK, { f, r, u, fl, e } = cam, ro = e;
    const s = par.s, Rw = .5, Mh = .09, th = par.th, ct = Math.cos(th), st = Math.sin(th), sx = SUN[0] * ct - SUN[2] * st, sz = SUN[0] * st + SUN[2] * ct, sunT = [sx, SUN[1], sz];
    const alt = Math.max(0, e[1]), atmoK = Math.exp(-alt * 22), ds = ss(0, 1, s), yb = s > .001 ? Mh * s + .002 : 0, Mpk = s * Mh;
    const M = (q) => q < Rw * Rw ? Mpk * Math.pow(1 - q / (Rw * Rw), 1.5) : 0;
    const dis = par.dis, tcl = t * .004;
    for (let py = 0; py < LH; py++) for (let px = 0; px < LW; px++) {
      const dx = (px + .5 - LW / 2) / fl, dy = -(py + .5 - LH / 2) / fl;
      let rx = f[0] + r[0] * dx + u[0] * dy, ry = f[1] + r[1] * dx + u[1] * dy, rz = f[2] + r[2] * dx + u[2] * dy; const il = 1 / Math.hypot(rx, ry, rz); rx *= il; ry *= il; rz *= il;
      let hit = 0, X = 0, Z = 0, tt = 0;
      if (ry < 0) {
        let t0 = ro[1] > yb ? (yb - ro[1]) / ry : 0, t1 = -ro[1] / ry;
        if (yb > 0) { // marcha sobre el montículo de agua
          let a = t0, b = t1, found = false, ya, y, k;
          for (k = 0; k < 26; k++) { const tm = a + (b - a) * ((k + 1) / 26), x = ro[0] + rx * tm, z = ro[2] + rz * tm; if (ro[1] + ry * tm < M(x * x + z * z)) { b = tm; a = a + (b - a) * 0; found = true; a = a + ((k / 26) * (b - t0)) * 0; a = t0 + (b - t0) * (k / (k + 1)); break; } }
          if (found) { for (k = 0; k < 6; k++) { const tm = (a + b) * .5, x = ro[0] + rx * tm, z = ro[2] + rz * tm; if (ro[1] + ry * tm < M(x * x + z * z)) b = tm; else a = tm; } tt = b; }
          else tt = t1;
        } else tt = t1;
        if (tt > 0) { X = ro[0] + rx * tt; Z = ro[2] + rz * tt; if (X * X + Z * Z <= 1) hit = 1; }
      }
      if (!hit) { // canto del disco
        const a = rx * rx + rz * rz, b = ro[0] * rx + ro[2] * rz, c = ro[0] * ro[0] + ro[2] * ro[2] - 1;
        if (a > 1e-9 && c > 0) { const dd = b * b - a * c; if (dd > 0) { const t2 = (-b - Math.sqrt(dd)) / a, y2 = ro[1] + ry * t2; if (t2 > 0 && y2 < Mpk && y2 > -D_EDGE) { hit = 2; tt = t2; X = ro[0] + rx * t2; Z = ro[2] + rz * t2; } } }
      }
      if (!hit) continue;
      const i = (py * LW + px) * 4; let rC, gC, bC;
      if (dis > 0) { const nz = fbm3(X * 5 + 3, hit === 2 ? ro[1] + ry * tt : 0, Z * 5, 3); if (nz < dis) continue; var borde = ss(dis + .07, dis, nz); }
      if (hit === 2) {
        const y = ro[1] + ry * tt, nxw = X, nzw = Z, nl = Math.hypot(nxw, nzw), d = Math.max(0, (nxw * SUN[0] + nzw * SUN[2]) / nl * .8 + .2);
        const band = vnoise3(0, y * 90, Math.atan2(Z, X) * 3), mat = mx3([92, 72, 56], [136, 110, 78], band);
        const tcol = ss(.0, -D_EDGE, y); const sh = .22 + 1.0 * d; rC = mat[0] * sh * (1 - .3 * tcol); gC = mat[1] * sh * (1 - .3 * tcol); bC = mat[2] * sh * (1 - .3 * tcol);
      } else {
        const q = X * X + Z * Z, rad = Math.sqrt(q), U = X * ct - Z * st, V = X * st + Z * ct, iu = (U * .5 + .5) * DN, iv = (V * .5 + .5) * DN;
        let h = bil(HD, DN, DN, iu, iv, false), m = bil(MD, DN, DN, iu, iv, false);
        const det = vnoise3(U * 70, .3, V * 70) - .5; h += det * .03;
        const gx = bil(HD, DN, DN, iu + 1.5, iv, false) - bil(HD, DN, DN, iu - 1.5, iv, false), gz = bil(HD, DN, DN, iu, iv + 1.5, false) - bil(HD, DN, DN, iu, iv - 1.5, false);
        let nx = -gx * 22 * (h > SEA ? 1 : .25), ny = 1, nz = -gz * 22 * (h > SEA ? 1 : .25);
        const smo = ss(SEA + .004, SEA - .004, h);
        // agua presente: océano natural que se va y montículo central
        const wCen = ss(Rw + .03, Rw - .03, rad) * ds, wNat = smo * (1 - ds), wet = Math.max(wNat, wCen);
        let col;
        if (rad < .1 + .02 * (vnoise3(U * 20, 1, V * 20) - .5) * 4) { col = [238, 242, 250]; nx *= .3; nz *= .3; }
        else if (smo > .5 && ds > .5 && rad > Rw) col = lecho(h, m);
        else if (smo > .5 && wNat < .5 && wCen < .5) col = lecho(h, m);
        else col = tierra(h, m);
        let dk = .88 + .24 * (det + .5); if (tt < .9) { const nr = ss(.9, .05, tt), d2 = vnoise3(U * 380, .7, V * 380) - .5, d3 = vnoise3(U * 1400, 1.3, V * 1400) - .5; dk += nr * (.5 * d2 + .35 * d3) + nr * .0; }
        col = col.map(v => v * dk);
        const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        let ndl = Math.max(0, nx * sunT[0] + ny * sunT[1] + nz * sunT[2]);
        const cX = (iu + (-sunT[0] / sunT[1]) * .03 * DN * .5) + tcl * DN * 4, cZ = iv + (-sunT[2] / sunT[1]) * .03 * DN * .5;
        const cc = bil(CD, DN, DN, cX + 0, cZ, false) * (1 - par.nub), shd = 1 - .5 * cc;
        let R0 = col[0] * (.26 * .85 + 1.35 * ndl * shd), G0 = col[1] * (.26 * 1.1 + 1.2 * ndl * shd), B0 = col[2] * (.26 * 1.5 + 1.0 * ndl * shd);
        if (wet > .02 && wet > 0) {
          // superficie de agua
          let wnx = 0, wnz = 0, wm = 0, mdr = 0;
          if (rad < Rw && ds > 0) { wm = M(q); mdr = -Mpk * 1.5 * Math.sqrt(Math.max(0, 1 - q / (Rw * Rw))) * 2 * rad / (Rw * Rw); wnx = -(X / (rad + 1e-6)) * mdr; wnz = -(Z / (rad + 1e-6)) * mdr; }
          const vel = .22 * ds * (1 - ss(.9, 1, ds)) + .05 * ds, rr0 = rad + vel * t, ang = Math.atan2(Z, X), fx = rr0 * Math.cos(ang), fz = rr0 * Math.sin(ang);
          const rp = (vnoise3(fx * 15, t * .05, fz * 15) - .5), rp2 = (vnoise3(fx * 15 + 7, t * .05, fz * 15 + 7) - .5);
          const wn = norm([wnx + rp * .22, 1, wnz + rp2 * .22]), cosv = Math.max(0, -(rx * wn[0] + ry * wn[1] + rz * wn[2])), Fr = .02 + .98 * Math.pow(1 - cosv, 5);
          const dep = (SEA - h) * 1.2 * wNat + (wm * 6 + .03) * wCen, body = mx3([34, 128, 146], [4, 30, 78], ss(0, .24, dep));
          const dn = Math.max(0, wn[0] * SUN[0] + wn[1] * SUN[1] + wn[2] * SUN[2]);
          const rry = ry - 2 * wn[1] * (rx * wn[0] + ry * wn[1] + rz * wn[2]), rrx = rx - 2 * wn[0] * (rx * wn[0] + ry * wn[1] + rz * wn[2]), rrz = rz - 2 * wn[2] * (rx * wn[0] + ry * wn[1] + rz * wn[2]);
          const sk = atmo(Math.max(0, rry) * .8), sp = Math.pow(Math.max(0, rrx * SUN[0] + rry * SUN[1] + rrz * SUN[2]), 300) * 14 + Math.pow(Math.max(0, rrx * SUN[0] + rry * SUN[1] + rrz * SUN[2]), 30) * .5;
          const Fq = Fr * .85;
          let wr = (body[0] * (.28 + .9 * dn * shd)) * (1 - Fq) + sk[0] * Fq + sp * 255 * .9, wg = (body[1] * (.28 + .9 * dn * shd)) * (1 - Fq) + sk[1] * Fq + sp * 255 * .85, wb = (body[2] * (.28 + .9 * dn * shd)) * (1 - Fq) + sk[2] * Fq + sp * 255 * .7;
          const foam = ds > 0 ? ss(.035, 0, Math.abs(rad - Rw)) * ss(.45, .65, rp + .5) * .85 : 0;
          if (foam > 0) { wr += (240 - wr) * foam; wg += (244 - wg) * foam; wb += (248 - wb) * foam; }
          const k2 = wet > 1 ? 1 : wet; // transición agua↔lecho
          R0 += (wr - R0) * k2; G0 += (wg - G0) * k2; B0 += (wb - B0) * k2;
        }
        // nubes
        const cn = Math.max(0, cc);
        if (cn > .02) { const cb = .6 + .55 * ndl; R0 += (255 * cb * .96 - R0) * cn * .88; G0 += (255 * cb * .97 - G0) * cn * .88; B0 += (255 * cb - B0) * cn * .88; }
        rC = R0; gC = G0; bC = B0;
      }
      if (atmoK > .02) { const hz = (1 - Math.exp(-tt * .5)) * atmoK * .85; rC += (hazeC[0] * .95 - rC) * hz; gC += (hazeC[1] * .95 - gC) * hz; bC += (hazeC[2] - bC) * hz; }
      if (dis > 0 && borde > 0) { rC += (140 - rC) * borde; gC += (210 - gC) * borde; bC += (255 - bC) * borde; }
      D[i] = rC; D[i + 1] = gC; D[i + 2] = bC; D[i + 3] = 255;
    }
  }

  // ---------- pasada de esfera (Ceres o Tierra, con aplastamiento opcional) ----------
  function pasoEsfera(D, cam, t, par) {
    const { HS, MS, CS, SW, SH, HC, CW, CH } = BK, { f, r, u, fl, e } = cam, ro = e, kind = par.kind, a = par.a, fy = 1 - (par.obl || 0), spin = par.spin;
    const alt = Math.hypot(ro[0], ro[1], ro[2]) - 1, upL = norm(ro), eh = -Math.sqrt(Math.max(0, 1 - 1 / Math.pow(1 + Math.max(alt, 1e-4), 2)));
    const atmoK = kind === 'earth' ? Math.exp(-Math.max(0, alt) * 18) : 0;
    const roy = ro[1] / fy;
    for (let py = 0; py < LH; py++) for (let px = 0; px < LW; px++) {
      const dx = (px + .5 - LW / 2) / fl, dy = -(py + .5 - LH / 2) / fl;
      let rx = f[0] + r[0] * dx + u[0] * dy, ry = f[1] + r[1] * dx + u[1] * dy, rz = f[2] + r[2] * dx + u[2] * dy; const il = 1 / Math.hypot(rx, ry, rz); rx *= il; ry *= il; rz *= il;
      const qx = rx, qy = ry / fy, qz = rz, A = qx * qx + qy * qy + qz * qz, B = ro[0] * qx + roy * qy + ro[2] * qz, C = ro[0] * ro[0] + roy * roy + ro[2] * ro[2] - 1, dd = B * B - A * C;
      const i = (py * LW + px) * 4;
      if (dd <= 0 || (-B - Math.sqrt(dd)) / A <= 0) {
        if (kind === 'earth' && alt > .25) { // halo atmosférico (solo visto desde lejos)
          const tc = -(ro[0] * qx + roy * qy + ro[2] * qz) / A; if (tc > 0) { const cx = ro[0] + qx * tc, cy = roy + qy * tc, cz = ro[2] + qz * tc, d = Math.hypot(cx, cy, cz);
            if (d < 1.14 && d > .98) { const k = Math.pow(clamp((1.14 - d) / .14), 2.4), lit = clamp((cx * SUN[0] + cy * fy * SUN[1] + cz * SUN[2]) / (d) * .8 + .45), w = k * lit * .95 * a;
              D[i] += (90 - D[i]) * w; D[i + 1] += (150 - D[i + 1]) * w; D[i + 2] += (255 - D[i + 2]) * w; } } }
        continue;
      }
      const tt = (-B - Math.sqrt(dd)) / A, X = ro[0] + qx * tt, Y = roy + qy * tt, Z = ro[2] + qz * tt;
      let nx = X, ny = Y / fy, nz = Z; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const cs = Math.cos(spin), sn = Math.sin(spin), tx = X * cs - Z * sn, tz = X * sn + Z * cs, lat = Math.asin(clamp(Y, -1, 1)), lon = (Math.atan2(tz, tx) + TAU) % TAU;
      const ndl = nx * SUN[0] + ny * SUN[1] + nz * SUN[2], dif = ss(-.12, .5, ndl);
      let rC, gC, bC;
      if (kind === 'ceres') {
        const al = bil(HC, CW, CH, lon / TAU * CW, (.5 - lat / Math.PI) * CH, true), c = [al * 255 * 1.02, al * 255 * .98, al * 255 * .93], l = .03 + 1.25 * dif;
        rC = c[0] * l; gC = c[1] * l; bC = c[2] * l;
      } else {
        const iu = lon / TAU * SW, iv = (.5 - lat / Math.PI) * SH;
        let h = bil(HS, SW, SH, iu, iv, true) + (vnoise3(tx * 60, Y * 60, tz * 60) - .5) * .03; const nr = ss(.9, .05, tt), dtl = nr > 0 ? 1 + nr * (.5 * (vnoise3(tx * 380, Y * 380, tz * 380) - .5) + .35 * (vnoise3(tx * 1400, Y * 1400, tz * 1400) - .5)) : 1; const m = bil(MS, SW, SH, iu, iv, true), la = Math.abs(Y);
        const isLand = h >= SEA; let col = isLand ? tierra(h, m) : ocean(h);
        if (la > .82 + (vnoise3(tx * 6, 1, tz * 6) - .5) * .12) col = [236, 242, 250];
        const cl = bil(CS, SW, SH, iu + t * .5, iv, true) * .94 * ss(.08, .5, Math.max(0, alt));
        let c0 = col[0] * dtl * (.04 + 1.2 * dif), c1 = col[1] * dtl * (.04 + 1.15 * dif), c2 = col[2] * dtl * (.05 + 1.05 * dif);
        if (!isLand && la <= .82) { const hx = norm([SUN[0] - rx, SUN[1] - ry, SUN[2] - rz]), sp = Math.pow(Math.max(0, nx * hx[0] + ny * hx[1] + nz * hx[2]), 60) * dif; c0 += sp * 230; c1 += sp * 220; c2 += sp * 200; }
        if (isLand && ndl < -.05 && la < .75) { const city = vnoise3(tx * 45, Y * 45, tz * 45); if (city > .72) { const k = (city - .72) / .28 * ss(-.05, -.3, ndl); c0 += 255 * k; c1 += 190 * k; c2 += 90 * k; } }
        c0 += (255 * (.06 + .96 * dif) - c0) * cl; c1 += (255 * (.06 + .96 * dif) - c1) * cl; c2 += (255 * (.07 + .94 * dif) - c2) * cl;
        const cosv = Math.max(0, -(rx * nx + ry * ny + rz * nz)), rim = Math.pow(1 - cosv, 3) * clamp(ndl + .3);
        c0 += 55 * rim; c1 += 115 * rim; c2 += 225 * rim;
        if (atmoK > .05) { const hz = (1 - Math.exp(-tt * .6)) * atmoK * .8; c0 += (hazeC[0] - c0) * hz; c1 += (hazeC[1] - c1) * hz; c2 += (hazeC[2] - c2) * hz; }
        rC = c0; gC = c1; bC = c2;
      }
      D[i] += (rC - D[i]) * a; D[i + 1] += (gC - D[i + 1]) * a; D[i + 2] += (bC - D[i + 2]) * a;
    }
  }

  // ---------- grafismos 2D anclados a puntos 3D ----------
  const FONT = '"Poppins","DejaVu Sans",sans-serif';
  function proy(cam, p) { const d = sub(p, cam.e), z = dot(d, cam.f); if (z < .02) return null; const k = cam.flF / z; return [W / 2 + dot(d, cam.r) * k, H / 2 - dot(d, cam.u) * k, z]; }
  function texto(ctx, s, x, y, tam, col = '#fff', al = 1, ancho = 0) {
    ctx.save(); ctx.globalAlpha = al; ctx.font = `800 ${tam}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = tam * .16; ctx.strokeStyle = 'rgba(0,0,0,.78)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
  }
  function pastilla(ctx, s, x, y, tam, col, al = 1) {
    ctx.save(); ctx.globalAlpha = al; ctx.font = `800 ${tam}px ${FONT}`; const w = ctx.measureText(s).width + tam * 1.1, h = tam * 1.75;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = 'rgba(6,12,30,.62)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y + tam * .04); ctx.restore();
  }
  function linea(ctx, a, b, col, w, al = 1, punteada = false) {
    if (!a || !b) return; ctx.save(); ctx.globalAlpha = al; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = w + 5; if (punteada) ctx.setLineDash([18, 14]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
  }
  function flecha(ctx, a, b, col, w, al = 1) {
    if (!a || !b) return; linea(ctx, a, b, col, w, al); const an = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.max(16, w * 3.4);
    ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(b[0], b[1]);
    ctx.lineTo(b[0] - L * Math.cos(an - .45), b[1] - L * Math.sin(an - .45)); ctx.lineTo(b[0] - L * Math.cos(an + .45), b[1] - L * Math.sin(an + .45)); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }
  // ángulo de la gravedad respecto a la vertical a distancia r (fracción del radio) — integración numérica propia (ver datos.md)
  const gAng = r => { const T = [[0, 0], [.25, 8], [.5, 17], [.75, 31], [.95, 54]]; for (let i = 0; i < T.length - 1; i++) if (r <= T[i + 1][0]) return T[i][1] + (T[i + 1][1] - T[i][1]) * (r - T[i][0]) / (T[i + 1][0] - T[i][0]); return 54; };
  const fade = (t, a, b, c, d) => ss(a, b, t) * (1 - ss(c, d, t));

  // ---------- potato de roca (malla) ----------
  function roca(ctx, cam, t, al) {
    const R = mix(.34, 1.0, ss(55.3, 60.6, t)), A = mix(.5, 0, ss(56.0, 60.3, t)), F = [];
    sphere(F, [0, 0, 0], R, 72, 144, (c, i, j) => { const k = vnoise3(c[0] * 7 / R, c[1] * 7 / R, c[2] * 7 / R); return mx3([96, 86, 78], [150, 138, 124], k * .8 + .1); },
      { disp: d => 1 + A * (fbm3(d[0] * 1.8 + 3, d[1] * 1.8, d[2] * 1.8, 4) - .5) * 2 + A * .3 * (vnoise3(d[0] * 5, d[1] * 5, d[2] * 5) - .5) * 2 });
    const c = camera(cam.e, cam.g, { w: W, h: H, fov: cam.fov, up: cam.up });
    ctx.save(); ctx.globalAlpha = al; render(ctx, c, F, { light: SUN, amb: .2, seam: 1.2 }); ctx.restore();
  }

  // ---------- escena ----------
  return (ctx, t) => {
    const B = bake();
    const K = camaraT(t), rl = K.roll * Math.PI / 180, f = norm(sub(K.g, K.e)), wu = t > 72 ? ss(72.3, 74.8, t) * (1 - ss(78.0, 79.6, t)) : 0, up0 = norm(mx3([0, 1, 0], norm(K.e), wu));
    let r0 = norm(cross(f, up0)); if (Math.abs(f[1]) > .995) r0 = [1, 0, 0];
    const u0 = cross(r0, f), up = [u0[0] * Math.cos(rl) + r0[0] * Math.sin(rl), u0[1] * Math.cos(rl) + r0[1] * Math.sin(rl), u0[2] * Math.cos(rl) + r0[2] * Math.sin(rl)];
    const rr = norm(cross(f, up)), uu = cross(rr, f), tf = Math.tan(K.fov * Math.PI / 360);
    const cam = { e: K.e, g: K.g, f, r: rr, u: uu, up, fov: K.fov, fl: (LH / 2) / tf, flF: (H / 2) / tf };
    const D = img.data;
    // zona de suelo para la atmósfera del fondo
    let ground = null;
    if (t < 53) { const a = Math.max(0, K.e[1]); ground = { up: [0, 1, 0], eh: 0, K: Math.exp(-a * 22) }; }
    else if (t > 72) { const al = Math.hypot(...K.e) - 1; ground = { up: norm(K.e), eh: -Math.sqrt(Math.max(0, 1 - 1 / Math.pow(1 + Math.max(al, 1e-4), 2))), K: Math.exp(-Math.max(0, al) * 9) }; }
    pasoFondo(D, cam, ground);
    if (t < 55.5) pasoDisco(D, cam, t, { s: ss(36.0, 46.5, t), th: .02 * t, dis: ss(52.3, 55.0, t), nub: 1 - ss(.1, .7, Math.max(0, K.e[1])) });
    if (t > 60.6 && t < 66.9) pasoEsfera(D, cam, t, { kind: 'ceres', a: ss(60.6, 61.5, t) * (1 - ss(66.4, 66.9, t)), spin: t * .12 });
    if (t > 66.4) pasoEsfera(D, cam, t, { kind: 'earth', a: ss(66.4, 66.9, t), spin: -.4 + t * .1, obl: .08 * ss(67.6, 68.6, t) * (1 - ss(72.4, 74.0, t)) });
    g2.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cvs, 0, 0, W, H);
    if (t > 54.4 && t < 61.6) roca(ctx, cam, t, ss(54.4, 55.2, t) * (1 - ss(60.8, 61.6, t)));

    // --- grafismos ---
    const P = p => proy(cam, p), Y0 = .004;
    // hipótesis
    { const a = fade(t, 5.1, 5.5, 7.9, 8.4); if (a > .01) pastilla(ctx, 'HIPÓTESIS', W / 2, 330 + (1 - ss(5.1, 5.6, t)) * 24, 58, '#ff8a3c', a); }
    // regla del radio
    { const a = fade(t, 14.2, 14.7, 18.0, 18.6); if (a > .01) { const k = ss(14.3, 15.8, t), p0 = P([0, Y0, 0]), p1 = P([k, Y0, 0]); linea(ctx, p0, p1, '#5cf08a', 9, a);
        if (p1) { const pp = P([k, Y0, .012]); if (pp) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#5cf08a'; ctx.fillRect(pp[0] - 4, pp[1] - 26, 8, 52); ctx.restore(); } }
        const pm = P([.5, .0, 0]); if (pm && k > .55) texto(ctx, '20.000 km', pm[0], pm[1] - 70, 58, '#ffffff', a * ss(.55, .8, k)); } }
    // ÷5
    { const a = fade(t, 21.6, 22.0, 26.2, 26.8); if (a > .01) { const y = 300 + (1 - ss(21.6, 22.2, t)) * 30; ctx.save(); ctx.globalAlpha = a * .9; ctx.beginPath(); ctx.roundRect(W / 2 - 300, y - 110, 600, 250, 44); ctx.fillStyle = 'rgba(6,12,30,.66)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffc23c'; ctx.stroke(); ctx.restore();
        texto(ctx, '÷ 5', W / 2, y - 10, 150, '#ffc23c', a); texto(ctx, 'tu peso · estimación', W / 2, y + 95, 40, '#ffffff', a); } }
    // flechas de gravedad
    { const a = fade(t, 25.1, 25.8, 34.2, 34.9); if (a > .01) { const n = 9; for (let k = 0; k < n; k++) { const rf = .02 + k / (n - 1) * .93, ap = ss(25.3 + k * .07, 25.9 + k * .07, t) * (k === 0 ? 1 : ss(28.0 + k * .45, 28.6 + k * .45, t)), x = rf, an = gAng(rf) * Math.PI / 180, L = .18;
          if (ap < .02) continue; const p0 = [x, .2, 0], p1 = [x - Math.sin(an) * L, .2 - Math.cos(an) * L, 0], q0 = P(p0), q1 = P(p1); if (q0 && q1) { const e = [q0[0] + (q1[0] - q0[0]) * ap, q0[1] + (q1[1] - q0[1]) * ap]; flecha(ctx, q0, e, k === 0 ? '#5cf08a' : mx3([92, 240, 138], [255, 90, 70], k / (n - 1)).map(Math.round).reduce((s, v, i) => s + (i ? ',' : 'rgb(') + v, '') + ')', 12, a * ap); } }
        const ai = ss(31.4, 32.0, t) * a; if (ai > .01) { const pb = P([.95, .2, 0]); if (pb) { texto(ctx, '50°', pb[0] - 30, pb[1] - 110, 84, '#ff7a5c', ai); pastilla(ctx, 'ESTIMACIÓN', pb[0] - 30, pb[1] - 195, 34, '#ffc23c', ai); } } } }
    // agua hacia el centro (flechas sobre la superficie)
    { const a = fade(t, 37.6, 38.3, 44.0, 45.0); if (a > .01) for (let k = 0; k < 5; k++) { const an = Math.PI / 2 + (k - 2) * .55, r1 = .9, r2 = .62, h1 = .01, h2 = .02, p0 = P([r1 * Math.cos(an), h1 + .02, r1 * Math.sin(an)]), p1 = P([r2 * Math.cos(an), h2 + .02, r2 * Math.sin(an)]); if (p0 && p1) flecha(ctx, p0, p1, '#8fe3ff', 11, a * .9 * ss(38 + k * .1, 38.6 + k * .1, t)); } }
    // roca
    { const a = fade(t, 55.3, 55.9, 60.0, 60.8); if (a > .01) pastilla(ctx, '≈ 200–300 km de radio', W / 2, 330, 46, '#ffc23c', a); }
    // Ceres
    { const a = fade(t, 61.7, 62.2, 66.0, 66.5); if (a > .01) pastilla(ctx, 'CERES · ≈ 940 km', W / 2, 330, 54, '#ffffff', a); }
    // ecuador vs polo
    { const a = fade(t, 68.2, 68.7, 71.9, 72.4); if (a > .01) { const ob = .08 * ss(67.6, 68.6, t), pc = P([0, 0, 0]), pe = P([1, 0, 0]), pp = P([0, 1 - ob, 0]);
        if (pc && pe && pp) { linea(ctx, pc, pe, '#5cf08a', 7, a, true); linea(ctx, pc, pp, '#ffc23c', 7, a, true); texto(ctx, 'ecuador: +21 km', W / 2, 430, 56, '#5cf08a', a * ss(68.8, 69.4, t)); } pastilla(ctx, '(forma exagerada)', W / 2, 330, 38, '#ffffff', a); } }
    // línea recta de referencia en el horizonte (aterrizaje)
    { const a = fade(t, 76.0, 76.5, 77.4, 77.8); if (a > .01) { const N = norm(K.e), la = sub(K.g, K.e), Tn = norm(sub(la, mul(N, dot(la, N)))), dip = Math.acos(1 / (Math.hypot(...K.e))), d = add(mul(Tn, Math.cos(dip)), mul(N, -Math.sin(dip))), pc = P(add(K.e, mul(d, 6)));
        if (pc) { ctx.save(); ctx.globalAlpha = a * .8; ctx.setLineDash([22, 16]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, pc[1]); ctx.lineTo(W, pc[1]); ctx.stroke(); ctx.restore(); } } }
    // viñeta
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  };
})();
