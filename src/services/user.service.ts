import axiosInstance from "../config/axiosConfig";
import { API_ENDPOINTS } from "../config/api.constant";
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
    // Tạo FormData
    const formData = new FormData();
    
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
    
    // Append file vào FormData (React Native format)
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as any);
    
    // Gọi API với endpoint từ constants
    const endpoint = API_ENDPOINTS.USER.UPLOAD_AVATAR.replace('{userId}', userId);
    
    // Gửi FormData - axios sẽ tự động set Content-Type với boundary
    // Không set Content-Type header để axios tự động tính toán và thêm boundary
    // Axios sẽ tự động detect FormData và set Content-Type với boundary phù hợp
    const config: any = {
      headers: {},
    };
    // Xóa Content-Type để axios tự động set
    delete config.headers['Content-Type'];
    
    const response = await axiosInstance.post(endpoint, formData, config);
    
    return response.data as UploadAvatarResponse;
  },
};
