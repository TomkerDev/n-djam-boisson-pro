import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, TriangleAlert, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api";
import { confirmDelivery, fetchMyDeliveries } from "@/lib/apiOrders";
import { computeCashChange, formatFcfa } from "@/lib/format";

/** Longueur du code de verification remis par le gerant. */
const VERIFICATION_CODE_LENGTH = 4;

export function DriverConfirm() {
  const navigate = useNavigate();
  const { deliveryId } = useParams();
  const queryClient = useQueryClient();

  const [amountReceived, setAmountReceived] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * La livraison est relue dans la tournee du livreur connecte : l'API refuse
   * de toute facon une livraison qui ne lui appartient pas, et l'identifiant
   * d'URL ne permet pas d'en creer l'illusion.
   */
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["my-deliveries"],
    queryFn: fetchMyDeliveries,
  });

  const delivery = (deliveries ?? []).find((item) => item.id === deliveryId);
  const expected = delivery?.order.totalFcfa ?? 0;

  const received = Number.parseInt(amountReceived, 10);
  const hasAmount = Number.isFinite(received) && received > 0;
  const isShort = hasAmount && received < expected;
  const change = hasAmount ? computeCashChange(received, expected) : null;

  const mutation = useMutation({
    mutationFn: () =>
      confirmDelivery(deliveryId ?? "", {
        paymentMethod: "cash",
        amountReceived: received,
        verificationCode,
      }),
    onSuccess: () => {
      toast.success("Livraison confirmée", {
        description: `Paiement de ${formatFcfa(expected)} enregistré.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });
      navigate("/livreur/tournee", { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Confirmation impossible";
      setErrorMessage(message);
      toast.error("Confirmation refusée", { description: message });
    },
  });

  const canSubmit = Boolean(delivery) && hasAmount && !isShort && !mutation.isPending;
return (
    <div className="min-h-screen bg-background pb-32">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/livreur/tournee")}
              aria-label="Retour"
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
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement...
          </div>
        )}

        {!isLoading && !delivery && (
          <Card className="p-8 text-center border-destructive/40">
            <TriangleAlert className="w-10 h-10 mx-auto text-destructive mb-3" />
            <p className="text-foreground font-medium mb-1">Livraison introuvable</p>
            <p className="text-sm text-muted-foreground">
              Cette livraison n'existe pas ou ne vous est pas attribuée.
            </p>
          </Card>
        )}

        {delivery && (
          <>
            <Card className="p-6 mb-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {delivery.order.reference}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {delivery.order.deliveryAddress}
                </p>
                <p className="text-sm text-muted-foreground">
                  {delivery.product.name} · {delivery.product.unit}
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Montant à collecter
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatFcfa(expected)}
                  </p>
                </div>
              </div>
            </Card>

            {errorMessage && (
              <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </Card>
            )}

            <Card className="p-6 mb-6">
              <Label htmlFor="amount" className="text-foreground mb-2 block">
                Montant reçu (FCFA)
              </Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                placeholder={String(expected)}
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
                className="text-lg"
              />

              {isShort && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
                  <TriangleAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">
                    Montant insuffisant : il manque {formatFcfa(expected - received)}.
                  </p>
                </div>
              )}

              {!isShort && change && change.breakdown.length > 0 && (
                <div className="mt-3 p-3 bg-success/10 border border-success rounded-lg">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-foreground font-medium">
                      Monnaie à rendre
                    </span>
                    <span className="text-lg font-bold text-success">
                      {formatFcfa(change.change)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {change.breakdown.map(({ denomination, count }) => (
                      <span key={denomination} className="text-xs text-muted-foreground">
                        {count} × {formatFcfa(denomination)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 mb-6">
              <Label htmlFor="code" className="text-foreground mb-2 block">
                Code de vérification
              </Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={VERIFICATION_CODE_LENGTH}
                placeholder="0000"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                className="text-lg text-center tracking-widest"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Code à {VERIFICATION_CODE_LENGTH} chiffres fourni par le gérant
              </p>
            </Card>
          </>
        )}
      </div>

      {delivery && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="container mx-auto">
            <Button
              className="w-full h-14 text-lg bg-success hover:bg-success/90"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
            >
              {mutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              )}
              Confirmer la Livraison
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverConfirm;
