import { BaseAuditEntity, BasePaginationResponse } from "./common.types";

export interface PromotionTypeInfo extends BaseAuditEntity{
  promotionTypeId: string;
  typeCode: string;
  typeName: string;
  description: string;
}

export interface PromotionTypeFilterParam {
  typeCode?: string;
  typeName?: string;
  description?: string;
  isActive?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
}

export interface PromotionTypeStats {
  totalPromotionTypes: number;
  activePromotionTypes: number;
  inactivePromotionTypes: number;
}

export interface PromotionTypePageResponse extends BasePaginationResponse {
  content: PromotionTypeInfo[];
}

export interface CreatePromotionTypeRequest {
  typeCode: string;
  typeName: string;
  description: string;
}

export type UpdatePromotionTypeRequest = CreatePromotionTypeRequest

export interface PromotionTypeStatusUpdateRequest {
  isActive: boolean;
}
