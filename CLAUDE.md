# Motor de vídeo generativo (todo por código, sin ficheros externos)

El usuario dice **LARGO** o **SHORT** + tema (+ descripción visual); tú ya sabes cómo diseñarlo. Tipos en `config/tipos.json`, guías en `docs/TIPO_LARGO.md` y `docs/TIPO_SHORT.md` (léelas antes de empezar).

| | SHORT | LARGO |
|---|---|---|
| Qué es | vertical 1080×1920, 30 fps, **1–3 min**, subtítulos, letrero final «SIGUE A @randonautico» | YouTube 16:9, 24 fps, **30–60 min**, capítulos de 3–5 min |
| Voz | **Carmen** (ElevenLabs, peninsular; se genera con la herramienta del conector y se importa) | **Serena** (Qwen3-TTS local, `.venv-qwen`) |
| Música | `curiosos` · −14 LUFS | `meditacion` · −16/−19 LUFS |

## Arranque
1. Sesión nueva: `bash pipeline/instalar.sh` (voces, MeloTTS, Qwen; requisitos de red en su cabecera). Contenedor de un chat de Project: `bash chat/bootstrap.sh`.
2. `python3 pipeline/vid.py nuevo <tema> --tipo short|largo` → `guion.md` (1 párrafo = 1 escena) y `escenas.js` (1 función por párrafo) en `proyectos/<tema>/`.
3. `estimar` → `voz` (short: ver docs/TIPO_SHORT.md; largo: Serena, reanudable) → `musica` → `mezcla` → `qa --stills t1,t2,…` (**mirar las imágenes**) → `render` (pesado + ligero) · `todo` hace la cadena. `estado` para retomar. Otros: `voz-importar <tema> <audio>`, `plan`.

Antes de subir cambios: `bash pipeline/autotest.sh` (sintaxis, configuración, demo de realismo; sin render ni voz).

## Herramientas visuales (la elección de cuál usar es del vídeo, no fija)
- **`VE.real`** (`engine/realismo/`): paisajes y objetos pintados con volumen y luz por hora del día. **Estilo general** (shorts, largos de divulgación).
- **`VE.short`** (`engine/estilos/shorts.js`): rótulos, pastillas, flechas, iconos y el letrero final.
- **`VE.trazo` / `VE.med` / `VE.paisaje`**: estilo LUZ (contornos sin relleno) para meditación.
- Contrato de escenas y API: `docs/REFERENCIA_TECNICA.md`.

## Reglas del usuario (no reabrir)
- **NO ALUCINES**: cifra sin fuente primaria no entra; di qué está verificado (`datos.md` con niveles V / V* / X).
- Visual: objetos y paisajes reales bien dibujados (no iconos esquemáticos). Sin fuentes a pie de imagen, sin chips HOOK/PUPA/QUIZ, sin estilos Pollín ni pizarra.
- No renderizar ni enviar vídeos de prueba salvo que lo pida; validar con linter, medidas y fotogramas. Los entregables que pide sí se renderizan.
- Voces: **Serena** (Qwen, largos), **Carmen** (ElevenLabs, shorts), MeloTTS (meditación antigua) y Piper (pendiente de ajuste). Los perfiles de `config/perfiles_voz.json` no se tocan sin que lo pida.
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
