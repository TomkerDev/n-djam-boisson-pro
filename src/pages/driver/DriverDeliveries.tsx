import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, PackageOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchMyDeliveries } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";

/**
 * Tournee du livreur connecte.
 *
 * La liste ne contient que ses propres livraisons : le filtre `driverId` est
 * applique par l'API a partir de la session, pas d'un parametre de requete.
 */
export function DriverDeliveries() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const { data: deliveries, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-deliveries"],
    queryFn: fetchMyDeliveries,
  });

  const all = deliveries ?? [];
  const pendingStops = all.filter((delivery) => delivery.completedAt === null);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Ma Tournée</h1>
              <p className="text-sm text-muted-foreground">
                {session?.user.fullName ?? "Livreur"}
              </p>
            </div>
            <Badge className="bg-success">Actif</Badge>
          </div>

          <Card className="p-4 bg-primary/5 border-primary">
            <p className="font-semibold text-foreground">
              {pendingStops.length} arrêt{pendingStops.length > 1 ? "s" : ""} à faire
            </p>
            <p className="text-sm text-muted-foreground">
              Ordre optimisé par le dépôt
            </p>
          </Card>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement de la tournée...
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-destructive/40">
            <p className="text-foreground font-medium mb-1">
              Tournée indisponible
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Le serveur n'a pas répondu. Vérifiez que l'API est démarrée.
            </p>
            <Button variant="outline" onClick={() => void refetch()}>
              Réessayer
            </Button>
          </Card>
        )}

        {!isLoading && !isError && all.length === 0 && (
          <Card className="p-8 text-center">
            <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Aucune livraison</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les arrêts attribués par le dépôt apparaîtront ici.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {all.map((delivery) => (
<Card
              key={delivery.id}
              className={`p-6 ${delivery.completedAt ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    delivery.completedAt
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {delivery.completedAt ? "✓" : delivery.stopOrder}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {delivery.order.reference}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {delivery.product.name} · {delivery.product.unit}
                  </p>
                </div>
                {delivery.completedAt === null && (
                  <Badge className="bg-primary">Prochain</Badge>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {delivery.order.deliveryAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${delivery.order.deliveryPhone}`}
                    className="text-primary hover:underline"
                  >
                    {delivery.order.deliveryPhone}
                  </a>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{delivery.product.name}</Badge>
                  <span className="text-sm font-bold text-primary">
                    À collecter : {formatFcfa(delivery.order.totalFcfa)}
                  </span>
                </div>
              </div>

              {delivery.completedAt === null && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/?q=${encodeURIComponent(delivery.order.deliveryAddress)}`,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
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

              {delivery.completedAt !== null && (
                <p className="text-center text-success font-medium">
                  ✓ Livré et encaissé
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DriverDeliveries;