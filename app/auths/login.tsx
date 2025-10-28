import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <View style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <Image
          source={require("../../assets/images/logo/ShortLogo.png")}
          style={{ width: 160, height: 120, marginTop: 20, marginBottom: 20 }}
          resizeMode="contain"
        />
      </View>
      <View
        style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
          Đăng Nhập
        </Text>
      </View>
    </SafeAreaView>
  );
}
