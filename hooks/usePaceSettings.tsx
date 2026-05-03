/**
 * Pace Settings Hook + Context
 * Persists threshold pace and easy pace via AsyncStorage.
 * Shared across screens so updates in preview or settings reflect everywhere.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_THRESHOLD = "pace_threshold";
const STORAGE_KEY_EASY = "pace_easy";

interface PaceSettings {
  thresholdPace: string;
  easyPace: string;
}

interface PaceSettingsContextValue {
  /** Current stored values (empty string = not set) */
  paceSettings: PaceSettings;
  /** Whether settings have been loaded from storage */
  loaded: boolean;
  /** Update threshold pace (persists to AsyncStorage) */
  setThresholdPace: (pace: string) => Promise<void>;
  /** Update easy pace (persists to AsyncStorage) */
  setEasyPace: (pace: string) => Promise<void>;
  /** Convenience: returns true if at least one pace is stored */
  hasPaceData: boolean;
}

const PaceSettingsContext = createContext<PaceSettingsContextValue | null>(
  null,
);

export function PaceSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [paceSettings, setPaceSettings] = useState<PaceSettings>({
    thresholdPace: "",
    easyPace: "",
  });
  const [loaded, setLoaded] = useState(false);

  // Load stored paces on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [threshold, easy] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_THRESHOLD),
          AsyncStorage.getItem(STORAGE_KEY_EASY),
        ]);
        setPaceSettings({
          thresholdPace: threshold ?? "",
          easyPace: easy ?? "",
        });
      } catch (err) {
        console.warn("[PaceSettings] Failed to load:", err);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const setThresholdPace = useCallback(async (pace: string) => {
    const trimmed = pace.trim();
    try {
      if (trimmed) {
        await AsyncStorage.setItem(STORAGE_KEY_THRESHOLD, trimmed);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_THRESHOLD);
      }
      setPaceSettings((prev) => ({ ...prev, thresholdPace: trimmed }));
    } catch (err) {
      console.warn("[PaceSettings] Failed to save threshold:", err);
    }
  }, []);

  const setEasyPace = useCallback(async (pace: string) => {
    const trimmed = pace.trim();
    try {
      if (trimmed) {
        await AsyncStorage.setItem(STORAGE_KEY_EASY, trimmed);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_EASY);
      }
      setPaceSettings((prev) => ({ ...prev, easyPace: trimmed }));
    } catch (err) {
      console.warn("[PaceSettings] Failed to save easy pace:", err);
    }
  }, []);

  const hasPaceData =
    paceSettings.thresholdPace.length > 0 || paceSettings.easyPace.length > 0;

  const value: PaceSettingsContextValue = {
    paceSettings,
    loaded,
    setThresholdPace,
    setEasyPace,
    hasPaceData,
  };

  return React.createElement(PaceSettingsContext.Provider, { value }, children);
}

/**
 * Hook to access shared pace settings. Must be used within PaceSettingsProvider.
 */
export function usePaceSettings(): PaceSettingsContextValue {
  const context = useContext(PaceSettingsContext);
  if (!context) {
    throw new Error(
      "usePaceSettings must be used within a PaceSettingsProvider",
    );
  }
  return context;
}
