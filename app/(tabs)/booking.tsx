import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View>
        <Text>Booking Screen</Text>
      </View>
    </SafeAreaView>
  );
}
