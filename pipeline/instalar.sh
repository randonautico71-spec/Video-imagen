#!/usr/bin/env bash
# Recrea el entorno del motor en un contenedor nuevo. Idempotente: salta lo que ya esta.
# REQUISITOS DE RED (Allowed domains): huggingface.co, us.aws.cdn.hf.co, download.pytorch.org, download-r2.pytorch.org,
#   github.com, raw.githubusercontent.com, pypi.org, files.pythonhosted.org, fonts.gstatic.com
# AVISO: probado por pasos en un contenedor que ya tenia parte instalada; NO se ha ejecutado desde cero.
set -u
R="$(cd "$(dirname "$0")/.." && pwd)"
export HF_HUB_DISABLE_XET=1          # el protocolo xet va a cas-server.xethub.hf.co, que la red no permite
ok(){ printf "  [ok]    %s\n" "$1"; }  ; hacer(){ printf "  [..]    %s\n" "$1"; }  ; mal(){ printf "  [FALLO] %s\n" "$1"; }

echo "== Python: paquetes base"
python3 -c "import scipy,numpy,PIL" 2>/dev/null && ok "numpy/scipy/pillow" || { hacer "scipy"; pip install -q scipy; }

echo "== Voz: Piper"
python3 -c "import piper" 2>/dev/null && ok "piper-tts" || { hacer "piper-tts"; pip install -q piper-tts; }
M="$R/voces/piper"; mkdir -p "$M"
if [ -s "$M/es_ES-sharvard-medium.onnx" ]; then ok "modelo sharvard-medium"; else
  hacer "modelo sharvard-medium (77 MB)"
  B=https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/sharvard/medium
  curl -sSL -o "$M/es_ES-sharvard-medium.onnx" "$B/es_ES-sharvard-medium.onnx" && curl -sSL -o "$M/es_ES-sharvard-medium.onnx.json" "$B/es_ES-sharvard-medium.onnx.json" || mal "descarga de Piper (¿huggingface.co / us.aws.cdn.hf.co permitidos?)"
fi

echo "== Voz: MeloTTS (solo CPU, Python 3.13: dependencias modernas, no las fijadas de su requirements.txt)"
python3 -c "import torch" 2>/dev/null && ok "torch" || { hacer "torch CPU"; pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu; }
[ -d "$R/vendor/MeloTTS/melo" ] && ok "repo MeloTTS" || { hacer "clonar MeloTTS"; mkdir -p "$R/vendor"; git clone -q --depth 1 https://github.com/myshell-ai/MeloTTS.git "$R/vendor/MeloTTS" || mal "git clone MeloTTS"; }
pip install -q transformers num2words anyascii jamo pykakasi unidecode pypinyin cn2an jieba langid loguru inflect eng_to_ipa g2p_en txtsplit cached_path pydub librosa "gruut[es]" fugashi unidic_lite mecab-python3 2>&1 | grep -i error
N=/usr/local/share/nltk_data; mkdir -p $N/taggers $N/corpora   # NLTK se niega a bajar via proxy (SSRF): se instala a mano
G=https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages
for p in taggers/averaged_perceptron_tagger_eng taggers/averaged_perceptron_tagger corpora/cmudict; do
  [ -e "$N/$p" ] && continue; hacer "nltk $p"; curl -sSL -o /tmp/n.zip "$G/$p.zip" && unzip -q -o /tmp/n.zip -d "$N/$(dirname $p)"; done; ok "datos NLTK"

echo "== Alineador de palabras (faster-whisper)"
python3 -c "import faster_whisper" 2>/dev/null && ok "faster-whisper" || { hacer "faster-whisper"; pip install -q faster-whisper; }

echo "== Voz: Qwen3-TTS (Serena) en un venv aparte con Python 3.11 (qwen-tts fija transformers==4.57.3)"
# REQUISITOS DE RED extra: pypi.org, download.pytorch.org, huggingface.co (+ us.aws.cdn.hf.co para los pesos, ~2,5 GB la primera vez)
if [ -x "$R/.venv-qwen/bin/python" ] && "$R/.venv-qwen/bin/python" -c "import qwen_tts" 2>/dev/null; then ok "qwen-tts"; else
  hacer "venv Python 3.11 + torch CPU + qwen-tts"
  python3.11 -m venv "$R/.venv-qwen" 2>/dev/null; "$R/.venv-qwen/bin/pip" install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu \
   && "$R/.venv-qwen/bin/pip" install -q -U qwen-tts soundfile numpy || mal "instalacion de qwen-tts (¿pypi.org / download.pytorch.org permitidos?)"
fi

echo "== Verificacion de importaciones"
python3 - <<'PY'
import sys; sys.path.insert(0,'vendor/MeloTTS')
import warnings; warnings.filterwarnings('ignore')
for m in ['piper','faster_whisper','scipy','torch']:
    try: __import__(m); print('  [ok]   ',m)
    except Exception as e: print('  [FALLO]',m,e)
try:
    from melo.api import TTS; print('  [ok]    melo.api')
except Exception as e: print('  [FALLO] melo.api',str(e)[:90])
PY
echo "== Navegador y ffmpeg"
[ -x /opt/pw-browsers/chromium-1194/chrome-linux/chrome ] && ok "chromium" || mal "chromium no esta en /opt/pw-browsers/chromium-1194 (ajusta EXE en render/navegador.cjs)"
ffmpeg -hide_banner -filters 2>/dev/null | grep -q rubberband && ok "ffmpeg con rubberband" || mal "ffmpeg sin rubberband"
