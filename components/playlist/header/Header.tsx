import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  isReloading: boolean;
  onReload: () => void;
  styles: any;
  iconColor: string;
  spinnerColor: string;
};

export function PlaylistHeader({
  isReloading,
  onReload,
  styles,
  iconColor,
  spinnerColor,
}: Props): ReactNode {
  const router = useRouter();

  return (
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
        onPress={onReload}
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
  );
}
