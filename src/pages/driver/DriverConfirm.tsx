import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Banknote, Smartphone, TriangleAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deliveries } from "@/data/orders";
import { computeCashChange, formatFcfa } from "@/lib/format";

/** Longueur attendue du code de vérification remis par le manager. */
const VERIFICATION_CODE_LENGTH = 4;

const DriverConfirm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [verificationCode, setVerificationCode] = useState("");
  const [amountReceived, setAmountReceived] = useState("");

  const delivery = deliveries.find((item) => item.id === orderId);
  const orderAmount = delivery?.amount ?? 0;

  const received = Number.parseInt(amountReceived, 10);
  const hasValidAmount = Number.isFinite(received) && received > 0;
  const cashChange = hasValidAmount
    ? computeCashChange(received, orderAmount)
    : null;
  const isShort = hasValidAmount && received < orderAmount;

  const handleConfirm = () => {
    if (!delivery) {
      toast({
        title: "Commande introuvable",
        description: `Aucune livraison ne correspond à l'identifiant ${orderId}.`,
        variant: "destructive",
      });
      return;
    }

    if (!hasValidAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer le montant reçu",
        variant: "destructive",
      });
      return;
    }

    if (isShort) {
      toast({
        title: "Montant insuffisant",
        description: `Il manque ${formatFcfa(orderAmount - received)} à encaisser.`,
        variant: "destructive",
      });
      return;
    }

    // Le code est trimé avant contrôle pour ignorer les espaces de saisie.
    const normalizedCode = verificationCode.trim();
    if (
      normalizedCode.length !== VERIFICATION_CODE_LENGTH ||
      !/^\d+$/.test(normalizedCode)
    ) {
      toast({
        title: "Code invalide",
        description: `Le code de vérification doit contenir ${VERIFICATION_CODE_LENGTH} chiffres.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Livraison confirmée !",
      description: `Paiement de ${formatFcfa(orderAmount)} enregistré avec succès.`,
    });
    navigate("/livreur/tournee");
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/livreur/tournee")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Confirmation de Livraison
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-3">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {delivery?.client ?? "Commande inconnue"}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              Commande {orderId}
            </p>
            <p className="text-sm text-muted-foreground">
              {delivery?.products ?? "-"}
            </p>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Montant à collecter
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatFcfa(orderAmount)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">
            Mode de paiement reçu
          </h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <Label
              htmlFor="cash"
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <RadioGroupItem value="cash" id="cash" />
              <Banknote className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">
                Paiement Cash
              </span>
            </Label>

            <Label
              htmlFor="mobile"
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all mt-3 ${
                paymentMethod === "mobile"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <RadioGroupItem value="mobile" id="mobile" />
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">
                Mobile Money
              </span>
            </Label>
          </RadioGroup>
        </Card>

        {/* Amount Verification */}
        {paymentMethod === "cash" && (
          <Card className="p-6 mb-6">
            <Label htmlFor="amount" className="text-foreground mb-2 block">
              Montant reçu (FCFA)
            </Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              placeholder={String(orderAmount)}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="text-lg"
            />

            {isShort && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
                <TriangleAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  Montant insuffisant : il manque {formatFcfa(orderAmount - received)}.
                </p>
              </div>
            )}

            {!isShort && cashChange && cashChange.breakdown.length > 0 && (
              <div className="mt-3 p-3 bg-success/10 border border-success rounded-lg">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-foreground font-medium">
                    Monnaie à rendre
                  </span>
                  <span className="text-lg font-bold text-success">
                    {formatFcfa(cashChange.change)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {cashChange.breakdown.map(({ denomination, count }) => (
                    <span key={denomination} className="text-xs text-muted-foreground">
                      {count} × {formatFcfa(denomination)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Verification Code */}
        <Card className="p-6 mb-6">
          <Label htmlFor="code" className="text-foreground mb-2 block">
            Code de vérification
          </Label>
          <Input
            id="code"
            placeholder="0000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="text-lg text-center tracking-widest"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Code à {VERIFICATION_CODE_LENGTH} chiffres fourni par le manager logistique
          </p>
        </Card>

        {/* Instructions */}
        <Card className="p-4 bg-muted">
          <p className="text-sm text-foreground">
            ℹ️ Assurez-vous que le client a bien reçu tous les produits avant de confirmer la livraison.
          </p>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container mx-auto">
          <Button
            disabled={!delivery || !hasValidAmount || isShort}
            className="w-full h-14 text-lg bg-success hover:bg-success/90"
            onClick={handleConfirm}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Confirmer la Livraison
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverConfirm;
