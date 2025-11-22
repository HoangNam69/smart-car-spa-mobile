import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { Alert } from "react-native";
import axiosInstance from "../config/axiosConfig";

const CART_STORAGE_KEY = "@smart_car_spa_cart";

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  appliedPromotions: any[];
}

interface CartContextType {
  cart: CartItem[];
  cartSummary: CartSummary;
  addToCart: (product: any, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    console.log(" [CartContext] Initializing...");
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveCart();
    }
  }, [cart, isLoading]);

  // Fetch pricing for cart items when cart changes
  useEffect(() => {
    if (cart.length > 0 && !isLoading) {
      fetchCartPricing();
    }
  }, [cart.length]);

  const loadCart = async () => {
    try {
      console.log(" [CartContext] Loading cart from storage...");
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log(" [CartContext] Cart loaded:", parsedCart.length, "items");
      } else {
        console.log(" [CartContext] No saved cart found");
      }
    } catch (error) {
      console.error(" [CartContext] Error loading cart:", error);
    } finally {
      setIsLoading(false);
      console.log(" [CartContext] Initialization complete");
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const fetchCartPricing = async () => {
    try {
      // Skip if cart is empty
      if (cart.length === 0) {
        return;
      }

      const items = cart.map((item) => ({
        product_id: item.product?.product_id,
        qty: item.quantity,
      })).filter((item) => item.product_id); // Filter out invalid items

      // Skip if no valid items
      if (items.length === 0) {
        return;
      }

      const response = await axiosInstance.post("/pricing/preview-batch", {
        items,
      });

      // Check if response exists
      if (!response || !response.data) {
        console.warn("Invalid pricing response: response or response.data is missing");
        return;
      }

      // Check if response is successful and has data
      if (!response.data.success || !response.data.data) {
        // Only log if it's not a known error format (to avoid noise)
        if (response.data.message) {
          console.warn("Pricing API returned error:", response.data.message);
        }
        return;
      }

      const pricingData = response.data.data;

      // Validate pricingData structure before accessing items
      if (!pricingData || !pricingData.items || !Array.isArray(pricingData.items)) {
        console.warn("Invalid pricing data structure:", {
          hasPricingData: !!pricingData,
          hasItems: !!pricingData?.items,
          itemsIsArray: Array.isArray(pricingData?.items),
        });
        return;
      }

      // Update cart with real pricing
      setCart((prevCart) =>
        prevCart.map((item) => {
          const priceItem = pricingData.items.find(
            (p: any) => p.product_id === item.product?.product_id
          );
          if (priceItem && priceItem.total_price && priceItem.qty) {
            const unitPrice = priceItem.total_price / priceItem.qty;
            return {
              ...item,
              unitPrice,
              subtotal: item.quantity * unitPrice,
            };
          }
          return item;
        })
      );
    } catch (error: any) {
      // Only log non-401 errors (401 errors are handled by axios interceptor)
      if (error?.response?.status !== 401) {
        console.error("Error fetching cart pricing:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      }
      // Silently fail for 401 errors as they will be handled by auth flow
    }
  };

  const addToCart = (product: any, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.product_id === product.product_id
      );

      if (existingItem) {
        // Update existing item
        const updatedCart = prevCart.map((item) =>
          item.product.product_id === product.product_id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        );

        Alert.alert(
          "Đã cập nhật giỏ hàng",
          `${product.product_name} (Số lượng: ${
            existingItem.quantity + quantity
          })`,
          [{ text: "OK" }]
        );

        return updatedCart;
      }

      // Add new item
      const unitPrice =
        product.pricing?.salePrice || product.pricing?.basePrice || 0;
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      };

      Alert.alert(
        "Đã thêm vào giỏ hàng",
        `${product.product_name} (${quantity})`,
        [{ text: "OK" }]
      );

      return [...prevCart, newItem];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.product_id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const item = prevCart.find((i) => i.product.product_id === productId);

      if (item) {
        Alert.alert(
          "Xóa sản phẩm",
          `Bạn có chắc muốn xóa "${item.product.product_name}" khỏi giỏ hàng?`,
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Xóa",
              style: "destructive",
              onPress: () => {
                setCart((prev) =>
                  prev.filter((i) => i.product.product_id !== productId)
                );
              },
            },
          ]
        );
        return prevCart;
      }

      return prevCart.filter((i) => i.product.product_id !== productId);
    });
  };

  const clearCart = () => {
    Alert.alert(
      "Xóa toàn bộ giỏ hàng",
      "Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: () => setCart([]),
        },
      ]
    );
  };

  const cartSummary: CartSummary = {
    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
    discountAmount: 0,
    taxAmount: 0,
    shippingAmount: 0,
    totalAmount: cart.reduce((sum, item) => sum + item.subtotal, 0),
    appliedPromotions: [],
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartSummary,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export type { CartItem, CartSummary };
