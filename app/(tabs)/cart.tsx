import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View>
        <Text>Cart Screen</Text>
      </View>
    </SafeAreaView>
  );
}
