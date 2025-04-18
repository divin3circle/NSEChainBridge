import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { blurhash, Colors, fonts } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import TextLine from "@/components/TextLine";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
interface User {
  _id: string;
  email: string;
  name: string;
  hederaAccountId?: string;
  privateKey?: string;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchLocalUserData = async () => {
      try {
        // Fetch user data
        const user = await AsyncStorage.getItem("user");
        if (user) {
          setUser(JSON.parse(user));
        }
      } catch (error) {
        console.error("Error fetching wallet details:", error);
      }
    };
    fetchLocalUserData();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 18,
            gap: 8,
          }}
        >
          <Image
            source={require("../../assets/images/profile.avif")}
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
            }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={1000}
          />
          <View>
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 20,
              }}
            >
              {user?.name}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 16,
                marginTop: 3,
                color: Colors.light.subtitles,
              }}
            >
              {user?.email}
            </Text>
          </View>
        </View>
        <View
          style={{
            width: width * 0.9,
            height: width * 0.2,
            backgroundColor: "#f6f9f7",
            borderColor: Colors.light.tint,
            borderWidth: 1,
            borderRadius: 14,
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginVertical: 24,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              gap: 8,
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            <Ionicons name="gift" size={44} color={Colors.light.muted} />
            <View>
              <Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: 18,
                }}
              >
                Broker Account
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 14,
                }}
              >
                Connect to you broker account to mint your tokens
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <TextLine title="Account Settings" text="" />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons name="person" size={34} color={Colors.light.muted} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              Account
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={Colors.light.subtitles}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="finger-print"
              size={34}
              color={Colors.light.muted}
            />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              Security
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={Colors.light.subtitles}
          />
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons
              name="logo-bitcoin"
              size={34}
              color={Colors.light.muted}
            />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              Primary Currency
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 16,
            }}
          >
            HBAR
          </Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons name="card" size={34} color={Colors.light.muted} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              Billing & Security
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={Colors.light.subtitles}
          />
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons name="language" size={34} color={Colors.light.muted} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              Language
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 16,
            }}
          >
            English
          </Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Ionicons name="help" size={34} color={Colors.light.muted} />
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 18,
              }}
            >
              FAQs
            </Text>
          </View>
          <Ionicons
            name="arrow-forward"
            size={24}
            color={Colors.light.subtitles}
          />
        </TouchableOpacity>
        <Text
          style={{
            marginTop: 18,
            color: Colors.light.muted,
            textAlign: "center",
          }}
        >
          v0.0.1
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
