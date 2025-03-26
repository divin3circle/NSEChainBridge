import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="pie-chart" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: "Markets",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" color={color} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" color={color} size={30} />
          ),
        }}
      />
    </Tabs>
  );
};
