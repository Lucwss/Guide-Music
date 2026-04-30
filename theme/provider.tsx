import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

import {
  createAppTheme,
  createNavigationTheme,
  type AppTheme,
  type ResolvedThemeMode,
  type ThemeMode,
} from "./tokens";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  theme: AppTheme;
  setMode: (nextMode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveThemeMode(
  mode: ThemeMode,
  systemMode: "light" | "dark" | null,
): ResolvedThemeMode {
  if (mode === "system") {
    return systemMode === "dark" ? "dark" : "light";
  }

  return mode;
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  const resolvedMode = useMemo(
    () => resolveThemeMode(mode, systemMode),
    [mode, systemMode],
  );

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);
  const navigationTheme = useMemo(
    () => createNavigationTheme(resolvedMode),
    [resolvedMode],
  );

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((currentMode) => {
      if (currentMode === "system") {
        return resolvedMode === "dark" ? "light" : "dark";
      }

      return currentMode === "dark" ? "light" : "dark";
    });
  }, [resolvedMode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      theme,
      setMode,
      toggleMode,
    }),
    [mode, resolvedMode, setMode, theme, toggleMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }

  return context;
}
