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

## 3 bis. Estilo VOLUMEN 3D (`VE.vol`, engine/volumen/)
Ilustración 3D tipo «animación explicativa»: piezas lisas con volumen, luz cálida con brillo de borde, sombras suaves y una cámara que se mueve. Sirve para cualquier tema (vehículos, personas, planetas, objetos, procesos) porque los modelos se **montan con piezas** y se animan con `t`.
- **Motor**: WebGL2 propio (sin librerías). En este contenedor va por SwiftShader (CPU). Medido (vertical, ss 1,5): avión sobre el globo ≈ 0,6 s/fotograma; maniquí en una sala con sombras ≈ 0,9 s/fotograma; el primer fotograma hornea texturas (≈ 5 s la Tierra). **Determinista**: dos procesos dan la misma huella de imagen.
- **Capas**: `V.render` pinta sobre el lienzo 2D, así que se mezcla con `VE.real`, rótulos y subtítulos. Para que un objeto tape un grafismo 2D (la ruta, una etiqueta) se pinta en dos pasadas: fondo 3D → grafismo 2D → objeto 3D.
- **Luz**: ambientes `estudio` (interior cálido), `dia`, `atardecer`, `noche`, `espacio` (luz pegada a la cámara: el sujeto siempre se ve iluminado), `plano` (rayos X). Sombras con `sombras: {centro, radio}` (caja ajustada a lo que importa: más pequeña = más nítida).
- **Rayos X**: `rayosx: 0..1` mezcla el modelo normal con su contorno luminoso; `1` = plano técnico (con `V.fondo.plano`). El decorado se marca `sinRayos` para que desaparezca.
- **Personas**: `V.modelos.maniqui({pose, apoyo: 'pies', piesX})` coloca la figura en el suelo sola y los pies no patinan al cambiar de pose. Poses: `de_pie`, `sentado`, `inclinado`, `saludar`, `pensar`, `V.pose.andar(fase)`, `V.pose.correr(fase)`, `V.pose.mezclar(a, b, p)`. `resaltar: {muslo_d: '#ff7a3d'}` colorea piezas («estos músculos trabajan»).
- **Tierra**: costas de Natural Earth 1:50m (dominio público) simplificadas en `tierra_datos.js` (`pipeline/generar_tierra.py`); `V.geo.punto/ruta/enRuta/distancia/visible`. Colores de desiertos, hielo y nubes: estilizados, no datos reales. La distancia de gran círculo sí es cálculo real (radio medio 6.371 km).
- **Errores encontrados al revisar fotogramas**: Tierra en el lado nocturno (luz fija en el mundo → ahora `espacio` lleva la luz con la cámara); pellizco de textura en los polos (ruido calculado sobre la esfera); horizonte poligonal de cerca (esfera de 192 segmentos); atmósfera y nubes como una lámina cian al rozar (se desvanecen de canto y al acercarse); línea 2D gigante con puntos detrás de la cámara (se corta); pies flotando al inclinarse (apoyo automático).
- **Combate** (mismo ejemplo, 22,5 s, 4 planos): arqueros en las almenas con ciclo de tensar y soltar, flechas en parábola que se clavan, escudos sobre la cabeza, hachazos con astillas en cada impacto, la puerta cede y la cámara tiembla. Todo es función de `t` (sin estado). Medido: ≈ 2–2,5 s/fotograma en el plano de la puerta (ss 1).
- **Exteriores** (ejemplo `modo=vikingos`, 3 planos): terreno con una función de altura, mar con olas, cielo de `VE.real.horas` y niebla del mismo color que el horizonte. Personajes = maniquí con `colores` y `equipo` (casco, barba, escudo, hacha). Medido: ≈ 1,1–1,5 s/fotograma (ss 1). Errores vistos en fotogramas: castillo en el aire en el borde de la colina (cimientos), cámara de espaldas al barco, todos saltando a la vez, nubes del cielo como burbujas.
- **Límites**: estilo de ilustración lisa, no fotorrealismo; sin pelo, telas ni agua animada; las caras del maniquí no tienen rasgos. Los modelos nuevos se revisan siempre en fotogramas (`demo/volumen.html` o `qa --stills`).

## 3 ter. Línea editorial de referencia (4 cortos analizados fotograma a fotograma, nov. 2026)
Cortos verticales divulgativos de 45–88 s (maniquí y silla; arañas al dormir; ácaros Demodex; picadura de mosquito). Lo común, que es lo que se imita (el lenguaje, no sus personajes ni escenas):
- **Plano continuo**: casi sin cortes (detección de cortes: 0 en tres de ellos, 7 en el otro). Se pasa de un plano a otro **ampliando a través** (cara → cama → araña → boca; piel → poro → ácaro), con fundidos cortos. Cambio visual cada 2–4 s.
- **Escala macro ↔ micro**: personaje entero → detalle → interior (corte de piel con capas, vasos y nervios) y vuelta.
- **Subtítulos arriba**, 1–2 líneas, palabra a palabra: dichas en gris, la activa en blanco negrita, las que faltan no se ven; las palabras clave llevan un **marco de selección azul con tiradores**. Marca en mayúsculas espaciadas encima.
- **Grafismos finos y escasos**: etiquetas con línea guía y punto («respira», «corazón», «calor», «aliento»), **ondas concéntricas** (vibración, latido), **tarjetas de dato** (número grande + etiqueta; el dato falso se **tacha en rojo**). Las referencias ponen la fuente en pequeño: **aquí NO** (regla del usuario: las fuentes van en `datos.md`, nunca en pantalla), comparativas en tarjeta oscura, **regla de medida** verde con pastilla («0,3 mm»), chip de año, **lupa** circular sobre un detalle, partículas que brillan, burbujas de aliento.
- **Acabado**: luz baja y cálida o azul nocturna, viñeta oscura arriba (para el texto), grano fino, colores apagados y un acento (rojo, verde o cian).
- **Cierre**: móvil con la hoja de compartir y un dedo que pulsa «Enviar» («Envíaselo a alguien que todavía no lo sabía») y **después** el letrero «SIGUE A @randonautico» (`VE.ed.cierre`). El móvil no sustituye al letrero.
- **Materia**: ilustración 2,5D pintada (cara de persona dormida, edredón acolchado, araña con pelos), ilustración plana con textura (ácaros, siluetas) y 3D casi realista (mosquito, piel). Personas con **rasgos** (ojos cerrados, boca), no maniquíes.
Hecho en el motor: `VE.ed` (engine/estilos/edicion.js) con todo lo anterior salvo la materia; revisión en `demo/edicion.html` (16 s). **Criterio del usuario para la materia**: personas con rasgos (ojos, boca, pelo) solo en planos cercanos donde el tema los pida; en planos generales basta la figura. Bichos, órganos, cortes por capas o telas se recrean solo cuando el tema del vídeo los necesite. Se construyen en ese momento, se añaden a la biblioteca y se revisan en fotogramas.

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
