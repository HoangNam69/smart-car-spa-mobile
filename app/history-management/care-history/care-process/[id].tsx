import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
    ActivityIndicator,
    Card,
    Chip,
    Text,
    useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { bookingService } from "../../../../src/services/booking.service";
import {
    serviceProcessTrackingService,
    type ServiceProcessTrackingInfoDto,
} from "../../../../src/services/serviceProcessTracking.service";

interface ServiceWithTrackings {
  serviceId: string;
  serviceName: string;
  trackings: ServiceProcessTrackingInfoDto[];
}

export default function CareProcessScreen() {
  const theme = useTheme();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [servicesWithTrackings, setServicesWithTrackings] = useState<
    ServiceWithTrackings[]
  >([]);

  const fetchData = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      // Fetch booking details and trackings in parallel
      const [bookingData, trackingsData] = await Promise.all([
        bookingService.getBookingById(bookingId),
        serviceProcessTrackingService.getTrackingsByBooking(bookingId),
      ]);

      // Group trackings by service
      const serviceMap = new Map<string, ServiceWithTrackings>();

      // First, create service groups based on booking_items
      if (bookingData?.booking_items) {
        for (const bookingItem of bookingData.booking_items) {
          if (bookingItem.service_id) {
            const serviceId = bookingItem.service_id;
            const serviceName = bookingItem.item_name || "Dịch vụ chưa có tên";

            if (!serviceMap.has(serviceId)) {
              serviceMap.set(serviceId, {
                serviceId,
                serviceName,
                trackings: [],
              });
            }
          }
        }
      }

      // Then, assign trackings to their corresponding services using carServiceId
      for (const tracking of trackingsData) {
        let assignedServiceId: string | null = null;

        // Priority 1: Use carServiceId if available and valid
        if (tracking.carServiceId && serviceMap.has(tracking.carServiceId)) {
          assignedServiceId = tracking.carServiceId;
        } else if (serviceMap.size > 0) {
          // Priority 2: If no carServiceId, assign to first available service
          assignedServiceId = Array.from(serviceMap.keys())[0];
        }

        if (assignedServiceId && serviceMap.has(assignedServiceId)) {
          const service = serviceMap.get(assignedServiceId)!;
          service.trackings.push(tracking);
        }
      }

      // Filter out services that have no trackings and sort trackings by step order
      const services = Array.from(serviceMap.values())
        .filter((service) => service.trackings.length > 0)
        .map((service) => ({
          ...service,
          trackings: service.trackings.sort(
            (a, b) => (a.serviceStepOrder || 0) - (b.serviceStepOrder || 0)
          ),
        }));

      setServicesWithTrackings(services);
    } catch {
      setServicesWithTrackings([]);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ thực hiện", color: "#8c8c8c", bg: "#F5F5F5" };
      case "IN_PROGRESS":
        return { label: "Đang thực hiện", color: "#1890ff", bg: "#E6F7FF" };
      case "COMPLETED":
        return { label: "Hoàn thành", color: "#52c41a", bg: "#F6FFED" };
      case "CANCELLED":
        return { label: "Đã hủy", color: "#ff4d4f", bg: "#FFF1F0" };
      default:
        return { label: status || "", color: "#8c8c8c", bg: "#F5F5F5" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải quy trình chăm sóc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
      edges={["top", "bottom"]}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {servicesWithTrackings.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <Text>Chưa có thông tin quy trình chăm sóc</Text>
          </View>
        ) : (
          <>
            {servicesWithTrackings.map((service, serviceIndex) => {
              const completedCount = service.trackings.filter(
                (t) => t.status === "COMPLETED"
              ).length;
              const totalCount = service.trackings.length;
              const progressPercent =
                totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0;

              return (
                <View key={service.serviceId} style={{ marginBottom: 24 }}>
                  {/* Service Header */}
                  <Card
                    style={{
                      marginBottom: 16,
                      borderRadius: 12,
                      backgroundColor: "white",
                    }}
                  >
                    <Card.Title
                      title={service.serviceName}
                      subtitle={`${completedCount}/${totalCount} bước hoàn thành`}
                      left={(props) => (
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.primary + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: theme.colors.primary,
                              fontWeight: "bold",
                              fontSize: 16,
                            }}
                          >
                            {serviceIndex + 1}
                          </Text>
                        </View>
                      )}
                    />
                    <Card.Content>
                      <View style={{ marginTop: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <Text style={{ color: "#6b7280", fontSize: 12 }}>
                            Tiến độ:
                          </Text>
                          <Text style={{ fontWeight: "600" }}>
                            {progressPercent}%
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 8,
                            backgroundColor: "#E5E7EB",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: "100%",
                              width: `${progressPercent}%`,
                              backgroundColor: theme.colors.primary,
                            }}
                          />
                        </View>
                      </View>
                    </Card.Content>
                  </Card>

                  {/* Service Steps */}
                  <View style={{ paddingLeft: 8 }}>
                    {service.trackings.map((tracking, index) => {
                      const statusConfig = getStatusConfig(tracking.status);
                      const isLast = index === service.trackings.length - 1;
                      return (
                        <View
                          key={tracking.trackingId}
                          style={{ marginBottom: 16 }}
                        >
                          {/* Timeline indicator */}
                          <View style={{ flexDirection: "row" }}>
                            <View
                              style={{
                                width: 40,
                                alignItems: "center",
                                marginRight: 12,
                              }}
                            >
                              <View
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 16,
                                  backgroundColor: statusConfig.color,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderWidth: 3,
                                  borderColor: "white",
                                }}
                              >
                                <Text
                                  style={{
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: 14,
                                  }}
                                >
                                  {tracking.serviceStepOrder || index + 1}
                                </Text>
                              </View>
                              {!isLast && (
                                <View
                                  style={{
                                    width: 2,
                                    flex: 1,
                                    backgroundColor: "#E0E0E0",
                                    marginTop: 4,
                                    marginBottom: -16,
                                  }}
                                />
                              )}
                            </View>
                            <Card
                              style={{
                                flex: 1,
                                borderRadius: 12,
                                backgroundColor: "white",
                              }}
                            >
                              <Card.Title
                                title={`Bước ${
                                  tracking.serviceStepOrder || index + 1
                                }: ${
                                  tracking.serviceStepName || "Chưa có tên"
                                }`}
                                subtitle={tracking.serviceStepDescription}
                                titleNumberOfLines={2}
                              />
                              <Card.Content>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    gap: 8,
                                    marginBottom: 12,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Chip
                                    compact
                                    style={{ backgroundColor: statusConfig.bg }}
                                  >
                                    <Text
                                      style={{
                                        color: statusConfig.color,
                                        fontWeight: "600",
                                      }}
                                    >
                                      {statusConfig.label}
                                    </Text>
                                  </Chip>
                                  {tracking.isRequired && (
                                    <Chip
                                      compact
                                      style={{ backgroundColor: "#FFF1F0" }}
                                    >
                                      <Text
                                        style={{
                                          color: "#ff4d4f",
                                          fontSize: 11,
                                        }}
                                      >
                                        Bắt buộc
                                      </Text>
                                    </Chip>
                                  )}
                                  {tracking.estimatedTime && (
                                    <Chip
                                      compact
                                      style={{ backgroundColor: "#E6F7FF" }}
                                    >
                                      <Text
                                        style={{
                                          color: "#1890ff",
                                          fontSize: 11,
                                        }}
                                      >
                                        ~{tracking.estimatedTime} phút
                                      </Text>
                                    </Chip>
                                  )}
                                </View>
                                {tracking.technicianName && (
                                  <View style={{ marginBottom: 8 }}>
                                    <Text
                                      style={{ color: "#6b7280", fontSize: 12 }}
                                    >
                                      Kỹ thuật viên:
                                    </Text>
                                    <Text
                                      style={{
                                        fontWeight: "600",
                                        marginTop: 2,
                                      }}
                                    >
                                      {tracking.technicianName}
                                    </Text>
                                  </View>
                                )}
                                {tracking.startTime && (
                                  <View style={{ marginBottom: 8 }}>
                                    <Text
                                      style={{ color: "#6b7280", fontSize: 12 }}
                                    >
                                      Bắt đầu:
                                    </Text>
                                    <Text style={{ marginTop: 2 }}>
                                      {new Date(
                                        tracking.startTime
                                      ).toLocaleString()}
                                    </Text>
                                  </View>
                                )}
                                {tracking.endTime && (
                                  <View style={{ marginBottom: 8 }}>
                                    <Text
                                      style={{ color: "#6b7280", fontSize: 12 }}
                                    >
                                      Kết thúc:
                                    </Text>
                                    <Text style={{ marginTop: 2 }}>
                                      {new Date(
                                        tracking.endTime
                                      ).toLocaleString()}
                                    </Text>
                                  </View>
                                )}
                                {tracking.notes && (
                                  <View
                                    style={{
                                      marginTop: 8,
                                      padding: 12,
                                      backgroundColor: "#F9FAFB",
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#6b7280",
                                        fontSize: 12,
                                        marginBottom: 4,
                                      }}
                                    >
                                      Ghi chú:
                                    </Text>
                                    <Text>{tracking.notes}</Text>
                                  </View>
                                )}
                              </Card.Content>
                            </Card>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
