const { execSync } = require('child_process');
const fs = require('fs');

// Convert 1024x576 image to raw RGB24
const imgPath = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793209310270_d294542d.jpg';
const rawPath = 'C:\\ui for tv\\scratch\\ref_rgb.raw';
const w = 1024;
const h = 576;

execSync(`ffmpeg -y -i "${imgPath}" -f rawvideo -pix_fmt rgb24 "${rawPath}"`, { stdio: 'pipe' });
const buf = fs.readFileSync(rawPath);

console.log('Detecting cards in the band y = 230 to 380...');

// Let's find vertical lines or card boundary peaks
// In each vertical column x from 0 to 1023, let's find high cyan (B > 180, G > 160, B > R + 50)
// or high gold (R > 180, G > 140, B < 100)
const cyanCols = new Array(w).fill(0);
const goldCols = new Array(w).fill(0);

for (let y = 240; y < 380; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 3;
    const r = buf[idx];
    const g = buf[idx + 1];
    const b = buf[idx + 2];

    // Cyan border detection
    if (b > 180 && g > 150 && b > r + 40) {
      cyanCols[x]++;
    }
    // Gold border detection (center card)
    if (r > 190 && g > 130 && b < 100) {
      goldCols[x]++;
    }
  }
}

// Print columns with peaks
const peaks = [];
for (let x = 0; x < w; x++) {
  const total = cyanCols[x] + goldCols[x];
  if (total > 15) {
    peaks.push({ x, count: total, isGold: goldCols[x] > 10 });
  }
}

// Group contiguous peaks into vertical edges
const edges = [];
let currentGroup = [];
for (const p of peaks) {
  if (currentGroup.length === 0 || p.x === currentGroup[currentGroup.length - 1].x + 1) {
    currentGroup.push(p);
  } else {
    const midX = Math.round(currentGroup.reduce((sum, item) => sum + item.x, 0) / currentGroup.length);
    const maxCount = Math.max(...currentGroup.map(item => item.count));
    const isGold = currentGroup.some(item => item.isGold);
    edges.push({ midX, maxCount, isGold });
    currentGroup = [p];
  }
}
if (currentGroup.length > 0) {
  const midX = Math.round(currentGroup.reduce((sum, item) => sum + item.x, 0) / currentGroup.length);
  const maxCount = Math.max(...currentGroup.map(item => item.count));
  const isGold = currentGroup.some(item => item.isGold);
  edges.push({ midX, maxCount, isGold });
}

console.log('Detected vertical edges (x in 1024):');
edges.forEach(e => console.log(`  x = ${e.midX} (strength: ${e.maxCount}, gold: ${e.isGold})`));

