const fs = require('fs');
const path = require('path');

// Baseline slot geometry in 1920x1080 percentages
// Center card (Slot 0) is at x = 50%, y = 62%
// Spacing between cards: approx 17.5% screen width
// Card dimensions: width = 14.5% (approx 278px), height = 18.5% (approx 200px)

const BASELINE_SLOTS = {
  slotSpacing: 17.5, // % of screen width between adjacent card centers
  centerY: 62.5,     // % of screen height for center card
  centerWidth: 14.5, // % of screen width
  centerHeight: 18.5,// % of screen height
  centerScale: 1.05,
  inactiveScale: 0.88,
  farScale: 0.75,
  inactiveOpacity: 0.65,
  farOpacity: 0.35
};

// Smooth easing function for transitions
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function generateCardTrack() {
  const frames = [];

  for (let f = 0; f < 240; f++) {
    let rowShift = 0.0;
    let touchGlow = 0.0;
    let overlayOpacity = 1.0;
    let stateName = 'HOLD S0';

    // Segment determination based on timeline.json
    if (f < 34) {
      // HOLD S0 (0 - 33)
      rowShift = 0.0;
      stateName = 'HOLD_S0';
    } else if (f >= 34 && f <= 42) {
      // TOUCH A (34 - 42): Hand glows under center card (Hit frame 34)
      rowShift = 0.0;
      stateName = 'TOUCH_A';
      // Initial glow burst on hit frame 34, peaking around 38, settling at 42
      const p = (f - 33) / (42 - 33 + 1);
      touchGlow = 0.35 + 0.65 * Math.sin(p * Math.PI);
    } else if (f > 42 && f < 46) {
      // Post-touch settle before slide
      rowShift = 0.0;
      stateName = 'HOLD_S0_POST_TOUCH';
    } else if (f >= 46 && f <= 65) {
      // STEP 1 (46 - 65): cards slide 1 slot left (0.0 to -1.0)
      const t = (f - 46) / (65 - 46);
      rowShift = -1.0 * easeInOutCubic(t);
      stateName = 'STEP_1';
    } else if (f > 65 && f < 93) {
      // HOLD S1 (65 - 93)
      rowShift = -1.0;
      stateName = 'HOLD_S1';
    } else if (f >= 93 && f <= 109) {
      // STEP 2 (93 - 109): cards slide another slot left (-1.0 to -2.0)
      const t = (f - 93) / (109 - 93);
      rowShift = -1.0 - 1.0 * easeInOutCubic(t);
      stateName = 'STEP_2';
    } else if (f > 109 && f < 117) {
      // HOLD S2 (109 - 117)
      rowShift = -2.0;
      stateName = 'HOLD_S2';
    } else if (f >= 117 && f <= 131) {
      // TOUCH B (117 - 131): Hand enters center card, bright cyan fill (Hit frame 117)
      rowShift = -2.0;
      stateName = 'TOUCH_B';
      const p = (f - 116) / (131 - 116 + 1);
      touchGlow = 0.45 + 0.55 * Math.sin(p * Math.PI);
    } else if (f > 131 && f < 141) {
      // Post-touch settle before STEP 3
      rowShift = -2.0;
      stateName = 'HOLD_S2_POST_TOUCH';
    } else if (f >= 141 && f <= 157) {
      // STEP 3 (141 - 157): cards slide another slot left (-2.0 to -3.0)
      const t = (f - 141) / (157 - 141);
      rowShift = -2.0 - 1.0 * easeInOutCubic(t);
      stateName = 'STEP_3';
    } else if (f > 157 && f < 215) {
      // HOLD S3 (157 - 215): Long stable hold
      rowShift = -3.0;
      stateName = 'HOLD_S3';
    } else if (f >= 215 && f <= 228) {
      // EXIT (215 - 228): cards slide and fade out
      const t = (f - 215) / (228 - 215);
      rowShift = -3.0 - 0.8 * t;
      overlayOpacity = clamp(1.0 - t, 0, 1);
      stateName = 'EXIT';
    } else {
      // END POSE (228 - 240): No cards
      rowShift = -3.8;
      overlayOpacity = 0.0;
      stateName = 'END_POSE';
    }

    // Compute slot positions relative to the current physical slot 0
    // Each app index n sits at nominal slot n.
    // The visual X position of app n is: 50% + (n + rowShift) * slotSpacing
    frames.push({
      frame: f,
      time: parseFloat(((f + 0.5) / 24).toFixed(4)),
      stateName,
      rowShift: parseFloat(rowShift.toFixed(4)),
      touchGlow: parseFloat(touchGlow.toFixed(3)),
      overlayOpacity: parseFloat(overlayOpacity.toFixed(3))
    });
  }

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalFrames: 240,
      frameRate: 24,
      baseline: BASELINE_SLOTS
    },
    frames
  };

  const outputPath = path.join(__dirname, '..', 'src', 'config', 'cardtrack.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Successfully generated cardtrack.json at ${outputPath}`);
}

generateCardTrack();
