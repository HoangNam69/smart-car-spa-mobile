import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Avatar, HelperText, Text, useTheme } from "react-native-paper";

type Props = {
  uri: string | null;
  label: string; // initials fallback
  size?: number;
  onChange: (nextUri: string | null) => void;
};

export default function AvatarCustom({
  uri,
  label,
  size = 96,
  onChange,
}: Props) {
  const theme = useTheme();
  const [error, setError] = useState<string>("");

  async function ensurePermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Cần quyền truy cập ảnh để chọn avatar.");
      return false;
    }
    setError("");
    return true;
  }

  async function onPick() {
    const ok = await ensurePermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onChange(result.assets[0].uri);
      setError("");
    }
  }

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ position: "relative" }}>
        {uri ? (
          <Avatar.Image size={size} source={{ uri }} />
        ) : (
          <Avatar.Text size={size} label={label} />
        )}
        <TouchableOpacity
          onPress={onPick}
          activeOpacity={0.7}
          style={{
            position: "absolute",
            right: -4,
            bottom: -4,
            backgroundColor: theme.colors.primary,
            width: Math.max(28, size * 0.35),
            height: Math.max(28, size * 0.35),
            borderRadius: Math.max(14, (size * 0.35) / 2),
            alignItems: "center",
            justifyContent: "center",
            elevation: 2,
          }}
        >
          <Text style={{ color: "white", fontSize: Math.max(16, size * 0.2) }}>
            ✎
          </Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}
