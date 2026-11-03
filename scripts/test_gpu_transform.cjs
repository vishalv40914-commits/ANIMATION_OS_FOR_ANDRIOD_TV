const anchors = [
  { rel: -3, x: 0.086, y: 0.519, rotY: 20 },
  { rel: -2, x: 0.206, y: 0.531, rotY: 12 },
  { rel: -1, x: 0.338, y: 0.540, rotY: 6 },
  { rel:  0, x: 0.494, y: 0.524, rotY: 0 },
  { rel:  1, x: 0.650, y: 0.540, rotY: -6 },
  { rel:  2, x: 0.785, y: 0.531, rotY: -12 },
  { rel:  3, x: 0.911, y: 0.519, rotY: -20 }
];

const centerX = 0.494; // 49.4%
const centerY = 0.524; // 52.4%
const cardW = 0.145;   // 14.5%
const cardH = 0.185;   // 18.5%

const radius = 0.78;
const angleStep = 10.8 * Math.PI / 180;

console.log('Testing Pure GPU Transform Translation Mathematics:');
anchors.forEach(a => {
  const rel = a.rel;
  const angle = rel * angleStep;
  const absAngle = Math.abs(angle);

  // 1. Target Normalized Coordinates from 3D Model:
  const normX = centerX + Math.sin(angle) * radius;
  const bow = 0.13 * absAngle - 0.25 * Math.pow(absAngle, 2);
  const normY = centerY + bow;

  // 2. Offsets from Center Anchor (49.4%, 52.4%):
  const deltaX = normX - centerX;
  const deltaY = normY - centerY;

  // 3. Percentage of Card Width / Height:
  const txPercent = (deltaX / cardW) * 100;
  const tyPercent = (deltaY / cardH) * 100;

  // 4. Resulting final position on screen (relative to parent width):
  const finalX = centerX + (txPercent / 100) * cardW;
  const finalY = centerY + (tyPercent / 100) * cardH;

  console.log(`Rel ${rel >= 0 ? '+' : ''}${rel}: ` +
    `tx = ${txPercent.toFixed(1)}%, ty = ${tyPercent.toFixed(1)}% | ` +
    `Final Screen X = ${(finalX * 100).toFixed(1)}% (meas: ${(a.x * 100).toFixed(1)}%), ` +
    `Final Screen Y = ${(finalY * 100).toFixed(1)}% (meas: ${(a.y * 100).toFixed(1)}%)`
  );
});
