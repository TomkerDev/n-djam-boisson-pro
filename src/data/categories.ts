/**
 * Categories du catalogue.
 *
 * Ce module ne contient que la taxonomie et les libelles : les produits, leurs
 * prix et leur stock viennent de l'API. Toute donnee produit fictive ici serait
 * affichee a cote de donnees reelles, ce qui a deja provoke des ecarts
 * trompeurs pendant le developpement.
 */
export type ProductCategory = "bieres" | "sodas" | "jus";

export interface Category {
  id: ProductCategory;
  name: string;
}

export const categories: Category[] = [
  { id: "bieres", name: "Bières" },
  { id: "sodas", name: "Sodas" },
  { id: "jus", name: "Jus" },
];

/** Verifie qu'une valeur correspond a une categorie connue. */
export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    (categories as Array<{ id: string }>).some((category) => category.id === value)
  );
}