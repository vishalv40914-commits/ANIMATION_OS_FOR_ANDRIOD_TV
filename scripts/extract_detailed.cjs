const { execSync } = require('child_process');
const fs = require('fs');

const bwdVideo = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793190729052_4feb4074.mp4';
const outDir = 'C:\\ui for tv\\scratch\\bwd_detailed';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Extract 10 frames per second (every 0.1s)
console.log('Extracting frames at 10 fps...');
execSync(`ffmpeg -y -i "${bwdVideo}" -vf "fps=10" "${outDir}/f_%03d.jpg"`, { stdio: 'pipe' });

const files = fs.readdirSync(outDir).filter(f => f.startsWith('f_') && f.endsWith('.jpg')).sort();
console.log(`Extracted ${files.length} frames.`);

// Let's print timestamps of key frames
for (let i = 0; i < files.length; i += 5) {
  const t = (i * 0.1).toFixed(1);
  console.log(`Index ${i} -> Frame ${files[i]} -> Time ${t}s`);
}

