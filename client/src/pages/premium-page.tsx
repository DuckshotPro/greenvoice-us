import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Check, AlertCircle, Clock, Play, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function PremiumPage() {
  const { user, isPremium, watchAdMutation } = useAuth();
  const { toast } = useToast();
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);

  // Calculate premium status and days remaining
  const premiumDaysRemaining = user?.premiumDaysRemaining || 0;
  const formattedExpiryDate = user?.subscriptionExpiry 
    ? new Date(user.subscriptionExpiry).toLocaleDateString() 
    : null;

  // Premium plan features
  const freePlanFeatures = [
    'Create up to 5 invoices per month',
    'Basic invoice templates',
    'Email and PDF sharing',
    'Manual payment tracking',
  ];

  const premiumPlanFeatures = [
    'Unlimited invoices',
    'Premium invoice templates',
    'All sharing methods',
    'Recurring invoices',
    'Analytics dashboard',
    'Client management',
    'Automatic reminders',
    'Customizable branding',
  ];

  // Handler for watching an ad
  const handleWatchAd = () => {
    setAdDialogOpen(true);
    setWatchingAd(false);
    setAdProgress(0);
    setAdCompleted(false);
  };

  // Simulate watching an ad
  const simulateAdWatching = () => {
    setWatchingAd(true);
    setAdProgress(0);
    
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        const newValue = prev + 2;
        if (newValue >= 100) {
          clearInterval(interval);
          setWatchingAd(false);
          setAdCompleted(true);
          return 100;
        }
        return newValue;
      });
    }, 150);
  };

  // Handle claiming premium days after ad is watched
  const handleClaimPremium = () => {
    watchAdMutation.mutate();
    setAdDialogOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Unlock Premium Features</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enhance your invoicing experience with our premium features, designed to save you time and help your business grow.
          </p>
          
          {/* Show premium status banner if applicable */}
          {isPremium && (
            <div className="mt-8 bg-gradient-to-r from-amber-100 to-yellow-100 border border-yellow-200 rounded-lg p-4 max-w-xl mx-auto">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-400 p-2 rounded-full">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-yellow-800">Premium Access Active</h3>
                  <p className="text-sm text-yellow-700">
                    {user?.subscriptionPlan !== 'free' 
                      ? `Your subscription is active until ${formattedExpiryDate}` 
                      : `You have ${premiumDaysRemaining} day${premiumDaysRemaining !== 1 ? 's' : ''} of premium access remaining`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Free plan */}
          <Card className={`border-2 ${!isPremium ? 'border-primary' : 'border-gray-200'}`}>
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>Basic invoicing for small businesses</CardDescription>
              <div className="mt-4 text-4xl font-bold">$0<span className="text-sm font-normal text-gray-500">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freePlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" disabled={true}>
                Current Plan
              </Button>
            </CardFooter>
          </Card>
          
          {/* Premium plan */}
          <Card className={`border-2 ${isPremium ? 'border-primary' : 'border-gray-200'}`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Premium Plan</CardTitle>
                  <CardDescription>Advanced features for growing businesses</CardDescription>
                </div>
                {isPremium && (
                  <div className="bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded">
                    ACTIVE
                  </div>
                )}
              </div>
              <div className="mt-4 text-4xl font-bold">$12<span className="text-sm font-normal text-gray-500">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {premiumPlanFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={isPremium}>
                {isPremium ? 'Current Plan' : 'Upgrade Now'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Try Premium For Free Card */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardHeader>
              <CardTitle>Try Premium For Free</CardTitle>
              <CardDescription className="text-gray-300">Watch a short ad to get premium access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">30-Second Ad</h3>
                    <p className="text-sm text-gray-300">Quick and simple process</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">24 Hours of Premium</h3>
                    <p className="text-sm text-gray-300">Full access to all features</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">No Credit Card</h3>
                    <p className="text-sm text-gray-300">No payment info required</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleWatchAd} 
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
                disabled={watchAdMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" /> 
                {watchAdMutation.isPending ? 'Processing...' : 'Watch Ad for Premium'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Ad watching dialog */}
        <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {!watchingAd && !adCompleted 
                  ? 'Watch Ad for Premium Access' 
                  : watchingAd 
                    ? 'Ad Playing...' 
                    : 'Ad Completed!'}
              </DialogTitle>
              <DialogDescription>
                {!watchingAd && !adCompleted 
                  ? 'Watch a 30-second ad to get 24 hours of premium access.' 
                  : watchingAd 
                    ? 'Please watch the complete ad to claim your premium access.' 
                    : 'Thanks for watching! You can now claim your premium access.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {watchingAd && (
                <div className="space-y-2">
                  <div className="bg-gray-100 h-40 flex items-center justify-center rounded-md">
                    <p className="text-gray-500">Ad content playing...</p>
                  </div>
                  <Progress value={adProgress} />
                  <p className="text-sm text-center text-gray-500">
                    {adProgress < 100 ? `Please wait (${Math.floor(adProgress)}%)` : 'Ad completed!'}
                  </p>
                </div>
              )}
              
              {!watchingAd && !adCompleted && (
                <div className="bg-gray-100 h-40 flex items-center justify-center rounded-md">
                  <div className="text-center">
                    <Play className="h-10 w-10 text-primary mx-auto mb-2" />
                    <p className="text-gray-500">Click play to watch the ad</p>
                  </div>
                </div>
              )}
              
              {adCompleted && (
                <div className="bg-green-50 h-40 flex items-center justify-center rounded-md">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-full inline-flex mb-2">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-green-700">Ad successfully completed!</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="sm:justify-between">
              {!watchingAd && !adCompleted && (
                <Button className="w-full" onClick={simulateAdWatching}>
                  <Play className="mr-2 h-4 w-4" /> Play Ad
                </Button>
              )}
              
              {adCompleted && (
                <Button className="w-full" onClick={handleClaimPremium}>
                  <Crown className="mr-2 h-4 w-4" /> Claim Premium Access
                </Button>
              )}
              
              {watchingAd && (
                <Button className="w-full" disabled>Watching Ad...</Button>
              )}
              
              {!watchingAd && (
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full mt-2">
                    Cancel
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
}