/* CARGADOR DE PROYECTOS. Herramienta fija: lee del servidor la linea de tiempo, las palabras y la
   envolvente de voz, carga el escenas.js del proyecto (que es lo unico que cambia entre videos) y
   expone window.renderAt / window.capturar para el renderizador y el linter.

   Contrato de escenas.js:
     VE.proyecto({
       capitulos: [ { parrafos: 12, dibujar: (esc,t,ctx)=>{} }, ... ],   // alternativa a 'escenas' para videos largos
                                                                         // (ctx.parrafo = parrafo actual dentro del capitulo; ctx.buscar(palabra, n))
       estilo: 'LAB' | { ...paleta propia },          // opcional
       fondo(esc, tg, ctx)  {...},                    // opcional: capa persistente bajo las escenas
       escenas: [ (esc, t, ctx) => {...}, ... ],      // UNA por parrafo del guion, en orden
       subtitulos: false | { palabras (por grupo), tam (letra maxima), resalte },     // opcional
       progreso: true|false, transicion: {entrada, salida}
     });
   ctx: { i, n, ini, fin, dur, t (local), tg (global), p (0-1), entra (0-1), sale (0-1), zonas, tp/dp (tiempo y duracion del PARRAFO actual), pars (limites de parrafos), pw(palabra,n)=segundos desde el inicio del parrafo,
          palabras (de la escena, tiempos LOCALES), palabra(texto, desde=0) -> {t,ini,fin}|null,
          voz(tg) -> 0..1 amplitud de la locucion, estilo }                                    */
(function (VE) {
  const Q = new URLSearchParams(location.search);
  const RUTA = Q.get('p');
  let CFG = null;
  VE.proyecto = (c) => { CFG = c; };

  const norm = (p) => p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');

  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('No se pudo leer ' + url + ' (' + r.status + ')');
    return r.json();
  }
  function cargarScript(src) {
    return new Promise((ok, ko) => {
      const s = document.createElement('script'); s.src = src;
      s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  // Zonas de composicion: el cuerpo no invade la banda de subtitulos.
  VE.zonas = function (esc, conSub = true) {
    const S = esc.seguro, k = esc.k;
    const hSub = conSub ? Math.round(esc.vertical ? 250 * k : 190 * k) : 0;
    const sub = { x: S.x, y: S.y2 - hSub, w: S.w, h: hSub };
    const cuerpo = { x: S.x, y: S.y, w: S.w, h: S.h - hSub - (conSub ? 16 * k : 0) };
    cuerpo.x2 = cuerpo.x + cuerpo.w; cuerpo.y2 = cuerpo.y + cuerpo.h;
    cuerpo.cx = cuerpo.x + cuerpo.w / 2; cuerpo.cy = cuerpo.y + cuerpo.h / 2;
    return { cuerpo, sub };
  };

  VE.iniciarProyecto = async function () {
    const base = '/' + RUTA + '/';
    const [meta, tl, palabras, env] = await Promise.all([
      json(base + 'meta.json'), json(base + 'salida/timeline.json'),
      json(base + 'salida/palabras.json'), json(base + 'salida/envolvente.json')]);
    await cargarScript(base + 'escenas.js?v=' + Date.now());
    if (!CFG) throw new Error('escenas.js no llamo a VE.proyecto({...})');
    // Unidades de dibujo: una por parrafo (CFG.escenas) o una por CAPITULO que agrupa varios parrafos (CFG.capitulos),
    // pensado para videos largos: 45 min = decenas de parrafos pero unos pocos entornos.
    let unidades, fns;
    if (CFG.capitulos) {
      unidades = []; fns = []; let k = 0;
      CFG.capitulos.forEach((c, ci) => {
        const grupo = tl.escenas.slice(k, k + c.parrafos), a = grupo[0], b = grupo[grupo.length - 1];
        if (!b || grupo.length < c.parrafos) throw new Error(`El capitulo ${ci} pide ${c.parrafos} parrafos pero solo quedan ${grupo.length}.`);
        unidades.push({ i: ci, ini: a.ini, fin: b.fin, palabras: [a.palabras[0], b.palabras[1]], parrafos: grupo.map(e => ({ ini: e.ini, fin: e.fin })), nombre: c.nombre });
        fns.push(c.dibujar); k += c.parrafos;
      });
      if (k !== tl.escenas.length) throw new Error(`Los capitulos suman ${k} parrafos y el guion tiene ${tl.escenas.length}: deben coincidir.`);
    } else {
      if (CFG.escenas.length !== tl.escenas.length)
        throw new Error(`escenas.js define ${CFG.escenas.length} escenas y el guion tiene ${tl.escenas.length} parrafos: deben coincidir.`);
      unidades = tl.escenas.map(e => Object.assign({}, e, { parrafos: [{ ini: e.ini, fin: e.fin }] })); fns = CFG.escenas;
    }

    const lienzo = Q.get('lienzo') || meta.lienzo || 'yt';
    const esc = VE.crearEscenario({ formato: lienzo, estilo: CFG.estilo || meta.estilo || 'LAB', ss: parseFloat(Q.get('ss') || '1.5') });
    VE.__esc = esc; VE.lintCfg = CFG.lint || {};
    const zonas = VE.zonas(esc, CFG.subtitulos !== false);
    const x = esc.ctx, W = esc.W, H = esc.H;

    const so = parseFloat(Q.get('so') || '1');                                          // escala de SALIDA: 0.5 = 960x540 para calidad baja
    const out = document.createElement('canvas'); out.width = Math.round(W * so); out.height = Math.round(H * so);
    const ox = out.getContext('2d', { alpha: false }); ox.imageSmoothingQuality = 'high';

    const subOpt = Object.assign({ palabras: esc.vertical ? 5 : 7, tam: esc.vertical ? 76 : 58 }, CFG.subtitulos || {});
    const grupos = CFG.subtitulos === false ? [] : VE.agruparSubtitulos(palabras, subOpt);
    const tr = Object.assign({ entrada: 0.35, salida: 0.25 }, CFG.transicion || {});
    const esce = unidades.map(e => Object.assign({}, e, { pal: palabras.slice(e.palabras[0], e.palabras[1]) }));
    const v = env.valores, tasa = env.tasa;
    const voz = (tg) => { const f = tg * tasa, i = Math.floor(f); if (i < 0 || i >= v.length - 1) return 0; return v[i] + (v[i + 1] - v[i]) * (f - i); };

    const ctx = { n: esce.length, zonas, estilo: esc.estilo, voz };
    function escenaEn(tg) { let r = 0; for (let i = 0; i < esce.length; i++) if (esce[i].ini <= tg) r = i; else break; return r; }

    window.DURACION = tl.duracion_total;
    window.renderAt = function (tg) {
      VE.limpiarRegistro && VE.limpiarRegistro();
      esc.abrir();
      const i = escenaEn(tg), e = esce[i];                      // la escena se resuelve ANTES de pintar el fondo
      ctx.i = i; ctx.ini = e.ini; ctx.fin = e.fin; ctx.dur = e.fin - e.ini; ctx.tg = tg; ctx.t = tg - e.ini;
      ctx.p = Math.min(1, Math.max(0, ctx.t / ctx.dur));
      ctx.entra = Math.min(1, ctx.t / tr.entrada); ctx.sale = Math.min(1, (e.fin - tg) / tr.salida);
      ctx.palabras = e.pal.map(w => Object.assign({}, w, { ini: w.ini - e.ini, fin: w.fin - e.ini }));
      ctx.palabra = (txt, desde = 0) => { const n = norm(txt); return ctx.palabras.find(w => w.ini >= desde && norm(w.t) === n) || null; };
      ctx.parrafo = Math.max(0, e.parrafos.findIndex(q => tg < q.fin)); if (ctx.parrafo < 0) ctx.parrafo = e.parrafos.length - 1;
      ctx.buscar = (txt, n = 0) => { const q = norm(txt); return ctx.palabras.filter(w => norm(w.t) === q)[n] || null; };   // n-esima aparicion de una palabra en el capitulo
      const pq = e.parrafos[ctx.parrafo]; ctx.tp = tg - pq.ini; ctx.dp = pq.fin - pq.ini; ctx.np = e.parrafos.length;   // tiempo y duracion DENTRO del parrafo
      ctx.pars = e.parrafos.map(q => ({ ini: q.ini - e.ini, fin: q.fin - e.ini }));                                    // limites de cada parrafo, en tiempo del capitulo
      const pl = pq.ini - e.ini;
      ctx.pw = (txt, n = 0) => { const q = norm(txt), l = ctx.palabras.filter(w => norm(w.t) === q && w.ini >= pl - 0.001 && w.ini < pl + ctx.dp); return l[n] ? l[n].ini - pl : null; };   // instante (desde el inicio del parrafo) de la n-esima aparicion de una palabra
      if (CFG.fondo) CFG.fondo(esc, tg, ctx);
      x.save(); x.globalAlpha = Math.max(0, Math.min(ctx.entra, ctx.sale, 1));
      fns[i](esc, ctx.t, ctx);
      x.restore();
      x.setTransform(esc.ss, 0, 0, esc.ss, 0, 0);
      const g = VE.grupoEn(grupos, tg);
      if (g) VE.texto.subtitulo(esc, g, tg, Object.assign({ caja: zonas.sub, resalte: esc.estilo.aviso }, subOpt));
      if (CFG.progreso !== false) {
        const h = 6 * esc.k;
        x.fillStyle = 'rgba(255,255,255,0.14)'; x.fillRect(0, H - h, W, h);
        x.fillStyle = esc.estilo.acento; x.fillRect(0, H - h, W * Math.min(1, tg / tl.duracion_total), h);
      }
    };
    window.capturar = function (tg, q = 0.92) {
      window.renderAt(tg);
      ox.drawImage(esc.canvas, 0, 0, out.width, out.height);
      return out.toDataURL('image/jpeg', q).slice(23);
    };
    await document.fonts.load('700 50px Fredoka'); await document.fonts.load('500 50px Fredoka');
    await document.fonts.ready;
  };
  window.ready = VE.iniciarProyecto();
})(window.VE = window.VE || {});
