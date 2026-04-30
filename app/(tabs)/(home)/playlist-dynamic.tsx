import Octicons from "@expo/vector-icons/Octicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { type AppTheme, useAppTheme } from "../../../theme";

type PlaylistDynamicParams = {
  id?: string | string[];
  event?: string | string[];
};

type SongTabItem = {
  id: string;
  title: string;
  tone: string;
};

type ProgressionItem = {
  id: string;
  label: string;
  accent: string;
};

type TonePalette = {
  background: string;
  border: string;
  text: string;
};

const SONG_TONES = ["C#", "D", "Gb", "A", "E", "B", "G", "F"] as const;

const TONE_PALETTES: Record<string, TonePalette> = {
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

const FALLBACK_TONE_PALETTE: TonePalette = {
  background: "#64748B",
  border: "#475569",
  text: "#FFFFFF",
};

const PROGRESSION_PARTS = [
  "intro",
  "verso",
  "pré-refrão",
  "coro",
  "2x solo",
  "ponte",
  "interlúdio",
  "final",
] as const;

const STEP_ACCENTS = ["#65A30D", "#F97316", "#0E7490", "#6D28D9", "#DC2626", "#0891B2"] as const;

const PAGE_SIZE = 12;
const MAX_PROGRESSIONS = 180;
const FETCH_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getParam(value: string | string[] | undefined, fallbackValue: string) {
  if (Array.isArray(value)) {
    return value[0] ?? fallbackValue;
  }

  return value ?? fallbackValue;
}

function getTonePalette(tone: string): TonePalette {
  return TONE_PALETTES[tone] ?? FALLBACK_TONE_PALETTE;
}

function buildSongs(playlistId: string) {
  const seed = Number.parseInt(playlistId, 10) || 1;

  return Array.from({ length: 6 }, (_, index): SongTabItem => {
    const tone = SONG_TONES[(seed + index) % SONG_TONES.length];
    const number = index + 1;

    return {
      id: `${playlistId}-${number}`,
      title: `Música ${number}`,
      tone,
    };
  });
}

function buildProgressionItem(song: SongTabItem, index: number): ProgressionItem {
  const section = PROGRESSION_PARTS[index % PROGRESSION_PARTS.length];
  const cycle = Math.floor(index / PROGRESSION_PARTS.length) + 1;
  const suffix = cycle > 1 ? ` ${cycle}` : "";

  return {
    id: `${song.id}-progression-${index + 1}`,
    label: `${section}${suffix}`,
    accent: STEP_ACCENTS[index % STEP_ACCENTS.length],
  };
}

async function fetchProgressionPage(song: SongTabItem, page: number, pageSize: number) {
  await wait(FETCH_DELAY_MS);

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, MAX_PROGRESSIONS);

  if (start >= MAX_PROGRESSIONS) {
    return [];
  }

  return Array.from({ length: end - start }, (_, offset) => buildProgressionItem(song, start + offset));
}

const EMPTY_PROGRESSIONS: ProgressionItem[] = [];

export default function PlaylistDynamicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PlaylistDynamicParams>();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);
  const iconColor = resolvedMode === "dark" ? "#E6EDF3" : "#0F172A";
  const spinnerColor = resolvedMode === "dark" ? "#79C0FF" : theme.colors.primary;

  const playlistId = getParam(params.id, "0001");
  const eventName = getParam(params.event, "Culto de Domingo");
  const songs = useMemo(() => buildSongs(playlistId), [playlistId]);

  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [progressions, setProgressions] = useState<ProgressionItem[]>(EMPTY_PROGRESSIONS);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const selectedSong = songs[selectedSongIndex] ?? songs[0];
  const tonePalette = getTonePalette(selectedSong?.tone ?? "C#");

  useEffect(() => {
    if (selectedSongIndex >= songs.length) {
      setSelectedSongIndex(0);
    }
  }, [selectedSongIndex, songs.length]);

  const loadFirstPage = useCallback(async (song: SongTabItem) => {
    return fetchProgressionPage(song, 1, PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!selectedSong) {
      return;
    }

    let isMounted = true;

    const bootstrap = async () => {
      setIsInitialLoading(true);
      const firstBatch = await loadFirstPage(selectedSong);

      if (!isMounted) {
        return;
      }

      setProgressions(firstBatch);
      setPage(1);
      setHasMore(firstBatch.length === PAGE_SIZE);

      if (isMounted) {
        setIsInitialLoading(false);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadFirstPage, selectedSong]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing || !selectedSong) {
      return;
    }

    setIsRefreshing(true);
    const firstBatch = await loadFirstPage(selectedSong);
    setProgressions(firstBatch);
    setPage(1);
    setHasMore(firstBatch.length === PAGE_SIZE);
    setIsRefreshing(false);
  }, [isRefreshing, loadFirstPage, selectedSong]);

  const onEndReached = useCallback(async () => {
    if (!selectedSong || isInitialLoading || isRefreshing || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const nextBatch = await fetchProgressionPage(selectedSong, nextPage, PAGE_SIZE);
    setProgressions((current) => [...current, ...nextBatch]);
    setPage(nextPage);
    setHasMore(nextBatch.length === PAGE_SIZE);
    setIsLoadingMore(false);
  }, [hasMore, isInitialLoading, isLoadingMore, isRefreshing, page, selectedSong]);

  const onPreviousSong = useCallback(() => {
    if (songs.length === 0) {
      return;
    }

    setSelectedSongIndex((current) => (current - 1 + songs.length) % songs.length);
  }, [songs.length]);

  const onNextSong = useCallback(() => {
    if (songs.length === 0) {
      return;
    }

    setSelectedSongIndex((current) => (current + 1) % songs.length);
  }, [songs.length]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProgressionItem>) => (
      <Animated.View
        entering={FadeInDown.duration(220).delay((index % PAGE_SIZE) * 30)}
        layout={LinearTransition.duration(160)}
        style={styles.progressionCard}
      >
        <View style={[styles.progressionAccent, { backgroundColor: item.accent }]} />
        <View style={styles.progressionBody}>
          <Text style={styles.progressionLabel}>{item.label}</Text>
        </View>
      </Animated.View>
    ),
    [styles],
  );

  const keyExtractor = useCallback((item: ProgressionItem) => item.id, []);

  const footer = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={styles.footerText}>Carregando mais progressões...</Text>
        </View>
      );
    }

    if (!hasMore && progressions.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Fim da dinâmica desta música.</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, isLoadingMore, progressions.length, spinnerColor, styles]);

  const emptyState = useMemo(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={styles.emptyText}>Carregando progressão...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Sem progressões para esta música.</Text>
      </View>
    );
  }, [isInitialLoading, spinnerColor, styles]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Octicons name="arrow-left" size={20} color={iconColor} />
        </Pressable>
        <Text style={styles.headerTitle}>Dinâmica</Text>
      </View>

      <FlatList
        data={progressions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          void onEndReached();
        }}
        refreshing={isRefreshing}
        onRefresh={() => {
          void onRefresh();
        }}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(220)} style={styles.topCard}>
            <View style={styles.topCardRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.progressTitle}>Progressão</Text>
                <Text style={styles.playlistMeta}>
                  playlist#{playlistId} • {eventName}
                </Text>
              </View>

              <View style={styles.toneBlock}>
                <Text style={styles.toneLabel}>Tom:</Text>
                <View
                  style={[
                    styles.toneBadge,
                    {
                      backgroundColor: tonePalette.background,
                      borderColor: tonePalette.border,
                    },
                  ]}
                >
                  <Text style={[styles.toneValue, { color: tonePalette.text }]}>{selectedSong?.tone ?? "C#"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.songSwitcherRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Música anterior"
                onPress={onPreviousSong}
                style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
              >
                <Octicons name="arrow-left" size={20} color={iconColor} />
              </Pressable>

              <Text style={styles.songTitle}>{selectedSong?.title ?? "Música 1"}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Próxima música"
                onPress={onNextSong}
                style={({ pressed }) => [styles.arrowButton, pressed && styles.pressed]}
              >
                <Octicons name="arrow-right" size={20} color={iconColor} />
              </Pressable>
            </View>
          </Animated.View>
        }
        ListFooterComponent={footer}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";
  const pageBackground = isDark ? "#0D1117" : theme.colors.background;
  const cardBackground = isDark ? "#111827" : theme.colors.surface;
  const borderColor = isDark ? "#2D333B" : theme.colors.border;
  const mutedText = isDark ? "#8B949E" : theme.colors.textMuted;
  const normalText = isDark ? "#E6EDF3" : theme.colors.text;
  const tabBackground = isDark ? "#0B1220" : theme.colors.surfaceMuted;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: pageBackground,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: borderColor,
      backgroundColor: pageBackground,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: normalText,
      fontSize: 19,
      fontFamily: theme.fonts.semibold,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 24,
      gap: 10,
    },
    topCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      backgroundColor: cardBackground,
      padding: 12,
      gap: 12,
      marginBottom: 2,
    },
    topCardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    progressTitle: {
      color: normalText,
      fontSize: 24,
      fontFamily: theme.fonts.semibold,
    },
    playlistMeta: {
      color: mutedText,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
      marginTop: 2,
    },
    toneBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    toneLabel: {
      color: mutedText,
      fontSize: 14,
      fontFamily: theme.fonts.medium,
    },
    toneBadge: {
      minWidth: 48,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    toneValue: {
      fontSize: 18,
      fontFamily: theme.fonts.semibold,
    },
    songSwitcherRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    arrowButton: {
      width: 64,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tabBackground,
    },
    songTitle: {
      flex: 1,
      textAlign: "center",
      color: normalText,
      fontSize: 30,
      fontFamily: theme.fonts.semibold,
    },
    progressionCard: {
      flexDirection: "row",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      backgroundColor: cardBackground,
      overflow: "hidden",
      minHeight: 78,
      marginTop: 8,
    },
    progressionAccent: {
      width: 24,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    progressionBody: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    progressionLabel: {
      color: normalText,
      textAlign: "center",
      fontSize: 32,
      fontFamily: theme.fonts.medium,
      textTransform: "lowercase",
    },
    footer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 8,
    },
    footerText: {
      color: mutedText,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
      textAlign: "center",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 28,
      gap: 8,
    },
    emptyText: {
      color: mutedText,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.82,
    },
  });
}
