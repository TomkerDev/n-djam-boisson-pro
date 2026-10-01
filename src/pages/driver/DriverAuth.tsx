import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Truck, ArrowLeft, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

/**
 * Connexion livreur.
 *
 * L'inscription n'est volontairement pas offerte ici : l'API la reserve a un
 * administrateur, car un livreur ne choisit pas lui-meme le depot auquel il est
 * rattache - il s'attribuerait n'importe quel perimetre commercial.
 */
const DriverAuth = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(phone, password);
      toast.success("Connexion réussie");
      navigate("/livreur/dashboard", { replace: true });
    } catch (error) {
      toast.error("Connexion refusée", {
        description:
          error instanceof ApiError
            ? error.message
            : "Le serveur est injoignable, réessayez plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Espace Livreur</h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous à votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+235 XX XX XX XX"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Se Connecter
            </Button>
          </form>

          <div className="mt-6 p-3 bg-muted rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Pas encore de compte ? Les livreurs sont enregistrés par le dépôt
              ou un administrateur, qui vous rattache à un dépôt.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DriverAuth;
