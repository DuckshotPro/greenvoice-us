import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FeatureBox } from '@/components/ui/feature-box';
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
          <section className="bg-gradient-to-r from-primary to-accent py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                Professional Invoices in Seconds
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-xl text-white opacity-80">
                Create, share, and track invoices easily with GreenVoice's all-in-one platform.
              </p>
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  <Button 
                    asChild
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent/90 sm:px-8"
                  >
                    <Link href="/auth">
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white dark:bg-[#1C2333] dark:text-white dark:border-[#2B3245] hover:bg-gray-50 dark:hover:bg-[#2B3245] sm:px-8"
                    onClick={() => {
                      const element = document.getElementById('features');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-16 bg-card dark:bg-[#1C2333]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  All-in-One Invoice Solution
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 mx-auto">
                  Everything you need to create and share professional invoices.
                </p>
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-3">
                <FeatureBox 
                  icon={<FileText className="h-6 w-6 text-greenvoice-primary" />}
                  title="Professional Templates"
                  description="Create beautiful, professional invoices that make a great impression on your clients."
                  iconBackground="bg-greenvoice-primary/10"
                />

                <FeatureBox 
                  icon={<Share className="h-6 w-6 text-greenvoice-primary" />}
                  title="Multi-Format Sharing"
                  description="Share invoices via PDF, image, email, or directly to social platforms with just one click."
                  iconBackground="bg-greenvoice-primary/10"
                />

                <FeatureBox 
                  icon={<PlusCircle className="h-6 w-6 text-greenvoice-primary" />}
                  title="Quick & Easy"
                  description="Create and send invoices in seconds with our intuitive interface and real-time preview."
                  iconBackground="bg-greenvoice-primary/10"
                />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gray-50 dark:bg-[#0E1525] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                  Ready to Streamline Your Invoicing?
                </h2>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 mx-auto">
                  Join thousands of businesses who trust GreenVoice for their invoicing needs.
                </p>
                <div className="mt-8">
                  <Button 
                    asChild
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    <Link href="/auth">
                      Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
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

      <main className="flex-grow container mx-auto px-4 py-8">
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
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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