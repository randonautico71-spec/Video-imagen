/* PLANTILLA 3D / 2,5D + montaje editorial. 1 funcion por parrafo de guion.md.
   Patron: cada escena monta su escena 3D (V.render) y encima los grafismos VE.ed, que entran al decir su palabra (ctx.palabra). */
const V = VE.vol, ED = VE.ed, E = VE.ease;
const en = (ctx, w, resp) => { const p = ctx.palabra(w); return p ? p.ini : resp; };          // instante (s, local) en que se dice 'w'
const camSilla = (t) => V.camara({ pos: [0.7 - 0.1 * t / 10, 1.1, 4.2], mira: [0.3, 0.85, 0], fov: 40 });

function sala(esc, rx = 0) {                                                                       // fondo 2D + decorado 3D que no pasa a rayos X
  V.fondo.estudio(esc, { a: 1 - rx }); if (rx > 0) V.fondo.plano(esc, { a: rx });
  return V.nodo({ sinRayos: true, alfa: 1 - rx, hijos: [V.modelos.sala({})] });
}

VE.proyecto({
  estilo: 'LAB',
  subtitulos: { estilo: 'editorial', clave: ['delante', 'fuerza', 'gravedad'], marca: 'RANDONAUTICO', tam: 46 },
  escenas: [
    // 1. GANCHO: reto. Persona sentada; dato grande al decir «silla».
    (esc, t, ctx) => {
      const escena = V.nodo({ hijos: [sala(esc), V.modelos.silla({ pos: [-0.05, 0, 0] }), V.modelos.maniqui({ pose: 'sentado', apoyo: 'pies', piesX: 0.47 })] });
      V.render(esc, escena, camSilla(t), { ambiente: 'estudio', sombras: { centro: [0.2, 0.6, 0], radio: 2.2 } });
      ED.dato(esc, { num: '1', etiqueta: 'reto: levántate sin inclinarte', x: 90 * esc.k, y: 420 * esc.k, a: VE.tramo(t, en(ctx, 'silla', 1), 0.5), tam: 110 });
      ED.vineta(esc); ED.grano(esc, ctx.tg);
    },
    // 2. MECANISMO: pasa a rayos X y marca el centro de gravedad con ondas y etiqueta.
    (esc, t, ctx) => {
      const rx = VE.tramo(t, en(ctx, 'peso', 1.2), 0.8), cam = camSilla(t + 10);
      const persona = V.modelos.maniqui({ pose: 'sentado', apoyo: 'pies', piesX: 0.47 });
      V.render(esc, V.nodo({ hijos: [sala(esc, rx), V.modelos.silla({ pos: [-0.05, 0, 0] }), persona] }), cam,
        rx >= 1 ? { ambiente: 'plano', rayosx: 1 } : { ambiente: 'estudio', sombras: { centro: [0.2, 0.6, 0], radio: 2.2 }, rayosx: rx * 0.999 });
      const cg = V.proyectar(esc, cam, V.posicion(persona, 'vientre'));                              // punto 3D -> pantalla
      const a = VE.tramo(t, en(ctx, 'gravedad', 3), 0.5);
      ED.ondas(esc, cg.x, cg.y, ctx.tg, { color: ED.COL.verde, radio: 110, a });
      ED.etiqueta(esc, { x: cg.x, y: cg.y, tx: cg.x + 200 * esc.k, ty: cg.y - 220 * esc.k, texto: 'centro de gravedad', a });
      ED.vineta(esc); ED.grano(esc, ctx.tg);
    },
    // 3. CIERRE: SIGUE A @randonautico (VE.ed.cierre).
    (esc, t, ctx) => {
      V.render(esc, V.nodo({ hijos: [sala(esc), V.modelos.silla({ pos: [-0.05, 0, 0] }), V.modelos.maniqui({ pose: 'de_pie', apoyo: 'pies', piesX: 0.47 })] }), camSilla(20), { ambiente: 'estudio' });
      ED.cierre(esc, t, 0.2, { captura: ED.captura(esc, 'cierre') });
    },
  ],
});
