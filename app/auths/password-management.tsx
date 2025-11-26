import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  Divider,
  HelperText,
  List,
  Snackbar,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../src/services/auth.service";
import { useAuth } from "../../src/context/AuthContext";

export default function PasswordManagementScreen() {
  const theme = useTheme();
  const { markPasswordChanged } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({
    visible: false,
    message: "",
    error: false,
  });

  const canSubmit = (() => {
    const allFilled = !!currentPassword && !!newPassword && !!confirmPassword;
    const passwordsMatch = newPassword === confirmPassword && !!newPassword;
    const strengthOk = validatePasswordStrength(newPassword).valid;
    return allFilled && passwordsMatch && strengthOk && !submitting;
  })();

  function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (password.length < 6) {
      errors.push("Tối thiểu 6 ký tự");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Ít nhất 1 ký tự hoa (A-Z)");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Ít nhất 1 ký tự thường (a-z)");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Ít nhất 1 ký tự số (0-9)");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Ít nhất 1 ký tự đặc biệt");
    }
    return { valid: errors.length === 0, errors };
  }

  function validate() {
    const next: { [k: string]: string } = {};
    if (!currentPassword) next.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!newPassword) {
      next.new = "Vui lòng nhập mật khẩu mới";
    } else {
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        next.new = passwordValidation.errors.join(", ");
      }
      if (newPassword && currentPassword && newPassword === currentPassword)
        next.new = "Mật khẩu mới không được trùng mật khẩu hiện tại";
    }
    if (!confirmPassword) next.confirm = "Vui lòng xác nhận mật khẩu mới";
    if (newPassword && confirmPassword && newPassword !== confirmPassword)
      next.confirm = "Xác nhận mật khẩu không khớp";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Mark that password is about to be changed on this device
      // Set flag BEFORE calling API to ensure it's set before WebSocket notification arrives
      markPasswordChanged();
      
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setSnackbar({
        visible: true,
        message: "Đổi mật khẩu thành công! Các thiết bị khác đã được đăng xuất.",
        error: false,
      });
      
      // Keep current device logged in - backend only revokes tokens of other devices
      // Navigate back to profile after a short delay
      setTimeout(() => {
        router.replace("/(tabs)/profile");
      }, 1500);
    } catch (err: any) {
      let message = "Đổi mật khẩu thất bại, vui lòng thử lại.";
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }
      setSnackbar({
        visible: true,
        message,
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9F8F6" }}
      edges={["bottom"]}
    >
      <View style={{ padding: 8, gap: 8 }}>
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title
            title="Đổi mật khẩu"
            subtitle="Vui lòng nhập đủ các thông tin"
          />
          <Divider />
          <Card.Content>
            <TextInput
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry={!showCurrent}
              style={{ marginTop: 12 }}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showCurrent ? "eye-off" : "eye"}
                  onPress={() => setShowCurrent((v) => !v)}
                />
              }
              error={!!errors.current}
            />
            {errors.current ? (
              <HelperText type="error" visible>
                {errors.current}
              </HelperText>
            ) : null}

            <TextInput
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showNew}
              style={{ marginTop: 8 }}
              left={<TextInput.Icon icon="shield-key" />}
              right={
                <TextInput.Icon
                  icon={showNew ? "eye-off" : "eye"}
                  onPress={() => setShowNew((v) => !v)}
                />
              }
              error={!!errors.new}
            />
            {errors.new ? (
              <HelperText type="error" visible>
                {errors.new}
              </HelperText>
            ) : null}

            <TextInput
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirm}
              style={{ marginTop: 8, marginBottom: 12 }}
              left={<TextInput.Icon icon="shield-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirm ? "eye-off" : "eye"}
                  onPress={() => setShowConfirm((v) => !v)}
                />
              }
              error={!!errors.confirm}
            />
            {errors.confirm ? (
              <HelperText type="error" visible>
                {errors.confirm}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={onSubmit}
              loading={submitting}
              disabled={!canSubmit}
              contentStyle={{ paddingVertical: 6 }}
            >
              Đổi mật khẩu
            </Button>
          </Card.Content>
        </Card>

        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Quy tắc mật khẩu" />
          <Divider />
          <Card.Content style={{ paddingVertical: 4 }}>
            <List.Section>
              <List.Item
                title="Tối thiểu 6 ký tự"
                left={(props) => (
                  <List.Icon {...props} icon="checkbox-marked-circle-outline" />
                )}
              />
              <List.Item
                title="Ít nhất 1 ký tự hoa (A-Z)"
                left={(props) => (
                  <List.Icon {...props} icon="format-letter-case-upper" />
                )}
              />
              <List.Item
                title="Ít nhất 1 ký tự thường (a-z)"
                left={(props) => (
                  <List.Icon {...props} icon="format-letter-case" />
                )}
              />
              <List.Item
                title="Ít nhất 1 ký tự số (0-9)"
                left={(props) => <List.Icon {...props} icon="numeric" />}
              />
              <List.Item
                title="Ít nhất 1 ký tự đặc biệt (!@#$%^&*)"
                left={(props) => (
                  <List.Icon {...props} icon="star-circle-outline" />
                )}
              />
            </List.Section>
          </Card.Content>
        </Card>
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={3000}
        style={{
          backgroundColor: snackbar.error
            ? theme.colors.error
            : theme.colors.primary,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}
