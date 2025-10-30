import axiosInstance from "../config/axiosConfig";
import { UpdateUserRequest, UpdateUserResponse } from "../types/user.types";

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
};
