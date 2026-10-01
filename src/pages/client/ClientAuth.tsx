import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { MapPin, Store, User, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    etablissement: "",
    responsable: "",
    telephone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simuler la demande de géolocalisation
    if (!isLogin && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Position enregistrée",
            description: "Votre adresse de livraison a été définie.",
          });
          navigate("/client/dashboard");
        },
        (error) => {
          toast({
            title: "Géolocalisation requise",
            description: "Veuillez autoriser l'accès à votre position pour continuer.",
            variant: "destructive",
          });
        }
      );
    } else {
      navigate("/client/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Connexion Client" : "Inscription Client"}
          </h1>
          <p className="text-sm text-muted-foreground">
            N'Djam'Boisson Pro - Plan STARTER
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="etablissement">
                  <Store className="inline w-4 h-4 mr-2" />
                  Nom de l'établissement
                </Label>
                <Input
                  id="etablissement"
                  placeholder="Bar Le Relax"
                  value={formData.etablissement}
                  onChange={(e) =>
                    setFormData({ ...formData, etablissement: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsable">
                  <User className="inline w-4 h-4 mr-2" />
                  Nom du responsable
                </Label>
                <Input
                  id="responsable"
                  placeholder="Jean Dupont"
                  value={formData.responsable}
                  onChange={(e) =>
                    setFormData({ ...formData, responsable: e.target.value })
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="telephone">
              <Phone className="inline w-4 h-4 mr-2" />
              Numéro de téléphone
            </Label>
            <Input
              id="telephone"
              placeholder="+235 XX XX XX XX"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              <Lock className="inline w-4 h-4 mr-2" />
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          {!isLogin && (
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                Après inscription, nous vous demanderons l'autorisation d'accéder à votre position pour définir votre point de livraison.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full">
            {isLogin ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ClientAuth;
