import { useEffect, useRef } from 'react';

export interface TVRemoteCallbacks {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
  onHome?: () => void;
  onKeyScrubStep?: (delta: number) => void; // For frame scrub mode (+1 or -1 frame)
}

interface TVRemoteOptions {
  enabled?: boolean;
  repeatThrottleMs?: number; // Minimum ms between auto-repeat actions
}

export function useTVRemote(
  callbacks: TVRemoteCallbacks,
  options: TVRemoteOptions = {}
) {
  const { enabled = true, repeatThrottleMs = 260 } = options;
  const lastKeyTimeRef = useRef<number>(0);
  const callbacksRef = useRef<TVRemoteCallbacks>(callbacks);

  // Keep callbacks ref fresh without re-registering event listener
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inputs inside input fields or textareas unless Escape
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput && e.key !== 'Escape' && e.key !== 'Enter') {
        return;
      }

      const now = performance.now();
      if (e.repeat && now - lastKeyTimeRef.current < repeatThrottleMs) {
        e.preventDefault();
        return;
      }
      lastKeyTimeRef.current = now;

      const key = e.key;
      const keyCode = e.keyCode || e.which;

      // Remote Navigation Mappings
      // Left: ArrowLeft, or Android KEYCODE_DPAD_LEFT (21)
      if (key === 'ArrowLeft' || keyCode === 37 || keyCode === 21) {
        e.preventDefault();
        callbacksRef.current.onLeft?.();
        return;
      }

      // Right: ArrowRight, or Android KEYCODE_DPAD_RIGHT (22)
      if (key === 'ArrowRight' || keyCode === 39 || keyCode === 22) {
        e.preventDefault();
        callbacksRef.current.onRight?.();
        return;
      }

      // Up: ArrowUp, or Android KEYCODE_DPAD_UP (19)
      if (key === 'ArrowUp' || keyCode === 38 || keyCode === 19) {
        e.preventDefault();
        callbacksRef.current.onUp?.();
        return;
      }

      // Down: ArrowDown, or Android KEYCODE_DPAD_DOWN (20)
      if (key === 'ArrowDown' || keyCode === 40 || keyCode === 20) {
        e.preventDefault();
        callbacksRef.current.onDown?.();
        return;
      }

      // OK / Enter: Enter, Space, or Android KEYCODE_DPAD_CENTER (23) or KEYCODE_ENTER (66)
      if (key === 'Enter' || key === ' ' || keyCode === 13 || keyCode === 32 || keyCode === 23 || keyCode === 66) {
        e.preventDefault();
        callbacksRef.current.onSelect?.();
        return;
      }

      // Back / Esc: Escape, Backspace, 'Back', 'BrowserBack', or Android KEYCODE_BACK (4)
      if (key === 'Escape' || key === 'Backspace' || key === 'Back' || key === 'BrowserBack' || keyCode === 27 || keyCode === 8 || keyCode === 4) {
        e.preventDefault();
        callbacksRef.current.onBack?.();
        return;
      }

      // Home: Home or Android KEYCODE_HOME (3)
      if (key === 'Home' || keyCode === 36 || keyCode === 3) {
        e.preventDefault();
        callbacksRef.current.onHome?.();
        return;
      }

      // Bracket keys [ and ] for single frame scrubbing in development/debug
      if (key === '[') {
        e.preventDefault();
        callbacksRef.current.onKeyScrubStep?.(-1);
        return;
      }
      if (key === ']') {
        e.preventDefault();
        callbacksRef.current.onKeyScrubStep?.(1);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, repeatThrottleMs]);
}

