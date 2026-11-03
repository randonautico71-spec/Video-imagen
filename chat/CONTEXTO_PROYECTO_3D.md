# CONTEXTO DEL PROJECT «VÍDEOS 3D / 2,5D» (adjuntar en Conocimiento/Contexto del Project)

Archivo de referencia para producir cortos divulgativos verticales en 3D / 2,5D con el motor `randonautico71-spec/Video-imagen`
(rama `claude/3d-animation-video-graphics-q3e3ww` o la que la contenga). Las **instrucciones** (qué hacer y en qué orden) van en
«Instrucciones» del Project; este archivo es el **material de consulta**: fórmula del guion, reglas de datos, línea visual, API del motor,
plantilla de escenas comprobada, voz y entrega. Si el repositorio está conectado, las guías completas están en `docs/`.

---------------------------------------------------------------------------------------------------------------------------------
## 1. Ficha del vídeo
- SHORT vertical 1080×1920 · 30 fps · **60–90 s** (≈ 180–270 palabras a ~180 palabras/min) · subtítulos editoriales arriba.
- Voz **Carmen** (ElevenLabs) · música del motor `curiosos` · −14 LUFS.
- Imagen 3D/2,5D (`VE.vol`) + grafismos editoriales (`VE.ed`).
- Cierre: móvil «Envíaselo» y **después** «SIGUE A @randonautico» (el móvil no sustituye al letrero).
- Entrega: **siempre dos MP4**, `<tema>_short_pesado.mp4` y `<tema>_short_ligero.mp4` (< 10 MB).

## 2. Comandos (desde la raíz del repo)
```
bash chat/bootstrap.sh                                  # comprueba ffmpeg, node, Chromium, WebGL2 (3D), faster-whisper, red, recursos
python3 pipeline/vid.py nuevo <tema> --tipo short       # crea proyectos/<tema>/ (meta.json, guion.md, escenas.js)
python3 pipeline/revisar_guion.py proyectos/<tema>/guion.md   # formula de retencion + datos S/E aclarados (sale 1 si hay fallos)
python3 pipeline/vid.py estimar <tema>                  # duracion (60-90 s), tiempos, RAM, disco
python3 pipeline/vid.py voz-importar <tema> <audio>     # importa la voz de ElevenLabs y saca los tiempos de cada palabra
python3 pipeline/vid.py musica <tema> ; python3 pipeline/vid.py mezcla <tema>
python3 pipeline/vid.py qa <tema> --stills 1,5,9,…      # linter + fotogramas: MIRARLOS
python3 pipeline/vid.py render <tema>                   # pesado + ligero (reanudable: relanzar el mismo comando)
python3 pipeline/vid.py estado <tema>                   # en que paso esta
```

---------------------------------------------------------------------------------------------------------------------------------
## 3. Guion: fórmula de retención (sacada de 4 cortos de referencia del usuario)
Medido en las referencias: 44–88 s · ~180 palabras/min · frases de 8–14 palabras · 2.ª persona en el 5–7 % de las palabras ·
plano continuo con un cambio visual cada 2–4 s.

**Estructura (1 párrafo = 1 escena):**
1. **Gancho 0–3 s**: una afirmación concreta sobre **TU cuerpo o tu vida diaria** que choca. Sin saludos ni «hoy vamos a ver». Tipos:
   - **Reto**: «No puedes levantarte de una silla sin echarte hacia delante. Inténtalo ahora.» (el espectador lo prueba mientras mira).
   - **Mito dicho como verdad**, aclarado en ≤ 5 s: «Te comes ocho arañas al año mientras duermes.» → «Lo has oído mil veces, pero…».
   - **Amenaza íntima**: «Esta noche, mientras duermes, …» + «Y no te libras».
   - **Pregunta** + dato que rompe lo esperado en ≤ 5 s (el más flojo).
2. **Giro antes de 8 s**: confirma la promesa y abre la pregunta que se responde al final.
3. **Mecanismo en pasos diminutos**: una causa por frase; **comparaciones caseras** («lo que un grano de sal», «como una sierra»,
   «como por un tubito»); **pocas cifras**, concretas, cada una con su tarjeta; palabras coloquiales que hacen gracia o dan grima.
4. **Reenganche cada ~15–20 s**: «Pero mientras…, hace algo más.» · «Y lo peor…» · «Y resulta que…» · «¿Sigues sentado?».
5. **Giro final** que cambia el punto de vista: «el monstruo de la cama eres tú», «lo que te pica es tu propio cuerpo».
6. **Vuelta al gancho**: «Así que…» + la frase inicial corregida.
7. **CTA**: «Envíaselo a alguien que todavía no lo sabía» (destinatario concreto) · «Comenta cuántas veces…» · letrero de la marca.
   Si hay reto, un «sígueme» justo mientras el espectador lo está intentando funciona (y una serie numerada da motivo para seguir).

**Plantilla:**
```
[GANCHO 0–3 s] Afirmación sobre TU cuerpo/vida que choca.
[GIRO 3–8 s] «Pero…» / «Y no te libras…» / «Inténtalo ahora.»
[PASO 1..n] Una causa, una frase, una imagen. Comparación casera.
[REENGANCHE] «Pero mientras…, hace algo más.» / «Y lo peor…»
[GIRO FINAL] Cambia el punto de vista.
[VUELTA] «Así que…» + gancho corregido.
[CTA] «Envíaselo a alguien que…» + SIGUE A @randonautico (lo pone el motor).
```
**Comprobación** (`revisar_guion.py`): primera frase ≤ 16 palabras (> 20 = fallo) y sin saludo · giro antes de 8 s · frase media ≤ 14 y
ninguna > 24 · 2.ª persona ≥ 4 % · reenganche al menos cada ~20 s · cierre que vuelve al gancho · CTA · duración 60–90 s ·
datos S/E aclarados en la narración.

---------------------------------------------------------------------------------------------------------------------------------
## 4. Datos (regla del usuario)
- **Nunca datos inventados presentados como hechos.** Lo que se cuenta como hecho lleva fuente (primaria o secundaria fiable).
- Un mito, una suposición o una creencia generalizada **puede entrar si la narración dice que lo es** («se dice que…», «es un mito», «se cree»).
- **Estimaciones** solo si el usuario pide un «¿qué pasaría si…?»: hipótesis y cálculo en `datos.md`; la narración lo dice
  («suponiendo que…», «sería, aproximadamente,…», «es una estimación»).
- **Fuentes nunca en pantalla** (ni en las tarjetas de dato).

`datos.md`:
```
| # | afirmación (como sale en el guion) | nivel | fuente o cálculo |
|---|---|---|---|
| 1 | … | V  | institución / artículo / norma (enlace) |
| 2 | … | V* | fuente secundaria fiable |
| 3 | … | S  | creencia popular → la narración dice «se dice que…» |
| 4 | … | E  | hipótesis + cálculo → la narración dice «sería unos…» |
| 5 | … | X  | sin fuente: NO entra |
```

---------------------------------------------------------------------------------------------------------------------------------
## 5. Línea visual (lo que hay que imitar de las referencias)
- **Plano continuo**: casi sin cortes; se pasa de un plano al siguiente **acercándose a través** (persona → detalle → interior) o moviendo
  la cámara 3D; cambio visual cada 2–4 s, al ritmo de las frases.
- **Cada frase tiene su imagen o su grafismo**, que entra **al decir su palabra** (`ctx.palabra('palabra')`).
- **Subtítulos arriba**: palabra a palabra; dichas en gris, la activa en blanco negrita; palabras clave **enmarcadas** (selección azul).
- **Grafismos finos y escasos**: etiqueta con línea guía · ondas concéntricas (vibración, latido) · dato grande (tachado en rojo al
  desmentir un mito) · tarjeta comparativa · regla de medida verde · lupa · chip de año · partículas · burbujas de aliento.
- **Acabado**: luz baja y cálida o azul nocturna, viñeta arriba (para leer el texto), grano fino, un color de acento.
- **Modo rayos X** para explicar mecanismos (centro de gravedad, fuerzas, órganos).
- **Rasgos de personas** (ojos, boca, pelo) solo en planos cercanos donde el tema los pida; **bichos, órganos, cortes por capas o
  telas** solo si el tema los necesita. Lo que falte se construye con piezas y se revisa en fotogramas.
- Reglas fijas: sin fuentes en pantalla · sin chips HOOK/PUPA/QUIZ · sin estilos Pollín ni pizarra · objetos reales bien dibujados.

---------------------------------------------------------------------------------------------------------------------------------
## 6. API del motor (resumen)
### Contrato de `escenas.js`
```js
VE.proyecto({
  estilo: 'LAB',
  subtitulos: { estilo: 'editorial', clave: ['palabra', ...], marca: 'RANDONAUTICO', tam: 46 },
  escenas: [ (esc, t, ctx) => { ... }, ... ]          // UNA funcion por parrafo de guion.md, en orden
});
```
- `esc`: lienzo (unidades de diseño 1080×1920; `esc.W`, `esc.H`, `esc.k` escala tipográfica, `esc.ctx` contexto 2D).
- `t`: segundos desde que empieza la escena. `ctx.tg`: segundos desde el inicio del vídeo. `ctx.dur`, `ctx.p` (0..1).
- `ctx.palabra('texto')` → `{ini, fin}` (tiempos locales) o `null`. Patrón: `const en = (ctx, w, resp) => { const p = ctx.palabra(w); return p ? p.ini : resp; };`
- Animar: `VE.tramo(t, inicio, duracion, VE.ease.suave)` → 0..1. Aleatorio solo con `VE.rng('semilla')` (nunca `Math.random`).
- La 1.ª escena se ve completa desde el fotograma 0 (es el gancho y la miniatura); las demás entran con un fundido corto.

### `VE.vol` (3D)
```js
const V = VE.vol;
V.render(esc, V.nodo({ hijos: [...] }), cam, { ambiente, sombras: { centro, radio }, rayosx: 0..1, niebla: { color, cerca, lejos } });
const cam = V.camara({ pos: [x,y,z], mira: [x,y,z], arriba: [0,1,0], fov: 40 });   // o V.orbita(centro, dist, rumbo, elevacion)
V.proyectar(esc, cam, [x,y,z]) -> { x, y, delante }      // para anclar grafismos 2D a un punto 3D
V.posicion(arbol, 'nombre_pieza') -> [x,y,z]              // p. ej. 'cabeza', 'vientre', 'pecho', 'mano_d', 'pie_i'
V.linea(esc, cam, puntos3D, { color, discontinua, progreso, oculta }) · V.marcador(esc, cam, p, { a })
```
- Nodo: `{ malla, mat, pos, rot: [rx,ry,rz], esc, m, hijos, nombre, sinSombra, sinRayos, alfa }`. Y arriba; vehículos con el morro a +Z;
  personas mirando a +X (vista lateral = cámara en +Z). Unidades libres (personas ≈ 1,75; exteriores en metros).
- Material: `{ color, tipo: 'mate'|'brillo'|'rayosx'|'plano'|'sombra', alfa, mapa: <canvas>, esp, dureza, envolver, borde, emision }`.
- Ambientes: `estudio` (interior cálido), `dia`, `atardecer`, `noche`, `espacio` (luz con la cámara), `plano` (rayos X).
- Mallas (`V.malla`): `esfera`, `capsula(r1,r2,largo)`, `caja(w,h,d,bisel)`, `cilindro(r1,r2,h)`, `torno(perfil)`, `toro`,
  `extrusion(poligono,prof)`, `loft(secciones)`, `plano`, `tubo(puntos,radio,{dinamica})`, `parametrica`, `fusionar`.
- Modelos (`V.modelos`): `tierra({nubes, atmosfera})`, `avion({m})`, `maniqui({pose, apoyo:'pies', piesX, resaltar, colores, equipo})`,
  `silla`, `sala`, `nube`, `arbol({tipo:'pino'})`, `barco_vikingo`, `vikingo`, `defensor` (arquero), `castillo({puerta, golpe})`,
  `terreno({alto(x,z)})`, `mar({t})`. Poses: `de_pie`, `sentado`, `inclinado`, `saludar`, `pensar`, `cubrirse`, `arquero`,
  `V.pose.andar(fase)`, `V.pose.correr(fase)`, `V.pose.hachazo(fase)`, `V.pose.mezclar(a, b, p)`.
- Geografía: `V.geo.punto(lat, lon, r)`, `ruta(a, b, n, altura)`, `enRuta(ruta, t)`, `distancia(a, b)` (km), `visible(p, cam)`.
- Fondos 2D: `V.fondo.estudio`, `espacio`, `plano` (rayos X), `cielo({hora})`. Efectos: `V.efectos.flecha`, `V.efectos.astillas`.
- Decorado que no debe pasar a rayos X: envolverlo en `V.nodo({ sinRayos: true, alfa: 1 - rx, hijos: [...] })`.

### `VE.ed` (grafismos editoriales)
```js
const ED = VE.ed;
ED.dato(esc, { num, etiqueta, x, y, a, tam, tachado: 0..1, color })
ED.tarjeta(esc, { x, y, a, columnas: [{ num, etiqueta, color }] })
ED.etiqueta(esc, { x, y, tx, ty, texto, sub, a })            // punto (x,y) y texto en (tx,ty)
ED.ondas(esc, x, y, ctx.tg, { color, radio, achatado, periodo, a })
ED.medida(esc, x, y0, y1, '0,3 mm', { a })
ED.lupa(esc, cx, cy, r, (x) => {...}, { a }) · ED.lupaImagen(esc, cx, cy, r, fx, fy, aumento, { a })
ED.chip(esc, '2022', x, y, { a }) · ED.particulas(esc, 'semilla', t, { caja, n, color }) · ED.chorro(esc, 'semilla', t, { x, y, dir })
ED.zoom(esc, { cx, cy, escala, centrar }, () => { ... })     // camara 2D: transicion «a traves»
ED.vineta(esc) · ED.grano(esc, ctx.tg)                         // acabado (al final de cada escena)
ED.cierre(esc, t, t0, { captura: ED.captura(esc, 'cierre') }) // movil «Envíaselo» + SIGUE A @randonautico
ED.COL = { sel, rojo, verde, cian, ... }
```

---------------------------------------------------------------------------------------------------------------------------------
## 7. Plantilla comprobada (renderizada con el motor y QA «sin incidencias»)
`guion.md` de ejemplo (3 párrafos = 3 escenas):
```
No puedes levantarte de una silla sin echarte hacia delante. Inténtalo ahora.

No es cuestión de fuerza: tu peso tira desde un punto, tu centro de gravedad.

Envíaselo a alguien que todavía no lo sabía.
```
`escenas.js` (en el repo: `proyectos/_plantilla/escenas_3d.js`):
```js
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
  subtitulos: { estilo: 'editorial', clave: ['delante', 'fuerza', 'gravedad', 'envíaselo'], marca: 'RANDONAUTICO', tam: 46 },
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
    // 3. CIERRE: movil «Envíaselo» y despues SIGUE A @randonautico (VE.ed.cierre).
    (esc, t, ctx) => {
      V.render(esc, V.nodo({ hijos: [sala(esc), V.modelos.silla({ pos: [-0.05, 0, 0] }), V.modelos.maniqui({ pose: 'de_pie', apoyo: 'pies', piesX: 0.47 })] }), camSilla(20), { ambiente: 'estudio' });
      ED.cierre(esc, t, 0.2, { captura: ED.captura(esc, 'cierre') });
    },
  ],
});
```
Para un vídeo real: un párrafo por idea (10–20 escenas en 60–90 s), un grafismo por frase y un `ED.cierre` en la última escena.

---------------------------------------------------------------------------------------------------------------------------------
## 8. Sonido
1. **Voz Carmen (ElevenLabs)**, como en los demás proyectos: `creative_generate_speech` con `voice_id = iHGx33VgO2KQ1Fdw6noG`,
   `model_id = eleven_v4`. Primero **`estimate_only = true`** y decir el coste; después con **`generations_count = 1`**.
   Esperar con `creative_get_flow_run_status`, descargar y guardar como `proyectos/<tema>/salida/locucion_eleven.mp3`.
2. `python3 pipeline/vid.py voz-importar <tema> <audio>` → alinea con faster-whisper local y saca los tiempos de cada palabra.
3. Música del motor (`curiosos`; no cambiarla sin que lo pida el usuario) y `mezcla` (−14 LUFS, la música baja bajo la voz).

## 9. Revisión y entrega
- `vid.py qa <tema> --stills …` con un fotograma por escena en su momento de máxima carga; **mirar las imágenes** (encuadre, texto que
  se sale, grafismos que tapan, contraste). El linter solo ve lo que se registra.
- `vid.py render <tema>` → `proyectos/<tema>/salida/v_short/<tema>_short_pesado.mp4` y `<tema>_short_ligero.mp4` (< 10 MB).
  **Si falta cualquiera de los dos, el vídeo no está terminado.**
- Entregar: los dos MP4 + `guion.md` + `datos.md` + qué es verificado (V/V*), qué es suposición (S) y qué es estimación (E).

## 10. Rendimiento y errores conocidos
- Sin GPU: WebGL2 por CPU (SwiftShader). Medido: 0,6–2,5 s por fotograma según la escena; un SHORT de 75 s con 4 procesos ≈ 10–30 min.
  Cada proceso de render usa ~2 GB de RAM; el motor decide cuántos.
- Nunca `ctx.filter` ni `shadowBlur` por fotograma; texturas y sprites se hornean una vez.
- Sombras: la caja `sombras: { centro, radio }` ajustada a lo importante (más pequeña = más nítida).
- Personas: usar `apoyo: 'pies'` (y `piesX`) para que pisen el suelo y no patinen al cambiar de pose.
- Lo visto al revisar fotogramas: cámara de espaldas al sujeto, objetos en el aire en bordes de colina, nubes como burbujas, líneas 2D
  con puntos detrás de la cámara, atmósfera como lámina al acercarse a la Tierra. Revisar siempre en fotogramas.
- Sin WebGL2 en el contenedor del chat (lo dice `bootstrap.sh`): preparar `guion.md`, `datos.md`, `escenas.js`, `meta.json` y producir en Claude Code.
