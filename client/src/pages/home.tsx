import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import QuickInvoice from '@/components/quick-invoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureBox } from '@/components/ui/feature-box';
import { AnimatedGradientBg, AnimatedBlob, FloatingElement, AnimatedAccentCard, ShimmerButton } from '@/components/ui/animated-background';
import { GlassCard, GradientCard, FeatureCard } from '@/components/ui/glass-card';
import { Invoice, formatCurrency } from '@/types/invoice';
import { 
  PlusCircle, 
  FileText, 
  Share, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  BarChart2, 
  Settings, 
  FileBarChart2, 
  CalendarClock, 
  DollarSign, 
  RefreshCw,
  AlarmClock,
  ScrollText,
  MapPin,
  ChevronRight
} from 'lucide-react';

const Home = () => {
  const { user, isPremium } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch recent invoices only if user is logged in
  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    staleTime: 60000, // 1 minute
    enabled: !!user, // Only run query if user is authenticated
  });

  // Fetch invoices by status
  const { data: draftInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices/status/draft'],
    staleTime: 60000,
    enabled: !!user,
  });

  const { data: paidInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices/status/paid'],
    staleTime: 60000,
    enabled: !!user,
  });

  // Calculate stats for the dashboard
  const invoiceCount = invoices?.length || 0;
  const paidCount = paidInvoices?.length || 0;
  const pendingCount = invoiceCount - paidCount;
  const completionRate = invoiceCount > 0 ? (paidCount / invoiceCount) * 100 : 0;
  
  // Render the marketing landing page for non-authenticated users
  if (!user) {
    return (
      <div className="bg-gray-100 dark:bg-[#0E1525] min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-r from-primary to-accent py-16 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none">
              <AnimatedBlob 
                color="#ffffff" 
                size={600} 
                top="-20%" 
                right="-10%" 
                opacity={0.07}
                duration={25}
              />
              <AnimatedBlob 
                color="#ffffff" 
                size={400} 
                bottom="-10%" 
                left="-5%" 
                opacity={0.05}
                duration={30}
                delay={1}
              />
              <AnimatedBlob 
                color="#ffffff" 
                size={300} 
                top="30%" 
                right="20%" 
                opacity={0.04}
                duration={20}
                delay={2}
              />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Text */}
                <div className="text-center lg:text-left">
                  <FloatingElement duration={6} delay={0.5} className="inline-block">
                    <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl bg-clip-text bg-gradient-to-r from-white to-white/90">
                      Professional Invoices in Seconds
                    </h1>
                  </FloatingElement>
                  <p className="mt-6 max-w-lg text-xl text-white opacity-80">
                    Create, share, and track invoices easily with GreenVoice's all-in-one platform.
                  </p>
                  <div className="mt-10 max-w-sm mx-auto lg:mx-0 sm:flex sm:space-x-4">
                    <ShimmerButton
                      className="w-full sm:w-auto"
                      onClick={() => {
                        window.location.href = "/auth";
                      }}
                    >
                      Sign In
                    </ShimmerButton>
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white dark:bg-[#1C2333] dark:text-white dark:border-[#2B3245] hover:bg-gray-50 dark:hover:bg-[#2B3245] sm:px-8"
                      onClick={() => {
                        const element = document.getElementById('features');
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
                
                {/* Right Column - Quick Invoice */}
                <div className="mt-8 lg:mt-0">
                  <FloatingElement duration={5} delay={0.2}>
                    <AnimatedAccentCard>
                      <QuickInvoice />
                    </AnimatedAccentCard>
                  </FloatingElement>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="relative py-16 bg-card dark:bg-[#1C2333] overflow-hidden">
            {/* Background elements */}
            <AnimatedGradientBg className="opacity-30" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400">
                  All-in-One Invoice Solution
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 mx-auto">
                  Everything you need to create and share professional invoices.
                </p>
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <FloatingElement duration={4} delay={0.2}>
                  <FeatureCard 
                    icon={<FileText className="h-6 w-6 text-primary" />}
                    title="Professional Templates"
                    description="Create beautiful, professional invoices that make a great impression on your clients."
                    glowColor="rgba(0, 152, 136, 0.3)"
                  />
                </FloatingElement>

                <FloatingElement duration={4} delay={0.4}>
                  <FeatureCard 
                    icon={<Share className="h-6 w-6 text-blue-500" />}
                    title="Multi-Format Sharing"
                    description="Share invoices via PDF, image, email, or directly to social platforms with just one click."
                    glowColor="rgba(59, 130, 246, 0.3)"
                  />
                </FloatingElement>

                <FloatingElement duration={4} delay={0.6}>
                  <FeatureCard 
                    icon={<PlusCircle className="h-6 w-6 text-indigo-500" />}
                    title="Quick & Easy"
                    description="Create and send invoices in seconds with our intuitive interface and real-time preview."
                    glowColor="rgba(99, 102, 241, 0.3)"
                  />
                </FloatingElement>
              </div>
              
              <div className="mt-16 grid gap-8 md:grid-cols-3">
                <FloatingElement duration={4} delay={0.5}>
                  <FeatureCard 
                    icon={<CalendarClock className="h-6 w-6 text-amber-500" />}
                    title="Scheduled Invoices"
                    description="Set it and forget it! Schedule invoices to be sent automatically at the perfect time."
                    glowColor="rgba(245, 158, 11, 0.3)"
                  />
                </FloatingElement>

                <FloatingElement duration={4} delay={0.7}>
                  <FeatureCard 
                    icon={<RefreshCw className="h-6 w-6 text-emerald-500" />}
                    title="Recurring Billing"
                    description="Automate your regular invoices with customizable recurring templates on your schedule."
                    glowColor="rgba(16, 185, 129, 0.3)"
                  />
                </FloatingElement>

                <FloatingElement duration={4} delay={0.9}>
                  <FeatureCard 
                    icon={<BarChart2 className="h-6 w-6 text-purple-500" />}
                    title="Detailed Analytics"
                    description="Gain insights into your business with comprehensive invoice analytics and reports."
                    glowColor="rgba(139, 92, 246, 0.3)"
                  />
                </FloatingElement>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative bg-gray-50 dark:bg-[#0E1525] py-16 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
              <AnimatedBlob 
                color="#009888" 
                size={500} 
                top="-15%" 
                right="-5%" 
                opacity={0.07}
                duration={25}
              />
              <AnimatedBlob 
                color="#2563EB" 
                size={400} 
                bottom="-10%" 
                left="-5%" 
                opacity={0.06}
                duration={30}
                delay={1}
              />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400 sm:text-4xl inline-block">
                  Ready to Streamline Your Invoicing?
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 mx-auto">
                  Join thousands of businesses who trust GreenVoice for their invoicing needs.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ShimmerButton
                    className="px-8 py-3 rounded-lg"
                    onClick={() => {
                      window.location.href = "/auth";
                    }}
                  >
                    Get Started <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </ShimmerButton>
                  
                  <GradientCard className="sm:w-auto py-4 px-6 cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => {
                      window.location.href = "/roadmap";
                    }}
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>View Our Roadmap</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </GradientCard>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // User dashboard for authenticated users
  return (
    <div className="bg-gray-100 dark:bg-[#0E1525] min-h-screen flex flex-col">
      <Header />
      
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <AnimatedBlob 
          color="#009888" 
          size={800} 
          top="-20%" 
          right="-15%" 
          opacity={0.04}
          duration={50}
        />
        <AnimatedBlob 
          color="#2563EB" 
          size={700} 
          bottom="-25%" 
          left="-10%" 
          opacity={0.03}
          duration={60}
          delay={3}
        />
      </div>

      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, {user.fullName || user.username}!
              </h1>
              <p className="text-gray-500 mt-1">Here's your invoice dashboard</p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm" className="hidden md:flex">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden sm:flex md:hidden">
                <Link href="/roadmap">
                  <MapPin className="h-4 w-4 mr-1" />
                  Roadmap
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80">
                <Link href="/create-invoice">
                  <PlusCircle className="h-4 w-4 mr-1" /> 
                  New Invoice
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{isLoading ? '-' : invoiceCount}</div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <ScrollText className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Paid Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{isLoading ? '-' : paidCount}</div>
                  <div className="p-2 rounded-full bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{isLoading ? '-' : pendingCount}</div>
                  <div className="p-2 rounded-full bg-amber-100">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{isLoading ? '-' : `${Math.round(completionRate)}%`}</div>
                    <div className="p-2 rounded-full bg-blue-100">
                      <BarChart2 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="border-dashed border-2 border-primary/50 bg-primary/5 h-full">
              <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <PlusCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Ready to Invoice?</CardTitle>
                <CardDescription className="mb-4">
                  Create a new invoice with pre-filled information
                </CardDescription>
                <Button asChild className="mt-auto bg-gradient-to-r from-primary to-primary/80">
                  <Link href="/create-invoice">
                    Create New Invoice
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
              <Link href="/create-invoice">
                <PlusCircle className="h-6 w-6 mb-1" />
                <span>New Invoice</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
              <Link href="/history">
                <FileText className="h-6 w-6 mb-1" />
                <span>View History</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
              <Link href="/analytics">
                <FileBarChart2 className="h-6 w-6 mb-1" />
                <span>Analytics</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
              <Link href="/roadmap">
                <MapPin className="h-6 w-6 mb-1" />
                <span>Roadmap</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
              <Link href="/settings">
                <Settings className="h-6 w-6 mb-1" />
                <span>Settings</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Start New Invoice Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ScrollText className="h-5 w-5 mr-2 text-primary" />
              Start a New Invoice
            </CardTitle>
            <CardDescription>
              Quickly create a new invoice and get started immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Information</label>
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link href="/create-invoice">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Client Details
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Items</label>
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link href="/create-invoice">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Invoice Items
                  </Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms</label>
                <Button asChild variant="outline" className="w-full justify-start" size="lg">
                  <Link href="/create-invoice">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Set Payment Terms
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button asChild>
              <Link href="/create-invoice">
                Start Creating <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Invoices */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Invoices</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/history">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !invoices?.length ? (
                <Card className="bg-gray-50 dark:bg-[#151f33] border-dashed dark:border-[#2B3245]">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium mb-1 dark:text-white">No invoices yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first invoice to get started
                    </p>
                    <Button asChild>
                      <Link href="/create-invoice">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Create Invoice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{invoice.clientName || "Client"}</div>
                            <div className="text-sm text-gray-500">
                              #{invoice.invoiceNumber} - {new Date(invoice.issueDate || '').toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div>{formatCurrency(invoice.total, invoice.currency || 'USD')}</div>
                            <Badge 
                              variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'draft' ? 'outline' :
                                invoice.status === 'sent' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {invoice.status}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/create-invoice?id=${invoice.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="draft">
              {!draftInvoices?.length ? (
                <Card className="bg-gray-50 dark:bg-[#151f33] border-dashed dark:border-[#2B3245]">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium mb-1 dark:text-white">No draft invoices</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create a draft invoice to save your work in progress
                    </p>
                    <Button asChild>
                      <Link href="/create-invoice">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Create Draft
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {draftInvoices.slice(0, 5).map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{invoice.clientName || "Client"}</div>
                            <div className="text-sm text-gray-500">
                              #{invoice.invoiceNumber} - {new Date(invoice.issueDate || '').toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div>{formatCurrency(invoice.total, invoice.currency || 'USD')}</div>
                            <Badge variant="outline">Draft</Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/create-invoice?id=${invoice.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="paid">
              {!paidInvoices?.length ? (
                <Card className="bg-gray-50 dark:bg-[#151f33] border-dashed dark:border-[#2B3245]">
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium mb-1 dark:text-white">No paid invoices</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Paid invoices will appear here when clients complete payment
                    </p>
                    <Button asChild>
                      <Link href="/create-invoice">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Create Invoice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {paidInvoices.slice(0, 5).map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{invoice.clientName || "Client"}</div>
                            <div className="text-sm text-gray-500">
                              #{invoice.invoiceNumber} - {new Date(invoice.issueDate || '').toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div>{formatCurrency(invoice.total, invoice.currency || 'USD')}</div>
                            <Badge>Paid</Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/create-invoice?id=${invoice.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;