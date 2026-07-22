"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SOUND_STORAGE_KEY = "study-flow:v1:sound";
export const CORRECT_SOUND_PATH = "/assets/correct-answer.mp3";

export function useCorrectAnswerSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(SOUND_STORAGE_KEY) !== "false");
    } catch {
      setEnabled(true);
    }
    if (typeof window.Audio === "function") {
      try {
        const audio = new window.Audio(CORRECT_SOUND_PATH);
        audio.preload = "auto";
        audioRef.current = audio;
      } catch {
        audioRef.current = null;
      }
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const setSoundEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(value));
    } catch {
      return;
    }
  }, []);

  const play = useCallback(() => {
    if (!enabled || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    } catch {
      return;
    }
  }, [enabled]);

  return { enabled, setEnabled: setSoundEnabled, play };
}
