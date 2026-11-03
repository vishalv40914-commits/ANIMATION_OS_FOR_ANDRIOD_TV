const { execSync } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('scratch/wa_fine2')) {
  fs.mkdirSync('scratch/wa_fine2', { recursive: true });
}

// Extract every frame from 3.0s to 7.0s at 10 fps
execSync('ffmpeg -y -ss 3.0 -i "public/video/backward-navigation.mp4" -t 4.0 -vf "fps=10,scale=424:240" "scratch/wa_fine2/f_%03d.png"');

const files = fs.readdirSync('scratch/wa_fine2').filter(f => f.endsWith('.png')).sort();
console.log(`Extracted ${files.length} frames for 3.0s to 7.0s`);

for (let i = 0; i < files.length - 1; i++) {
  const f1 = `scratch/wa_fine2/${files[i]}`;
  const f2 = `scratch/wa_fine2/${files[i+1]}`;
  let score = 0;
  try {
    execSync(`magick compare -metric RMSE ${f1} ${f2} null: 2> scratch/diff_fine2.txt`);
  } catch (e) {
    const txt = fs.readFileSync('scratch/diff_fine2.txt', 'utf8');
    const m = txt.match(/\(([0-9.]+)\)/);
    if (m) score = parseFloat(m[1]);
  }
  const time = (3.0 + i * 0.1).toFixed(2);
  console.log(`t=${time}s: motion=${score.toFixed(4)}`);
}

