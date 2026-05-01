import Octicons from "@expo/vector-icons/Octicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { type AppTheme, useAppTheme } from "../../../theme";

type ServicePlaylist = {
  id: string;
  event: string;
  dm: string;
  createdAt: string;
};

const EVENTS = [
  "Culto de domingo",
  "Culto dos Jovens",
  "Rede de Homens",
  "Rede de Mulheres",
  "Culto de oração",
  "Santa Ceia",
  "Vigília",
  "Culto de ensino",
] as const;

const DMS = [
  "Anderson",
  "Lucas",
  "Marcos",
  "Rafaela",
] as const;

const PAGE_SIZE = 8;
const MAX_PLAYLISTS = 80;
const FETCH_DELAY_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildPlaylist(index: number): ServicePlaylist {
  const id = String(index + 1).padStart(4, "0");
  const event = EVENTS[index % EVENTS.length];
  const dm = DMS[index % DMS.length];
  const created = new Date().toLocaleDateString("pt-BR");

  return {
    id,
    event,
    dm,
    createdAt: created,
  };
}

async function fetchPlaylistsPage(page: number, pageSize: number) {
  await wait(FETCH_DELAY_MS);

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, MAX_PLAYLISTS);

  if (start >= MAX_PLAYLISTS) {
    return [];
  }

  return Array.from({ length: end - start }, (_, offset) => buildPlaylist(start + offset));
}

const EMPTY_PLAYLISTS: ServicePlaylist[] = [];

export default function PlaylistScreen() {
  const router = useRouter();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);
  const iconColor = resolvedMode === "dark" ? "#E6EDF3" : "#0F172A";
  const spinnerColor = resolvedMode === "dark" ? "#79C0FF" : theme.colors.primary;
  const worshipIconColor = resolvedMode === "dark" ? "#7AB7FF" : "#2563EB";
  const listRef = useRef<FlatList<ServicePlaylist>>(null);
  const nextCustomIdRef = useRef(MAX_PLAYLISTS + 1);

  const [playlists, setPlaylists] = useState<ServicePlaylist[]>(EMPTY_PLAYLISTS);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const onAddPlaylist = useCallback(() => {
    const idNumber = nextCustomIdRef.current;
    nextCustomIdRef.current += 1;

    const customPlaylist: ServicePlaylist = {
      id: String(idNumber).padStart(4, "0"),
      event: "",
      dm: "",
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    router.push({
      pathname: "/(tabs)/(home)/playlist-details",
      params: {
        id: customPlaylist.id,
        event: customPlaylist.event,
        dm: customPlaylist.dm,
        createdAt: customPlaylist.createdAt,
        mode: "create",
        draftId: `draft-${customPlaylist.id}-${Date.now()}`,
      },
    } as Href);
  }, [router]);

  const loadFirstPage = useCallback(async () => {
    const firstBatch = await fetchPlaylistsPage(1, PAGE_SIZE);
    setPlaylists(firstBatch);
    setPage(1);
    setHasMore(firstBatch.length === PAGE_SIZE);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsInitialLoading(true);
      await loadFirstPage();

      if (isMounted) {
        setIsInitialLoading(false);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [loadFirstPage]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    await loadFirstPage();
    setIsRefreshing(false);
  }, [isRefreshing, loadFirstPage]);

  const onEndReached = useCallback(async () => {
    if (isInitialLoading || isRefreshing || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const nextBatch = await fetchPlaylistsPage(nextPage, PAGE_SIZE);
    setPlaylists((current) => [...current, ...nextBatch]);
    setPage(nextPage);
    setHasMore(nextBatch.length === PAGE_SIZE);
    setIsLoadingMore(false);
  }, [hasMore, isInitialLoading, isLoadingMore, isRefreshing, page]);

  const onOpenPlaylistDetails = useCallback(
    (playlist: ServicePlaylist) => {
      router.push({
        pathname: "/(tabs)/(home)/playlist-details",
        params: {
          id: playlist.id,
          event: playlist.event,
          dm: playlist.dm,
          createdAt: playlist.createdAt,
        },
      } as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ServicePlaylist>) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir playlist ${item.id}`}
        onPress={() => onOpenPlaylistDetails(item)}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
      >
        <Animated.View
          entering={FadeInDown.duration(220).delay((index % PAGE_SIZE) * 32)}
          layout={LinearTransition.duration(160)}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTextBlock}>
              <Text style={styles.title}>playlist#{item.id}</Text>
              <Text style={styles.subtitle}>{item.event}</Text>
              <Text style={styles.meta}>DM: {item.dm}</Text>
              <Text style={styles.meta}>created: {item.createdAt}</Text>
            </View>
            <View style={styles.worshipIconBox}>
              <MaterialCommunityIcons name="hands-pray" size={22} color={worshipIconColor} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    ),
    [onOpenPlaylistDetails, styles, worshipIconColor],
  );

  const keyExtractor = useCallback((item: ServicePlaylist) => item.id, []);

  const footer = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={styles.footerText}>Carregando mais playlists...</Text>
        </View>
      );
    }

    if (!hasMore && playlists.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Você chegou ao final da lista.</Text>
        </View>
      );
    }

    return null;
  }, [hasMore, isLoadingMore, playlists.length, spinnerColor, styles]);

  const emptyState = useMemo(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={styles.emptyText}>Carregando playlists...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Nenhuma playlist encontrada.</Text>
      </View>
    );
  }, [isInitialLoading, spinnerColor, styles]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.leftHeaderContent}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Octicons name="arrow-left" size={20} color={iconColor} />
          </Pressable>
          <Text style={styles.pageTitle}>Playlists dos cultos</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova playlist"
          onPress={onAddPlaylist}
          style={({ pressed }) => [styles.addButton, pressed && styles.backButtonPressed]}
        >
          <Octicons name="plus" size={19} color={iconColor} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={playlists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          void onEndReached();
        }}
        ListFooterComponent={footer}
        ListEmptyComponent={emptyState}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";

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
    leftHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    addButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#2D333B" : theme.colors.border,
      backgroundColor: isDark ? "#131C2E" : theme.colors.surface,
    },
    backButtonPressed: {
      opacity: 0.75,
    },
    pageTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 22,
      fontFamily: theme.fonts.semibold,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
      flexGrow: 1,
    },
    card: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#2D333B" : theme.colors.border,
      backgroundColor: isDark ? "#111827" : theme.colors.surface,
    },
    cardPressable: {
      marginBottom: 12,
    },
    cardPressed: {
      opacity: 0.8,
    },
    cardContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardTextBlock: {
      flex: 1,
      gap: 4,
    },
    worshipIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#2D333B" : theme.colors.border,
      backgroundColor: isDark ? "#131C2E" : theme.colors.surfaceMuted,
    },
    title: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 17,
      fontFamily: theme.fonts.semibold,
    },
    subtitle: {
      color: isDark ? "#C9D1D9" : theme.colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.medium,
    },
    meta: {
      color: isDark ? "#94A3B8" : theme.colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
      marginTop: 2,
    },
    footer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    footerText: {
      color: isDark ? "#94A3B8" : theme.colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 240,
    },
    emptyText: {
      color: isDark ? "#94A3B8" : theme.colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
    },
  });
}
