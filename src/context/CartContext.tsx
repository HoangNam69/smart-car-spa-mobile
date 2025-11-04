import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setIsLoading(false);
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
      const items = cart.map((item) => ({
        product_id: item.product.product_id,
        qty: item.quantity,
      }));

      const response = await axiosInstance.post("/pricing/preview-batch", {
        items,
      });

      const pricingData = response.data.data;

      // Update cart with real pricing
      setCart((prevCart) =>
        prevCart.map((item) => {
          const priceItem = pricingData.items?.find(
            (p: any) => p.product_id === item.product.product_id
          );
          if (priceItem) {
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
    } catch (error) {
      console.error("Error fetching cart pricing:", error);
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
