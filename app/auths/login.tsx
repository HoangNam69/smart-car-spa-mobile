import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ visible: false, msg: "" });

  const handleLogin = async () => {
    if (!phone || !password) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }
    try {
      setLoading(true);
      // Giả lập gọi API gửi Login
      await new Promise((r) => setTimeout(r, 800));
      setSnack({ visible: true, msg: "Đăng nhập thành công" });
    } catch (e) {
      setSnack({ visible: true, msg: "Đăng nhập thất bại" });
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <View style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <Image
          source={require("../../assets/images/logo/ShortLogo.png")}
          style={{ width: 160, height: 120, marginTop: 20, marginBottom: 20 }}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Đăng Nhập
          </Text>
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            Nhập vào thôn tin đăng nhập
          </Text>

          <TextInput
            label="Số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={{ marginBottom: 12 }}
            left={<TextInput.Affix text="+84 " />}
          />
          <TextInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={{ marginBottom: 12 }}
            right={<TextInput.Icon icon="eye" />}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          >
            Đăng Nhập
          </Button>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Text>Bạn chưa có tài khoản? </Text>
            <Button compact onPress={() => router.push("/auths/signup")}>
              Đăng ký
            </Button>
          </View>
        </View>

        <Snackbar
          visible={snack.visible}
          onDismiss={() => setSnack({ ...snack, visible: false })}
        >
          {snack.msg}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  content: { padding: 20 },
});
