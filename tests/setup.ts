import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

export const audioMocks = {
  play: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  pause: vi.fn(),
  instances: [] as MockAudio[],
};

class MockAudio {
  src: string;
  preload = "";
  currentTime = 0;
  play = audioMocks.play;
  pause = audioMocks.pause;

  constructor(src = "") {
    this.src = src;
    audioMocks.instances.push(this);
  }
}

vi.stubGlobal("Audio", MockAudio);

afterEach(() => {
  cleanup();
  localStorage.clear();
  audioMocks.play.mockReset().mockResolvedValue(undefined);
  audioMocks.pause.mockReset();
  audioMocks.instances.length = 0;
  vi.restoreAllMocks();
});
