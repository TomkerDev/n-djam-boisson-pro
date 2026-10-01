import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Truck, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchMyDeliveries } from "@/lib/apiOrders";
import { formatFcfa } from "@/lib/format";

/**
 * Tableau de bord livreur.
 *
 * Aucun livreur ne peut s'inscrire depuis l'interface : l'API reserve
 * l'inscription a un administrateur, car un livreur ne choisit pas lui-meme le
 * depot auquel il est rattache - il s'attribuerait n'importe quel perimetre
 * commercial. L'ecran d'authentification explique donc comment obtenir un compte.
 */
const DriverDashboard = () => {
  const navigate = useNavigate();
  const { logout, session } = useAuth();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["my-deliveries"],
    queryFn: fetchMyDeliveries,
  });

  const all = deliveries ?? [];
  const pending = all.filter((delivery) => delivery.completedAt === null).length;
  const completed = all.length - pending;
  const toCollect = all
    .filter((delivery) => delivery.completedAt === null)
    .reduce((sum, delivery) => sum + delivery.order.totalFcfa, 0);

  const stats = [
    { label: "À livrer", value: pending },
    { label: "Livrées", value: completed },
    { label: "Arrêts du jour", value: all.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Tableau de Bord</h1>
              <p className="text-sm text-muted-foreground">
                {session?.user.fullName ?? "Livreur"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-success">Actif</Badge>
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
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? "—" : stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-6 bg-primary/5 border-primary">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              À collecter
            </p>
            <div className="text-3xl font-bold text-primary mb-1">
              {isLoading ? "—" : formatFcfa(toCollect)}
            </div>
            <p className="text-xs text-muted-foreground">
              À remettre au dépôt en fin de tournée
            </p>
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/livreur/tournee")}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Ma Tournée</h3>
              <p className="text-sm text-muted-foreground">
                Voir les livraisons qui me sont attribuées
              </p>
            </div>
          </div>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement de la tournée...
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
