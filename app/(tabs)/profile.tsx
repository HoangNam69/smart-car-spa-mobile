import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View
        style={{
          padding: 16,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* <Text>Profile Screen</Text> */}
        <Button mode="contained" onPress={() => router.push("/auths/login")} style={{ width: '100%' }}>
          Đăng Nhập
        </Button>
      </View>
    </SafeAreaView>
  );
}
