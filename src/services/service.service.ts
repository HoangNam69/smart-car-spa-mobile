import axiosInstance from "../config/axiosConfig";

export interface ServiceAttributeValue {
  attribute_id: string;
  attribute_name: string;
  attribute_value: string;
  data_type: string;
}

export interface ServiceMedia {
  media_id: string;
  media_url: string;
  media_type: string;
  is_main: boolean;
  display_order: number;
}

export interface Service {
  service_id: string;
  service_name: string;
  service_url: string;
  description?: string;
  short_description?: string;
  is_active: boolean;
  is_featured: boolean;
  category_name?: string;
  service_type_name?: string;
  skill_level?: string;
  estimated_duration_minutes?: number;
  attribute_values?: ServiceAttributeValue[];
}

export interface ServiceSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  is_active?: boolean;
  is_featured?: boolean;
  search?: string;
}

export const ServiceService = {
  // Get all services with pagination and filters
  async getAllServices(params: ServiceSearchParams = {}): Promise<Service[]> {
    try {
      const {
        page = 0,
        size = 1000,
        sort = "createdDate",
        direction = "DESC",
        is_active = true,
        ...filters
      } = params;

      // Build query params
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: sort,
        direction: direction,
        is_active: is_active.toString(),
      });

      // Add other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const url = `/services/get-all?${queryParams.toString()}`;
      console.log(" [ServiceService] Fetching services from:", url);

      const response = await axiosInstance.get(url);
      const services = response.data?.data?.content || [];

      console.log(
        " [ServiceService] Services received:",
        services.length,
        "items"
      );
      return services;
    } catch (error: any) {
      console.error(" [ServiceService] Error fetching services:");
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get service by URL
  async getServiceByUrl(serviceUrl: string): Promise<Service | null> {
    try {
      console.log(` [ServiceService] Fetching service: ${serviceUrl}`);
      const url = `/services/url/${serviceUrl}`;
      const response = await axiosInstance.get(url);

      const service = response.data?.data || response.data;
      console.log(
        " [ServiceService] Service received:",
        service?.service_name
      );
      return service;
    } catch (error: any) {
      console.error(
        ` [ServiceService] Error fetching service ${serviceUrl}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Get service by ID
  async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      console.log(` [ServiceService] Fetching service ID: ${serviceId}`);
      const url = `/services/${serviceId}`;
      const response = await axiosInstance.get(url);

      const service = response.data?.data || response.data;
      console.log(
        " [ServiceService] Service received:",
        service?.service_name
      );
      return service;
    } catch (error: any) {
      console.error(
        ` [ServiceService] Error fetching service ${serviceId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Get all images for a service - match webapp
  async getServiceImages(serviceId: string): Promise<ServiceMedia[]> {
    try {
      console.log(
        ` [ServiceService] Fetching images for service: ${serviceId}`
      );
      const response = await axiosInstance.get(`/services/${serviceId}/images`);
      const images = response.data?.data || [];
      console.log(` [ServiceService] Images received:`, images.length);
      return images;
    } catch (error: any) {
      console.error(
        ` [ServiceService] Error fetching images for ${serviceId}:`,
        error.response?.data || error.message
      );
      return [];
    }
  },
};
