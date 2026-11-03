const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

async function testNavigation() {
  const port = 9336;
  const tempDir = path.join(os.tmpdir(), 'chrome_nav_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

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
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === id) {
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

    // Wait for initial load
    await new Promise(r => setTimeout(r, 2500));

    // Press ArrowRight 3 times to navigate: YouTube -> Netflix -> Prime Video -> My Apps
    for (let step = 1; step <= 3; step++) {
      console.log(`Sending ArrowRight step ${step}...`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await new Promise(r => setTimeout(r, 1200)); // wait for video step
    }

    // Now send ArrowLeft once to test backward video transition!
    console.log('Testing ArrowLeft (Backward Video Navigation)...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await new Promise(r => setTimeout(r, 1500)); // wait for backward sweep

    // Now send ArrowRight once to return to My Apps
    console.log('Returning to My Apps (ArrowRight)...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await new Promise(r => setTimeout(r, 1500));

    console.log('Capturing screenshot of My Apps focused...');
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = 'C:\\ui for tv\\scratch\\myapps_focused_1080p.png';
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot to ${outPath} (${(res.data.length / 1024).toFixed(1)} KB)`);

    ws.close();
  } finally {
    try { chrome.kill(); } catch {}
  }
}

testNavigation().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
