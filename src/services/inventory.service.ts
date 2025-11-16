import axiosInstance from "../config/axiosConfig";
import {
  InventoryLevelsBatchRequest,
  InventoryLevelsBatchResponse,
} from "../types/inventory.types";

export const InventoryService = {
  /**
   * Get inventory levels for multiple products in a branch (batch)
   * @param request - Request with branch_id and product_ids array
   * @returns Inventory levels for all products
   */
  async getInvLevelBatch(
    request: InventoryLevelsBatchRequest
  ): Promise<InventoryLevelsBatchResponse> {
    try {
      console.log(
        `[InventoryService] Fetching inventory for ${request.product_ids.length} products in branch ${request.branch_id}`
      );
      const response = await axiosInstance.post(
        "/inv/levels-batch",
        request
      );
      
      // Backend returns simplified InventoryView (only on_hand, reserved, available)
      // without audit fields
      const data = response.data?.data || response.data;
      
      console.log(
        `[InventoryService] Received inventory data for ${Object.keys(data?.items || {}).length} products`
      );
      
      return {
        items: data?.items || {},
      };
    } catch (error: any) {
      console.error(
        "[InventoryService] Error fetching inventory levels:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

