import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Checkbox, Snackbar, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { SignupRequest } from "../../src/types/auth.types";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading } = useAuth();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [snack, setSnack] = useState({ visible: false, msg: "" });

  const handleSignup = async () => {
    // Validation
    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    if (!agreeToTerms) {
      setSnack({ visible: true, msg: "Vui lòng đồng ý với điều khoản sử dụng" });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setSnack({ visible: true, msg: "Số điện thoại phải có 10 chữ số" });
      return;
    }

    // Validate password
    if (password.length < 6) {
      setSnack({ visible: true, msg: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setSnack({ visible: true, msg: "Mật khẩu xác nhận không khớp" });
      return;
    }

    try {
      const signupData: SignupRequest = {
        email: null,
        password: password,
        google_id: null,
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        date_of_birth: new Date().toISOString(),
        gender: "MALE",
        address: "",
        avatar_url: null,
      };

      await signup(signupData);

      setSnack({ visible: true, msg: "Đăng ký thành công! Chào mừng bạn đến với Smart Car SPA!" });

      // Navigate to main app after successful signup
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Đăng ký thất bại",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ justifyContent: "flex-start", alignItems: "center" }}>
          <Image
            source={require("../../assets/images/logo/ShortLogo.png")}
            style={{ width: 160, height: 120, marginTop: 60, marginBottom: 40 }}
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
              Đăng Ký Tài Khoản
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 24 }}>
              Nhập thông tin để tạo tài khoản mới
            </Text>

            <TextInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={{ marginBottom: 12 }}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              mode="outlined"
              style={{ marginBottom: 12 }}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={{ marginBottom: 12 }}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              mode="outlined"
              style={{ marginBottom: 12 }}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {/* Terms Checkbox */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={agreeToTerms ? "checked" : "unchecked"}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              />
              <Text style={styles.checkboxLabel}>
                Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật
              </Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              Đăng Ký
            </Button>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <Text>Đã có tài khoản? </Text>
              <Button compact onPress={() => router.back()}>
                Đăng nhập
              </Button>
            </View>
          </View>

          <Snackbar
            visible={snack.visible}
            onDismiss={() => setSnack({ ...snack, visible: false })}
            duration={3000}
          >
            {snack.msg}
          </Snackbar>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
});
