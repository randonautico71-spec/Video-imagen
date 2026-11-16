# Animales 3D por SDF / ray marching (`vid.py sdf`)

Vídeo vertical corto (1080×1920, 30 fps) de animales en 3D calculado **en CPU**, sin GPU ni ficheros externos: las formas son funciones de distancia (SDF) y la imagen se obtiene por *ray marching*. Va sin voz, con la música del perfil `short` (`curiosos`, −14 LUFS) y el mismo letrero final de los shorts (`VE.short.letrero`).

## Uso

```bash
python3 pipeline/vid.py sdf bosque --stills 0,3,6     # 1) fotogramas de control: MIRARLOS
python3 pipeline/vid.py sdf bosque                    # 2) vídeo completo (10 s)
python3 pipeline/vid.py sdf sabana --rehacer          # rehacer el render mudo tras cambiar la escena
```

Opciones: `--seg` (mínimo 6), `--letrero <s>` (entrada del letrero; por defecto `info.letrero_s` de la escena), `--sin-letrero`, `--w/--h` (resolución interna, por defecto 540×960, escalada con lanczos a 1080×1920), `--semilla` (música).

Salida en `proyectos/sdf_<escena>/salida/` (no se sube a git):

| Fichero | Qué es |
|---|---|
| `mudo.mp4` | Render SDF sin audio (se reutiliza si existe y dura lo pedido) |
| `letrero/` | Capas PNG con alfa del letrero final |
| `musica.wav` | Música `curiosos` con un corte cuando entra el letrero |
| `<escena>.mp4` | Entregable (CRF 17, AAC 192k) |
| `<escena>_ligero.mp4` | Versión < 10 MB para la app |

Progreso del render: `proyectos/sdf_<escena>/salida/progreso_<escena>.json` (no usar `| grep`).

## Escenas incluidas

| Escena | Estilo | Contenido |
|---|---|---|
| `bosque` | SDF / ray marching | Ciervo con cornamenta, cierva, cría con manchas y zorro al galope por un pinar con niebla, a contraluz de atardecer. La cámara los acompaña. |
| `sabana` | Texturas procedurales | Jirafa (manchas Voronoi), dos cebras (rayas con ruido) y guepardo (motas y «lágrimas») caminando entre acacias con luz dorada. |
| `fondo_marino` | SDF submarino con voz | Buzo a pulmón (patada), cachalote, zifio de Cuvier y traje rígido (atmosférico) bajo el agua: luz solar que se apaga con la profundidad (absorción por canal), foco de vehículo a partir de ~80 m, superficie vista desde abajo. Los modelos (`sdCachalote`, `sdZifio`, `sdBuzo`, `sdAds`) son funciones de distancia en coordenadas locales (x = hacia delante) y se colocan con `ent(tipo, pos, dirección, dorso, escala, radio, t)`. `E.anclas(t)` devuelve puntos 2D proyectados para anclar grafismos (se superponen después con Chromium). ~0,8 s/fotograma a 540×960 con 2 CPU. |

## Coste (medido en este contenedor, 4 CPU)

- Fotograma de 540×960: ~11–14 s por hilo; con 4 hilos, ~3–3,5 s por fotograma.
- 10 s de vídeo (300 fotogramas): ~15–20 min por escena. Con 432×768 baja ~35 %.
- El letrero (Chromium) y la música tardan segundos. Nunca lanzar dos renders SDF a la vez: cada uno ya usa todos los núcleos.

## Arquitectura

| Fichero | Papel |
|---|---|
| `engine/sdf/motor.js` | Primitivas (elipsoide, cápsula, cono redondeado), ruido, Voronoi, `ESPECIES`, `cuadrupedo()`, `renderFrame()`, sombras suaves, oclusión, brillo de ojos/nariz |
| `engine/sdf/escenas/<escena>.js` | `prepara(t)` (animales y cámara), `map()` (distancia), `shade()` (materiales y luz), `cielo()`, `info` (duración, letrero) |
| `render/sdf.cjs` | Reparte fotogramas entre hilos y los envía a ffmpeg; `--stills` para fotogramas sueltos |
| `engine/sdf/letrero.html` + `render/letrero.cjs` | Capa con alfa del letrero final real del short |

### Animales (`ESPECIES` en `motor.js`)

`ciervo`, `zorro`, `jirafa`, `cebra`, `guepardo`. Cada uno se construye con: tronco (costillar, pecho, grupa, cruz y vientre), cuello y patas que se estrechan (conos redondeados), cabeza con mandíbula, hocico, nariz, ojos, orejas, cola y pezuñas o zarpas. Extras por especie: cornamenta (`astas`), cuernecillos con penacho (`osic`), crin (`crin`), borla de cola (`borla`).

**Marcha sin patinar:** `cuadrupedo(nombre, x, z, t, fase, escala, { v, suelo })` coloca cada pie con cinemática inversa de dos huesos. En la fase de apoyo (`gait.beta`) el pie queda fijo en el suelo mientras el cuerpo avanza a `v` m/s; en la de vuelo vuelve adelante levantado. La rodilla delantera dobla hacia delante y el corvejón trasero hacia atrás. Requisitos:
- La `x` del animal debe avanzar exactamente a `v` (`x = v * t + x0`). Si se le suma una oscilación, los pies patinan.
- `alto` regula lo estiradas que van las patas. Con valores bajos el animal parece agachado; con altos, el pie se despega un poco al final de la zancada.

### Materiales

Los define cada escena en `shade()` a partir de `primCercana(...).m` (`cuerpo`, `cuello`, `cabeza`, `hocico`, `nariz`, `ojo`, `oreja`, `pata`, `patab`, `pezuna`, `zarpa`, `cola`, `borla`, `crin`, `asta`, `osicon`) y de las coordenadas locales del animal (`lx, ly, lz`). Así las texturas viajan con el animal. Ayudas: `M.pelo()` (fibra), `M.voro3()` (manchas), `M.lagrima()` (marca del guepardo) y `M.brillo()` (especular húmedo de ojos y nariz).

## Para crear una escena nueva

1. Copiar `engine/sdf/escenas/sabana.js` a `engine/sdf/escenas/<nombre>.js` y cambiar animales, cámara, terreno y cielo.
2. `vid.py sdf <nombre> --stills 0,3,6` y **mirar** las imágenes (patas, contraste, artefactos).
3. `vid.py sdf <nombre>`.

## Lecciones (medidas)

- **Rayos agotados:** el impacto solo se acepta si la distancia final es < 0,4 % del recorrido. Si se acepta con más margen salen vetas en el cielo.
- **Repetición de árboles por celdas:** el paso se limita al borde de la celda. Si ese límite entra en las sombras o en la oclusión salen líneas oscuras en el suelo, así que se pasa `sinLimite`.
- **Por encima de las copas:** si el árbol devuelve directamente `y − altura máxima`, los rayos que suben salen de golpe.
- **Sombras:** el terreno no se incluye. Con sol bajo, el relieve se sombreaba a sí mismo y dejaba estelas.
- **Animales muy pequeños en cuadro:** los ojos ocupan 1–2 px a 540×960. Para primeros planos hay que subir `--w/--h` o acercar la cámara.
