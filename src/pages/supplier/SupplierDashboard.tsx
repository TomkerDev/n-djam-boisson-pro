import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchOrders, fetchDepotDrivers, STATUS_LABELS } from "@/lib/apiOrders";

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  /**
   * Les compteurs sont derives des commandes reellement visibles par l'API.
   * Le cloisonnement garantit qu'il ne s'agit que des commandes de ce depot.
   */
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const { data: drivers } = useQuery({
    queryKey: ["depot-drivers"],
    queryFn: fetchDepotDrivers,
  });

  const all = orders ?? [];
  const pending = all.filter((order) => order.status === "PENDING").length;
  const inProgress = all.filter(
    (order) => order.status === "ASSIGNED" || order.status === "OUT_FOR_DELIVERY",
  ).length;
  const delivered = all.filter((order) => order.status === "DELIVERED").length;

  const availableDrivers = (drivers ?? []).filter((driver) => driver.isAvailable).length;

  const stats = [
    { label: "En Attente", value: pending, icon: AlertCircle, color: "text-warning" },
    { label: "En Cours", value: inProgress, icon: Clock, color: "text-primary" },
    { label: "Livrées", value: delivered, icon: CheckCircle, color: "text-success" },
  ];
return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Mon Dépôt</h1>
              <p className="text-sm text-muted-foreground">
                Tableau de bord logistique
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">Fournisseur</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void logout().then(() => navigate("/"))}
                aria-label="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <div className="text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">
                    {isLoading ? "—" : stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {pending > 0 && (
          <Card className="p-4 mb-6 bg-warning/10 border-warning">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {pending} nouvelle{pending > 1 ? "s" : ""} commande{pending > 1 ? "s" : ""} en attente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Attribuez un livreur pour lancer la préparation
                </p>
              </div>
              <Button onClick={() => navigate("/fournisseur/orders")}>
                Voir
              </Button>
            </div>
          </Card>
        )}

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/fournisseur/orders")}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Gérer les commandes
              </h3>
              <p className="text-sm text-muted-foreground">
                Voir et attribuer les commandes aux livreurs
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6 bg-muted">
          <h3 className="font-semibold text-foreground mb-3">
            Livreurs du dépôt
          </h3>
          {(drivers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun livreur rattaché à ce dépôt pour l'instant.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disponibles</span>
                <span className="text-foreground font-medium">
                  {availableDrivers} / {drivers?.length}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SupplierDashboard;