import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Store, Truck, Package } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: "client",
      title: "Client / Gérant",
      description: "Commander des boissons et snacks pour votre établissement",
      icon: Store,
      path: "/client/auth",
      color: "bg-primary",
    },
    {
      id: "supplier",
      title: "Fournisseur / Dépôt",
      description: "Gérer les commandes et attribuer les livraisons",
      icon: Package,
      path: "/fournisseur/auth",
      color: "bg-accent",
    },
    {
      id: "driver",
      title: "Livreur",
      description: "Effectuer les livraisons et confirmer les paiements",
      icon: Truck,
      path: "/livreur/auth",
      color: "bg-success",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            N'Djam'Boisson Pro
          </h1>
          <p className="text-lg text-muted-foreground">
            Plateforme B2B de Logistique de Boissons & Snacks
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm font-medium text-secondary-foreground">
              Plan STARTER - 100 Clients | 30 Fournisseurs
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer"
                onClick={() => navigate(role.path)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`${role.color} p-4 rounded-2xl text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {role.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                  <Button className="w-full" variant="outline">
                    Accéder
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            N'Djamena, Tchad • Support: +235 XX XX XX XX
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
