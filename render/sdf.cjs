'use strict';
/* RENDER SDF (ray marching en CPU con hilos). Lo llama `vid.py sdf`; también se puede usar suelto:
   node render/sdf.cjs <escena> <salida.mp4 | carpeta_stills> [--stills t1,t2] [--w 540 --h 960 --seg 10 --fps 30 --hilos 4]
   La escena es engine/sdf/escenas/<escena>.js. El vídeo sale mudo a 1080×1920 (escalado lanczos); el progreso va a progreso_<escena>.json. */
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path'), fs = require('fs'), { spawn, execFileSync } = require('child_process');
if (!isMainThread) {
  const M = require('../engine/sdf/motor'), E = require(workerData.escena);
  parentPort.on('message', ({ i, t }) => { const buf = M.renderFrame(E, t, workerData.w, workerData.h); parentPort.postMessage({ i, buf }, [buf.buffer]); });
  return;
}
const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const escena = path.resolve(__dirname, '../engine/sdf/escenas', a[0] + '.js'), salida = a[1];
const w = +arg('w', 540), h = +arg('h', 960), fps = +arg('fps', 30), seg = +arg('seg', 10), hilos = +arg('hilos', require('os').cpus().length);
const stills = arg('stills', null);
const tiempos = stills ? stills.split(',').map(Number) : Array.from({ length: Math.round(seg * fps) }, (_, i) => i / fps);
const N = tiempos.length, t0 = Date.now(), listos = new Map();
let siguiente = 0, escrito = 0, ff = null;
if (!stills) {
  ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-r', String(fps), '-i', '-',
    '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', arg('crf', '17'), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] });
} else fs.mkdirSync(salida, { recursive: true });
const workers = Array.from({ length: hilos }, () => new Worker(__filename, { workerData: { escena, w, h } }));
const prog = path.join(path.dirname(path.resolve(salida)), 'progreso_' + a[0] + '.json');
function lanzar(wk) { if (siguiente < N) { const i = siguiente++; wk.postMessage({ i, t: tiempos[i] }); } }
for (const wk of workers) {
  wk.on('message', ({ i, buf }) => {
    listos.set(i, Buffer.from(buf));
    while (listos.has(escrito)) {
      const b = listos.get(escrito); listos.delete(escrito);
      if (ff) ff.stdin.write(b);
      else { const f = path.join(salida, `${a[0]}_t${tiempos[escrito]}.png`); execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', '-vf', 'scale=1080:1920:flags=lanczos', f], { input: b }); }
      escrito++;
    }
    fs.writeFileSync(prog, JSON.stringify({ hechos: escrito, total: N, s: (Date.now() - t0) / 1000 }));
    if (escrito === N) { workers.forEach(x => x.terminate()); if (ff) ff.stdin.end(); console.log(`${a[0]}: ${N} fotogramas en ${((Date.now() - t0) / 1000).toFixed(1)} s`); }
    else lanzar(wk);
  });
  lanzar(wk);
}
