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
import { AnimatedGradientBg, AnimatedBlob, FloatingElement, AnimatedAccentCard, ShimmerButton, Card3D } from '@/components/ui/animated-background';
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
  const { user, isPremium, isAdmin } = useAuth();
  // For Pro+ features, we'll check if user is admin (enterprise tier)
  const isPremiumPlus = isPremium && isAdmin;
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
            <Card3D 
              accentColor="#009888"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Invoices</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400">
                    {isLoading ? '-' : invoiceCount}
                  </div>
                  <FloatingElement duration={3}>
                    <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20 shadow-md">
                      <ScrollText className="h-5 w-5 text-primary" />
                    </div>
                  </FloatingElement>
                </div>
              </div>
            </Card3D>
            
            <Card3D 
              accentColor="#22c55e"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Paid Invoices</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-600">
                    {isLoading ? '-' : paidCount}
                  </div>
                  <FloatingElement duration={3} delay={0.5}>
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 shadow-md">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </FloatingElement>
                </div>
              </div>
            </Card3D>
            
            <Card3D 
              accentColor="#eab308"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-600">
                    {isLoading ? '-' : pendingCount}
                  </div>
                  <FloatingElement duration={3} delay={0.2}>
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 shadow-md">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </FloatingElement>
                </div>
              </div>
            </Card3D>
            
            <Card3D 
              accentColor="#3b82f6"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Completion Rate</div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-600">
                      {isLoading ? '-' : `${Math.round(completionRate)}%`}
                    </div>
                    <FloatingElement duration={3} delay={0.7}>
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 shadow-md">
                        <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </FloatingElement>
                  </div>
                  <Progress value={completionRate} className="h-2 bg-blue-100 dark:bg-blue-900/30">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                  </Progress>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <GradientCard 
              className="h-full overflow-visible"
              gradient="bg-gradient-to-br from-primary/20 to-blue-600/10 dark:from-primary/10 dark:to-indigo-900/20"
              onClick={() => window.location.href = "/create-invoice"}
            >
              <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                <FloatingElement duration={4} delay={0.3}>
                  <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 mb-4 shadow-lg">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </div>
                </FloatingElement>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400">
                  Ready to Invoice?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create a new invoice with pre-filled information
                </p>
                <ShimmerButton 
                  className="mt-auto px-5 py-2"
                  onClick={() => {
                    window.location.href = "/create-invoice";
                  }}
                >
                  Create New Invoice
                </ShimmerButton>
              </div>
            </GradientCard>
            
            <Card3D 
              className="flex flex-col items-center justify-center p-4 text-center"
              onClick={() => window.location.href = "/create-invoice"}
              accentColor="#009888"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 mb-3">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium">New Invoice</span>
            </Card3D>
            
            <Card3D 
              className="flex flex-col items-center justify-center p-4 text-center"
              onClick={() => window.location.href = "/history"}
              accentColor="#6366f1"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/20 mb-3">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-medium">View History</span>
            </Card3D>
            
            <Card3D 
              className="flex flex-col items-center justify-center p-4 text-center"
              onClick={() => window.location.href = "/analytics"}
              accentColor="#3b82f6"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-3">
                <FileBarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium">Analytics</span>
            </Card3D>
            
            <Card3D 
              className="flex flex-col items-center justify-center p-4 text-center"
              onClick={() => window.location.href = "/roadmap"}
              accentColor="#f59e0b"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-3">
                <MapPin className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-medium">Roadmap</span>
            </Card3D>
            
            <Card3D 
              className="flex flex-col items-center justify-center p-4 text-center"
              onClick={() => window.location.href = "/settings"}
              accentColor="#6b7280"
              isPremiumPlus={isPremiumPlus}
            >
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="font-medium">Settings</span>
            </Card3D>
          </div>
        </div>

        {/* Start New Invoice Section */}
        <GradientCard 
          className="mb-8 relative" 
          gradient="bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-900/80 dark:to-[#151f33]/80"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatedBlob 
              color="#009888" 
              size={400} 
              top="-20%" 
              right="-5%" 
              opacity={0.03}
              duration={25}
            />
            <AnimatedBlob 
              color="#2563EB" 
              size={300} 
              bottom="-15%" 
              left="-5%" 
              opacity={0.02}
              duration={30}
              delay={1}
            />
          </div>
          
          <div className="relative z-10 p-6">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <div className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-3">
                  <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400">
                  Start a New Invoice
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-10">
                Quickly create a new invoice and get started immediately
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard 
                className="p-4 h-full"
                onClick={() => window.location.href = "/create-invoice"}
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-3">Client Information</label>
                <div className="flex items-center p-3 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span>Add Client Details</span>
                </div>
              </GlassCard>
              
              <GlassCard 
                className="p-4 h-full"
                onClick={() => window.location.href = "/create-invoice"}
                glowColor="rgba(59, 130, 246, 0.3)"
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-3">Invoice Items</label>
                <div className="flex items-center p-3 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-2">
                    <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Add Invoice Items</span>
                </div>
              </GlassCard>
              
              <GlassCard 
                className="p-4 h-full"
                onClick={() => window.location.href = "/create-invoice"}
                glowColor="rgba(99, 102, 241, 0.3)"
              >
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-3">Payment Terms</label>
                <div className="flex items-center p-3 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer">
                  <div className="p-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mr-2">
                    <PlusCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span>Set Payment Terms</span>
                </div>
              </GlassCard>
            </div>
            
            <div className="flex justify-end mt-6">
              <ShimmerButton
                onClick={() => {
                  window.location.href = "/create-invoice";
                }}
              >
                Start Creating <ArrowRight className="ml-2 h-4 w-4" />
              </ShimmerButton>
            </div>
          </div>
        </GradientCard>

        {/* Recent Invoices */}
        <GradientCard 
          className="p-6 relative"
          gradient="bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-[#151f33]/90 dark:to-[#0E1525]/90"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatedBlob 
              color="#009888" 
              size={300} 
              top="20%" 
              right="-10%" 
              opacity={0.03}
              duration={30}
            />
            <AnimatedBlob 
              color="#333333" 
              size={200} 
              bottom="10%" 
              left="-5%" 
              opacity={0.02}
              duration={25}
              delay={2}
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-3">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-indigo-400">
                  Recent Invoices
                </h2>
              </div>
              
              <ShimmerButton 
                className="px-3 py-1 text-sm"
                onClick={() => {
                  window.location.href = "/history";
                }}
              >
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </ShimmerButton>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="relative z-10">
              <TabsList className="mb-4 p-1 bg-white/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary">All</TabsTrigger>
                <TabsTrigger value="draft" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary">Draft</TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary">Paid</TabsTrigger>
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
      </GradientCard>
      </main>

      <Footer />
    </div>
  );
};

export default Home;