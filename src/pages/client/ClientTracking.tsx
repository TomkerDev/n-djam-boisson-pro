import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Lock } from "lucide-react";

const ClientTracking = () => {
  const navigate = useNavigate();

  const orderStatus = {
    current: "confirmed",
    steps: [
      { id: "pending", label: "En Attente", completed: true },
      { id: "confirmed", label: "Confirmée / Préparation", completed: true },
      { id: "enroute", label: "En Route", completed: false },
      { id: "delivered", label: "Livrée", completed: false },
    ],
  };

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
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                Suivi de commande
              </h1>
              <p className="text-sm text-muted-foreground">
                Commande #CMD-001
              </p>
            </div>
            <Badge className="bg-primary">En cours</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Order Status Timeline */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            État de la commande
          </h2>
          
          <div className="space-y-6">
            {orderStatus.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step.completed
                        ? "bg-success border-success text-success-foreground"
                        : step.id === orderStatus.current
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {step.completed ? "✓" : index + 1}
                  </div>
                  {index < orderStatus.steps.length - 1 && (
                    <div
                      className={`w-0.5 h-12 ${
                        step.completed ? "bg-success" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h3
                    className={`font-medium ${
                      step.completed || step.id === orderStatus.current
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </h3>
                  {step.id === orderStatus.current && (
                    <p className="text-sm text-muted-foreground mt-1">
                      En cours...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* GPS Tracking Locked (STARTER Plan) */}
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
            <Button variant="outline">
              Upgrader au Plan PRO
            </Button>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Détails de la commande
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Produits</span>
              <span className="text-foreground font-medium">
                5 × Casier Flag 65cl
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fournisseur</span>
              <span className="text-foreground font-medium">Dépôt Central</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant total</span>
              <span className="text-foreground font-medium">66,000 FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paiement</span>
              <Badge variant="secondary">À la livraison (Cash)</Badge>
            </div>
          </div>
        </Card>

        {/* Delivery Address */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-1">
                Adresse de livraison
              </h3>
              <p className="text-sm text-muted-foreground">
                Bar Le Relax, Quartier Chagoua, N'Djamena
              </p>
            </div>
          </div>
        </Card>

        {/* Contact Support */}
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            <Phone className="w-4 h-4 mr-2" />
            Contacter le support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientTracking;
