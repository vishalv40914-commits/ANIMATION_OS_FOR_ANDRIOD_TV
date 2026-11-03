const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run ffmpeg scene detection / crop to hand/cards region
// Character hand is roughly at (x: 250..600, y: 350..550 in 1920x1080, or in 848x478 at x: 200..450, y: 180..380)
const bwdVideo = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793190729052_4feb4074.mp4';

console.log('Extracting frames every 0.25s...');
const outDir = 'C:\\ui for tv\\scratch\\bwd_analysis';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

try {
  execSync(`ffmpeg -y -i "${bwdVideo}" -vf "fps=4" "${outDir}/frame_%03d.jpg"`, { stdio: 'pipe' });
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg')).sort();
  console.log(`Extracted ${files.length} frames.`);
  for (let i = 0; i < files.length; i += 4) {
    const timeSec = (i * 0.25).toFixed(2);
    console.log(`Frame ${i}: ${files[i]} at ${timeSec}s`);
  }
} catch (e) {
  console.error(e.message);
}

