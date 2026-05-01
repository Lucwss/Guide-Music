import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Octicons from "@expo/vector-icons/Octicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../auth/provider";
import { type AppTheme, useAppTheme } from "../../../theme";

type PlaylistDetailsParams = {
  id?: string | string[];
  event?: string | string[];
  dm?: string | string[];
  createdAt?: string | string[];
  mode?: string | string[];
  draftId?: string | string[];
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

type PlaylistDraft = {
  id: string;
  title: string;
  event: string;
  dm: string;
  createdAt: string;
  imageUri: string | null;
  updatedAt: string;
};

const SONG_TONES = ["C#", "D", "Gb", "A", "E", "B"] as const;
const YOUTUBE_RED = "#FF0000";
const YOUTUBE_RED_DARK = "#CC0000";
const RELOAD_DELAY_MS = 380;
const UPLOAD_SIMULATED_DELAY_MS = 280;
const DRAFT_STORAGE_KEY_PREFIX = "@guidemusic:playlist-draft:";

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

function getPickedAssetUri(result: unknown): string | null {
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

function getTonePalette(tone: string): TonePalette {
  return TONE_PALETTES[tone] ?? FALLBACK_TONE_PALETTE;
}

export default function PlaylistDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PlaylistDetailsParams>();
  const { registeredUsers, user } = useAuth();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);
  const iconColor = resolvedMode === "dark" ? "#E6EDF3" : "#0F172A";
  const primaryAccent = resolvedMode === "dark" ? "#7AB7FF" : "#2563EB";
  const spinnerColor = resolvedMode === "dark" ? "#E6EDF3" : "#334155";
  const todayDate = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  const playlistId = getParam(params.id, "0001");
  const mode = getParam(params.mode, "view");
  const isCreateMode = mode === "create";
  const eventName = getParam(
    params.event,
    isCreateMode ? "" : "Culto de Domingo",
  );
  const dmName = getParam(params.dm, isCreateMode ? "" : "Anderson");
  const createdAt = isCreateMode
    ? todayDate
    : getParam(params.createdAt, todayDate);
  const draftId = getParam(params.draftId, `draft-${playlistId}`);
  const draftStorageKey = `${DRAFT_STORAGE_KEY_PREFIX}${draftId}`;
  const [reloadTick, setReloadTick] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(isCreateMode);
  const [playlistTitle, setPlaylistTitle] = useState(
    isCreateMode ? "" : `playlist#${playlistId}`,
  );
  const [playlistEvent, setPlaylistEvent] = useState(eventName);
  const [playlistDm, setPlaylistDm] = useState(dmName);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [draftDm, setDraftDm] = useState("");
  const [dialogError, setDialogError] = useState("");
  const songs = useMemo(
    () => buildSongs(playlistId, reloadTick),
    [playlistId, reloadTick],
  );

  const dmOptions = useMemo(() => {
    const fromRegistry = registeredUsers
      .map((registeredUser) => registeredUser.username.trim())
      .filter((username): username is string => username.length > 0);
    const fallback = [user?.username ?? ""].filter(
      (name) => name.trim().length > 0,
    );
    const allNames = [...fromRegistry, ...fallback];

    return allNames.filter((name, index) => {
      const normalizedName = name.toLowerCase();
      return (
        allNames.findIndex(
          (candidate) => candidate.toLowerCase() === normalizedName,
        ) === index
      );
    });
  }, [registeredUsers, user?.username]);
  const hasSummaryInfo = useMemo(
    () =>
      playlistTitle.trim().length > 0 ||
      playlistEvent.trim().length > 0 ||
      playlistDm.trim().length > 0,
    [playlistDm, playlistEvent, playlistTitle],
  );
  const shouldShowCreateSummaryPlaceholder = isCreateMode && !hasSummaryInfo;

  const persistDraft = useCallback(
    async (
      overrides?: Partial<
        Pick<PlaylistDraft, "title" | "event" | "dm" | "imageUri">
      >,
    ) => {
      if (!isCreateMode) {
        return;
      }

      const draftPayload: PlaylistDraft = {
        id: playlistId,
        title: overrides?.title ?? playlistTitle,
        event: overrides?.event ?? playlistEvent,
        dm: overrides?.dm ?? playlistDm,
        createdAt,
        imageUri: overrides?.imageUri ?? imageUri,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
    },
    [
      createdAt,
      draftStorageKey,
      imageUri,
      isCreateMode,
      playlistDm,
      playlistEvent,
      playlistId,
      playlistTitle,
    ],
  );

  useEffect(() => {
    if (!isCreateMode) {
      return;
    }

    let isMounted = true;

    const loadDraft = async () => {
      setIsDraftLoading(true);

      try {
        const cachedPayload = await AsyncStorage.getItem(draftStorageKey);

        if (!isMounted) {
          return;
        }

        if (!cachedPayload) {
          await persistDraft();
          return;
        }

        const parsedPayload = JSON.parse(
          cachedPayload,
        ) as Partial<PlaylistDraft>;

        if (
          typeof parsedPayload.title === "string" &&
          parsedPayload.title.trim().length > 0
        ) {
          setPlaylistTitle(parsedPayload.title);
        }

        if (
          typeof parsedPayload.event === "string" &&
          parsedPayload.event.trim().length > 0
        ) {
          setPlaylistEvent(parsedPayload.event);
        }

        if (
          typeof parsedPayload.dm === "string" &&
          parsedPayload.dm.trim().length > 0
        ) {
          setPlaylistDm(parsedPayload.dm);
        }

        if (typeof parsedPayload.imageUri === "string") {
          setImageUri(parsedPayload.imageUri);
        }
      } catch {
        // Ignore malformed payloads and keep default placeholder.
      } finally {
        if (isMounted) {
          setIsDraftLoading(false);
        }
      }
    };

    void loadDraft();

    return () => {
      isMounted = false;
    };
  }, [draftStorageKey, isCreateMode, persistDraft]);

  useEffect(() => {
    if (isCreateMode) {
      setPlaylistTitle("");
      setPlaylistEvent("");
      setPlaylistDm("");
      return;
    }

    setPlaylistTitle(`playlist#${playlistId}`);
    setPlaylistEvent(eventName);
    setPlaylistDm(dmName);
  }, [dmName, eventName, isCreateMode, playlistId]);

  const onReload = useCallback(async () => {
    if (isReloading) {
      return;
    }

    setIsReloading(true);
    await wait(RELOAD_DELAY_MS);
    setReloadTick((current) => current + 1);
    setIsReloading(false);
  }, [isReloading]);

  const onOpenEditDialog = useCallback(() => {
    if (!isCreateMode) {
      return;
    }

    const selectedDm =
      dmOptions.find(
        (dmOption) => dmOption.toLowerCase() === playlistDm.toLowerCase(),
      ) ?? "";

    setDraftTitle(playlistTitle);
    setDraftSubtitle(playlistEvent);
    setDraftDm(selectedDm);
    setDialogError("");
    setIsEditDialogVisible(true);
  }, [dmOptions, isCreateMode, playlistDm, playlistEvent, playlistTitle]);

  const onCloseEditDialog = useCallback(() => {
    setIsEditDialogVisible(false);
    setDialogError("");
  }, []);

  const onApplyCardInfo = useCallback(() => {
    const nextTitle = draftTitle.trim();
    const nextSubtitle = draftSubtitle.trim();
    const nextDm = draftDm.trim();

    if (!nextTitle || !nextSubtitle || !nextDm) {
      setDialogError("Preencha título, subtítulo e DM.");
      return;
    }

    setPlaylistTitle(nextTitle);
    setPlaylistEvent(nextSubtitle);
    setPlaylistDm(nextDm);
    setIsEditDialogVisible(false);
    setDialogError("");
    void persistDraft({
      title: nextTitle,
      event: nextSubtitle,
      dm: nextDm,
    });
  }, [draftDm, draftSubtitle, draftTitle, persistDraft]);

  const onSelectDmOption = useCallback((nextDm: string) => {
    setDraftDm(nextDm);
  }, []);

  const onHandlePickedImage = useCallback(
    async (pickerResult: unknown) => {
      const selectedUri = getPickedAssetUri(pickerResult);

      if (!selectedUri) {
        return;
      }

      setIsImageUploading(true);

      try {
        await wait(UPLOAD_SIMULATED_DELAY_MS);
        setImageUri(selectedUri);
        await persistDraft({ imageUri: selectedUri });
      } catch {
        Alert.alert(
          "Falha no upload",
          "Não foi possível salvar a imagem selecionada.",
        );
      } finally {
        setIsImageUploading(false);
      }
    },
    [persistDraft],
  );

  const askGalleryPermission = useCallback(async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted && permissionResult.status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à galeria para selecionar imagens.",
      );
      return false;
    }

    return true;
  }, []);

  const askCameraPermission = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted && permissionResult.status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à câmera para tirar foto.",
      );
      return false;
    }

    return true;
  }, []);

  const onPickFromGallery = useCallback(async () => {
    if (isImageUploading || isDraftLoading) {
      return;
    }

    const hasPermission = await askGalleryPermission();

    if (!hasPermission) {
      return;
    }

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      await onHandlePickedImage(pickerResult);
    } catch {
      Alert.alert(
        "Falha ao abrir galeria",
        "Não foi possível abrir a galeria agora.",
      );
    }
  }, [
    askGalleryPermission,
    isDraftLoading,
    isImageUploading,
    onHandlePickedImage,
  ]);

  const onTakePhoto = useCallback(async () => {
    if (isImageUploading || isDraftLoading) {
      return;
    }

    const hasPermission = await askCameraPermission();

    if (!hasPermission) {
      return;
    }

    try {
      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      await onHandlePickedImage(pickerResult);
    } catch {
      Alert.alert(
        "Falha ao abrir câmera",
        "Não foi possível abrir a câmera agora.",
      );
    }
  }, [
    askCameraPermission,
    isDraftLoading,
    isImageUploading,
    onHandlePickedImage,
  ]);

  const onOpenUploadMenu = useCallback(() => {
    if (isImageUploading || isDraftLoading) {
      return;
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Imagem da playlist",
          options: ["Cancelar", "Escolher da galeria", "Tirar foto"],
          cancelButtonIndex: 0,
        },
        (selectedIndex: number) => {
          if (selectedIndex === 1) {
            void onPickFromGallery();
          }

          if (selectedIndex === 2) {
            void onTakePhoto();
          }
        },
      );

      return;
    }

    Alert.alert("Imagem da playlist", "Selecione uma opção", [
      { text: "Cancelar", style: "cancel" },
      { text: "Escolher da galeria", onPress: () => void onPickFromGallery() },
      { text: "Tirar foto", onPress: () => void onTakePhoto() },
    ]);
  }, [isDraftLoading, isImageUploading, onPickFromGallery, onTakePhoto]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
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
          style={({ pressed }) => [
            styles.reloadButton,
            pressed && styles.pressed,
          ]}
        >
          {isReloading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : (
            <MaterialCommunityIcons name="reload" size={20} color={iconColor} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(220)} style={styles.hero}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.uploadedImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              {isDraftLoading ? (
                <ActivityIndicator size="small" color={spinnerColor} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={26}
                    color={styles.placeholderIcon.color}
                  />
                  <Text style={styles.placeholderText}>Imagem (upload)</Text>
                </>
              )}
            </View>
          )}

          {isCreateMode && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload de imagem da playlist"
              onPress={onOpenUploadMenu}
              style={({ pressed }) => [
                styles.uploadImageButton,
                pressed && styles.pressed,
              ]}
            >
              {isImageUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name="camera-plus-outline"
                  size={19}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(220).delay(30)}
          style={[
            styles.summaryCard,
            isCreateMode && styles.summaryCardEditable,
          ]}
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

          {shouldShowCreateSummaryPlaceholder ? (
            <View style={styles.summaryPlaceholder}>
              <MaterialCommunityIcons
                name="calendar-edit"
                size={28}
                color={styles.placeholderIcon.color}
              />
              <Text style={styles.placeholderText}>Dados da playlist</Text>
            </View>
          ) : (
            <>
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
            </>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(220).delay(60)}
          style={styles.songSection}
        >
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
                    <Text
                      style={[
                        styles.toneText,
                        { color: getTonePalette(song.tone).text },
                      ]}
                    >
                      {song.tone}
                    </Text>
                  </View>
                  <Text style={styles.songName}>{song.title}</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.youtubeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.youtubeText}>Link YouTube</Text>
                  <Octicons name="play" size={14} color="#FFFFFF" />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(220).delay(80)}
          style={styles.dynamicWrap}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir dinâmica da playlist"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(home)/playlist-dynamic",
                params: {
                  id: playlistId,
                  event: playlistEvent,
                  dm: playlistDm,
                  createdAt,
                },
              } as Href)
            }
            style={({ pressed }) => [
              styles.dynamicButton,
              pressed && styles.pressed,
            ]}
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

      {isCreateMode && (
        <Modal
          animationType="fade"
          transparent
          visible={isEditDialogVisible}
          onRequestClose={onCloseEditDialog}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>Editar informações</Text>

              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>Título</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setDraftTitle}
                  placeholder="playlist#0001"
                  placeholderTextColor={styles.dialogPlaceholder.color}
                  style={styles.dialogInput}
                  value={draftTitle}
                />
              </View>

              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>Subtítulo (evento)</Text>
                <TextInput
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  onChangeText={setDraftSubtitle}
                  placeholder="Culto dos Jovens"
                  placeholderTextColor={styles.dialogPlaceholder.color}
                  style={styles.dialogInput}
                  value={draftSubtitle}
                />
              </View>

              <View style={styles.dialogField}>
                <Text style={styles.dialogLabel}>DM</Text>
                <View style={styles.dmChipGroup}>
                  {dmOptions.map((option) => {
                    const isSelected = option === draftDm;

                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar DM ${option}`}
                        onPress={() => onSelectDmOption(option)}
                        style={({ pressed }) => [
                          styles.dmChip,
                          isSelected && styles.dmChipSelected,
                          pressed && styles.dmChipPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dmChipText,
                            isSelected && styles.dmChipTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {dmOptions.length === 0 && (
                  <Text style={styles.dmEmptyText}>
                    Nenhum usuário cadastrado.
                  </Text>
                )}
              </View>

              {!!dialogError && (
                <Text style={styles.dialogErrorText}>{dialogError}</Text>
              )}

              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar edição"
                  onPress={onCloseEditDialog}
                  style={({ pressed }) => [
                    styles.dialogCancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.dialogCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar informações no card"
                  onPress={onApplyCardInfo}
                  style={({ pressed }) => [
                    styles.dialogAddButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.dialogAddText}>+ adicionar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";
  const cardBackground = isDark ? "#111827" : theme.colors.surface;
  const borderColor = isDark ? "#2D333B" : theme.colors.border;
  const inputBackground = isDark ? "#0B1220" : theme.colors.surfaceMuted;
  const dialogOverlay = isDark
    ? "rgba(2, 6, 23, 0.72)"
    : "rgba(15, 23, 42, 0.48)";

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
      position: "relative",
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: cardBackground,
    },
    uploadedImage: {
      width: "100%",
      height: 190,
    },
    imagePlaceholder: {
      minHeight: 190,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    uploadImageButton: {
      position: "absolute",
      right: 10,
      bottom: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1F6FEB" : "#2563EB",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#60A5FA" : "#1D4ED8",
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
      position: "relative",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 12,
      backgroundColor: cardBackground,
      padding: 14,
      gap: 10,
    },
    summaryCardEditable: {
      paddingBottom: 52,
    },
    editCardButton: {
      position: "absolute",
      right: 12,
      bottom: 12,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#60A5FA" : "#1D4ED8",
      backgroundColor: isDark ? "#1F6FEB" : "#2563EB",
      zIndex: 1,
    },
    summaryPlaceholder: {
      minHeight: 130,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    summaryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 40,
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
    dialogOverlay: {
      flex: 1,
      backgroundColor: dialogOverlay,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    dialogCard: {
      width: "100%",
      maxWidth: 460,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: cardBackground,
      padding: 14,
      gap: 10,
    },
    dialogTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.semibold,
    },
    dialogField: {
      gap: 6,
    },
    dialogLabel: {
      color: isDark ? "#9AA6B2" : theme.colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    dialogInput: {
      minHeight: 42,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      borderRadius: 10,
      backgroundColor: inputBackground,
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    dmChipGroup: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 2,
    },
    dmChip: {
      minHeight: 34,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    dmChipSelected: {
      backgroundColor: isDark ? "#1F6FEB" : theme.colors.primary,
      borderColor: isDark ? "#60A5FA" : theme.colors.primary,
    },
    dmChipPressed: {
      opacity: 0.82,
    },
    dmChipText: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.medium,
    },
    dmChipTextSelected: {
      color: "#FFFFFF",
    },
    dialogPlaceholder: {
      color: isDark ? "#64748B" : "#94A3B8",
    },
    dmEmptyText: {
      color: isDark ? "#8B949E" : theme.colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.regular,
    },
    dialogErrorText: {
      color: "#FB7185",
      fontSize: 12,
      fontFamily: theme.fonts.regular,
    },
    dialogActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 2,
    },
    dialogCancelButton: {
      minHeight: 38,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      backgroundColor: inputBackground,
    },
    dialogCancelText: {
      color: isDark ? "#CBD5E1" : "#334155",
      fontSize: 13,
      fontFamily: theme.fonts.medium,
    },
    dialogAddButton: {
      minHeight: 38,
      borderRadius: 19,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#60A5FA" : "#1D4ED8",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
      backgroundColor: isDark ? "#1F6FEB" : "#2563EB",
    },
    dialogAddText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: theme.fonts.semibold,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
