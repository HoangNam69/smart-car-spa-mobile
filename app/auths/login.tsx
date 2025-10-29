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
import { useAuth } from "../../src/context/AuthContext";
import { LoginRequest } from "../../src/types/auth.type";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ visible: false, msg: "" });

  const handleLogin = async () => {
    if (!email || !password) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnack({ visible: true, msg: "Vui lòng nhập email hợp lệ" });
      return;
    }

    try {
      const credentials: LoginRequest = {
        email: email.trim(),
        password: password,
      };

      await login(credentials);

      setSnack({ visible: true, msg: "Đăng nhập thành công" });

      // Navigate to main app after successful login
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Đăng nhập thất bại",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <View style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <Image
          source={require("../../assets/images/logo/ShortLogo.png")}
          style={{ width: 160, height: 120, marginTop: 100, marginBottom: 40 }}
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
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            mode="outlined"
            style={{ marginBottom: 12 }}
          />
          <TextInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={{ marginBottom: 12 }}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
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
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },
  content: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
