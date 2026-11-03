import React, { useRef } from 'react';
import { LauncherApp } from '../types/app';
import {
  DEFAULT_ARC_CONFIG,
  ArcCarouselConfig,
  calculateCard3DTransform
} from '../config/arcCarouselConfig';
import { AppIcon } from './AppIcon';

interface AppCarouselProps {
  apps: LauncherApp[];
  selectedIndex: number;
  frameTrack: {
    frame: number;
    rowShift: number;
    touchGlow: number;
    overlayOpacity: number;
  };
  isCodeGlow: boolean;
  edgeBump: 'left' | 'right' | null;
  onAppClick?: (index: number) => void;
  wrapAround?: boolean;
  config?: Partial<ArcCarouselConfig>;
}

export const AppCarousel: React.FC<AppCarouselProps> = ({
  apps,
  selectedIndex,
  frameTrack,
  isCodeGlow,
  edgeBump,
  onAppClick,
  wrapAround = false,
  config
}) => {
  const arcConfig: ArcCarouselConfig = {
    ...DEFAULT_ARC_CONFIG,
    ...config
  };

  const opacity = frameTrack.overlayOpacity ?? 1.0;
  const hasTouchGlow = (frameTrack.touchGlow > 0.05) || isCodeGlow;

  // Track previous relative positions to handle seamless wrap-around without fly-across
  const prevRelMap = useRef<Record<string, number>>({});

  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden transition-opacity duration-300 ${
        edgeBump === 'left' ? 'bump-left' : edgeBump === 'right' ? 'bump-right' : ''
      }`}
      style={{
        opacity,
        perspective: `${arcConfig.perspectivePx}px`,
        perspectiveOrigin: `${arcConfig.centerAnchorX}% ${arcConfig.centerAnchorY}%`,
        transformStyle: 'preserve-3d'
      }}
    >
      {apps.map((app, appIndex) => {
        // Calculate relative index from selected application
        let relativeIndex = appIndex - selectedIndex;

        // Wrap around in circular carousel
        if (wrapAround && apps.length > 0) {
          const half = apps.length / 2;
          while (relativeIndex > half) relativeIndex -= apps.length;
          while (relativeIndex < -half) relativeIndex += apps.length;
        }

        // Detect if this card jumped across the wrap boundary (e.g. -3 to +3)
        const prevRel = prevRelMap.current[app.id];
        const isWrapJump = prevRel !== undefined && Math.abs(relativeIndex - prevRel) > 2.5;

        // Compute 3D placement along cylindrical curved arc
        const placement = calculateCard3DTransform(relativeIndex, arcConfig);
        const isFocused = placement.isFocused;

        return (
          <div
            key={app.id}
            onClick={() => onAppClick?.(appIndex)}
            className={`absolute cursor-pointer pointer-events-auto select-none ${
              isFocused ? 'z-30' : 'z-20'
            }`}
            style={{
              left: `${placement.leftPercent}%`,
              top: `${placement.topPercent}%`,
              width: `${placement.widthPercent}%`,
              height: `${placement.heightPercent}%`,
              transform: placement.transform,
              transformOrigin: 'center center',
              opacity: placement.opacity,
              zIndex: placement.zIndex,
              pointerEvents: placement.opacity === 0 ? 'none' : 'auto',
              transition: isWrapJump
                ? 'none'
                : `all ${arcConfig.transitionDurationMs}ms ${arcConfig.transitionEasing}`
            }}
            ref={() => {
              // Store relative position for next transition detection
              prevRelMap.current[app.id] = relativeIndex;
            }}
          >
            {/* Holographic Card Frame with Solid, Suitable Background for Brand Logos */}
            <div
              className={`relative w-full h-full rounded-xl flex flex-col items-center justify-between p-2 md:p-2.5 transition-all duration-200 overflow-hidden ${
                isFocused
                  ? 'border-[1.5px] border-amber-400/90'
                  : 'border border-cyan-400/40 hover:border-cyan-300/60'
              }`}
              style={{
                background: isFocused
                  ? 'linear-gradient(180deg, rgba(16, 22, 36, 0.95) 0%, rgba(9, 13, 22, 0.98) 100%)'
                  : 'linear-gradient(180deg, rgba(11, 16, 27, 0.90) 0%, rgba(6, 9, 16, 0.94) 100%)',
                boxShadow: hasTouchGlow && isFocused
                  ? '0 0 35px rgba(0, 229, 255, 0.95), inset 0 0 20px rgba(0, 229, 255, 0.6)'
                  : isFocused
                  ? '0 0 24px rgba(245, 158, 11, 0.45), inset 0 0 14px rgba(245, 158, 11, 0.2)'
                  : '0 0 10px rgba(0, 229, 255, 0.15)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
              }}
            >
              {/* Futuristic Cybernetic Corner Brackets */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Left */}
                <div
                  className={`absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 transition-colors ${
                    isFocused ? 'border-amber-400 shadow-[0_0_6px_#fbbf24]' : 'border-cyan-400/60'
                  }`}
                />
                {/* Top Right */}
                <div
                  className={`absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 transition-colors ${
                    isFocused ? 'border-amber-400 shadow-[0_0_6px_#fbbf24]' : 'border-cyan-400/60'
                  }`}
                />
                {/* Bottom Left */}
                <div
                  className={`absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 transition-colors ${
                    isFocused ? 'border-amber-400 shadow-[0_0_6px_#fbbf24]' : 'border-cyan-400/60'
                  }`}
                />
                {/* Bottom Right */}
                <div
                  className={`absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 transition-colors ${
                    isFocused ? 'border-amber-400 shadow-[0_0_6px_#fbbf24]' : 'border-cyan-400/60'
                  }`}
                />
              </div>

              {/* Real Brand Logo Area */}
              <div className="flex-1 w-full flex items-center justify-center min-h-0 px-2 pt-1">
                <AppIcon
                  appId={app.id}
                  name={app.name}
                  logoUrl={app.logoUrl}
                  iconName={app.icon}
                  isFocused={isFocused}
                  className="w-full h-full"
                />
              </div>

              {/* App Name Underneath */}
              <div className="w-full text-center pb-1 px-1 truncate z-10">
                <span
                  className={`block truncate transition-all duration-150 ${
                    isFocused
                      ? 'text-white font-bold text-xs md:text-sm tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                      : 'text-white/90 font-medium text-[11px] md:text-xs tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
                  }`}
                >
                  {app.name}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
