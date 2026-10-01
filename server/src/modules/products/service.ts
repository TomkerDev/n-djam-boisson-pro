import { prisma } from "../../lib/prisma.js";

/**
 * Catalogue des produits actifs, avec le depot pour permettre la comparaison
 * des offres. Le nom du depot est expose, pas ses identifiants internes.
 */
export async function listProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      unit: true,
      image: true,
      priceFcfa: true,
      // La categorie est renvoyee pour que le filtre du catalogue cote client
      // porte sur des donnees reelles plutot que sur une liste locale.
      category: true,
      depot: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    unit: product.unit,
    image: product.image,
    priceFcfa: product.priceFcfa,
    category: product.category,
    supplier: product.depot.name,
  }));
}