const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function getPageWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json/list`, (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (Array.isArray(res) && res.length > 0 && res[0].webSocketDebuggerUrl) {
        return res[0].webSocketDebuggerUrl;
      }
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Could not find page target');
}

async function capture() {
  const port = 9333;
  const tempDir = 'C:\\ui for tv\\scratch\\chrome_dbg_user';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--window-size=1920,1080',
    'http://localhost:5173/'
  ], { detached: true });

  try {
    const wsUrl = await getPageWsUrl(port);
    console.log('Connected directly to Page Target WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Waiting 3.5s for video & React to render...');
    await new Promise(r => setTimeout(r, 3500));

    console.log('Capturing screenshot...');
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = 'C:\\ui for tv\\scratch\\launcher_verified.png';
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot to ${outPath} (${(res.data.length / 1024).toFixed(1)} KB)`);

    ws.close();
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
