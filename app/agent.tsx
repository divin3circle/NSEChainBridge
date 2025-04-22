import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, fonts } from "../constants/colors";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Data";
import { useRouter } from "expo-router";
import { ChatInterface } from "./components/ChatInterface";

const Agent = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginVertical: 16,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.header}>Neo AI</Text>
      </View>

      <ChatInterface />
    </SafeAreaView>
  );
};

export default Agent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    textAlign: "center",
    color: Colors.light.titles,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
