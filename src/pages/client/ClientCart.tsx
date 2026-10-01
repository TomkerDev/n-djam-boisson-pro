import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, AlertCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { DELIVERY_DELAY_HOURS } from "@/lib/constants";
import { formatFcfa } from "@/lib/format";

const ClientCart = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    commission,
    total,
    commissionRatePercent,
    increment,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Votre panier est vide
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Parcourez le catalogue pour ajouter des casiers de boissons et snacks
          à votre commande.
        </p>
        <Button onClick={() => navigate("/client/catalog")}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Voir le catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/catalog")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mon Panier</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map(({ product, quantity }) => (
            <Card key={product.id} className="p-4">
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
                    <span className="text-sm font-medium text-foreground">
                      {formatFcfa(product.price)} × {quantity}
                    </span>
                    <Badge variant="secondary">
                      {formatFcfa(product.price * quantity)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 w-fit bg-primary/10 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => increment(product.id, -1)}
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
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeItem(product.id)}
                  aria-label={`Retirer ${product.name} du panier`}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Price Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Récapitulatif
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-foreground">
              <span>Sous-total</span>
              <span className="font-medium">{formatFcfa(subtotal)}</span>
            </div>

            <div className="flex justify-between text-foreground">
              <span className="flex items-center gap-2">
                Commission ({commissionRatePercent}%)
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              </span>
              <span className="font-medium text-primary">
                {formatFcfa(commission)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{formatFcfa(total)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              ℹ️ La commission de {commissionRatePercent}% couvre les frais de plateforme et de logistique.
            </p>
          </div>
        </Card>

        {/* Info Box */}
        <Card className="p-4 mt-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-foreground">
            📦 <strong>Livraison estimée :</strong> {DELIVERY_DELAY_HOURS} heures après confirmation
          </p>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container mx-auto">
          <Button
            className="w-full h-14 text-lg"
            onClick={() => navigate("/client/checkout")}
          >
            Passer la commande • {formatFcfa(total)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientCart;
