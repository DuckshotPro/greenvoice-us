import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Check, 
  Clock, 
  Star,
  Calendar, 
  FileText, 
  Settings, 
  ChevronLeft, 
  CreditCard,
  Globe, 
  RefreshCw, 
  BarChart,
  CalendarClock,
  MessageCircle,
  DollarSign,
  BellRing,
  UserCog
} from 'lucide-react';

// Define roadmap feature types
type FeatureStatus = 'completed' | 'inprogress' | 'planned';

interface RoadmapFeature {
  title: string;
  description: string;
  status: FeatureStatus;
  estimatedCompletion?: string;
  icon: React.ReactNode;
}

const Roadmap = () => {
  const { user } = useAuth();

  // Define roadmap features
  const features: RoadmapFeature[] = [
    {
      title: "Invoice Creation & Sharing",
      description: "Create and share professional invoices via multiple channels",
      status: "completed",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Authentication System",
      description: "Secure login and registration system with user roles",
      status: "completed",
      icon: <UserCog className="h-5 w-5" />
    },
    {
      title: "PDF Export",
      description: "Export invoices as professional PDF documents",
      status: "completed",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Scheduled Invoices",
      description: "Schedule invoices to be sent at a future date",
      status: "completed",
      icon: <Calendar className="h-5 w-5" />
    },
    {
      title: "Recurring Invoices",
      description: "Set up recurring invoice templates for regular billing",
      status: "completed",
      icon: <RefreshCw className="h-5 w-5" />
    },
    {
      title: "Branding Customization",
      description: "Customize invoice appearance with your brand colors and logo",
      status: "completed",
      icon: <Settings className="h-5 w-5" />
    },
    {
      title: "Premium Subscription",
      description: "Access advanced features with premium subscription or ad-based temporary access",
      status: "completed",
      icon: <Star className="h-5 w-5" />
    },
    {
      title: "Analytics Dashboard",
      description: "Track invoice metrics and campaign effectiveness",
      status: "completed",
      icon: <BarChart className="h-5 w-5" />
    },
    {
      title: "Discount System",
      description: "Add discounts and coupon codes to your invoices",
      status: "completed",
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: "Payment Processing",
      description: "Accept payments directly through Stripe integration",
      status: "completed",
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      title: "Automated Reminders",
      description: "Send automated payment reminders for outstanding invoices",
      status: "inprogress",
      estimatedCompletion: "May 2025",
      icon: <BellRing className="h-5 w-5" />
    },
    {
      title: "Client Portal",
      description: "Give clients access to view and pay their invoices",
      status: "planned",
      estimatedCompletion: "Q3 2025",
      icon: <Globe className="h-5 w-5" />
    },
    {
      title: "Multi-Currency Support",
      description: "Create invoices in different currencies with automatic conversion",
      status: "inprogress",
      estimatedCompletion: "May 2025",
      icon: <DollarSign className="h-5 w-5" />
    },
    {
      title: "Team Collaboration",
      description: "Invite team members to collaborate on invoices",
      status: "planned",
      estimatedCompletion: "Q4 2025",
      icon: <UserCog className="h-5 w-5" />
    },
    {
      title: "Client Messaging",
      description: "Communicate with clients directly within the platform",
      status: "planned",
      estimatedCompletion: "Q3 2025",
      icon: <MessageCircle className="h-5 w-5" />
    }
  ];

  // Filter features by status
  const completedFeatures = features.filter(feature => feature.status === 'completed');
  const inProgressFeatures = features.filter(feature => feature.status === 'inprogress');
  const plannedFeatures = features.filter(feature => feature.status === 'planned');

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary text-white">Completed</Badge>;
      case 'inprogress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'planned':
        return <Badge variant="outline">Planned</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-[#0E1525] min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">
              Product Roadmap
            </h1>
          </div>
          <p className="text-muted-foreground">
            Track the development progress of GreenVoice and see what's coming next
          </p>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="inprogress">In Progress</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{feature.description}</p>
                    {feature.estimatedCompletion && (
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Expected: {feature.estimatedCompletion}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inprogress">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{feature.description}</p>
                    {feature.estimatedCompletion && (
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Expected: {feature.estimatedCompletion}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="planned">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plannedFeatures.map((feature, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{feature.description}</p>
                    {feature.estimatedCompletion && (
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Expected: {feature.estimatedCompletion}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-card dark:bg-card rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-bold mb-4">Have a feature request?</h2>
          <p className="text-muted-foreground mb-4">
            We're constantly working to improve GreenVoice. If you have suggestions for features you'd like to see, we'd love to hear from you!
          </p>
          <Button asChild>
            <Link href="/settings">
              Contact Us
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Roadmap;