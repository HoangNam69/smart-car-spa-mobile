import CarouselCustom from "@/components/carousel/CarouselCustom";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../assets/images/logo/logo-sider.png")}
          style={{ width: 200, marginTop: 20, marginBottom: 20 }}
          resizeMode="contain"
        />
        <CarouselCustom />
      </View>
    </SafeAreaView>
  );
}
