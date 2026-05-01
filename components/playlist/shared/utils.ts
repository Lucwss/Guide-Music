import { FALLBACK_TONE_PALETTE, TONE_PALETTES } from "./constants";
import type { SongItem, TonePalette } from "./types";
import { SONG_TONES } from "./types";

export function getParam(
  value: string | string[] | undefined,
  fallbackValue: string,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallbackValue;
  }

  return value ?? fallbackValue;
}

export function buildSong(playlistId: string, index: number): SongItem {
  const tone = SONG_TONES[index % SONG_TONES.length];
  const number = index + 1;

  return {
    id: `${playlistId}-song-${String(number).padStart(3, "0")}`,
    tone,
    title: `Música ${number}`,
    youtubeLink: `https://youtube.com/watch?v=${playlistId}-${number}`,
  };
}

export function buildSongsPage(
  playlistId: string,
  startIndex: number,
  size: number,
): SongItem[] {
  return Array.from({ length: size }, (_, offset) =>
    buildSong(playlistId, startIndex + offset),
  );
}

export function isSongItem(value: unknown): value is SongItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SongItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.tone === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.youtubeLink === "string"
  );
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getPickedAssetUri(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const pickerResult = result as {
    canceled?: boolean;
    cancelled?: boolean;
    uri?: string;
    assets?: { uri?: string }[];
  };

  if (pickerResult.canceled || pickerResult.cancelled) {
    return null;
  }

  if (Array.isArray(pickerResult.assets) && pickerResult.assets.length > 0) {
    return pickerResult.assets[0]?.uri ?? null;
  }

  if (typeof pickerResult.uri === "string") {
    return pickerResult.uri;
  }

  return null;
}

export function getTonePalette(tone: string): TonePalette {
  return TONE_PALETTES[tone] ?? FALLBACK_TONE_PALETTE;
}
