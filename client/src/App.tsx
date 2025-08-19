import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
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
import FaqPage from "@/pages/faq-page";
import AdminConsole from "@/pages/admin-console";
import Roadmap from "@/pages/roadmap";
import ProgressBilling from "@/pages/progress-billing";
import ProgressBillingForm from "@/pages/progress-billing-form";
import ClientPortal from "@/pages/client-portal";
import AIAssistantPage from "@/pages/ai-assistant";
import MultiCurrencyPage from "@/pages/multi-currency";
import SupportChatPage from "@/pages/support-chat";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/auth/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Route for handling redirects from the home page */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/premium" component={PremiumPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/roadmap" component={Roadmap} />
      <ProtectedRoute path="/create-invoice" component={CreateInvoice} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} requirePremium />
      <ProtectedRoute path="/branding" component={BrandingSettings} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/progress-billing" component={ProgressBilling} />
      <ProtectedRoute path="/progress-billing/new" component={ProgressBillingForm} />
      <ProtectedRoute path="/progress-billing/:id" component={ProgressBillingForm} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/multi-currency" component={MultiCurrencyPage} />
      <Route path="/support" component={SupportChatPage} />
      <ProtectedRoute path="/admin" component={AdminConsole} requireAdmin />
      {/* Public shareable invoice route */}
      <Route path="/share/:shareableLink" component={SharedInvoiceView} />
      {/* Client portal route for invoice payments */}
      <Route path="/client/:shareableLink" component={ClientPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="greenvoice-theme">
        <AuthProvider>
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;