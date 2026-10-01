import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClientAuth from "./pages/client/ClientAuth";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientCatalog from "./pages/client/ClientCatalog";
import ClientCart from "./pages/client/ClientCart";
import ClientCheckout from "./pages/client/ClientCheckout";
import ClientTracking from "./pages/client/ClientTracking";
import ClientOrders from "./pages/client/ClientOrders";
import SupplierAuth from "./pages/supplier/SupplierAuth";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import SupplierOrders from "./pages/supplier/SupplierOrders";
import DriverAuth from "./pages/driver/DriverAuth";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverDeliveries from "./pages/driver/DriverDeliveries";
import DriverConfirm from "./pages/driver/DriverConfirm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Les donnees metier changent souvent (statut de commande) : un cache
      // court evite d'afficher un etat obsolete sans multiplier les appels.
      staleTime: 15_000,
      retry: 1,
    },
  },
});

/** Roles autorises sur un groupe de routes. */
const CLIENT = ["CLIENT"] as const;
const SUPPLIER = ["SUPPLIER"] as const;
const DRIVER = ["DRIVER"] as const;

/** Evite de repeter la garde autour de chaque route d'un meme espace. */
const guard = (roles: readonly ("CLIENT" | "SUPPLIER" | "DRIVER")[], element: React.ReactNode) => (
  <RequireRole roles={roles}>{element}</RequireRole>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Pages publiques */}
              <Route path="/client/auth" element={<ClientAuth />} />
              <Route path="/fournisseur/auth" element={<SupplierAuth />} />
              <Route path="/livreur/auth" element={<DriverAuth />} />

              {/* Espace client */}
              <Route path="/client/dashboard" element={guard(CLIENT, <ClientDashboard />)} />
              <Route path="/client/catalog" element={guard(CLIENT, <ClientCatalog />)} />
              <Route path="/client/cart" element={guard(CLIENT, <ClientCart />)} />
              <Route path="/client/checkout" element={guard(CLIENT, <ClientCheckout />)} />
              <Route path="/client/tracking" element={guard(CLIENT, <ClientTracking />)} />
              <Route path="/client/orders" element={guard(CLIENT, <ClientOrders />)} />

              {/* Espace fournisseur */}
              <Route
                path="/fournisseur/dashboard"
                element={guard(SUPPLIER, <SupplierDashboard />)}
              />
              <Route
                path="/fournisseur/orders"
                element={guard(SUPPLIER, <SupplierOrders />)}
              />

              {/* Espace livreur */}
              <Route
                path="/livreur/dashboard"
                element={guard(DRIVER, <DriverDashboard />)}
              />
              <Route
                path="/livreur/tournee"
                element={guard(DRIVER, <DriverDeliveries />)}
              />
              <Route
                path="/livreur/confirm/:deliveryId"
                element={guard(DRIVER, <DriverConfirm />)}
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;