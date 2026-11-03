const fs = require('fs');
const { execSync } = require('child_process');

// Use ffmpeg to calculate mean absolute difference between adjacent frames
const bwdVideo = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793190729052_4feb4074.mp4';

// ffmpeg filter to output per-frame scene score / difference
const cmd = `ffmpeg -i "${bwdVideo}" -vf "fps=10,tblend=all_mode=difference,blackframe=amount=0:threshold=255" -f null - 2>&1`;
console.log('Running motion analysis at 10 fps (every 0.1s)...');

// Alternatively, let's compare the extracted 40 frames using sharp or a basic ppm diff
// Or simply use ffmpeg select filter with print
const cmd2 = `ffmpeg -i "${bwdVideo}" -vf "fps=10,select='gt(scene,0.005)',showinfo" -f null - 2>&1`;
const output = execSync(cmd2, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

const lines = output.split('\n');
const movements = [];
for (const line of lines) {
  if (line.includes('showinfo') && line.includes('pts_time:')) {
    const match = line.match(/pts_time:([0-9.]+)/);
    if (match) {
      movements.push(parseFloat(match[1]));
    }
  }
}
console.log(`Found ${movements.length} frames with motion > threshold:`);
console.log(movements.map(t => t.toFixed(2)).join(', '));

