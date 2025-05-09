import React from 'react';
import { Route, useLocation, Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
  requirePremium?: boolean;
}

/**
 * A route wrapper that only allows authenticated users to access the route
 * If user is not authenticated, redirects to the login page
 * If authentication status is loading, shows a loading indicator
 * Supports additional restrictions for admin and premium users
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  component: Component,
  requireAdmin = false,
  requirePremium = false,
}) => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check for premium requirement
  if (requirePremium && user.subscriptionPlan !== 'premium' && user.subscriptionPlan !== 'enterprise') {
    return (
      <Route path={path}>
        {() => {
          // Show toast notification before redirecting
          toast({
            title: "Premium Required",
            description: "This feature requires a premium subscription.",
            variant: "destructive",
          });
          return <Redirect to="/premium" />;
        }}
      </Route>
    );
  }

  // Check for admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return (
      <Route path={path}>
        {() => {
          // Show toast notification before redirecting
          toast({
            title: "Access Denied",
            description: "This area requires administrator privileges.",
            variant: "destructive",
          });
          return <Redirect to="/" />;
        }}
      </Route>
    );
  }

  // User meets all requirements, render the component
  return <Route path={path} component={Component} />;
};

export default ProtectedRoute;