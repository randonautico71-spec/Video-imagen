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
FORMATO       short (1080x1920, 30 fps, 1–3 min) [por defecto] | largo (16:9)
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
Narración en **presente histórico**, con tono de documental, frases cortas y lenguaje vivo, pero **solo con hechos de `datos.md`**. Estructura de un short de 60–120 s:

| Bloque | Contenido | Plano típico |
|---|---|---|
| **Gancho** (0–3 s) | Una pregunta o una promesa concreta: «¿Cómo vence un ejército más pequeño a la caballería más temida de su tiempo? Con un puente.» | Aéreo del escenario |
| **Contexto** | Fecha, lugar, guerra, quién manda cada bando (V/V\*) | Grúa sobre el terreno, rótulo con la fecha |
| **El escenario** | El elemento del terreno que lo decide todo (puente, pantano, colina) | Plano del terreno, con el elemento clave en primer plano |
| **Fases** (2–4 párrafos) | Lo que hace cada bando, en orden: despliegue, movimiento clave, choque | Un plano por fase: columna cruzando, carga, choque (cámara lenta) |
| **El giro** | La decisión táctica o el error que cambia la batalla | Plano cenital o aéreo del momento |
| **Desenlace** | Cómo termina y qué pasa con los protagonistas (solo lo verificado) | Plano del final (río, desbandada…) |
| **Consecuencias y dato curioso** | Qué cambió después; un dato poco conocido y verificado | Mapa aéreo con etiquetas |
| **Cierre** | Una pregunta para comentarios y, en los últimos 3–4 s, el letrero «SIGUE A @randonautico» (la palabra «sigue» marca cuándo entra) | Plano final |

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

Flujo de `docs/TIPO_SHORT.md`, paso 4:
1. `python3 pipeline/vid.py nuevo <tema> --tipo short` → escribir `guion.md`, `datos.md` y `ficha.md`.
2. `python3 pipeline/vid.py estimar <tema>`: la duración debe caer entre 1:00 y 3:00.
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

## 7. Montaje en `escenas.js`

La recreación es **un solo mundo continuo**: la jugada o los ejércitos se definen una vez, fuera de las escenas, y **cada escena (un párrafo) muestra un tramo de ese mundo con su cámara**. El tiempo de la escena (`ctx.t`, cronometrado por la voz) se convierte en tiempo del mundo:

```js
/* Recreacion: el mundo (jugada o ejercitos) es comun; cada escena = un parrafo de la voz = un plano. */
const V = VE.vol, F = V.futbol, B = V.batalla;
const MUNDO = construirMundo();                    // F.jugada({...}) o lista de unidades {f(t)} como en Stirling (todo funcion de t)
/* Cada escena dice desde que segundo del mundo arranca y a que velocidad lo recorre (0,3 = camara lenta). */
const tramo = (desde, vel = 1) => (ctx) => desde + ctx.t * vel;
VE.proyecto({
  estilo: 'DARK',
  subtitulos: { palabras: 4, tam: 64, resalte: '#ffd36b' },
  escenas: [
    (esc, t, ctx) => pintar(esc, ctx, 'aerea', tramo(0)(ctx)),              // gancho + contexto: el mundo aun quieto
    (esc, t, ctx) => pintar(esc, ctx, 'puente', tramo(4)(ctx)),             // fase 1
    (esc, t, ctx) => pintar(esc, ctx, 'choque', tramo(14.5, 0.35)(ctx)),    // el choque, en camara lenta
    // ...
    (esc, t, ctx) => { pintar(esc, ctx, 'mapa', tramo(22)(ctx)); VE.short.letrero(esc, ctx.tg, ctx.palabra('sigue').ini + ctx.ini); },
  ],
});
function pintar(esc, ctx, plano, tm) {
  V.fondo.cielo(esc, { hora: 'dia', horizonte: 0.45, nubes: 0.8 });
  const cam = camara(plano, tm, ctx.t);
  V.render(esc, escena(tm, cam), cam, { ambiente: AMB, sombras: { centro: [0, 0, 0], radio: 30 }, niebla: { color: '#c3cbd0', cerca: 300, lejos: 1600 } });
  F.etalonar(esc, { fotograma: Math.round(ctx.tg * 30) });
  // rotulos ARRIBA (los subtitulos van abajo): aparecen al decir su palabra
  const p = ctx.palabra('puente'); if (p) VE.short.pastilla(esc, 'PUENTE DE MADERA', esc.W / 2, esc.H * 0.12, { a: VE.tramo(ctx.t, p.ini, 0.4) });
}
```

- **Lo visual sigue a la voz**: el momento clave (el remate, la carga, la caída al río) se cuadra con la palabra que lo nombra (`ctx.palabra('carga').ini`). Si hace falta, se ajusta `tramo(desde, vel)` para que el suceso caiga en esa palabra.
- **Rótulos arriba y breves.** Los subtítulos ocupan la banda inferior (`ctx.zonas.sub`): nada importante debajo.
- La página de revisión del proyecto (como `proyectos/batalla_stirling_1297/batalla.html`) se puede tener aparte para ver planos sin voz, pero el vídeo final sale de `escenas.js` con `vid.py render`.

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
- Renders largos en Code: lanzarlos en segundo plano y vigilar `<salida>.progreso/`. Si el contenedor se reinicia, el render se pierde y hay que relanzarlo.

## 10. Lista de revisión (fotogramas: un still por escena y en cada momento clave)

- [ ] Cada hecho narrado está en `datos.md` con nivel; los X no se narran como hechos.
- [ ] Nada copiado de películas ni narraciones famosas; escudos y marcas, ni uno; blasones inventados; «Recreación aproximada» en pantalla.
- [ ] La geometría coincide con la referencia (quién supera a quién, por qué lado, dónde termina).
- [ ] Revisión automática sin avisos (`jugada.revisar()` en fútbol; en batallas, que ninguna figura atraviese a otra en los planos cercanos).
- [ ] Nadie enterrado ni flotando; el balón no atraviesa la red; los caídos quedan tendidos sobre el suelo.
- [ ] Encuadres: el protagonista centrado y sin tapar; la portería o el elemento clave dentro del plano; la cámara fuera de las formaciones.
- [ ] El momento visual cae en la palabra que lo nombra; los rótulos no chocan con los subtítulos.
- [ ] Voz: `estimate_only` hecho y coste comunicado; `generations_count = 1`; duración entre 1:00 y 3:00.
- [ ] El MP4 ligero pesa menos de 10 MB.
