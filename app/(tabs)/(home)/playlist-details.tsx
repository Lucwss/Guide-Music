import Octicons from "@expo/vector-icons/Octicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { type AppTheme, useAppTheme } from "../../../theme";

type PlaylistDetailsParams = {
  id?: string | string[];
  event?: string | string[];
  dm?: string | string[];
  createdAt?: string | string[];
};

type SongItem = {
  id: string;
  tone: string;
  title: string;
};

type TonePalette = {
  background: string;
  border: string;
  text: string;
};

const SONG_TONES = ["C#", "D", "Gb", "A", "E", "B"] as const;
const YOUTUBE_RED = "#FF0000";
const YOUTUBE_RED_DARK = "#CC0000";
const RELOAD_DELAY_MS = 380;

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

function getParam(value: string | string[] | undefined, fallbackValue: string) {
  if (Array.isArray(value)) {
    return value[0] ?? fallbackValue;
  }

  return value ?? fallbackValue;
}

function buildSongs(playlistId: string, seedOffset = 0) {
  const seed = (Number.parseInt(playlistId, 10) || 1) + seedOffset;

  return Array.from({ length: 4 }, (_, index): SongItem => {
    const tone = SONG_TONES[(seed + index) % SONG_TONES.length];
    const number = index + 1;

    return {
      id: `${playlistId}-${number}`,
      tone,
      title: `Música ${number}`,
    };
  });
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getTonePalette(tone: string): TonePalette {
  return TONE_PALETTES[tone] ?? FALLBACK_TONE_PALETTE;
}

export default function PlaylistDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PlaylistDetailsParams>();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);
  const iconColor = resolvedMode === "dark" ? "#E6EDF3" : "#0F172A";
  const primaryAccent = resolvedMode === "dark" ? "#7AB7FF" : "#2563EB";
  const spinnerColor = resolvedMode === "dark" ? "#E6EDF3" : "#334155";

  const playlistId = getParam(params.id, "0001");
  const eventName = getParam(params.event, "Culto de Domingo");
  const dmName = getParam(params.dm, "Anderson");
  const createdAt = getParam(params.createdAt, "10/03/2026");
  const [reloadTick, setReloadTick] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const songs = useMemo(() => buildSongs(playlistId, reloadTick), [playlistId, reloadTick]);

  const onReload = useCallback(async () => {
    if (isReloading) {
      return;
    }

    setIsReloading(true);
    await wait(RELOAD_DELAY_MS);
    setReloadTick((current) => current + 1);
    setIsReloading(false);
  }, [isReloading]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Octicons name="arrow-left" size={20} color={iconColor} />
          </Pressable>
          <Text style={styles.headerTitle}>Playlist</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recarregar detalhes da playlist"
          onPress={() => {
            void onReload();
          }}
          style={({ pressed }) => [styles.reloadButton, pressed && styles.pressed]}
        >
          {isReloading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : (
            <MaterialCommunityIcons name="reload" size={20} color={iconColor} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(220)} style={styles.hero}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={26} color={styles.placeholderIcon.color} />
            <Text style={styles.placeholderText}>Imagem (upload)</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(30)} style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryLeftBlock}>
              <Text style={styles.playlistTitle}>playlist#{playlistId}</Text>
              <Text style={styles.eventSubtitle}>{eventName}</Text>
            </View>

            <View style={styles.createdAtBlock}>
              <Text style={styles.metaLabel}>Data de criação</Text>
              <Text style={styles.metaValue}>{createdAt}</Text>
            </View>
          </View>

          <View style={styles.dmBlock}>
            <Text style={styles.metaLabel}>DM</Text>
            <Text style={styles.metaValue}>{dmName}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(60)} style={styles.songSection}>
          <Text style={styles.sectionTitle}>Músicas</Text>

          <View style={styles.songList}>
            {songs.map((song, index) => (
              <Animated.View
                key={song.id}
                entering={FadeInDown.duration(220).delay(90 + index * 40)}
                style={styles.songRow}
              >
                <View style={styles.songLeft}>
                  <View
                    style={[
                      styles.toneBadge,
                      {
                        backgroundColor: getTonePalette(song.tone).background,
                        borderColor: getTonePalette(song.tone).border,
                      },
                    ]}
                  >
                    <Text style={[styles.toneText, { color: getTonePalette(song.tone).text }]}>
                      {song.tone}
                    </Text>
                  </View>
                  <Text style={styles.songName}>{song.title}</Text>
                </View>

                <Pressable style={({ pressed }) => [styles.youtubeButton, pressed && styles.pressed]}>
                  <Text style={styles.youtubeText}>Link YouTube</Text>
                  <Octicons name="play" size={14} color="#FFFFFF" />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(80)} style={styles.dynamicWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir dinâmica da playlist"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(home)/playlist-dynamic",
                params: {
                  id: playlistId,
                  event: eventName,
                  dm: dmName,
                  createdAt,
                },
              } as Href)
            }
            style={({ pressed }) => [styles.dynamicButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={20}
              color={primaryAccent}
            />
            <Text style={styles.dynamicButtonText}>ver dinâmica</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";
  const cardBackground = isDark ? "#111827" : theme.colors.surface;
  const borderColor = isDark ? "#2D333B" : theme.colors.border;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? "#0D1117" : theme.colors.background,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2D333B" : theme.colors.border,
      backgroundColor: isDark ? "#0D1117" : theme.colors.background,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    reloadButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 19,
      fontFamily: theme.fonts.semibold,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
    },
    hero: {
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: cardBackground,
    },
    imagePlaceholder: {
      minHeight: 170,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    placeholderIcon: {
      color: isDark ? "#94A3B8" : theme.colors.textMuted,
    },
    placeholderText: {
      color: isDark ? "#C9D1D9" : theme.colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.medium,
    },
    summaryCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      backgroundColor: cardBackground,
      padding: 14,
      gap: 10,
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    summaryLeftBlock: {
      flex: 1,
      minWidth: 0,
    },
    createdAtBlock: {
      alignItems: "flex-end",
    },
    dmBlock: {
      alignItems: "flex-start",
    },
    playlistTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 21,
      fontFamily: theme.fonts.semibold,
      textTransform: "lowercase",
    },
    eventSubtitle: {
      color: isDark ? "#B9C5D1" : theme.colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.medium,
      lineHeight: 21,
    },
    metaLabel: {
      color: isDark ? "#8B949E" : theme.colors.textMuted,
      fontSize: 12,
      fontFamily: theme.fonts.regular,
    },
    metaValue: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.medium,
      marginTop: 2,
    },
    songSection: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      backgroundColor: cardBackground,
      padding: 12,
      gap: 10,
    },
    sectionTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.semibold,
    },
    songList: {
      gap: 8,
    },
    songRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: isDark ? "#0B1220" : theme.colors.surface,
      gap: 12,
    },
    songLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    toneBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#131C2E" : theme.colors.surfaceMuted,
    },
    toneText: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.semibold,
    },
    songName: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 15,
      fontFamily: theme.fonts.medium,
    },
    youtubeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: 124,
      borderWidth: 1,
      borderColor: YOUTUBE_RED_DARK,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      gap: 6,
      backgroundColor: YOUTUBE_RED,
    },
    youtubeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontFamily: theme.fonts.semibold,
    },
    dynamicWrap: {
      alignItems: "stretch",
    },
    dynamicButton: {
      width: "100%",
      minHeight: 58,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 14,
      backgroundColor: isDark ? "#111827" : theme.colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 18,
      gap: 10,
    },
    dynamicButtonText: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.medium,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
