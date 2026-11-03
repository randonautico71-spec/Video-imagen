# Recreaciones de fútbol en 3D (`VE.vol`)

Instrucciones para convertir unas **indicaciones** del usuario (una jugada, un gol, un partido, un estadio, un ambiente de grada…) en una animación 3D con varios planos de cámara, hecha **solo con código** sobre el motor `VE.vol` (`engine/volumen/`). Antes de empezar: `docs/GUIA_IMAGEN.md` (sección 3 bis) y `docs/REFERENCIA_TECNICA.md` (sección VOLUMEN 3D).

Estado: **programado y revisado en fotogramas** (`engine/volumen/futbol.js`). Ejemplo completo: `demo/futbol.html`, un ataque por la banda derecha con centro y gol de cabeza, de noche y con el estadio lleno, montado en 5 planos (11,2 s). La sección 9 dice qué queda pendiente.

| API (`V = VE.vol`, `F = V.futbol`) | Qué hace |
|---|---|
| `V.modelos.campo()` | césped con franjas y líneas pintadas en la textura (medidas de §3) |
| `V.modelos.porterias({ t, gol: {t, p, lado} })` | porterías con red; la red se abomba en el punto del gol |
| `V.modelos.balon({ pos, giro })` | balón de paneles (radio 0,11) |
| `V.modelos.futbolista({ kit, dorsal, portero, pose, pos, rot, apoyo, suelo })` | maniquí con equipación, dorsal en la espalda, pelo y guantes de portero |
| `V.modelos.estadio({ t, celebra, aficiones, colores, vallas, densidad, sinPublico })` | 4 gradas de dos anfiteatros, esquinas curvas, cubierta con focos, vallas y público |
| `F.jugada(def)` | guion de toques → `balon(t)`, `jugador(id, t)`, `nodo(id, t, kit)`, `revisar()` |
| `F.planos.general / cenital / raso / porteria / seguimiento / spidercam / grada` | cámaras que solo dependen de `t` |
| `F.halos(esc, cam)` · `F.ambienteNoche` · `F.balonSuave(J, t)` · `F.brazos(pose, brazos, k)` | halos de los focos, luz de noche, balón suavizado para la cámara, mezclar solo los brazos |
| `V.pose.chutar(f)` · `cabezazo(f)` · `estirada(k)` · `celebrar(f)` · `V.poses.portero` | gestos (contacto en fase 0,5) |
| `V.pose.entrada(k)` · `V.pose.espejo(p)` | entrada del defensa; pose con los lados cambiados (zurdos) |
| Toques `{ tipo: 'conduccion', pie: 'i' }` | conducción con toques cortos (gesto ligero) y pie izquierdo |
| `kit.rayas: [c1, c2]`, `kit.nRayas`, `kit.fondoDorsal` | camiseta a rayas verticales (textura en pecho, vientre y mangas); `V.modelos.maniqui({ mapas })` acepta texturas por pieza |

**Realismo** (revisado en fotogramas con el Gol del Siglo):
- **Cuerpo de futbolista** (por defecto; `cuerpo: 'maniqui'` lo quita): camiseta con forma de V y hombros, mangas, pantalón corto con vuelo, muslos y gemelos con músculo, botas, cuello, orejas y nariz. Todo va colgado de las articulaciones del maniquí, así que sigue a cualquier pose.
- **Movimiento**: las rutas pasan por curvas de Hermite (sin giros en seco), la zancada sale de la distancia tabulada, el cuerpo se inclina hacia dentro en las curvas y cada jugador tiene su propio ritmo de carrera.
- **Sombra de contacto** bajo los pies, que asienta a los jugadores en el césped.
- **Cámaras de retransmisión**: teleobjetivo desde la grada (fov 11–22), seguimiento del balón con retraso (`F.balonSuave`) y temblor de operador (`F.pulso(t, amp)`). Es lo que más acerca la imagen a una retransmisión real. Con teleobjetivo, el público de cerca se ve de bloques: subir la cámara para que el fondo sea césped y vallas.
- **Etalonaje** `F.etalonar(esc, { fotograma })`, aplicado después de `V.render` y antes de los rótulos: quita saturación, da un tono cálido, viñeta y grano. Usa composiciones del lienzo y capas horneadas (sin `ctx.filter`).
- `estadio({ propEquipo })`: la proporción de público con los colores del equipo (el resto, ropa neutra).

**Ejemplo de jugada real**: el Gol del Siglo (Maradona, México 86) en vertical, recreación aproximada. La carrera es una lista de puntos que se convierte en toques a velocidad constante. Los defensores tienen rutas ligadas al instante en que Maradona pasa por cada punto (`tM(i)`), así que si cambia el ritmo todos se ajustan solos. El último plano es cenital, con la ruta y el nombre de cada jugador superado. Los datos con niveles van en `datos.md` y el proyecto no se sube (`proyectos/`).

---

## 1. De las indicaciones a una «ficha de recreación»

Lo primero es pasar lo que pida el usuario a esta ficha, en `proyectos/<tema>/futbol.md`. Si falta un dato, se usa el valor **por defecto** que va entre corchetes y se dice al usuario qué se ha supuesto. Solo se pregunta cuando el dato cambia la jugada, por ejemplo quién marca o desde qué lado.

```
FORMATO      short (1080×1920, 30 fps) | largo (1920×1080, 24 fps)          [según LARGO/SHORT]
DURACIÓN     segundos de animación                                         [la que pida el guion]
EQUIPOS      local: camiseta / pantalón / medias / portero                [rojo-blanco-rojo / verde]
             visitante: camiseta / pantalón / medias / portero            [blanco-azul-blanco / amarillo]
FORMACIÓN    local 4-3-3, visitante 4-4-2 …                               [4-4-2 los dos]
JUGADA       secuencia de toques (ver §5): quién, cuándo, a dónde, cómo    [obligatoria]
PLANOS       lista ordenada de planos (ver §6) con su duración             [general → seguimiento → portería → repetición]
ESTADIO      tamaño de grada (pequeño / medio / grande), cubierta, color   [medio, cubierta, gradas grises]
PÚBLICO      lleno / medio / vacío; colores; bufandas, banderas, ola       [lleno, 70 % del local]
HORA         día | atardecer | noche (focos)                               [noche]
EXTRAS       marcador, nombres, líneas tácticas, cámara lenta, rayos X     [ninguno]
DATOS        partido real? → fuentes en datos.md (ver §2)
```

## 2. Reglas para partidos y jugadas reales (NO ALUCINES)

- **Recreación ≠ reconstrucción.** Si la jugada es real, las posiciones se sacan de una fuente: vídeo de la jugada que aporte el usuario, acta, crónica o datos de seguimiento. Lo que no salga de la fuente (la posición exacta de los que no tocan el balón, la altura del centro) es **aproximado**, y así se dice en `datos.md` y, si el vídeo lo afirma, también en la narración: «recreación aproximada».
- El resultado, el minuto, el autor del gol y los récords son cifras: van con nivel **V / V\* / X** en `datos.md` como cualquier otra cifra.
- **Sin escudos, logotipos ni patrocinadores reales.** Los equipos se reconocen por los **colores** y, si hace falta, por un rótulo con el nombre. Las vallas publicitarias llevan textos inventados y neutros, o van lisas. Tampoco se reproducen estadios con su marca: se recrea un estadio **genérico** con la forma que se pida (cubierta, número de gradas, color de los asientos).
- Los jugadores son maniquíes sin rasgos (el motor no hace caras). Se identifican por el dorsal, el color y el rótulo con el nombre.

## 3. Medidas del campo (unidades = metros)

Convenio de ejes: **Y arriba**. El campo es largo en **X**, de −52,5 a 52,5, y ancho en **Z**, de −34 a 34. El centro del campo es `[0, 0, 0]`. El local ataca hacia +X en la primera parte.

| Elemento | Medida | Nivel |
|---|---|---|
| Campo | 105 × 68 m (las Reglas permiten 100–110 × 64–75 en partidos internacionales; 105 × 68 es la medida que recomienda la FIFA para estadios) | V (IFAB, Regla 1; FIFA, recomendaciones técnicas de estadios) |
| Portería | 7,32 m entre postes × 2,44 m de alto; postes y larguero de 12 cm como máximo | V (Regla 1) |
| Área grande | 16,5 m desde cada poste hacia fuera y hacia el campo → rectángulo de 40,32 × 16,5 m | V (Regla 1) |
| Área pequeña | 5,5 m → 18,32 × 5,5 m | V (Regla 1) |
| Punto de penalti | a 11 m de la línea de gol | V (Regla 1) |
| Círculo central y arco del área | radio 9,15 m | V (Regla 1) |
| Arco de esquina | radio 1 m | V (Regla 1) |
| Líneas | 12 cm de ancho como máximo | V (Regla 1) |
| Balón | circunferencia de 68–70 cm → radio ≈ 0,11 m | V (Regla 2) |
| Jugador | el maniquí mide ≈ 1,75 m (`V.maniquiMedidas`); se puede escalar con `esc` | — |

En la escena se usan estos valores como constantes (`FUT.L = 105, FUT.A = 68, …`) y nunca números sueltos.

## 4. Montaje de la escena con piezas de `VE.vol`

### 4.1 Césped y líneas
- **Una sola malla** `V.malla.plano(L + 8, A + 8, 1)` con una **textura pintada una vez** (`V.textura('cesped|…', 4096, 2048, fn)`): franjas de corte alternas (cada 5,25 m, dos verdes que se diferencien un 6–8 %), ruido suave de `VE.real.ruido2` para que no parezca plástico, y **las líneas blancas pintadas en la propia textura**. Las líneas no se hacen como geometría aparte: dos superficies casi en el mismo plano parpadean (*z-fighting*).
- Escala de la textura: 4096 px / 113 m ≈ 36 px/m, así que una línea de 12 cm ocupa unos 4 px, legible en los planos generales. Para planos a ras de césped se pinta además una textura de detalle con `repetir: [u, v]`, o se sube la resolución si al revisar los fotogramas se ve borrosa.
- Material: `{ mapa, esp: 0.08, dureza: 12, envolver: 0.2, borde: 0.1 }`. El césped no brilla.
- Fuera del campo: una banda de 4 m del mismo verde, más oscura, y luego el foso o la pista. Debajo, `V.fondo.cielo` o el fondo de noche.

### 4.2 Porterías
- Postes y larguero: `V.malla.cilindro(0.06, 0.06, 2.44)` y `cilindro(0.06, 0.06, 7.32)` girado, en material blanco `brillo` suave. Los soportes de la red son tubos (`V.malla.tubo`) que bajan hasta 2 m por detrás.
- Red: `V.malla.parametrica(nu, nv, f, { abierta: true })` con una **textura de malla** (cuadrícula de 12 cm con alfa) y `dobleCara: true`. Cuando entra el gol se usa `{ dinamica: 'red_d' }` y se deforma con un bulto gaussiano centrado en el punto de impacto, que crece y se amortigua con `t`: `d = A·e^(−r²/σ²)·e^(−k(t−t0))·sin(ω(t−t0))`.
- Banderines de córner: cilindro fino más una `parametrica` dinámica (bandera que ondea con `t`).

### 4.3 Balón
- `V.malla.esfera(32)` de radio 0,11 con una textura equirrectangular pintada: blanco con paneles oscuros. Para que no salga deformada en los polos, los paneles se pintan calculando la distancia **sobre la esfera** (la misma técnica que el ruido de la Tierra).
- **Giro**: el ángulo es la distancia recorrida dividida entre el radio, alrededor del eje `cruz([0,1,0], dirección)`. Si el balón se desliza sin girar, se nota mucho.
- **Sombra**: siempre activa en los planos cercanos, porque es lo que dice a qué altura va el balón. En planos muy generales se puede dibujar además un punto oscuro 2D bajo el balón (`V.proyectar`) si la sombra real sale demasiado pequeña.

### 4.4 Jugadores
Cada jugador es `V.modelos.maniqui({ pose, pos, rot, apoyo: 'pies', colores, equipo })`. Los colores se ponen por pieza, igual que en `historia.js`:

```js
const kit = (k) => ({ pecho: k.camiseta, vientre: k.camiseta, cintura: k.camiseta, brazo: k.camiseta,
  antebrazo: k.piel, mano: k.piel, cuello: k.piel, cabeza: k.piel,
  pelvis: k.pantalon, muslo: k.pantalon, pierna: k.medias, pie: k.botas });
```
- **Dorsal**: `equipo: { tronco: [V.nodo({ malla: V.malla.caja(0.2, 0.22, 0.005, 0.002), pos: [-0.14, 0.33, 0], rot: [0, -Math.PI/2, 0], mat: { mapa: texDorsal(numero, color) } })] }`. Va en la espalda; la figura mira hacia +X, así que la espalda queda hacia −X. La textura del número se pinta con `V.textura('dorsal|' + n + '|' + color, 128, 128, …)`.
- **Portero**: otro color, y guantes (esfera aplastada en `mano`, más grande).
- **Árbitro**: negro u otro color que no coincida con ninguno de los dos equipos.
- **Pelo**: el motor no tiene pelo. Si hace falta distinguir a alguien, se usa un casquete (esfera recortada en `cabeza`) del color del pelo, o una cinta. No hay rasgos faciales.
- **Orientación**: la figura mira hacia +X. Para que mire en la dirección de avance `(dx, dz)`: `rot: [0, Math.atan2(-dz, dx), 0]`, el mismo convenio que la demo de los vikingos.
- **Carrera sin patinar**: `pose: V.pose.correr(fase)` con `fase = distanciaRecorrida / zancada`, con la zancada en ≈ 2,6 m por ciclo a esprint y ≈ 1,6 m al trote (valores de partida que hay que ajustar mirando fotogramas). Si la fase va con el tiempo y no con la distancia, los pies patinan.
- Cuando hay 22 jugadores, los que están **lejos de la acción** pueden usar `V.pose.andar` o `de_pie` con un leve vaivén: no se ven y abaratan la revisión.

### 4.5 Estadio
Se monta en módulos, para poder cambiar el tamaño según las indicaciones:
- **Gradas**: cuatro bloques rectos más cuatro esquinas curvas. Cada bloque es una extrusión (`V.malla.extrusion`) del **perfil escalonado** de la grada, con escalones de 0,8 m de fondo y 0,4 m de alto, a lo largo del lado. Las esquinas se hacen con `torno` de ese mismo perfil (un cuarto de vuelta) o con `parametrica`. Grada pequeña: 1 anfiteatro de 15 filas. Mediana: 2 anfiteatros. Grande: 3 anfiteatros con palcos en medio (una banda de cristal oscuro).
- **Asientos**: no se modelan uno a uno. Van en la **textura** del escalón: filas de rectángulos del color pedido, y con ellos se pueden escribir letras o dibujos en la grada vacía.
- **Cubierta**: `caja` fina inclinada sobre cada grada, más pilares o cerchas hechos con `tubo`. Bajo la cubierta, una banda de focos (cajas con `emision: 1`).
- **Torres de focos** (estadios abiertos): cilindro más un panel de `caja` con emisión. De noche, un halo 2D con `esc.cache.halo` proyectado con `V.proyectar`. **Nunca `shadowBlur` ni `ctx.filter`.**
- **Vallas publicitarias**: `caja` de 1 m de alto alrededor del campo, a 4–6 m de las líneas, con texturas de textos inventados. Si se quiere que se muevan, se desplaza la `u` de la textura con `t` (sin repintar).
- **Banquillos, túnel, marcador**: cajas redondeadas. El marcador es una textura pintada por fotograma solo si cambia: se guarda en caché por su texto.
- **Exterior**: si un plano muestra el estadio desde fuera o desde arriba, se pone un `V.modelos.terreno` plano alrededor, con niebla del color del horizonte (como en los vikingos).

### 4.6 Público
**Programado**: cada persona es un cuerpo (caja) más una cabeza (esfera de pocos lados), y los brazos levantados son una segunda malla. Todas las personas de un bloque (≈ 8 filas × 30 m) forman **una sola malla**, y el color de cada una sale de una **paleta en textura** (un uv fijo por persona). Así se dibujan unas 30 000 personas con ≈ 100 llamadas por fotograma. Cada bloque es un nodo: salta en Y y cambia a «de pie con brazos arriba» cuando `celebra(lado, bloque, t, aficion)` lo pide. La misma semilla sirve para todas las variantes, así que nadie cambia de sitio al levantarse. En los planos generales funciona sin pasar a textura: el nivel «lejos» de la tabla siguiente queda como optimización posible.

Hay miles de personas y no pueden ser maniquíes (cada uno son unas 30 piezas). Diseño por niveles, según lo cerca que esté la cámara:

| Distancia | Técnica | Animación |
|---|---|---|
| Lejos (plano general, cenital) | **Textura** de la grada: una mota de color por asiento (camiseta del color del equipo, un 15 % de colores neutros, puntos de piel), sembrada con `VE.rng` | 2–3 variantes horneadas que se alternan, más una «ola» con una franja que aclara en `u` según `t` |
| Media (contraplano de grada, gol) | **Figuras bajas fusionadas**: cada persona = cápsula de cuerpo + esfera de cabeza (+ brazos si celebra). Una **fila** es **una sola malla** hecha con `V.malla.fusionar`, en caché por semilla y pose | Cada fila es un nodo: se mueve en Y (salto) y se alterna entre dos mallas horneadas, «sentados» y «brazos arriba». La ola es un retardo por columna |
| Cerca (aficionado en primer plano) | `V.modelos.maniqui` con `colores` y `equipo` (bufanda: `tubo`; bandera: `parametrica` dinámica en la mano) | Poses de celebración (§9) |

- **Reparto de aficiones**: con un mapa por sectores (por ejemplo, el fondo sur visitante), definido en la ficha.
- **Banderas grandes y tifos**: un `parametrica` dinámico (ondea) o una textura de mosaico sobre la grada.
- **Coste**: las filas fusionadas se dibujan con una llamada cada una. Un fondo de 40 filas = 40 llamadas. Primero se mide con un fotograma de prueba (no hay medición todavía; ver §8).

### 4.7 Luz y hora
- `dia` y `atardecer`: los ambientes que ya existen, más `V.fondo.cielo({ hora })`.
- **Noche con focos**: un ambiente propio, `{ base: 'noche', luz: { dir: [0.2, 0.9, 0.3], color: '#f4f2ff', intensidad: 1.4 }, ambiente: 0.55 }`, porque los focos dan luz blanca y alta. Fondo: cielo de noche más el halo de las torres. El motor tiene **una sola luz direccional con sombra**, así que no salen las cuatro sombras cruzadas de los focos de verdad. Se puede imitar con 3 «sombras falsas» por jugador: elipses oscuras de material `sombra`, con alfa bajo y giradas. Hay que revisarlo en fotogramas.
- Sombras: `sombras: { centro: <balón o jugada>, radio: 12–20 }`, ajustadas a la acción. Si se usa el campo entero, la sombra sale borrosa (ver la guía de imagen).
- `niebla` con el color del fondo para la grada lejana: da profundidad y disimula el poco detalle.

## 5. La jugada como guion de eventos (todo depende de `t`, sin estado)

Una jugada se describe como una **lista de toques**. Todo lo demás (posición del balón, de cada jugador y de la cámara) se **calcula a partir de esa lista y de `t`**, como en la escena de los vikingos. Así cualquier fotograma se puede pintar solo, y el render en paralelo (`render/demo.cjs`, por tramos) da el mismo resultado.

```js
const JUGADA = {
  toques: [ // t: instante del contacto; de: jugador; tipo: raso | alto | tiro | cabezazo | control; a: destino [x, z] o jugador; vuelo: s
    { t: 0.0, de: 'L8',  tipo: 'raso',  a: 'L10', vuelo: 1.1 },
    { t: 1.6, de: 'L10', tipo: 'alto',  a: [44, 6], vuelo: 1.3, altura: 6 },
    { t: 2.9, de: 'L9',  tipo: 'cabezazo', a: [52.5, 1.2, 2.1], vuelo: 0.45 },  // destino 3D: dentro de la portería
  ],
  jugadores: { // trayectorias por puntos clave: [t, x, z]; entre puntos, VE.tramo con suavizado
    L9: { equipo: 'local', dorsal: 9, ruta: [[0, 30, -8], [2.9, 45.5, 1.2]] }, // …
  }
};
```
- **Balón**: entre dos toques se interpola según el `tipo`. `raso`: recta con rozamiento (velocidad que baja exponencialmente) y y = radio. `alto`, `tiro` y `cabezazo`: parábola con gravedad 9,8, la misma fórmula que `V.efectos.flecha`, con un bote opcional (coeficiente ≈ 0,6). El inicio de cada tramo **coincide con el pie o la cabeza** del jugador en el instante del toque: `V.posicion(arbolJugador, 'pie_d')`.
- **Jugadores**: la ruta que sale de los puntos clave da posición y dirección. La pose sale del tipo de movimiento (carrera, trote, parado) y, en la ventana de cada toque, de su gesto (`chutar`, `cabezazo`… ver §9), centrado en que el contacto caiga **exactamente** en el `t` del toque.
- **Comprobaciones automáticas** antes de revisar fotogramas: que ningún jugador atraviese a otro (distancia mínima de 0,6 m), que el balón no pase por debajo del césped, que en cada toque el pie esté a menos de 0,25 m del balón y que la velocidad de carrera sea plausible (≤ 10 m/s a esprint). Se escriben como un `node` pequeño que recorre `t` a 10 Hz y avisa.
- **Gol**: cuando el balón cruza el plano de la portería empieza la red (§4.2), el público pasa a «celebrar» y la cámara puede temblar un poco (función de `t`, igual que la puerta del castillo).

## 6. Catálogo de planos (cámaras)

Cada plano es una función `camara(t) → V.camara({...})` que **solo depende de `t`**. Para que siga el balón con suavidad sin guardar estado, `mira` es la **media del balón en una ventana** (por ejemplo, 9 muestras entre `t − 0,4` y `t`), no el balón en ese instante.

| Plano | Cámara (metros) | Uso |
|---|---|---|
| **General de TV** | `pos: [bx·0,85, 22, −58]` (alta, en un lateral, cerca de medio campo), `mira: balón suavizado`, `fov: 28–34`. Se mueve en X detrás del balón, sin desplazarse | Contexto de la jugada |
| **Cenital (táctico)** | `pos: [cx, 90, cz + 0.01]`, `arriba: [1, 0, 0]`, o `orto: 40` | Táctica: `V.linea` para pases y desmarques, `V.marcador` en los jugadores; con `rayosx: 1` + `V.fondo.plano` se convierte en un esquema técnico |
| **A ras de césped** | `pos` a 0,4 m de altura, `fov: 50`, `cerca: 0.05` | Pase raso, regate, tensión |
| **Detrás de la portería** | `pos: [60, 3.5, 0]`, `mira: [40, 1, bz]` | Tiro y gol; se ve la red moverse |
| **Seguimiento** | detrás del jugador: `pos = jugador − 6·dirección + [0, 2.2, 0]`, `mira = jugador + 4·dirección` | Conducción y contraataque |
| **Spidercam** | órbita alta: `V.orbita(balón, 18, rumbo(t), 0.7)` | Transiciones, plano espectacular |
| **Grada (contraplano)** | desde el césped hacia el público, `fov: 40` | Reacción de la afición tras el gol |
| **Punto de vista** | en la cabeza del portero o del delantero: `V.posicion(arbol, 'cabeza')` | Penaltis, mano a mano |
| **Repetición** | cualquier plano con `t' = t0 + (t − tr)·0,35` (cámara lenta) y un barrido 2D al empezar | Repetir el gol; mismo cálculo, otro `t` |

- **Vertical (short)**: la acción del fútbol es horizontal. En 9:16 se usa más el **seguimiento**, el **detrás de la portería** y la **spidercam**. El plano general va más cerrado (`fov` menor y más alto), con el balón en el tercio central. Los subtítulos y el letrero final siguen las zonas seguras de `docs/TIPO_SHORT.md`.
- **Cortes**: un plano dura al menos 1,5 s, salvo en montajes rápidos. Se respeta el eje (la cámara general siempre en el mismo lateral) para no confundir hacia dónde ataca cada equipo. Los planos se encadenan con una tabla `[{ desde, hasta, plano }]` igual que las escenas.
- **Grafismos encima** (después de `V.render`): nombre del jugador con `VE.short.pastilla` anclada en `V.proyectar(cabeza + [0, 0.5, 0])`, línea del pase con `V.linea`, flecha de desmarque, marcador. Si el jugador tiene que tapar la línea: render en dos pasadas (campo → grafismo → jugadores), como el avión sobre la ruta.

## 7. Estructura del proyecto y flujo

1. `python3 pipeline/vid.py nuevo <tema> --tipo short|largo`, y escribir la ficha (§1) y `datos.md` si es un partido real (§2).
2. Cada párrafo del guion es una escena de `escenas.js`. Una escena de fútbol llama a `FUT.dibujar(esc, t, { plano, jugada, ficha })`: pinta el fondo, `V.render` del estadio y el campo, los jugadores y el balón, y luego los grafismos.
3. Revisión rápida sin vídeo: página `demo/futbol.html?plano=montaje|general|cenital|raso|porteria|seguimiento|spidercam|grada|repeticion&lienzo=yt|vertical` con `window.renderAt(t)`, y `qa --stills t1,t2,…` en el proyecto. **Hay que mirar las imágenes**: el instante de cada toque, el gol, cada cambio de plano y un plano de público. Antes, `jugada.revisar()` tiene que salir vacío (lo comprueba `pipeline/autotest.sh`).
4. Clip suelto sin audio (solo si lo pide): `node render/demo.cjs --pagina "demo/futbol.html" --duracion 11.2 --lienzo yt --ss 1 --salida X.mp4`.
5. Vídeo completo: la cadena de siempre, `voz → musica → mezcla → qa → render`. Si el vídeo dura de 3 a 5 minutos, también versión vertical (entrega doble).

## 8. Rendimiento (lo que se sabe y lo que no)

- **Medido** (de otras escenas, ver `GUIA_IMAGEN.md`): maniquí en sala ≈ 0,9 s/fotograma (ss 1,5); vikingos en exteriores ≈ 1,1–1,5 s/fotograma (ss 1), unos 8 maniquíes más terreno y mar; combate ≈ 2–2,5 s/fotograma.
- **Medido** (`demo/futbol.html`, 1920×1080, ss 1, un proceso): 23 jugadores, balón, estadio con unas 30 000 personas, sombras y halos ≈ **2,5–3,5 s/fotograma**. El primer fotograma de cada proceso tarda ≈ 7 s, porque hornea las texturas y monta las mallas del público. Clip entero (11,2 s, 336 fotogramas, 4 procesos con `render/demo.cjs`): **927 s** (≈ 2,8 s por fotograma en total; cada proceso va a ≈ 11 s/fotograma porque comparten 4 CPU) y 29,8 MB con CRF 19.
- Para que vaya más rápido: sombras con `radio` pequeño en la zona de la jugada; jugadores fuera del encuadre fuera del árbol (comprobar con `V.proyectar` y un margen); público en textura en los planos generales; `niebla` para la grada lejana; todas las texturas horneadas **una vez** (césped, grada, dorsales, vallas).
- 30 fps × 60 s = 1800 fotogramas. A 3 s/fotograma con 4 procesos son unos 23 min. Calcularlo antes de prometer plazos.

## 9. Hecho y pendiente

**Hecho** (`engine/volumen/futbol.js`, cargado en `engine/video/index.html`; demo `demo/futbol.html`; comprobado en `pipeline/autotest.sh`): campo, porterías con red que se abomba, balón con giro, futbolista, poses `chutar`, `cabezazo`, `estirada`, `celebrar` y `portero`, jugada con comprobaciones, estadio con esquinas curvas, público animado, vallas, focos con halo, catálogo de planos y montaje de 5 planos con repetición a cámara lenta.

**Errores vistos en los fotogramas y corregidos**: las esquinas del estadio eran bloques grises (ahora son gradas curvas con público); después del gol, el balón atravesaba la red y acababa fuera del poste (ahora se limita al volumen de la portería con `F.fondoRed(y)`); la red proyectaba una sombra opaca enorme (`sinSombra`); en la repetición y en la celebración, un defensa tapaba al goleador (rutas y cámara); la cámara de celebración, apuntada a la grada, dejaba al jugador en el borde (ahora mira al jugador).

**Pendiente**: el nivel «lejos» del público como textura (más rápido en planos generales); poses `pase`, `control`, `rodillas` y `aplaudir`; banquillos, túnel y marcador 3D; varias sombras de focos; plano vertical revisado a fondo (la página acepta `&lienzo=vertical`, pero los encuadres están pensados para 16:9); una plantilla de proyecto que use `F.jugada` desde `escenas.js`.

## 10. Lista de revisión de fotogramas

- [ ] Los pies no patinan: la fase de carrera va con la distancia recorrida, no con el tiempo.
- [ ] En cada toque, el pie o la cabeza está en el balón; el balón no atraviesa a nadie.
- [ ] El balón gira en la dirección del movimiento y su sombra se ve en los planos cercanos.
- [ ] Las líneas del campo son rectas, no parpadean y tienen las medidas de §3 (el círculo central es un círculo, no un óvalo, en la vista cenital).
- [ ] Las porterías tienen la proporción correcta (7,32 × 2,44) y la red se mueve con el gol.
- [ ] Los colores de los dos equipos, los porteros y el árbitro se distinguen también en el plano general.
- [ ] El público no parece una textura plana en los planos medios; tampoco se repite el mismo bloque a la vista.
- [ ] La cámara respeta el eje entre cortes; en vertical, el balón queda dentro de la zona segura.
- [ ] No hay escudos, marcas ni caras reales; la ficha y `datos.md` dicen qué es aproximado.
