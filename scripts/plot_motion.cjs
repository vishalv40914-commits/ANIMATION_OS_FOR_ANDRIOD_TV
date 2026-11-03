const { execSync } = require('child_process');
const fs = require('fs');

// Convert video to 10fps grayscale raw data of size 85x48 (downscaled)
const bwdVideo = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793190729052_4feb4074.mp4';
const rawPath = 'C:\\ui for tv\\scratch\\bwd_motion.raw';

const w = 85;
const h = 48;
execSync(`ffmpeg -y -i "${bwdVideo}" -vf "fps=10,scale=${w}:${h},format=gray" -f rawvideo "${rawPath}"`, { stdio: 'pipe' });

const buffer = fs.readFileSync(rawPath);
const frameSize = w * h;
const numFrames = Math.floor(buffer.length / frameSize);

console.log(`Analyzing ${numFrames} frames...`);
const scores = [];

for (let i = 1; i < numFrames; i++) {
  const prevOffset = (i - 1) * frameSize;
  const currOffset = i * frameSize;
  let diffSum = 0;
  for (let p = 0; p < frameSize; p++) {
    diffSum += Math.abs(buffer[currOffset + p] - buffer[prevOffset + p]);
  }
  const avgDiff = diffSum / frameSize;
  const t = (i * 0.1).toFixed(1);
  scores.push({ frame: i, time: parseFloat(t), avgDiff });
}

// Print timeline
console.log('--- Motion Timeline ---');
for (const s of scores) {
  const bar = '#'.repeat(Math.min(50, Math.round(s.avgDiff * 4)));
  console.log(`${s.time.toFixed(1)}s (f${s.frame}): diff=${s.avgDiff.toFixed(2)} | ${bar}`);
}

