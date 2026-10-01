import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Banknote, Smartphone, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { DELIVERY_DELAY_HOURS } from "@/lib/constants";
import { formatFcfa } from "@/lib/format";

const paymentOptions = [
  {
    id: "cod",
    label: "Paiement à la Livraison (Cash)",
    description: "Payez en espèces à la réception",
    icon: Banknote,
  },
  {
    id: "moov",
    label: "Moov Money",
    description: "Paiement mobile instantané",
    icon: Smartphone,
  },
  {
    id: "airtel",
    label: "Airtel Money",
    description: "Paiement mobile instantané",
    icon: Smartphone,
  },
];

const ClientCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, subtotal, commission, total, commissionRatePercent, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const handleConfirmOrder = () => {
    toast({
      title: "Commande confirmée !",
      description: "Vous recevrez une notification lorsqu'un livreur sera attribué.",
    });
    // Le panier est vidé après validation : les écrans suivants ne doivent plus
    // refléter la commande qui vient d'être passée.
    clear();
    navigate("/client/tracking");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Aucune commande à passer
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Ajoutez des produits à votre panier avant de procéder au paiement.
        </p>
        <Button onClick={() => navigate("/client/catalog")}>
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
              onClick={() => navigate("/client/cart")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Paiement et Confirmation
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Récapitulatif de commande
          </h2>
          <div className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-foreground">
                <span>
                  {quantity} × {product.name}
                </span>
                <span className="font-medium">
                  {formatFcfa(product.price * quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-foreground">
              <span>Commission ({commissionRatePercent}%)</span>
              <span className="font-medium">{formatFcfa(commission)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{formatFcfa(total)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Method Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Mode de paiement
          </h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Label
                    key={option.id}
                    htmlFor={option.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Icon className="w-6 h-6 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </Label>
                );
              })}
            </div>
          </RadioGroup>
        </Card>

        {/* Delivery Info */}
        <Card className="p-4 bg-muted border-muted">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Livraison confirmée</p>
              <p className="text-muted-foreground">
                Délai estimé : {DELIVERY_DELAY_HOURS} heures après attribution d'un livreur
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container mx-auto">
          <Button
            className="w-full h-14 text-lg"
            onClick={handleConfirmOrder}
          >
            Confirmer la commande
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientCheckout;
