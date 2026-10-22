/* RENDER PARALELO. Reparte los fotogramas en trozos, un proceso por trozo-cola; cada proceso abre su propio
   Chromium, captura con canvas.toDataURL (36 ms/fotograma medidos vs 393 del PNG) y los envia por pipe a
   ffmpeg, que codifica un MP4 por trozo. Despues se concatenan sin recodificar.
   Uso: node render/render.cjs --proyecto proyectos/x --lienzo vertical --fps 30 --ss 1.5 --salida DIR
        [--workers 4] [--trozo 240] [--calidad 0.92] [--crf 17] [--hasta SEG] [--limpiar] [--seco]
   REANUDABLE: cada trozo se escribe como .part y se renombra al terminar; al relanzar se saltan los trozos completos.
   Una 'huella' (escenas.js + guion/timeline + parametros) invalida los trozos si algo cambio. --seco solo muestra el plan. */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { spawn } = require('child_process');
const { iniciar, RAIZ } = require('./servidor.cjs');
const { abrirProyecto } = require('./navegador.cjs');

function args() {
  const a = {}; const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) if (v[i].startsWith('--')) { const k = v[i].slice(2); a[k] = (v[i + 1] && !v[i + 1].startsWith('--')) ? v[++i] : true; }
  return a;
}
const A = args();
const so = parseFloat(A.so || 1), fps = parseFloat(A.fps || 30), ss = parseFloat(A.ss || 1.5), trozo = parseInt(A.trozo || 240);
const calidad = parseFloat(A.calidad || 0.92), crf = A.crf || 17, workers = parseInt(A.workers || 4);

function codificador(salida) {
  return spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', '-',
    // COLOR: el JPEG del canvas es sRGB/BT.601 de rango completo; sin conversion explicita los reproductores (que asumen BT.709 en HD) lo
    // veian desviado (medido: rojo 191,0,0 -> 207,17,0; error medio de verde 13 niveles). Aqui se convierte a BT.709 y se etiqueta.
    // aq-mode=3 reduce las bandas en degradados oscuros (cielos nocturnos). 'medium' en vez de 'veryfast': el codificador no es el cuello de botella.
    '-vf', 'scale=in_range=pc:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-x264-params', 'aq-mode=3', '-r', String(fps),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-g', String(Math.round(fps * 2)), '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] });
}

async function trabajador() {
  const lista = JSON.parse(A.lista);            // [{i, ini, fin}]
  const REINICIO = 6;                           // trozos por navegador: una hora de render no debe acumular memoria
  let nav = null, page = null, hechos = 0;
  for (const t of lista) {
    if (!nav || hechos % REINICIO === 0) {
      if (nav) await nav.close();
      ({ page, navegador: nav } = await abrirProyecto({ puerto: A.puerto, proyecto: A.proyecto, lienzo: A.lienzo, ss, so }));
    }
    const nombre = `seg${String(t.i).padStart(4, '0')}`, parcial = path.join(A.salida, 'seg', nombre + '.part.mp4'), final = path.join(A.salida, 'seg', nombre + '.mp4');
    const ff = codificador(parcial);
    const fin = new Promise((ok, ko) => { ff.on('close', c => c === 0 ? ok() : ko(new Error('ffmpeg salio con codigo ' + c + ' en ' + parcial))); });
    for (let n = t.ini; n < t.fin; n++) {
      const b64 = await page.evaluate(([tt, q]) => window.capturar(tt, q), [n / fps, calidad]);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await fin;
    fs.renameSync(parcial, final);              // solo un trozo COMPLETO tiene el nombre definitivo
    hechos++; console.log('TROZO ' + t.i);
  }
  if (nav) await nav.close();
}

function huella(dirProy) {
  const h = crypto.createHash('sha1');
  for (const f of ['escenas.js', 'salida/timeline.json', 'salida/palabras.json', 'meta.json']) { try { h.update(fs.readFileSync(path.join(dirProy, f))); } catch (e) { h.update('falta:' + f); } }
  h.update(JSON.stringify([A.lienzo, fps, ss, so, calidad, crf, trozo, 'enc-bt709-v2']));
  for (const f of fs.readdirSync(path.join(RAIZ, 'engine'), { recursive: true })) if (/\.js$/.test(f)) h.update(fs.readFileSync(path.join(RAIZ, 'engine', f)));   // el motor tambien cuenta
  return h.digest('hex').slice(0, 16);
}

async function principal() {
  const srv = await iniciar();
  const dirProy = path.join(RAIZ, A.proyecto);
  const tl = JSON.parse(fs.readFileSync(path.join(dirProy, 'salida/timeline.json')));
  const dur = A.hasta ? Math.min(parseFloat(A.hasta), tl.duracion_total) : tl.duracion_total;
  const N = Math.ceil(dur * fps);
  const salida = path.resolve(A.salida); fs.mkdirSync(path.join(salida, 'seg'), { recursive: true });
  const hf = huella(dirProy), fh = path.join(salida, 'huella.txt'), previa = fs.existsSync(fh) ? fs.readFileSync(fh, 'utf8') : '';
  const segs = () => fs.readdirSync(path.join(salida, 'seg'));
  if (A.limpiar || (previa && previa !== hf)) { for (const f of segs()) fs.unlinkSync(path.join(salida, 'seg', f)); if (previa && previa !== hf) console.log('La huella cambio (escenas, guion o parametros): se descartan los trozos anteriores.'); }
  for (const f of segs()) if (f.endsWith('.part.mp4')) fs.unlinkSync(path.join(salida, 'seg', f));      // restos de un corte
  if (!A.seco) fs.writeFileSync(fh, hf);

  const todos = []; for (let i = 0, ini = 0; ini < N; i++, ini += trozo) todos.push({ i, ini, fin: Math.min(N, ini + trozo) });
  const yaHechos = new Set(segs().filter(f => /^seg\d+\.mp4$/.test(f)).map(f => parseInt(f.slice(3, 7))));
  const trozos = todos.filter(t => !yaHechos.has(t.i));
  const cola = Array.from({ length: workers }, () => []); trozos.forEach((t, k) => cola[k % workers].push(t));
  console.log(`Render: ${N} fotogramas (${dur.toFixed(1)} s a ${fps} fps), ${todos.length} trozos (${yaHechos.size} ya hechos, ${trozos.length} pendientes), ${workers} procesos, lienzo ${A.lienzo}, ss ${ss}, huella ${hf}`);
  if (A.seco) { console.log('(--seco: solo plan, no se renderiza)'); srv.cerrar(); return; }
  const t0 = Date.now(); let hechos = 0; const total = trozos.length;
  const progreso = () => { const s = (Date.now() - t0) / 1000; fs.writeFileSync(path.join(salida, 'progreso.json'), JSON.stringify({ hechos: hechos + yaHechos.size, total: todos.length, segundos: Math.round(s), restante_s: hechos ? Math.round(s / hechos * (total - hechos)) : null })); };
  await Promise.all(cola.filter(c => c.length).map(c => new Promise((ok, ko) => {
    const p = spawn(process.execPath, [__filename, '--trabajador', '--puerto', String(srv.puerto), '--proyecto', A.proyecto,
      '--lienzo', A.lienzo, '--fps', String(fps), '--ss', String(ss), '--so', String(so), '--salida', salida, '--calidad', String(calidad), '--crf', String(crf),
      '--lista', JSON.stringify(c)], { stdio: ['ignore', 'pipe', 'inherit'] });
    p.stdout.on('data', d => { for (const l of String(d).split('\n')) if (l.startsWith('TROZO')) {
      hechos++; const s = (Date.now() - t0) / 1000; progreso();
      if (hechos % 10 === 0 || hechos === total) console.log(`  ${hechos + yaHechos.size}/${todos.length} trozos  ${s.toFixed(0)} s  (~${(s / hechos * (total - hechos)).toFixed(0)} s restantes)`); } });
    p.on('close', code => code === 0 ? ok() : ko(new Error('Un proceso de render fallo (codigo ' + code + ')')));
  })));
  srv.cerrar();
  const lista = todos.map(t => `file '${path.join(salida, 'seg', `seg${String(t.i).padStart(4, '0')}.mp4`)}'`).join('\n');
  fs.writeFileSync(path.join(salida, 'lista.txt'), lista);
  await new Promise((ok, ko) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(salida, 'lista.txt'),
    '-c', 'copy', path.join(salida, 'mudo.mp4')], { stdio: 'inherit' }).on('close', c => c ? ko(new Error('concat fallo')) : ok()));
  console.log(`LISTO mudo.mp4 en ${((Date.now() - t0) / 1000).toFixed(0)} s (${(trozos.length ? trozos.reduce((a, t) => a + t.fin - t.ini, 0) / ((Date.now() - t0) / 1000) : 0).toFixed(1)} fotogramas/s en esta ejecucion)`);
}

(A.trabajador ? trabajador() : principal()).catch(e => { console.error('FALLO:', e.message); process.exit(1); });
