import axiosInstance from "../config/axiosConfig";

export interface ServiceBay {
  bay_id: string;
  bay_name: string;
  allow_booking?: boolean;
}

export const serviceBayService = {
  async getActive(branchId?: string): Promise<ServiceBay[]> {
    const url = branchId ? `/service-bays/active?branchId=${branchId}` : "/service-bays/active";
    const res = await axiosInstance.get(url);
    const api = res.data;
    if (api?.success && api?.data) return api.data as ServiceBay[];
    return [];
  },
};


