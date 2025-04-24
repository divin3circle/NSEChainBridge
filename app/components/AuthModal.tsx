import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Colors, fonts } from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (userId: string, password: string) => void;
  isLoading: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (userId.trim() && password.trim()) {
      onSubmit(userId, password);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={10} tint="light" style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Authentication Required</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.titles} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>User ID</Text>
              <TextInput
                style={styles.input}
                value={userId}
                onChangeText={setUserId}
                placeholder="Enter your user ID"
                placeholderTextColor={Colors.light.subtitles}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.light.subtitles}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!userId.trim() || !password.trim() || isLoading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!userId.trim() || !password.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.light.background} />
              ) : (
                <Text style={styles.submitButtonText}>Authenticate</Text>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.titles,
    fontFamily: fonts.semiBold,
  },
  closeButton: {
    padding: 5,
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    gap: 5,
  },
  label: {
    fontSize: 14,
    color: Colors.light.titles,
    fontFamily: fonts.semiBold,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    color: Colors.light.titles,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    fontFamily: fonts.regular,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.subtitles,
  },
  submitButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
