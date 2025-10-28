import { router } from "expo-router";
import { Button, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View>
        {/* <Text>Profile Screen</Text> */}
        <Button title="Login" onPress={() => router.push("/auths/login")} />
      </View>
    </SafeAreaView>
  );
}
