import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { audioMocks } from "../setup";
import { CORRECT_SOUND_PATH, SOUND_STORAGE_KEY, useCorrectAnswerSound } from "@/hooks/useCorrectAnswerSound";

describe("useCorrectAnswerSound", () => {
  it("creates and preloads the correct-answer asset", async () => {
    renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    expect(audioMocks.instances[0]).toMatchObject({ src: CORRECT_SOUND_PATH, preload: "auto" });
  });

  it("plays exactly once when requested for a correct answer", async () => {
    const { result } = renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    act(() => result.current.play());
    expect(audioMocks.play).toHaveBeenCalledTimes(1);
    expect(audioMocks.instances[0].currentTime).toBe(0);
  });

  it("does not play merely because the hook mounts or restores", async () => {
    renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("does not play while disabled and persists the preference", async () => {
    const { result } = renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    act(() => result.current.setEnabled(false));
    act(() => result.current.play());
    expect(audioMocks.play).not.toHaveBeenCalled();
    expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe("false");
  });

  it("restores a disabled preference without playback", async () => {
    localStorage.setItem(SOUND_STORAGE_KEY, "false");
    const { result } = renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(audioMocks.play).not.toHaveBeenCalled();
  });

  it("safely ignores a rejected playback promise", async () => {
    audioMocks.play.mockRejectedValueOnce(new Error("blocked"));
    const { result } = renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    expect(() => act(() => result.current.play())).not.toThrow();
    await Promise.resolve();
    expect(audioMocks.play).toHaveBeenCalledTimes(1);
  });

  it("pauses the audio resource on unmount", async () => {
    const { unmount } = renderHook(() => useCorrectAnswerSound());
    await waitFor(() => expect(audioMocks.instances).toHaveLength(1));
    unmount();
    expect(audioMocks.pause).toHaveBeenCalledTimes(1);
  });
});
