# Motor de vídeo generativo (todo por código, sin ficheros externos)

El usuario dice **LARGO** o **SHORT** + tema (+ descripción visual); tú ya sabes cómo diseñarlo. Tipos en `config/tipos.json`, guías en `docs/TIPO_LARGO.md` y `docs/TIPO_SHORT.md` (léelas antes de empezar).

| | SHORT | LARGO |
|---|---|---|
| Qué es | vertical 1080×1920, 30 fps, **60–90 s**, subtítulos, letrero final «SIGUE A @randonautico» | YouTube 16:9, 24 fps, **30–60 min**, capítulos de 3–5 min |
| Voz | **Carmen** (ElevenLabs, peninsular; se genera con la herramienta del conector y se importa) | **Serena** (Qwen3-TTS local, `.venv-qwen`) |
| Música | `curiosos` · −14 LUFS | `meditacion` · −16/−19 LUFS |

## Arranque
1. Sesión nueva: `bash pipeline/instalar.sh` (voces, MeloTTS, Qwen; requisitos de red en su cabecera). Contenedor de un chat de Project: `bash chat/bootstrap.sh`.
2. `python3 pipeline/vid.py nuevo <tema> --tipo short|largo` → `guion.md` (1 párrafo = 1 escena) y `escenas.js` (1 función por párrafo) en `proyectos/<tema>/`.
3. `estimar` → `voz` (short: ver docs/TIPO_SHORT.md; largo: Serena, reanudable) → `musica` → `mezcla` → `qa --stills t1,t2,…` (**mirar las imágenes**) → `render` (pesado + ligero) · `todo` hace la cadena. `estado` para retomar. Otros: `voz-importar <tema> <audio>`, `plan`.

**Guion**: fórmula de retención de las referencias del usuario en `docs/GUION_RETENCION.md` (gancho sobre TU cuerpo/vida en 0–3 s, giro antes de 8 s, mecanismo en pasos, reenganche cada ~15–20 s, giro final, vuelta al gancho «Así que…»; sin «Envíaselo a un amigo»: el cierre es el letrero «SIGUE A @randonautico»); comprobar con `python3 pipeline/revisar_guion.py proyectos/<tema>/guion.md`.

Antes de subir cambios: `bash pipeline/autotest.sh` (sintaxis, configuración, demo de realismo; sin render ni voz).

## Herramientas visuales (la elección de cuál usar es del vídeo, no fija)
- **`VE.real`** (`engine/realismo/`): paisajes y objetos pintados con volumen y luz por hora del día. **Estilo general** (shorts, largos de divulgación).
- **`VE.short`** (`engine/estilos/shorts.js`): rótulos, pastillas, flechas, iconos y el letrero final.
- **`VE.vol`** (`engine/volumen/`): **3D de verdad** (WebGL2 por CPU): objetos con volumen, luz suave, sombras, cámara que se mueve y modo **rayos X** (plano técnico). Modelos: Tierra con costas reales, avión, maniquí articulado con poses (vestible: vikingo), barco vikingo, castillo, terreno costero y mar con olas, silla, nube, árbol, sala; se añaden más montando piezas (esfera, cápsula, caja redondeada, torno, loft, tubo). Grafismos 2D anclados a puntos 3D (`V.proyectar`, `V.linea`, `V.marcador`). Revisión: `demo/volumen.html?modo=avion|maniqui|vikingos|piezas|tierra`.
- **`VE.ed`** (`engine/estilos/edicion.js`): **montaje editorial** de las referencias del usuario: subtítulos arriba con palabra clave enmarcada, etiquetas con línea guía, ondas, tarjetas de dato (con tachado), regla de medida, lupa, partículas, grano, viñeta, zoom «a través» y cierre (`VE.ed.cierre`: letrero «SIGUE A @randonautico»; el móvil «Envíaselo» ya NO se usa, solo con `{movil:true}`). Tarjetas de dato **sin fuente en pantalla**. Rasgos de personas (planos cercanos) y bichos se recrean solo si el tema lo pide. Análisis en `docs/GUIA_IMAGEN.md` §3 ter; revisión `demo/edicion.html`.
- **`VE.trazo` / `VE.med` / `VE.paisaje`**: estilo LUZ (contornos sin relleno) para meditación.
- **Cómo se programa la imagen y el audio (resúmenes con mediciones): `docs/GUIA_IMAGEN.md` y `docs/GUIA_AUDIO.md`.** Contrato de escenas y API: `docs/REFERENCIA_TECNICA.md`.

## Reglas del usuario (no reabrir)
- **NO ALUCINES** (aclarado por el usuario): se puede contar una invención, un mito, una suposición o una creencia generalizada, pero **el vídeo tiene que decir que lo es** («se dice que…», «es un mito», «se cree», «nadie lo ha medido»). Lo que se presente como hecho lleva fuente primaria. `datos.md` con niveles V (verificado) / V* (fuente secundaria fiable) / S (suposición o creencia: entra solo si la narración lo aclara) / E (estimación de un «¿qué pasaría si…?», solo si el usuario lo pide: hipótesis y cálculo en datos.md y la narración dice que es estimación) / X (no entra). Nunca datos inventados presentados como hechos.
- Visual: objetos y paisajes reales bien dibujados (no iconos esquemáticos). Sin fuentes a pie de imagen, sin chips HOOK/PUPA/QUIZ, sin estilos Pollín ni pizarra.
- No renderizar ni enviar vídeos de prueba salvo que lo pida; validar con linter, medidas y fotogramas. Los entregables que pide sí se renderizan.
- Voces: **Serena** (Qwen, largos), **Carmen** (ElevenLabs, shorts), **Aiden** (Qwen, voz masculina: `meta.voz = 'aiden'` o `'aiden_meditacion'`, cualquier tipo), **Vivian** (`vivian`, Qwen), `sharvard_1` (Piper, CC BY 3.0: atribuir) y `melo_es` (tal cual), **Carmelot** (`carmelot`: Serena ajustada al estilo de Carmen, sin oír por el usuario), MeloTTS (meditación antigua) y Piper (pendiente de ajuste). Los perfiles de `config/perfiles_voz.json` no se tocan sin que lo pida.
- Música: un estilo por perfil en `pipeline/musica.py`; no cambiarla sin que lo pida.
- ElevenLabs gasta créditos: `estimate_only` primero y `generations_count = 1`.
- Entrega doble: YouTube de 3–5 min ⇒ también versión Instagram vertical.
- MP4 ligero: < 10 MB en shorts (la app no reproduce > ~12 MB); en largos el objetivo va en `meta.ligero_MB`.

## Lecciones críticas (detalle en docs/REFERENCIA_TECNICA.md)
- Sin GPU: **nunca** `ctx.filter` ni `shadowBlur` por fotograma; hornear capas/sprites una vez (`esc.cache`, `VE.real.hornear`).
- Música larga: pico alto de RAM → nunca a la vez que voz o render. Qwen: ~4,4 s de cálculo por s de voz (lotes de 8).
- La salida de un comando filtrado con `| grep` no aparece hasta que termina: medir el progreso con ficheros (`voz_cache`, `seg/`, `progreso.json`).
- AAC a poca tasa sobrepasa el pico: dejar ≥ 1,5 dB de margen (el `ligero` ya aplica limitador y 64 kbps de audio).

## Sin verificar
Límites de duración de Instagram/Reels/TikTok · safe areas verticales (estimación) · calidad percibida de las voces · que el contenedor de un chat de Project pueda renderizar · la importación de ElevenLabs de punta a punta (ver `docs/ESTADO.md`).


## Regla: no subir proyectos
No hacer `git add` de `proyectos/*` (salvo `_plantilla`). Subir solo material visual y del motor que sirva para futuros videos.
