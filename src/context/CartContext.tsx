import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { PLATFORM_COMMISSION_RATE } from "@/lib/constants";
import type { ApiProduct } from "@/lib/apiOrders";

const STORAGE_KEY = "ndjam.cart.v1";

/**
 * Reference produit conservee dans le panier.
 *
 * Le prix est fige au moment de l'ajout : le catalogue peut changer entre deux
 * sessions et l'utilisateur doit voir le prix qu'il a reellement choisi. Le
 * serveur, lui, recalcule toujours au moment de la commande.
 */
export interface CartProduct {
  id: string;
  name: string;
  priceFcfa: number;
  image: string | null;
  supplier: string;
  unit: string;
  category: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

/** Convertit un produit de l'API en reference stockable dans le panier. */
export function toCartProduct(product: ApiProduct): CartProduct {
  return {
    id: product.id,
    name: product.name,
    priceFcfa: product.priceFcfa,
    image: product.image,
    supplier: product.supplier,
    unit: product.unit,
    category: product.category,
  };
}

interface CartContextValue {
  items: CartItem[];
  /** Nombre total d'articles (toutes quantités confondues). */
  totalItems: number;
  /** Somme des lignes, hors commission. */
  subtotal: number;
  /** Commission de la plateforme. */
  commission: number;
  /** Montant dû par le client, commission incluse. */
  total: number;
  /** Taux de commission appliqué, en pourcentage. */
  commissionRatePercent: number;
  quantityOf: (productId: string) => number;
  addItem: (product: CartProduct, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string, delta?: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];

      const { product, quantity } = entry as { product?: unknown; quantity?: unknown };
      if (typeof product !== "object" || product === null) return [];
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
        return [];
      }

      const candidate = product as Partial<CartProduct>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.name !== "string" ||
        typeof candidate.priceFcfa !== "number"
      ) {
        return [];
      }

      return [{ product: candidate as CartProduct, quantity }];
    });
  } catch {
    // Un panier corrompu ne doit jamais empêcher l'application de démarrer.
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialisation paresseuse : l'application est purement côté client (Vite,
  // sans SSR), la lecture de localStorage au premier rendu est donc sûre et
  // évite d'écraser le panier stocké avant l'hydratation.
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        items.map(({ product, quantity }) => ({ product, quantity })),
      ),
    );
  }, [items]);

  const quantityOf = useCallback(
    (productId: string) =>
      items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items],
  );

  const addItem = useCallback((product: CartProduct, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity }];
    });
    toast.success(`${product.name} ajouté au panier`);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      );
    });
  }, []);

  const increment = useCallback((productId: string, delta = 1) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        const next = item.quantity + delta;
        return next <= 0 ? [] : [{ ...item, quantity: next }];
      }),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.priceFcfa * item.quantity,
      0,
    );
    const commission = Math.round(subtotal * PLATFORM_COMMISSION_RATE);

    return {
      items,
      totalItems,
      subtotal,
      commission,
      total: subtotal + commission,
      commissionRatePercent: PLATFORM_COMMISSION_RATE * 100,
      quantityOf,
      addItem,
      setQuantity,
      increment,
      removeItem,
      clear,
    };
  }, [items, quantityOf, addItem, setQuantity, increment, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur d'un <CartProvider>");
  }
  return context;
}