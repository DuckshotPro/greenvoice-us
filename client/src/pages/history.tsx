import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { History as HistoryIcon, Clock, CheckCircle, XCircle, ArrowDown, Filter } from 'lucide-react';

const History = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Invoice History | InvoiceFlow</title>
      </Helmet>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice History</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your previous invoices
            </p>
          </div>
          <Button variant="outline" className="hidden md:flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-xl">Recent Invoices</CardTitle>
                <CardDescription>View all your recent invoices</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <HistoryIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No invoices found</h3>
                    <p className="text-muted-foreground mt-2">
                      You haven't created any invoices yet. Start by creating your first invoice.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create-invoice">Create Invoice</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-xl">Draft Invoices</CardTitle>
                <CardDescription>Invoices that haven't been sent yet</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No draft invoices</h3>
                    <p className="text-muted-foreground mt-2">
                      You don't have any draft invoices. Create a new invoice to get started.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create-invoice">Create Invoice</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-xl">Sent Invoices</CardTitle>
                <CardDescription>Invoices that have been sent to clients</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <ArrowDown className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No sent invoices</h3>
                    <p className="text-muted-foreground mt-2">
                      You haven't sent any invoices yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create-invoice">Create Invoice</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-xl">Paid Invoices</CardTitle>
                <CardDescription>Invoices that have been paid by clients</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <CheckCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No paid invoices</h3>
                    <p className="text-muted-foreground mt-2">
                      You don't have any paid invoices yet.
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create-invoice">Create Invoice</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-xl">Overdue Invoices</CardTitle>
                <CardDescription>Invoices that are past their due date</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No overdue invoices</h3>
                    <p className="text-muted-foreground mt-2">
                      You don't have any overdue invoices. Great job!
                    </p>
                    <Button className="mt-4" asChild>
                      <a href="/create-invoice">Create Invoice</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default History;