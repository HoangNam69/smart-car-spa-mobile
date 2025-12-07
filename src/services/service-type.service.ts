import axiosInstance from "../config/axiosConfig";

export interface DropdownItem {
  id: string;
  name: string;
}

export const serviceTypeService = {
  async getServiceTypesDropdown(): Promise<DropdownItem[]> {
    try {
      const res = await axiosInstance.get("/service-types/dropdown");
      const api = res.data;
      if (!api?.success || !api?.data) return [];
      // Expecting { data: { content?:[], items?:[] } } or array; normalize
      const list = api.data.items || api.data.content || api.data;
      return (list || []).map((x: any) => ({
        id: x.service_type_id || x.id,
        name: x.name || x.display_name || x.service_type_name,
      }));
    } catch (error: any) {
      console.error("Error getting service types dropdown:", error);
      return [];
    }
  },
};

