import axiosInstance from "../config/axiosConfig";
import { API_CONFIG, API_ENDPOINTS } from "../config/api.constant";
import { tokenStorage } from "../storage/tokenStorage";
import { UpdateUserRequest, UpdateUserResponse, UploadAvatarResponse } from "../types/user.types";

export const userService = {
  /**
   * Cập nhật thông tin user
   * @param userId
   * @param data
   */
  async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const response = await axiosInstance.post(`/users/${userId}/update`, data);
    return response.data as UpdateUserResponse;
  },

  /**
   * Upload avatar cho user
   * @param userId
   * @param imageUri - Local URI từ expo-image-picker (format: file://...)
   */
  async uploadAvatar(
    userId: string,
    imageUri: string
  ): Promise<UploadAvatarResponse> {
    // Lấy tên file và extension từ URI
    const uriParts = imageUri.split('.');
    const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    
    // Xác định MIME type
    let mimeType = 'image/jpeg';
    if (fileExtension === 'png') {
      mimeType = 'image/png';
    } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (fileExtension === 'gif') {
      mimeType = 'image/gif';
    } else if (fileExtension === 'webp') {
      mimeType = 'image/webp';
    }
    
    // Tạo tên file với timestamp để tránh trùng
    const fileName = `avatar_${Date.now()}.${fileExtension}`;
    
    // Tạo FormData (React Native format)
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    
    console.log('Uploading avatar:', {
      fileName,
      mimeType,
      uri: imageUri.substring(0, 50) + '...',
    });
    
    // Gọi API với endpoint từ constants
    const endpoint = API_ENDPOINTS.USER.UPLOAD_AVATAR.replace('{userId}', userId);
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Lấy access token
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('Không có token xác thực');
    }
    
    // Sử dụng fetch API thay vì axios để upload file
    // fetch API trong React Native xử lý FormData tốt hơn axios
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Không set Content-Type - fetch sẽ tự động set multipart/form-data với boundary
      },
      body: formData,
    });
    
    // Kiểm tra response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data as UploadAvatarResponse;
  },
};
