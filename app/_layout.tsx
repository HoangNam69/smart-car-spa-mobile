import * as Font from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import {
  ActivityIndicator,
  Button,
  DefaultTheme,
  PaperProvider,
} from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import { WebSocketProviderWrapper } from "../src/providers/WebSocketProvider";
import { theme } from "../src/config/theme";

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6C7BEA", // teal-600, chỉnh theo brand
    accent: "#ffd54f",
  },
};

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
          "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
          "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
        });
        setFontsLoaded(true);
      } catch (e: any) {
        console.warn("Font load failed:", e);
        // Continue even if fonts fail to load
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Log initialization
  useEffect(() => {
    console.log("RootLayout initialized");
  }, []);

  if (!fontsLoaded) {
    // Có thể hiển thị activity indicator hoặc splash
    return (
      <SafeAreaProvider>
        <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} />
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Đã xảy ra lỗi
            </Text>
            <Text style={{ color: "red", marginBottom: 20 }}>{error.message}</Text>
            <Button onPress={() => setError(null)}>Thử lại</Button>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WebSocketProviderWrapper>
          <CartProvider>
            <PaperProvider theme={theme}>
              <StatusBar style="auto" />
              <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auths/login"
                options={{
                  title: "Smart Car Spa",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="auths/signup"
                options={{
                  title: "",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="auths/password-management"
                options={{
                  title: "Đổi mật khẩu",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="auths/forgot-password"
                options={{
                  title: "Quên mật khẩu",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="personal/personal"
                options={{
                  title: "Thông tin cá nhân",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="vehicle-management/vehicle-list"
                options={{
                  title: "Danh sách xe",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="vehicle-management/vehicle-addition"
                options={{
                  title: "Thêm xe mới",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="vehicle-management/vehicle-detail/[id]"
                options={{
                  title: "Chi tiết xe",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="history-management/booking-history/booking-history"
                options={{
                  title: "Lịch sử đặt lịch",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="history-management/booking-history/update-booking/[id]"
                options={{
                  title: "Cập nhật đặt lịch",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="history-management/booking-history/booking-detail/[id]"
                options={{
                  title: "Chi tiết đặt lịch",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="history-management/care-history/care-history"
                options={{
                  title: "Theo dõi hệ thống chăm sóc xe",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
              <Stack.Screen
                name="history-management/care-history/care-process/[id]"
                options={{
                  title: "Quá trình chăm sóc",
                  headerTitleAlign: "center",
                  headerTintColor: "#33363F",
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                  },
                }}
              />
            </Stack>
          </PaperProvider>
        </CartProvider>
        </WebSocketProviderWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
