import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  playlistId: string;
  playlistEvent: string;
  playlistDm: string;
  createdAt: string;
  styles: any;
  primaryAccent: string;
};

export function PlaylistDynamicButton({
  playlistId,
  playlistEvent,
  playlistDm,
  createdAt,
  styles,
  primaryAccent,
}: Props): ReactNode {
  const router = useRouter();

  return (
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
  );
}
