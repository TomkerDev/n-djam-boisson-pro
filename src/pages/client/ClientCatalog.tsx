import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Search, Plus, Minus, Loader2, PackageX } from "lucide-react";
import { toCartProduct, useCart } from "@/context/CartContext";
import { fetchProducts, type ApiProduct } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";
import type { ProductCategory } from "@/data/products";

const ClientCatalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { quantityOf, addItem, increment, totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const activeCategory = searchParams.get("category") as ProductCategory | null;

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const all: ApiProduct[] = products ?? [];

    return all.filter((product) => {
      const matchesCategory = !activeCategory || product.category === activeCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.supplier.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
}, [products, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/dashboard")}
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex-1">
              Catalogue Produits
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Rechercher..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} produits disponibles
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement du catalogue...
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-destructive/40">
            <PackageX className="w-10 h-10 mx-auto text-destructive mb-3" />
            <p className="text-foreground font-medium mb-1">
              Catalogue indisponible
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Le serveur n'a pas répondu. Vérifiez que l'API est démarrée.
            </p>
            <Button variant="outline" onClick={() => void refetch()}>
              Réessayer
            </Button>
          </Card>
        )}

        {!isLoading && !isError && filteredProducts.length === 0 && (
          <Card className="p-8 text-center">
            <PackageX className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Modifiez votre recherche ou changez de catégorie.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const quantity = quantityOf(product.id);
            return (
              <Card key={product.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{product.image ?? "📦"}</div>
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
                        {product.unit}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {quantity > 0 ? (
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => increment(product.id, -1)}
                          aria-label={`Retirer un ${product.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-foreground w-8 text-center">
                          {quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => increment(product.id, 1)}
                          aria-label={`Ajouter un ${product.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => addItem(toCartProduct(product))}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
          <Button
            className="w-full max-w-md mx-auto shadow-2xl h-14 text-lg"
            onClick={() => navigate("/client/cart")}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Voir le panier ({totalItems})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientCatalog;

