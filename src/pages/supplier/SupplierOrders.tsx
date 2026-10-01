import { useState } from "react";
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
import { ArrowLeft, MapPin, Phone, Route } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  client: string;
  address: string;
  phone: string;
  products: string;
  amount: number;
  payment: string;
  status: "pending" | "assigned" | "delivered";
}

const SupplierOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});

  const orders: Order[] = [
    {
      id: "CMD-001",
      client: "Bar Le Relax",
      address: "Quartier Chagoua, N'Djamena",
      phone: "+235 66 XX XX XX",
      products: "5 × Casier Flag 65cl",
      amount: 66000,
      payment: "Cash à la livraison",
      status: "pending",
    },
    {
      id: "CMD-002",
      client: "Snack Paradise",
      address: "Quartier Moursal, N'Djamena",
      phone: "+235 62 XX XX XX",
      products: "3 × Casier Coca-Cola 1L",
      amount: 28050,
      payment: "Moov Money",
      status: "pending",
    },
  ];

  const drivers = [
    { id: "1", name: "Mohammed Ali", status: "Disponible" },
    { id: "2", name: "Hassan Ibrahim", status: "Disponible" },
    { id: "3", name: "Fatima Moussa", status: "Disponible" },
  ];

  const handleAssignDriver = (orderId: string) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un livreur",
        variant: "destructive",
      });
      return;
    }

    const driver = drivers.find((d) => d.id === driverId);
    toast({
      title: "Livreur attribué",
      description: `Commande ${orderId} attribuée à ${driver?.name}`,
    });
  };

  const handleOptimizeRoute = () => {
    toast({
      title: "Tournée optimisée",
      description: "L'ordre des arrêts a été calculé automatiquement",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/fournisseur/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex-1">
              Commandes en Attente
            </h1>
            <Badge variant="outline" className="bg-warning/10 text-warning">
              {orders.filter((o) => o.status === "pending").length} en attente
            </Badge>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={handleOptimizeRoute}
          >
            <Route className="w-4 h-4 mr-2" />
            Optimiser la Tournée
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {order.client}
                  </h3>
                  <p className="text-sm text-primary font-medium">
                    {order.id}
                  </p>
                </div>
                <Badge
                  variant={
                    order.status === "pending" ? "outline" : "secondary"
                  }
                  className={
                    order.status === "pending"
                      ? "bg-warning/10 text-warning"
                      : ""
                  }
                >
                  {order.status === "pending" ? "En Attente" : "Attribuée"}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{order.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{order.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-sm font-medium text-foreground mb-1">
                  {order.products}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {order.payment}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {order.amount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {order.status === "pending" && (
                <div className="space-y-3">
                  <Select
                    value={selectedDriver[order.id] || ""}
                    onValueChange={(value) =>
                      setSelectedDriver((prev) => ({
                        ...prev,
                        [order.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un livreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} - {driver.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="w-full"
                    onClick={() => handleAssignDriver(order.id)}
                  >
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
};

export default SupplierOrders;
