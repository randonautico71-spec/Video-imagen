# Cómo se programa la imagen (resumen de lo aprendido, con mediciones)

## 1. Estructura de un vídeo
- `guion.md`: **1 párrafo = 1 escena**. `escenas.js`: **1 función por párrafo** `(esc, t, ctx)` (o `capitulos` en vídeos largos: un entorno persistente + piezas por párrafo).
- Todo lo que aparece es **función del tiempo `t`** (sin estado entre fotogramas): el render es reanudable y en paralelo porque cada fotograma se calcula solo.
- **Sincronía con la voz:** `VE.short.en(ctx, 'palabra', respaldo)` da el instante en que se dice esa palabra; el elemento entra con `VE.tramo(t, inicio, duración, easing)`. Siempre un **respaldo** por si la palabra no está en la transcripción.
- Aleatoriedad solo con `VE.rng('semilla')` (determinista: 4 procesos de render deben dar píxeles idénticos). Nunca `Math.random`.
- Texto siempre con `VE.texto.ajustar` + `trazar` (mide y encaja; sin desbordes) y contorno, no sombras.

## 2. Rendimiento (lo que más cuesta equivocarse)
- Sin GPU: **nunca** `ctx.filter` ni `shadowBlur` por fotograma (1.700 ms/fotograma). Se **hornea una vez** (`VE.real.hornear`, `esc.cache.halo/disco/bokeh`) y por fotograma solo `drawImage`.
- El coste crece con los **píxeles cubiertos**: halos enormes en mezcla aditiva son lo más caro. Medir siempre en caliente (el primer fotograma incluye el horneado).
- Medido: escenas de luz ≈ 200 ms/fotograma por proceso (ss 1.5); paisajes + objetos reales en vertical ≈ 680 ms. Cada proceso de render pica en ≈ 2 GB de RAM.

## 3. Estilo REALISTA (`VE.real`, estilo general)
- **Una HORA del día** (alba, día, atardecer, noche, tormenta) fija cielo, color de luz, sombra y niebla de **todo**: usar la misma hora en paisaje y objetos.
- **Perspectiva atmosférica:** lo lejano se mezcla con el color de niebla; capas de lejos a cerca entran escalonadas; paralaje suave.
- **Volumen:** cada objeto = caras con degradado claro→oscuro según la luz, textura por motas (piedra, corteza, hojas), cilindros con degradado horizontal, sombra suave en el suelo. La luz viene **siempre de la izquierda** al dibujar; si la hora la trae de la derecha, el motor espeja el lienzo.
- **Montañas** (lo más difícil): silueta fractal + relieve 2D; la iluminación sale de la pendiente suavizada **desplazada en diagonal** con la profundidad (barrancos que bajan desde las cumbres). Ruido por columna da cortinas o cebras: descartado. En vertical las alturas se escalan (×0,4) o salen agujas.
- **Nubes:** muchas motas con degradado radial que se desvanece (no bolas con brillo, que parecen globos).
- Objetos: `VE.real.objeto(esc, nombre, {x, y, tam, hora})` (castillo, árbol, pino, roca, nube, casa, velero, molino, faro). Nuevo: `VE.real.definirObjeto` y revisión en `demo/realismo.html?modo=objetos`.

## 4. Estilo LUZ (meditación)
Contornos **sin relleno**, color del trazo = color real del objeto aclarado, mezcla aditiva, trazos que se dibujan poco a poco (`VE.trazo`, `VE.med`, `VE.paisaje`), fondos oníricos o terrestres, efectos acordes al guion que se superponen y aparecen gradualmente.

## 5. SHORT vertical (1080×1920)
Fondo realista por escena + **gráfico explicativo** encima (palo y sombra, reloj, constelación…) + rótulo grande arriba (`VE.short.rotulo`) + pastillas de etiqueta + subtítulos abajo + **letrero final** (`VE.short.letrero`).
- Zonas seguras (estimación): arriba 10 %, abajo 21 %, derecha 14 %; el contenido vive en `ctx.zonas.cuerpo` y los subtítulos en la banda inferior.
- Cambio visual cada ≈ 5–8 s y algo siempre en movimiento (nubes, parpadeo, rebotes). Gancho en 3 s.
- Gráficos científicos con datos reales (p. ej. coordenadas RA/Dec de la Osa Mayor): proyectar, no dibujar «a ojo».

## 6. Calidad de codificación (medida)
- **Color:** el JPEG del canvas es BT.601 completo; sin conversión los reproductores lo veían desviado (rojo 191,0,0 → 207,17,0). El render convierte a **BT.709 y etiqueta** (error ≈ 1 nivel).
- `aq-mode=3` contra bandas en cielos oscuros, JPEG 0,97 en shorts, CRF 17, ss 1,5 (largos: ss 1,0/CRF 20).
- Audio: −14 LUFS en shorts; el ligero con 64 kbps y limitador (a 40 kbps el AAC distorsionaba y sobrepasaba el pico).

## 7. Control de calidad: el bucle que funciona
1. `vid.py qa <tema> --stills t1,t2,…` con **un fotograma por escena en el momento de máxima carga** (cuando ya han aparecido sus elementos).
2. **Mirar las imágenes** (hoja de contacto de 8): el linter solo ve lo que se registra.
3. Corregir y repetir. Errores reales encontrados así: musgo con aspecto de brócoli, montañas «cebra», etiquetas que se salían por la izquierda, un icono tapando el título, la luna confundida con la estrella Polar, observador invisible por falta de contraste.

## 8. Límites honestos
Ilustración pintada, no fotorrealismo. Faltan por hacer: ciudades y edificios, animales y personas realistas, lluvia, más objetos (torre, puente, barco de vapor). Todo se ha revisado en fotogramas, no a ojo en movimiento.
