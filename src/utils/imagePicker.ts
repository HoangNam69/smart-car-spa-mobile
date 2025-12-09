export async function requestMediaLibraryPermissions(): Promise<{ status: "granted" | "denied" | "undetermined" }> {
  try {
    // @ts-ignore - optional dep loaded at runtime
    const ImagePicker: any = await import("expo-image-picker");
    return await ImagePicker.requestMediaLibraryPermissionsAsync();
  } catch (e) {
    return { status: "denied" } as const;
  }
}

export type PickImageResult =
  | { canceled: true }
  | { canceled: false; assets: Array<{ uri: string }> };

export async function pickImageFromLibrary(): Promise<PickImageResult> {
  try {
    // @ts-ignore - optional dep loaded at runtime
    const ImagePicker: any = await import("expo-image-picker");
    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
  } catch (e) {
    return { canceled: true } as const;
  }
}


