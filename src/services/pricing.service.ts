import axiosInstance from "../config/axiosConfig";

export interface PriceBookItemService {
  estimated_duration?: number;
  description?: string;
  service_id?: string;
}

export interface PriceBookItem {
  item_id: string;
  item_name: string;
  fixed_price?: number;
  service?: PriceBookItemService;
  servicePackage?: { total_duration?: number } | null;
}

export const pricingService = {
  async getAllItems(): Promise<PriceBookItem[]> {
    const res = await axiosInstance.get("/pricing/books/get-all");
    const api = res.data;
    const books = (api?.data ?? []) as any[];
    const items: PriceBookItem[] = [];
    for (const b of books) {
      if (Array.isArray(b.items)) {
        for (const it of b.items) {
          if (it?.service && !it?.servicePackage) {
            items.push({
              item_id: it.item_id,
              item_name: it.item_name,
              fixed_price: it.fixed_price,
              service: {
                estimated_duration: it.service?.estimated_duration,
                description: it.service?.description,
                service_id: it.service?.service_id,
              },
              servicePackage: null,
            });
          }
        }
      }
    }
    return items;
  },
};


