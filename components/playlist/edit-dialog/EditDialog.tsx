import type { ReactNode } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  draftTitle: string;
  draftSubtitle: string;
  draftDm: string;
  dmOptions: string[];
  dialogError: string;
  styles: any;
  onClose: () => void;
  onDraftTitleChange: (text: string) => void;
  onDraftSubtitleChange: (text: string) => void;
  onSelectDmOption: (dm: string) => void;
  onApply: () => void;
};

export function PlaylistEditDialog({
  visible,
  draftTitle,
  draftSubtitle,
  draftDm,
  dmOptions,
  dialogError,
  styles,
  onClose,
  onDraftTitleChange,
  onDraftSubtitleChange,
  onSelectDmOption,
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
          <Text style={styles.dialogTitle}>Editar informações</Text>

          <View style={styles.dialogField}>
            <Text style={styles.dialogLabel}>Título</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onDraftTitleChange}
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
              onChangeText={onDraftSubtitleChange}
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
              <Text style={styles.dmEmptyText}>Nenhum usuário cadastrado.</Text>
            )}
          </View>

          {!!dialogError && (
            <Text style={styles.dialogErrorText}>{dialogError}</Text>
          )}

          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar edição"
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
              accessibilityLabel="Adicionar informações no card"
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
