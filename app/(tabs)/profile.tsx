import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { Alert, Image, ScrollView, View } from "react-native";
import { Avatar, Button, Card, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout, isAuthenticated, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/auths/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            padding: 16,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <Card style={{ padding: 20 }}>
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Image
                  source={require("../../assets/images/logo/ShortLogo.png")}
                  style={{ width: 80, height: 60 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text
                    variant="titleLarge"
                    style={{
                      fontWeight: "bold",
                      color: "#333",
                      lineHeight: 24,
                    }}
                  >
                    Chào mừng bạn đến với Smart Car Spa
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  mode="contained"
                  onPress={() => router.push("/auths/login")}
                  style={{ flex: 1, marginRight: 6 }}
                  buttonColor="#6C7BEA"
                >
                  Đăng Nhập
                </Button>
                <Text style={{ marginHorizontal: 6 }}>hoặc</Text>
                <Button
                  mode="outlined"
                  onPress={() => router.push("/auths/signup")}
                  style={{ flex: 1, marginLeft: 6, borderColor: "#6C7BEA" }}
                  textColor="#6C7BEA"
                >
                  Đăng Ký
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Map snake_case to display values
  const fullName = user.full_name || "";
  const email = user.email || "";
  const phoneNumber = user.phone_number || "";
  const avatarUrl = user.avatar_url || null;

  // Tính initials từ fullName (giống như personal.tsx)
  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
  };

  const initials = getInitials(fullName);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9F8F6" }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <Card
          style={{
            marginBottom: 8,
            borderRadius: 4,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {avatarUrl ? (
                <Avatar.Image
                  size={60}
                  source={{ uri: avatarUrl }}
                  style={{ marginRight: 16 }}
                />
              ) : (
                <Avatar.Text
                  size={60}
                  label={initials}
                  style={{ marginRight: 16 }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                  {fullName}
                </Text>
                <Text variant="bodyMedium" style={{ color: "#666" }}>
                  {email}
                </Text>
                {phoneNumber && (
                  <Text variant="bodyMedium" style={{ color: "#666" }}>
                    {phoneNumber}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
        {/* Account Management */}
        <View
          style={{
            marginBottom: 8,
            backgroundColor: "#ffffff",
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 4,
            width: "100%",
          }}
        >
          <Text
            variant="labelSmall"
            style={{ fontWeight: "bold", color: "#666" }}
          >
            Quản lý tài khoản và thông tin cá nhân
          </Text>
          <Button
            mode="text"
            style={{
              alignItems: "flex-start",
              padding: 4,
              width: "100%",
              borderRadius: 0,
            }}
            textColor="#151515"
            icon="account"
            onPress={() => router.push("/personal/personal")}
          >
            Thông tin tài khoản
          </Button>
          <Divider />
          <Button
            mode="text"
            style={{ alignItems: "flex-start", padding: 4, width: "100%" }}
            icon="lock"
            textColor="#151515"
            onPress={() => router.push("/auths/password-management")}
          >
            Đổi mật khẩu
          </Button>
        </View>

        {/* Vehicle Management */}
        <View
          style={{
            marginBottom: 8,
            backgroundColor: "#ffffff",
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 4,
          }}
        >
          <Text
            variant="labelSmall"
            style={{ fontWeight: "bold", color: "#666" }}
          >
            Quản lý xe
          </Text>
          <Button
            mode="text"
            style={{ alignItems: "flex-start", padding: 4, width: "100%" }}
            textColor="#151515"
            icon="plus"
            onPress={() => router.push("/vehicle-management/vehicle-addition")}
          >
            Thêm xe mới
          </Button>
          <Divider />
          <Button
            mode="text"
            style={{ alignItems: "flex-start", padding: 4, width: "100%" }}
            icon="car-outline"
            textColor="#151515"
            onPress={() => router.push("/vehicle-management/vehicle-list")}
          >
            Danh sách xe
          </Button>
        </View>

        {/* Care History */}
        <View
          style={{
            marginBottom: 8,
            backgroundColor: "#ffffff",
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 4,
          }}
        >
          <Text
            variant="labelSmall"
            style={{ fontWeight: "bold", color: "#666" }}
          >
            Quá trình chăm sóc
          </Text>
          <Button
            mode="text"
            style={{ alignItems: "flex-start", padding: 4, width: "100%" }}
            icon="wrench-outline"
            textColor="#151515"
            onPress={() =>
              router.push("/history-management/care-history/care-history")
            }
          >
            Theo dõi quá trình chăm sóc
          </Button>
        </View>

        <View
          style={{
            marginBottom: 8,
            backgroundColor: "#ffffff",
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 4,
          }}
        >
          <Text
            variant="labelSmall"
            style={{ fontWeight: "bold", color: "#666" }}
          >
            Lịch sử
          </Text>
          <Button
            mode="text"
            style={{ alignItems: "flex-start", padding: 4, width: "100%" }}
            textColor="#151515"
            icon="calendar-outline"
            onPress={() =>
              router.push("/history-management/booking-history/booking-history")
            }
          >
            Lịch sử đặt lịch
          </Button>
        </View>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={{ width: "100%", marginTop: 16, borderWidth: 0 }}
          buttonColor="#ffebee"
          textColor="#d32f2f"
        >
          Đăng Xuất
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
