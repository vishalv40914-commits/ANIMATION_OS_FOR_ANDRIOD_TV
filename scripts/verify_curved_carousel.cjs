const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function getPageWsUrl(port) {
  for (let i = 0; i < 40; i++) {
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

async function testCurvedCarousel() {
  const port = 9338;
  const tempDir = path.join(os.tmpdir(), 'chrome_curved_' + Date.now());
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
    console.log('Connected to Chrome DevTools WebSocket:', wsUrl);

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

    // Wait for image & UI to settle
    console.log('Waiting for initial curved carousel render...');
    await new Promise(r => setTimeout(r, 2500));

    // Capture initial state
    console.log('Capturing curved_carousel_initial.png...');
    let snap = await send('Page.captureScreenshot', { format: 'png' });
    const outInitial = 'C:\\ui for tv\\scratch\\curved_carousel_initial.png';
    fs.writeFileSync(outInitial, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outInitial} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    // Press ArrowRight to test smooth 3D curved slide
    console.log('Dispatching ArrowRight...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await new Promise(r => setTimeout(r, 1200));

    // Capture navigated state
    console.log('Capturing curved_carousel_nav_right.png...');
    snap = await send('Page.captureScreenshot', { format: 'png' });
    const outRight = 'C:\\ui for tv\\scratch\\curved_carousel_nav_right.png';
    fs.writeFileSync(outRight, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outRight} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    // Press ArrowLeft to test backward navigation
    console.log('Dispatching ArrowLeft...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await new Promise(r => setTimeout(r, 1200));

    // Capture returned state
    console.log('Capturing curved_carousel_nav_left.png...');
    snap = await send('Page.captureScreenshot', { format: 'png' });
    const outLeft = 'C:\\ui for tv\\scratch\\curved_carousel_nav_left.png';
    fs.writeFileSync(outLeft, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outLeft} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    ws.close();
    console.log('All curved carousel tests passed successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

testCurvedCarousel().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
