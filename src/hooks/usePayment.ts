import { useState } from "react";
import {
  paymentService,
  CreateAndPayRequest,
  CreateAndPayResponse,
} from "../services/paymentService";

export const useCreateAndPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAndPay = async (
    request: CreateAndPayRequest
  ): Promise<CreateAndPayResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.createAndPay(request);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Payment failed");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createAndPay, loading, error };
};
