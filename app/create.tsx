import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { Colors, fonts } from "@/constants/Colors";
import { useAuth } from "./hooks/useAuth";

const Create = () => {
  const { createHederaAccount, isLoading, error } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Hedera Account</Text>
      <Text style={styles.description}>
        To start trading stocks, you need a Hedera account. This account will be
        used to hold your tokenized stocks and process transactions.
      </Text>

      {error && <Text style={styles.error}>{error.message}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => createHederaAccount()}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.light.tint} />
        ) : (
          <Text style={styles.buttonText}>Create Hedera Account</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: Your account will be created on the Hedera testnet. A small amount
        of test HBAR will be automatically added to your account for
        transactions.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginBottom: 30,
    color: Colors.light.subtitles,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light.tint,
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  error: {
    color: "red",
    fontFamily: fonts.regular,
    marginBottom: 20,
    textAlign: "center",
  },
  note: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: "center",
    color: Colors.light.subtitles,
    paddingHorizontal: 30,
  },
});

export default Create;
