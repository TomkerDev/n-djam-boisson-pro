import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

const SupplierDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "En Attente", value: 5, icon: AlertCircle, color: "text-warning" },
    { label: "En Cours", value: 12, icon: Clock, color: "text-primary" },
    { label: "Livrées", value: 43, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Dépôt Central</h1>
              <p className="text-sm text-muted-foreground">
                Tableau de bord logistique
              </p>
            </div>
            <Badge className="bg-primary">Fournisseur</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <div className="text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alert for Pending Orders */}
        <Card className="p-4 mb-6 bg-warning/10 border-warning">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                5 nouvelles commandes en attente
              </h3>
              <p className="text-sm text-muted-foreground">
                Attribuez des livreurs pour commencer la préparation
              </p>
            </div>
            <Button onClick={() => navigate("/fournisseur/orders")}>
              Voir
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Actions rapides
          </h2>
          
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

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Historique des livraisons
                </h3>
                <p className="text-sm text-muted-foreground">
                  Consulter les livraisons terminées
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Available Drivers Info */}
        <Card className="p-6 mt-6 bg-muted">
          <h3 className="font-semibold text-foreground mb-3">
            État des livreurs
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponibles</span>
              <span className="text-foreground font-medium">3 / 5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">En livraison</span>
              <span className="text-foreground font-medium">2 / 5</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupplierDashboard;
