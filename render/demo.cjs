/* RENDER DE UNA DEMO (sin voz ni musica): pagina con window.renderAt(t), p. ej. demo/volumen.html?modo=vikingos.
   Uso: node render/demo.cjs --pagina "demo/volumen.html?modo=vikingos" --duracion 22.5 --salida /ruta/clip.mp4
        [--lienzo vertical|yt] [--fps 30] [--ss 1.5] [--workers 4] [--crf 19] [--calidad 0.92]
   Reparte el clip en tramos consecutivos (uno por proceso), cada uno a su MP4, y los une sin recodificar.
   Mismo color que render.cjs (BT.709 etiquetado). El progreso se ve en <salida>.progreso/ (un fichero por tramo).
   --trozo N  (REANUDABLE, recomendado para renders de mas de ~20 min): el clip se parte en trozos de N fotogramas que los procesos
              van cogiendo de una cola; cada trozo se guarda en c_<inicio>.mp4 al terminar (se escribe a .tmp y se renombra).
              Si el render se corta (fin de la sesion, reinicio del contenedor), repetir el MISMO comando: salta los trozos hechos.
              Lanzarlo separado de la sesion: setsid nohup node render/demo.cjs ... > log 2>&1 &  */
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const n = require('./navegador.cjs');
const A = {}; process.argv.slice(2).forEach((v, i, a) => { if (v.startsWith('--')) A[v.slice(2)] = a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : true; });
const fps = +(A.fps || 30), ss = +(A.ss || 1.5), W = +(A.workers || 4), dur = +A.duracion, crf = A.crf || 19, q = +(A.calidad || 0.92), lienzo = A.lienzo || 'vertical';
const [AN, AL] = lienzo === 'yt' ? [1920, 1080] : [1080, 1920];
const salida = path.resolve(A.salida), dir = salida + '.progreso'; fs.mkdirSync(dir, { recursive: true });
const total = Math.round(dur * fps), RAIZ = path.resolve(__dirname, '..');

function codificador(f) {
  return spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', '-',
    '-vf', `scale=${AN}:${AL}:flags=lanczos:in_range=pc:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p`,   // el lienzo mide W*ss: se reduce al tamano final
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-x264-params', 'aq-mode=3', '-r', String(fps),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', f], { stdio: ['pipe', 'inherit', 'inherit'] });
}
async function tramo(k, a, b) {
  const { chromium } = require(n.PW), nav = await chromium.launch({ executablePath: n.EXE, args: n.FLAGS });
  const pg = await nav.newPage({ viewport: { width: AN, height: AL } }); const err = [];
  pg.on('pageerror', e => err.push(String(e)));
  const sep = A.pagina.includes('?') ? '&' : '?';
  await pg.goto('file://' + path.join(RAIZ, A.pagina.split('?')[0]) + '?' + (A.pagina.split('?')[1] || '') + sep + 'ss=' + ss + '&lienzo=' + lienzo);
  await pg.evaluate(() => window.ready);
  const f = path.join(dir, `t${String(k).padStart(2, '0')}.mp4`), ff = codificador(f), prog = path.join(dir, `t${k}.txt`);
  for (let i = a; i < b; i++) {
    const d = await pg.evaluate(([t, q]) => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', q).slice(23); }, [i / fps, q]);
    if (!ff.stdin.write(Buffer.from(d, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 10 === 0) fs.writeFileSync(prog, `${i - a + 1}/${b - a}\n`);
  }
  ff.stdin.end(); await new Promise((ok, ko) => ff.on('close', c => c === 0 ? ok() : ko(new Error('ffmpeg tramo ' + k + ' salio con ' + c))));
  await nav.close(); if (err.length) throw new Error('Errores en la pagina: ' + err.join(' | '));
  fs.writeFileSync(prog, `${b - a}/${b - a} hecho\n`); return f;
}
/* Modo reanudable: cola de trozos de A.trozo fotogramas; cada proceso abre un navegador y va cogiendo trozos pendientes. */
async function porTrozos(F) {
  const t0 = Date.now(), trozos = []; for (let a = 0; a < total; a += F) trozos.push([a, Math.min(total, a + F)]);
  const nombre = ([a]) => path.join(dir, `c_${String(a).padStart(6, '0')}.mp4`), pendientes = trozos.filter(t => !fs.existsSync(nombre(t)));
  console.log(`${trozos.length} trozos de ${F} fotogramas; hechos ${trozos.length - pendientes.length}, pendientes ${pendientes.length}`);
  let sig = 0, hechos = trozos.length - pendientes.length;
  async function proceso(k) {
    if (sig >= pendientes.length) return;
    const { chromium } = require(n.PW), nav = await chromium.launch({ executablePath: n.EXE, args: n.FLAGS });
    const pg = await nav.newPage({ viewport: { width: AN, height: AL } }); const err = []; pg.on('pageerror', e => err.push(String(e)));
    const sep = A.pagina.includes('?') ? '&' : '?';
    await pg.goto('file://' + path.join(RAIZ, A.pagina.split('?')[0]) + '?' + (A.pagina.split('?')[1] || '') + sep + 'ss=' + ss + '&lienzo=' + lienzo);
    await pg.evaluate(() => window.ready);
    while (sig < pendientes.length) {
      const [a, b] = pendientes[sig++], f = nombre([a]), tmp = f + '.tmp.mp4', ff = codificador(tmp);
      for (let i = a; i < b; i++) {
        const d = await pg.evaluate(([t, q]) => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', q).slice(23); }, [i / fps, q]);
        if (!ff.stdin.write(Buffer.from(d, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); await new Promise((ok, ko) => ff.on('close', c => c === 0 ? ok() : ko(new Error('ffmpeg trozo ' + a + ' salio con ' + c))));
      if (err.length) throw new Error('Errores en la pagina: ' + err.join(' | '));
      fs.renameSync(tmp, f); hechos++;
      fs.writeFileSync(path.join(dir, 'progreso.txt'), `${hechos}/${trozos.length} trozos (${Math.round(hechos / trozos.length * 100)} %)\n`);
    }
    await nav.close();
  }
  await Promise.all(Array.from({ length: W }, (_, k) => proceso(k)));
  const lista = path.join(dir, 'lista.txt'); fs.writeFileSync(lista, trozos.map(t => `file '${nombre(t)}'`).join('\n'));
  await new Promise((ok, ko) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', salida], { stdio: 'inherit' }).on('close', c => c === 0 ? ok() : ko(new Error('concat ' + c))));
  console.log(`OK ${salida}: ${total} fotogramas en ${((Date.now() - t0) / 1000).toFixed(0)} s (${(fs.statSync(salida).size / 1e6).toFixed(1)} MB)`);
}
(async () => {
  if (A.trozo) return porTrozos(+A.trozo);
  const t0 = Date.now(), per = Math.ceil(total / W), partes = [];
  for (let k = 0; k < W; k++) { const a = k * per, b = Math.min(total, a + per); if (a < b) partes.push(tramo(k, a, b)); }
  const fs_ = await Promise.all(partes), lista = path.join(dir, 'lista.txt');
  fs.writeFileSync(lista, fs_.map(f => `file '${f}'`).join('\n'));
  await new Promise((ok, ko) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', salida], { stdio: 'inherit' }).on('close', c => c === 0 ? ok() : ko(new Error('concat ' + c))));
  console.log(`OK ${salida}: ${total} fotogramas en ${((Date.now() - t0) / 1000).toFixed(0)} s (${(fs.statSync(salida).size / 1e6).toFixed(1)} MB)`);
})().catch(e => { console.error(e.message); process.exit(1); });
