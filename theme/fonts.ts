import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import { Text, TextInput } from "react-native";

export const APP_FONTS = {
  regular: "Roboto_400Regular",
  medium: "Roboto_500Medium",
  semibold: "Roboto_600SemiBold",
  bold: "Roboto_700Bold",
} as const;

export const APP_FONT_SOURCES = {
  [APP_FONTS.regular]: Roboto_400Regular,
  [APP_FONTS.medium]: Roboto_500Medium,
  [APP_FONTS.semibold]: Roboto_600SemiBold,
  [APP_FONTS.bold]: Roboto_700Bold,
} as const;

let globalFontApplied = false;

type TextLikeComponent = {
  defaultProps?: {
    style?: unknown;
  };
};

function prependFontStyle(target: TextLikeComponent) {
  target.defaultProps = target.defaultProps ?? {};
  const currentStyle = target.defaultProps.style;
  target.defaultProps.style = [{ fontFamily: APP_FONTS.regular }, currentStyle];
}

export function applyGlobalFontDefaults() {
  if (globalFontApplied) {
    return;
  }

  prependFontStyle(Text as unknown as TextLikeComponent);
  prependFontStyle(TextInput as unknown as TextLikeComponent);
  globalFontApplied = true;
}
