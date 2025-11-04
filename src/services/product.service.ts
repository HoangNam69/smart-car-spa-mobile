import axiosInstance from "../config/axiosConfig";
import { API_ENDPOINTS } from "../config/api.constant";

export interface ProductAttributeValue {
  attribute_id: string;
  attribute_name: string;
  attribute_value: string;
  data_type: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  product_url: string;
  sku: string;
  brand?: string;
  model?: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  product_type_name?: string;
  unit_of_measure?: string;
  mainImageUrl?: string;
  isAvailable?: boolean;
  attribute_values?: ProductAttributeValue[];
}

export interface ProductMedia {
  media_id: string;
  media_url: string;
  media_type: string;
  alt_text?: string;
  is_main: boolean;
  display_order: number;
}

export interface ProductSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  filters?: {
    isActive?: boolean;
    isReward?: boolean;
    [key: string]: any;
  };
}

export const ProductService = {
  // Get all products with pagination and filters (following webapp implementation)
  async getAllProducts(params: ProductSearchParams = {}): Promise<Product[]> {
    try {
      const {
        page = 0,
        size = 1000,
        sort = "createdDate",
        direction = "DESC",
        filters = {},
      } = params;

      // Build query params
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: sort,
        direction: direction,
      });

      // Add filters to query params (flatten filters into query params like webapp)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${
        API_ENDPOINTS.PRODUCT.GET_ALL_PUBLIC
      }?${queryParams.toString()}`;

      console.log("🔍 [ProductService] Fetching products from:", url);

      const response = await axiosInstance.get(url);

      // Backend returns: { success: true, data: { content: [...], totalElements, ... } }
      const products = response.data?.data?.content || [];

      console.log(
        "✅ [ProductService] Products received:",
        products.length,
        "items"
      );
      if (products.length > 0) {
        console.log("📦 [ProductService] Sample product:", products[0]);
      }

      return products;
    } catch (error: any) {
      console.error("❌ [ProductService] Error fetching products:");
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data || error.message);
      console.error("   URL:", error.config?.baseURL + error.config?.url);
      throw error;
    }
  },

  // Get product by URL
  async getProductByUrl(productUrl: string): Promise<Product | null> {
    try {
      console.log(`🔍 [ProductService] Fetching product: ${productUrl}`);
      const url = API_ENDPOINTS.PRODUCT.GET_BY_URL.replace("{url}", productUrl);
      const response = await axiosInstance.get(url);

      // Backend wraps response in { data: product }
      const product = response.data?.data || response.data;

      console.log(
        "✅ [ProductService] Product received:",
        product?.product_name
      );
      return product;
    } catch (error: any) {
      console.error(
        `❌ [ProductService] Error fetching product ${productUrl}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Get product by ID
  async getProductById(productId: string): Promise<Product | null> {
    try {
      console.log(`🔍 [ProductService] Fetching product ID: ${productId}`);
      const url = API_ENDPOINTS.PRODUCT.GET_BY_ID.replace("{id}", productId);
      const response = await axiosInstance.get(url);

      // Backend wraps response in { data: product }
      const product = response.data?.data || response.data;

      console.log(
        "✅ [ProductService] Product received:",
        product?.product_name
      );
      return product;
    } catch (error: any) {
      console.error(
        `❌ [ProductService] Error fetching product ${productId}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Get all images for a product - match webapp
  async getProductImages(productId: string): Promise<ProductMedia[]> {
    try {
      const response = await axiosInstance.get(`/products/${productId}/images`);
      return response.data.data;
    } catch (error: any) {
      console.error(
        `❌ [ProductService] Error fetching images for ${productId}:`,
        error.response?.data || error.message
      );
      return [];
    }
  },
};
