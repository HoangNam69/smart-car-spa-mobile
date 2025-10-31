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
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../src/services/auth.service";
import { ForgotPasswordRequest } from "../../src/types/auth.types";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ visible: false, msg: "" });

  const handleForgotPassword = async () => {
    // Validation
    if (!phoneNumber || !newPassword || !confirmPassword) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    // Validate phone number format (Vietnamese phone numbers)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setSnack({ visible: true, msg: "Số điện thoại phải có 10 chữ số" });
      return;
    }

    // Validate password
    if (newPassword.length < 6) {
      setSnack({ visible: true, msg: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      setSnack({ visible: true, msg: "Mật khẩu xác nhận không khớp" });
      return;
    }

    try {
      setLoading(true);
      const payload: ForgotPasswordRequest = {
        phone_number: phoneNumber.trim(),
        new_password: newPassword,
      };

      await authService.forgotPassword(payload);

      setSnack({ visible: true, msg: "Đặt lại mật khẩu thành công" });

      // Navigate to login after successful password reset
      setTimeout(() => {
        router.replace("/auths/login");
      }, 1500);
    } catch (error) {
      console.error("Forgot password error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại",
      });
    } finally {
      setLoading(false);
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
              Quên Mật Khẩu
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 24 }}>
              Nhập số điện thoại và mật khẩu mới để đặt lại
            </Text>

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
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
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
              label="Xác nhận mật khẩu mới"
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

            <Button
              mode="contained"
              onPress={handleForgotPassword}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              Đặt Lại Mật Khẩu
            </Button>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <Text>Nhớ lại mật khẩu? </Text>
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
});
