// Test relativeIndex calculation and wrap-around transitions
const apps = ['YouTube', 'Netflix', 'Prime', 'MyApps', 'Music', 'Games', 'Settings'];
const wrapAround = true;

function getRelativeIndex(appIndex, selectedIndex, length) {
  let rel = appIndex - selectedIndex;
  if (wrapAround && length > 0) {
    const half = length / 2;
    while (rel > half) rel -= length;
    while (rel < -half) rel += length;
  }
  return rel;
}

console.log('--- Step 0: selectedIndex = 3 (MyApps) ---');
let prevRel = apps.map((app, i) => getRelativeIndex(i, 3, apps.length));
apps.forEach((app, i) => {
  console.log(`${app}: rel = ${prevRel[i]}`);
});

console.log('\n--- Step 1: Navigating RIGHT -> selectedIndex = 4 (Music) ---');
let newRel = apps.map((app, i) => getRelativeIndex(i, 4, apps.length));
apps.forEach((app, i) => {
  const jump = Math.abs(newRel[i] - prevRel[i]);
  const isWrapJump = jump > 2;
  console.log(`${app}: ${prevRel[i]} -> ${newRel[i]} (diff: ${newRel[i] - prevRel[i]})${isWrapJump ? ' [TELEPORT OFFSCREEN - NO TRANSITION]' : ' [SMOOTH 3D SLIDE]'}`);
});

console.log('\n--- Step 2: Navigating LEFT -> selectedIndex = 2 (Prime) ---');
let leftRel = apps.map((app, i) => getRelativeIndex(i, 2, apps.length));
apps.forEach((app, i) => {
  const jump = Math.abs(leftRel[i] - prevRel[i]);
  const isWrapJump = jump > 2;
  console.log(`${app}: ${prevRel[i]} -> ${leftRel[i]} (diff: ${leftRel[i] - prevRel[i]})${isWrapJump ? ' [TELEPORT OFFSCREEN - NO TRANSITION]' : ' [SMOOTH 3D SLIDE]'}`);
});
