import React, { useState, useRef, useCallback } from 'react';
import { FocusRow, LauncherApp } from './types/app';
import { useAppStorage } from './hooks/useAppStorage';
import { useTVRemote } from './hooks/useTVRemote';
import { useVideoScrubbing } from './hooks/useVideoScrubbing';
import { CinematicBackground } from './components/CinematicBackground';
import { AppCarousel } from './components/AppCarousel';
import { HomeScreen } from './components/HomeScreen';
import { AppManager } from './components/AppManager';

// Web Audio API Synthesizer for Smart TV UI sound feedback
class TVSoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playNav() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context may be restricted before user gesture
    }
  }

  playSelect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.07); // E5
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Audio fallback
    }
  }

  playBump() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  }
}

const tvSound = new TVSoundEffects();

export const App: React.FC = () => {
  const {
    apps,
    enabledApps,
    settings,
    setSettings,
    addApp,
    removeApp,
    updateApp,
    reorderApps,
    toggleAppEnabled,
    resetToDefaults
  } = useAppStorage();

  const forwardVideoRef = useRef<HTMLVideoElement | null>(null);
  const backwardVideoRef = useRef<HTMLVideoElement | null>(null);

  // Interface Row & Selection State
  const [activeRow, setActiveRow] = useState<FocusRow>('CAROUSEL');
  const [topBarIndex, setTopBarIndex] = useState<number>(0);
  const [isAppManagerOpen, setIsAppManagerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCodeGlow, setIsCodeGlow] = useState<boolean>(false);
  const [edgeBump, setEdgeBump] = useState<'left' | 'right' | null>(null);

  // Launch Notification Notice Modal State
  const [launchNotice, setLaunchNotice] = useState<{
    app: LauncherApp;
    status: 'launching' | 'unsupported_native' | 'opened_web' | 'system_action';
    message: string;
  } | null>(null);

  // App launch action execution
  const executeLaunch = useCallback((app: LauncherApp) => {
    if (settings.enableSound) tvSound.playSelect();

    if (app.type === 'system') {
      if (app.launchUrl === 'internal://app-manager' || app.id === 'app-myapps') {
        setIsAppManagerOpen(true);
      } else if (app.launchUrl === 'internal://settings' || app.id === 'app-settings') {
        setIsSettingsOpen(true);
      } else {
        setLaunchNotice({
          app,
          status: 'system_action',
          message: `Opening system utility: ${app.name}`
        });
      }
      return;
    }

    if (app.type === 'android') {
      // Validate runtime for native Android apps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasAndroidRuntime = typeof window !== 'undefined' && ('Android' in window || !!(window as any).AndroidLauncher);
      if (hasAndroidRuntime) {
        setLaunchNotice({
          app,
          status: 'launching',
          message: `Dispatching Android intent for package: ${app.packageName}`
        });
      } else {
        setLaunchNotice({
          app,
          status: 'unsupported_native',
          message: `Cannot launch native Android package "${app.packageName}". Running on browser/desktop environment without Android Intent runtime.`
        });
      }
      return;
    }

    if (app.type === 'web') {
      // Validate URL format
      try {
        const url = new URL(app.launchUrl);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          window.open(app.launchUrl, '_blank', 'noopener,noreferrer');
          setLaunchNotice({
            app,
            status: 'opened_web',
            message: `Opened ${app.name} at ${app.launchUrl} in a browser window.`
          });
        } else {
          setLaunchNotice({
            app,
            status: 'unsupported_native',
            message: `Invalid URL protocol "${url.protocol}". Only HTTP and HTTPS are allowed.`
          });
        }
      } catch {
        setLaunchNotice({
          app,
          status: 'unsupported_native',
          message: `Invalid web URL: "${app.launchUrl}". Please check the configuration in App Manager.`
        });
      }
    }
  }, [settings.enableSound]);

  // Video Scrubbing Hook
  const {
    playbackState,
    currentAppIndex,
    currentFrameTrack,
    setCurrentAppIndex,
    stepNext,
    stepPrev,
    triggerTouch,
    frameScrubStep
  } = useVideoScrubbing(forwardVideoRef, backwardVideoRef, {
    scrubMode: settings.scrubMode,
    clampAtEdges: !settings.wrapAround,
    onLaunchHit: (appIdx) => {
      const app = enabledApps[appIdx];
      if (app) {
        executeLaunch(app);
      }
    },
    onEdgeBump: (direction) => {
      if (settings.enableSound) tvSound.playBump();
      setEdgeBump(direction);
      setTimeout(() => setEdgeBump(null), 250);
    }
  });

  // Clamp currentAppIndex within enabled apps range if apps change
  const validAppIndex = Math.min(Math.max(0, currentAppIndex), Math.max(0, enabledApps.length - 1));
  const currentApp = enabledApps[validAppIndex] || apps[0];

  // Handle OK / Launch
  const handleSelect = useCallback(async () => {
    // If a modal or notice is open, dismiss it
    if (launchNotice) {
      setLaunchNotice(null);
      return;
    }
    if (isAppManagerOpen || isSettingsOpen) {
      return;
    }

    if (activeRow === 'TOP_BAR') {
      if (settings.enableSound) tvSound.playSelect();
      if (topBarIndex === 0) {
        setIsAppManagerOpen(true);
      } else {
        setIsSettingsOpen(true);
      }
      return;
    }

    // Carousel OK
    const app = enabledApps[validAppIndex];
    if (!app) return;

    // Trigger touch video clip if at S0 or S2, or trigger code glow for other apps
    const hadVideoHandTouch = await triggerTouch(validAppIndex);
    if (!hadVideoHandTouch) {
      // Code-only cyan touch glow
      setIsCodeGlow(true);
      setTimeout(() => setIsCodeGlow(false), 450);
    }
  }, [launchNotice, isAppManagerOpen, isSettingsOpen, activeRow, topBarIndex, enabledApps, validAppIndex, triggerTouch, settings.enableSound]);

  // TV Remote Key Handlers
  useTVRemote({
    onLeft: () => {
      if (launchNotice || isAppManagerOpen || isSettingsOpen) return;
      if (activeRow === 'TOP_BAR') {
        setTopBarIndex(prev => Math.max(0, prev - 1));
        if (settings.enableSound) tvSound.playNav();
      } else {
        if (settings.enableSound) tvSound.playNav();
        stepPrev(enabledApps.length);
      }
    },
    onRight: () => {
      if (launchNotice || isAppManagerOpen || isSettingsOpen) return;
      if (activeRow === 'TOP_BAR') {
        setTopBarIndex(prev => Math.min(1, prev + 1));
        if (settings.enableSound) tvSound.playNav();
      } else {
        if (settings.enableSound) tvSound.playNav();
        stepNext(enabledApps.length);
      }
    },
    onUp: () => {
      if (launchNotice || isAppManagerOpen || isSettingsOpen) return;
      if (activeRow === 'CAROUSEL') {
        setActiveRow('TOP_BAR');
        if (settings.enableSound) tvSound.playNav();
      }
    },
    onDown: () => {
      if (launchNotice || isAppManagerOpen || isSettingsOpen) return;
      if (activeRow === 'TOP_BAR') {
        setActiveRow('CAROUSEL');
        if (settings.enableSound) tvSound.playNav();
      }
    },
    onSelect: handleSelect,
    onBack: () => {
      if (launchNotice) {
        setLaunchNotice(null);
        return;
      }
      if (isAppManagerOpen) {
        setIsAppManagerOpen(false);
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      if (activeRow === 'TOP_BAR') {
        setActiveRow('CAROUSEL');
      }
    },
    onHome: () => {
      setLaunchNotice(null);
      setIsAppManagerOpen(false);
      setIsSettingsOpen(false);
      setActiveRow('CAROUSEL');
      setCurrentAppIndex(0);
    },
    onKeyScrubStep: (delta) => {
      frameScrubStep(delta);
    }
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] flex items-center justify-center">
      {/* 16:9 Cinema Container for 1:1 Video and Hologram Card Alignment */}
      <div className="relative w-full h-full max-w-[calc(100vh*16/9)] max-h-[calc(100vw*9/16)] aspect-video overflow-hidden shadow-2xl">
        {/* 1. Cinematic Background Video Component */}
        <CinematicBackground
          forwardVideoRef={forwardVideoRef}
          backwardVideoRef={backwardVideoRef}
          playbackState={playbackState}
        />

        {/* 2. Interactive App Carousel Overlay over the Empty Cards */}
        <AppCarousel
          apps={enabledApps}
          selectedIndex={validAppIndex}
          frameTrack={currentFrameTrack}
          isCodeGlow={isCodeGlow}
          edgeBump={edgeBump}
          wrapAround={settings.wrapAround}
          onAppClick={(index) => {
            if (index === validAppIndex) {
              handleSelect();
            } else if (index > validAppIndex) {
              stepNext(enabledApps.length);
            } else {
              stepPrev(enabledApps.length);
            }
          }}
        />

        {/* 3. Smart TV HUD: Clock, Remote Guidance, Launch Notices */}
        <HomeScreen
          currentApp={currentApp}
          activeRow={activeRow}
          topBarIndex={topBarIndex}
          onOpenAppManager={() => setIsAppManagerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          launchNotice={launchNotice}
          onDismissNotice={() => setLaunchNotice(null)}
        />
      </div>

      {/* 4. App Manager Dialog */}
      <AppManager
        isOpen={isAppManagerOpen}
        onClose={() => setIsAppManagerOpen(false)}
        apps={apps}
        onAddApp={addApp}
        onRemoveApp={removeApp}
        onUpdateApp={updateApp}
        onReorderApps={reorderApps}
        onToggleEnabled={toggleAppEnabled}
        onResetDefaults={resetToDefaults}
      />

      {/* 5. Settings Modal */}
      {isSettingsOpen && (
        <div 
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 pointer-events-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0c1017] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-white space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-cyan-400">LAUNCHER SETTINGS</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-semibold text-white">Navigation Mode</div>
                  <div className="text-slate-400">Segment (cinematic timeline) vs Frame (1/24s step)</div>
                </div>
                <select
                  value={settings.scrubMode}
                  onChange={(e) => setSettings(s => ({ ...s, scrubMode: e.target.value as 'segment' | 'frame' }))}
                  className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none"
                >
                  <option value="segment">Segment Mode (Default)</option>
                  <option value="frame">Frame Step (Dev 1/24s)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-semibold text-white">Audio Feedback</div>
                  <div className="text-slate-400">Play navigation & selection synthesizer sounds</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSound}
                  onChange={(e) => setSettings(s => ({ ...s, enableSound: e.target.checked }))}
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-semibold text-white">Edge Wrap-around</div>
                  <div className="text-slate-400">Clamp at first/last app (Default) vs Wrap</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wrapAround}
                  onChange={(e) => setSettings(s => ({ ...s, wrapAround: e.target.checked }))}
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-slate-300 space-y-1">
                <div className="font-bold text-cyan-300">Timeline Diagnostics</div>
                <div>Rest Frames: S0=33, S1=65, S2=109, S3=157</div>
                <div>Current Frame: {playbackState.currentFrame} ({playbackState.currentTime.toFixed(3)}s)</div>
                <div>Video State: {playbackState.state} ({playbackState.activeVideoFile})</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;

