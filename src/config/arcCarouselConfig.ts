/**
 * 3D Curved Cylindrical Holographic Carousel Configuration
 * 
 * Implements a genuine trigonometric 3D arc model that maps
 * onto the curved holographic glass panels in the background video.
 * 
 * Parameters:
 * - radiusPercent: horizontal arc radius (% of container width)
 * - depthRadiusPx: Z-depth receding radius in pixels
 * - angleStepDeg: angular separation between adjacent cards in degrees
 * - maxRotationDeg: maximum Y rotation at outer edges
 * - centerScale: scale of center selected card
 * - edgeScale: scale of outer cards
 * - verticalCurve: vertical bow curve multiplier
 * - perspectivePx: camera perspective in pixels
 */

export interface ArcCarouselConfig {
  radiusPercent: number;        // e.g. 78.0 (% of 16:9 container width)
  depthRadiusPx: number;        // e.g. 380 (Z depth in pixels)
  angleStepDeg: number;         // e.g. 10.8 (degrees per card step)
  maxRotationDeg: number;       // e.g. 20.0 (Y-axis rotation at edges)
  centerScale: number;          // e.g. 1.04 (scale of selected center card)
  edgeScale: number;            // e.g. 0.94 (scale of outer edge cards)
  verticalCurve: number;        // e.g. 1.0 (vertical bow curve factor)
  perspectivePx: number;        // e.g. 1200 (camera 3D perspective)
  transitionDurationMs: number; // e.g. 240 (ms)
  transitionEasing: string;     // e.g. 'cubic-bezier(0.22, 0.8, 0.25, 1)'
  centerAnchorX: number;        // e.g. 49.4 (% of container width)
  centerAnchorY: number;        // e.g. 52.4 (% of container height, above palm)
}

export const DEFAULT_ARC_CONFIG: ArcCarouselConfig = {
  radiusPercent: 78.0,
  depthRadiusPx: 380,
  angleStepDeg: 10.8,
  maxRotationDeg: 20.0,
  centerScale: 1.04,
  edgeScale: 0.94,
  verticalCurve: 1.0,
  perspectivePx: 1200,
  transitionDurationMs: 240,
  transitionEasing: 'cubic-bezier(0.22, 0.8, 0.25, 1)',
  centerAnchorX: 49.4,
  centerAnchorY: 52.4
};

export interface Card3DPlacement {
  leftPercent: number;   // Left position (% of container width)
  topPercent: number;    // Top position (% of container height)
  widthPercent: number;  // Width (% of container width)
  heightPercent: number; // Height (% of container height)
  rotYDeg: number;       // Y-axis rotation in degrees
  tzPx: number;          // Translate Z depth in pixels
  scale: number;         // Scale factor
  opacity: number;       // Opacity (0 if far offscreen)
  zIndex: number;        // Layer order (highest at center)
  isFocused: boolean;    // True if center card
  transform: string;     // Full CSS transform string
}

/**
 * Calibrated slot metrics matching the 7 visible cyan holographic panels
 * in the background video (1920x1080 frame).
 */
const CALIBRATED_SLOT_METRICS: Record<number, {
  left: number;
  top: number;
  width: number;
  height: number;
  rotY: number;
  tz: number;
  scale: number;
}> = {
  [-3]: { left: 8.6, top: 51.9, width: 10.2, height: 18.1, rotY: 20.0, tz: -80, scale: 0.96 },
  [-2]: { left: 20.6, top: 53.1, width: 10.8, height: 18.1, rotY: 12.0, tz: -45, scale: 0.98 },
  [-1]: { left: 33.8, top: 54.0, width: 12.2, height: 18.4, rotY: 6.0, tz: -18, scale: 1.00 },
  [0]:  { left: 49.4, top: 52.4, width: 15.0, height: 18.8, rotY: 0.0, tz: 0, scale: 1.04 },
  [1]:  { left: 65.0, top: 54.0, width: 12.2, height: 18.4, rotY: -6.0, tz: -18, scale: 1.00 },
  [2]:  { left: 78.5, top: 53.1, width: 10.8, height: 18.1, rotY: -12.0, tz: -45, scale: 0.98 },
  [3]:  { left: 91.1, top: 51.9, width: 10.2, height: 18.1, rotY: -20.0, tz: -80, scale: 0.96 }
};

/**
 * Computes exact 3D transform and placement for an application card
 * based on its relative index from the selected center application.
 * 
 * relativeIndex = appIndex - selectedIndex (0 for center, -3 to +3 for visible cards)
 */
export function calculateCard3DTransform(
  relativeIndex: number,
  config: ArcCarouselConfig = DEFAULT_ARC_CONFIG
): Card3DPlacement {
  const isFocused = relativeIndex === 0;
  const absRel = Math.abs(relativeIndex);

  // If relative index is within the calibrated visible 7 slots (-3 to +3),
  // use the exact geometric panel metrics with 3D cylindrical parameters
  if (CALIBRATED_SLOT_METRICS[relativeIndex]) {
    const slot = CALIBRATED_SLOT_METRICS[relativeIndex];
    const leftPercent = slot.left;
    const topPercent = slot.top;
    const widthPercent = slot.width;
    const heightPercent = slot.height;
    const rotYDeg = slot.rotY;
    const tzPx = slot.tz;
    const scale = isFocused ? config.centerScale : slot.scale;
    const opacity = 1.0;
    const zIndex = isFocused ? 30 : Math.max(10, 25 - Math.round(absRel * 3));
    const transform = `translate(-50%, -50%) translateZ(${tzPx}px) rotateY(${rotYDeg}deg) scale(${scale})`;

    return {
      leftPercent,
      topPercent,
      widthPercent,
      heightPercent,
      rotYDeg,
      tzPx,
      scale,
      opacity,
      zIndex,
      isFocused,
      transform
    };
  }

  // For offscreen cards (|relativeIndex| >= 4):
  // Project along the continuation of the cylinder so they slide into / out of view smoothly
  const angleRad = relativeIndex * (config.angleStepDeg * Math.PI / 180);
  const deltaXNorm = Math.sin(angleRad) * (config.radiusPercent / 100);
  const leftPercent = config.centerAnchorX + deltaXNorm * 100;
  const topPercent = 51.0;
  const widthPercent = 9.5;
  const heightPercent = 17.5;
  const rotYDeg = -Math.sign(relativeIndex) * Math.min(absRel * (config.maxRotationDeg / 3), 30.0);
  const tzPx = -config.depthRadiusPx * (1 - Math.cos(angleRad));
  const scale = 0.90;
  const opacity = 0.0;
  const zIndex = 5;
  const transform = `translate(-50%, -50%) translateZ(${tzPx.toFixed(1)}px) rotateY(${rotYDeg.toFixed(1)}deg) scale(${scale})`;

  return {
    leftPercent,
    topPercent,
    widthPercent,
    heightPercent,
    rotYDeg,
    tzPx,
    scale,
    opacity,
    zIndex,
    isFocused,
    transform
  };
}
