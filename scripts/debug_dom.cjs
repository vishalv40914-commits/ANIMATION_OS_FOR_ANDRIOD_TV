const { spawn } = require('child_process');
const http = require('http');

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

async function debugDom() {
  const port = 9334;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\ui for tv\\scratch\\chrome_dbg_dom',
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

    await new Promise(r => setTimeout(r, 2500));

    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            href: window.location.href,
            title: document.title,
            bodyHtmlSnippet: document.body.innerHTML.slice(0, 500)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Location & HTML:', JSON.stringify(evalResult.result.value, null, 2));
    ws.close();
  } finally {
    try { chrome.kill(); } catch {}
  }
}

debugDom().catch(console.error);
