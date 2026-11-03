const { execSync } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('scratch/wa_montage')) {
  fs.mkdirSync('scratch/wa_montage', { recursive: true });
}

execSync('ffmpeg -y -i "public/video/backward-navigation.mp4" -vf "fps=2,scale=320:180" "scratch/wa_montage/m_%03d.png"');

const files = fs.readdirSync('scratch/wa_montage').filter(f => f.endsWith('.png')).sort();
console.log(`Total 2fps frames: ${files.length}`);

// Compare each frame with the previous one to find where actual motion happens
for (let i = 0; i < files.length - 1; i++) {
  const f1 = `scratch/wa_montage/${files[i]}`;
  const f2 = `scratch/wa_montage/${files[i+1]}`;
  let score = 0;
  try {
    execSync(`magick compare -metric RMSE ${f1} ${f2} null: 2> scratch/diff_tmp.txt`);
  } catch (e) {
    const txt = fs.readFileSync('scratch/diff_tmp.txt', 'utf8');
    const m = txt.match(/\(([0-9.]+)\)/);
    if (m) score = parseFloat(m[1]);
  }
  const time = (i * 0.5).toFixed(1);
  console.log(`Time ${time}s (frame ${i+1}): motion score = ${score.toFixed(4)}`);
}

