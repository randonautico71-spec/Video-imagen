# Recreaciones 3D narradas (batallas, fútbol, cualquier suceso con maniquíes)

Guía para producir un vídeo que **recrea un suceso real con figuras 3D** (maniquíes del motor `VE.vol`) y lo **narra con voz de ElevenLabs** (Carmen), como en el resto de shorts del canal. Sirve para batallas, jugadas de fútbol y cualquier otro hecho: un rescate, una carrera, una expedición, una catástrofe, un invento en acción…

Antes de empezar, leer: `docs/TIPO_SHORT.md` (flujo de producción, voz y render), `docs/FUTBOL_3D.md` (fútbol), `docs/GUIA_IMAGEN.md` (sección 3 bis, motor 3D, mediciones) y `docs/REFERENCIA_TECNICA.md` (API).

Ejemplos ya hechos y revisados en fotogramas (están en `proyectos/`, que no se sube al repositorio):
- **Batalla del Puente de Stirling (1297)**: terreno con río, puente, castillo y monte; unas 800 figuras; 6 planos con cámara lenta en el choque.
- **Gol del Siglo (Maradona, México 86)**: rehecho a partir de un vídeo de referencia del usuario; 5 planos, con cámaras de televisión y etalonaje.
- `demo/futbol.html` (gol de cabeza en 5 planos) y `demo/batalla.html?modo=piezas|horno|carga|fuego` (piezas de batalla, ejércitos horneados, fuego).

---

## 1. Qué decide el usuario y qué decides tú

**El usuario dice**: qué recrear (p. ej. «la batalla de Bannockburn», «el gol de X en la final de Y»), el formato (por defecto **SHORT vertical**) y, si quiere, detalles: planos, equipaciones, estilo y duración. Puede adjuntar un **vídeo o imágenes de referencia**.

**Tú decides el resto y lo dices**: ficha de recreación, guion narrado, `datos.md`, planos, cámaras y diseño visual. Pregunta **solo** lo que cambie el contenido de forma importante y no se pueda deducir. Por ejemplo, si el usuario pide algo que no es histórico (fuego en una batalla sin incendios documentados), pregúntale si lo quiere como licencia artística avisándolo en pantalla, solo como ambiente o en otra recreación.

## 2. Reglas que no se negocian

1. **NO ALUCINES.** Cada fecha, cifra, nombre o hecho lleva fuente en `datos.md` con nivel **V** (fuente primaria), **V\*** (varias fuentes secundarias fiables coinciden) o **X** (aproximado o no verificado). Lo que es X no se narra como hecho. Si las fuentes discrepan (las cifras de tropas casi siempre lo hacen), se narra la discrepancia: «las crónicas hablan de…, pero los historiadores dudan».
2. **Recreación propia, nunca copia de una película, serie o videojuego.** No se reproducen sus personajes, planos, diálogos, discursos, música ni estética. Si el usuario nombra una película (p. ej. *Braveheart*), se recrea **el hecho histórico** en el que se inspira y se le explica en una línea.
3. **No se copian narraciones famosas** (comentarios de radio o televisión, frases célebres de locutores). El texto se escribe nuevo. Una cita histórica breve y documentada puede entrar con su fuente en `datos.md`.
4. **Sin escudos, logotipos, patrocinadores ni marcas reales.** Equipos y bandos se reconocen por **colores**. Banderas nacionales genéricas (aspa de San Andrés, cruz de San Jorge…) sí. Los **blasones son inventados**, y así se apunta en `datos.md`.
5. **En pantalla, siempre «Recreación aproximada»**, en la zona superior o en la primera escena, para no chocar con los subtítulos.
6. **Los maniquíes no tienen cara**, y no se intenta parecerse físicamente a nadie real. A una persona real se la identifica con un rótulo con su nombre (si está verificado) y un dorsal.
7. Reglas del canal: sin fuentes escritas al pie de la imagen, sin chips HOOK/PUPA/QUIZ, sin estilos Pollín ni pizarra. No se renderizan vídeos de prueba que no se pidan: se valida con fotogramas.

## 3. Ficha de recreación (`proyectos/<tema>/ficha.md`)

```
TIPO          batalla | futbol | otro (describir)
FORMATO       short (1080x1920, 30 fps, 60–90 s) [por defecto] | largo (16:9)
SUCESO        qué, cuándo, dónde (con fuente)
BANDOS        nombres, colores de equipación o librea, armas y armaduras de la época (con nivel V / V* / X)
TERRENO       elementos clave que explican el suceso (río, puente, colina, pantano, área, portería…)
SECUENCIA     fases en orden, con sus protagonistas (de las fuentes o del vídeo de referencia)
PLANOS        lista de planos, uno por escena del guion (ver §6)
REFERENCIA    vídeo o imágenes del usuario: qué se ha sacado de ahí (geometría de la jugada, equipaciones…)
LICENCIAS     lo que se inventa o se aproxima y cómo se avisa
```

**Si hay vídeo de referencia**, se extraen fotogramas (`ffmpeg -vf fps=2,tile=4x3`) y se anotan posiciones, trayectorias, quién supera a quién, el lado por el que se remata, las equipaciones y la celebración. Es exactamente lo que corrigió el error del primer intento del Gol del Siglo: se había inventado la ruta. **No se copia la imagen**: solo se toma la geometría.

## 4. Guion narrado (`guion.md`: 1 párrafo = 1 escena = 1 plano)

### 4.1 Batallas: «cómo sucedió en ese momento»
Narración en **presente histórico**, con tono de documental, frases cortas y lenguaje vivo, pero **solo con hechos de `datos.md`**. Estructura de un short de **60–90 s** (unas 150–230 palabras; con Carmen, 172 palabras = 68 s):

| Bloque | Contenido | Plano típico |
|---|---|---|
| **Gancho** (0–3 s) | Una pregunta o una promesa concreta: «¿Cómo vence un ejército más pequeño a la caballería más temida de su tiempo? Con un puente.» | Aéreo del escenario |
| **Contexto** | Fecha, lugar, guerra, quién manda cada bando (V/V\*) | Grúa sobre el terreno, rótulo con la fecha |
| **El escenario** | El elemento del terreno que lo decide todo (puente, pantano, colina) | Plano del terreno, con el elemento clave en primer plano |
| **Fases** (2–4 párrafos) | Lo que hace cada bando, en orden: despliegue, movimiento clave, choque | Un plano por fase: columna cruzando, carga, choque (cámara lenta) |
| **El giro** | La decisión táctica o el error que cambia la batalla | Plano cenital o aéreo del momento |
| **Desenlace** | Cómo termina y qué pasa con los protagonistas (solo lo verificado) | Plano del final (río, desbandada…) |
| **Consecuencias y dato curioso** | Qué cambió después; un dato poco conocido y verificado | Mapa aéreo con etiquetas |
| **Cierre** | Una pregunta para comentarios y la frase final **«Para más contenido como este, no olvides suscribirte.»** En los últimos 3–4 s aparece la tarjeta **«NO OLVIDES / SUSCRIBIRTE»** (`VE.short.letrero(esc, t, tInicio, { texto: 'NO OLVIDES', handle: 'SUSCRIBIRTE' })`), que entra con la palabra «suscribirte». **No se usa el letrero «SIGUE A @randonautico».** | Plano final (mapa o vista general) |

- **Números**: solo con fuente. Si el número de soldados es dudoso, en el vídeo es **simbólico** y la narración no da cifras o da el rango con «según…».
- **Sin diálogos inventados** puestos en boca de personajes reales.
- Las palabras clave de cada párrafo (el «puente», la «carga», el «río») son las que disparan los momentos visuales (§7).

### 4.2 Fútbol: lo que se pida
- **Jugada célebre**: gancho → contexto del partido (fecha, competición, rivales y marcador antes de la jugada, todo V/V\*) → la jugada narrada toque a toque, al ritmo del vídeo → el gol → por qué es histórica (datos verificados) → cierre.
- **Táctica o análisis**: lo que se explique, con plano cenital, líneas de pase y desmarques (`V.linea`, `V.marcador`).
- **Ficción o «qué habría pasado si…»**: se avisa claramente de que es inventado.
- El relato es **original**: no se copian narraciones de radio o televisión famosas.

### 4.3 Otros sucesos (rescates, carreras, expediciones, catástrofes, inventos…)
La misma plantilla: gancho → contexto → escenario → fases → giro → desenlace → dato → cierre. Si el motor no tiene una pieza (un barco concreto, una máquina…), se monta con las piezas de `V.malla` (§8) y se revisa en fotogramas antes de seguir.

## 5. Voz con ElevenLabs (como en los demás shorts)

**Por defecto, el audio de una recreación (la voz de Carmen y los efectos de sonido) se genera con ElevenLabs**, con su conector. Si el usuario indica otra voz (otra de ElevenLabs o una del motor), se usa esa.

Flujo de `docs/TIPO_SHORT.md`, paso 4:
1. `python3 pipeline/vid.py nuevo <tema> --tipo short` → escribir `guion.md`, `datos.md` y `ficha.md`.
2. `python3 pipeline/vid.py estimar <tema>`: la duración debe caer **entre 60 y 90 s**. Se pone `"duracion_objetivo_s": [60, 90]` en `meta.json` para que el motor avise; si se pasa, se recorta el guion antes de generar la voz.
3. `python3 pipeline/vid.py voz <tema>` la primera vez: crea `salida/locucion.txt` con el texto limpio y dice qué falta.
4. **ElevenLabs** (gasta créditos):
   - `creative_generate_speech` con `voice_id = iHGx33VgO2KQ1Fdw6noG` (**Carmen**, peninsular) y `model_id = eleven_v4`.
   - **Primero `estimate_only = true`**: se le dice el coste al usuario.
   - Después la generación real, con **`generations_count = 1`** (por defecto serían 2 y se cobran las dos).
   - Esperar con `creative_get_flow_run_status`, descargar el audio y guardarlo como `proyectos/<tema>/salida/locucion_eleven.mp3`, o importarlo con `python3 pipeline/vid.py voz-importar <tema> <audio>`.
   - `vid.py voz <tema>` alinea el audio con el guion (faster-whisper local): tiempos de frase y de palabra, y escenas cronometradas por párrafo.
5. Tono: para batallas, narración documental con tensión (frases cortas, pausas en los cambios de fase). Para fútbol, más ritmo y emoción en el momento del gol. Carmen es una sola voz: el ritmo se marca con la puntuación del guion (comas, puntos y párrafos), no con etiquetas.
6. Otras voces solo si el usuario lo pide (Aiden con `meta.voz = 'aiden'`, Serena en los largos…). Los perfiles de `config/perfiles_voz.json` no se tocan.

Música: el estilo del perfil (`curiosos` en los shorts) sin cambiarlo; `vid.py musica` y `vid.py mezcla`.

### 5.1 Efectos de sonido (ElevenLabs) y montaje del audio sin repetir el render
- **Efectos**: nodos `sfx` con el modelo `eleven_text_to_sound_v2` en el **mismo flow** que la voz (`creative_add_flow_node` con `model_parameters: {duration_seconds, loop, prompt_influence}`). Después, `creative_run_flow_nodes` con **`estimate_only`** primero y **`generations_count = 1`**. Medido: 6 efectos (4–20 s) = 206 créditos, y la voz de 68 s = 996. Prompts en inglés, concretos: «column of armoured knights crossing a wooden bridge: hooves on planks, chainmail…», «spears striking shields, horses neighing in panic…», «soldiers falling from a bridge into a river: heavy splashes…». Un ambiente en bucle (`loop: true`) va debajo de todo.
- **Flujo para no repetir el render 3D** (~1 h):
  1. Se renderiza el vídeo **mudo** con la duración **estimada** de cada escena: la duración de la voz repartida por los caracteres de cada párrafo, más la cola en la última. Se guarda en `escenas_estimadas.json`.
  2. Cuando llega el audio: `vid.py voz-importar <tema> <audio>` (alinea la voz) y, opcionalmente, `vid.py musica <tema>`.
  3. `python3 pipeline/recreacion_audio.py <tema>`: reajusta cada escena a la duración real de su párrafo (cambio de velocidad pequeño), quema los subtítulos (Fredoka 700, palabra resaltada, por encima de la zona segura inferior), coloca los efectos de `efectos.json` (por escena, segundo o **palabra** del guion; bucles; volumen; fundidos), mezcla voz + efectos + música (con ducking bajo la voz) a los LUFS del perfil y saca el pesado y el ligero.
- **Red**: los audios de ElevenLabs se descargan ahora desde **`elevenlabsusercontent.com`** (antes, `storage.googleapis.com`). Si el entorno no lo tiene en *Allowed domains*, el conector genera bien pero la descarga falla con `000` o `403`: añadir el dominio, o bajar los audios desde el flow y adjuntarlos. Los enlaces caducan en ~2 h; `creative_get_flow_run_status` da enlaces nuevos sin generar ni cobrar nada.

## 6. Planos de cámara (todos dependen solo de `t`)

| Plano | Para qué | Cómo (`V.camara` / `F.planos`) |
|---|---|---|
| **Aéreo o grúa** | Escenario y contexto | Cámara alta que baja y avanza (`pos` interpolada con `VE.tramo`) |
| **Retransmisión** (fútbol) | Ver la jugada como en televisión | Teleobjetivo desde la grada (fov 11–22), sigue el balón con retraso (`F.balonSuave`), temblor de operador (`F.pulso`) |
| **Seguimiento o al hombro** | Carrera, carga | Detrás del protagonista, con bote (`0.14·sin(8.6·t)`) |
| **Lateral bajo** | Duelo, regate, choque de líneas | A ras de suelo, con las figuras grandes |
| **Choque con cámara lenta** | El impacto decisivo | Se remapea el tiempo del plano (0,3x en el impacto y luego acelera) + sacudida que se apaga en cada golpe |
| **Detrás de la portería o del puente** | Remate, atasco, caídas al agua | Cámara fija con encuadre cuidado (que se vea la portería o el puente) |
| **Cenital o mapa** | Explicar la táctica y el giro | Cámara alta; `V.linea` para trayectorias; etiquetas con `VE.short.pastilla` ancladas con `V.proyectar` |

- En **vertical**, el fútbol funciona mejor con teleobjetivo cerrado desde la grada, seguimiento y detrás de la portería. Las batallas, con grúa en profundidad, al hombro y lateral bajo.
- **Con teleobjetivo, el público y los ejércitos lejanos se ven de bloques**: subir la cámara para que el fondo sea césped o terreno.
- Errores ya vistos (evitarlos): cámara metida dentro de un bloque de caballería; cámara de celebración apuntando a la grada con el jugador en el borde; portería fuera del encuadre; un defensa tapando al protagonista; etiquetas montadas en el plano cenital.

## 7. Montaje y producción (flujo probado con la batalla de Stirling)

La recreación es **un solo mundo continuo**: la jugada o los ejércitos se definen una vez, como funciones de `t`, y **cada escena (un párrafo del guion) muestra un tramo de ese mundo con su cámara**. Como el render 3D tarda del orden de una hora, el vídeo se hace **en dos pasos**: primero la imagen sin audio y después el audio, sin repetir el render.

**Paso A: página de la recreación** (`proyectos/<tema>/recreacion.html`, copiando la estructura de `proyectos/stirling_narrado/recreacion.html`):
```js
/* Mundo: terreno, ejercitos o jugada (todo funcion de t). Cada escena = un parrafo = un plano.
   dur = duracion ESTIMADA del parrafo (duracion de la voz repartida por caracteres; la ultima con la cola de 2 s). */
const ESCENAS = [
  { dur: 7.1, plano: 'establecimiento', mundo: (tl) => tl * 0.6 },                    // gancho: grua sobre el escenario
  { dur: 10.0, plano: 'escoceses', mundo: (tl) => 0.5 + tl * 0.4 },                   // contexto
  { dur: 5.4, plano: 'carga', mundo: (tl) => 8.0 + tl * 1.25 },                       // la accion, ajustada para que llegue en su palabra
  { dur: 11.3, plano: (tl) => (tl < 6 ? 'choque' : 'rio'), mundo: (tl) => (tl < 6 ? 14.45 + tl * 0.4 : 19 + (tl - 6) * 0.8) },   // camara lenta y corte
  { dur: 8.3, plano: 'mapa', mundo: (tl) => 25 + tl * 0.4, cierre: 5.0 }              // cierre: tarjeta de suscripcion
];
window.renderAt = (t) => { /* busca la escena, tl = t - ini, tm = e.mundo(tl), camara(plano, tm, tl), V.render(...), F.etalonar(...), rotulos ARRIBA,
                              y en la ultima: VE.short.letrero(esc, tl, e.cierre, { texto: 'NO OLVIDES', handle: 'SUSCRIBIRTE' }) */ };
```
- Se guarda `escenas_estimadas.json` con `ini` y `dur` de cada escena; el script de audio lo necesita.
- **Rótulos arriba y breves** (nombre del suceso, fecha, bandos, fase), más «Recreación aproximada» en lo alto. **La banda inferior queda libre** para los subtítulos, que se queman después.
- Se revisa con fotogramas: un *still* por escena (`render/still.cjs` o un script con Playwright que llame a `renderAt(t)`). Se corrige y se vuelve a mirar.

**Paso B: render del vídeo sin audio, reanudable y separado de la sesión:**
```
setsid nohup node render/demo.cjs --pagina "proyectos/<tema>/recreacion.html" --duracion <total> --lienzo vertical --ss 1 \
  --workers 4 --fps 30 --trozo 75 --salida proyectos/<tema>/salida/video_mudo.mp4 > proyectos/<tema>/salida/render_mudo.log 2>&1 &
```
Progreso en `video_mudo.mp4.progreso/progreso.txt`. Si se corta, repetir **el mismo comando**. Se vigila el PID (`kill -0`), no `pgrep -f`.

**Paso C: audio** (voz y efectos de ElevenLabs, §5 y §5.1):
1. `python3 pipeline/vid.py voz-importar <tema> <audio de Carmen>`: alinea la voz y crea `timeline.json` y `palabras.json`.
2. `python3 pipeline/vid.py musica <tema>`: la música del perfil, sin cambiar el estilo.
3. Los efectos se guardan en `salida/efectos/` y se escribe `efectos.json` (qué efecto, en qué escena, en qué segundo o **en qué palabra**, volumen, bucle, fundido).
4. `python3 pipeline/recreacion_audio.py <tema>`: reajusta cada escena a la duración real de su párrafo, quema los subtítulos (Fredoka 700, palabra resaltada), coloca los efectos, mezcla voz + efectos + música con ducking, normaliza y saca `<tema>.mp4` (pesado) y `<tema>_ligero.mp4` (menos de 10 MB).

(Alternativa sin probar de punta a punta: montar el mundo directamente en `escenas.js` con `VE.proyecto` y renderizar con `vid.py render`, que ya pone subtítulos con la voz. Solo merece la pena si la voz está disponible antes del render.)

## 8. Herramientas del motor (resumen)

**Fútbol** (`engine/volumen/futbol.js`, guía `docs/FUTBOL_3D.md`):
- Escenario y figuras: `campo`, `porterias({t, gol})`, `balon`, `futbolista({kit, dorsal, portero})` (con `kit.rayas`) y `estadio({celebra, aficiones, colores, propEquipo})`.
- Jugada: `F.jugada({toques, jugadores, gol})`, con toques `raso`, `alto`, `tiro`, `cabezazo` y `conduccion` (`pie: 'i'` para zurdos), y `jugada.revisar()`, que detecta choques, balón bajo el césped, pies lejos del balón y velocidades imposibles.
- Cámaras: `F.planos.*`.
- Poses: `chutar`, `cabezazo`, `estirada`, `celebrar`, `entrada` y `espejo`.
- Imagen: `F.etalonar`, `F.pulso`.

**Batallas** (`engine/volumen/batalla.js`):
- Figuras: `caballo({marcha: paso|trote|galope, encabritado})`, `caballero({librea, lanza: ristre|alzada, aPie, sinJinete})`, `lancero({lanza: alzada|ristre|estocada})` e `infante`.
- Escenario: `puente`, `tienda`, `bandera({cruz})` y `castillo` (en `historia.js`).
- Efectos: `V.efectos.salpicadura`, `V.efectos.fuego`, `V.efectos.humo`, `V.batalla.brillos`.
- Poses: `jinete`, `caido`, `lanzaAlzada`, `retroceso`, `lanzaRistre(f)` y `estocada(f)`.
- **Ejércitos**: `V.batalla.hornear(nodo, clave)` + `V.batalla.instancia(malla, {pos, rot})`. Cada soldado y estado es una sola malla; se usan dos niveles de detalle (cerca y lejos) y se descartan los que quedan fuera de cuadro.

**Comunes** (`modelos.js`, `escenarios.js`, `historia.js`):
- Figura y escenario: maniquí (`detalle`, `abrir_piernas`, `equipo`, `colores`, `mapas`), `terreno({alto(x,z)})` (agua en y = 0; arena, hierba y roca salen solas por altura y pendiente), `mar` (ríos y lagos), `arbol`, `castillo`, vikingos y barco.
- Efectos: flechas en parábola y astillas.
- Grafismos: `V.proyectar`, `V.linea` y `V.marcador`.

**Mecanismos de realismo que ya funcionan** (no reinventarlos):
- Movimiento:
  - Rutas por curvas de Hermite.
  - Zancada con fase integrada, para que no se atasque al frenar.
  - Paso de andar a correr.
  - Inclinación en las curvas.
  - Ritmo propio para cada soldado.
- Cuerpos y caídas:
  - Cuerpo de futbolista con volumen.
  - Sombra de contacto bajo los pies.
  - Brazos en V al celebrar (`abrir` negativo con el brazo levantado).
  - Caídas girando sobre los pies o sobre el cuerpo, nunca medio enterrados.
  - Jinete despedido en arco.
- Cámara: cámara lenta remapeando el tiempo del plano y sacudida en cada impacto.

**Si falta una pieza**, se monta con `V.malla` (esfera, cápsula, caja, cilindro, torno, extrusión, loft, tubo, paramétrica) colgada de las articulaciones del maniquí (`equipo`), y **se revisa en fotogramas** antes de usarla.

## 9. Coste y tiempos (medidos en este contenedor, 4 CPU, sin GPU)

| Escena | s/fotograma (1 proceso) | Ejemplo |
|---|---|---|
| Fútbol, 23 jugadores + estadio con ~30.000 personas | 2,5–3,5 | Gol de cabeza 16:9: 11,2 s en 15,5 min |
| Gol del Siglo vertical, con etalonaje | 2–3 | 21 s en ~20 min |
| Batalla con ~800 figuras, terreno, río y castillo | 3–6 | Stirling vertical: 28 s en 51–58 min |

- Un short de 90 s con batalla son del orden de **3 horas de render** con 4 procesos. Se puede reducir con menos figuras en los planos generales, menos píxeles cubiertos, o reservando el 3D a las escenas que lo necesitan (las demás con `VE.real`).
- El primer fotograma de cada proceso tarda más, porque hornea las texturas y las mallas.
- **Renders largos (más de ~20 min): siempre en modo reanudable y separados de la sesión.** Con `setsid nohup node render/demo.cjs ... --trozo 75 > log 2>&1 &`, cada trozo de 75 fotogramas se guarda al terminar; si el render se corta (límite de 2 h de una tarea en segundo plano, reinicio del contenedor), repetir **el mismo comando** salta los trozos hechos. El progreso está en `<salida>.progreso/progreso.txt`.
- Errores vistos en esta prueba: el render sin trozos murió al llegar al límite de 2 h de la tarea que lo lanzó (se perdieron 3 de 4 tramos, porque un MP4 a medias no se puede leer). Además, un vigilante con `pgrep -f render/demo.cjs` se encontraba **a sí mismo** (su propia orden contiene ese texto) y creía que el render seguía vivo: hay que vigilar el PID (`kill -0 <pid>`).

## 10. Lista de revisión (fotogramas: un still por escena y en cada momento clave)

- [ ] Cada hecho narrado está en `datos.md` con nivel; los X no se narran como hechos.
- [ ] Nada copiado de películas ni narraciones famosas; escudos y marcas, ni uno; blasones inventados; «Recreación aproximada» en pantalla.
- [ ] La geometría coincide con la referencia (quién supera a quién, por qué lado, dónde termina).
- [ ] Revisión automática sin avisos (`jugada.revisar()` en fútbol; en batallas, que ninguna figura atraviese a otra en los planos cercanos).
- [ ] Nadie enterrado ni flotando; el balón no atraviesa la red; los caídos quedan tendidos sobre el suelo.
- [ ] Encuadres: el protagonista centrado y sin tapar; la portería o el elemento clave dentro del plano; la cámara fuera de las formaciones.
- [ ] El momento visual cae en la palabra que lo nombra; los rótulos no chocan con los subtítulos.
- [ ] Voz: `estimate_only` hecho y coste comunicado; `generations_count = 1`; duración entre 60 y 90 s.
- [ ] El MP4 ligero pesa menos de 10 MB.
