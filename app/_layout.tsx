import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@walletconnect/react-native-compat";
import { WagmiProvider } from "wagmi";
import {
  mainnet,
  polygon,
  arbitrum,
  hedera,
  hederaTestnet,
} from "@wagmi/core/chains";
import {
  createAppKit,
  defaultWagmiConfig,
  AppKit,
} from "@reown/appkit-wagmi-react-native";

const projectId = "bc8e065b4ca2d62cfa32fe5327357c52";

const metadata = {
  name: "NSEChain Bridge",
  description: "Token Agent for Hedera Network",
  url: "https://reown.com/appkit",
  icons: require("../assets/images/icon.png"),
  redirect: {
    native: "nsechainbridge://",
    universal: "nsechainbridge.com",
  },
};

const chains = [mainnet, polygon, arbitrum, hedera, hederaTestnet] as const;

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: hederaTestnet,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const queryClient = new QueryClient();
  const [loaded] = useFonts({
    OpenSansRegular: require("../assets/fonts/OpenSans-Regular.ttf"),
    OpenSansBold: require("../assets/fonts/OpenSans-Bold.ttf"),
    OpenSansSemibold: require("../assets/fonts/OpenSans-SemiBold.ttf"),
    OpenSansLight: require("../assets/fonts/OpenSans-Light.ttf"),
    OpenSansMedium: require("../assets/fonts/OpenSans-Medium.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          {" "}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              title: "Home",
            }}
          />
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="signin"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="create"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="stock/[id]"
            options={{
              title: "Stock",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="mint/[id]"
            options={{
              title: "Mint",
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="burn/[id]"
            options={{
              title: "Burn",
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="token/[id]"
            options={{
              headerShown: false,
              title: "Swap Token",
            }}
          />
          <Stack.Screen
            name="agent"
            options={{
              headerShown: true,
              title: "Hedera Agent",
            }}
          />
        </Stack>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
