import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { blurhash, Colors, fonts } from "@/constants/colors";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const Signin = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={{
            width: 30,
            height: 30,
          }}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={1000}
        />
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 20,
          }}
        >
          NSEChain Bridge
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 14,
          textAlign: "center",
          color: Colors.light.subtitles,
          marginVertical: 14,
          paddingHorizontal: 14,
        }}
      >
        Sign Up and start owning stocks from as low as $1 with low fees snd AI
        portfolio and trading assistance
      </Text>
      <View
        style={{
          marginVertical: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            width: width * 0.7,
            borderWidth: 1,
            alignItems: "center",
            borderColor: Colors.light.muted,
            gap: 8,
            padding: 14,
            borderRadius: 14,
            marginVertical: 14,
            backgroundColor: "#f6f7f9",
          }}
        >
          <Ionicons name="mail" color={Colors.light.muted} size={18} />
          <TextInput
            placeholder="Email Address"
            style={{
              fontFamily: fonts.regular,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            width: width * 0.7,
            borderWidth: 1,
            alignItems: "center",
            borderColor: Colors.light.muted,
            gap: 8,
            padding: 14,
            borderRadius: 14,
            marginVertical: 7,
            backgroundColor: "#f6f7f9",
          }}
        >
          <Ionicons name="lock-closed" color={Colors.light.muted} size={16} />
          <TextInput
            placeholder="Password"
            style={{
              fontFamily: fonts.regular,
            }}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.replace("/signin")}
        style={{
          marginVertical: 14,
          padding: 8,
          width: width * 0.7,
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
          Sign Up
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
          }}
        >
          Already a member?
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={{
            marginVertical: 14,
            padding: 8,
            width: width * 0.7,
            borderRadius: 18,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 16,
              lineHeight: 28,
              color: Colors.light.primary,
              textAlign: "center",
            }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
      <Text
        style={{
          fontFamily: fonts.semiBold,
          fontSize: 16,
          textAlign: "center",
          marginVertical: 14,
        }}
      >
        Or Social Logins
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: width * 0.7,
        }}
      >
        <Ionicons name="logo-apple" size={44} color={Colors.light.primary} />
        <Ionicons name="logo-discord" size={44} color={Colors.light.primary} />
        <Ionicons name="logo-google" size={44} color={Colors.light.primary} />
      </View>
    </View>
  );
};

export default Signin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
