// uso: node still.js t1,t2,... [w] [h] [carpeta]  (un hilo; para revisar encuadres)
const M = require('./motor_sordera'), E = require('./sordera_sdf');
const fs = require('fs'), { spawnSync } = require('child_process');
const ts = process.argv[2].split(',').map(Number), w = +(process.argv[3] || 270), h = +(process.argv[4] || 480), dir = process.argv[5] || '../salida/stills';
fs.mkdirSync(dir, { recursive: true });
for (const t of ts) {
  const t0 = Date.now(); const buf = M.renderFrame(E, t, w, h);
  const f = `${dir}/s_${String(t).replace('.', '_')}.png`;
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', f], { input: Buffer.from(buf) });
  console.log(t, ((Date.now() - t0) / 1000).toFixed(1) + ' s', f);
}
