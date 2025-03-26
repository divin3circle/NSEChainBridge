import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Movers } from "@/constants/Data";
import { Image } from "expo-image";
import { blurhash, Colors, fonts } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const StockCard = ({ stock }: { stock: Movers }) => {
  return (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: "column",
          gap: 8,
        }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={stock.image}
            style={styles.image}
            placeholder={{ blurhash }}
            contentFit="contain"
            transition={1000}
          />
        </View>
        <Text style={styles.code}>{stock.code}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {stock.name.substring(0, 12)}
          {stock.name.length > 12 ? "..." : ""}
        </Text>
        <Text style={styles.price}>KES {stock.dayPrice}</Text>
        <View style={styles.changeContainer}>
          {stock.change < 0 ? (
            <Ionicons name="caret-down" color="#D92A2A" size={16} />
          ) : (
            <Ionicons name="caret-up" color="#19AF00" size={16} />
          )}
          <Text
            style={[
              styles.change,
              { color: stock.change < 0 ? "#D92A2A" : "#19AF00" },
            ]}
          >
            {stock.changePercentage}%
          </Text>
        </View>
      </View>
      <Image
        source={stock.moverGraph}
        style={{
          width: 70,
          height: 70,
        }}
        placeholder={{ blurhash }}
        contentFit="contain"
        transition={1000}
      />
    </View>
  );
};

export default StockCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 15,
  },
  code: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  name: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.light.muted,
  },
  price: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  change: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
