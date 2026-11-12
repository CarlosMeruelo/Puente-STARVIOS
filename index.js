const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

const VDO_URL = process.env.VDO_URL;
const RTMP_URL = process.env.RTMP_URL;

if (!VDO_URL || !RTMP_URL) {
  console.error("Faltan las variables VDO_URL o RTMP_URL");
  process.exit(1);
}

(async () => {
  console.log("Iniciando pantalla virtual...");
  spawn('Xvfb', [':99', '-screen', '0', '1280x720x24']);
  process.env.DISPLAY = ':99';

  await new Promise(r => setTimeout(r, 2000));

  console.log("Abriendo VDO.Ninja en el servidor...");
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1280,720',
      '--start-fullscreen'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(VDO_URL, { waitUntil: 'networkidle2' });

  console.log("Iniciando transmisión RTMP hacia Starvios...");
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'x11grab',
    '-s', '1280x720',
    '-r', '30',
    '-i', ':99',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', '2500k',
    '-maxrate', '2500k',
    '-bufsize', '5000k',
    '-pix_fmt', 'yuv420p',
    '-g', '60',
    '-f', 'flv',
    RTMP_URL
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data}`);
  });
})();
