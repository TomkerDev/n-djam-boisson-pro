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
import { products, type Product } from "@/data/products";
import { PLATFORM_COMMISSION_RATE } from "@/lib/constants";

const STORAGE_KEY = "ndjam.cart.v1";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoredCart {
  productId: number;
  quantity: number;
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
  quantityOf: (productId: number) => number;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  increment: (productId: number, delta?: number) => void;
  removeItem: (productId: number) => void;
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

    const catalog = new Map(products.map((product) => [product.id, product]));

    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];

      const { productId, quantity } = entry as Partial<StoredCart>;
      if (typeof productId !== "number" || typeof quantity !== "number") return [];
      if (!Number.isInteger(quantity) || quantity <= 0) return [];

      // Un produit retiré du catalogue est ignoré plutôt que de casser le panier.
      const product = catalog.get(productId);
      return product ? [{ product, quantity }] : [];
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
        items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      ),
    );
  }, [items]);

  const quantityOf = useCallback(
    (productId: number) =>
      items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items],
  );

  const addItem = useCallback((product: Product, quantity = 1) => {
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

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) => {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      );
    });
  }, []);

  const increment = useCallback((productId: number, delta = 1) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        const next = item.quantity + delta;
        return next <= 0 ? [] : [{ ...item, quantity: next }];
      }),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
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