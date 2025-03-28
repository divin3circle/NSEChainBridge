import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { blurhash, Colors, fonts } from "@/constants/Colors";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./hooks/useAuth";

const { width } = Dimensions.get("window");

const Signin = () => {
  const [currentView, setCurrentView] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login, signup, isLoading, error } = useAuth();

  const handleViewChange = () => {
    setCurrentView(currentView === "login" ? "signup" : "login");
    // Clear form when switching views
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleAuthentication = async () => {
    if (currentView === "login") {
      login({ email, password });
    } else {
      signup({ email, password, name });
    }
  };

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
        Start owning stocks from as low as $1 with low fees and AI portfolio and
        trading assistance
      </Text>

      {error && (
        <Text
          style={{
            color: "red",
            fontFamily: fonts.regular,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          {error.message}
        </Text>
      )}

      <View
        style={{
          marginVertical: 14,
        }}
      >
        {currentView === "signup" && (
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
            <Ionicons name="person" color={Colors.light.muted} size={18} />
            <TextInput
              placeholder="Full Name"
              style={{
                fontFamily: fonts.regular,
                flex: 1,
              }}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}
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
          <Ionicons name="mail" color={Colors.light.muted} size={18} />
          <TextInput
            placeholder="Email Address"
            style={{
              fontFamily: fonts.regular,
              flex: 1,
            }}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
              flex: 1,
            }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={handleAuthentication}
        disabled={isLoading}
        style={{
          marginVertical: 14,
          padding: 8,
          width: width * 0.7,
          backgroundColor: Colors.light.primary,
          borderRadius: 18,
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : (
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
            {currentView === "login" ? "Sign In" : "Sign Up"}
          </Text>
        )}
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
          {currentView === "signup"
            ? "Already a member?"
            : "Don't have an account?"}
        </Text>
        <TouchableOpacity
          onPress={handleViewChange}
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
            {currentView === "signup" ? "Sign In" : "Sign Up"}
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
