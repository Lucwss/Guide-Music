import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  playlistTitle: string;
  playlistEvent: string;
  playlistDm: string;
  createdAt: string;
  isCreateMode: boolean;
  hasSummaryInfo: boolean;
  styles: any;
  onOpenEditDialog: () => void;
};

export function PlaylistSummaryCard({
  playlistTitle,
  playlistEvent,
  playlistDm,
  createdAt,
  isCreateMode,
  hasSummaryInfo,
  styles,
  onOpenEditDialog,
}: Props): ReactNode {
  const shouldShowPlaceholder = isCreateMode && !hasSummaryInfo;

  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(30)}
      style={[styles.summaryCard, isCreateMode && styles.summaryCardEditable]}
    >
      {isCreateMode && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar informações da playlist"
          onPress={onOpenEditDialog}
          style={({ pressed }) => [
            styles.editCardButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>
      )}

      {shouldShowPlaceholder ? (
        <View style={styles.summaryPlaceholder}>
          <MaterialCommunityIcons
            name="calendar-edit"
            size={28}
            color={styles.placeholderIcon.color}
          />
          <Text style={styles.placeholderText}>Dados da playlist</Text>
        </View>
      ) : (
        <View style={styles.summaryContent}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryLeftBlock}>
              <Text style={styles.playlistTitle}>{playlistTitle}</Text>
              <Text style={styles.eventSubtitle}>{playlistEvent}</Text>
            </View>

            {!isCreateMode && (
              <View style={styles.createdAtBlock}>
                <Text style={styles.metaLabel}>Data de criação</Text>
                <Text style={styles.metaValue}>{createdAt}</Text>
              </View>
            )}
          </View>

          {playlistDm.trim().length > 0 && (
            <View style={styles.dmBlock}>
              <Text style={styles.metaLabel}>DM</Text>
              <Text style={styles.metaValue}>{playlistDm}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}
