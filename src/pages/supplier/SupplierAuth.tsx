import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SupplierAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [depotName, setDepotName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Simulate login
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace fournisseur",
      });
      navigate("/fournisseur/dashboard");
    } else {
      // Simulate registration
      toast({
        title: "Inscription réussie",
        description: "Votre compte fournisseur a été créé",
      });
      navigate("/fournisseur/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Espace Fournisseur
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte fournisseur"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="depotName">Nom du Dépôt</Label>
                  <Input
                    id="depotName"
                    placeholder="Ex: Dépôt Central N'Djamena"
                    value={depotName}
                    onChange={(e) => setDepotName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerName">Nom du Responsable</Label>
                  <Input
                    id="managerName"
                    placeholder="Votre nom complet"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+235 XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de Passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {isLogin ? "Se Connecter" : "Créer mon Compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Pas encore de compte ? Inscrivez-vous"
                : "Déjà inscrit ? Connectez-vous"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SupplierAuth;
