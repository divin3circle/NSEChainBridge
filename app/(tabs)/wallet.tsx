import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { blurhash, fonts, Colors } from "../../constants/colors";
import { Image } from "expo-image";
import { myTokens } from "@/constants/Data";
import TextLine from "@/components/TextLine";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStocks } from "../hooks/useStocks";
import { useTransactions } from "../hooks/useTransactions";
import { Ionicons } from "@expo/vector-icons";
const { width } = Dimensions.get("window");
import Clipboard from "@react-native-clipboard/clipboard";

interface User {
  _id: string;
  email: string;
  name: string;
  hederaAccountId?: string;
  privateKey?: string;
}
interface TimeSeriesStats {
  to: string;
  high: number;
  low: number;
  average: number;
  standardDeviation: number;
  volatility: number;
  highTimestamp: string;
  lowTimestamp: string;
  dataPoints: number;
}

interface TimeSeriesData {
  last1Days: TimeSeriesStats;
  last7Days: TimeSeriesStats;
  last30Days: TimeSeriesStats;
  last60Days: TimeSeriesStats;
  last90Days: TimeSeriesStats;
}

const Wallet = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState("");

  const copyToClipboard = () => {
    Clipboard.setString(user?.hederaAccountId || "");
    fetchCopiedText();
    setTimeout(() => {
      setCopiedText("");
    }, 2000);
    alert("Copied to clipboard");
  };

  const fetchCopiedText = async () => {
    const text = await Clipboard.getString();
    setCopiedText(text);
  };

  useEffect(() => {
    const fetchLocalUserData = async () => {
      try {
        // Fetch user data
        const user = await AsyncStorage.getItem("user");
        if (user) {
          setUser(JSON.parse(user));
        }

        // Fetch and log wallet details
        // const [
        //   walletConnected,
        //   walletAddress,
        //   walletNetwork,
        //   walletCreatedAt,
        //   walletDetails,
        // ] = await Promise.all([
        //   AsyncStorage.getItem("walletConnected"),
        //   AsyncStorage.getItem("walletAddress"),
        //   AsyncStorage.getItem("walletNetwork"),
        //   AsyncStorage.getItem("walletCreatedAt"),
        //   AsyncStorage.getItem("walletDetails"),
        // ]);

        // console.log("Wallet Details:", {
        //   connected: walletConnected === "true",
        //   address: walletAddress,
        //   network: walletNetwork,
        //   createdAt: walletCreatedAt,
        //   fullDetails: walletDetails ? JSON.parse(walletDetails) : null,
        // });
      } catch (error) {
        console.error("Error fetching wallet details:", error);
      }
    };
    const fetchExchangeRate = async () => {
      const rate = await getExchangeRate();
      setExchangeRate(rate);
    };
    fetchLocalUserData();
    fetchExchangeRate();
  }, []);

  async function getExchangeRate(): Promise<number> {
    try {
      const response = await fetch(
        "https://www.xe.com/api/protected/statistics/?from=USD&to=KES"
      );
      if (!response.ok) {
        return 129.67; // Default fallback rate
      }
      const data: TimeSeriesData = await response.json();
      return data.last1Days.average;
    } catch (error) {
      return 129.65; // Default fallback rate on error
    }
  }
  const { transactions, isLoading, error } = useTransactions();

  const { tokens } = useStocks();

  let randomToken = tokens[Math.floor(Math.random() * tokens.length)];

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
                Account ID
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 20,
                }}
              >
                {user && user.hederaAccountId}
              </Text>
              <TouchableOpacity onPress={copyToClipboard}>
                <Ionicons name="copy" size={14} />
              </TouchableOpacity>
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
              {user && user.name}
            </Text>
          </View>
          <View
            style={{
              width: "50%",
              height: width * 0.6,
              backgroundColor: "#e4e3e3",
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
              KES 24.51
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
              backgroundColor: "#e4e3e3",
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
            <Image
              source={require("../../assets/images/usdc.png")}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                position: "absolute",
                top: 20,
                left: 60,
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
              {exchangeRate ? (
                "KES " + exchangeRate
              ) : (
                <ActivityIndicator size={12} color="#000" />
              )}
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
                fontSize: 14,
                position: "absolute",
                bottom: 45,
                left: 20,
              }}
            >
              {" "}
              KSH / USDC
            </Text>
          </View>
          <View>
            {randomToken && (
              <View
                style={{
                  width: width * 0.48,
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
                  source={
                    randomToken?.image ||
                    require("../../assets/images/hbar.svg")
                  }
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
                    randomToken?.stockBlanace * randomToken?.dayPrice
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
                    color: randomToken?.change < 0 ? "#D92A2A" : "#19AF00",
                  }}
                >
                  {randomToken?.changePercentage ||
                    myTokens[2].changePercentage}{" "}
                  %
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
                  {randomToken?.code || myTokens[2].code}
                </Text>
              </View>
            )}
            {!randomToken && (
              <View
                style={{
                  height: width * 0.6,
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 14,
                  width: width * 0.48,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semiBold,
                    fontSize: 14,
                    color: Colors.light.subtitles,
                    textAlign: "center",
                  }}
                >
                  Mint some tokens
                </Text>
              </View>
            )}
          </View>
        </View>

        <TextLine title="All cryptocurrency" text="" />
        <View
          style={{
            flexDirection: "column",
            gap: 6,
          }}
        >
          {tokens.length === 0 ? (
            <View>
              <Text
                style={{
                  textAlign: "center",
                  fontFamily: fonts.regular,
                  color: Colors.light.subtitles,
                  marginTop: 14,
                  fontSize: 16,
                }}
              >
                No tokens found
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.light.tint,
                  borderRadius: 10,
                  marginTop: 14,
                  width: 200,
                  alignSelf: "center",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
                onPress={() => router.replace("/stock/KCB")}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontFamily: fonts.semiBold,
                    color: Colors.light.subtitles,

                    fontSize: 14,
                  }}
                >
                  Mint a token
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            tokens.map((token) => (
              <TouchableOpacity
                onPress={() => router.replace(`/token/${token.code}`)}
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
                    {Number(
                      token.dayPrice * token.stockBlanace
                    ).toLocaleString()}
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
            ))
          )}
        </View>
        <View
          style={{
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 14,
          }}
        >
          <TextLine title="Transactions" text="" />
          <View
            style={{
              flexDirection: "column",
              gap: 4,
            }}
          >
            {transactions.length === 0 ? (
              <Text>No transactions found</Text>
            ) : (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    marginBottom: 8,
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 16,
                      width: "25%",
                    }}
                  >
                    Type
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 16,
                      width: "25%",
                    }}
                  >
                    Amount
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 16,
                      width: "25%",
                    }}
                  >
                    Token
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.semiBold,
                      fontSize: 16,
                      width: "25%",
                    }}
                  >
                    Status
                  </Text>
                </View>

                {transactions.map((transaction) => (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginVertical: 6,
                      width: "100%",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: "25%",
                        backgroundColor:
                          transaction.type === "MINT" ? "#1ebd02" : "#D92A2A",
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 14,
                          color: "#fff",
                          textAlign: "center",
                        }}
                      >
                        {transaction.type}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        width: "25%",
                      }}
                    >
                      {transaction.amount}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        width: "25%",
                      }}
                    >
                      {transaction.stockCode}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                        width: "25%",
                      }}
                    >
                      {transaction.status}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
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
