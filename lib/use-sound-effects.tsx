"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTiks } from "@rexa-developer/tiks/react";
import type { ThemeName } from "@rexa-developer/tiks";

interface SoundSettings {
  enabled: boolean;
  volume: number;
  theme: ThemeName;
}

interface SoundContextValue {
  settings: SoundSettings;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setTheme: (theme: ThemeName) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const DEFAULT_SETTINGS: SoundSettings = { enabled: true, volume: 0.4, theme: "soft" };

function loadSettings(): SoundSettings {
  return DEFAULT_SETTINGS;
}

function loadSettingsFromStorage(): SoundSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sana-sound-settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return null;
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(loadSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadSettingsFromStorage();
    if (stored) setSettings(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("sana-sound-settings", JSON.stringify(settings));
  }, [settings, hydrated]);

  const setEnabled = useCallback((enabled: boolean) => setSettings((s) => ({ ...s, enabled })), []);
  const setVolume = useCallback((volume: number) => setSettings((s) => ({ ...s, volume: Math.max(0, Math.min(1, volume)) })), []);
  const setTheme = useCallback((theme: ThemeName) => setSettings((s) => ({ ...s, theme })), []);

  return (
    <SoundContext.Provider value={{ settings, setEnabled, setVolume, setTheme }}>
      <SoundEngine settings={settings} />
      {children}
    </SoundContext.Provider>
  );
}

function SoundEngine({ settings }: { settings: SoundSettings }) {
  const { click, toggle, success, error, warning, hover, pop, swoosh, notify, mute, setVolume, setTheme } =
    useTiks({
      theme: settings.theme,
      volume: 0.4,
      respectReducedMotion: true,
    });

  useEffect(() => {
    if (settings.enabled) {
      setVolume(settings.volume);
    } else {
      mute();
    }
  }, [settings.enabled, settings.volume, setVolume, mute]);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  useEffect(() => {
    const handlePlaySound = (e: Event) => {
      const sound = (e as CustomEvent<string>).detail;
      if (!settings.enabled) return;
      const sounds: Record<string, () => void> = {
        click,
        toggle: () => toggle(true),
        success,
        error,
        warning,
        hover,
        pop,
        swoosh,
        notify,
      };
      sounds[sound]?.();
    };

    window.addEventListener("sana:play-sound", handlePlaySound);
    return () => window.removeEventListener("sana:play-sound", handlePlaySound);
  }, [settings.enabled, click, toggle, success, error, warning, hover, pop, swoosh, notify]);

  return null;
}

export function useSoundEffects() {
  const ctx = useContext(SoundContext);
  const enabled = ctx?.settings.enabled ?? true;

  const play = useCallback(
    (sound: string) => {
      if (!enabled) return;
      window.dispatchEvent(new CustomEvent("sana:play-sound", { detail: sound }));
    },
    [enabled]
  );

  return {
    play,
    playXpGain: useCallback(() => play("pop"), [play]),
    playLevelUp: useCallback(() => play("success"), [play]),
    playAchievement: useCallback(() => play("swoosh"), [play]),
    playMilestone: useCallback(() => play("notify"), [play]),
    playQuestComplete: useCallback(() => play("success"), [play]),
    playClick: useCallback(() => play("click"), [play]),
    playError: useCallback(() => play("error"), [play]),
    playWarning: useCallback(() => play("warning"), [play]),
    playHover: useCallback(() => play("hover"), [play]),
    playToggle: useCallback(() => {
      if (!enabled) return;
      window.dispatchEvent(new CustomEvent("sana:play-sound", { detail: "toggle" }));
    }, [enabled]),
  };
}

export function useSoundSettings() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSoundSettings must be used within SoundProvider");
  return ctx;
}
