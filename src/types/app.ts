export type AppTargetType = 'web' | 'android' | 'system';

export type AppCategory = 'streaming' | 'music' | 'gaming' | 'tools' | 'system';

export interface LauncherApp {
  id: string;
  name: string;
  logoUrl: string; // Central logo asset path (e.g., '/assets/app-logos/youtube.svg')
  icon?: string; // Optional legacy identifier or fallback
  category: AppCategory;
  launchUrl: string;
  packageName?: string; // Android package name (e.g., com.google.android.youtube.tv)
  accentColor: string; // Hex color code for glow & borders
  enabled: boolean;
  order: number;
  type: AppTargetType;
  description?: string;
}

export type LauncherState = 
  | 'LOADING'
  | 'HOLD'
  | 'STEP'
  | 'TOUCH'
  | 'APP_OPEN';

export interface VideoPlaybackState {
  state: LauncherState;
  currentRestIndex: number; // 0 for S0, 1 for S1, 2 for S2, 3 for S3
  activeVideoFile: 'forward' | 'backward';
  currentTime: number;
  currentFrame: number;
  targetFrame: number;
  isPlaying: boolean;
  isBuffering: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export type FocusRow = 'TOP_BAR' | 'CAROUSEL' | 'BOTTOM_BAR';

export interface CardPosition {
  x: number; // percentage of screen width (0-100)
  y: number; // percentage of screen height (0-100)
  width: number; // percentage
  height: number; // percentage
  scale: number;
  opacity: number;
  rotationY?: number;
}
