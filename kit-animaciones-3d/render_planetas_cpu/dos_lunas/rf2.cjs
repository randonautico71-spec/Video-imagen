const { Worker, isMainThread, parentPort, workerData } = require('worker_threads'), fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
if (!isMainThread) { const { renderFrame } = require('./shots.js'); parentPort.on('message', ({ i, t }) => { const buf = renderFrame(t, workerData.w, workerData.h); parentPort.postMessage({ i, buf }, [buf.buffer]); }); return; }
const [dir, w, h, a, b, fps, hil] = process.argv.slice(2); fs.mkdirSync(dir, { recursive: true });
let items = []; for (let i = Math.round(+a * +fps); i < Math.round(+b * +fps); i++) items.push({ name: 'f' + String(i).padStart(5, '0'), t: i / +fps });
items = items.filter(o => !fs.existsSync(path.join(dir, o.name + '.png')));
const N = items.length, t0 = Date.now(); let sig = 0, hecho = 0;
if (!N) { console.log('nada'); process.exit(0); }
const ws = Array.from({ length: +(hil || 2) }, () => new Worker(__filename, { workerData: { w: +w, h: +h } }));
const dar = wk => { if (sig < N) { const i = sig++; wk.postMessage({ i, t: items[i].t }); } };
ws.forEach(wk => { wk.on('message', ({ i, buf }) => { const f = path.join(dir, items[i].name + '.png'); spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', f + '.tmp.png'], { input: Buffer.from(buf) }); fs.renameSync(f + '.tmp.png', f); hecho++;
  if (hecho % 10 === 0 || hecho === N) fs.writeFileSync(path.join(dir, 'progreso.txt'), `${hecho}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  if (hecho === N) { ws.forEach(x => x.terminate()); console.log('listo', N, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } else dar(wk); }); dar(wk); });
