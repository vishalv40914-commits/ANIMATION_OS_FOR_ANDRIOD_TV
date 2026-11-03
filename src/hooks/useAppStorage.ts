import { useState, useEffect, useCallback } from 'react';
import { LauncherApp } from '../types/app';
import { DEFAULT_APPS } from '../data/defaultApps';

const STORAGE_KEY_APPS = 'mi_tv_launcher_apps_v2';
const LEGACY_STORAGE_KEY_APPS = 'mi_tv_launcher_apps_v1';
const STORAGE_KEY_SETTINGS = 'mi_tv_launcher_settings_v1';

export interface LauncherSettings {
  scrubMode: 'segment' | 'frame';
  enableSound: boolean;
  wrapAround: boolean;
  visualTransitionMs: number; // 120 - 200ms
  showDebugOverlay: boolean;
}

const DEFAULT_SETTINGS: LauncherSettings = {
  scrubMode: 'segment',
  enableSound: true,
  wrapAround: true,
  visualTransitionMs: 160,
  showDebugOverlay: false
};

export function useAppStorage() {
  const [apps, setApps] = useState<LauncherApp[]>(() => {
    try {
      // 1. Check v2 storage
      let stored = localStorage.getItem(STORAGE_KEY_APPS);
      // 2. Fall back to v1 legacy storage if available
      if (!stored) {
        stored = localStorage.getItem(LEGACY_STORAGE_KEY_APPS);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with DEFAULT_APPS to ensure logoUrl is always populated with real logo assets
          const migrated: LauncherApp[] = parsed.map((app: Partial<LauncherApp>, idx: number) => {
            const defaultMatch = DEFAULT_APPS.find(d => d.id === app.id || d.name.toLowerCase() === (app.name || '').toLowerCase());
            return {
              id: app.id || `app-${idx}`,
              name: app.name || 'App',
              logoUrl: app.logoUrl || defaultMatch?.logoUrl || '/assets/app-logos/my-apps.svg',
              icon: app.icon || defaultMatch?.icon || 'Tv',
              category: app.category || defaultMatch?.category || 'tools',
              launchUrl: app.launchUrl || defaultMatch?.launchUrl || 'https://example.com',
              packageName: app.packageName || defaultMatch?.packageName,
              accentColor: app.accentColor || defaultMatch?.accentColor || '#00e5ff',
              enabled: app.enabled !== undefined ? app.enabled : true,
              order: app.order !== undefined ? app.order : idx,
              type: app.type || defaultMatch?.type || 'android',
              description: app.description || defaultMatch?.description
            };
          });

          // Ensure all default apps (like Spotify) exist if missing
          DEFAULT_APPS.forEach(defaultApp => {
            if (!migrated.some(a => a.id === defaultApp.id)) {
              migrated.push({ ...defaultApp, order: migrated.length });
            }
          });

          return migrated.sort((a, b) => a.order - b.order);
        }
      }
    } catch (err) {
      console.warn('Failed to load apps from localStorage:', err);
    }
    return DEFAULT_APPS;
  });

  const [settings, setSettings] = useState<LauncherSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed to load settings from localStorage:', err);
    }
    return DEFAULT_SETTINGS;
  });

  // Save apps whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(apps));
    } catch (err) {
      console.error('Failed to save apps to localStorage:', err);
    }
  }, [apps]);

  // Save settings whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
    }
  }, [settings]);

  const addApp = useCallback((newApp: Omit<LauncherApp, 'id' | 'order'>) => {
    setApps(prev => {
      const id = `app-${Date.now()}`;
      const app: LauncherApp = {
        ...newApp,
        id,
        order: prev.length
      };
      return [...prev, app];
    });
  }, []);

  const removeApp = useCallback((id: string) => {
    setApps(prev => {
      const remaining = prev.filter(a => a.id !== id);
      return remaining.map((app, index) => ({ ...app, order: index }));
    });
  }, []);

  const updateApp = useCallback((id: string, updates: Partial<LauncherApp>) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const reorderApps = useCallback((sourceIndex: number, destIndex: number) => {
    setApps(prev => {
      if (sourceIndex < 0 || sourceIndex >= prev.length || destIndex < 0 || destIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(destIndex, 0, moved);
      return updated.map((app, index) => ({ ...app, order: index }));
    });
  }, []);

  const toggleAppEnabled = useCallback((id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }, []);

  const resetToDefaults = useCallback(() => {
    setApps(DEFAULT_APPS);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(DEFAULT_APPS));
    } catch {}
  }, []);

  return {
    apps,
    enabledApps: apps.filter(a => a.enabled).sort((a, b) => a.order - b.order),
    settings,
    setSettings,
    addApp,
    removeApp,
    updateApp,
    reorderApps,
    toggleAppEnabled,
    resetToDefaults
  };
}
