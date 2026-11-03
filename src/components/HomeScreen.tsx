import React, { useState, useEffect } from 'react';
import { LauncherApp, FocusRow } from '../types/app';
import { 
  Clock, 
  Wifi, 
  Layers, 
  SlidersHorizontal,
  ExternalLink,
  Smartphone,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface HomeScreenProps {
  currentApp: LauncherApp;
  activeRow: FocusRow;
  topBarIndex: number;
  onOpenAppManager: () => void;
  onOpenSettings: () => void;
  launchNotice: {
    app: LauncherApp;
    status: 'launching' | 'unsupported_native' | 'opened_web' | 'system_action';
    message: string;
  } | null;
  onDismissNotice: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentApp,
  activeRow,
  topBarIndex,
  onOpenAppManager,
  onOpenSettings,
  launchNotice,
  onDismissNotice
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tv-safe-container pointer-events-none select-none">
      {/* 1. TOP BAR */}
      <header className="w-full flex items-center justify-between pointer-events-auto">
        {/* Left: TV Brand & Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
              MI TV
            </span>
            <span className="text-xs font-semibold tracking-wider text-slate-400">
              CINEMATIC LAUNCHER
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1.5 text-sm font-mono text-white/90">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '12:00'}</span>
          </div>
        </div>

        {/* Right: Quick Controls / Settings (Focusable via UP key) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1 rounded bg-white/5 border border-white/10">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connected</span>
          </div>

          <button
            onClick={onOpenAppManager}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeRow === 'TOP_BAR' && topBarIndex === 0
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_#00e5ff] scale-105'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manage Apps</span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeRow === 'TOP_BAR' && topBarIndex === 1
                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_#00e5ff] scale-105'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* 2. BOTTOM BAR: Remote Guidance */}
      <footer className="w-full flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-3.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs text-white/90">
              ◀ / ▶
            </span>
            <span className="text-slate-300 font-medium">Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 font-mono text-xs text-cyan-300 font-bold">
              OK / ENTER
            </span>
            <span className="text-slate-300 font-medium">Launch App</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs text-white/90">
              ▲ / ▼
            </span>
            <span className="text-slate-300 font-medium">Switch Row</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs text-white/90">
              BACK / ESC
            </span>
            <span className="text-slate-300 font-medium">Return</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Target:</span>
          <span className="text-cyan-400 uppercase font-semibold">
            {currentApp.type === 'android' ? 'Android TV Package' : currentApp.type === 'web' ? 'Web URL' : 'Internal'}
          </span>
        </div>
      </footer>

      {/* 4. APP LAUNCH MODAL / TOAST */}
      {launchNotice && (
        <div 
          onClick={onDismissNotice}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-auto cursor-pointer p-6"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0a0f18] border border-cyan-400/60 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] text-white text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-500/20 border border-cyan-400/40">
              {launchNotice.status === 'unsupported_native' ? (
                <Smartphone className="w-6 h-6 text-amber-400" />
              ) : launchNotice.status === 'opened_web' ? (
                <ExternalLink className="w-6 h-6 text-emerald-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold tracking-wide text-white">
                {launchNotice.app.name}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {launchNotice.message}
              </p>
            </div>

            {launchNotice.status === 'unsupported_native' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-left text-xs font-mono">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Native Android Security Notice:
                </div>
                <div>Package: {launchNotice.app.packageName || 'Unknown'}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Native Android apps require the Android TV OS Intent manager runtime. On non-Android desktop runtimes, execution cannot be spoofed.
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={onDismissNotice}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                Dismiss (OK / BACK)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
