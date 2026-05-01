import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { SongItem } from "../shared/types";

type Props = {
  songs: SongItem[];
  isCreateMode: boolean;
  isSongsLoading: boolean;
  isLoadingMoreSongs: boolean;
  hasMoreSongs: boolean;
  styles: any;
  spinnerColor: string;
  onLoadMoreSongs: () => void;
  onOpenSongDialog: () => void;
  renderSongItem: (info: ListRenderItemInfo<SongItem>) => ReactNode;
};

export function PlaylistSongListSection({
  songs,
  isCreateMode,
  isSongsLoading,
  isLoadingMoreSongs,
  hasMoreSongs,
  styles,
  spinnerColor,
  onLoadMoreSongs,
  onOpenSongDialog,
  renderSongItem,
}: Props): ReactNode {
  return (
    <Animated.View
      entering={FadeInDown.duration(220).delay(60)}
      style={styles.songSection}
    >
      <View style={styles.songSectionHeader}>
        <Text style={styles.sectionTitle}>Músicas</Text>
        {(isSongsLoading || isLoadingMoreSongs) && (
          <ActivityIndicator size="small" color={spinnerColor} />
        )}
      </View>

      <View style={styles.songListContainer}>
        {songs.length === 0 && !isSongsLoading ? (
          <View style={styles.songEmptyState}>
            <MaterialCommunityIcons
              name="playlist-music-outline"
              size={42}
              color={styles.placeholderIcon.color}
            />
            <Text style={styles.songEmptyText}>Nenhuma música adicionada.</Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: 300 }}
            contentContainerStyle={styles.songListContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {songs.map((item, index) => (
              <View key={item.id}>
                {renderSongItem({
                  item,
                  index,
                  separators: {
                    highlight: () => {},
                    unhighlight: () => {},
                    updateProps: () => {},
                  },
                })}
              </View>
            ))}

            <View style={styles.songFooter}>
              {isLoadingMoreSongs ? (
                <ActivityIndicator size="small" color={spinnerColor} />
              ) : hasMoreSongs ? (
                <Pressable onPress={onLoadMoreSongs}>
                  <Text style={styles.songFooterText}>
                    Carregar mais músicas
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.songFooterText}>
                  Você chegou ao fim da lista.
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {isCreateMode && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar música"
          onPress={onOpenSongDialog}
          style={({ pressed }) => [
            styles.addSongFab,
            pressed && styles.addSongFabPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="playlist-plus"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      )}
    </Animated.View>
  );
}
