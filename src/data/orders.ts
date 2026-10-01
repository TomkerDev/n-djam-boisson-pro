export type PaymentMethod = "cod" | "moov" | "airtel";
export type OrderStatus = "pending" | "assigned" | "delivered";

export interface Order {
  id: string;
  client: string;
  address: string;
  phone: string;
  products: string;
  amount: number;
  payment: string;
  status: OrderStatus;
}

export interface Driver {
  id: string;
  name: string;
  status: "Disponible" | "En livraison";
}

export interface Delivery
  extends Omit<Order, "status"> {
  /** Rang de l'arrêt dans la tournée optimisée. */
  order: number;
  status: "pending" | "completed";
}

export const orders: Order[] = [
  {
    id: "CMD-001",
    client: "Bar Le Relax",
    address: "Quartier Chagoua, N'Djamena",
    phone: "+235 66 XX XX XX",
    products: "5 × Casier Flag 65cl",
    amount: 66000,
    payment: "Cash à la livraison",
    status: "pending",
  },
  {
    id: "CMD-002",
    client: "Snack Paradise",
    address: "Quartier Moursal, N'Djamena",
    phone: "+235 62 XX XX XX",
    products: "3 × Casier Coca-Cola 1L",
    amount: 28050,
    payment: "Moov Money",
    status: "pending",
  },
];

export const drivers: Driver[] = [
  { id: "1", name: "Mohammed Ali", status: "Disponible" },
  { id: "2", name: "Hassan Ibrahim", status: "Disponible" },
  { id: "3", name: "Fatima Moussa", status: "Disponible" },
];

export const deliveries: Delivery[] = [
  {
    id: "CMD-001",
    order: 1,
    client: "Bar Le Relax",
    address: "Quartier Chagoua, N'Djamena",
    phone: "+235 66 XX XX XX",
    products: "5 × Casier Flag 65cl",
    amount: 66000,
    payment: "Cash à la livraison",
    status: "pending",
  },
  {
    id: "CMD-003",
    order: 2,
    client: "Restaurant Sahel",
    address: "Quartier Bololo, N'Djamena",
    phone: "+235 68 XX XX XX",
    products: "2 × Casier Coca-Cola 1L",
    amount: 18700,
    payment: "Moov Money",
    status: "pending",
  },
];