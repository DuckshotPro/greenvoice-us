import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Define types for our analytics data
interface ShareMethodAnalytics {
  method: string;
  count: number;
}

interface ShareViewAnalytics {
  invoiceId: number;
  views: number;
}

// Custom colors for our charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0', '#F4D03F'];
const DEFAULT_COLOR = '#7C3AED';

// Formatting for method names
const formatMethodName = (method: string): string => {
  switch (method) {
    case 'email':
      return 'Email';
    case 'link':
      return 'Direct Link';
    case 'twitter':
      return 'Twitter';
    case 'facebook':
      return 'Facebook';
    case 'linkedin':
      return 'LinkedIn';
    case 'whatsapp':
      return 'WhatsApp';
    case 'telegram':
      return 'Telegram';
    case 'clipboard':
      return 'Clipboard';
    case 'web-share-api':
      return 'Web Share';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sharing');

  // Fetch share method analytics
  const { data: shareMethodData, isLoading: isLoadingMethods, error: methodsError } = useQuery<ShareMethodAnalytics[]>({
    queryKey: ['/api/analytics/by-method'],
    staleTime: 60000, // 1 minute
  });

  // Fetch view count analytics
  const { data: viewsData, isLoading: isLoadingViews, error: viewsError } = useQuery<ShareViewAnalytics[]>({
    queryKey: ['/api/analytics/views'],
    staleTime: 60000, // 1 minute
  });

  // Format data for the pie chart
  const getPieData = () => {
    if (!shareMethodData || shareMethodData.length === 0) return [];
    
    return shareMethodData.map(item => ({
      name: formatMethodName(item.method),
      value: item.count
    }));
  };

  // Format data for the bar chart
  const getBarData = () => {
    if (!viewsData || viewsData.length === 0) return [];
    
    return viewsData.slice(0, 10).map(item => ({
      invoiceId: `Inv-${item.invoiceId}`,
      views: item.views
    }));
  };

  // Loading state
  if (isLoadingMethods || isLoadingViews) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (methodsError || viewsError) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl mt-8">
        <AlertDescription>
          Error loading analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  const isEmpty = (!shareMethodData || shareMethodData.length === 0) && 
                 (!viewsData || viewsData.length === 0);

  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Share Analytics</CardTitle>
            <CardDescription>Track how your invoices are shared and viewed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No sharing activity yet</h3>
              <p className="text-muted-foreground mb-6">
                Share some invoices to start collecting analytics data
              </p>
              <Button asChild>
                <Link to="/">Create or Share Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track how your invoices are being shared and viewed</p>
      </div>

      <Tabs defaultValue="sharing" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="sharing">Share Methods</TabsTrigger>
          <TabsTrigger value="views">View Counts</TabsTrigger>
        </TabsList>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Methods Distribution</CardTitle>
              <CardDescription>How your invoices are being shared across different platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {shareMethodData && shareMethodData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill={DEFAULT_COLOR}
                        dataKey="value"
                      >
                        {getPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} shares`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No share method data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share Methods Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of sharing methods</CardDescription>
            </CardHeader>
            <CardContent>
              {shareMethodData && shareMethodData.length > 0 ? (
                <div className="grid gap-4">
                  {shareMethodData.map((item, index) => (
                    <div key={item.method} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium">{formatMethodName(item.method)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {item.count} {item.count === 1 ? 'share' : 'shares'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No share method data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice View Counts</CardTitle>
              <CardDescription>Most viewed invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {viewsData && viewsData.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getBarData()}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="invoiceId" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} views`, 'Views']} />
                      <Bar dataKey="views" fill={DEFAULT_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No view count data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice View Details</CardTitle>
              <CardDescription>Detailed view counts per invoice</CardDescription>
            </CardHeader>
            <CardContent>
              {viewsData && viewsData.length > 0 ? (
                <div className="grid gap-4">
                  {viewsData.map((item) => (
                    <div key={item.invoiceId} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center">
                        <span className="font-medium">Invoice #{item.invoiceId}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-4">
                          {item.views} {item.views === 1 ? 'view' : 'views'}
                        </span>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/invoices/${item.invoiceId}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No view count data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;