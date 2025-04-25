import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareAnalyticsDashboard from "@/components/analytics/share-analytics-dashboard";
import { Card3D } from "@/components/ui/animated-background";
import { ChevronLeft, Crown, Loader2, BarChart2, Share2 } from "lucide-react";
import { Link, useLocation } from "wouter";

/**
 * AnalyticsDashboard - Premium feature to display invoice analytics
 * Shows insights into sharing methods, view counts, and campaign effectiveness
 */
const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if the user has premium access
  const isPremium = user?.subscriptionPlan === "premium" || (user?.premiumDaysRemaining || 0) > 0;

  // Redirect if not a premium user
  useEffect(() => {
    if (user && !isPremium) {
      toast({
        title: "Premium Feature",
        description: "Analytics dashboard requires premium access.",
        variant: "destructive",
      });
      setLocation("/premium");
    }
  }, [user, isPremium, toast, setLocation]);

  // Fetch user's premium status details
  const { data: premiumData, isLoading: isLoadingPremium } = useQuery({
    queryKey: ["/api/user/premium-status"],
    queryFn: async () => {
      const response = await fetch("/api/user/premium-status");
      if (!response.ok) {
        throw new Error("Failed to fetch premium status");
      }
      return response.json();
    },
    enabled: !!user && isPremium,
  });

  // If not premium, show loading while redirecting
  if (!isPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading state while fetching premium status
  if (isLoadingPremium) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart2 className="h-8 w-8 mr-2" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and analyze your invoice sharing performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild>
            <Link to="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Invoices
            </Link>
          </Button>
          {user?.subscriptionPlan !== "premium" && (
            <Button variant="default" asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Link to="/premium">
                <Crown className="h-4 w-4 mr-1" />
                Upgrade to Premium
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Premium status banner */}
      <Card3D 
        className="mb-8 overflow-hidden"
        backgroundColor="bg-gradient-to-r from-indigo-800/20 to-purple-800/20 dark:from-indigo-900/30 dark:to-purple-900/30"
        accentColor="#a855f7"
      >
        <div className="p-6">
          <div className="flex items-center mb-2">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            <h3 className="text-xl font-semibold">Premium Features Active</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.subscriptionPlan === "premium" ? (
              <>You have full access to analytics with your premium subscription.</>
            ) : (
              <>
                You have temporary premium access for{" "}
                <Badge variant="outline" className="ml-1 font-semibold">
                  {user?.premiumDaysRemaining} day{user?.premiumDaysRemaining !== 1 ? "s" : ""} remaining
                </Badge>
              </>
            )}
          </p>
        </div>
      </Card3D>

      <Tabs defaultValue="share" className="space-y-8">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="share" className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share Analytics
          </TabsTrigger>
          <TabsTrigger value="overview" disabled className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview (Coming Soon)
          </TabsTrigger>
          <TabsTrigger value="campaigns" disabled className="flex items-center">
            <Crown className="h-4 w-4 mr-2" />
            Campaigns (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-8">
          <ShareAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="overview">
          <Card3D
            backgroundColor="bg-white dark:bg-gray-800"
            accentColor="#6366f1"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Overview Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comprehensive analytics for your invoices and payments
              </p>
              <div className="h-72 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Coming soon! More detailed analytics are being developed.
                  </p>
                </div>
              </div>
            </div>
          </Card3D>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card3D
            backgroundColor="bg-white dark:bg-gray-800"
            accentColor="#ec4899"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Campaign Analytics</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Track the performance of your marketing campaigns
              </p>
              <div className="h-72 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Coming soon! Campaign analytics will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </Card3D>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;