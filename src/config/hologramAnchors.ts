/**
 * Centralized Hologram Anchor Configuration
 * 
 * Normalized coordinates (0.0 to 1.0) measured from reference frames
 * and video source layout (16:9 aspect ratio container).
 * 
 * Slot indexing:
 * Slot 3 is the Center focused slot (offset 0, aligned right above character's hand).
 * Slots 0, 1, 2 are to the left (offsets -3, -2, -1).
 * Slots 4, 5, 6 are to the right (offsets +1, +2, +3).
 */

export interface HologramAnchor {
  slotId: string;
  slotIndex: number;         // 0 to 6
  relativeOffset: number;    // -3 to +3 relative to selected app
  normalizedCenterX: number; // 0.0 to 1.0 relative to 16:9 container width
  normalizedCenterY: number; // 0.0 to 1.0 relative to 16:9 container height
  normalizedWidth: number;   // Width relative to 16:9 container width
  normalizedHeight: number;  // Height relative to 16:9 container height
  rotationY: number;         // Perspective Y rotation in degrees
  rotationZ: number;         // Subtle roll along curved arc
  selectedScaleLimit: number;// Scale when focused (1.03 - 1.06)
  inactiveScale: number;     // Scale when inactive
  sourceAdjustments?: {
    forward?: { offsetX?: number; offsetY?: number };
    backward?: { offsetX?: number; offsetY?: number };
  };
}

export const HOLOGRAM_ANCHORS: HologramAnchor[] = [
  {
    slotId: 'slot-0',
    slotIndex: 0,
    relativeOffset: -3,
    normalizedCenterX: 0.086, // 8.6%
    normalizedCenterY: 0.519, // 51.9%
    normalizedWidth: 0.102,   // 10.2%
    normalizedHeight: 0.181,  // 18.1%
    rotationY: 20,
    rotationZ: 1.8,
    selectedScaleLimit: 1.04,
    inactiveScale: 0.96
  },
  {
    slotId: 'slot-1',
    slotIndex: 1,
    relativeOffset: -2,
    normalizedCenterX: 0.206, // 20.6%
    normalizedCenterY: 0.531, // 53.1%
    normalizedWidth: 0.108,   // 10.8%
    normalizedHeight: 0.181,  // 18.1%
    rotationY: 12,
    rotationZ: 0.9,
    selectedScaleLimit: 1.04,
    inactiveScale: 0.98
  },
  {
    slotId: 'slot-2',
    slotIndex: 2,
    relativeOffset: -1,
    normalizedCenterX: 0.338, // 33.8%
    normalizedCenterY: 0.540, // 54.0%
    normalizedWidth: 0.122,   // 12.2%
    normalizedHeight: 0.184,  // 18.4%
    rotationY: 6,
    rotationZ: 0.3,
    selectedScaleLimit: 1.04,
    inactiveScale: 1.00
  },
  {
    slotId: 'slot-3-center',
    slotIndex: 3,
    relativeOffset: 0,
    normalizedCenterX: 0.494, // 49.4% (Centered right above the palm)
    normalizedCenterY: 0.524, // 52.4% (Directly resting in holographic focus)
    normalizedWidth: 0.150,   // 15.0%
    normalizedHeight: 0.188,  // 18.8%
    rotationY: 0,
    rotationZ: 0,
    selectedScaleLimit: 1.04,
    inactiveScale: 1.00
  },
  {
    slotId: 'slot-4',
    slotIndex: 4,
    relativeOffset: 1,
    normalizedCenterX: 0.650, // 65.0%
    normalizedCenterY: 0.540, // 54.0%
    normalizedWidth: 0.122,   // 12.2%
    normalizedHeight: 0.184,  // 18.4%
    rotationY: -6,
    rotationZ: -0.3,
    selectedScaleLimit: 1.04,
    inactiveScale: 1.00
  },
  {
    slotId: 'slot-5',
    slotIndex: 5,
    relativeOffset: 2,
    normalizedCenterX: 0.785, // 78.5%
    normalizedCenterY: 0.531, // 53.1%
    normalizedWidth: 0.108,   // 10.8%
    normalizedHeight: 0.181,  // 18.1%
    rotationY: -12,
    rotationZ: -0.9,
    selectedScaleLimit: 1.04,
    inactiveScale: 0.98
  },
  {
    slotId: 'slot-6',
    slotIndex: 6,
    relativeOffset: 3,
    normalizedCenterX: 0.911, // 91.1%
    normalizedCenterY: 0.519, // 51.9%
    normalizedWidth: 0.102,   // 10.2%
    normalizedHeight: 0.181,  // 18.1%
    rotationY: -20,
    rotationZ: -1.8,
    selectedScaleLimit: 1.04,
    inactiveScale: 0.96
  }
];

/**
 * Get anchor configuration by relative offset from the selected app.
 */
export function getAnchorForOffset(offset: number): HologramAnchor | undefined {
  return HOLOGRAM_ANCHORS.find(a => a.relativeOffset === offset);
}

