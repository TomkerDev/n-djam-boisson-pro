/**
 * Endpoints metier.
 *
 * Chaque fonction porte le type de retour attendu par l'ecran appelant : les
 * types de reponse vivent ici plutot que dans les composants, pour qu'un
 * changement de contrat casse la compilation a un seul endroit.
 */
import { request } from "./api";

export interface ApiProduct {
  id: string;
  name: string;
  unit: string;
  image: string | null;
  priceFcfa: number;
  category: string;
  supplier: string;
}

export const fetchProducts = () => request<ApiProduct[]>("/api/products");

export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface ApiOrderItem {
  id: string;
  quantity: number;
  unitPriceFcfa: number;
  product: { name: string; unit: string };
}

export interface ApiOrder {
  id: string;
  reference: string;
  clientId: string;
  depotId: string;
  status: OrderStatus;
  subtotalFcfa: number;
  commissionFcfa: number;
  totalFcfa: number;
  createdAt?: string;
  items?: ApiOrderItem[];
}

export interface ApiDelivery {
  id: string;
  stopOrder: number;
  amountToCollect: number;
  completedAt: string | null;
  order: {
    reference: string;
    totalFcfa: number;
    deliveryAddress: string;
    deliveryPhone: string;
    paymentMethod: "COD" | "MOOV" | "AIRTEL";
  };
  product: { name: string; unit: string };
}

export interface ApiDriver {
  id: string;
  vehicleNumber: string;
  isAvailable: boolean;
  user: { fullName: string; phone: string };
}

export const fetchOrders = () => request<ApiOrder[]>("/api/orders");

export const fetchOrder = (orderId: string) => request<ApiOrder>(`/api/orders/${orderId}`);

export const createOrder = (input: {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: "cod" | "moov" | "airtel";
}) => request<ApiOrder>("/api/orders", { method: "POST", body: input });

export const fetchMyDeliveries = () => request<ApiDelivery[]>("/api/deliveries");

export const confirmDelivery = (
  deliveryId: string,
  input: {
    paymentMethod: "cash" | "mobile";
    amountReceived?: number;
    verificationCode: string;
  },
) => request<ApiDelivery>(`/api/deliveries/${deliveryId}/confirm`, { method: "POST", body: input });

export const fetchDepotDrivers = () => request<ApiDriver[]>("/api/supplier/drivers");

export const assignOrder = (orderId: string, driverId: string) =>
  request<ApiDelivery>(`/api/supplier/orders/${orderId}/assign`, {
    method: "POST",
    body: { driverId },
  });

/** Libelle lisible d'un statut, partage par tous les ecrans. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente",
  ASSIGNED: "Attribuée",
  OUT_FOR_DELIVERY: "En route",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};