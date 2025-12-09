import axiosInstance from "../config/axiosConfig";

export interface BranchDisplay {
  branch_id: string;
  branch_name: string;
  address?: string;
  phone?: string;
}

export const branchService = {
  async getAll(): Promise<BranchDisplay[]> {
    const res = await axiosInstance.get("/branches/get-all");
    const api = res.data;
    if (api?.success && api?.data?.content) return api.data.content as BranchDisplay[];
    if (api?.success && api?.data) return api.data as BranchDisplay[];
    return [];
  },
};


