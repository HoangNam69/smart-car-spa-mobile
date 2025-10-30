import { View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CareProcessScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View>
        <Text>Care Process</Text>
      </View>
    </SafeAreaView>
  );
}
