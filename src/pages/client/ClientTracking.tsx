import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Lock,
  CheckCircle2,
  PackageOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchOrders, STATUS_LABELS, type ApiOrder } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";

/**
 * Etapes de suivi derivees du statut reellement stocke en base.
 *
 * Le tableau est ordonne : `index >= currentIndex` signifie que l'etape est
 * atteinte. Un statut terminal (annulee) sort du parcours normal.
 */
const TIMELINE = [
  { status: "PENDING", label: "En attente" },
  { status: "ASSIGNED", label: "Confirmée / Préparation" },
  { status: "OUT_FOR_DELIVERY", label: "En route" },
  { status: "DELIVERED", label: "Livrée" },
] as const;

export function ClientTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as { orderId?: string } | null)?.orderId;

  /**
   * Le suivi passe par la liste plutot que par GET /orders/:id : le suivi doit
   * fonctionner meme apres un rechargement de page, moment ou `location.state`
   * est perdu. Le cloisonnement garantit que seule une commande du client
   * courant peut etre retenue.
   */
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const all: ApiOrder[] = orders ?? [];
  const order = (orderId ? all.find((item) => item.id === orderId) : undefined) ??
    all.find((item) => item.status !== "DELIVERED" && item.status !== "CANCELLED") ??
    all[0];

  const currentIndex = order
    ? TIMELINE.findIndex((step) => step.status === order.status)
    : -1;
  const isCancelled = order?.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/orders")}
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Suivi de commande</h1>
              {order && (
                <p className="text-sm text-muted-foreground">{order.reference}</p>
              )}
            </div>
            {order && (
              <Badge
                className={
                  isCancelled
                    ? "bg-destructive"
                    : order.status === "DELIVERED"
                      ? "bg-success"
                      : "bg-primary"
                }
              >
                {STATUS_LABELS[order.status]}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement du suivi...
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border-destructive/40">
            <p className="text-foreground font-medium mb-1">Suivi indisponible</p>
            <p className="text-sm text-muted-foreground">
              Le serveur n'a pas répondu. Vérifiez que l'API est démarrée.
            </p>
          </Card>
        )}

        {!isLoading && !isError && !order && (
          <Card className="p-8 text-center">
            <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Aucune commande à suivre</p>
            <p className="text-sm text-muted-foreground mt-1">
              Passez une commande depuis le catalogue pour suivre sa livraison.
            </p>
            <Button className="mt-4" onClick={() => navigate("/client/catalog")}>
              Voir le catalogue
            </Button>
          </Card>
        )}

        {order && (
          <>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                État de la commande
              </h2>

              {isCancelled ? (
                <p className="text-sm text-destructive">
                  Cette commande a été annulée.
                </p>
              ) : (
                <div className="space-y-6">
                  {TIMELINE.map((step, index) => {
                    const reached = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={step.status} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              reached
                                ? "bg-success border-success text-success-foreground"
                                : "bg-muted border-border text-muted-foreground"
                            }`}
                          >
                            {reached ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                          </div>
                          {index < TIMELINE.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                index < currentIndex ? "bg-success" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <h3
                            className={`font-medium ${
                              reached ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </h3>
                          {isCurrent && (
                            <p className="text-sm text-muted-foreground mt-1">
                              En cours...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6 mb-6 bg-muted border-dashed border-2">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Suivi GPS en temps réel
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Disponible avec le Plan PRO
                </p>
                <Button variant="outline">Upgrader au Plan PRO</Button>
              </div>
            </Card>

            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Détails de la commande
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Produits</span>
                  <span className="text-foreground font-medium text-right">
                    {order.items && order.items.length > 0
                      ? order.items
                          .map((item) => `${item.quantity} × ${item.product.name}`)
                          .join(", ")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="text-foreground">{formatFcfa(order.subtotalFcfa)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="text-foreground">
                    {formatFcfa(order.commissionFcfa)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Montant total</span>
                  <span className="text-primary">{formatFcfa(order.totalFcfa)}</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default ClientTracking;
