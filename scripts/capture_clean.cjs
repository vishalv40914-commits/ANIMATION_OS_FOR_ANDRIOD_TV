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
      if (Array.isArray(res)) {
        // Find the actual localhost page target, NOT the chrome extension
        const target = res.find(t => t.type === 'page' && t.url.includes('localhost'));
        if (target && target.webSocketDebuggerUrl) {
          return target.webSocketDebuggerUrl;
        }
      }
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Could not find localhost page target');
}

async function capture() {
  const port = 9335;
  const tempDir = 'C:\\ui for tv\\scratch\\chrome_dbg_clean';
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
    console.log('Connected to Localhost Page WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const timeout = setTimeout(() => {
          ws.removeEventListener('message', handler);
          reject(new Error(`Timeout waiting for ${method}`));
        }, 10000);

        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
            clearTimeout(timeout);
            ws.removeEventListener('message', handler);
            if (res.error) reject(new Error(res.error.message));
            else resolve(res.result);
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

    // Wait for images and videos to load
    console.log('Waiting for media and video to settle...');
    await send('Runtime.evaluate', {
      expression: `
        new Promise((resolve) => {
          const img = document.querySelector('img');
          const video = document.querySelector('video');
          if (img && !img.complete) {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          } else {
            setTimeout(resolve, 1500);
          }
        })
      `,
      awaitPromise: true
    });

    await new Promise(r => setTimeout(r, 1500));

    console.log('Capturing verified screenshot...');
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = 'C:\\ui for tv\\scratch\\launcher_verified.png';
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot to ${outPath} (${(res.data.length / 1024).toFixed(1)} KB)`);

    ws.close();
  } finally {
    try { chrome.kill(); } catch {}
  }
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});

