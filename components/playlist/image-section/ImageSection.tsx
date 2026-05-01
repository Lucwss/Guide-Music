import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  imageUri: string | null;
  isImageUploading: boolean;
  isDraftLoading: boolean;
  isCreateMode: boolean;
  styles: any;
  spinnerColor: string;
  onOpenUploadMenu: () => void;
};

export function PlaylistImageSection({
  imageUri,
  isImageUploading,
  isDraftLoading,
  isCreateMode,
  styles,
  spinnerColor,
  onOpenUploadMenu,
}: Props): ReactNode {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.hero}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.uploadedImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons
            name="image-outline"
            size={26}
            color={styles.placeholderIcon.color}
          />
          <Text style={styles.placeholderText}>Imagem (upload)</Text>
          {isDraftLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="small" color={spinnerColor} />
            </View>
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
  );
}
