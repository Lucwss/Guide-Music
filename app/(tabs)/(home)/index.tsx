import Octicons from "@expo/vector-icons/Octicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../auth/provider";
import { type AppTheme, useAppTheme } from "../../../theme";

const HOME_SECTION = {
  label: "playlist dos cultos",
  icon: "playlist-play",
} as const;

export default function HomeTab() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);
  const playlistIconColor = resolvedMode === "dark" ? "#93C5FD" : "#1D4ED8";
  const chevronColor = resolvedMode === "dark" ? "#8B949E" : "#64748B";

  const onPressUserIcon = useCallback(() => {
    const onConfirmLogout = () => {
      signOut();
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Conta",
          options: ["Cancelar", "Logout"],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (selectedIndex) => {
          if (selectedIndex === 1) {
            onConfirmLogout();
          }
        },
      );

      return;
    }

    Alert.alert("Conta", "Selecione uma ação", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: onConfirmLogout,
      },
    ]);
  }, [signOut]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Home</Text>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir menu da conta"
              onPress={onPressUserIcon}
              style={({ pressed }) => [styles.avatarDot, pressed && styles.avatarPressed]}
            >
              <Octicons name="person" size={16} color={styles.avatarIcon.color} />
            </Pressable>
          </View>
        </View>

        <View style={styles.workList}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/(home)/playlist" as Href)}
            style={({ pressed }) => [styles.workItem, pressed && styles.workItemPressed]}
          >
            <View style={styles.workIconWrap}>
              <MaterialIcons
                name={HOME_SECTION.icon}
                size={22}
                color={playlistIconColor}
              />
            </View>
            <Text style={styles.workLabel}>{HOME_SECTION.label}</Text>
            <Octicons name="chevron-right" size={18} color={chevronColor} style={styles.chevronIcon} />
          </Pressable>
        </View>
      </ScrollView>
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
    content: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 18,
    },
    pageTitle: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.semibold,
      letterSpacing: 0.1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatarDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#30363D" : "#CBD5E1",
    },
    avatarPressed: {
      opacity: 0.82,
    },
    avatarIcon: {
      color: isDark ? "#E2E8F0" : "#1E293B",
    },
    workList: {
      marginTop: 4,
      gap: 10,
    },
    workItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#2D333B" : theme.colors.border,
      backgroundColor: isDark ? "#111827" : theme.colors.surface,
    },
    workItemPressed: {
      opacity: 0.82,
    },
    workIconWrap: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    workLabel: {
      color: isDark ? "#E6EDF3" : theme.colors.text,
      fontSize: 18,
      lineHeight: 22,
      fontFamily: theme.fonts.medium,
    },
    chevronIcon: {
      marginLeft: "auto",
    },
  });
}
