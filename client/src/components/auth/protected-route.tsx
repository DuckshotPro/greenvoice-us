import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requirePremium?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  requirePremium = false,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isPremium, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        {() => (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        {() => <Redirect to="/auth" />}
      </Route>
    );
  }

  if (requirePremium && !isPremium) {
    return (
      <Route path={path}>
        {() => <Redirect to="/premium" />}
      </Route>
    );
  }
  
  if (requireAdmin && !isAdmin) {
    return (
      <Route path={path}>
        {() => <Redirect to="/" />}
      </Route>
    );
  }

  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}