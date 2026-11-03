import React from 'react';
import { VIDEO_CONFIG } from '../config/videoScrubbing';
import { VideoPlaybackState } from '../types/app';

interface CinematicBackgroundProps {
  playbackState: VideoPlaybackState;
  forwardVideoRef: React.RefObject<HTMLVideoElement | null>;
  backwardVideoRef: React.RefObject<HTMLVideoElement | null>;
  showPosterFallback?: boolean;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  playbackState,
  forwardVideoRef,
  backwardVideoRef,
  showPosterFallback = false
}) => {
  const isForwardActive = playbackState.activeVideoFile === 'forward';
  const [fwdReady, setFwdReady] = React.useState(false);
  const [bwdReady, setBwdReady] = React.useState(false);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#05070b]">
      {/* 1. Base Still Fallback Image: ALWAYS at z-0 with full opacity so screen is NEVER black! */}
      <img
        src={VIDEO_CONFIG.videoSources.poster}
        alt="Temple Hologram Background"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-100"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* 2. FORWARD VIDEO ELEMENT (Old Video - Right Navigation, z-10) */}
      <video
        ref={forwardVideoRef}
        src={VIDEO_CONFIG.videoSources.forwardIntra}
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setFwdReady(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center z-10 transition-opacity duration-200 ${
          fwdReady && isForwardActive ? 'opacity-100' : 'opacity-0'
        }`}
        onError={(e) => {
          const video = e.currentTarget;
          if (video.src !== VIDEO_CONFIG.videoSources.fallbackOriginal) {
            video.src = VIDEO_CONFIG.videoSources.fallbackOriginal;
            video.load();
          }
        }}
      />

      {/* 3. BACKWARD VIDEO ELEMENT (New Video - Left Navigation, z-20) */}
      <video
        ref={backwardVideoRef}
        src={VIDEO_CONFIG.videoSources.backwardIntra}
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setBwdReady(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center z-20 transition-opacity duration-200 ${
          bwdReady && !isForwardActive ? 'opacity-100' : 'opacity-0'
        }`}
        onError={(e) => {
          const video = e.currentTarget;
          if (video.src !== VIDEO_CONFIG.videoSources.fallbackBackwardOriginal) {
            video.src = VIDEO_CONFIG.videoSources.fallbackBackwardOriginal;
            video.load();
          }
        }}
      />

      {/* Soft Ambient Vignette: subtly emphasizes center cards while preserving character visibility */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,7,11,0.45) 80%, rgba(5,7,11,0.85) 100%)'
        }}
      />

      {/* Top safe-dimmer for Clock / Status legibility without darkening character face */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#05070b]/80 via-[#05070b]/25 to-transparent pointer-events-none z-30" />

      {/* Subtle Cyber-Dravidian Hologram Scanlines */}
      <div className="absolute inset-0 hologram-scanlines opacity-15 pointer-events-none z-30" />

      {/* Buffering Indicator */}
      {playbackState.isBuffering && (
        <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 text-xs font-mono animate-pulse z-40">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          BUFFERING
        </div>
      )}

      {/* Error Fallback Banner */}
      {(playbackState.hasError || showPosterFallback) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs z-40">
          {playbackState.errorMessage || 'Video background inactive. Falling back to high-res poster.'}
        </div>
      )}
    </div>
  );
};
