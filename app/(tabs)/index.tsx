import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { blurhash, Colors, fonts } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import TextLine from "@/components/TextLine";
import { topMovers } from "@/constants/Data";
import StockCard from "@/components/StockCard";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MyHoldings from "../components/MyHoldings";
import { useStocks } from "../hooks/useStocks";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
export const BALANCE = 241400.54;
export const GROWTH = 8.96;

interface User {
  _id: string;
  email: string;
  name: string;
  hederaAccountId?: string;
  privateKey?: string;
}

const Home = () => {
  const router = useRouter();
  const { stocks } = useStocks();
  const [user, setUser] = useState<User | null>(null);
  const BALANCE = stocks.reduce((acc, stock) => {
    return acc + Number(stock.dayPrice * stock.stockBlanace);
  }, 0);

  useEffect(() => {
    const fetchLocalUserData = async () => {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        setUser(JSON.parse(user));
      }
    };
    fetchLocalUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
              }}
            >
              Good Morning,
            </Text>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 22,
              }}
            >
              {user?.name}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => router.navigate("/agent")}
              style={{
                width: 44,
                height: 44,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="chatbox-ellipses"
                size={34}
                color={Colors.light.muted}
              />
            </TouchableOpacity>
            <View
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: Colors.light.muted,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="notifications"
                size={34}
                color={Colors.light.muted}
              />
              <View
                style={{
                  backgroundColor: Colors.light.primary,
                  width: 14,
                  height: 14,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  borderRadius: 7,
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 10,
                    color: "#f6f7f9",
                  }}
                >
                  4
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={{
            height: width * 0.4,
            padding: 16,
            backgroundColor: Colors.light.primary,
            borderRadius: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 14,
          }}
          onPress={() => router.replace("/(tabs)/portfolio")}
        >
          <View
            style={{
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 20,
                color: "#f6f7f9",
              }}
            >
              My Portfolio
            </Text>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 28,
                marginTop: 14,
                color: "#f6f7f9",
              }}
            >
              KES {BALANCE.toLocaleString()}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Ionicons name="caret-up" size={20} color="#f6f7f9" />
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 14,
                  color: "#f6f7f9",
                }}
              >
                {GROWTH} % in the last 7 days
              </Text>
            </View>
          </View>
          <Image
            source={require("../../assets/images/chartvector.png")}
            style={{
              width: 150,
              height: 150,
            }}
            placeholder={{ blurhash }}
            contentFit="contain"
            transition={1000}
          />
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "column",
            gap: 8,
          }}
        >
          <TextLine title="Top Movers" text="" />
          <View
            style={{
              flexDirection: "column",
              gap: 12,
            }}
          >
            {topMovers.map((mover) => (
              <TouchableOpacity
                onPress={() => router.replace(`/stock/${mover.code}`)}
                key={mover.code}
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
                      source={mover.image}
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
                      {mover.code}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                      }}
                    >
                      {mover.name.substring(0, 15)}
                      {mover.name.length > 15 ? "..." : ""}
                    </Text>
                  </View>
                </View>
                <Image
                  source={mover.moverGraph}
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
                    KES {mover.dayPrice}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {mover.change < 0 ? (
                      <Ionicons
                        name="caret-down"
                        color={mover.change < 0 ? "#D92A2A" : "#19AF00"}
                        size={20}
                      />
                    ) : (
                      <Ionicons
                        name="caret-up"
                        color={mover.change < 0 ? "#D92A2A" : "#19AF00"}
                        size={20}
                      />
                    )}
                    <Text
                      style={{
                        fontFamily: fonts.regular,
                        fontSize: 14,
                      }}
                    >
                      {mover.changePercentage} %
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={{
            marginTop: 14,
          }}
        >
          <TextLine title="Watchlist" text="" />
          <FlatList
            key="grid"
            data={topMovers}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <StockCard stock={item} />
              </View>
            )}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  holdingsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  content: {
    flexDirection: "column",
    gap: 8,
    marginHorizontal: 14,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    maxWidth: "50%",
  },
  row: {
    flex: 1,
    justifyContent: "space-between",
  },
});
