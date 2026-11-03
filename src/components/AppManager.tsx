import React, { useState, useEffect } from 'react';
import { LauncherApp, AppCategory, AppTargetType } from '../types/app';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Check, Power, Edit3 } from 'lucide-react';

interface AppManagerProps {
  isOpen: boolean;
  onClose: () => void;
  apps: LauncherApp[];
  onAddApp: (app: Omit<LauncherApp, 'id' | 'order'>) => void;
  onRemoveApp: (id: string) => void;
  onUpdateApp: (id: string, updates: Partial<LauncherApp>) => void;
  onReorderApps: (sourceIndex: number, destIndex: number) => void;
  onToggleEnabled: (id: string) => void;
  onResetDefaults: () => void;
}

const LOGO_PRESETS = [
  { label: 'YouTube', url: '/assets/app-logos/youtube.svg' },
  { label: 'Netflix', url: '/assets/app-logos/netflix.svg' },
  { label: 'Prime Video', url: '/assets/app-logos/prime-video.svg' },
  { label: 'Spotify', url: '/assets/app-logos/spotify.svg' },
  { label: 'Music', url: '/assets/app-logos/music.svg' },
  { label: 'Play Games', url: '/assets/app-logos/games.svg' },
  { label: 'Settings', url: '/assets/app-logos/settings.svg' },
  { label: 'My Apps', url: '/assets/app-logos/my-apps.svg' },
  { label: 'Disney+', url: '/assets/app-logos/disney-plus.svg' },
  { label: 'Twitch', url: '/assets/app-logos/twitch.svg' },
  { label: 'Browser', url: '/assets/app-logos/browser.svg' }
];

export const AppManager: React.FC<AppManagerProps> = ({
  isOpen,
  onClose,
  apps,
  onAddApp,
  onRemoveApp,
  onUpdateApp,
  onReorderApps,
  onToggleEnabled,
  onResetDefaults
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('/assets/app-logos/youtube.svg');
  const [category, setCategory] = useState<AppCategory>('streaming');
  const [type, setType] = useState<AppTargetType>('android');
  const [launchUrl, setLaunchUrl] = useState('');
  const [packageName, setPackageName] = useState('');
  const [accentColor, setAccentColor] = useState('#00e5ff');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset selection index when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setIsAdding(false);
      setEditingAppId(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('App name is required');
      return;
    }
    if (type === 'web' && (!launchUrl.startsWith('http://') && !launchUrl.startsWith('https://'))) {
      setErrorMessage('Please enter a valid HTTP/HTTPS URL');
      return;
    }

    if (editingAppId) {
      onUpdateApp(editingAppId, {
        name: name.trim(),
        logoUrl: logoUrl.trim() || '/assets/app-logos/my-apps.svg',
        category,
        type,
        launchUrl: launchUrl.trim() || 'https://example.com',
        packageName: packageName.trim() || undefined,
        accentColor
      });
      setEditingAppId(null);
    } else {
      onAddApp({
        name: name.trim(),
        logoUrl: logoUrl.trim() || '/assets/app-logos/my-apps.svg',
        icon: 'Tv',
        category,
        type,
        launchUrl: launchUrl.trim() || 'https://example.com',
        packageName: packageName.trim() || undefined,
        accentColor,
        enabled: true,
        description: `Custom ${type} application`
      });
      setIsAdding(false);
    }

    setName('');
    setLogoUrl('/assets/app-logos/youtube.svg');
    setLaunchUrl('');
    setPackageName('');
    setErrorMessage('');
  };

  const startEdit = (app: LauncherApp) => {
    setEditingAppId(app.id);
    setName(app.name);
    setLogoUrl(app.logoUrl || '/assets/app-logos/my-apps.svg');
    setCategory(app.category);
    setType(app.type);
    setLaunchUrl(app.launchUrl);
    setPackageName(app.packageName || '');
    setAccentColor(app.accentColor);
    setIsAdding(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-6">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-[#0c1017] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-400">APP MANAGER</h2>
            <p className="text-xs text-slate-400">Configure real brand logos, launch destinations, and reorder TV apps</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingAppId(null);
                setName('');
                setLogoUrl('/assets/app-logos/youtube.svg');
                setLaunchUrl('');
                setPackageName('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add App
            </button>
            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
            >
              Reset Defaults
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isAdding ? (
            <form onSubmit={handleSaveNew} className="bg-white/5 p-5 rounded-xl border border-cyan-500/30 space-y-4">
              <h3 className="text-sm font-bold text-cyan-300">
                {editingAppId ? 'EDIT APPLICATION & LOGO' : 'ADD NEW APPLICATION & LOGO'}
              </h3>
              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Logo Live Preview */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-black/40 border border-white/10">
                <div className="w-32 h-14 bg-[#0a0e16] border border-cyan-400/30 rounded-lg flex items-center justify-center p-2 shadow-inner">
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Active Logo Preview</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-md">{logoUrl}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">App Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Disney+"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AppTargetType)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="android">Native Android TV App (Intent)</option>
                    <option value="web">Web App (Browser URL)</option>
                    <option value="system">System / Internal Tool</option>
                  </select>
                </div>

                {/* Preset Logo Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Brand Logo</label>
                  <select
                    value={LOGO_PRESETS.some(p => p.url === logoUrl) ? logoUrl : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setLogoUrl(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {LOGO_PRESETS.map((preset) => (
                      <option key={preset.url} value={preset.url}>
                        {preset.label} ({preset.url})
                      </option>
                    ))}
                    <option value="custom">Custom Asset Path...</option>
                  </select>
                </div>

                {/* Custom Logo Path input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Logo Asset Path (SVG/PNG)</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="/assets/app-logos/custom.svg"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AppCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="streaming">Streaming</option>
                    <option value="music">Music</option>
                    <option value="gaming">Gaming</option>
                    <option value="tools">Tools</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Accent Glow Color</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full h-10 px-1 py-1 rounded-lg bg-black/40 border border-white/20 cursor-pointer"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {type === 'android' ? 'Android TV Package ID (e.g. com.netflix.ninja, com.spotify.tv.android)' : 'Launch URL *'}
                  </label>
                  <input
                    type="text"
                    value={type === 'android' ? packageName : launchUrl}
                    onChange={(e) => type === 'android' ? setPackageName(e.target.value) : setLaunchUrl(e.target.value)}
                    placeholder={type === 'android' ? 'com.example.tv.app' : 'https://example.com'}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save App
                </button>
              </div>
            </form>
          ) : null}

          {/* Apps List */}
          <div className="space-y-2">
            {apps.map((app, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-md'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  } ${!app.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Real Logo Thumbnail */}
                    <div
                      className="w-16 h-10 rounded-lg bg-[#0a0e16] border border-white/10 flex items-center justify-center p-1.5 shadow-sm"
                    >
                      <img
                        src={app.logoUrl}
                        alt={app.name}
                        className="max-w-full max-h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{app.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                          {app.type}
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          {app.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate max-w-sm">
                        {app.type === 'android' ? (app.packageName || 'No package ID') : app.launchUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Move Up */}
                    <button
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderApps(index, index - 1);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    {/* Move Down */}
                    <button
                      disabled={index === apps.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderApps(index, index + 1);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-slate-300"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(app);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                      title="Edit Logo & Destination"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {/* Enable / Disable */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleEnabled(app.id);
                      }}
                      className={`p-1.5 rounded-lg ${app.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}
                      title={app.enabled ? 'Disable' : 'Enable'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveApp(app.id);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>Press <span className="key-pill">BACK / ESC</span> to return to TV Launcher</span>
          <span>Central logo assets: <span className="font-mono text-cyan-400">public/assets/app-logos/</span></span>
        </div>
      </div>
    </div>
  );
};
