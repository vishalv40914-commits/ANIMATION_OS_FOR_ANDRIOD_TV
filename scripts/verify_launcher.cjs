const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== MI TV CINEMATIC LAUNCHER VERIFICATION SUITE ===\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedTests++;
  }
}

// 1. Check required files existence
console.log('--- 1. File Structure Verification ---');
const requiredFiles = [
  'src/App.tsx',
  'src/components/CinematicBackground.tsx',
  'src/components/AppCarousel.tsx',
  'src/components/HomeScreen.tsx',
  'src/components/AppManager.tsx',
  'src/hooks/useVideoScrubbing.ts',
  'src/hooks/useTVRemote.ts',
  'src/hooks/useAppStorage.ts',
  'src/data/defaultApps.ts',
  'src/types/app.ts',
  'src/config/timeline.json',
  'src/config/cardtrack.json',
  'src/config/videoScrubbing.ts',
  'src/index.css',
  'public/video/app-navigation.mp4',
  'public/video/backward-navigation.mp4',
  'public/video/main_intra.mp4',
  'public/video/backward_intra_1080p.mp4',
  'public/images/launcher-background.png'
];

requiredFiles.forEach(f => {
  const exists = fs.existsSync(path.join(__dirname, '..', f));
  assert(exists, `Required file exists: ${f}`);
});

// 2. Verify Video Properties with ffprobe
console.log('\n--- 2. Video Encoding & Derivative Verification ---');
try {
  // OLD VIDEO (Forward)
  const probeMain = JSON.parse(
    execSync('ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,nb_frames -of json "public/video/main_intra.mp4"')
  );
  const streamMain = probeMain.streams[0];
  assert(streamMain.width === 1920 && streamMain.height === 1080, `main_intra.mp4 (OLD VIDEO forward) resolution is 1920x1080`);
  assert(streamMain.r_frame_rate === '24/1', `main_intra.mp4 frame rate is 24 fps`);
  assert(parseInt(streamMain.nb_frames) === 240, `main_intra.mp4 has 240 frames`);

  const statMain = fs.statSync('public/video/main_intra.mp4');
  const sizeMbMain = statMain.size / (1024 * 1024);
  assert(sizeMbMain < 60, `main_intra.mp4 size is ${sizeMbMain.toFixed(2)} MB (< 60 MB limit)`);

  // NEW VIDEO (Backward)
  const probeBwd = JSON.parse(
    execSync('ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,nb_frames -of json "public/video/backward_smooth.mp4"')
  );
  const streamBwd = probeBwd.streams[0];
  assert(streamBwd.width === 848 && streamBwd.height === 478, `backward_smooth.mp4 (NEW VIDEO backward) has valid 16:9 resolution`);
  assert(streamBwd.r_frame_rate === '60/1', `backward_smooth.mp4 frame rate is 60 fps`);
  assert(parseInt(streamBwd.nb_frames) === 600, `backward_smooth.mp4 has 600 frames`);

  const statBwd = fs.statSync('public/video/backward_smooth.mp4');
  const sizeMbBwd = statBwd.size / (1024 * 1024);
  assert(sizeMbBwd < 60, `backward_smooth.mp4 size is ${sizeMbBwd.toFixed(2)} MB (< 60 MB limit)`);
} catch (err) {
  console.error('[FAIL] Video probing error:', err);
  failedTests++;
}

// 3. Verify Timeline Config
console.log('\n--- 3. Timeline & Rest Frames Verification ---');
const timeline = JSON.parse(fs.readFileSync('src/config/timeline.json', 'utf8'));
assert(timeline.frameRate === 24, 'Timeline frameRate is 24');
assert(timeline.totalFrames === 240, 'Timeline totalFrames is 240');
assert(timeline.touchHitWindow === 0.04, 'Timeline touchHitWindow is 0.04s (1 frame at 24fps)');

// Forward rest states
const s0 = timeline.forward.restStates.find(s => s.id === 'S0');
const s1 = timeline.forward.restStates.find(s => s.id === 'S1');
const s2 = timeline.forward.restStates.find(s => s.id === 'S2');
const s3 = timeline.forward.restStates.find(s => s.id === 'S3');

assert(s0 && s0.restFrame === 33, 'Forward S0 rest frame is 33');
assert(s1 && s1.restFrame === 65, 'Forward S1 rest frame is 65');
assert(s2 && s2.restFrame === 109, 'Forward S2 rest frame is 109');
assert(s3 && s3.restFrame === 157, 'Forward S3 rest frame is 157');

// Backward rest states
const bw0 = timeline.backward.restStates.find(s => s.id === 'BW_S0');
const bw1 = timeline.backward.restStates.find(s => s.id === 'BW_S1');
const bw2 = timeline.backward.restStates.find(s => s.id === 'BW_S2');
const bw3 = timeline.backward.restStates.find(s => s.id === 'BW_S3');

assert(bw0 && bw0.restTime === 1.150, 'Backward S0 rest time is 1.150s');
assert(bw1 && bw1.restTime === 4.200, 'Backward S1 rest time is 4.200s');
assert(bw2 && bw2.restTime === 6.200, 'Backward S2 rest time is 6.200s');
assert(bw3 && bw3.restTime === 6.200, 'Backward S3 rest time is 6.200s');

assert(timeline.forward.touchClips.TOUCH_A.hitFrame === 34, 'TOUCH_A hitFrame is 34');
assert(timeline.forward.touchClips.TOUCH_B.hitFrame === 117, 'TOUCH_B hitFrame is 117');
assert(timeline.forward.touchClips.TOUCH_A.returnRestFrame === 33, 'TOUCH_A returns to frame 33 (S0)');
assert(timeline.forward.touchClips.TOUCH_B.returnRestFrame === 109, 'TOUCH_B returns to frame 109 (S2)');

// 4. Test Navigation Mapping & Cycling Simulation
console.log('\n--- 4. Navigation Flow Simulation ---');
// RIGHT x 3 (Forward with OLD VIDEO)
let currentApp = 0;
for (let step = 1; step <= 3; step++) {
  currentApp++;
  const restIdx = currentApp <= 3 ? currentApp : 1 + ((currentApp - 4) % 3);
  const fwdState = timeline.forward.restStates[restIdx];
  assert(
    (step === 1 && fwdState.restFrame === 65) ||
    (step === 2 && fwdState.restFrame === 109) ||
    (step === 3 && fwdState.restFrame === 157),
    `RIGHT step ${step}: Forward transition to App ${currentApp + 1}, rest frame ${fwdState.restFrame}`
  );
}

// LEFT x 3 (Backward with NEW VIDEO)
for (let step = 1; step <= 3; step++) {
  currentApp--;
  const restIdx = currentApp <= 3 ? currentApp : 1 + ((currentApp - 4) % 3);
  const bwdState = timeline.backward.restStates[restIdx];
  assert(
    (step === 1 && bwdState.restTime === 6.200) ||
    (step === 2 && bwdState.restTime === 4.200) ||
    (step === 3 && bwdState.restTime === 1.150),
    `LEFT step ${step}: Backward transition to App ${currentApp + 1}, rest time ${bwdState.restTime}s in NEW VIDEO`
  );
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
}
