import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, BarChart4, PieChart } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPC, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Card3D } from "@/components/ui/animated-background";

// Share analytics data types
interface ShareMethodData {
  method: string;
  count: number;
}

interface ShareViewData {
  invoiceId: number;
  views: number;
  date?: Date;
}

const SHARE_METHOD_COLORS = {
  email: "#8884d8",
  link: "#82ca9d",
  whatsapp: "#25D366",
  twitter: "#1DA1F2",
  facebook: "#4267B2",
  linkedin: "#0077B5",
  sms: "#FFB900",
  default: "#ffc658"
};

const SHARE_METHOD_LABELS = {
  email: "Email",
  link: "Direct Link",
  whatsapp: "WhatsApp",
  twitter: "Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  sms: "SMS",
  default: "Other"
};

/**
 * ShareAnalyticsDashboard - Displays analytics data for invoice sharing
 * Shows share methods, view counts, and trends
 */
export function ShareAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("method");
  
  // Calculate date range for filtering
  const getDateParams = () => {
    const now = new Date();
    let startDate = undefined;
    
    if (dateRange === "today") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (dateRange === "7days") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === "30days") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else if (dateRange === "90days") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
    }
    
    return {
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: undefined,
      groupBy
    };
  };
  
  // Fetch share method analytics
  const { data: shareMethodData, isLoading: isLoadingMethods } = useQuery<ShareMethodData[]>({
    queryKey: ["/api/analytics/share-methods", dateRange, groupBy],
    queryFn: async () => {
      const params = new URLSearchParams(getDateParams() as any);
      const response = await fetch(`/api/analytics/share-methods?${params}`);
      if (!response.ok) throw new Error("Failed to fetch share method analytics");
      return response.json();
    }
  });
  
  // Fetch share view analytics
  const { data: shareViewData, isLoading: isLoadingViews } = useQuery<ShareViewData[]>({
    queryKey: ["/api/analytics/share-views", dateRange, groupBy],
    queryFn: async () => {
      const params = new URLSearchParams(getDateParams() as any);
      const response = await fetch(`/api/analytics/share-views?${params}`);
      if (!response.ok) throw new Error("Failed to fetch share view analytics");
      return response.json();
    }
  });
  
  // Format data for charts
  const formatShareMethodData = (data?: ShareMethodData[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      name: SHARE_METHOD_LABELS[item.method as keyof typeof SHARE_METHOD_LABELS] || item.method,
      value: item.count,
      color: SHARE_METHOD_COLORS[item.method as keyof typeof SHARE_METHOD_COLORS] || SHARE_METHOD_COLORS.default
    }));
  };
  
  const formatShareViewData = (data?: ShareViewData[]) => {
    if (!data || data.length === 0) return [];
    
    // Sort by view count descending
    return [...data]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10) // Top 10
      .map(item => ({
        invoiceId: `#${item.invoiceId}`,
        views: item.views
      }));
  };
  
  const isLoading = isLoadingMethods || isLoadingViews;
  const formattedMethodData = formatShareMethodData(shareMethodData);
  const formattedViewData = formatShareViewData(shareViewData);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart4 className="mr-2 h-5 w-5" />
          Share Analytics
        </CardTitle>
        <CardDescription>
          Track how your invoices are being shared and viewed
        </CardDescription>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select 
              value={dateRange} 
              onValueChange={setDateRange}
            >
              <SelectTrigger id="dateRange" className="w-[180px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupBy">Group By</Label>
            <Select 
              value={groupBy} 
              onValueChange={setGroupBy}
            >
              <SelectTrigger id="groupBy" className="w-[180px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="method">Method</SelectItem>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shares">Shares</TabsTrigger>
              <TabsTrigger value="views">Views</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card3D
                  accentColor="#8884d8"
                  backgroundColor="bg-white dark:bg-gray-800"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Share Methods</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">How invoices are being shared</p>
                    
                    {formattedMethodData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground">No share data available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          When you share invoices, the data will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart className="h-64 w-64 mx-auto">
                            <Legend />
                            <Pie
                              data={formattedMethodData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={90}
                              fill="#8884d8"
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {formattedMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} shares`, "Count"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </Card3D>
                
                <Card3D
                  accentColor="#82ca9d"
                  backgroundColor="bg-white dark:bg-gray-800"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Top Invoices by Views</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Most viewed invoices</p>
                    
                    {formattedViewData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground">No view data available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          When your invoices are viewed, the data will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            width={500}
                            height={300}
                            data={formattedViewData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="invoiceId" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="views" name="Views" fill="#82ca9d" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </Card3D>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card3D
                  accentColor="#009888"
                  backgroundColor="bg-white dark:bg-gray-800"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-1">Analytics Summary</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Key metrics for your invoices</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Shares</p>
                        <p className="text-2xl font-bold text-primary">
                          {formattedMethodData.reduce((acc, curr) => acc + curr.value, 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Views</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {formattedViewData.reduce((acc, curr) => acc + curr.views, 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Share Methods</p>
                        <p className="text-2xl font-bold text-purple-500">{formattedMethodData.length}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/10 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Viewed Invoices</p>
                        <p className="text-2xl font-bold text-amber-500">{formattedViewData.length}</p>
                      </div>
                    </div>
                  </div>
                </Card3D>
              </div>
            </TabsContent>
            
            <TabsContent value="shares">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Methods Detailed</CardTitle>
                  <CardDescription>Breakdown of share methods by count</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedMethodData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground">No share data available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        When you share invoices, the data will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          width={500}
                          height={300}
                          data={formattedMethodData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip formatter={(value: any) => [`${value} shares`, "Count"]} />
                          <Bar dataKey="value" name="Shares" fill="#8884d8">
                            {formattedMethodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="views">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Views Detail</CardTitle>
                  <CardDescription>View metrics for shared invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedViewData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-muted-foreground">No view data available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        When your invoices are viewed, the data will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          width={500}
                          height={300}
                          data={formattedViewData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="invoiceId" width={80} />
                          <Tooltip formatter={(value: any) => [`${value} views`, "Count"]} />
                          <Bar dataKey="views" name="Views" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>
          Analytics data is updated in real-time as invoices are shared and viewed.
        </p>
      </CardFooter>
    </Card>
  );
}

export default ShareAnalyticsDashboard;