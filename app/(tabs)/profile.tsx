import { router } from "expo-router";
import { Alert, Image, View } from "react-native";
import { Avatar, Button, Card, Divider, Text } from "react-native-paper";
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
  const userType = user.user_type;
  const customerRank = user.customer_rank;
  const roleName = user.role?.role_name || "";

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

            <Divider style={{ marginVertical: 8 }} />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                Loại tài khoản:
              </Text>
              <Text variant="bodyMedium">
                {userType === "CUSTOMER" ? "Khách hàng" : "Nhân viên"}
              </Text>
            </View>

            {customerRank && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                  Hạng khách hàng:
                </Text>
                <Text variant="bodyMedium">
                  {customerRank === "BRONZE"
                    ? "Đồng"
                    : customerRank === "SILVER"
                    ? "Bạc"
                    : customerRank === "GOLD"
                    ? "Vàng"
                    : "Bạch kim"}
                </Text>
              </View>
            )}

            {roleName && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                  Vai trò:
                </Text>
                <Text variant="bodyMedium">{roleName}</Text>
              </View>
            )}
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
