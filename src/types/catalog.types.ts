import {
  BaseAuditEntity
} from "./common.types";
import { InventoryView } from "./inventory.types";
import { Product } from "./product.types";

export interface CatalogItem extends BaseAuditEntity {
  product: Product;
  price: number;
  inventory: InventoryView;
}

export interface CatalogData extends BaseAuditEntity {
  items: CatalogItem[];
}
