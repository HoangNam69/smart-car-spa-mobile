import { router } from "expo-router";
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
import { useAuth } from "../../src/context/AuthContext";
import {
  vehicleService,
  type DropdownItem,
} from "../../src/services/vehicle.service";
import { vehicleProfileService } from "../../src/services/vehicleProfile.service";

export default function VehicleAdditionScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const [licensePlate, setLicensePlate] = useState("");
  const [distance, setDistance] = useState<string>("");
  const [description, setDescription] = useState("");
  const [brands, setBrands] = useState<DropdownItem[]>([]);
  const [types, setTypes] = useState<DropdownItem[]>([]);
  const [models, setModels] = useState<DropdownItem[]>([]);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [typeId, setTypeId] = useState<string | undefined>();
  const [modelId, setModelId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({ visible: false, message: "", error: false });
  const [navigateAfterSnack, setNavigateAfterSnack] = useState(false);
  const [brandModal, setBrandModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [modelModal, setModelModal] = useState(false);

  const loadDropdowns = useCallback(async () => {
    setLoading(true);
    try {
      const [b, t, m] = await Promise.all([
        vehicleService.getBrandsDropdown(),
        vehicleService.getTypesDropdown(),
        vehicleService.getModelsDropdown(),
      ]);
      setBrands(b);
      setTypes(t);
      setModels(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

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

  async function onCreate() {
    if (!user?.user_id) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await vehicleProfileService.create({
        license_plate: licensePlate.trim(),
        distance_traveled: distance ? Number(distance) : undefined,
        description: description.trim(),
        vehicle_brand_id: brandId,
        vehicle_type_id: typeId,
        vehicle_model_id: modelId,
        owner_id: user.user_id,
        is_active: true,
        is_deleted: false,
      });
      setNavigateAfterSnack(true);
      setSnackbar({
        visible: true,
        message: "Thêm xe thành công!",
        error: false,
      });
    } catch (e: any) {
      setSnackbar({
        visible: true,
        message: e?.message || "Thêm xe thất bại",
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
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
              <Avatar.Icon
                size={64}
                icon="car"
                style={{ backgroundColor: "#E8ECFF" }}
                color="#6C7BEA"
              />
              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "700" }}>
                {licensePlate || "Biển số"}
              </Text>
            </Card.Content>
          </Card>

          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Title title="Biển số" />
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
            </Card.Content>
          </Card>

          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Title title="Thông tin xe" />
            <Divider />
            <Card.Content>
              <List.Item
                title="Hãng xe"
                description={
                  brands.find((b) => b.id === brandId)?.name || "Chọn hãng xe"
                }
                left={(props) => <List.Icon {...props} icon="factory" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
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
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
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
                  models.find((m) => m.id === modelId)?.name || "Chọn dòng xe"
                }
                left={(props) => <List.Icon {...props} icon="car-sports" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setModelModal(true)}
              />
              {errors.model ? (
                <HelperText type="error" visible>
                  {errors.model}
                </HelperText>
              ) : null}
            </Card.Content>
          </Card>

          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
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
            onPress={onCreate}
            loading={submitting}
            disabled={submitting}
            contentStyle={{ paddingVertical: 6 }}
          >
            Thêm xe
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
            borderRadius: 12,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            {brands.map((b) => (
              <Card
                key={b.id}
                onPress={() => {
                  setBrandId(b.id);
                  setBrandModal(false);
                }}
                style={{ margin: 8 }}
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
            borderRadius: 12,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            {types.map((t) => (
              <Card
                key={t.id}
                onPress={() => {
                  setTypeId(t.id);
                  setTypeModal(false);
                }}
                style={{ margin: 8 }}
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
            borderRadius: 12,
          }}
        >
          <ScrollView style={{ maxHeight: 360 }}>
            {models.map((m) => (
              <Card
                key={m.id}
                onPress={() => {
                  setModelId(m.id);
                  setModelModal(false);
                }}
                style={{ margin: 8 }}
              >
                <Card.Title title={m.name} />
              </Card>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => {
          setSnackbar((s) => ({ ...s, visible: false }));
          if (navigateAfterSnack) {
            setNavigateAfterSnack(false);
            router.replace("/vehicle-management/vehicle-list");
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
