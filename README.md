# Motor de vídeo generativo (local, solo código)

Python/numpy/scipy + Node/Playwright/Chromium + ffmpeg. Sin servicios de pago salvo la voz de los shorts (ElevenLabs, créditos).
Dos tipos de vídeo predeterminados — dices **LARGO** o **SHORT** y el motor ya sabe cómo diseñarlo:

| | SHORT | LARGO |
|---|---|---|
| Formato | vertical 1080×1920 · 30 fps · 1–3 min | YouTube 16:9 · 24 fps · 30–60 min |
| Voz | Carmen (ElevenLabs, peninsular) | Serena (Qwen3-TTS, local) |
| Guía de diseño | [docs/TIPO_SHORT.md](docs/TIPO_SHORT.md) | [docs/TIPO_LARGO.md](docs/TIPO_LARGO.md) |

## Cómo se organiza el trabajo
```
Project de claude.ai (chat)         Claude Code (este repo, 4 CPU)
 · guion, descripción visual, datos   · voz Serena, música, render, QA con imágenes
 · SHORT: puede producirlo si su      · LARGO: solo aquí (horas de CPU)
   contenedor lo permite (bootstrap)  · programa objetos y paisajes nuevos y los revisa en imagen
 instrucciones: chat/INSTRUCCIONES_PROYECTO.md
```
1. **Project**: conectar este repo como fuente y pegar `chat/INSTRUCCIONES_PROYECTO.md` en las instrucciones.
2. **Chat de Project**: `bash chat/bootstrap.sh` descarga el motor y dice qué se puede hacer en ese contenedor.
3. **Code**: `bash pipeline/instalar.sh` y `python3 pipeline/vid.py nuevo <tema> --tipo short|largo`.

## Estructura
```
config/    tipos.json (largo/short) · perfiles_voz.json · formatos.json · calibracion.json (tiempos medidos)
pipeline/  vid.py (CLI) · voz.py · musica.py · entrega.py · qwen_worker.py · instalar.sh
engine/    realismo/ (paisajes y objetos pintados) · estilos/ (shorts, luz, composición) · draw/ · figuras/ · video/ (runner) · qa/
render/    render.cjs (paralelo y reanudable) · navegador.cjs (autodetecta Chromium) · qa/revisar/still
chat/      instrucciones del Project + bootstrap.sh
docs/      TIPO_SHORT · TIPO_LARGO · REFERENCIA_TECNICA · ESTADO · historial/
proyectos/ meditacion_viaje (largo) · orientacion (short) · _plantilla
```
Lo pesado (modelos de voz, vídeos, `.venv-qwen`) no se sube: se regenera con `pipeline/instalar.sh`.
