import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors, fonts, TOOLS } from "./constants/Colors";
import { ScrollView } from "react-native";
import { Image } from "expo-image";
const Tools = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Tools</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => (
          <View key={tool.id} style={styles.tool}>
            <Image
              source={tool.image}
              style={styles.toolImage}
              contentFit="contain"
            />
            <Text style={styles.toolName}>{tool.name}</Text>
            <Text style={styles.toolDescription}>{tool.description}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Tools;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
    textAlign: "center",
  },
  tool: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    marginVertical: 10,
  },
  toolName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
  },
  toolDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.subtitles,
  },
  toolImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
});
