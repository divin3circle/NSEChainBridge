import { useRouter } from "expo-router";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { blurhash, Colors, fonts } from "../constants/Colors";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        position: "relative",
      }}
    >
      <LottieView
        source={require("../assets/lottie/welcome.json")}
        style={{
          width: width * 0.9,
          height: width * 0.9,
          position: "absolute",
          top: 60,
        }}
        autoPlay
        loop
      />
      <View
        style={{
          position: "absolute",
          bottom: "15%",
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 20,
            lineHeight: 30,
          }}
        >
          Get Access to over 200+ Stocks on the NSE with low entry and
          transactions fees plus AI portfolio management strategies.
        </Text>
        <Text
          style={{
            fontFamily: fonts.semiBold,
            fontSize: 14,
            lineHeight: 28,
            color: Colors.light.primary,
          }}
        >
          Powered By Hedera
        </Text>
        <TouchableOpacity
          onPress={() => router.navigate("/signin")}
          style={{
            marginVertical: 24,
            padding: 8,
            backgroundColor: Colors.light.primary,
            borderRadius: 18,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 16,
              lineHeight: 28,
              color: Colors.light.tint,
              textAlign: "center",
              marginVertical: 2,
            }}
          >
            Get started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
