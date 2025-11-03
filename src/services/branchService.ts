import axiosInstance from "../config/axiosConfig";

export interface Branch {
  branch_id: string;
  branch_name: string;
  branch_url: string;
  address?: string;
  phone_number?: string;
  is_active: boolean;
}

export const branchService = {
  async getAllBranches(): Promise<{
    branches: Branch[];
    pagination: {
      page: number;
      size: number;
      total_elements: number;
      total_pages: number;
      first: boolean;
      last: boolean;
      has_next: boolean;
      has_previous: boolean;
    };
  }> {
    const response = await axiosInstance.get("/branches/get-all");

    if (response.data.success && response.data.data) {
      // Handle both array and single object responses
      const dataArray = Array.isArray(response.data.data.content)
        ? response.data.data.content
        : [response.data.data.content];

      return {
        branches: dataArray,
        pagination: {
          page: response.data.data.page || 0,
          size: response.data.data.size || dataArray.length,
          total_elements: response.data.data.total_elements || dataArray.length,
          total_pages: response.data.data.total_pages || 1,
          first: response.data.data.first || true,
          last: response.data.data.last || true,
          has_next: response.data.data.has_next || false,
          has_previous: response.data.data.has_previous || false,
        },
      };
    } else {
      throw new Error(response.data.message || "Failed to fetch branches");
    }
  },
};
