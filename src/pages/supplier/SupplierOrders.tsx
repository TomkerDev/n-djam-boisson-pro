import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { assignOrder, fetchDepotDrivers, fetchOrders, STATUS_LABELS } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";

export function SupplierOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const { data: drivers } = useQuery({
    queryKey: ["depot-drivers"],
    queryFn: fetchDepotDrivers,
  });

  /**
   * Attribution.
   *
   * Le serveur applique le cloisonnement : un livreur d'un autre depot ou une
   * commande d'un autre fournisseur produisent un 404, que l'interface
   * presente comme une erreur simple sans preciser laquelle.
   */
  const assignMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      assignOrder(orderId, driverId),
    onSuccess: (delivery) => {
      toast.success("Livreur attribué", {
        description: `Commande ${delivery.order.reference} attribuée.`,
      });
      setErrorMessage(null);
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Attribution impossible";
      setErrorMessage(message);
      toast.error("Attribution refusée", { description: message });
    },
  });

  const allOrders = orders ?? [];
  const pendingOrders = allOrders.filter((order) => order.status === "PENDING");

  const handleAssign = (orderId: string) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) {
      toast.error("Sélectionnez un livreur", {
        description: "Choisissez le livreur qui assurera cette livraison.",
      });
      return;
    }
    assignMutation.mutate({ orderId, driverId });
  };
return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/fournisseur/dashboard")}
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex-1">Commandes</h1>
            <Badge variant="outline" className="bg-warning/10 text-warning">
              {pendingOrders.length} en attente
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {errorMessage && (
          <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </Card>
        )}

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
            <Button
              variant="outline"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["orders"] })}
            >
              Réessayer
            </Button>
          </Card>
        )}

        {!isLoading && !isError && allOrders.length === 0 && (
          <Card className="p-8 text-center">
            <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les commandes de votre dépôt apparaîtront ici.
            </p>
          </Card>
        )}

        <div className="space-y-4">
          {allOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {order.reference}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt ?? Date.now()).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Badge
                  variant={order.status === "PENDING" ? "outline" : "secondary"}
                  className={
                    order.status === "PENDING" ? "bg-warning/10 text-warning" : ""
                  }
                >
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>

              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  {order.items && order.items.length > 0
                    ? order.items
                        .map((item) => `${item.quantity} × ${item.product.name}`)
                        .join(", ")
                    : "Détail non disponible"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Commission : {formatFcfa(order.commissionFcfa)}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {formatFcfa(order.totalFcfa)}
                  </span>
                </div>
              </div>

              {order.status === "PENDING" && (
                <div className="space-y-3">
                  <Select
                    value={selectedDriver[order.id] ?? ""}
                    onValueChange={(value) =>
                      setSelectedDriver((prev) => ({ ...prev, [order.id]: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un livreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {(drivers ?? []).map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.user.fullName} - {driver.vehicleNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    onClick={() => handleAssign(order.id)}
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Attribuer le Livreur
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SupplierOrders;