import * as Font from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DefaultTheme,
  PaperProvider,
} from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";

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

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Roboto-Regular": require("../assets/fonts/Roboto-Regular.ttf"),
        "Roboto-Medium": require("../assets/fonts/Roboto-Medium.ttf"),
        "Roboto-Bold": require("../assets/fonts/Roboto-Bold.ttf"),
      }).catch((e: any) => {
        console.warn("Font load failed:", e);
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    // Có thể hiển thị activity indicator hoặc splash
    return (
      <SafeAreaProvider>
        <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
              name="history-management/care-history/care-history"
              options={{
                title: "Lịch sử chăm sóc xe",
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
      </AuthProvider>
    </SafeAreaProvider>
  );
}
