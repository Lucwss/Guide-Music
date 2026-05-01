import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AuthProvider } from "../auth/provider";
import {
  APP_FONT_SOURCES,
  AppThemeProvider,
  applyGlobalFontDefaults,
  useAppTheme,
} from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Intentionally ignored because this can be called more than once during HMR.
});

function RootNavigator() {
  const { resolvedMode, theme } = useAppTheme();

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(APP_FONT_SOURCES);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      applyGlobalFontDefaults();
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash hide failures in development/hot reload scenarios.
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </AppThemeProvider>
  );
}
