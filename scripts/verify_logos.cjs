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

async function verifyLogos() {
  const port = 9339;
  const tempDir = path.join(os.tmpdir(), 'chrome_logos_' + Date.now());
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
    console.log('Waiting for initial render...');
    await new Promise(r => setTimeout(r, 3000));

    // Capture main launcher with real logos
    console.log('Capturing real_logos_launcher.png...');
    let snap = await send('Page.captureScreenshot', { format: 'png' });
    const outInitial = 'C:\\ui for tv\\scratch\\real_logos_launcher.png';
    fs.writeFileSync(outInitial, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outInitial} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    // Dispatch ArrowRight twice to see YouTube, Netflix, Prime Video, Spotify in action
    console.log('Dispatching ArrowRight...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await new Promise(r => setTimeout(r, 1200));

    console.log('Capturing real_logos_step1.png...');
    snap = await send('Page.captureScreenshot', { format: 'png' });
    const outStep1 = 'C:\\ui for tv\\scratch\\real_logos_step1.png';
    fs.writeFileSync(outStep1, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outStep1} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    // Open App Manager dialog to verify management UI
    console.log('Opening Manage Apps modal...');
    await send('Runtime.evaluate', {
      expression: `
        // Click the Manage Apps button
        const buttons = Array.from(document.querySelectorAll('button'));
        const manageBtn = buttons.find(b => b.textContent && b.textContent.includes('Manage Apps'));
        if (manageBtn) manageBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('Capturing manage_apps_modal.png...');
    snap = await send('Page.captureScreenshot', { format: 'png' });
    const outModal = 'C:\\ui for tv\\scratch\\manage_apps_modal.png';
    fs.writeFileSync(outModal, Buffer.from(snap.data, 'base64'));
    console.log(`Saved ${outModal} (${(snap.data.length / 1024).toFixed(1)} KB)`);

    ws.close();
    console.log('Verification completed successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

verifyLogos().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});

