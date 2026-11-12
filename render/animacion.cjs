/* RENDER DE UNA ANIMACION SIN VOZ (pagina HTML autonoma con window.renderAt(t), window.DURACION y un canvas #c).
   Pensado para el estilo RECORTES (stop-motion): se capturan solo los pasos distintos (--pasos, p. ej. 10/s) y ffmpeg
   los repite hasta --fps de salida, asi el render es 3 veces mas rapido y los saltos son exactos.
   Uso: node render/animacion.cjs <pagina.html> <salida.mp4> [--lienzo vertical] [--pasos 10] [--fps 30] [--ss 1.5] [--crf 18] */
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { abrir, capturar } = require('./navegador.cjs');
const v = process.argv.slice(2), A = {}; const pos = [];
for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) A[v[i].slice(2)] = v[++i]; else pos.push(v[i]);
const [pagina, salida] = pos;
if (!pagina || !salida) { console.error('Uso: node render/animacion.cjs <pagina.html> <salida.mp4> [--lienzo vertical] [--pasos 10] [--fps 30] [--ss 1.5]'); process.exit(1); }
const pasos = parseFloat(A.pasos || 10), fps = parseFloat(A.fps || 30), ss = parseFloat(A.ss || 1.5);
(async () => {
  const { navegador, page } = await abrir({ formato: A.lienzo || 'vertical', ss, pagina: path.resolve(pagina) });
  const dur = await page.evaluate(() => window.DURACION), N = Math.ceil(dur * pasos);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(pasos), '-vcodec', 'mjpeg', '-i', '-',
    '-vf', `fps=${fps},scale=in_range=pc:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(A.crf || 18), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fin = new Promise((ok, ko) => ff.on('close', c => c === 0 ? ok() : ko(new Error('ffmpeg salio con codigo ' + c))));
  const t0 = Date.now();
  for (let n = 0; n < N; n++) {
    const buf = await capturar(page, (n + 0.5) / pasos, 0.93);      // centro del paso: evita errores de redondeo en el borde
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await fin; await navegador.close();
  console.log(`LISTO ${salida}: ${N} pasos (${dur} s) en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
