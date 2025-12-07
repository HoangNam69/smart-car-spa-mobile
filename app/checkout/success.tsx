import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Card, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.container}
      edges={[]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <IconButton
              icon="check-circle"
              size={100}
              iconColor="#52c41a"
              style={styles.icon}
            />
          </View>

          {/* Success Message */}
          <Text
            variant="headlineMedium"
            style={styles.title}
          >
            Đặt hàng thành công!
          </Text>

          <Text
            variant="bodyLarge"
            style={styles.description}
          >
            Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian
            sớm nhất để xác nhận đơn hàng.
          </Text>

          {/* Order Details Card */}
          <Card
            style={styles.card}
            mode="elevated"
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                style={styles.cardTitle}
              >
                Thông tin đơn hàng
              </Text>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#666"
                />
                <View style={styles.infoContent}>
                  <Text
                    variant="bodySmall"
                    style={styles.infoLabel}
                  >
                    Thời gian đặt hàng
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={styles.infoValue}
                  >
                    {new Date().toLocaleString("vi-VN")}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color="#666"
                />
                <View style={styles.infoContent}>
                  <Text
                    variant="bodySmall"
                    style={styles.infoLabel}
                  >
                    Trạng thái
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.infoValue, styles.statusText]}
                  >
                    Đang xử lý
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color="#666"
                />
                <View style={styles.infoContent}>
                  <Text
                    variant="bodySmall"
                    style={styles.infoLabel}
                  >
                    Liên hệ
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={styles.infoValue}
                  >
                    Chúng tôi sẽ gọi điện xác nhận trong ít phút
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push("/")}
              style={styles.homeButton}
              contentStyle={styles.buttonContent}
            >
              Về trang chủ
            </Button>

            <Button
              mode="outlined"
              onPress={() => router.push("/products")}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Tiếp tục mua hàng
            </Button>
          </View>

          {/* Additional Info */}
          <Card
            style={styles.infoCard}
            mode="outlined"
          >
            <Card.Content>
              <View style={styles.tipRow}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={24}
                  color="#faad14"
                />
                <Text
                  variant="bodyMedium"
                  style={styles.tipText}
                >
                  Bạn có thể theo dõi trạng thái đơn hàng trong phần &ldquo;Lịch
                  sử đặt hàng&rdquo;
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    margin: 0,
  },
  title: {
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  card: {
    width: "100%",
    marginBottom: 24,
    backgroundColor: "white",
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    color: "#1a1a1a",
    fontWeight: "500",
  },
  statusText: {
    color: "#faad14",
  },
  actions: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  homeButton: {
    borderRadius: 12,
    backgroundColor: "#6C7BEA",
  },
  continueButton: {
    borderRadius: 12,
    borderColor: "#6C7BEA",
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    width: "100%",
    borderColor: "#ffd591",
    backgroundColor: "#fffbe6",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipText: {
    flex: 1,
    color: "#666",
    lineHeight: 20,
  },
});
