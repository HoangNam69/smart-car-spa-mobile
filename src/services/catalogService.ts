import axiosInstance from "../config/axiosConfig";

export interface InventoryView {
  available: number;
  reserved: number;
  on_hand: number;
}

export interface CatalogItem {
  product: {
    product_id: string;
    product_name: string;
  };
  price: number;
  inventory: InventoryView;
}

export interface CatalogData {
  items: CatalogItem[];
}

export const catalogService = {
  async getForSaleCatalogs(branchId: string): Promise<CatalogData> {
    const response = await axiosInstance.get(
      `/catalogs/for-sale?branchId=${branchId}`
    );
    return response.data.data;
  },
};
