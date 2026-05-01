export type PlaylistDetailsParams = {
  id?: string | string[];
  event?: string | string[];
  dm?: string | string[];
  createdAt?: string | string[];
  mode?: string | string[];
  draftId?: string | string[];
};

export type SongItem = {
  id: string;
  tone: string;
  title: string;
  youtubeLink: string;
};

export type TonePalette = {
  background: string;
  border: string;
  text: string;
};

export type PlaylistDraft = {
  id: string;
  title: string;
  event: string;
  dm: string;
  createdAt: string;
  imageUri: string | null;
  songs: SongItem[];
  updatedAt: string;
};

export const SONG_TONES = ["C#", "D", "Gb", "A", "E", "B"] as const;
export type SongTone = (typeof SONG_TONES)[number];
