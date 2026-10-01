export type ProductCategory = "bieres" | "sodas" | "jus";

export interface Product {
  id: number;
  name: string;
  /** Prix unitaire en FCFA. */
  price: number;
  supplier: string;
  /** Emoji utilisé comme visuel de produit. */
  image: string;
  category: ProductCategory;
  unit: string;
}

export interface Category {
  id: ProductCategory;
  name: string;
  count: number;
}

export const categories: Category[] = [
  { id: "bieres", name: "Bières", count: 24 },
  { id: "sodas", name: "Sodas", count: 18 },
  { id: "jus", name: "Jus", count: 12 },
];

export const products: Product[] = [
  { id: 1, name: "Casier Flag 65cl", price: 12000, supplier: "Dépôt Central", image: "🍺", category: "bieres", unit: "casier" },
  { id: 2, name: "Casier 33 Export 33cl", price: 11500, supplier: "Boissons Plus", image: "🍺", category: "bieres", unit: "casier" },
  { id: 3, name: "Casier Gala 65cl", price: 11000, supplier: "Dépôt Central", image: "🍺", category: "bieres", unit: "casier" },
  { id: 4, name: "Casier Coca-Cola 1L", price: 8500, supplier: "Boissons Express", image: "🥤", category: "sodas", unit: "casier" },
  { id: 5, name: "Casier Sprite 1L", price: 8000, supplier: "Boissons Express", image: "🥤", category: "sodas", unit: "casier" },
  { id: 6, name: "Casier Fanta 1L", price: 8000, supplier: "Dépôt Central", image: "🥤", category: "sodas", unit: "casier" },
  { id: 7, name: "Pack Jus Tropical 1L", price: 6000, supplier: "Dépôt Central", image: "🧃", category: "jus", unit: "pack" },
  { id: 8, name: "Pack Jus Orange 1L", price: 6500, supplier: "Boissons Plus", image: "🧃", category: "jus", unit: "pack" },
];

/** Produits mis en avant sur le tableau de bord client. */
export const featuredProducts: Product[] = [products[0], products[3], products[6]];

/** Recherche un produit par identifiant. */
export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}