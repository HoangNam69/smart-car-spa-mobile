import { useState, useEffect } from "react";
import { ProductService } from "@/src/services/product.service";

/**
 * Hook to get the main image URL for a product
 * Matches webapp pattern exactly
 * @param productId - The ID of the product
 * @returns The main image URL or null if not found
 */
export const useProductMainImage = (productId: string | undefined) => {
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (!productId) {
        setMainImageUrl(null);
        return;
      }

      setLoading(true);
      try {
        const images = await ProductService.getProductImages(productId);
        // Find the main image (is_main === true)
        const mainImage = images?.find((img) => img.is_main);
        setMainImageUrl(mainImage?.media_url || null);

        if (__DEV__) {
          console.log(`[useProductMainImage] Product ${productId}:`, {
            totalImages: images?.length,
            mainImageUrl: mainImage?.media_url || null,
          });
        }
      } catch (error) {
        console.error(
          `[useProductMainImage] Error fetching images for ${productId}:`,
          error
        );
        setMainImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMainImage();
  }, [productId]);

  return { mainImageUrl, loading };
};
