/**
 * Safe speech-to-text hook that gracefully degrades
 * when the native module isn't available (e.g. Expo Go).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";

// Dynamically load the native module — returns null in Expo Go
let SpeechModule: any = null;

try {
  const mod = require("expo-speech-recognition");
  SpeechModule = mod.ExpoSpeechRecognitionModule;
} catch {
  // expo-speech-recognition native module not available
}

export interface SpeechToTextState {
  /** Whether the native speech module is available on this device / build */
  isAvailable: boolean;
  /** Whether speech recognition is currently active */
  isListening: boolean;
  /** Interim (not-yet-final) transcript while listening */
  liveTranscript: string;
  /** Start or stop dictation */
  toggleDictation: () => Promise<void>;
}

/**
 * Hook that provides speech-to-text dictation.
 *
 * @param onTranscript  Called with the final transcript text each time a
 *                      speech segment is recognized.
 */
export function useSpeechToText(
  onTranscript: (text: string) => void,
): SpeechToTextState {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  // Keep a stable ref to the callback so the effect doesn't re-subscribe
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  // Subscribe to speech events (only when native module is present)
  useEffect(() => {
    if (!SpeechModule) return;

    const subscriptions = [
      SpeechModule.addListener("start", () => {
        setIsListening(true);
        setLiveTranscript("");
      }),
      SpeechModule.addListener("end", () => {
        setIsListening(false);
        setLiveTranscript("");
      }),
      SpeechModule.addListener("result", (event: any) => {
        const transcript: string = event.results?.[0]?.transcript ?? "";
        if (event.isFinal) {
          if (transcript.trim()) onTranscriptRef.current(transcript);
          setLiveTranscript("");
        } else {
          setLiveTranscript(transcript);
        }
      }),
      SpeechModule.addListener("error", (event: any) => {
        setIsListening(false);
        setLiveTranscript("");
        if (event.error !== "no-speech" && event.error !== "client") {
          Alert.alert(
            "Speech Error",
            `${event.error}: ${event.message || "Speech recognition failed"}`,
          );
        }
      }),
    ];

    return () => {
      subscriptions.forEach((sub: any) => sub.remove());
    };
  }, []);

  const toggleDictation = useCallback(async () => {
    if (!SpeechModule) return;

    if (isListening) {
      SpeechModule.stop();
      return;
    }

    const result = await SpeechModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert(
        "Permission Required",
        "Microphone and speech recognition permissions are needed for dictation. Please enable them in Settings.",
      );
      return;
    }

    setIsListening(true);
    SpeechModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: true,
    });
  }, [isListening]);

  return {
    isAvailable: SpeechModule != null,
    isListening,
    liveTranscript,
    toggleDictation,
  };
}
