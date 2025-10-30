import { View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PasswordManagementScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View>
        <Text>Quản lý mật khẩu</Text>
      </View>
    </SafeAreaView>
  );
}
