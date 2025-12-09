import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Divider,
  HelperText,
  List,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import {
  vehicleService,
  type DropdownItem,
} from "../../../src/services/vehicle.service";
import {
  vehicleProfileService,
  type VehicleProfileDto,
} from "../../../src/services/vehicleProfile.service";

export default function VehicleDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const profileId = params?.id ? String(params.id) : "";
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleProfileDto | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [distance, setDistance] = useState<string>("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({ visible: false, message: "", error: false });
  const [navigateAfterSnack, setNavigateAfterSnack] = useState(false);
  const [brands, setBrands] = useState<DropdownItem[]>([]);
  const [types, setTypes] = useState<DropdownItem[]>([]);
  const [models, setModels] = useState<DropdownItem[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [typeId, setTypeId] = useState<string | undefined>();
  const [modelId, setModelId] = useState<string | undefined>();
  const [brandModal, setBrandModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [modelModal, setModelModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const data = await vehicleProfileService.getById(profileId);
      setVehicle(data);
      setLicensePlate(data.license_plate || "");
      setDistance(
        data.distance_traveled != null ? String(data.distance_traveled) : ""
      );
      setDescription(data.description || "");
      setBrandId(data.vehicle_brand_id);
      setTypeId(data.vehicle_type_id);
      setModelId(data.vehicle_model_id);
      const [b, t] = await Promise.all([
        vehicleService.getBrandsDropdown(),
        vehicleService.getTypesDropdown(),
      ]);
      setBrands(b);
      setTypes(t);
      // Load models if brand and type are available
      if (data.vehicle_brand_id && data.vehicle_type_id) {
        const m = await vehicleService.getModelsDropdown(
          data.vehicle_brand_id,
          data.vehicle_type_id
        );
        setModels(m);
      } else {
        setModels([]);
      }
    } catch (e: any) {
      setSnackbar({
        visible: true,
        message: e?.message || "Không thể tải thông tin xe",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Load models when brand and type are selected
  const loadModels = useCallback(async () => {
    if (!brandId || !typeId) {
      setModels([]);
      // Only reset model if we're changing brand/type (not on initial load)
      if (vehicle && (brandId !== vehicle.vehicle_brand_id || typeId !== vehicle.vehicle_type_id)) {
        setModelId(undefined);
      }
      return;
    }
    try {
      const m = await vehicleService.getModelsDropdown(brandId, typeId);
      setModels(m);
      // Reset model selection if current model is not in the filtered list
      if (modelId && !m.find((model) => model.id === modelId)) {
        setModelId(undefined);
      }
    } catch (error) {
      console.error("Error loading models:", error);
      setModels([]);
    }
  }, [brandId, typeId, modelId, vehicle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Only load models if vehicle data is already loaded (to avoid loading before initial data)
    if (vehicle) {
      loadModels();
    }
  }, [loadModels, vehicle]);

  function validate() {
    const next: { [k: string]: string } = {};
    if (!licensePlate.trim()) next.license_plate = "Biển số là bắt buộc";
    if (distance && !/^\d{1,10}$/.test(distance))
      next.distance = "Số km phải là số nguyên";
    if (!brandId) next.brand = "Hãng xe là bắt buộc";
    if (!typeId) next.type = "Loại xe là bắt buộc";
    if (!modelId) next.model = "Dòng xe là bắt buộc";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    if (!vehicle) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const updated = await vehicleProfileService.update(vehicle.vehicle_id, {
        license_plate: licensePlate.trim(),
        distance_traveled: distance ? Number(distance) : undefined,
        description: description.trim(),
        vehicle_brand_id: brandId,
        vehicle_type_id: typeId,
        vehicle_model_id: modelId,
        owner_id: user?.user_id || vehicle.owner_id,
        is_active: vehicle?.is_active ?? true,
        is_deleted: vehicle?.is_deleted ?? false,
      });
      setVehicle(updated);
      setNavigateAfterSnack(true);
      setSnackbar({
        visible: true,
        message: "Cập nhật thành công!",
        error: false,
      });
    } catch (e: any) {
      setSnackbar({
        visible: true,
        message: e?.message || "Cập nhật thất bại",
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
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải thông tin xe...</Text>
        </View>
      ) : !vehicle ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Không tìm thấy thông tin xe</Text>
          <Button style={{ marginTop: 12 }} onPress={() => router.back()}>
            Quay lại
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: 32 }}>
          <Card mode="elevated" style={{ borderRadius: 4, marginBottom: 8, backgroundColor: "#ffffff" }}>
            <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
              <Avatar.Icon
                size={64}
                icon="car"
                style={{ backgroundColor: "#E8ECFF" }}
                color="#6C7BEA"
              />
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700" }}>
                {licensePlate || vehicle.license_plate}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="elevated" style={{ borderRadius: 4, marginBottom: 8, backgroundColor: "#ffffff" }}>
            <Card.Title title="Thông tin cơ bản" />
            <Divider />
            <Card.Content>
              <TextInput
                label="Biển số"
                value={licensePlate}
                onChangeText={setLicensePlate}
                mode="outlined"
                style={{ marginTop: 12 }}
                left={<TextInput.Icon icon="card-text" />}
                error={!!errors.license_plate}
              />
              {errors.license_plate ? (
                <HelperText type="error" visible>
                  {errors.license_plate}
                </HelperText>
              ) : null}

              <List.Section>
                <List.Item
                  title="Hãng xe"
                  description={
                    brands.find((b) => b.id === brandId)?.name || "Chọn hãng xe"
                  }
                  left={(props) => <List.Icon {...props} icon="factory" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  onPress={() => setBrandModal(true)}
                />
                {errors.brand ? (
                  <HelperText type="error" visible>
                    {errors.brand}
                  </HelperText>
                ) : null}

                <List.Item
                  title="Loại xe"
                  description={
                    types.find((t) => t.id === typeId)?.name || "Chọn loại xe"
                  }
                  left={(props) => <List.Icon {...props} icon="shape" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  onPress={() => setTypeModal(true)}
                />
                {errors.type ? (
                  <HelperText type="error" visible>
                    {errors.type}
                  </HelperText>
                ) : null}

                <List.Item
                  title="Dòng xe"
                  description={
                    !brandId || !typeId
                      ? "Vui lòng chọn Hãng xe và Loại xe trước"
                      : models.find((m) => m.id === modelId)?.name || "Chọn dòng xe"
                  }
                  left={(props) => <List.Icon {...props} icon="car-sports" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  onPress={() => {
                    if (brandId && typeId) {
                      setModelModal(true);
                    }
                  }}
                  disabled={!brandId || !typeId}
                />
                {errors.model ? (
                  <HelperText type="error" visible>
                    {errors.model}
                  </HelperText>
                ) : null}
              </List.Section>
            </Card.Content>
          </Card>

          <Card mode="elevated" style={{ borderRadius: 4, marginBottom: 8, backgroundColor: "#ffffff" }}>
            <Card.Title title="Thông số & mô tả" />
            <Divider />
            <Card.Content>
              <TextInput
                label="Số km (km)"
                value={distance}
                onChangeText={setDistance}
                keyboardType="number-pad"
                mode="outlined"
                style={{ marginTop: 12, marginBottom: 8 }}
                left={<TextInput.Icon icon="counter" />}
                error={!!errors.distance}
              />
              {errors.distance ? (
                <HelperText type="error" visible>
                  {errors.distance}
                </HelperText>
              ) : null}

              <TextInput
                label="Mô tả"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 8 }}
                left={<TextInput.Icon icon="note-text" />}
              />
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={onSave}
            loading={submitting}
            disabled={submitting}
            contentStyle={{ paddingVertical: 6 }}
          >
            Lưu thay đổi
          </Button>
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={brandModal}
          onDismiss={() => setBrandModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 4,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            <Card.Title title="Chọn hãng xe" />
            {brands.map((b) => (
              <Card
                key={b.id}
                onPress={() => {
                  setBrandId(b.id);
                  setTypeId(undefined); // Reset type when brand changes
                  setModelId(undefined); // Reset model when brand changes
                  setBrandModal(false);
                }}
                style={{ margin: 8, borderRadius: 4, backgroundColor: "#ffffff" }}
              >
                <Card.Title title={b.name} />
              </Card>
            ))}
          </ScrollView>
        </Modal>
        <Modal
          visible={typeModal}
          onDismiss={() => setTypeModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 4,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            <Card.Title title="Chọn loại xe" />
            {types.map((t) => (
              <Card
                key={t.id}
                onPress={() => {
                  setTypeId(t.id);
                  setModelId(undefined); // Reset model when type changes
                  setTypeModal(false);
                }}
                style={{ margin: 8, borderRadius: 4, backgroundColor: "#ffffff" }}
              >
                <Card.Title title={t.name} />
              </Card>
            ))}
          </ScrollView>
        </Modal>
        <Modal
          visible={modelModal}
          onDismiss={() => setModelModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 4,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            <Card.Title title="Chọn dòng xe" />
            {models.length === 0 ? (
              <Card style={{ margin: 8, borderRadius: 4, backgroundColor: "#ffffff" }}>
                <Card.Content>
                  <Text style={{ textAlign: "center", color: "#ff4d4f" }}>
                    Không tìm thấy model nào phù hợp với Hãng xe và Loại xe đã chọn
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              models.map((m) => (
                <Card
                  key={m.id}
                  onPress={() => {
                    setModelId(m.id);
                    setModelModal(false);
                  }}
                  style={{ margin: 8, borderRadius: 4, backgroundColor: "#ffffff" }}
                >
                  <Card.Title title={m.name} />
                </Card>
              ))
            )}
          </ScrollView>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => {
          setSnackbar((s) => ({ ...s, visible: false }));
          if (navigateAfterSnack) {
            setNavigateAfterSnack(false);
            router.back();
          }
        }}
        duration={1200}
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
