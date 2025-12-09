import { useState, useCallback } from "react";
import axiosInstance from "../config/axiosConfig";

// Types giống webapp
interface PricingPreviewItemRequest {
  product_id: string;
  qty: number;
}

interface PricingPreviewBatchRequest {
  items: PricingPreviewItemRequest[];
}

interface PricingPreviewItemResponse {
  product_id: string;
  qty: number;
  total_price: number;
}

interface PricingPreviewBatchResponse {
  items?: PricingPreviewItemResponse[];
}

// Hook giống 100% webapp
export const usePricing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useCallback(async (data: PricingPreviewItemRequest) => {
    setLoading(true);
    setError(null);
    try {
      // Giống webapp: POST /pricing/preview
      const response = await axiosInstance.post(`/pricing/preview`, data);
      return response.data.data;
    } catch (e: unknown) {
      setError((e as Error)?.message || "Failed to preview price");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const previewBatch = useCallback(async (data: PricingPreviewBatchRequest) => {
    setLoading(true);
    setError(null);
    try {
      // Giống webapp: POST /pricing/preview-batch
      const response = await axiosInstance.post(`/pricing/preview-batch`, data);
      return response.data.data;
    } catch (e: unknown) {
      setError((e as Error)?.message || "Failed to preview batch prices");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, preview, previewBatch };
};
