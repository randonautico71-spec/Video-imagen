/* TIPOGRAFIA: medicion real, ajuste automatico y karaoke.

   El fallo que mas veces ha estropeado un video es texto que se sale o se solapa.
   La causa es escribir un tamano fijo y confiar en que quepa. Aqui nada se dibuja
   sin medirse antes: si no cabe, el motor baja el cuerpo hasta que cabe. */
(function (VE) {

  // Parte un texto en lineas que caben en 'ancho', midiendo de verdad cada palabra.
  function partir(x, txt, ancho) {
    const palabras = txt.split(/\s+/).filter(Boolean);
    const lineas = []; let linea = '';
    for (const p of palabras) {
      const prueba = linea ? linea + ' ' + p : p;
      if (x.measureText(prueba).width <= ancho || !linea) linea = prueba;
      else { lineas.push(linea); linea = p; }
    }
    if (linea) lineas.push(linea);
    return lineas;
  }

  /* Reparte en 2 lineas lo mas iguales posible. Un subtitulo de 9 palabras partido
     8+1 se lee fatal; partido 5+4 se lee solo. */
  function equilibrar(x, txt, ancho) {
    const palabras = txt.split(/\s+/).filter(Boolean);
    if (palabras.length < 2) return [txt];
    if (x.measureText(txt).width <= ancho) return [txt];
    let mejor = null;
    for (let i = 1; i < palabras.length; i++) {
      const a = palabras.slice(0, i).join(' '), b = palabras.slice(i).join(' ');
      const wa = x.measureText(a).width, wb = x.measureText(b).width;
      if (wa > ancho || wb > ancho) continue;
      const coste = Math.abs(wa - wb);
      if (!mejor || coste < mejor.coste) mejor = { coste, lineas: [a, b] };
    }
    return mejor ? mejor.lineas : partir(x, txt, ancho);
  }

  /* Busca el cuerpo mas grande con el que el texto cabe en la caja dada.
     Esto es lo que elimina de raiz el texto desbordado: no hay forma de que se salga. */
  function ajustar(esc, txt, caja, opt = {}) {
    const x = esc.ctx;
    const maxLineas = opt.maxLineas || 2;
    const peso = opt.peso || 700;
    let tam = opt.max || VE.tokens.SCALE.display;
    const min = opt.min || VE.tokens.SCALE.sm;
    const interlineado = opt.interlineado || 1.18;
    while (tam >= min) {
      esc.tipo(tam, peso);
      const lineas = maxLineas === 2 ? equilibrar(x, txt, caja.w) : partir(x, txt, caja.w);
      const alto = lineas.length * tam * esc.k * interlineado;
      const cabenAncho = lineas.every(l => x.measureText(l).width <= caja.w);
      if (lineas.length <= maxLineas && alto <= caja.h && cabenAncho) {
        return { tam, lineas, alto, peso };
      }
      tam -= 2;
    }
    // Suelo: devuelve el minimo partido como se pueda, y lo marca para que el linter avise.
    esc.tipo(min, peso);
    return { tam: min, lineas: partir(x, txt, caja.w), alto: 0, peso, desbordado: true };
  }

  /* Dibuja texto con contorno en vez de sombra: mas nitido y, sobre todo, sin
     shadowBlur (que es lo que hundia el rendimiento). */
  function trazar(esc, txt, px, py, opt = {}) {
    const x = esc.ctx;
    x.textAlign = opt.align || 'center';
    x.textBaseline = opt.baseline || 'middle';
    if (opt.contorno !== false) {
      x.lineWidth = (opt.contornoAncho || 8) * esc.k;
      x.strokeStyle = opt.contornoColor || 'rgba(0,0,0,0.82)';
      x.lineJoin = 'round'; x.miterLimit = 2;
      x.strokeText(txt, px, py);
    }
    x.fillStyle = opt.color || esc.estilo.tinta;
    x.fillText(txt, px, py);

    // Se registra la caja real medida, para que el linter pueda comprobar encuadre,
    // solapes y contraste sin que la escena tenga que acordarse de declararla.
    if (VE.registrar && opt.registrar !== false) {
      const m = x.measureText(txt);
      const alto = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0) || (parseInt(x.font) || 20);
      const al = x.textAlign, bl = x.textBaseline;
      const bx = al === 'center' ? px - m.width / 2 : al === 'right' ? px - m.width : px;
      const by = bl === 'middle' ? py - alto / 2 : bl === 'bottom' ? py - alto : py;
      VE.registrar('texto', { x: bx, y: by, w: m.width, h: alto }, {
        nota: txt.length > 28 ? txt.slice(0, 28) + '...' : txt,
        color: opt.color || esc.estilo.tinta,
        contorno: opt.contorno !== false,
        ignorarSeguro: opt.ignorarSeguro
      });
    }
  }

  /* Subtitulo karaoke: resalta la palabra que se esta diciendo ahora mismo.
     Recibe las palabras con sus tiempos (de Scribe) y el instante actual. */
  function subtitulo(esc, grupo, t, opt = {}) {
    const x = esc.ctx;
    const est = esc.estilo;
    const caja = opt.caja || {
      x: esc.seguro.x, w: esc.seguro.w,
      y: esc.seguro.y2 - 180 * esc.k, h: 170 * esc.k
    };
    const txt = grupo.palabras.map(p => p.t).join(' ');
    const fit = ajustar(esc, txt, { w: caja.w, h: caja.h }, {
      max: opt.tam || VE.tokens.SCALE.xxl, min: VE.tokens.SCALE.md, maxLineas: 2, peso: 700
    });
    esc.tipo(fit.tam, 700);
    const lh = fit.tam * esc.k * 1.18;
    const y0 = caja.y + caja.h / 2 - (fit.lineas.length - 1) * lh / 2;

    // Se dibuja palabra a palabra para poder colorear la activa, midiendo cada linea
    // para centrarla de verdad.
    let idx = 0;
    fit.lineas.forEach((linea, li) => {
      const palabras = linea.split(' ');
      const anchoLinea = x.measureText(linea).width;
      let px = esc.seguro.x + (caja.w - anchoLinea) / 2;
      const py = y0 + li * lh;
      for (const w of palabras) {
        const pal = grupo.palabras[idx];
        const activa = pal && t >= pal.ini && t < pal.fin;
        const wsp = x.measureText(w + ' ').width;
        trazar(esc, w, px, py, {
          align: 'left',
          color: activa ? (opt.resalte || est.aviso) : est.tinta,
          contornoAncho: 8
        });
        px += wsp; idx++;
      }
    });
    x.textAlign = 'center';
    return fit;
  }

  VE.texto = { partir, equilibrar, ajustar, trazar, subtitulo };
})(window.VE = window.VE || {});
