const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const outFile = path.join('C:\\ui for tv\\scratch', 'live_rendered.png');
const tempProfile = path.join(os.tmpdir(), 'chrome_profile_' + Date.now());

const cmd = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --user-data-dir="${tempProfile}" --window-size=1920,1080 --virtual-time-budget=3000 --screenshot="${outFile}" "http://localhost:5173/"`;

console.log('Running screenshot command...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Done! File exists:', fs.existsSync(outFile), 'Size:', fs.statSync(outFile).size);
} catch (e) {
  console.error('Error running chrome:', e.message);
}

