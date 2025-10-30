import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  HelperText,
  List,
  RadioButton,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AvatarCustom from "../../components/avatar/AvatarCustom";
import { useAuth } from "../../src/context/AuthContext";

type GenderValue = "Nam" | "Nữ" | "";

function toVietnameseGender(value?: string | null): GenderValue {
  if (!value) return "";
  const v = String(value).trim().toUpperCase();
  if (v === "MALE" || v === "NAM") return "Nam";
  if (v === "FEMALE" || v === "NU" || v === "NỮ") return "Nữ";
  // Các giá trị khác (OTHER, null, ...) sẽ không set
  return "";
}

function toBackendGender(value?: GenderValue): "MALE" | "FEMALE" | undefined {
  if (!value) return undefined;
  if (value === "Nam") return "MALE";
  if (value === "Nữ") return "FEMALE";
  return undefined;
}

function formatDateDisplay(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseDateInput(input: string): string | undefined {
  // Accept dd/mm/yyyy or yyyy-mm-dd, store ISO string (yyyy-mm-dd)
  if (!input) return undefined;
  const slash = input.match(/^([0-3]?\d)\/(0?\d|1[0-2])\/(\d{4})$/);
  if (slash) {
    const dd = Number(slash[1]);
    const mm = Number(slash[2]);
    const yyyy = Number(slash[3]);
    const d = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const isoish = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoish) {
    const d = new Date(`${isoish[1]}-${isoish[2]}-${isoish[3]}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

export default function PersonalScreen() {
  const theme = useTheme();
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [dob, setDob] = useState<Date | null>(
    user?.date_of_birth ? new Date(user.date_of_birth) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDisplay, setDobDisplay] = useState(
    user?.date_of_birth ? formatDateDisplay(user.date_of_birth) : ""
  );
  const [gender, setGender] = useState<GenderValue>(
    toVietnameseGender(user?.gender)
  );
  const [address, setAddress] = useState(user?.address ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatar_url ?? null
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({ visible: false, message: "", error: false });

  // Update dob+dodDisplay khi user đổi
  useEffect(() => {
    setDob(user?.date_of_birth ? new Date(user.date_of_birth) : null);
    setDobDisplay(
      user?.date_of_birth ? formatDateDisplay(user.date_of_birth) : ""
    );
  }, [user?.date_of_birth]);

  function handleShowDatePicker() {
    setShowDatePicker(true);
  }

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate);
      setDobDisplay(formatDateDisplay(selectedDate.toISOString()));
    }
  }

  useEffect(() => {
    // Keep form in sync if context user changes
    setFullName(user?.full_name ?? "");
    setPhone(user?.phone_number ?? "");
    setEmail(user?.email ?? "");
    setDobDisplay(formatDateDisplay(user?.date_of_birth));
    setGender(toVietnameseGender(user?.gender));
    setAddress(user?.address ?? "");
    setAvatarUri(user?.avatar_url ?? "");
  }, [user]);

  const initials = useMemo(() => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
  }, [fullName]);

  const isEmailLocked = useMemo(
    () => Boolean(user?.email && user.email.trim().length > 0),
    [user?.email]
  );
  const isPhoneLocked = useMemo(
    () => Boolean(user?.phone_number && user.phone_number.trim().length > 0),
    [user?.phone_number]
  );

  function validate() {
    const next: { [k: string]: string } = {};
    if (!fullName.trim()) next.fullName = "Họ và tên là bắt buộc";
    if (!isEmailLocked && email && !/^\S+@\S+\.\S+$/.test(email))
      next.email = "Email không hợp lệ";
    if (!isPhoneLocked && phone && !/^[0-9+\-()\s]{8,15}$/.test(phone))
      next.phone = "Số điện thoại không hợp lệ";
    if (dobDisplay) {
      const parsed = parseDateInput(dobDisplay);
      if (!parsed) next.date_of_birth = "Ngày sinh không hợp lệ (dd/mm/yyyy)";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await updateUser({
        full_name: fullName.trim(),
        phone_number: phone.trim() || "",
        email: email.trim() || "",
        date_of_birth: dob ? dob.toISOString().slice(0, 10) : "",
        gender: toBackendGender(gender) || "MALE",
        address: address.trim() || "",
        avatar_url: avatarUri ?? "",
      });
      setSnackbar({
        visible: true,
        message: "Cập nhật thành công!",
        error: false,
      });
    } catch (err: any) {
      setSnackbar({
        visible: true,
        message: err?.message || "Cập nhật thất bại, vui lòng thử lại.",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
      edges={["top", "bottom"]}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Card mode="elevated" style={{ marginBottom: 16 }}>
          <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
            <AvatarCustom
              uri={avatarUri}
              label={initials}
              size={100}
              onChange={setAvatarUri}
            />
            <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "600" }}>
              {fullName || "Khách hàng"}
            </Text>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={{ marginBottom: 16 }}>
          <List.Subheader>Thông tin cá nhân</List.Subheader>
          <Divider />
          <Card.Content>
            <TextInput
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={{ marginTop: 12 }}
              left={<TextInput.Icon icon="account" />}
              error={!!errors.fullName}
            />
            {errors.fullName ? (
              <HelperText type="error" visible>
                {errors.fullName}
              </HelperText>
            ) : null}

            <Pressable onPress={handleShowDatePicker}>
              <View pointerEvents="none">
                <TextInput
                  label="Ngày sinh"
                  value={dobDisplay}
                  mode="outlined"
                  editable={false}
                  style={{ marginTop: 8 }}
                  left={<TextInput.Icon icon="calendar" />}
                  error={!!errors.date_of_birth}
                />
              </View>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={dob ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {errors.date_of_birth ? (
              <HelperText type="error" visible>
                {errors.date_of_birth}
              </HelperText>
            ) : null}

            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <Text style={{ marginBottom: 8 }}>Giới tính</Text>
              <RadioButton.Group
                onValueChange={(v) => setGender(v as GenderValue)}
                value={gender}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <RadioButton value="Nam" />
                    <Text>Nam</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <RadioButton value="Nữ" />
                    <Text>Nữ</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <TextInput
              label="Địa chỉ"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ marginTop: 4, marginBottom: 8 }}
              left={<TextInput.Icon icon="home" />}
            />
          </Card.Content>
        </Card>

        <Card mode="elevated" style={{ marginBottom: 24 }}>
          <List.Subheader>Liên hệ</List.Subheader>
          <Divider />
          <Card.Content>
            <TextInput
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              mode="outlined"
              style={{ marginTop: 12 }}
              left={<TextInput.Icon icon="phone" />}
              right={isPhoneLocked ? <TextInput.Icon icon="lock" /> : undefined}
              editable={!isPhoneLocked}
              disabled={isPhoneLocked}
              error={!!errors.phone}
            />
            {errors.phone ? (
              <HelperText type="error" visible>
                {errors.phone}
              </HelperText>
            ) : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={{ marginTop: 8, marginBottom: 4 }}
              left={<TextInput.Icon icon="email" />}
              right={isEmailLocked ? <TextInput.Icon icon="lock" /> : undefined}
              editable={!isEmailLocked}
              disabled={isEmailLocked}
              error={!!errors.email}
            />
            {errors.email ? (
              <HelperText type="error" visible>
                {errors.email}
              </HelperText>
            ) : null}
          </Card.Content>
        </Card>

        <View style={{ height: 72 }} />
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      >
        <Button
          mode="contained"
          onPress={onSave}
          loading={submitting}
          disabled={submitting}
          contentStyle={{ paddingVertical: 6 }}
        >
          Lưu thay đổi
        </Button>
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
