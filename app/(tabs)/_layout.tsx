import { type Href, Redirect, Tabs } from "expo-router";

import { useAuth } from "../../auth/provider";
import { GithubTabBar } from "../../components/github-tab-bar";

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)" as Href} />;
  }

  return (
    <Tabs tabBar={(props) => <GithubTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(home)"
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
