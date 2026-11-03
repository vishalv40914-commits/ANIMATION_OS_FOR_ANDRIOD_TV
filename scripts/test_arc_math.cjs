const anchors = [
  { rel: -3, y: 0.519 },
  { rel: -2, y: 0.531 },
  { rel: -1, y: 0.540 },
  { rel:  0, y: 0.524 },
  { rel:  1, y: 0.540 },
  { rel:  2, y: 0.531 },
  { rel:  3, y: 0.519 }
];

const centerY = 0.524;
const angleStep = 10.8 * Math.PI / 180;

function getY(rel) {
  const angle = rel * angleStep;
  const absAngle = Math.abs(angle);
  // Tuned bow formula
  const yOffset = 0.13 * absAngle - 0.25 * Math.pow(absAngle, 2);
  return centerY + yOffset;
}

console.log('Testing Continuous Vertical Bow Curve:');
anchors.forEach(a => {
  const calcY = getY(a.rel);
  const diff = (calcY - a.y) * 100;
  console.log(`Rel ${a.rel >= 0 ? '+' : ''}${a.rel}: measY=${(a.y*100).toFixed(1)}%, calcY=${(calcY*100).toFixed(1)}% (diff: ${diff.toFixed(2)}%)`);
});
