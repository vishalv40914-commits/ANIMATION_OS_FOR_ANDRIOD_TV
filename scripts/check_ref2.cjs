const fs = require('fs');
const { execSync } = require('child_process');

const imgPath2 = 'C:\\Users\\Sathirish\\.gemini\\antigravity\\brain\\9b1d6455-2b7b-4e8d-a569-b4513dc091e4\\.user_uploaded\\media_1793209310275_2c55901a.jpg';
const outDir = 'C:\\ui for tv\\scratch\\card_slots_ref2';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Image 2 is 1024x592 (16 pixels taller, probably has slight padding/safe area)
// Let's crop center card:
execSync(`ffmpeg -y -i "${imgPath2}" -vf "crop=160:110:428:256" "${outDir}\\center.png"`, { stdio: 'pipe' });
console.log('Saved center card of ref2');

