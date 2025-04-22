import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Colors, fonts, TOOLS } from "../constants/Colors";
import { neoService, ChatMessage } from "../services/neoService";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
const { width } = Dimensions.get("window");

const blurhash =
  "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowTools(false);

    try {
      const response = await neoService.sendMessage(inputMessage);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolSelect = async (toolId: string) => {
    const tool = TOOLS.find((t) => t.id === toolId);
    if (!tool) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: `Use ${tool.name} tool to ${tool.description}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowTools(false);
    setIsLoading(true);

    try {
      const response = await neoService.sendMessage(userMessage.content);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Error using tool:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderTools = () => {
    const ToolWrapper = Platform.OS === "ios" ? BlurView : View;
    const wrapperProps =
      Platform.OS === "ios"
        ? {
            intensity: 10,
            tint: "dark" as const,
            style: styles.toolItem,
          }
        : {
            style: [styles.toolItem, styles.toolItemAndroid],
          };

    return TOOLS.map((tool) => (
      <TouchableOpacity
        key={tool.id}
        onPress={() => {}}
        style={styles.toolWrapper}
      >
        <View style={styles.toolBackground} />
        <ToolWrapper {...wrapperProps}>
          <View style={styles.toolIconContainer}>
            <Image
              source={tool.image}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 20,
                objectFit: "contain",
              }}
              contentFit="contain"
              transition={100}
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.toolNameContainer}>
            <Ionicons
              name={tool.icon as any}
              size={14}
              color={Colors.light.titles}
            />
            <Text style={styles.toolName}>{tool.name}</Text>
          </View>
        </ToolWrapper>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/ai-avatar.jpeg")}
          style={styles.avatar}
          contentFit="cover"
          transition={100}
          cachePolicy="memory-disk"
          placeholder={blurhash}
        />
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>Hi, I'm Neo,</Text>
          <Text style={styles.welcomeText}>How can I help you today?</Text>
        </View>
      </View>

      {showTools && messages.length === 0 && (
        <>
          <Text style={styles.toolsTitle}>Available Tools</Text>

          <ScrollView
            horizontal
            style={styles.toolsContainer}
            contentContainerStyle={styles.toolsGrid}
            showsHorizontalScrollIndicator={false}
          >
            {renderTools()}
          </ScrollView>
        </>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === "user"
                ? styles.userMessage
                : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/tools")}
        >
          <Ionicons name="add" size={24} color={Colors.light.subtitles} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Message Neo..."
          placeholderTextColor={Colors.light.subtitles}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputMessage.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={24}
            color={
              inputMessage.trim()
                ? Colors.light.background
                : Colors.light.subtitles
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  welcomeContainer: {
    flex: 1,
  },
  greeting: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
  },
  welcomeText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.subtitles,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 80,
  },
  messagesContent: {
    padding: 16,
  },
  toolsContainer: {
    paddingHorizontal: 10,
  },
  toolsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 11,
  },
  toolWrapper: {
    width: (width - 200) / 2,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  toolBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.15,
  },
  toolItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  toolItemAndroid: {
    borderWidth: 1,
    borderColor: "#f3dbdbd3",
  },
  toolIconContainer: {
    width: "100%",
    height: "80%",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  toolName: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: Colors.light.titles,
    textAlign: "center",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.light.primary,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.tint,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.light.background,
  },
  timestamp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.light.background,
    opacity: 0.7,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.light.tint,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f6f7f9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.light.titles,
    maxHeight: 100,
    minHeight: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.tint,
  },
  toolNameContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  toolsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
    margin: 10,
    marginTop: 20,
  },
});
