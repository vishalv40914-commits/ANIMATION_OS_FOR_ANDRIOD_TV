const { execSync } = require('child_process');
const fs = require('fs');

console.log('Analyzing WhatsApp Video (NEW VIDEO)...');

// Extract frames at 10 fps (every 0.1s, 100 frames total)
if (!fs.existsSync('scratch/wa_10fps')) {
  fs.mkdirSync('scratch/wa_10fps', { recursive: true });
  execSync('ffmpeg -y -i "WhatsApp Video 2026-10-28 at 5.50.14 PM.mp4" -vf "fps=10,scale=424:240" "scratch/wa_10fps/f_%03d.png"');
}

const frames = fs.readdirSync('scratch/wa_10fps').filter(f => f.endsWith('.png')).sort();
console.log(`Total extracted frames at 10fps: ${frames.length}`);

// For each frame, analyze the card region (Y: 120-180 in 424x240)
// and hand region to find motion direction
const motionData = [];

for (let i = 0; i < frames.length - 1; i++) {
  const f1 = `scratch/wa_10fps/${frames[i]}`;
  const f2 = `scratch/wa_10fps/${frames[i+1]}`;
  
  // Crop a horizontal band in the middle
  const t = (i * 0.1).toFixed(1);
  
  // Calculate difference
  let diff = '0';
  try {
    execSync(`magick compare -metric RMSE ${f1} ${f2} null: 2> scratch/temp_diff.txt`);
  } catch (e) {
    diff = fs.readFileSync('scratch/temp_diff.txt', 'utf8').trim();
  }
  
  motionData.push({ frameIndex: i, time: parseFloat(t), diff });
}

// Print periods of significant motion (transitions) vs stable periods (holds)
console.log('\n--- Motion Activity in NEW VIDEO ---');
let inMotion = false;
let startMotionTime = 0;

for (let i = 0; i < motionData.length; i++) {
  const m = motionData[i];
  const scoreMatch = m.diff.match(/\(([0-9.]+)\)/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
  
  const isMoving = score > 0.025; // Significant change threshold
  
  if (isMoving && !inMotion) {
    inMotion = true;
    startMotionTime = m.time;
  } else if (!isMoving && inMotion) {
    inMotion = false;
    console.log(`Transition detected: ${startMotionTime.toFixed(2)}s to ${m.time.toFixed(2)}s (duration ${(m.time - startMotionTime).toFixed(2)}s)`);
  }
}
if (inMotion) {
  console.log(`Transition detected: ${startMotionTime.toFixed(2)}s to 10.00s`);
}

