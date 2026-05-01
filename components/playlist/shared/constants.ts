import type { TonePalette } from "./types";

export const SONG_PAGE_SIZE = 6;
export const MAX_SONGS = 60;
export const SONG_LOAD_DELAY_MS = 420;
export const YOUTUBE_RED = "#FF0000";
export const YOUTUBE_RED_DARK = "#CC0000";
export const RELOAD_DELAY_MS = 380;
export const UPLOAD_SIMULATED_DELAY_MS = 280;
export const DRAFT_STORAGE_KEY_PREFIX = "@guidemusic:playlist-draft:";

export const TONE_PALETTES: Record<string, TonePalette> = {
  C: { background: "#F97316", border: "#EA580C", text: "#FFFFFF" },
  "C#": { background: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  Db: { background: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  D: { background: "#EC4899", border: "#DB2777", text: "#FFFFFF" },
  "D#": { background: "#A855F7", border: "#9333EA", text: "#FFFFFF" },
  Eb: { background: "#A855F7", border: "#9333EA", text: "#FFFFFF" },
  E: { background: "#6366F1", border: "#4F46E5", text: "#FFFFFF" },
  F: { background: "#3B82F6", border: "#2563EB", text: "#FFFFFF" },
  "F#": { background: "#06B6D4", border: "#0891B2", text: "#FFFFFF" },
  Gb: { background: "#06B6D4", border: "#0891B2", text: "#FFFFFF" },
  G: { background: "#10B981", border: "#059669", text: "#FFFFFF" },
  "G#": { background: "#84CC16", border: "#65A30D", text: "#0F172A" },
  Ab: { background: "#84CC16", border: "#65A30D", text: "#0F172A" },
  A: { background: "#EAB308", border: "#CA8A04", text: "#0F172A" },
  "A#": { background: "#F59E0B", border: "#D97706", text: "#0F172A" },
  Bb: { background: "#F59E0B", border: "#D97706", text: "#0F172A" },
  B: { background: "#FB7185", border: "#F43F5E", text: "#FFFFFF" },
};

export const FALLBACK_TONE_PALETTE: TonePalette = {
  background: "#64748B",
  border: "#475569",
  text: "#FFFFFF",
};
