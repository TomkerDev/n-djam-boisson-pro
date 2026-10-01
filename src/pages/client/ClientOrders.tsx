import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart, Loader2, PackageOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchOrders, STATUS_LABELS } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";

/**
 * Historique des commandes du client connecte.
 *
 * Le cloisonnement est applique par l'API a partir de la session : cette page
 * ne peut afficher que les commandes de l'etablissement courant, et aucun
 * parametre d'URL ne permet de elargir cette portee.
 */
export function ClientOrders() {
  const navigate = useNavigate();

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const all = orders ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/dashboard")}
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex-1">
              Mes commandes
            </h1>
            <Badge variant="outline" className="bg-background">
              {all.length} commande(s)
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement des commandes...
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-destructive/40">
            <p className="text-foreground font-medium mb-1">
              Commandes indisponibles
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
            <p className="text-foreground font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos commandes apparaîtront ici après votre premier achat.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {all.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{order.reference}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items && order.items.length > 0
                        ? order.items
                            .map((item) => `${item.quantity} × ${item.product.name}`)
                            .join(", ")
                        : "Détail non disponible"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={order.status === "DELIVERED" ? "secondary" : "outline"}
                  className={
                    order.status === "PENDING" ? "bg-warning/10 text-warning" : ""
                  }
                >
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>

              <Separator className="my-3" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Commission</span>
                <span>{formatFcfa(order.commissionFcfa)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-primary">{formatFcfa(order.totalFcfa)}</span>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate("/client/tracking")}
              >
                Suivre la commande
              </Button>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => navigate("/client/catalog")}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Passer une nouvelle commande
        </Button>
      </div>
    </div>
  );
}

export default ClientOrders;