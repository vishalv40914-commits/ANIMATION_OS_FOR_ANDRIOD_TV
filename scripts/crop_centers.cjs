const { execSync } = require('child_process');

const outDir = 'C:\\ui for tv\\scratch\\compare_rest';
// In 1920x1080:
// Center is x: ~950 (49.5% of 1920 is 950), y: ~566 (52.4% of 1080 is 566)
// Box: w: 290, h: 202, x: 805, y: 465
execSync(`ffmpeg -y -i "${outDir}\\fwd_rest.jpg" -vf "crop=320:220:800:455" "${outDir}\\fwd_center.jpg"`, { stdio: 'pipe' });
execSync(`ffmpeg -y -i "${outDir}\\bwd_rest.jpg" -vf "crop=320:220:800:455" "${outDir}\\bwd_center.jpg"`, { stdio: 'pipe' });
console.log('Cropped center cards.');

