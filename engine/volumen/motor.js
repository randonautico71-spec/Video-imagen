/* VOLUMEN: motor 3D propio (WebGL2) para animaciones con aspecto de ilustracion 3D: objetos con volumen, luz suave,
   sombras proyectadas, brillo de borde y modo RAYOS X (contorno luminoso, como un plano tecnico).
   Todo por codigo: las mallas se generan (engine/volumen/mallas.js), los modelos se montan con piezas
   (engine/volumen/modelos.js) y las texturas se pintan en lienzos 2D. Sin ficheros externos ni librerias.

   Funciona sin GPU: Chromium usa SwiftShader (WebGL2 por CPU). Medido en este contenedor en docs/GUIA_IMAGEN.md.
   El resultado se pega en el lienzo 2D del escenario (esc.ctx), asi que se mezcla con fondos de VE.real, rotulos,
   subtitulos y grafismos de VE.short. Cada fotograma se reconstruye desde t (sin estado): las mallas y texturas
   se suben una vez y se reutilizan; los nodos son objetos ligeros que se crean en cada fotograma.

   API minima:
     const V = VE.vol;
     const escena = V.nodo({ hijos: [ V.nodo({ malla: V.malla.esfera(), mat: { color: '#d99a5b' }, pos: [0,1,0], esc: 0.5 }) ] });
     const cam = V.camara({ pos: [0, 2, 8], mira: [0, 1, 0], fov: 35 });
     V.render(esc, escena, cam, { ambiente: 'estudio', sombras: { centro: [0,0,0], radio: 4 } });
     const p = V.proyectar(esc, cam, [0, 1, 0]);   // -> {x, y, z, delante} en unidades de diseno, para anclar grafismos 2D

   Nodo: { malla, mat, pos:[x,y,z], rot:[rx,ry,rz] (radianes; orden Ry*Rx*Rz: rumbo, cabeceo, alabeo), esc: n | [x,y,z],
           m: Float32Array(16) (matriz explicita, sustituye a pos/rot/esc), hijos: [...], oculto, sinSombra, alfa,
           sinRayos (decorado que no pasa a rayos X: se oculta con rayosx = 1 y no recibe el contorno en la mezcla) }
   Material: { color, tipo: 'mate'|'brillo'|'rayosx'|'plano'|'sombra', alfa, mapa: <canvas>, esp (especular), dureza (exponente),
               desvanecer (0..1: la capa se borra al verse de canto, p. ej. nubes), emision (0..1), envolver (luz que rodea, 0..1), borde (intensidad del brillo de borde), fresnel (exponente rayos x),
               dobleCara, sinNiebla }
   Ambientes (luz.relativa = la luz va con la camara): 'estudio' (calido, como una sala con una lampara), 'dia', 'atardecer', 'noche', 'espacio', 'plano' (rayos x),
              o un objeto { luz:{dir,color,intensidad}, cielo, suelo, ambiente, borde:{color,intensidad} }. */
(function (VE) {
  const V = VE.vol = VE.vol || {};

  // ---------------------------------------------------------------- matrices (columna mayor, como GL)
  const M = V.m4 = {
    id: () => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
    mul(a, b) { const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      return o; },
    tras(x, y, z) { const m = M.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
    esc(x, y, z) { const m = M.id(); m[0] = x; m[5] = y == null ? x : y; m[10] = z == null ? x : z; return m; },
    rotX(a) { const m = M.id(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; },
    rotY(a) { const m = M.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; },
    rotZ(a) { const m = M.id(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; },
    persp(fovy, asp, n, f) { const m = new Float32Array(16), t = 1 / Math.tan(fovy / 2); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; },
    orto(l, r, b, t, n, f) { const m = M.id(); m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n); m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n); return m; },
    mirar(ojo, obj, arriba) {
      const z = V.v3.norm(V.v3.res(ojo, obj)); let x = V.v3.cruz(arriba || [0, 1, 0], z);
      if (V.v3.lon(x) < 1e-6) x = V.v3.cruz([0, 0, 1], z); x = V.v3.norm(x); const y = V.v3.cruz(z, x), m = M.id();
      m[0] = x[0]; m[4] = x[1]; m[8] = x[2]; m[1] = y[0]; m[5] = y[1]; m[9] = y[2]; m[2] = z[0]; m[6] = z[1]; m[10] = z[2];
      m[12] = -V.v3.punto(x, ojo); m[13] = -V.v3.punto(y, ojo); m[14] = -V.v3.punto(z, ojo); return m; },
    /* Base a partir de direcciones: el eje +Z local apunta a 'adelante' y +Y a 'arriba' (se ortogonaliza). Posicion opcional. */
    base(adelante, arriba, pos) { const z = V.v3.norm(adelante), x = V.v3.norm(V.v3.cruz(arriba, z)), y = V.v3.cruz(z, x), m = M.id();
      m[0] = x[0]; m[1] = x[1]; m[2] = x[2]; m[4] = y[0]; m[5] = y[1]; m[6] = y[2]; m[8] = z[0]; m[9] = z[1]; m[10] = z[2];
      if (pos) { m[12] = pos[0]; m[13] = pos[1]; m[14] = pos[2]; } return m; },
    inv(m) { const a = m, o = new Float32Array(16);
      const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5],
        b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12],
        b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
      let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; if (!d) return M.id(); d = 1 / d;
      o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
      o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
      o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
      o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
      return o; },
    normal(m) { const i = M.inv(m); return new Float32Array([i[0], i[4], i[8], i[1], i[5], i[9], i[2], i[6], i[10]]); },
    ap(m, p) { const x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
      return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w]; },
    ap4(m, p) { const x = p[0], y = p[1], z = p[2]; return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14], m[3] * x + m[7] * y + m[11] * z + m[15]]; }
  };
  const v3 = V.v3 = {
    sum: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], res: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    por: (a, k) => [a[0] * k, a[1] * k, a[2] * k], punto: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cruz: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    lon: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    mezcla: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  };

  // ---------------------------------------------------------------- color
  const col3 = (c) => { if (Array.isArray(c)) return c; const r = VE.color.aRGB(c); return [r[0] / 255, r[1] / 255, r[2] / 255]; };
  V.col3 = col3;

  // ---------------------------------------------------------------- nodos y camara
  V.nodo = (o = {}) => o;
  V.local = function (n) {
    if (n.m) return n.m;
    let m = M.id(); const p = n.pos, r = n.rot, e = n.esc;
    if (p) m = M.tras(p[0], p[1], p[2]);
    if (r) { if (r[1]) m = M.mul(m, M.rotY(r[1])); if (r[0]) m = M.mul(m, M.rotX(r[0])); if (r[2]) m = M.mul(m, M.rotZ(r[2])); }
    if (e != null) m = Array.isArray(e) ? M.mul(m, M.esc(e[0], e[1], e[2])) : M.mul(m, M.esc(e, e, e));
    return m;
  };
  /* Recorre el arbol y devuelve [{nodo, M}] (matriz de mundo). Tambien sirve para preguntar donde esta una pieza: V.mundo(arbol, 'mano_d'). */
  function aplanar(n, padre, lista) {
    if (!n || n.oculto) return lista; const m = padre ? M.mul(padre, V.local(n)) : V.local(n);
    lista.push({ n, M: m }); if (n.hijos) for (const h of n.hijos) { if ((n.sinRayos || n.alfa != null) && h) { h.sinRayos = h.sinRayos || n.sinRayos; if (n.alfa != null) h.alfa = (h.alfa == null ? 1 : h.alfa) * n.alfa; } aplanar(h, m, lista); } return lista;
  }
  V.aplanar = (raiz) => aplanar(raiz, null, []);
  V.posicion = function (raiz, nombre, local = [0, 0, 0]) { const f = V.aplanar(raiz).find(e => e.n.nombre === nombre); return f ? M.ap(f.M, local) : null; };

  V.camara = function (o = {}) {
    return { pos: o.pos || [0, 0, 10], mira: o.mira || [0, 0, 0], arriba: o.arriba || [0, 1, 0], fov: o.fov || 35, cerca: o.cerca || 0.05, lejos: o.lejos || 500, orto: o.orto || 0 };
  };
  /* Camara en orbita: rumbo (alrededor de Y) y elevacion en radianes, distancia al centro. */
  V.orbita = function (centro, dist, rumbo, elev, o = {}) {
    const c = Math.cos(elev); return V.camara(Object.assign({}, o, { pos: [centro[0] + Math.sin(rumbo) * c * dist, centro[1] + Math.sin(elev) * dist, centro[2] + Math.cos(rumbo) * c * dist], mira: centro }));
  };
  function matCam(esc, cam) {
    const asp = esc.W / esc.H, vista = M.mirar(cam.pos, cam.mira, cam.arriba);
    const proy = cam.orto ? M.orto(-cam.orto * asp, cam.orto * asp, -cam.orto, cam.orto, cam.cerca, cam.lejos) : M.persp(cam.fov * Math.PI / 180, asp, cam.cerca, cam.lejos);
    return { vista, proy, vp: M.mul(proy, vista) };
  }
  /* Punto 3D -> pantalla (unidades de diseno). delante = false si esta detras de la camara. */
  V.proyectar = function (esc, cam, p) {
    const { vp } = matCam(esc, cam), q = M.ap4(vp, p), w = q[3];
    return { x: (q[0] / w * 0.5 + 0.5) * esc.W, y: (0.5 - q[1] / w * 0.5) * esc.H, z: q[2] / w, delante: w > 0 };
  };
  /* Tamano en pantalla (unidades de diseno) de una longitud 'r' situada en p. */
  V.escalaPantalla = function (esc, cam, p, r) {
    if (cam.orto) return r / cam.orto * esc.H / 2; const d = v3.lon(v3.res(p, cam.pos)); return r / (2 * d * Math.tan(cam.fov * Math.PI / 360)) * esc.H;
  };

  // ---------------------------------------------------------------- ambientes de luz
  const AMB = V.ambientes = {
    estudio:   { luz: { dir: [-0.55, 0.62, 0.55], color: '#ffd9a8', intensidad: 1.45 }, cielo: '#8a6a7a', suelo: '#4a2c22', ambiente: 0.42, borde: { color: '#ffcf9a', intensidad: 0.35 } },
    dia:       { luz: { dir: [-0.5, 0.75, 0.45], color: '#fff4dc', intensidad: 1.2 }, cielo: '#9cc4f0', suelo: '#6b6650', ambiente: 0.6, borde: { color: '#ffffff', intensidad: 0.25 } },
    atardecer: { luz: { dir: [0.6, 0.35, 0.5], color: '#ffb877', intensidad: 1.3 }, cielo: '#7c5a9a', suelo: '#4a2a30', ambiente: 0.5, borde: { color: '#ffb070', intensidad: 0.45 } },
    noche:     { luz: { dir: [0.4, 0.7, 0.4], color: '#9fb4ff', intensidad: 0.8 }, cielo: '#22305a', suelo: '#0c1020', ambiente: 0.45, borde: { color: '#9fb4ff', intensidad: 0.5 } },
    espacio:   { luz: { dir: [-0.7, 0.45, 0.55], color: '#fff6e8', intensidad: 1.45, relativa: true }, cielo: '#1b2a55', suelo: '#05070f', ambiente: 0.16, borde: { color: '#7fb2ff', intensidad: 0.25 } },
    plano:     { luz: { dir: [-0.4, 0.7, 0.6], color: '#cfe4ff', intensidad: 0.9 }, cielo: '#1d3a7a', suelo: '#08122e', ambiente: 0.5, borde: { color: '#8fc6ff', intensidad: 0.6 } }
  };
  function ambiente(a) {
    if (!a) return AMB.estudio; if (typeof a === 'string') { if (!AMB[a]) throw new Error('Ambiente desconocido: ' + a + '. Hay: ' + Object.keys(AMB).join(', ')); return AMB[a]; }
    const b = AMB[a.base || 'estudio']; return Object.assign({}, b, a, { luz: Object.assign({}, b.luz, a.luz || {}), borde: Object.assign({}, b.borde, a.borde || {}) });
  }

  // ---------------------------------------------------------------- WebGL
  const VS = `#version 300 es
in vec3 aP; in vec3 aN; in vec2 aU;
uniform mat4 uM, uVP, uLuz; uniform mat3 uNM;
out vec3 vW; out vec3 vN; out vec2 vU; out vec4 vL;
void main(){ vec4 w = uM * vec4(aP, 1.0); vW = w.xyz; vN = uNM * aN; vU = aU; vL = uLuz * w; gl_Position = uVP * w; }`;
  const FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vW; in vec3 vN; in vec2 vU; in vec4 vL;
uniform vec3 uCol, uCam, uLdir, uLcol, uCielo, uSuelo, uBorde, uNiebla;
uniform float uFade, uAlfa, uLint, uAmb, uEsp, uDureza, uBordeI, uEnv, uEmis, uFres, uTexel;
uniform vec2 uNieblaR; uniform int uTipo; uniform bool uUsaMapa, uUsaSom;
uniform sampler2D uMapa; uniform sampler2DShadow uSom;
out vec4 o;
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
float sombra(vec3 N){
  if (!uUsaSom) return 1.0;
  vec3 p = vL.xyz / vL.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  float b = 0.0008 + 0.0025 * (1.0 - clamp(dot(N, uLdir), 0.0, 1.0));
  float s = 0.0;
  for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) s += texture(uSom, vec3(p.xy + vec2(float(i), float(j)) * uTexel * 2.2, p.z - b));
  return s / 25.0;
}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vW);
  vec3 base = lin(uCol); float a = uAlfa;
  if (uUsaMapa) { vec4 t = texture(uMapa, vU); base *= lin(t.rgb); a *= t.a; }
  if (uFade > 0.0) a *= smoothstep(0.0, uFade, abs(dot(N, V)));        // capas finas (nubes) que se desvanecen de canto
  if (uTipo == 3) { float s = sombra(N); o = vec4(0.0, 0.0, 0.0, (1.0 - s) * a); return; }
  if (uTipo == 1) {                                   // rayos x / atmosfera: brillo de contorno, mezcla aditiva
    float f = 1.0 - abs(dot(N, V));
    vec3 c = base * (uEmis + pow(f, uFres) * 0.45 * uBordeI + pow(f, 9.0) * 1.4 * uBordeI) * a;
    c = pow(c, vec3(1.0 / 2.2)); o = vec4(c, max(c.r, max(c.g, c.b))); return;
  }
  if (uTipo == 2) { vec3 c = pow(base, vec3(1.0 / 2.2)) * a; o = vec4(c, a); return; }
  float nl = dot(N, uLdir);
  float d = max(0.0, (nl + uEnv) / (1.0 + uEnv));
  float s = sombra(N);
  vec3 H = normalize(uLdir + V);
  float sp = pow(max(dot(N, H), 0.0), uDureza) * uEsp * step(0.0, nl);
  vec3 hemi = mix(lin(uSuelo), lin(uCielo), N.y * 0.5 + 0.5) * uAmb;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * uBordeI;
  vec3 L = lin(uLcol) * uLint;
  vec3 c = base * (hemi + L * d * s) + L * sp * s + lin(uBorde) * rim * (0.35 + 0.65 * s) + base * uEmis;
  if (uNieblaR.y > 0.0) c = mix(c, lin(uNiebla), smoothstep(uNieblaR.x, uNieblaR.y, distance(vW, uCam)));
  c = pow(c, vec3(1.0 / 2.2));
  o = vec4(c * a, a);
}`;
  const VS_S = `#version 300 es
in vec3 aP; uniform mat4 uM, uLuz; void main(){ gl_Position = uLuz * uM * vec4(aP, 1.0); }`;
  const FS_S = `#version 300 es
precision mediump float; out vec4 o; void main(){ o = vec4(1.0); }`;

  function compilar(gl, vs, fs) {
    const sh = (t, s) => { const h = gl.createShader(t); gl.shaderSource(h, s); gl.compileShader(h); if (!gl.getShaderParameter(h, gl.COMPILE_STATUS)) throw new Error('Shader: ' + gl.getShaderInfoLog(h)); return h; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aN'); gl.bindAttribLocation(p, 2, 'aU'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Programa: ' + gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  }

  /* Un contexto GL por escenario, del tamano del lienzo (W*ss x H*ss). */
  function gl(esc) {
    if (esc.__vol) return esc.__vol;
    const c = document.createElement('canvas'); c.width = Math.round(esc.W * esc.ss); c.height = Math.round(esc.H * esc.ss);
    const g = c.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true });
    if (!g) throw new Error('VE.vol necesita WebGL2 (en Chromium sin GPU lo da SwiftShader; revisar los flags del navegador).');
    const R = { c, g, prog: compilar(g, VS, FS), progS: compilar(g, VS_S, FS_S), som: null, aniso: g.getExtension('EXT_texture_filter_anisotropic') };
    esc.__vol = R; return R;
  }
  function subirMalla(g, m) {
    if (m.__vao) return m;
    const vao = g.createVertexArray(); g.bindVertexArray(vao);
    const buf = (d, loc, n) => { const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, d, g.STATIC_DRAW); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, n, g.FLOAT, false, 0, 0); return b; };
    m.__b = [buf(m.pos, 0, 3), buf(m.nor, 1, 3), buf(m.uv, 2, 2)];
    const ib = g.createBuffer(); g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, ib); g.bufferData(g.ELEMENT_ARRAY_BUFFER, m.idx, g.STATIC_DRAW);
    m.__vao = vao; m.__ib = ib; m.__ver = m.version; m.__n = m.idx.length; m.__tipo = m.idx instanceof Uint32Array ? g.UNSIGNED_INT : g.UNSIGNED_SHORT; g.bindVertexArray(null); return m;
  }
  /* Mallas que cambian cada fotograma (estelas, cuerdas): se vuelven a subir. */
  function actualizarMalla(g, m) {
    if (!m.__vao) return subirMalla(g, m);
    if (m.__ver === m.version) return m; m.__ver = m.version;
    [m.pos, m.nor, m.uv].forEach((d, i) => { g.bindBuffer(g.ARRAY_BUFFER, m.__b[i]); g.bufferData(g.ARRAY_BUFFER, d, g.DYNAMIC_DRAW); });
    g.bindVertexArray(m.__vao); g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, m.__ib); g.bufferData(g.ELEMENT_ARRAY_BUFFER, m.idx, g.DYNAMIC_DRAW);
    g.bindVertexArray(null); m.__n = m.idx.length; m.__tipo = m.idx instanceof Uint32Array ? g.UNSIGNED_INT : g.UNSIGNED_SHORT; return m;
  }
  function textura(R, lienzo) {
    if (lienzo.__tex && lienzo.__texG === R.g) return lienzo.__tex;
    const g = R.g, t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, lienzo); g.generateMipmap(g.TEXTURE_2D);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    if (R.aniso) g.texParameterf(g.TEXTURE_2D, R.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    lienzo.__tex = t; lienzo.__texG = g; return t;
  }
  function mapaSombras(R, tam) {
    if (R.som && R.som.tam === tam) return R.som;
    const g = R.g, t = g.createTexture(); g.bindTexture(g.TEXTURE_2D, t);
    g.texStorage2D(g.TEXTURE_2D, 1, g.DEPTH_COMPONENT24, tam, tam);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_COMPARE_MODE, g.COMPARE_REF_TO_TEXTURE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_COMPARE_FUNC, g.LEQUAL);
    const fb = g.createFramebuffer(); g.bindFramebuffer(g.FRAMEBUFFER, fb); g.framebufferTexture2D(g.FRAMEBUFFER, g.DEPTH_ATTACHMENT, g.TEXTURE_2D, t, 0);
    g.drawBuffers([g.NONE]); g.readBuffer(g.NONE); g.bindFramebuffer(g.FRAMEBUFFER, null);
    R.som = { t, fb, tam }; return R.som;
  }

  const TIPOS = { mate: 0, brillo: 0, rayosx: 1, plano: 2, sombra: 3 };
  const DEF = {
    mate:   { esp: 0.22, dureza: 22, envolver: 0.2, borde: 1, emision: 0 },
    brillo: { esp: 0.7, dureza: 60, envolver: 0.2, borde: 1, emision: 0 },
    rayosx: { fresnel: 2.5, borde: 1.0, emision: 0.05 },
    plano:  {}, sombra: { alfa: 0.45 }
  };

  /* Dibuja la escena y la pega en esc.ctx (unidades de diseno, cubre todo el lienzo).
     o: { ambiente, sombras: {centro, radio, tam} | false, niebla: {color, cerca, lejos}, rayosx: true (fuerza todo a rayos x con 'colorRayos'),
          alfa (opacidad global de la capa), recorte: {x,y,w,h} (solo pega esa zona) } */
  V.render = function (esc, raiz, cam, o = {}) {
    const R = gl(esc), g = R.g, A = ambiente(o.ambiente), W = R.c.width, H = R.c.height;
    const lista = V.aplanar(raiz).filter(e => e.n.malla);
    const { vp } = matCam(esc, cam); let ldir = v3.norm(A.luz.dir);
    if (A.luz.relativa) {                       // luz fijada a la camara (x derecha, y arriba, z hacia el espectador): el sujeto siempre se ve iluminado igual
      const z = v3.norm(v3.res(cam.pos, cam.mira)), xx = v3.norm(v3.cruz(cam.arriba, z)), y = v3.cruz(z, xx);
      ldir = v3.norm(v3.sum(v3.sum(v3.por(xx, ldir[0]), v3.por(y, ldir[1])), v3.por(z, ldir[2]))); }
    const fuerzaX = o.rayosx ? (typeof o.rayosx === 'number' ? o.rayosx : 1) : 0;

    // ---- pase de sombras (luz direccional, caja ortografica alrededor de 'centro')
    let luzVP = M.id(), usaSom = false, texel = 0;
    if (o.sombras && fuerzaX < 1) {
      const S = o.sombras, tam = S.tam || 2048, sm = mapaSombras(R, tam), c = S.centro || [0, 0, 0], r = S.radio || 5;
      const ojo = v3.sum(c, v3.por(ldir, r * 3)), arriba = Math.abs(ldir[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0];
      luzVP = M.mul(M.orto(-r, r, -r, r, 0.01, r * 6), M.mirar(ojo, c, arriba)); usaSom = true; texel = 1 / tam;
      g.bindFramebuffer(g.FRAMEBUFFER, sm.fb); g.viewport(0, 0, tam, tam); g.clear(g.DEPTH_BUFFER_BIT);
      g.enable(g.DEPTH_TEST); g.depthMask(true); g.disable(g.BLEND); g.enable(g.POLYGON_OFFSET_FILL); g.polygonOffset(1.5, 3); g.disable(g.CULL_FACE);
      g.useProgram(R.progS.p); g.uniformMatrix4fv(R.progS.u.uLuz, false, luzVP);
      for (const e of lista) { const mt = e.n.mat || {}; const tp = mt.tipo || 'mate';
        if (e.n.sinSombra || tp === 'rayosx' || tp === 'sombra' || tp === 'plano' || (mt.alfa != null && mt.alfa < 0.5)) continue;
        const m = e.n.malla.dinamica ? actualizarMalla(g, e.n.malla) : subirMalla(g, e.n.malla);
        g.uniformMatrix4fv(R.progS.u.uM, false, e.M); g.bindVertexArray(m.__vao); g.drawElements(g.TRIANGLES, m.__n, m.__tipo, 0); }
      g.disable(g.POLYGON_OFFSET_FILL); g.bindFramebuffer(g.FRAMEBUFFER, null);
    }

    // ---- pase principal
    g.viewport(0, 0, W, H); g.clearColor(0, 0, 0, 0); g.clearDepth(1); g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    const P = R.prog, u = P.u; g.useProgram(P.p);
    g.uniformMatrix4fv(u.uVP, false, vp); g.uniformMatrix4fv(u.uLuz, false, luzVP); g.uniform3fv(u.uCam, cam.pos);
    g.uniform3fv(u.uLdir, ldir); g.uniform3fv(u.uLcol, col3(A.luz.color)); g.uniform1f(u.uLint, A.luz.intensidad);
    g.uniform3fv(u.uCielo, col3(A.cielo)); g.uniform3fv(u.uSuelo, col3(A.suelo)); g.uniform1f(u.uAmb, A.ambiente);
    g.uniform1i(u.uUsaSom, usaSom ? 1 : 0); g.uniform1f(u.uTexel, texel);
    g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, usaSom ? R.som.t : null); g.uniform1i(u.uSom, 1); g.uniform1i(u.uMapa, 0);
    const nie = o.niebla; g.uniform3fv(u.uNiebla, col3(nie ? nie.color : '#000')); g.uniform2f(u.uNieblaR, nie ? nie.cerca : 0, nie ? nie.lejos : 0);

    // orden: opacos (delante a detras), sombras de suelo, transparentes y aditivos (detras a delante)
    const prof = (e) => { const q = M.ap4(vp, [e.M[12], e.M[13], e.M[14]]); return q[3]; };
    const item = lista.filter(e => !(fuerzaX >= 1 && e.n.sinRayos)).map(e => { let mt = e.n.mat || {}; if (fuerzaX >= 1 && mt.tipo !== 'sombra') mt = Object.assign({}, mt, { tipo: 'rayosx', color: o.colorRayos || mt.colorRayos || '#7fc4ff' });
      const tp = mt.tipo || 'mate'; const alfa = (mt.alfa == null ? (DEF[tp].alfa == null ? 1 : DEF[tp].alfa) : mt.alfa) * (e.n.alfa == null ? 1 : e.n.alfa);
      const grupo = tp === 'sombra' ? 1 : (tp === 'rayosx' ? 3 : (alfa < 0.999 ? 2 : 0)); return { e, mt, tp, alfa, grupo, z: prof(e) }; })
      .filter(i => i.alfa > 0.001 && !(fuerzaX >= 1 && i.tp === 'sombra'));
    item.sort((a, b) => a.grupo - b.grupo || (a.grupo === 0 ? a.z - b.z : b.z - a.z));

    g.enable(g.DEPTH_TEST); g.depthFunc(g.LEQUAL);
    for (const it of item) {
      const { e, mt, tp } = it, d = DEF[tp], m = e.n.malla.dinamica ? actualizarMalla(g, e.n.malla) : subirMalla(g, e.n.malla);
      if (it.grupo === 0) { g.disable(g.BLEND); g.depthMask(true); }
      else if (it.grupo === 3) { g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE); g.depthMask(false); }
      else { g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA); g.depthMask(false); }
      if (it.grupo === 3 && (mt.atraviesa !== false)) g.disable(g.DEPTH_TEST); else g.enable(g.DEPTH_TEST);
      if (mt.dobleCara || tp === 'rayosx' || tp === 'sombra' || e.n.malla.abierta) g.disable(g.CULL_FACE); else { g.enable(g.CULL_FACE); g.cullFace(mt.dentro ? g.FRONT : g.BACK); }
      const nm = M.normal(e.M);
      g.uniformMatrix4fv(u.uM, false, e.M); g.uniformMatrix3fv(u.uNM, false, nm);
      g.uniform3fv(u.uCol, col3(mt.color || '#cccccc')); g.uniform1f(u.uAlfa, it.alfa * (fuerzaX > 0 && fuerzaX < 1 && it.grupo !== 3 ? 1 - fuerzaX : 1));
      g.uniform1i(u.uTipo, TIPOS[tp]);
      g.uniform1f(u.uEsp, mt.esp == null ? (d.esp || 0) : mt.esp); g.uniform1f(u.uDureza, mt.dureza || d.dureza || 16);
      g.uniform1f(u.uEnv, mt.envolver == null ? (d.envolver || 0) : mt.envolver); g.uniform1f(u.uEmis, mt.emision == null ? (d.emision || 0) : mt.emision);
      g.uniform1f(u.uFres, mt.fresnel || d.fresnel || 2); g.uniform1f(u.uFade, mt.desvanecer || 0);
      const bI = (mt.borde == null ? (d.borde == null ? 1 : d.borde) : mt.borde) * (tp === 'rayosx' ? 1 : A.borde.intensidad);
      g.uniform1f(u.uBordeI, bI); g.uniform3fv(u.uBorde, col3(mt.colorBorde || A.borde.color));
      if (mt.sinNiebla) g.uniform2f(u.uNieblaR, 0, 0); else g.uniform2f(u.uNieblaR, nie ? nie.cerca : 0, nie ? nie.lejos : 0);
      g.activeTexture(g.TEXTURE0); if (mt.mapa) { g.bindTexture(g.TEXTURE_2D, textura(R, mt.mapa)); g.uniform1i(u.uUsaMapa, 1); } else { g.bindTexture(g.TEXTURE_2D, null); g.uniform1i(u.uUsaMapa, 0); }
      g.bindVertexArray(m.__vao); g.drawElements(g.TRIANGLES, m.__n, m.__tipo, 0);
    }
    // capa de rayos x por encima del modelo normal (mezcla parcial 0<rayosx<1)
    if (fuerzaX > 0 && fuerzaX < 1) {
      g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE); g.depthMask(false); g.disable(g.DEPTH_TEST); g.disable(g.CULL_FACE);
      g.uniform1i(u.uTipo, 1); g.uniform1i(u.uUsaMapa, 0); g.uniform1f(u.uFade, 0); g.uniform3fv(u.uCol, col3(o.colorRayos || '#7fc4ff'));
      g.uniform1f(u.uFres, 2.5); g.uniform1f(u.uBordeI, 1.0); g.uniform1f(u.uEmis, 0.05); g.uniform1f(u.uAlfa, fuerzaX);
      for (const it of item) { if (it.grupo === 3 || it.tp === 'sombra' || it.e.n.sinRayos) continue; const m = it.e.n.malla;
        g.uniformMatrix4fv(u.uM, false, it.e.M); g.uniformMatrix3fv(u.uNM, false, M.normal(it.e.M)); g.bindVertexArray(m.__vao); g.drawElements(g.TRIANGLES, m.__n, m.__tipo, 0); }
    }
    g.bindVertexArray(null); g.depthMask(true);

    const x = esc.ctx; x.save(); if (o.alfa != null) x.globalAlpha *= o.alfa;
    if (o.recorte) { const r = o.recorte, s = esc.ss; x.drawImage(R.c, r.x * s, r.y * s, r.w * s, r.h * s, r.x, r.y, r.w, r.h); }
    else x.drawImage(R.c, 0, 0, esc.W, esc.H);
    x.restore();
    return { vp, luzVP };
  };
})(window.VE = window.VE || {});
