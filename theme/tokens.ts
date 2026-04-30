import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedThemeMode = "light" | "dark";

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

const typography = {
  caption: 13,
  body: 16,
  title: 28,
} as const;

const lightColors = {
  background: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceMuted: "#EAF0F8",
  text: "#0F172A",
  textMuted: "#475569",
  primary: "#2563EB",
  accent: "#0EA5E9",
  border: "#D2DCE8",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
} as const;

const darkColors = {
  background: "#0B1220",
  surface: "#131C2E",
  surfaceMuted: "#1C2740",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  primary: "#60A5FA",
  accent: "#22D3EE",
  border: "#2A3956",
  success: "#4ADE80",
  warning: "#FBBF24",
  danger: "#FB7185",
} as const;

type ThemeColors = typeof lightColors;

export type AppTheme = {
  mode: ResolvedThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function createAppTheme(mode: ResolvedThemeMode): AppTheme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
  };
}

export function createNavigationTheme(mode: ResolvedThemeMode): NavigationTheme {
  const baseTheme = mode === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  const appTheme = createAppTheme(mode);

  return {
    ...baseTheme,
    dark: mode === "dark",
    colors: {
      ...baseTheme.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.accent,
    },
  };
}
