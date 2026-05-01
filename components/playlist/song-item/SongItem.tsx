import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Octicons from "@expo/vector-icons/Octicons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { SongItem } from "../shared/types";
import { getTonePalette } from "../shared/utils";

type Props = {
  item: SongItem;
  index: number;
  styles: ReturnType<typeof createSongItemStyles>;
};

export function PlaylistSongItem({ item, index, styles }: Props): ReactNode {
  const tonePalette = getTonePalette(item.tone);

  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(40 + index * 28)}
      style={styles.songRow}
    >
      <View style={styles.songLeft}>
        <View
          style={[
            styles.toneBadge,
            {
              backgroundColor: tonePalette.background,
              borderColor: tonePalette.border,
            },
          ]}
        >
          <Text style={[styles.toneText, { color: tonePalette.text }]}>
            {item.tone}
          </Text>
        </View>

        <View style={styles.songTextBlock}>
          <Text style={styles.songName}>{item.title}</Text>
          <View style={styles.songLinkRow}>
            <Octicons
              name="link"
              size={11}
              color={styles.songLinkText.color as string}
            />
            <Text style={styles.songLinkText} numberOfLines={1}>
              {item.youtubeLink}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.songBadgeRight}>
        <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
      </View>
    </Animated.View>
  );
}

export function createSongItemStyles(
  borderColor: string,
  isDark: boolean,
  themeColors: any,
) {
  return {
    songRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      borderWidth: 0.5,
      borderColor,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      backgroundColor: isDark ? "#0B1220" : themeColors.surface,
      gap: 12,
    },
    songLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      flex: 1,
    },
    songTextBlock: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    toneBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 0.5,
      borderColor,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: isDark ? "#131C2E" : themeColors.surfaceMuted,
    },
    toneText: {
      fontSize: 14,
      fontFamily: themeColors.semibold,
    },
    songName: {
      color: isDark ? "#E6EDF3" : themeColors.text,
      fontSize: 15,
      fontFamily: themeColors.medium,
    },
    songLinkRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 5,
    },
    songLinkText: {
      color: isDark ? "#94A3B8" : themeColors.textMuted,
      fontSize: 12,
      fontFamily: themeColors.regular,
      flexShrink: 1,
    },
    songBadgeRight: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 0.5,
      borderColor: "#CC0000",
      backgroundColor: isDark ? "#2A0F0F" : "#FFF1F2",
    },
  };
}
