import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
  return <Stack />;
}
