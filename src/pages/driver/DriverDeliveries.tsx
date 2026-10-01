import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, Package } from "lucide-react";

interface Delivery {
  id: string;
  order: number;
  client: string;
  address: string;
  phone: string;
  products: string;
  amount: number;
  payment: string;
  status: "pending" | "completed";
}

const DriverDeliveries = () => {
  const navigate = useNavigate();

  const deliveries: Delivery[] = [
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

  const pendingCount = deliveries.filter((d) => d.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Ma Tournée</h1>
              <p className="text-sm text-muted-foreground">
                Mohammed Ali - Livreur
              </p>
            </div>
            <Badge className="bg-success">Actif</Badge>
          </div>

          <Card className="p-4 bg-primary/5 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">
                    {pendingCount} arrêts à faire
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ordre optimisé
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <Card
              key={delivery.id}
              className={`p-6 ${
                delivery.status === "completed" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    delivery.status === "completed"
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {delivery.status === "completed" ? "✓" : delivery.order}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {delivery.client}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {delivery.id}
                  </p>
                </div>
                {delivery.status === "pending" && (
                  <Badge className="bg-primary">Prochain</Badge>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{delivery.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${delivery.phone}`}
                    className="text-primary hover:underline"
                  >
                    {delivery.phone}
                  </a>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  {delivery.products}
                </p>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{delivery.payment}</Badge>
                  <span className="text-sm font-bold text-primary">
                    À collecter: {delivery.amount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {delivery.status === "pending" && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`, '_blank')}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Démarrer la Navigation
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/livreur/confirm/${delivery.id}`)}
                  >
                    Confirmer la Livraison
                  </Button>
                </div>
              )}

              {delivery.status === "completed" && (
                <div className="text-center text-success font-medium">
                  ✓ Livré et Payé
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverDeliveries;
