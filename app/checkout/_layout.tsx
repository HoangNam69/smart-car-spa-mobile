import { Stack } from "expo-router";

export default function CheckoutLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: "Đặt hàng thành công",
          headerShown: true,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
