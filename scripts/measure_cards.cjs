const fs = require('fs');
const { execSync } = require('child_process');

// In 1024x576 image:
// Center is x=512, y=288
// Look at the 7 cards in the reference image:
// Slot 0: ~ x: 38..138 (w~100)
// Slot 1: ~ x: 157..263 (w~106)
// Slot 2: ~ x: 285..408 (w~123)
// Slot 3 (Center): ~ x: 431..583 (w~152) -> Center is ~ x: 507
// Slot 4: ~ x: 603..728 (w~125)
// Slot 5: ~ x: 751..862 (w~111)
// Slot 6: ~ x: 884..982 (w~98)

console.log('Measuring exact card boxes in 1024x576 reference image...');

// Let's crop each card and save to scratch/card_slots/
const outDir = 'C:\\ui for tv\\scratch\\card_slots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const slots = [
  { id: 'slot-0', name: 'Netflix', x: 35, y: 246, w: 105, h: 104 },
  { id: 'slot-1', name: 'Prime Video', x: 155, y: 254, w: 110, h: 104 },
  { id: 'slot-2', name: 'YouTube', x: 282, y: 258, w: 125, h: 106 },
  { id: 'slot-3', name: 'My Apps (Center)', x: 428, y: 248, w: 156, h: 108 },
  { id: 'slot-4', name: 'Music', x: 602, y: 258, w: 126, h: 106 },
  { id: 'slot-5', name: 'Games', x: 748, y: 254, w: 112, h: 104 },
  { id: 'slot-6', name: 'Settings', x: 880, y: 246, w: 105, h: 104 },
];

const imgPath = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793209310270_d294542d.jpg';

for (const s of slots) {
  const outPath = `${outDir}\\${s.id}.png`;
  execSync(`ffmpeg -y -i "${imgPath}" -vf "crop=${s.w}:${s.h}:${s.x}:${s.y}" "${outPath}"`, { stdio: 'pipe' });
  console.log(`Saved ${s.id} (${s.name})`);
}

