import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors, fonts } from "../constants/colors";

const TextLine = ({ title, text }: { title: string; text: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subTitle}>{text}</Text>
    </View>
  );
};

export default TextLine;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 14,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: Colors.light.titles,
  },
  subTitle: {
    fontFamily: fonts.light,
    fontSize: 16,
    color: Colors.light.muted,
  },
});
