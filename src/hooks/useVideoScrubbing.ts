import { useState, useRef, useEffect, useCallback } from 'react';
import { LauncherState, VideoPlaybackState } from '../types/app';
import { VIDEO_CONFIG, TIMELINE, frameToTime } from '../config/videoScrubbing';
import cardTrackData from '../config/cardtrack.json';

interface StepTransition {
  id: string;
  fromIndex: number;
  toIndex: number;
  startFrame?: number;
  endFrame?: number;
  startTime: number;
  endTime: number;
}

export interface UseVideoScrubbingOptions {
  scrubMode?: 'segment' | 'frame';
  clampAtEdges?: boolean;
  onLaunchHit?: (appIndex: number) => void;
  onEdgeBump?: (direction: 'left' | 'right') => void;
  onStateChange?: (state: LauncherState) => void;
}

export function useVideoScrubbing(
  forwardVideoRef: React.RefObject<HTMLVideoElement | null>,
  backwardVideoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseVideoScrubbingOptions = {}
) {
  const {
    scrubMode = VIDEO_CONFIG.scrubMode,
    clampAtEdges = VIDEO_CONFIG.clampAtEdges,
    onLaunchHit,
    onEdgeBump,
    onStateChange
  } = options;

  // Primary playback state
  const [playbackState, setPlaybackState] = useState<VideoPlaybackState>({
    state: 'LOADING',
    currentRestIndex: 0,
    activeVideoFile: 'forward',
    currentTime: 1.375,
    currentFrame: 33, // S0 rest frame
    targetFrame: 33,
    isPlaying: false,
    isBuffering: false,
    hasError: false
  });

  // Current logical app index (updates immediately!)
  const [currentAppIndex, setCurrentAppIndex] = useState<number>(0);
  const [currentFrameTrack, setCurrentFrameTrack] = useState(cardTrackData.frames[33]);

  // Command queue: at most ONE pending command
  const pendingCommandRef = useRef<'NEXT' | 'PREV' | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);
  const appIndexRef = useRef<number>(0);

  // Sync ref with state
  useEffect(() => {
    appIndexRef.current = currentAppIndex;
  }, [currentAppIndex]);

  // Helper: map logical app index to video rest state index (0 to 3)
  const getRestIndexForApp = (appIdx: number): number => {
    if (appIdx <= 3) return appIdx;
    return 1 + ((appIdx - 4) % 3);
  };

  // Helper: get forward rest frame for index
  const getRestFrameForIndex = (restIdx: number): number => {
    const state = TIMELINE.forward.restStates[restIdx];
    return state ? state.restFrame : 33;
  };

  // Helper: cancel animation loop
  const cancelPlaybackLoop = () => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  // Helper: seek safely with guaranteed timeout to NEVER hang
  const safeSeek = (video: HTMLVideoElement, targetTime: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!video) {
        return resolve();
      }

      if (Math.abs(video.currentTime - targetTime) < 0.02) {
        return resolve();
      }

      let done = false;
      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          video.removeEventListener('seeked', onSeeked);
          resolve();
        }
      }, 800);

      const onSeeked = () => {
        if (!done) {
          done = true;
          clearTimeout(timeout);
          video.removeEventListener('seeked', onSeeked);
          resolve();
        }
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      try {
        video.currentTime = targetTime;
      } catch {
        clearTimeout(timeout);
        resolve();
      }
    });
  };

  // Initialize both videos on mount
  useEffect(() => {
    const fwdVideo = forwardVideoRef.current;
    const bwdVideo = backwardVideoRef.current;

    const initialRestTime = TIMELINE.forward.restStates[0].restTime; // 1.375s (Frame 33)

    if (fwdVideo) {
      fwdVideo.muted = true;
      fwdVideo.autoplay = false;
      fwdVideo.loop = false;
      fwdVideo.playsInline = true;

      const onLoaded = async () => {
        fwdVideo.pause();
        await safeSeek(fwdVideo, initialRestTime);
        setPlaybackState(prev => ({
          ...prev,
          state: 'HOLD',
          activeVideoFile: 'forward',
          currentTime: initialRestTime,
          currentFrame: 33,
          targetFrame: 33,
          isPlaying: false,
          isBuffering: false,
          hasError: false
        }));
        onStateChange?.('HOLD');
      };

      fwdVideo.addEventListener('loadedmetadata', onLoaded, { once: true });
      if (fwdVideo.readyState >= 1) {
        onLoaded();
      }
    }

    if (bwdVideo) {
      bwdVideo.muted = true;
      bwdVideo.autoplay = false;
      bwdVideo.loop = false;
      bwdVideo.playsInline = true;

      const onBwdLoaded = async () => {
        bwdVideo.pause();
        await safeSeek(bwdVideo, 0.40);
      };

      bwdVideo.addEventListener('loadedmetadata', onBwdLoaded, { once: true });
      if (bwdVideo.readyState >= 1) {
        onBwdLoaded();
      }
    }

    return () => {
      cancelPlaybackLoop();
    };
  }, []);

  // Update cardtrack frame lookup
  const updateFrameData = useCallback((frame: number) => {
    const clampedFrame = Math.max(0, Math.min(239, Math.round(frame)));
    const frameData = cardTrackData.frames[clampedFrame];
    if (frameData) {
      setCurrentFrameTrack(frameData);
    }
  }, []);

  // Process next pending command once current transition completes
  const checkPendingCommand = (totalApps: number) => {
    const nextCmd = pendingCommandRef.current;
    pendingCommandRef.current = null;
    isTransitioningRef.current = false;

    if (nextCmd === 'NEXT') {
      stepNext(totalApps);
    } else if (nextCmd === 'PREV') {
      stepPrev(totalApps);
    }
  };

  // STEP NEXT (RIGHT Navigation — Uses OLD VIDEO)
  const stepNext = useCallback(async (totalApps: number) => {
    const currentIdx = appIndexRef.current;
    if (clampAtEdges && currentIdx >= totalApps - 1) {
      onEdgeBump?.('right');
      return;
    }

    if (isTransitioningRef.current) {
      pendingCommandRef.current = 'NEXT';
      return;
    }

    const nextIdx = currentIdx + 1;
    setCurrentAppIndex(nextIdx);
    appIndexRef.current = nextIdx;

    const fwdVideo = forwardVideoRef.current;
    const bwdVideo = backwardVideoRef.current;
    if (!fwdVideo) return;

    if (bwdVideo && !bwdVideo.paused) {
      bwdVideo.pause();
    }

    if (scrubMode === 'frame') {
      const nextF = Math.min(239, playbackState.currentFrame + 1);
      const nextT = frameToTime(nextF);
      await safeSeek(fwdVideo, nextT);
      setPlaybackState(prev => ({
        ...prev,
        state: 'HOLD',
        activeVideoFile: 'forward',
        currentTime: nextT,
        currentFrame: nextF
      }));
      updateFrameData(nextF);
      return;
    }

    isTransitioningRef.current = true;
    onStateChange?.('STEP');

    try {
      const fromRestIdx = getRestIndexForApp(currentIdx);
      let stepClip: StepTransition;
      if (fromRestIdx === 0) {
        stepClip = TIMELINE.forward.stepTransitions[0]; // S0 -> S1
      } else if (fromRestIdx === 1) {
        stepClip = TIMELINE.forward.stepTransitions[1]; // S1 -> S2
      } else {
        stepClip = TIMELINE.forward.stepTransitions[2]; // S2 -> S3
      }

      const startSeekTime = stepClip.startTime;
      const targetEndTime = stepClip.endTime;
      const targetRestFrame = stepClip.endFrame ?? Math.round(targetEndTime * 24);

      await safeSeek(fwdVideo, startSeekTime);
      await fwdVideo.play();

      // Set active forward video now that playback has commenced
      setPlaybackState(prev => ({
        ...prev,
        state: 'STEP',
        activeVideoFile: 'forward',
        isPlaying: true
      }));

      let hasStarted = false;

      const monitorForwardPlayback = () => {
        if (!fwdVideo) return;
        const currentT = fwdVideo.currentTime;
        const currentF = Math.round(currentT * 24);
        updateFrameData(currentF);

        if (currentT > startSeekTime + 0.04) {
          hasStarted = true;
        }

        if (hasStarted && currentT >= targetEndTime - 0.03) {
          fwdVideo.pause();
          safeSeek(fwdVideo, targetEndTime);
          const newRestIdx = getRestIndexForApp(nextIdx);
          setPlaybackState(prev => ({
            ...prev,
            state: 'HOLD',
            activeVideoFile: 'forward',
            currentRestIndex: newRestIdx,
            currentTime: targetEndTime,
            currentFrame: targetRestFrame,
            targetFrame: targetRestFrame,
            isPlaying: false
          }));
          onStateChange?.('HOLD');
          updateFrameData(targetRestFrame);
          checkPendingCommand(totalApps);
        } else {
          animFrameIdRef.current = requestAnimationFrame(monitorForwardPlayback);
        }
      };

      animFrameIdRef.current = requestAnimationFrame(monitorForwardPlayback);
    } catch (err) {
      console.warn('Playback error during stepNext:', err);
      fwdVideo.pause();
      isTransitioningRef.current = false;
      setPlaybackState(prev => ({ ...prev, state: 'HOLD', activeVideoFile: 'forward', isPlaying: false }));
      onStateChange?.('HOLD');
    }
  }, [clampAtEdges, scrubMode, onEdgeBump, onStateChange, updateFrameData]);

  // STEP PREVIOUS (LEFT Navigation — Uses NEW VIDEO with seamless handoff)
  const stepPrev = useCallback(async (totalApps: number) => {
    const currentIdx = appIndexRef.current;
    if (clampAtEdges && currentIdx <= 0) {
      onEdgeBump?.('left');
      return;
    }

    if (isTransitioningRef.current) {
      pendingCommandRef.current = 'PREV';
      return;
    }

    const prevIdx = currentIdx - 1;
    setCurrentAppIndex(prevIdx);
    appIndexRef.current = prevIdx;

    const bwdVideo = backwardVideoRef.current;
    const fwdVideo = forwardVideoRef.current;

    if (!bwdVideo) return;

    if (scrubMode === 'frame') {
      const prevF = Math.max(0, playbackState.currentFrame - 1);
      const prevT = frameToTime(prevF);
      if (fwdVideo) await safeSeek(fwdVideo, prevT);
      setPlaybackState(prev => ({
        ...prev,
        state: 'HOLD',
        activeVideoFile: 'forward',
        currentTime: prevT,
        currentFrame: prevF
      }));
      updateFrameData(prevF);
      return;
    }

    isTransitioningRef.current = true;
    onStateChange?.('STEP');

    try {
      const targetRestIdx = getRestIndexForApp(prevIdx);
      let stepClip: StepTransition;
      if (targetRestIdx === 0) {
        stepClip = TIMELINE.backward.stepTransitions[0]; // S1 -> S0 (0.40s to 1.00s)
      } else if (targetRestIdx === 1) {
        stepClip = TIMELINE.backward.stepTransitions[1]; // S2 -> S1 (3.40s to 4.10s)
      } else {
        stepClip = TIMELINE.backward.stepTransitions[2]; // S3 -> S2 (5.60s to 6.20s)
      }

      const startSeekTime = stepClip.startTime;
      const targetEndTime = stepClip.endTime;

      // 1. Seek backward video to start
      await safeSeek(bwdVideo, startSeekTime);

      // 2. Play backward video
      await bwdVideo.play();

      // 3. Pause forward video and reveal backward video (seamless crossfade!)
      if (fwdVideo && !fwdVideo.paused) {
        fwdVideo.pause();
      }
      setPlaybackState(prev => ({
        ...prev,
        state: 'STEP',
        activeVideoFile: 'backward',
        isPlaying: true
      }));

      let hasStarted = false;

      const monitorBackwardPlayback = () => {
        if (!bwdVideo) return;
        const currentT = bwdVideo.currentTime;
        const currentF = Math.round(currentT * 24);
        updateFrameData(currentF);

        if (currentT > startSeekTime + 0.04) {
          hasStarted = true;
        }

        if (hasStarted && currentT >= targetEndTime - 0.03) {
          bwdVideo.pause();

          // Settle and STAY on the backward video's natural resting pose!
          setPlaybackState(prev => ({
            ...prev,
            state: 'HOLD',
            activeVideoFile: 'backward',
            currentRestIndex: targetRestIdx,
            currentTime: targetEndTime,
            currentFrame: Math.round(targetEndTime * 24),
            targetFrame: Math.round(targetEndTime * 24),
            isPlaying: false
          }));
          onStateChange?.('HOLD');
          updateFrameData(Math.round(targetEndTime * 24));
          checkPendingCommand(totalApps);
        } else {
          animFrameIdRef.current = requestAnimationFrame(monitorBackwardPlayback);
        }
      };

      animFrameIdRef.current = requestAnimationFrame(monitorBackwardPlayback);
    } catch (err) {
      console.warn('Backward playback notice:', err);
      if (bwdVideo) bwdVideo.pause();

      // Fallback: stay on forward video safely
      const targetRestIdx = getRestIndexForApp(prevIdx);
      const targetFwdRestFrame = getRestFrameForIndex(targetRestIdx);
      const targetFwdTime = frameToTime(targetFwdRestFrame);
      if (fwdVideo) {
        safeSeek(fwdVideo, targetFwdTime);
      }
      setPlaybackState(prev => ({
        ...prev,
        state: 'HOLD',
        activeVideoFile: 'forward',
        currentRestIndex: targetRestIdx,
        currentTime: targetFwdTime,
        currentFrame: targetFwdRestFrame,
        targetFrame: targetFwdRestFrame,
        isPlaying: false
      }));
      onStateChange?.('HOLD');
      updateFrameData(targetFwdRestFrame);
      isTransitioningRef.current = false;
      checkPendingCommand(totalApps);
    }
  }, [clampAtEdges, scrubMode, onEdgeBump, onStateChange, updateFrameData]);

  // TOUCH / LAUNCH APP (OK Key)
  const triggerTouch = useCallback(async (appIndex: number): Promise<boolean> => {
    if (isTransitioningRef.current) return false;

    const restIdx = getRestIndexForApp(appIndex);
    const fwdVideo = forwardVideoRef.current;
    const bwdVideo = backwardVideoRef.current;

    let touchClip = null;
    if (restIdx === 0) {
      touchClip = TIMELINE.forward.touchClips.TOUCH_A;
    } else if (restIdx === 2) {
      touchClip = TIMELINE.forward.touchClips.TOUCH_B;
    }

    if (!touchClip || !fwdVideo) {
      onLaunchHit?.(appIndex);
      return false; // Code-only glow
    }

    if (bwdVideo && !bwdVideo.paused) {
      bwdVideo.pause();
    }

    isTransitioningRef.current = true;
    setPlaybackState(prev => ({
      ...prev,
      state: 'TOUCH',
      activeVideoFile: 'forward',
      isPlaying: true
    }));
    onStateChange?.('TOUCH');

    try {
      const startT = touchClip.startTime;
      const endT = touchClip.endTime;
      const returnFrame = touchClip.returnRestFrame;

      await safeSeek(fwdVideo, startT);
      onLaunchHit?.(appIndex);
      await fwdVideo.play();

      const monitorTouch = () => {
        if (!fwdVideo) return;
        const currentT = fwdVideo.currentTime;
        const currentF = Math.round(currentT * 24);
        updateFrameData(currentF);

        if (currentT >= endT - 0.02) {
          fwdVideo.pause();
          const returnT = frameToTime(returnFrame);
          safeSeek(fwdVideo, returnT);
          isTransitioningRef.current = false;
          setPlaybackState(prev => ({
            ...prev,
            state: 'HOLD',
            activeVideoFile: 'forward',
            currentTime: returnT,
            currentFrame: returnFrame,
            targetFrame: returnFrame,
            isPlaying: false
          }));
          onStateChange?.('HOLD');
          updateFrameData(returnFrame);
        } else {
          animFrameIdRef.current = requestAnimationFrame(monitorTouch);
        }
      };

      animFrameIdRef.current = requestAnimationFrame(monitorTouch);
      return true;
    } catch (err) {
      console.warn('Touch playback failed:', err);
      fwdVideo.pause();
      isTransitioningRef.current = false;
      setPlaybackState(prev => ({ ...prev, state: 'HOLD', activeVideoFile: 'forward', isPlaying: false }));
      onStateChange?.('HOLD');
      return false;
    }
  }, [onLaunchHit, onStateChange, updateFrameData]);

  // Frame scrub step for [ and ] dev keys
  const frameScrubStep = useCallback(async (delta: number) => {
    const video = forwardVideoRef.current;
    if (!video) return;

    const newFrame = Math.max(0, Math.min(239, playbackState.currentFrame + delta));
    const newTime = frameToTime(newFrame);
    await safeSeek(video, newTime);
    setPlaybackState(prev => ({
      ...prev,
      currentTime: newTime,
      currentFrame: newFrame
    }));
    updateFrameData(newFrame);
  }, [playbackState.currentFrame, updateFrameData]);

  return {
    playbackState,
    currentAppIndex,
    currentFrameTrack,
    setCurrentAppIndex,
    stepNext,
    stepPrev,
    triggerTouch,
    frameScrubStep
  };
}
