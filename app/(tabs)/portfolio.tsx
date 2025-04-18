import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { blurhash, fonts } from "../../constants/colors";
import { GROWTH } from ".";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import MyHoldings from "../components/MyHoldings";
import { useStocks } from "../hooks/useStocks";
const { width } = Dimensions.get("window");

const Portfolio = () => {
  const router = useRouter();
  const [hideBalance, setHideBalance] = useState(true);
  const { stocks } = useStocks();
  const BALANCE = stocks.reduce((acc, stock) => {
    return acc + Number(stock.dayPrice * stock.stockBlanace);
  }, 0);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{
          paddingHorizontal: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: fonts.bold,
            fontSize: 24,
            color: Colors.light.subtitles,
            marginBottom: 14,
          }}
        >
          Portfolio
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "column",
              gap: 4,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 16,
                color: Colors.light.subtitles,
              }}
            >
              Portfolio Value
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 24,
                  marginTop: 7,
                  color: Colors.light.titles,
                }}
              >
                {hideBalance ? "*******" : `KES ${BALANCE.toLocaleString()}`}
              </Text>
              {hideBalance ? (
                <TouchableOpacity onPress={() => setHideBalance(false)}>
                  <Ionicons name="eye" color={Colors.light.muted} size={18} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setHideBalance(true)}>
                  <Ionicons
                    name="eye-off"
                    color={Colors.light.muted}
                    size={18}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Ionicons name="caret-up" size={20} color="green" />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                  color: Colors.light.subtitles,
                }}
              >
                {GROWTH} % in the last 7 days
              </Text>
            </View>
          </View>
          <Image
            source={require("../../assets/images/portfolio.svg")}
            style={{
              width: 100,
              height: 100,
            }}
            placeholder={{ blurhash }}
            contentFit="contain"
            transition={1000}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 4,
            marginTop: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.light.tint,
              padding: 4,
              width: "47%",
            }}
          >
            <Ionicons name="caret-up-circle-outline" color="green" size={44} />
            <View
              style={{
                flexDirection: "column",
                gap: 0,
              }}
            >
              <Text
                style={{
                  color: Colors.light.subtitles,
                  fontFamily: fonts.regular,
                  fontSize: 14,
                }}
              >
                Gain
              </Text>
              <Text
                style={{
                  color: Colors.light.titles,
                  fontFamily: fonts.semiBold,
                }}
              >
                KES 3, 459.78
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.light.tint,
              padding: 4,
              width: "47%",
            }}
          >
            <Ionicons name="caret-down-circle-outline" color="red" size={44} />
            <View
              style={{
                flexDirection: "column",
                gap: 0,
              }}
            >
              <Text
                style={{
                  color: Colors.light.subtitles,
                  fontFamily: fonts.regular,
                  fontSize: 14,
                }}
              >
                DOW
              </Text>
              <Text
                style={{
                  color: Colors.light.titles,
                  fontFamily: fonts.semiBold,
                }}
              >
                KES 3, 459.78
              </Text>
            </View>
          </View>
        </View>

        <Image
          source={require("../../assets/images/dummychart.svg")}
          style={{
            width: width * 0.9,
            height: width,
          }}
          placeholder={{ blurhash }}
          contentFit="contain"
          transition={1000}
        />

        <MyHoldings />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Portfolio;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
