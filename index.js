const http = require('http');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

const VDO_URL = process.env.VDO_URL;
const RTMP_URL = process.env.RTMP_URL;
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Puente RTMP activo\n');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor web escuchando en puerto ${PORT}`);
});

if (!VDO_URL || !RTMP_URL) {
  console.error("Faltan las variables VDO_URL o RTMP_URL");
  process.exit(1);
}

(async () => {
  console.log("Iniciando pantalla virtual...");
  spawn('Xvfb', [':99', '-screen', '0', '854x480x24']);
  process.env.DISPLAY = ':99';

  await new Promise(r => setTimeout(r, 2000));

  console.log("Abriendo VDO.Ninja en el servidor...");
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=854,480',
      '--start-fullscreen'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 854, height: 480 });
  await page.goto(VDO_URL, { waitUntil: 'networkidle2' });

  console.log("Iniciando transmisión RTMPS hacia Starvios...");
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'x11grab',
    '-s', '854x480',
    '-r', '30',
    '-i', ':99',
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-b:v', '1200k',
    '-maxrate', '1200k',
    '-bufsize', '2400k',
    '-pix_fmt', 'yuv420p',
    '-g', '60',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-f', 'flv',
    RTMP_URL
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data}`);
  });
})();
