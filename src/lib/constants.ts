/** Taux de commission de la plateforme, appliqué au sous-total du panier. */
export const PLATFORM_COMMISSION_RATE = 0.1;

/** Nombre de commandes incluses par mois dans le plan STARTER. */
export const STARTER_ORDER_QUOTA = 15;

/** Délai de livraison annoncé au client, en heures. */
export const DELIVERY_DELAY_HOURS = "2-4";

/** Billets de coupure acceptés pour le rendu de la monnaie en espèces. */
export const CASH_DENOMINATIONS = [5000, 2000, 1000, 500, 250, 100] as const;