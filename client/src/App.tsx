import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import Home from "@/pages/home";
import CreateInvoice from "@/pages/create-invoice";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import AuthPage from "@/pages/auth-page";
import PremiumPage from "@/pages/premium-page";
import SharedInvoiceView from "@/pages/shared-invoice-view";
import BrandingSettings from "@/pages/branding-settings";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/auth/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Route for handling redirects from the home page */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/premium" component={PremiumPage} />
      <ProtectedRoute path="/create-invoice" component={CreateInvoice} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} requirePremium />
      <ProtectedRoute path="/branding" component={BrandingSettings} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/settings" component={Settings} />
      {/* Public shareable invoice route */}
      <Route path="/share/:shareableLink" component={SharedInvoiceView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;