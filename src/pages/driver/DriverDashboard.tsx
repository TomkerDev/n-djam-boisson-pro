import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, Clock, CheckCircle, Truck } from "lucide-react";

const DriverDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "En Attente", value: 2, icon: Clock, color: "text-warning" },
    { label: "Livrées Aujourd'hui", value: 8, icon: CheckCircle, color: "text-success" },
    { label: "Total du Jour", value: 10, icon: Package, color: "text-primary" },
  ];

  const todayEarnings = 125000; // FCFA

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
              <p className="text-sm text-muted-foreground">
                Mohammed Ali - Livreur
              </p>
            </div>
            <Badge className="bg-success">Actif</Badge>
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

        {/* Earnings Card */}
        <Card className="p-6 mb-6 bg-primary/5 border-primary">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Collectes du Jour
            </p>
            <div className="text-3xl font-bold text-primary mb-1">
              {todayEarnings.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              À remettre au dépôt en fin de tournée
            </p>
          </div>
        </Card>

        {/* Active Deliveries Alert */}
        <Card className="p-4 mb-6 bg-warning/10 border-warning">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-warning flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                2 livraisons en attente
              </h3>
              <p className="text-sm text-muted-foreground">
                Commencez votre tournée maintenant
              </p>
            </div>
            <Button onClick={() => navigate("/livreur/tournee")}>
              Démarrer
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
            onClick={() => navigate("/livreur/tournee")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Ma Tournée
                </h3>
                <p className="text-sm text-muted-foreground">
                  Voir les livraisons à effectuer
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
                  Historique
                </h3>
                <p className="text-sm text-muted-foreground">
                  Consulter vos livraisons terminées
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Info */}
        <Card className="p-6 mt-6 bg-muted">
          <h3 className="font-semibold text-foreground mb-3">
            Performance du Mois
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraisons Totales</span>
              <span className="text-foreground font-medium">156</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taux de Réussite</span>
              <span className="text-success font-medium">98%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant Collecté</span>
              <span className="text-foreground font-medium">2,450,000 FCFA</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
