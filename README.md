# N'Djam'Boisson Pro

Plateforme B2B de logistique de boissons et snacks pour N'Djamena, Tchad.

Le produit met en relation trois acteurs :

- **Client / Gerant** - commande des casiers de boissons et snacks pour son etablissement
- **Fournisseur / Depot** - recoit les commandes et attribue les livraisons
- **Livreur** - effectue la tournee, collecte le paiement et confirme la livraison

## Stack technique

| Couche | Technologie |
| --- | --- |
| Build | Vite 5 |
| Langage | TypeScript 5.8 (strict) |
| UI | React 18 + React Router 6 |
| Style | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Icones | lucide-react |
| Validation | zod + react-hook-form + @hookform/resolvers |
| Etat serveur | @tanstack/react-query |
| Graphiques | recharts |

## Prerequis

- Node.js >= 18
- npm >= 9

## Installation

```sh
npm ci
```

## Commandes

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de developpement sur http://localhost:8080 |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production localement |
| `npm run typecheck` | Verification des types (TypeScript project build) |
| `npm run lint` | Analyse statique ESLint |

Un seul gestionnaire de paquets est utilise : **npm** (`package-lock.json` fait foi).

## Variables d'environnement

Copiez `.env.example` vers `.env` et renseignez les valeurs.

```sh
cp .env.example .env
```

## Conventions

- Les routes sont prefixees par le role : `/client/*`, `/fournisseur/*`, `/livreur/*`
- Les donnees de demonstration sont centralisees dans `src/data/`
- L'etat transverse est porte par des providers React dans `src/context/`
- Les montants sont en FCFA
- Les couleurs sont definies en HSL dans `src/index.css` (drapeau du Tchad)

## Etat du projet

MVP fonctionnel cote navigation et parcours metier. Le backend n'est pas encore
branche : les donnees proviennent de `src/data/` et le paiement mobile money est
simule.