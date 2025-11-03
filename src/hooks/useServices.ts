import { useState, useEffect } from "react";
import {
  ServiceService,
  type Service as ServiceType,
} from "../services/service.service";

interface Service extends ServiceType {}

// Hook to get all services
export const usePublicServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ServiceService.getAllServices({
        is_active: true,
      });
      setServices(data);
    } catch (err) {
      setError(err as Error);
      console.error("Error in usePublicServices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, loading, error, refetch: fetchServices };
};

// Hook to get service by URL
export const useServiceByUrl = (serviceUrl: string) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ServiceService.getServiceByUrl(serviceUrl);
        setService(data);
      } catch (err) {
        setError(err as Error);
        console.error("Error in useServiceByUrl:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceUrl]);

  return { service, loading, error };
};

// Hook to get service by ID
export const useServiceById = (serviceId: string) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ServiceService.getServiceById(serviceId);
        setService(data);
      } catch (err) {
        setError(err as Error);
        console.error("Error in useServiceById:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  return { service, loading, error };
};

// Hook to get main image for a service
export const useServiceMainImage = (serviceId: string | undefined) => {
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (!serviceId) {
        setMainImageUrl(null);
        return;
      }

      try {
        setLoading(true);
        const images = await ServiceService.getServiceImages(serviceId);

        // Sort images: is_main first, then by display_order
        const sortedImages = [...images].sort((a, b) => {
          if (a.is_main && !b.is_main) return -1;
          if (!a.is_main && b.is_main) return 1;
          return a.display_order - b.display_order;
        });

        const mainImage = sortedImages[0];
        setMainImageUrl(mainImage?.media_url || null);
      } catch (error) {
        console.error("Error fetching service main image:", error);
        setMainImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMainImage();
  }, [serviceId]);

  return { mainImageUrl, loading };
};
