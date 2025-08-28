import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Share2, 
  BarChart2, 
  Settings, 
  Crown, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  route: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'create-invoice',
    title: 'Create Your First Invoice',
    description: 'Start by creating a professional invoice for your client',
    icon: <FileText className="h-6 w-6" />,
    action: 'Create Invoice',
    route: '/create-invoice'
  },
  {
    id: 'share-invoice',
    title: 'Share Your Invoice',
    description: 'Send your invoice via email, PDF, or social media',
    icon: <Share2 className="h-6 w-6" />,
    action: 'Learn Sharing',
    route: '/create-invoice'
  },
  {
    id: 'analytics',
    title: 'Track Performance',
    description: 'Monitor your invoice views and payment status',
    icon: <BarChart2 className="h-6 w-6" />,
    action: 'View Analytics',
    route: '/analytics'
  },
  {
    id: 'branding',
    title: 'Customize Your Brand',
    description: 'Add your logo and customize invoice appearance',
    icon: <Settings className="h-6 w-6" />,
    action: 'Customize Brand',
    route: '/branding'
  },
  {
    id: 'premium',
    title: 'Upgrade to Premium',
    description: 'Unlock advanced features and analytics',
    icon: <Crown className="h-6 w-6" />,
    action: 'Learn More',
    route: '/premium'
  }
];

export default function OnboardingWelcome() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    setCurrentStep(Math.min(currentStep + 1, onboardingSteps.length - 1));
  };

    try {
      localStorage.setItem('onboarding-completed', 'true');
    } catch (e) {
      // Could not save onboarding completion; log error for debugging
      console.error('Failed to set onboarding-completed in localStorage:', e);
    }
    navigate('/');
  };

  const progress = (completedSteps.length / onboardingSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Welcome to GreenVoice, {user?.fullName || user?.username}!
          </CardTitle>
          <CardDescription className="text-lg">
            Let's get you started with creating professional invoices in minutes
          </CardDescription>
          
          <div className="mt-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {completedSteps.length} of {onboardingSteps.length} steps completed
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onboardingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStep;
              
              return (
                <Card 
                  key={step.id}
                  className={`relative transition-all duration-200 ${
                    isCurrent ? 'ring-2 ring-primary shadow-lg' : ''
                  } ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-full ${
                        isCompleted 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-primary/10 dark:bg-primary/20'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    <Button
                      onClick={() => {
                        handleStepComplete(step.id);
                        navigate(step.route);
                      }}
                      className="w-full"
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted ? 'Completed' : step.action}
                      {!isCompleted && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleSkipOnboarding}
            >
              Skip Onboarding
            </Button>
            
            <div className="text-sm text-muted-foreground">
              You can always access this guide from the Help menu
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}