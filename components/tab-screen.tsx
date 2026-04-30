import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type AppTheme, useAppTheme } from "../theme";

type TabScreenProps = {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Octicons>["name"];
};

export function TabScreen({ title, description, icon }: TabScreenProps) {
  const { theme, resolvedMode } = useAppTheme();
  const styles = createStyles(theme, resolvedMode);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconBadge}>
          <Octicons name={icon} size={22} color={styles.iconColor.color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme, resolvedMode: "light" | "dark") {
  const isDark = resolvedMode === "dark";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#131D2C" : "#E2E8F0",
    },
    iconColor: {
      color: isDark ? "#93C5FD" : "#2563EB",
    },
    title: {
      color: theme.colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.bold,
    },
    description: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.body,
      fontFamily: theme.fonts.regular,
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 360,
    },
  });
}
