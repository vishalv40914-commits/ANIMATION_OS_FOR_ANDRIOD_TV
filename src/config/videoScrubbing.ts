import timelineData from './timeline.json';

export interface VideoScrubbingConfig {
  frameRate: number;
  frameStepSeconds: number;
  scrubMode: 'segment' | 'frame';
  pauseWhenIdle: boolean;
  loopTimeline: boolean;
  touchHitWindow: number;
  visualTransitionDuration: number;
  clampAtEdges: boolean;
  videoSources: {
    forwardIntra: string;
    backwardIntra: string;
    fallbackOriginal: string;
    fallbackBackwardOriginal: string;
    poster: string;
  };
  futureClips: {
    intro: string;
    ending: string;
  };
}

export const VIDEO_CONFIG: VideoScrubbingConfig = {
  frameRate: 24,
  frameStepSeconds: 1 / 24,
  scrubMode: 'segment',
  pauseWhenIdle: true,
  loopTimeline: false,
  touchHitWindow: 0.04,
  visualTransitionDuration: 0.16,
  clampAtEdges: true,
  videoSources: {
    forwardIntra: '/video/main_intra.mp4',
    backwardIntra: '/video/backward_intra_1080p.mp4',
    fallbackOriginal: '/video/app-navigation.mp4',
    fallbackBackwardOriginal: '/video/backward-navigation.mp4',
    poster: '/images/launcher-background.png'
  },
  futureClips: {
    intro: 'intro.mp4',
    ending: 'ending.mp4'
  }
};

export const TIMELINE = timelineData;

export function frameToTime(frame: number, fps: number = 24): number {
  return (frame + 0.5) / fps;
}
