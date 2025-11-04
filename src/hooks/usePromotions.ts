import { useState, useEffect } from "react";
import {
  promotionService,
  Promotion,
  PromotionFilterParam,
} from "../services/promotionService";

export const useActivePromotions = (params: PromotionFilterParam = {}) => {
  const [data, setData] = useState<{
    content: Promotion[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await promotionService.getActivePromotions(params);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch promotions")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.size, params.branchId, params.keyword]);

  return { data, loading, error };
};
