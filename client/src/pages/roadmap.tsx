import { Check, Clock, Calendar, ChevronRight } from 'lucide-react';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface FeatureItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  eta?: string;
}

const RoadmapPage = () => {
  // Group features by category
  const features: Record<string, FeatureItem[]> = {
    'Core Features': [
      {
        title: 'Invoice Creation',
        description: 'Create professional invoices with customizable templates',
        status: 'completed',
      },
      {
        title: 'Recurring Invoices',
        description: 'Set up invoices that repeat on a schedule',
        status: 'completed',
      },
      {
        title: 'Scheduled Invoices',
        description: 'Schedule invoices to be sent automatically on specific dates',
        status: 'completed',
      },
      {
        title: 'Client Management',
        description: 'Manage client information and communication history',
        status: 'completed',
      },
      {
        title: 'Invoice Templates',
        description: 'Save and reuse invoice configurations as templates',
        status: 'completed',
      },
    ],
    'Sharing & Distribution': [
      {
        title: 'PDF Export',
        description: 'Export invoices as professional PDF documents',
        status: 'completed',
      },
      {
        title: 'Email Sharing',
        description: 'Send invoices directly via email',
        status: 'completed',
      },
      {
        title: 'Social Media Sharing',
        description: 'Share invoice links on social media platforms',
        status: 'completed',
      },
      {
        title: 'Direct Messaging Integration',
        description: 'Share invoices through messaging apps like WhatsApp',
        status: 'completed',
      },
      {
        title: 'Shareable Links',
        description: 'Generate unique links for invoice access',
        status: 'completed',
      },
    ],
    'Analytics & Tracking': [
      {
        title: 'View Analytics',
        description: 'Track invoice views and engagement',
        status: 'completed',
      },
      {
        title: 'UTM Parameter Tracking',
        description: 'Track marketing campaign effectiveness',
        status: 'completed',
      },
      {
        title: 'Analytics Dashboard',
        description: 'Comprehensive dashboard with filters and insights',
        status: 'completed',
      },
      {
        title: 'Advanced Reporting',
        description: 'Generate detailed reports on invoice performance',
        status: 'in-progress',
        eta: 'Q2 2025',
      },
      {
        title: 'Integration with Google Analytics',
        description: 'Connect with Google Analytics for deeper insights',
        status: 'planned',
        eta: 'Q3 2025',
      },
    ],
    'Payment Processing': [
      {
        title: 'Stripe Integration',
        description: 'Process payments securely through Stripe',
        status: 'completed',
      },
      {
        title: 'Invoice Status Tracking',
        description: 'Track payment status (paid, overdue, etc.)',
        status: 'completed',
      },
      {
        title: 'Partial Payments',
        description: 'Allow clients to make partial payments on invoices',
        status: 'in-progress',
        eta: 'Q2 2025',
      },
      {
        title: 'PayPal Integration',
        description: 'Accept payments through PayPal',
        status: 'planned',
        eta: 'Q3 2025',
      },
      {
        title: 'Cryptocurrency Payments',
        description: 'Accept payments in popular cryptocurrencies',
        status: 'planned',
        eta: 'Q4 2025',
      },
    ],
    'Customization & Branding': [
      {
        title: 'Custom Color Schemes',
        description: 'Apply personalized color schemes to invoices',
        status: 'completed',
      },
      {
        title: 'Logo Integration',
        description: 'Add your business logo to invoices',
        status: 'completed',
      },
      {
        title: 'AI-Generated Branding Assets',
        description: 'Generate logos and visual assets with AI',
        status: 'completed',
      },
      {
        title: 'Advanced Template Designer',
        description: 'Create fully custom invoice layouts and designs',
        status: 'in-progress',
        eta: 'Q2 2025',
      },
      {
        title: 'White Label Solution',
        description: 'Remove GreenVoice branding for enterprise users',
        status: 'planned',
        eta: 'Q3 2025',
      },
    ],
    'User Experience': [
      {
        title: 'Dark Mode',
        description: 'Toggle between light and dark interface themes',
        status: 'completed',
      },
      {
        title: 'Mobile Responsive Design',
        description: 'Optimized experience on all device sizes',
        status: 'completed',
      },
      {
        title: 'Keyboard Shortcuts',
        description: 'Power user features for faster navigation',
        status: 'in-progress',
        eta: 'Q2 2025',
      },
      {
        title: 'Offline Mode',
        description: 'Create invoices without internet connection',
        status: 'planned',
        eta: 'Q4 2025',
      },
      {
        title: 'Multi-language Support',
        description: 'Interface and invoices in multiple languages',
        status: 'planned',
        eta: 'Q1 2026',
      },
    ],
  };

  // Count features by status
  const counts = Object.values(features).flat().reduce(
    (acc, feature) => {
      acc[feature.status]++;
      return acc;
    },
    { completed: 0, 'in-progress': 0, planned: 0 }
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="container py-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-4 font-nunito">GreenVoice Roadmap</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-6 font-montserrat">
              Our development roadmap shows completed features and what's coming next. We're continuously improving GreenVoice based on your feedback.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{counts.completed}</div>
                  <p className="text-muted-foreground">Features delivered</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{counts["in-progress"]}</div>
                  <p className="text-muted-foreground">Features in development</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Planned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{counts.planned}</div>
                  <p className="text-muted-foreground">Features on the horizon</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {Object.entries(features).map(([category, items], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="mb-10"
            >
              <h2 className="text-2xl font-bold mb-4 font-nunito">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((feature, index) => (
                  <Card key={index} className="border border-border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                        <Badge
                          variant={
                            feature.status === 'completed'
                              ? 'default'
                              : feature.status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                          className={
                            feature.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : feature.status === 'in-progress'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                              : 'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                          }
                        >
                          {feature.status === 'completed'
                            ? 'Completed'
                            : feature.status === 'in-progress'
                            ? 'In Progress'
                            : 'Planned'}
                        </Badge>
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    {feature.eta && (
                      <CardFooter className="pt-0">
                        <p className="text-sm text-muted-foreground">Expected: {feature.eta}</p>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}

          <div className="mt-12 mb-8 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 font-nunito">Have a Feature Request?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking to improve GreenVoice with new features that help you manage invoicing more efficiently.
            </p>
            <Button variant="gradient" size="lg" className="font-nunito">
              Submit Feature Request <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoadmapPage;