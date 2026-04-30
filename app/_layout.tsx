import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppThemeProvider, useAppTheme } from "../theme";

function RootNavigator() {
  const { resolvedMode, theme } = useAppTheme();

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}
