import { Tabs } from "expo-router";

import { GithubTabBar } from "../../components/github-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GithubTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
        }}
      />
      <Tabs.Screen
        name="copilot"
        options={{
          title: "Copilot",
        }}
      />
    </Tabs>
  );
}
