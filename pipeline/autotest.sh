#!/usr/bin/env bash
# PRUEBAS AUTOMATICAS del repositorio (rapidas, sin render de video ni voz). Uso: bash pipeline/autotest.sh
cd "$(dirname "$0")/.." || exit 2; fallos=0
ok(){ printf "  [ok]    %s\n" "$1"; }; mal(){ printf "  [FALLO] %s\n" "$1"; fallos=$((fallos+1)); }

echo "== Sintaxis"
python3 -m py_compile pipeline/*.py 2>/dev/null && ok "python (pipeline/*.py)" || mal "python"
bad=0; for f in render/*.cjs $(find engine -name '*.js') ; do node --check "$f" 2>/dev/null || { mal "js: $f"; bad=1; }; done; [ $bad = 0 ] && ok "javascript (render/ y engine/)"
bash -n pipeline/instalar.sh && bash -n chat/bootstrap.sh && ok "shell (instalar.sh, bootstrap.sh)" || mal "shell"

echo "== Configuracion"
python3 - <<'PY' && ok "tipos.json / perfiles_voz.json / calibracion.json coherentes" || mal "configuracion"
import json,sys
t=json.load(open('config/tipos.json')); p=json.load(open('config/perfiles_voz.json')); c=json.load(open('config/calibracion.json')); f=json.load(open('config/formatos.json'))
for n in ('largo','short'):
    x=t[n]; assert x['voz'] in p, (n,'voz sin perfil'); assert x['formato'] in f, (n,'formato'); assert x['musica'] in ('curiosos','aprender','meditacion')
    assert x['voz'] in c['voz']['palabras_por_min_habla'], (n,'sin wpm en calibracion'); m=p[x['voz']]['motor']
    assert m in c['voz']['carga_modelo_s'] and m in c['voz']['calculo_s_por_s_de_habla'], (n,'motor sin calibrar')
    assert x['duracion_s'][0]<x['duracion_s'][1] and x['guia'] and __import__('os').path.exists(x['guia']), (n,'guia')
assert t['short']['voz']=='carmen' and p['carmen']['voice_id'] and t['largo']['voz'].startswith('serena')
PY
python3 pipeline/entrega.py >/dev/null && ok "entrega.py (plan de versiones)" || mal "entrega.py"

echo "== Revisor de guiones (docs/GUION_RETENCION.md)"
printf "Tu nariz huele mejor de lo que crees, y te lo voy a demostrar.\n\nLo has oído mil veces: que los perros nos ganan. Pero tú también rastreas.\n\nCada vez que respiras, el aire pasa por un techo de células que detectan olores.\n\nY lo peor: casi nunca les prestas atención.\n\nO sea, no es que huelas poco, es que no te fijas.\n\nAsí que tu nariz no es mala. Envíaselo a alguien que todavía no lo sabía.\n" > /tmp/autotest_bueno.md
printf "Hola a todos, hoy en este vídeo vamos a hablar de la nariz humana y de todas las cosas que hace cada día sin parar.\n\nGracias por ver.\n" > /tmp/autotest_malo.md
python3 pipeline/revisar_guion.py /tmp/autotest_bueno.md >/dev/null && ! python3 pipeline/revisar_guion.py /tmp/autotest_malo.md >/dev/null && ok "revisar_guion.py (aprueba el bueno, suspende el malo)" || mal "revisar_guion.py"
rm -f /tmp/autotest_bueno.md /tmp/autotest_malo.md

echo "== Proyecto de prueba (crear, estimar, avisos de rango)"
python3 pipeline/vid.py nuevo _autotest --tipo short >/dev/null 2>&1 && printf "Hola.\n\nAdios.\n" > proyectos/_autotest/guion.md && \
  python3 pipeline/vid.py estimar _autotest 2>&1 | grep -q "fuera del rango" && ok "nuevo --tipo short + aviso de duracion fuera de rango" || mal "nuevo/estimar"
rm -rf proyectos/_autotest

echo "== Navegador y motor visual (sin errores en pagina)"
if node -e "const n=require('./render/navegador.cjs');process.exit(n.EXE&&n.PW?0:1)" 2>/dev/null; then
  ok "Playwright + Chromium localizados"
  mkdir -p /tmp/autotest_img && for m in "paisaje" "objetos" "rayo"; do
    node -e "
const n=require('./render/navegador.cjs'),fs=require('fs');(async()=>{const {chromium}=require(n.PW);const b=await chromium.launch({executablePath:n.EXE,args:n.FLAGS});const pg=await b.newPage({viewport:{width:960,height:540}});const er=[];pg.on('pageerror',e=>er.push(String(e)));pg.on('console',m=>{if(m.type()==='error')er.push(m.text())});
await pg.goto('file://'+process.cwd()+'/demo/realismo.html?modo=$m&ss=0.5');await pg.evaluate(()=>window.renderAt(0));const d=await pg.evaluate(()=>document.getElementById('c').toDataURL('image/jpeg',0.8).length);await b.close();if(er.length||d<5000){console.error(er.join('|')||'imagen vacia');process.exit(1)}})()" 2>/dev/null && ok "demo/realismo.html?modo=$m" || mal "demo realismo $m"
  done
  node -e "
const n=require('./render/navegador.cjs');(async()=>{const {chromium}=require(n.PW);const b=await chromium.launch({executablePath:n.EXE,args:n.FLAGS});const pg=await b.newPage({viewport:{width:540,height:960}});const er=[];pg.on('pageerror',e=>er.push(String(e)));pg.on('console',m=>{if(m.type()==='error')er.push(m.text())});
await pg.goto('file://'+process.cwd()+'/demo/edicion.html?ss=0.5');await pg.evaluate(()=>window.ready);for(const t of [3,7,11,15])await pg.evaluate(t=>window.renderAt(t),t);await b.close();if(er.length){console.error(er.join('|'));process.exit(1)}})()" 2>/dev/null && ok "demo/edicion.html (montaje editorial)" || mal "demo edicion"
  for m in "avion" "maniqui" "piezas" "vikingos"; do
    node -e "
const n=require('./render/navegador.cjs');(async()=>{const {chromium}=require(n.PW);const b=await chromium.launch({executablePath:n.EXE,args:n.FLAGS});const pg=await b.newPage({viewport:{width:540,height:960}});const er=[];pg.on('pageerror',e=>er.push(String(e)));pg.on('console',m=>{if(m.type()==='error')er.push(m.text())});
await pg.goto('file://'+process.cwd()+'/demo/volumen.html?modo=$m&ss=0.5');await pg.evaluate(()=>window.ready);await pg.evaluate(()=>window.renderAt(6));const d=await pg.evaluate(()=>document.getElementById('c').toDataURL('image/jpeg',0.8).length);await b.close();if(er.length||d<5000){console.error(er.join('|')||'imagen vacia');process.exit(1)}})()" 2>/dev/null && ok "demo/volumen.html?modo=$m (3D WebGL)" || mal "demo volumen $m"
  done
else mal "no hay Playwright/Chromium (ver chat/bootstrap.sh)"; fi
echo; [ $fallos = 0 ] && echo "TODO BIEN" || { echo "$fallos FALLO(S)"; exit 1; }
