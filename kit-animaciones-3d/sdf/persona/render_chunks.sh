#!/bin/bash
# Render resumable: 15 fps, 540x960, chunks de 45 fotogramas
P=/home/claude/randonautico71-spec/video-imagen/proyectos/sordera
export MOTOR=$P/kit/motor_sordera.js
N=723; C=45
for ((d=0; d<N; d+=C)); do
  h=$((d+C)); [ $h -gt $N ] && h=$N
  f=$P/salida/chunks/c$(printf %04d $d)
  [ -f ${f}_mudo.mp4 ] && continue
  DESDE=$d HASTA=$h node /home/claude/main-wt/kit-animaciones-3d/bin/sdf_botones.cjs $P/kit/sordera_sdf.js $f.mp4 --seg 48.192 --fps 15 --w 540 --h 960 > $P/salida/chunks/log_$d.txt 2>&1
  [ -f ${f}_mudo.mp4 ] || { echo "fallo $d" >> $P/salida/chunks/errores.txt; }
done
echo FIN >> $P/salida/chunks/progreso.txt
