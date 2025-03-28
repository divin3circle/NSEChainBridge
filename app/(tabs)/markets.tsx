import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { categories, Category, topMovers } from "@/constants/Data";
import StockCard from "@/components/StockCard";
import { Colors, fonts } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

function MarketsHeader() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  return (
    <View
      style={{
        marginBottom: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 24,
            color: Colors.light.titles,
          }}
        >
          Markets
        </Text>
        <TouchableOpacity>
          <Ionicons name="search" color={Colors.light.titles} size={34} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          marginTop: 4,
        }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            style={{
              borderBottomColor:
                activeCategory === category ? Colors.light.titles : "#fff",
              borderBottomWidth: 1.5,
            }}
            onPress={() => setActiveCategory(category as Category)}
            key={category}
          >
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 15,
              }}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const Transactions = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        key="grid"
        data={topMovers}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <StockCard stock={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={MarketsHeader}
        style={{
          paddingHorizontal: 14,
        }}
      />
    </SafeAreaView>
  );
};

export default Transactions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gridItem: {
    flex: 1,
    margin: 4,
    maxWidth: "100%",
  },
  row: {
    flex: 1,
    justifyContent: "space-between",
  },
});
