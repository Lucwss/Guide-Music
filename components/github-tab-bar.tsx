import Octicons from "@expo/vector-icons/Octicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { APP_FONTS, useAppTheme } from "../theme";

type IconName = React.ComponentProps<typeof Octicons>["name"];

const TAB_ICONS: Record<string, IconName> = {
  "(home)": "home",
  inbox: "inbox",
  explore: "telescope",
  copilot: "hubot",
};

export function GithubTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { resolvedMode } = useAppTheme();

  const palette =
    resolvedMode === "dark"
      ? {
          background: "#0D1117",
          activeBg: "#11203A",
          activeColor: "#79C0FF",
          inactiveColor: "#8B949E",
          border: "#1F2937",
        }
      : {
          background: "#F8FAFC",
          activeBg: "#DBEAFE",
          activeColor: "#1D4ED8",
          inactiveColor: "#475569",
          border: "#D2DCE8",
        };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={[styles.container, { borderTopColor: palette.border, backgroundColor: palette.background }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;
          const iconName = TAB_ICONS[route.name] ?? "circle";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.item,
                isFocused && { backgroundColor: palette.activeBg },
                pressed && styles.itemPressed,
              ]}
            >
              <Octicons
                name={iconName}
                size={22}
                color={isFocused ? palette.activeColor : palette.inactiveColor}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? palette.activeColor : palette.inactiveColor,
                    fontFamily: isFocused ? APP_FONTS.medium : APP_FONTS.regular,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  item: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  itemPressed: {
    opacity: 0.84,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
});
