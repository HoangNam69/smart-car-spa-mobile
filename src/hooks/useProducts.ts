import { useState, useEffect } from "react";
import {
  ProductService,
  type Product as ServiceProduct,
} from "../services/product.service";

interface Product extends ServiceProduct {
  isAvailable?: boolean;
}

// Hook to get all public products (following webapp implementation)
export const usePublicProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products with filters (only active, exclude reward-only products)
      // This matches the webapp implementation
      const data = await ProductService.getAllProducts({
        page: 0,
        size: 1000, // Get all products
        sort: "createdDate",
        direction: "DESC",
        filters: {
          isActive: true, // Only active products
          isReward: false, // Exclude reward-only products
        },
      });

      // Map is_active to isAvailable (match webapp pattern)
      const productsWithAvailability = data.map((product) => ({
        ...product,
        isAvailable: product.is_active, // Map backend field to frontend field
      }));

      setProducts(productsWithAvailability);
    } catch (err) {
      setError(err as Error);
      console.error("Error in usePublicProducts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refetch = () => {
    return fetchProducts();
  };

  return { products, loading, error, refetch };
};

export const useProductByUrl = (productUrl: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ProductService.getProductByUrl(productUrl);
        // Map is_active to isAvailable
        const productWithAvailability = data
          ? { ...data, isAvailable: data.is_active }
          : null;
        setProduct(productWithAvailability);
      } catch (err) {
        setError(err as Error);
        console.error("Error in useProductByUrl:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productUrl]);

  return { product, loading, error };
};

export const useProductById = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ProductService.getProductById(productId);
        // Map is_active to isAvailable
        const productWithAvailability = data
          ? { ...data, isAvailable: data.is_active }
          : null;
        setProduct(productWithAvailability);
      } catch (err) {
        setError(err as Error);
        console.error("Error in useProductById:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};
