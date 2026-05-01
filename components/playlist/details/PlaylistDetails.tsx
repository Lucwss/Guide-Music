import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  type ListRenderItemInfo,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../auth/provider";
import { useAppTheme } from "../../../theme";

import {
  DRAFT_STORAGE_KEY_PREFIX,
  MAX_SONGS,
  RELOAD_DELAY_MS,
  SONG_LOAD_DELAY_MS,
  SONG_PAGE_SIZE,
  UPLOAD_SIMULATED_DELAY_MS,
} from "../shared/constants";
import { createPlaylistStyles } from "../shared/styles";
import type {
  PlaylistDetailsParams,
  PlaylistDraft,
  SongItem,
  SongTone,
} from "../shared/types";
import { SONG_TONES } from "../shared/types";
import {
  buildSongsPage,
  getParam,
  getPickedAssetUri,
  isSongItem,
  wait,
} from "../shared/utils";

import { PlaylistAddSongDialog } from "../add-song-dialog/AddSongDialog";
import { PlaylistDynamicButton } from "../dynamic-button/DynamicButton";
import { PlaylistEditDialog } from "../edit-dialog/EditDialog";
import { PlaylistHeader } from "../header/Header";
import { PlaylistImageSection } from "../image-section/ImageSection";
import { PlaylistSongItem, createSongItemStyles } from "../song-item/SongItem";
import { PlaylistSongListSection } from "../song-list/SongListSection";
import { PlaylistSummaryCard } from "../summary-card/SummaryCard";

export default function PlaylistDetailsScreen() {
  const params = useLocalSearchParams<PlaylistDetailsParams>();
  const { registeredUsers, user } = useAuth();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createPlaylistStyles(theme, resolvedMode);
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

  // UI state
  const [reloadTick, setReloadTick] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(isCreateMode);

  // Playlist info state
  const [playlistTitle, setPlaylistTitle] = useState(
    isCreateMode ? "" : `playlist#${playlistId}`,
  );
  const [playlistEvent, setPlaylistEvent] = useState(eventName);
  const [playlistDm, setPlaylistDm] = useState(dmName);

  // Edit dialog state
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [draftDm, setDraftDm] = useState("");
  const [dialogError, setDialogError] = useState("");

  // Songs state
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [isSongsLoading, setIsSongsLoading] = useState(false);
  const [isLoadingMoreSongs, setIsLoadingMoreSongs] = useState(false);
  const [hasMoreSongs, setHasMoreSongs] = useState(false);

  // Add song dialog state
  const [isSongDialogVisible, setIsSongDialogVisible] = useState(false);
  const [draftSongTone, setDraftSongTone] = useState<SongTone>(SONG_TONES[0]);
  const [draftSongTitle, setDraftSongTitle] = useState("");
  const [draftSongYoutubeLink, setDraftSongYoutubeLink] = useState("");
  const [songDialogError, setSongDialogError] = useState("");

  const songsCursorRef = useRef(0);

  // DM options from registered users
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

  // Persist draft to AsyncStorage with songs
  const persistDraft = useCallback(
    async (
      overrides?: Partial<
        Pick<PlaylistDraft, "title" | "event" | "dm" | "imageUri" | "songs">
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
        songs: overrides?.songs ?? songs,
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
      songs,
    ],
  );

  // Load draft on component mount in create mode
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
          const draftPayload: PlaylistDraft = {
            id: playlistId,
            title: "",
            event: "",
            dm: "",
            createdAt,
            imageUri: null,
            songs: [],
            updatedAt: new Date().toISOString(),
          };

          await AsyncStorage.setItem(
            draftStorageKey,
            JSON.stringify(draftPayload),
          );
          return;
        }

        const parsedPayload = JSON.parse(
          cachedPayload,
        ) as Partial<PlaylistDraft>;

        if (typeof parsedPayload.title === "string") {
          setPlaylistTitle(parsedPayload.title);
        }

        if (typeof parsedPayload.event === "string") {
          setPlaylistEvent(parsedPayload.event);
        }

        if (typeof parsedPayload.dm === "string") {
          setPlaylistDm(parsedPayload.dm);
        }

        if (typeof parsedPayload.imageUri === "string") {
          setImageUri(parsedPayload.imageUri);
        }

        if (Array.isArray(parsedPayload.songs)) {
          const restoredSongs = parsedPayload.songs.filter(isSongItem);
          setSongs(restoredSongs);
          songsCursorRef.current = restoredSongs.length;
          setHasMoreSongs(restoredSongs.length < MAX_SONGS);
        }
      } catch {
        // ignore malformed payload
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
  }, [draftStorageKey, isCreateMode, playlistId, createdAt]);

  // Load initial songs in view mode only
  useEffect(() => {
    if (isCreateMode || isDraftLoading) {
      return;
    }

    if (songs.length > 0 && reloadTick === 0) {
      return;
    }

    let isMounted = true;

    const loadInitialSongs = async () => {
      setIsSongsLoading(true);
      await wait(SONG_LOAD_DELAY_MS);

      const initialSongs = buildSongsPage(playlistId, 0, SONG_PAGE_SIZE);

      if (!isMounted) {
        return;
      }

      songsCursorRef.current = initialSongs.length;
      setSongs(initialSongs);
      setHasMoreSongs(initialSongs.length < MAX_SONGS);
      setIsSongsLoading(false);
      void persistDraft({ songs: initialSongs });
    };

    void loadInitialSongs();

    return () => {
      isMounted = false;
    };
  }, [
    isCreateMode,
    isDraftLoading,
    persistDraft,
    playlistId,
    reloadTick,
    songs.length,
  ]);

  // Reload handler
  const onReload = useCallback(async () => {
    if (isReloading) {
      return;
    }

    setIsReloading(true);
    await wait(RELOAD_DELAY_MS);
    setReloadTick((current) => current + 1);
    setIsReloading(false);
  }, [isReloading]);

  // Load more songs (pagination)
  const onLoadMoreSongs = useCallback(async () => {
    if (
      !isCreateMode ||
      songs.length === 0 ||
      isSongsLoading ||
      isLoadingMoreSongs ||
      !hasMoreSongs
    ) {
      return;
    }

    setIsLoadingMoreSongs(true);
    await wait(SONG_LOAD_DELAY_MS);

    const nextSongs = buildSongsPage(
      playlistId,
      songsCursorRef.current,
      SONG_PAGE_SIZE,
    );

    songsCursorRef.current += nextSongs.length;

    setSongs((currentSongs) => {
      const mergedSongs = [...currentSongs, ...nextSongs];
      void persistDraft({ songs: mergedSongs });
      return mergedSongs;
    });
    setHasMoreSongs(songsCursorRef.current < MAX_SONGS);
    setIsLoadingMoreSongs(false);
  }, [
    hasMoreSongs,
    isCreateMode,
    isLoadingMoreSongs,
    isSongsLoading,
    playlistId,
    persistDraft,
  ]);

  // Edit dialog handlers
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

  // Song dialog handlers
  const onOpenSongDialog = useCallback(() => {
    if (!isCreateMode) {
      return;
    }

    setDraftSongTone(SONG_TONES[0]);
    setDraftSongTitle("");
    setDraftSongYoutubeLink("");
    setSongDialogError("");
    setIsSongDialogVisible(true);
  }, [isCreateMode]);

  const onCloseSongDialog = useCallback(() => {
    setIsSongDialogVisible(false);
    setSongDialogError("");
  }, []);

  // Add song and auto-generate mocked songs
  const onApplySong = useCallback(() => {
    const nextTitle = draftSongTitle.trim();
    const nextYoutubeLink = draftSongYoutubeLink.trim();

    if (!nextTitle || !nextYoutubeLink) {
      setSongDialogError("Preencha o tom, nome da música e o link do YouTube.");
      return;
    }

    // Create user-added song
    const nextSong: SongItem = {
      id: `${playlistId}-song-${Date.now()}`,
      tone: draftSongTone,
      title: nextTitle,
      youtubeLink: nextYoutubeLink,
    };

    // If this is the first song, auto-generate mocked songs after it
    const nextSongs = [...songs, nextSong];

    if (songs.length === 0) {
      // Auto-generate mocked songs for this playlist
      const mockedSongs = buildSongsPage(playlistId, 0, SONG_PAGE_SIZE - 1);
      nextSongs.push(...mockedSongs);
    }

    songsCursorRef.current = nextSongs.length;
    setSongs(nextSongs);
    setHasMoreSongs(nextSongs.length < MAX_SONGS);
    setIsSongDialogVisible(false);
    setSongDialogError("");
    void persistDraft({ songs: nextSongs });
  }, [
    draftSongTitle,
    draftSongTone,
    draftSongYoutubeLink,
    persistDraft,
    playlistId,
    songs,
  ]);

  // Image handling
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

  // Render song item callback
  const borderColor = resolvedMode === "dark" ? "#2D333B" : theme.colors.border;
  const isDark = resolvedMode === "dark";
  const songItemStyles = createSongItemStyles(
    borderColor,
    isDark,
    theme.colors,
  );

  const renderSongItem = useCallback(
    ({ item, index }: ListRenderItemInfo<SongItem>) => (
      <PlaylistSongItem item={item} index={index} styles={songItemStyles} />
    ),
    [songItemStyles],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <PlaylistHeader
        isReloading={isReloading}
        onReload={onReload}
        styles={styles}
        iconColor={iconColor}
        spinnerColor={spinnerColor}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PlaylistImageSection
          imageUri={imageUri}
          isImageUploading={isImageUploading}
          isDraftLoading={isDraftLoading}
          isCreateMode={isCreateMode}
          styles={styles}
          spinnerColor={spinnerColor}
          onOpenUploadMenu={onOpenUploadMenu}
        />

        <PlaylistSummaryCard
          playlistTitle={playlistTitle}
          playlistEvent={playlistEvent}
          playlistDm={playlistDm}
          createdAt={createdAt}
          isCreateMode={isCreateMode}
          hasSummaryInfo={hasSummaryInfo}
          styles={styles}
          onOpenEditDialog={onOpenEditDialog}
        />

        <PlaylistSongListSection
          songs={songs}
          isCreateMode={isCreateMode}
          isSongsLoading={isSongsLoading}
          isLoadingMoreSongs={isLoadingMoreSongs}
          hasMoreSongs={hasMoreSongs}
          styles={styles}
          spinnerColor={spinnerColor}
          onLoadMoreSongs={onLoadMoreSongs}
          onOpenSongDialog={onOpenSongDialog}
          renderSongItem={renderSongItem}
        />

        <PlaylistDynamicButton
          playlistId={playlistId}
          playlistEvent={playlistEvent}
          playlistDm={playlistDm}
          createdAt={createdAt}
          styles={styles}
          primaryAccent={primaryAccent}
        />
      </ScrollView>

      <PlaylistEditDialog
        visible={isEditDialogVisible}
        draftTitle={draftTitle}
        draftSubtitle={draftSubtitle}
        draftDm={draftDm}
        dmOptions={dmOptions}
        dialogError={dialogError}
        styles={styles}
        onClose={onCloseEditDialog}
        onDraftTitleChange={setDraftTitle}
        onDraftSubtitleChange={setDraftSubtitle}
        onSelectDmOption={onSelectDmOption}
        onApply={onApplyCardInfo}
      />

      <PlaylistAddSongDialog
        visible={isSongDialogVisible}
        draftSongTone={draftSongTone}
        draftSongTitle={draftSongTitle}
        draftSongYoutubeLink={draftSongYoutubeLink}
        songDialogError={songDialogError}
        styles={styles}
        onClose={onCloseSongDialog}
        onToneChange={setDraftSongTone}
        onTitleChange={setDraftSongTitle}
        onYoutubeLinkChange={setDraftSongYoutubeLink}
        onApply={onApplySong}
      />
    </SafeAreaView>
  );
}
