import { Pressable, StyleSheet, Text, View } from "react-native";

import { type AppTheme, useAppTheme } from "../theme";

export default function Index() {
  const { mode, resolvedMode, setMode, theme, toggleMode } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>GuideMusic</Text>
        <Text style={styles.title}>Global Theme Configured</Text>
        <Text style={styles.body}>
          Theme mode: {mode} ({resolvedMode})
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={toggleMode}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonLabel}>Toggle Light/Dark</Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("system")}
            style={({ pressed }) => [styles.buttonGhost, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonGhostLabel}>Use System</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.md,
    },
    kicker: {
      color: theme.colors.accent,
      fontSize: theme.typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.typography.title,
      fontWeight: "700",
    },
    body: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.body,
    },
    buttonRow: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonGhost: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      opacity: 0.82,
    },
    buttonLabel: {
      color: "#FFFFFF",
      fontSize: theme.typography.caption,
      fontWeight: "700",
    },
    buttonGhostLabel: {
      color: theme.colors.text,
      fontSize: theme.typography.caption,
      fontWeight: "600",
    },
  });
}
