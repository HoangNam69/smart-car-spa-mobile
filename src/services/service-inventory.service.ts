/**
 * Service Inventory Service
 * Handles enriching services with inventory information and filtering
 */

import { InventoryViewSimple } from "../types/inventory.types";
import { Service, ServiceProduct } from "../types/service.types";
import { InventoryService } from "./inventory.service";
import { ServiceService } from "./service.service";

export interface ServiceProductWithInventory extends ServiceProduct {
  inventory?: InventoryViewSimple;
  isAvailable: boolean; // quantity <= available
}

export interface ServiceWithInventory extends Service {
  service_products?: ServiceProductWithInventory[];
  hasEnoughInventory: boolean; // Tất cả required products đều có đủ
}

/**
 * Enrich services with inventory information and filter out services without enough inventory
 * @param services - List of services to check
 * @param branchId - Branch ID to check inventory for
 * @returns Filtered list of services with enough inventory
 */
export async function enrichServicesWithInventory(
  services: Service[],
  branchId: string
): Promise<ServiceWithInventory[]> {
  if (!services || services.length === 0) {
    return [];
  }

  // 1. Collect all product IDs from all services
  const productIds = new Set<string>();
  const serviceProductMap = new Map<string, ServiceProduct[]>(); // serviceId -> serviceProducts

  for (const service of services) {
    // If service doesn't have service_products loaded, we need to fetch it
    if (!service.service_products || service.service_products.length === 0) {
      try {
        // Fetch service details to get service_products
        console.log(`[Inventory Check] Fetching service details for: ${service.service_name} (${service.service_id})`);
        const serviceDetail = await ServiceService.getServiceById(service.service_id);
        if (serviceDetail?.service_products && serviceDetail.service_products.length > 0) {
          console.log(`[Inventory Check] Service ${service.service_name} has ${serviceDetail.service_products.length} products`);
          serviceProductMap.set(service.service_id, serviceDetail.service_products);
          serviceDetail.service_products.forEach((sp) => {
            if (sp.product_id) {
              productIds.add(sp.product_id);
            }
          });
        } else {
          console.log(`[Inventory Check] Service ${service.service_name} has no products`);
          serviceProductMap.set(service.service_id, []);
        }
      } catch (error) {
        console.error(`[Inventory Check] Failed to fetch service details for ${service.service_id}:`, error);
        serviceProductMap.set(service.service_id, []);
      }
    } else {
      // Service already has service_products
      console.log(`[Inventory Check] Service ${service.service_name} already has ${service.service_products.length} products loaded`);
      serviceProductMap.set(service.service_id, service.service_products);
      service.service_products.forEach((sp) => {
        if (sp.product_id) {
          productIds.add(sp.product_id);
        }
      });
    }
  }

  // 2. Get inventory levels in batch (only if we have products to check)
  let inventoryMap: { [productId: string]: InventoryViewSimple } = {};
  if (productIds.size > 0) {
    try {
      console.log(`[Inventory Check] Fetching inventory for ${productIds.size} products in branch ${branchId}`);
      const inventoryResponse = await InventoryService.getInvLevelBatch({
        branch_id: branchId,
        product_ids: Array.from(productIds),
      });
      inventoryMap = inventoryResponse.items || {};
      console.log(`[Inventory Check] Received inventory data for ${Object.keys(inventoryMap).length} products`);
      // Log inventory levels for debugging
      Object.entries(inventoryMap).forEach(([productId, inv]) => {
        console.log(`[Inventory Check] Product ${productId}: on_hand=${inv.on_hand}, reserved=${inv.reserved}, available=${inv.available}`);
      });
    } catch (error) {
      console.error("[Inventory Check] Failed to fetch inventory levels:", error);
      // Continue with empty inventory map (will assume no inventory available)
    }
  } else {
    console.log("[Inventory Check] No products to check inventory for");
  }

  // 3. Enrich services with inventory
  const enrichedServices: ServiceWithInventory[] = services.map((service) => {
    const serviceProducts = serviceProductMap.get(service.service_id) || [];

    const enrichedProducts: ServiceProductWithInventory[] = serviceProducts.map((sp) => {
      const inventory = inventoryMap[sp.product_id];
      // Backend always returns inventory data for all products (even if 0)
      // So inventory should always exist if product was in the request
      const available = inventory?.available ?? 0; // Use nullish coalescing to handle 0 correctly
      // ServiceProduct.quantity is already a number
      const requiredQty = typeof sp.quantity === 'number' ? sp.quantity : (sp.quantity ? Number(sp.quantity) : 0);

      // Check if required quantity is less than or equal to available quantity
      // Use Number comparison to handle decimal values correctly
      const isAvailable = Number(requiredQty) <= Number(available);

      // Debug logging for required products
      if (sp.is_required) {
        console.log(`[Inventory Check] Service: ${service.service_name}, Product: ${sp.product_info?.product_name || sp.product_id}, Required: ${requiredQty}, Available: ${available}, IsAvailable: ${isAvailable}, HasInventory: ${!!inventory}`);
        if (!isAvailable) {
          console.warn(`[Inventory Check]  INSUFFICIENT STOCK - Service: ${service.service_name}, Product: ${sp.product_info?.product_name || sp.product_id}, Required: ${requiredQty}, Available: ${available}`);
        }
      }

      return {
        ...sp,
        inventory: inventory
          ? {
              on_hand: inventory.on_hand,
              reserved: inventory.reserved,
              available: inventory.available,
            }
          : undefined,
        isAvailable,
      };
    });

    // Check if all required products have enough inventory
    //  QUAN TRỌNG: Chỉ check sản phẩm bắt buộc (is_required = true)
    const hasEnoughInventory = enrichedProducts.every((sp) => {
      // If product is not required, skip check (vẫn cho phép service hiển thị)
      if (!sp.is_required) {
        return true;
      }
      
      // Backend should always return inventory data for products in the request
      // But to be safe, check if inventory data exists
      if (!sp.inventory) {
        console.warn(`[Inventory Check]  NO INVENTORY DATA - Service: ${service.service_name}, Product: ${sp.product_info?.product_name || sp.product_id} - Treating as out of stock`);
        return false; // No inventory data = out of stock
      }
      
      // Check if required quantity <= available quantity
      // If isAvailable is false, it means requiredQty > available
      if (!sp.isAvailable) {
        console.warn(`[Inventory Check]  INSUFFICIENT STOCK - Service: ${service.service_name}, Product: ${sp.product_info?.product_name || sp.product_id}, Required: ${sp.quantity}, Available: ${sp.inventory.available}`);
        return false;
      }
      
      return true; // Product has enough inventory
    });

    //  Lưu ý: Service không có service_products vẫn được coi là có đủ hàng
    // (vì không cần sản phẩm để thực hiện dịch vụ)
    const finalHasEnoughInventory = serviceProducts.length === 0 ? true : hasEnoughInventory;

    console.log(`[Inventory Check]  Final Result - Service: ${service.service_name}, HasProducts: ${serviceProducts.length > 0}, HasEnoughInventory: ${finalHasEnoughInventory}`);
    
    if (!finalHasEnoughInventory && serviceProducts.length > 0) {
      console.warn(`[Inventory Check]  Service ${service.service_name} will be HIDDEN - insufficient inventory`);
      // Log which products are missing
      enrichedProducts
        .filter(sp => sp.is_required && !sp.isAvailable)
        .forEach(sp => {
          console.warn(`[Inventory Check]   - Missing product: ${sp.product_info?.product_name || sp.product_id}, Required: ${sp.quantity}, Available: ${sp.inventory?.available ?? 0}`);
        });
    }

    return {
      ...service,
      service_products: enrichedProducts,
      hasEnoughInventory: finalHasEnoughInventory,
    };
  });

  // 4.  QUAN TRỌNG: Chỉ trả về services có đủ hàng
  // Filter out services that don't have enough inventory
  const filteredServices = enrichedServices.filter((service) => service.hasEnoughInventory);
  
  console.log(`[Inventory Check]  Summary: ${enrichedServices.length} services checked, ${filteredServices.length} passed inventory check, ${enrichedServices.length - filteredServices.length} failed`);
  
  return filteredServices;
}

/**
 * Check if a single service has enough inventory
 * @param service - Service to check
 * @param branchId - Branch ID to check inventory for
 * @returns Service with inventory information
 */
export async function checkServiceInventory(
  service: Service,
  branchId: string
): Promise<ServiceWithInventory | null> {
  const enriched = await enrichServicesWithInventory([service], branchId);
  return enriched.length > 0 ? enriched[0] : null;
}

