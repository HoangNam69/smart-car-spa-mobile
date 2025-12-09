import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { ConfirmationResult, FirebaseAuthService } from "../../src/services/firebase-auth.service";
import { SignupRequest } from "../../src/types/auth.types";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, loading } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Phone, 2: OTP, 3: Password
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // OTP state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [snack, setSnack] = useState({ visible: false, msg: "" });

  // Countdown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [otpTimer]);

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber) {
      setSnack({ visible: true, msg: "Vui lòng nhập số điện thoại" });
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setSnack({ visible: true, msg: "Số điện thoại phải có 10 chữ số" });
      return;
    }

    try {
      setLocalLoading(true);
      
      const confirmation = await FirebaseAuthService.sendOTPToPhone(phoneNumber);
      setConfirmationResult(confirmation);
      setCurrentStep(2);
      setOtpTimer(60);
      setOtpExpired(false);
      setSnack({ visible: true, msg: `Mã OTP đã được gửi đến số điện thoại ${phoneNumber}!` });
    } catch (error) {
      console.error("Send OTP error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Gửi OTP thất bại",
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ mã OTP 6 chữ số!" });
      return;
    }

    if (!confirmationResult) {
      setSnack({ visible: true, msg: "Phiên xác thực đã hết hạn. Vui lòng thử lại!" });
      return;
    }

    try {
      setLocalLoading(true);
      
      await FirebaseAuthService.verifyPhoneOTP(confirmationResult, otpCode);
      
      setSnack({ visible: true, msg: "Xác thực số điện thoại thành công!" });
      setCurrentStep(3);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Xác thực OTP thất bại!",
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Step 3: Complete Signup
  const handleCompleteSignup = async () => {
    if (!fullName || !password || !confirmPassword) {
      setSnack({ visible: true, msg: "Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    if (!agreeToTerms) {
      setSnack({ visible: true, msg: "Vui lòng đồng ý với điều khoản sử dụng" });
      return;
    }

    if (password.length < 6) {
      setSnack({ visible: true, msg: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

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

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setLocalLoading(true);
      const confirmation = await FirebaseAuthService.sendOTPToPhone(phoneNumber);
      setConfirmationResult(confirmation);
      setSnack({ visible: true, msg: "Mã OTP mới đã được gửi!" });
      setOtpTimer(60);
      setOtpExpired(false);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setSnack({
        visible: true,
        msg: error instanceof Error ? error.message : "Gửi lại OTP thất bại!",
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
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
              Nhập số điện thoại để nhận mã xác thực
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

            <Button
              mode="contained"
              onPress={handleSendOTP}
              loading={localLoading}
              disabled={localLoading}
              style={{ marginTop: 8 }}
            >
              Gửi Mã Xác Thực
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
          </>
        );

      case 2:
        return (
          <>
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Xác Thực OTP
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 24 }}>
              Nhập mã OTP đã gửi đến {phoneNumber}
            </Text>

            <TextInput
              label="Mã OTP (6 chữ số)"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              mode="outlined"
              style={{ marginBottom: 12 }}
              maxLength={6}
              left={<TextInput.Icon icon="message-text-lock" />}
            />

            {otpTimer > 0 && (
              <Text style={{ textAlign: "center", marginBottom: 12, color: "#666" }}>
                Mã OTP còn hiệu lực trong {otpTimer}s
              </Text>
            )}

            {otpExpired && (
              <Text style={{ textAlign: "center", marginBottom: 12, color: "#FF5722" }}>
                Mã OTP đã hết hạn
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleVerifyOTP}
              loading={localLoading}
              disabled={localLoading}
              style={{ marginTop: 8 }}
            >
              Xác Thực
            </Button>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <Button
                mode="outlined"
                onPress={() => {
                  setCurrentStep(1);
                  setOtpCode("");
                }}
              >
                Quay lại
              </Button>

              <Button
                mode="text"
                onPress={handleResendOTP}
                loading={localLoading}
                disabled={!otpExpired && otpTimer > 0}
              >
                Gửi lại OTP
              </Button>
            </View>
          </>
        );

      case 3:
        return (
          <>
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Hoàn Tất Đăng Ký
            </Text>
            <Text style={{ textAlign: "center", marginBottom: 24 }}>
              Nhập họ tên và mật khẩu
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
              onPress={handleCompleteSignup}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              Hoàn Tất Đăng Ký
            </Button>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <Button
                mode="text"
                onPress={() => {
                  setCurrentStep(2);
                  setFullName("");
                  setPassword("");
                  setConfirmPassword("");
                  setAgreeToTerms(false);
                }}
              >
                Quay lại
              </Button>
            </View>
          </>
        );

      default:
        return null;
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
          <View style={styles.content}>{renderStepContent()}</View>

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
