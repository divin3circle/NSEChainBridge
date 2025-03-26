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
import { blurhash, Colors, fonts } from "@/constants/Colors";
import { BALANCE, GROWTH } from ".";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import TextLine from "@/components/TextLine";
import { myStocks } from "@/constants/Data";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const Portfolio = () => {
  const router = useRouter();
  const [hideBalance, setHideBalance] = useState(true);
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <SafeAreaView
        style={{
          paddingHorizontal: 14,
        }}
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

        <TextLine text="" title="My Stocks" />
        <View
          style={{
            flexDirection: "column",
            gap: 6,
          }}
        >
          {myStocks.map((stock) => (
            <TouchableOpacity
              onPress={() => router.replace(`/stock/${stock.code}`)}
              key={stock.code}
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: "row",
                borderBottomColor: Colors.light.tint,
                borderBottomWidth: 1,
                paddingBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <View
                  style={{
                    borderWidth: 1,
                    borderRadius: 30,
                    height: 60,
                    width: 60,
                    borderColor: Colors.light.tint,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={stock.image}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                    }}
                    placeholder={{ blurhash }}
                    contentFit="contain"
                    transition={1000}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 18,
                    }}
                  >
                    {stock.code}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                    }}
                  >
                    {stock.name.substring(0, 15)}
                    {stock.name.length > 15 ? "..." : ""}
                  </Text>
                </View>
              </View>
              <Image
                source={stock.moverGraph}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                }}
                placeholder={{ blurhash }}
                contentFit="contain"
                transition={1000}
              />
              <View
                style={{
                  flexDirection: "column",
                  gap: 4,
                  alignItems: "flex-end",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 16,
                  }}
                >
                  KES{" "}
                  {Number(stock.stockBlanace * stock.dayPrice).toLocaleString()}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {stock.change < 0 ? (
                    <Ionicons
                      name="remove-outline"
                      color={stock.change < 0 ? "#D92A2A" : "#19AF00"}
                      size={18}
                    />
                  ) : (
                    <Ionicons
                      name="add-outline"
                      color={stock.change < 0 ? "#D92A2A" : "#19AF00"}
                      size={18}
                    />
                  )}
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 14,
                      color: stock.change < 0 ? "#D92A2A" : "#19AF00",
                    }}
                  >
                    {stock.changePercentage} %
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default Portfolio;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
