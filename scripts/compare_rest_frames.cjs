const { execSync } = require('child_process');
const fs = require('fs');

const fwdVideo = 'C:\\ui for tv\\public\\video\\main_intra.mp4';
const bwdVideo = 'C:\\ui for tv\\public\\video\\backward_intra_1080p.mp4';
const outDir = 'C:\\ui for tv\\scratch\\compare_rest';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

execSync(`ffmpeg -y -ss 00:00:01.375 -i "${fwdVideo}" -vframes 1 "${outDir}\\fwd_rest.jpg"`, { stdio: 'pipe' });
execSync(`ffmpeg -y -ss 00:00:01.150 -i "${bwdVideo}" -vframes 1 "${outDir}\\bwd_rest.jpg"`, { stdio: 'pipe' });

console.log('Extracted resting frames for forward and backward videos.');

