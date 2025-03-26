import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const StockScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          paddingHorizontal: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.navigate("/(tabs)")}>
          <Ionicons name="arrow-back" size={34} />
        </TouchableOpacity>
      </View>
      <Text>StockScreen: {id}</Text>
    </SafeAreaView>
  );
};

export default StockScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
