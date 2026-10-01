import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Wine,
  Coffee,
  Milk,
  ShoppingCart,
  User,
  Package,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchProducts, type ApiProduct } from "@/lib/apiOrders";
import { categories } from "@/data/categories";
import { STARTER_ORDER_QUOTA } from "@/lib/constants";
import { formatFcfa } from "@/lib/format";

const CATEGORY_ICONS = {
  bieres: Wine,
  sodas: Coffee,
  jus: Milk,
} as const;

/**
 * Compteur par categorie, calcule sur les produits reellement charges.
 *
 * Afficher un nombre present dans une constante aurait laisse l'ecran
 * annoncer « 24 bières » alors que le catalogue n'en contient aucune.
 */
const productCountByCategory = (products: ApiProduct[]): Record<string, number> =>
  products.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] ?? 0) + 1;
    return acc;
  }, {});

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { logout } = useAuth();
  const remainingOrders = 12;
  const maxOrders = STARTER_ORDER_QUOTA;

  // Le tableau de bord consomme la meme source que le catalogue : sans cela il
  // afficherait des produits fictifs alors que le catalogue est reel.
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const featuredProducts = (products ?? []).slice(0, 3);
  const counts = productCountByCategory(products ?? []);

  const categoriesWithIcons = categories.map((category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.id],
    count: counts[category.id] ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">N'Djam'Boisson Pro</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => navigate("/client/cart")}
                aria-label={`Panier, ${totalItems} article(s)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void logout().then(() => navigate("/"))}
                aria-label="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">
                Plan STARTER
              </Badge>
              <span className="text-sm font-medium text-foreground">
                Reste {remainingOrders} commandes sur {maxOrders}
              </span>
            </div>
            <Button variant="link" size="sm" className="text-primary">
              Upgrader au PRO
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Rechercher des produits..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Catégories
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {categoriesWithIcons.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                  onClick={() => navigate(`/client/catalog?category=${category.id}`)}
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-foreground text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.count} produits
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Featured Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Produits populaires
            </h2>
            <Button
              variant="link"
              onClick={() => navigate("/client/catalog")}
              className="text-primary"
            >
              Voir tout
            </Button>
          </div>
          <div className="grid gap-4">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/client/catalog`)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{product.image}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {product.supplier}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatFcfa(product.priceFcfa)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        En stock
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20"
            onClick={() => navigate("/client/orders")}
          >
            <Package className="w-5 h-5 mr-2" />
            Mes commandes
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => navigate("/client/catalog")}
          >
            <Search className="w-5 h-5 mr-2" />
            Catalogue complet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
