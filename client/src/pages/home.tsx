import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice } from '@/types/invoice';
import { PlusCircle, FileText, Share, ArrowRight } from 'lucide-react';

const Home = () => {
  // Fetch recent invoices
  const { data: invoices, isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    staleTime: 60000, // 1 minute
  });
  
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-accent py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Professional Invoices in Seconds
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-white opacity-80">
              Create, share, and track invoices easily with InvoiceFlow's all-in-one platform.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <Button 
                  asChild
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-accent hover:bg-accent/90 sm:px-8"
                >
                  <Link href="/create-invoice">
                    Create Invoice
                  </Link>
                </Button>
                <a href="#features" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 sm:px-8">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                All-in-One Invoice Solution
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Everything you need to create and share professional invoices.
              </p>
            </div>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Professional Templates</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500">
                  Create beautiful, professional invoices that make a great impression on your clients.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Share className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Multi-Format Sharing</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500">
                  Share invoices via PDF, image, email, or directly to social platforms with just one click.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <PlusCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Quick & Easy</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500">
                  Create and send invoices in seconds with our intuitive interface and real-time preview.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Ready to Streamline Your Invoicing?
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Join thousands of businesses who trust InvoiceFlow for their invoicing needs.
              </p>
              <div className="mt-8">
                <Button 
                  asChild
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  <Link href="/create-invoice">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
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
};

export default Home;
