import axiosInstance from "../config/axiosConfig";

export interface VehicleProfileDto {
  vehicle_id: string;
  license_plate: string;
  description?: string | null;
  vehicle_brand_id?: string;
  vehicle_type_id?: string;
  vehicle_model_id?: string;
  owner_id: string;
  distance_traveled?: number | null;
  created_date?: string;
  // enriched display fields
  brand_name?: string;
  model_name?: string;
  type_name?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface VehicleProfilePage {
  content: VehicleProfileDto[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export const vehicleProfileService = {
  async enrichProfiles(
    profiles: VehicleProfileDto[]
  ): Promise<VehicleProfileDto[]> {
    const fetchBrand = async (id?: string) => {
      if (!id) return undefined;
      const res = await axiosInstance.get(`/vehicles/brands/${id}`);
      return res?.data?.data?.brand_name as string | undefined;
    };
    const fetchType = async (id?: string) => {
      if (!id) return undefined;
      const res = await axiosInstance.get(`/vehicles/types/${id}`);
      return res?.data?.data?.type_name as string | undefined;
    };
    const fetchModel = async (id?: string) => {
      if (!id) return undefined;
      const res = await axiosInstance.get(`/vehicles/models/${id}`);
      return res?.data?.data?.model_name as string | undefined;
    };

    const enriched = await Promise.all(
      (profiles || []).map(async (p) => {
        try {
          const [brandName, typeName, modelName] = await Promise.all([
            fetchBrand(p.vehicle_brand_id),
            fetchType(p.vehicle_type_id),
            fetchModel(p.vehicle_model_id),
          ]);
          return {
            ...p,
            brand_name: brandName,
            type_name: typeName,
            model_name: modelName,
          } as VehicleProfileDto;
        } catch {
          return { ...p } as VehicleProfileDto;
        }
      })
    );
    return enriched;
  },

  async getByOwner(
    ownerId: string,
    params?: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: "ASC" | "DESC";
    }
  ) {
    try {
      const query = new URLSearchParams();
      if (params?.page !== undefined) query.append("page", String(params.page));
      if (params?.size !== undefined) query.append("size", String(params.size));
      query.append("direction", params?.direction ?? "DESC");
      query.append("sort", params?.sort ?? "createdDate");
      const url = `/vehicles/profiles/owner/${ownerId}/get-all?${query.toString()}`;
      const res = await axiosInstance.get(url);
      const api = res.data;
      if (!api?.success)
        throw new Error(api?.message || "Tải danh sách xe thất bại");
      const page = api.data as VehicleProfilePage;
      // Safely enrich profiles - if enrichment fails, return original data
      try {
        const enriched = await this.enrichProfiles(page?.content || []);
        return { ...page, content: enriched } as VehicleProfilePage;
      } catch (enrichError) {
        console.warn("Error enriching vehicle profiles, returning original data:", enrichError);
        return page as VehicleProfilePage;
      }
    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = "Tải danh sách xe thất bại";
      const status = error?.response?.status;
      
      // Network error or timeout (no response)
      if (!error.response) {
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
          errorMessage = "Kết nối quá thời gian. Vui lòng thử lại.";
        } else if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
        } else {
          errorMessage = error?.message || "Không thể kết nối đến server. Vui lòng thử lại.";
        }
      } else {
        // API returned an error response
        errorMessage = error?.response?.data?.message || error?.message || errorMessage;
      }
      
      // Only log non-401 errors (401 is handled by interceptor)
      if (status !== 401) {
        console.error("Error in getByOwner:", {
          ownerId,
          error: errorMessage,
          status: status || "NO_RESPONSE",
          code: error?.code,
          message: error?.message,
        });
      }
      
      throw new Error(errorMessage);
    }
  },

  async getById(profileId: string): Promise<VehicleProfileDto> {
    const res = await axiosInstance.get(`/vehicles/profiles/${profileId}`);
    const api = res.data;
    if (!api?.success || !api?.data)
      throw new Error(api?.message || "Không thể tải thông tin xe");
    const enriched = await this.enrichProfiles([api.data as VehicleProfileDto]);
    return enriched[0];
  },

  async update(
    profileId: string,
    data: Partial<VehicleProfileDto>
  ): Promise<VehicleProfileDto> {
    const res = await axiosInstance.post(
      `/vehicles/profiles/${profileId}/update`,
      data
    );
    const api = res.data;
    if (!api?.success || !api?.data)
      throw new Error(api?.message || "Cập nhật thông tin xe thất bại");
    return api.data as VehicleProfileDto;
  },

  async create(data: Partial<VehicleProfileDto>): Promise<VehicleProfileDto> {
    const res = await axiosInstance.post(`/vehicles/profiles/create`, data);
    const api = res.data;
    if (!api?.success || !api?.data) throw new Error(api?.message || "Tạo xe thất bại");
    return api.data as VehicleProfileDto;
  },
};
