import { router } from "expo-router";
import { Alert, Image, View } from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";

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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, padding: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Avatar.Text
                size={60}
                label={fullName.charAt(0).toUpperCase()}
                style={{ marginRight: 16 }}
              />
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
        <Card style={{ marginBottom: 16 }}>
          <Card.Title
            title="Tài khoản"
            titleStyle={{ color: "#6C7BEA", fontWeight: "bold" }}
          />
          <Card.Content>
            <View>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                textColor="#151515"
                icon="account"
                onPress={() => router.push("/personal/personal")}
              >
                Thông tin tài khoản
              </Button>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                icon="lock"
                textColor="#151515"
                onPress={() => router.push("/auths/password-management")}
              >
                Đổi mật khẩu
              </Button>
            </View>
          </Card.Content>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <Card.Title
            title="Quản lý xe"
            titleStyle={{ color: "#6C7BEA", fontWeight: "bold" }}
          />
          <Card.Content>
            <View>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                textColor="#151515"
                icon="plus"
                onPress={() =>
                  router.push("/vehicle-management/vehicle-addition")
                }
              >
                Thêm xe mới
              </Button>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                icon="car-outline"
                textColor="#151515"
                onPress={() => router.push("/vehicle-management/vehicle-list")}
              >
                Danh sách xe
              </Button>
            </View>
          </Card.Content>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <Card.Title
            title="Lịch sử"
            titleStyle={{ color: "#6C7BEA", fontWeight: "bold" }}
          />
          <Card.Content>
            <View>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                textColor="#151515"
                icon="calendar-outline"
                onPress={() =>
                  router.push(
                    "/history-management/booking-history/booking-history"
                  )
                }
              >
                Lịch sử đặt lịch
              </Button>
              <Button
                mode="text"
                style={{ alignItems: "flex-start" }}
                icon="wrench-outline"
                textColor="#151515"
                onPress={() =>
                  router.push("/history-management/care-history/care-history")
                }
              >
                Lịch sử chăm sóc xe
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={{ width: "100%" }}
          buttonColor="#ffebee"
          textColor="#d32f2f"
        >
          Đăng Xuất
        </Button>
      </View>
    </SafeAreaView>
  );
}
