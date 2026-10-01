import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { orders } from "@/data/orders";
import { formatFcfa } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  assigned: "Attribuée",
  delivered: "Livrée",
};

const ClientOrders = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/dashboard")}
              aria-label="Retour au tableau de bord"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex-1">
              Mes commandes
            </h1>
            <Badge variant="outline" className="bg-background">
              {orders.length} commande(s)
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.products}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    order.status === "delivered" ? "secondary" : "outline"
                  }
                  className={
                    order.status === "pending" ? "bg-warning/10 text-warning" : ""
                  }
                >
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>

              <Separator className="my-3" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paiement</span>
                <span className="text-foreground">{order.payment}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-primary">
                  {formatFcfa(order.amount)}
                </span>
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
};

export default ClientOrders;