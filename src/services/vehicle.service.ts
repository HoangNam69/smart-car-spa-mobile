import axiosInstance from "../config/axiosConfig";

export interface DropdownItem { id: string; name: string }

export const vehicleService = {
  async getBrandsDropdown(): Promise<DropdownItem[]> {
    const res = await axiosInstance.get("/vehicles/brands/dropdown");
    const api = res.data;
    if (!api?.success || !api?.data) return [];
    // Expecting { data: { content?:[], items?:[] } } or array; normalize
    const list = api.data.items || api.data.content || api.data;
    return (list || []).map((x: any) => ({ id: x.brand_id || x.id, name: x.brand_name || x.name }));
  },
  async getTypesDropdown(): Promise<DropdownItem[]> {
    const res = await axiosInstance.get("/vehicles/types/dropdown");
    const api = res.data;
    if (!api?.success || !api?.data) return [];
    const list = api.data.items || api.data.content || api.data;
    return (list || []).map((x: any) => ({ id: x.type_id || x.id, name: x.type_name || x.name }));
  },
  async getModelsDropdown(): Promise<DropdownItem[]> {
    const res = await axiosInstance.get("/vehicles/models/dropdown");
    const api = res.data;
    if (!api?.success || !api?.data) return [];
    const list = api.data.items || api.data.content || api.data;
    return (list || []).map((x: any) => ({ id: x.model_id || x.id, name: x.model_name || x.name }));
  },
};


