import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { blurhash, Colors, fonts } from "@/constants/Colors";
import { Image } from "expo-image";
import { myStocks, myTokens } from "@/constants/Data";
import TextLine from "@/components/TextLine";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const Wallet = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{
          paddingHorizontal: 14,
          marginTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "50%",
              height: width * 0.6,
              backgroundColor: "#fff",
              borderRadius: 14,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Image
              source={require("../../assets/images/profile.avif")}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                position: "absolute",
                top: 20,
                left: 20,
              }}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 18,
                }}
              >
                Account
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 20,
                }}
              >
                0.0. 12345
              </Text>
              {/* <Ionicons name="copy" size={14} /> */}
            </View>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 20,
                position: "absolute",
                bottom: 20,
                left: 20,
              }}
            >
              sylus44
            </Text>
          </View>
          <View
            style={{
              width: "50%",
              height: width * 0.6,
              backgroundColor: Colors.light.tint,
              borderRadius: 14,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Image
              source={require("../../assets/images/hbar.svg")}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                position: "absolute",
                top: 20,
                left: 20,
              }}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 20,
              }}
            >
              KES{" "}
              {Number(
                myTokens[2].stockBlanace * myTokens[2].dayPrice
              ).toLocaleString()}
            </Text>
            <Text
              style={{
                marginHorizontal: 10,
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 16,
                position: "absolute",
                bottom: 20,
                left: 20,
                color: myTokens[2].change < 0 ? "#D92A2A" : "#19AF00",
              }}
            >
              {myTokens[2].changePercentage}%
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
                position: "absolute",
                bottom: 45,
                left: 20,
              }}
            >
              {" "}
              HBAR
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
            marginVertical: 14,
          }}
        >
          <View
            style={{
              width: "50%",
              height: width * 0.6,
              backgroundColor: "#f6f7f9",
              borderRadius: 14,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Image
              source={require("../../assets/images/ksh.svg")}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                position: "absolute",
                top: 20,
                left: 20,
              }}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 20,
              }}
            >
              KES{" "}
              {Number(
                myTokens[5].stockBlanace * myTokens[5].dayPrice
              ).toLocaleString()}
            </Text>
            <Text
              style={{
                marginHorizontal: 10,
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 16,
                position: "absolute",
                bottom: 20,
                left: 20,
                color: myTokens[5].change < 0 ? "#D92A2A" : "#19AF00",
              }}
            >
              {myTokens[5].changePercentage}%
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
                position: "absolute",
                bottom: 45,
                left: 20,
              }}
            >
              {" "}
              KSH
            </Text>
          </View>
          <View
            style={{
              width: "50%",
              height: width * 0.6,
              backgroundColor: "#fff",
              borderRadius: 14,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Image
              source={myTokens[3].image}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                position: "absolute",
                top: 20,
                left: 20,
              }}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />
            <Text
              style={{
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 20,
              }}
            >
              KES{" "}
              {Number(
                myTokens[3].stockBlanace * myTokens[3].dayPrice
              ).toLocaleString()}
            </Text>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                marginTop: 14,
                fontSize: 16,
                position: "absolute",
                bottom: 20,
                left: 20,
                color: myTokens[3].change < 0 ? "#D92A2A" : "#19AF00",
              }}
            >
              {myTokens[3].changePercentage} %
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
                position: "absolute",
                bottom: 45,
                left: 20,
              }}
            >
              {" "}
              {myTokens[3].code}
            </Text>
          </View>
        </View>
        <TextLine title="All cryptocurrency" text="" />
        <View
          style={{
            flexDirection: "column",
            gap: 6,
          }}
        >
          {myTokens.map((token) => (
            <TouchableOpacity
              onPress={() => router.replace(`/stock/${token.code}`)}
              key={token.code}
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
                    source={token.image}
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
                    {token.code}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                    }}
                  >
                    {token.name.substring(0, 15)}
                    {token.name.length > 15 ? "..." : ""}
                  </Text>
                </View>
              </View>
              <Image
                source={token.moverGraph}
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
                    fontSize: 18,
                  }}
                >
                  KES{" "}
                  {Number(token.dayPrice * token.stockBlanace).toLocaleString()}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                    }}
                  >
                    KES {token.dayPrice}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
