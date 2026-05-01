import type { ReactNode } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { SongTone } from "../shared/types";
import { SONG_TONES } from "../shared/types";

type Props = {
  visible: boolean;
  draftSongTone: SongTone;
  draftSongTitle: string;
  draftSongYoutubeLink: string;
  songDialogError: string;
  styles: any;
  onClose: () => void;
  onToneChange: (tone: SongTone) => void;
  onTitleChange: (text: string) => void;
  onYoutubeLinkChange: (text: string) => void;
  onApply: () => void;
};

export function PlaylistAddSongDialog({
  visible,
  draftSongTone,
  draftSongTitle,
  draftSongYoutubeLink,
  songDialogError,
  styles,
  onClose,
  onToneChange,
  onTitleChange,
  onYoutubeLinkChange,
  onApply,
}: Props): ReactNode {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>Adicionar música</Text>

          <View style={styles.dialogField}>
            <Text style={styles.dialogLabel}>Tom</Text>
            <View style={styles.songToneChipGroup}>
              {SONG_TONES.map((tone) => {
                const isSelected = tone === draftSongTone;

                return (
                  <Pressable
                    key={tone}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar tom ${tone}`}
                    onPress={() => onToneChange(tone)}
                    style={({ pressed }) => [
                      styles.songToneChip,
                      isSelected && styles.songToneChipSelected,
                      pressed && styles.songToneChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.songToneChipText,
                        isSelected && styles.songToneChipTextSelected,
                      ]}
                    >
                      {tone}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.dialogField}>
            <Text style={styles.dialogLabel}>Nome da música</Text>
            <TextInput
              autoCapitalize="sentences"
              autoCorrect={false}
              onChangeText={onTitleChange}
              placeholder="Ex: Hosana"
              placeholderTextColor={styles.dialogPlaceholder.color}
              style={styles.dialogInput}
              value={draftSongTitle}
            />
          </View>

          <View style={styles.dialogField}>
            <Text style={styles.dialogLabel}>Link do YouTube</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={onYoutubeLinkChange}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={styles.dialogPlaceholder.color}
              style={styles.dialogInput}
              value={draftSongYoutubeLink}
            />
          </View>

          {!!songDialogError && (
            <Text style={styles.dialogErrorText}>{songDialogError}</Text>
          )}

          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar música"
              onPress={onClose}
              style={({ pressed }) => [
                styles.dialogCancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dialogCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adicionar música"
              onPress={onApply}
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
  );
}
