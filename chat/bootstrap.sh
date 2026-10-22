#!/usr/bin/env bash
# BOOTSTRAP PARA UN CHAT DE PROJECT (o cualquier contenedor nuevo): descarga el motor desde GitHub, comprueba que contenedor tienes y
# dice QUE se puede hacer aqui (render de shorts, voz local, solo guion...). No instala nada pesado sin avisar.
# Uso:   bash chat/bootstrap.sh            (si ya estas dentro del repo)
#        GH_TOKEN=xxxx bash bootstrap.sh   (si el repo es privado; el token solo necesita LECTURA del repo)
#        REPO=usuario/repo DEST=/ruta bash bootstrap.sh
set -u
REPO="${REPO:-randonautico71-spec/Video-imagen}"; DEST="${DEST:-$HOME/video-engine}"
ok(){ printf "  [ok]    %s\n" "$1"; }; no(){ printf "  [NO]    %s\n" "$1"; }; av(){ printf "  [aviso] %s\n" "$1"; }

echo "== 1. Motor (codigo)"
if [ -f "$(dirname "$0")/../pipeline/vid.py" ]; then DEST="$(cd "$(dirname "$0")/.." && pwd)"; ok "ya estas dentro del repo: $DEST"
elif [ -f "$DEST/pipeline/vid.py" ]; then ok "ya descargado en $DEST"; (cd "$DEST" && git pull -q 2>/dev/null && ok "actualizado") || av "no se pudo actualizar (sin red a github.com o repo sin .git)"
else
  URL="https://github.com/$REPO.git"; [ -n "${GH_TOKEN:-}" ] && URL="https://x-access-token:${GH_TOKEN}@github.com/$REPO.git"
  if git clone -q --depth 1 "$URL" "$DEST" 2>/dev/null; then ok "clonado en $DEST"
  elif curl -fsSL -o /tmp/motor.zip "https://codeload.github.com/$REPO/zip/refs/heads/main" 2>/dev/null && unzip -q -o /tmp/motor.zip -d /tmp/motor_zip; then
    mkdir -p "$DEST" && cp -r /tmp/motor_zip/*/. "$DEST"/ && ok "descargado como zip en $DEST"
  else no "no se pudo descargar el repo (¿github.com / codeload.github.com permitidos? ¿repo privado sin GH_TOKEN?)"; echo "   -> Alternativa: sube el repo como zip al chat."; exit 2; fi
fi
cd "$DEST" || exit 2

echo "== 2. Herramientas del contenedor"
py=0; nd=0; ff=0; ch=0; wh=0; np_=0
command -v python3 >/dev/null && { ok "python3 $(python3 -V 2>&1 | cut -d' ' -f2)"; py=1; } || no "python3"
python3 -c "import numpy, scipy, PIL" 2>/dev/null && { ok "numpy/scipy/pillow"; np_=1; } || { av "faltan numpy/scipy/pillow -> pip install numpy scipy pillow"; pip install -q numpy scipy pillow 2>/dev/null && np_=1 && ok "instalados"; }
command -v node >/dev/null && { ok "node $(node -v)"; nd=1; } || no "node (hace falta para el render)"
command -v ffmpeg >/dev/null && { ok "ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"; ff=1; } || no "ffmpeg (hace falta para mezclar y codificar)"
ffmpeg -hide_banner -filters 2>/dev/null | grep -q sidechaincompress && ok "ffmpeg: sidechaincompress/loudnorm" || av "ffmpeg sin sidechaincompress (la mezcla de musica sobre la voz fallaria)"
if [ $nd = 1 ]; then
  CH=$(node -e "try{const n=require('./render/navegador.cjs');console.log(n.EXE)}catch(e){}" 2>/dev/null | tail -1)
  if [ -n "$CH" ] && [ -e "$CH" ]; then ok "Playwright + Chromium: $CH"; ch=1
  else
    av "no hay Playwright/Chromium. Intento instalarlos (necesita npm y red a cdn.playwright.dev / registry.npmjs.org)"
    (npm i --no-audit --no-fund playwright >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1) && \
      CH=$(node -e "try{console.log(require('./render/navegador.cjs').EXE)}catch(e){}" 2>/dev/null | tail -1) && [ -e "$CH" ] && { ok "Chromium instalado: $CH"; ch=1; } || no "Chromium no disponible: SIN el no se puede renderizar aqui"
  fi
fi
python3 -c "import faster_whisper" 2>/dev/null && { ok "faster-whisper (alineado de palabras)"; wh=1; } || { av "falta faster-whisper -> pip install faster-whisper (el modelo 'small' se baja de huggingface.co)"; pip install -q faster-whisper 2>/dev/null && wh=1 && ok "instalado"; }

echo "== 3. Red (solo dominios que usa el motor)"
for h in github.com huggingface.co pypi.org; do code=$(curl -s -o /dev/null -m 8 -w "%{http_code}" "https://$h" 2>/dev/null); [ "$code" != "000" ] && ok "$h ($code)" || no "$h"; done
echo "== 4. Recursos"; echo "  CPU: $(nproc) nucleos · RAM: $(free -g 2>/dev/null | awk '/Mem:/{print $2}') GB · disco libre: $(df -h . | awk 'NR==2{print $4}')"

echo; echo "== RESUMEN: que se puede hacer en este contenedor"
if [ $py = 1 ] && [ $np_ = 1 ] && [ $nd = 1 ] && [ $ff = 1 ] && [ $ch = 1 ] && [ $wh = 1 ]; then
  echo "  SHORT completo (voz importada de ElevenLabs + musica + render): SI. Estima el tiempo con: python3 pipeline/vid.py estimar <tema>"
  if [ "$(nproc)" -ge 4 ] && [ "$(free -g 2>/dev/null | awk '/Mem:/{print $2}')" -ge 12 ]; then
    echo "  LARGO (voz Serena local + 30-60 min de render): POSIBLE pero de horas (voz ~4,4 s de calculo por s de voz con 4 CPU; render ~1 min por min de video). Necesita .venv-qwen: bash pipeline/instalar.sh"
  else
    echo "  LARGO (voz Serena local + 30-60 min de render): NO viable aqui (pocas CPU/RAM y los procesos largos se cortan). Usar una sesion de Claude Code."
  fi
else
  echo "  Faltan piezas (ver [NO] arriba). Aqui puedes hacer: guion, escenas.js y brief (texto). El render/voz se hacen en una sesion de Claude Code."
fi
echo "  Motor en: $DEST"
