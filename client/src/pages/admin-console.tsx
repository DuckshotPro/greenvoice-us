import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Server, 
  Users 
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, Redirect } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Function to format dates in a readable way
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  }).format(date);
};

const AdminConsole = () => {
  const { user } = useAuth();
  const [processingState, setProcessingState] = useState<{
    isProcessing: boolean;
    message: string;
  }>({
    isProcessing: false,
    message: ""
  });

  // Redirect if user is not admin
  if (!user) {
    return <Redirect to="/" />;
  }
  
  // We'll check admin status through isAdmin function since we don't have a role field
  const isAdmin = user.subscriptionPlan === "enterprise" || user.email?.includes("admin");
  
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  // Get health status for the database
  const { data: dbHealthResponse, isLoading: loadingDbHealth, refetch: refetchDbHealth, error: dbHealthError } = useQuery({
    queryKey: ['/api/admin/db-health'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/db-health");
      return await res.json();
    },
    retry: 1
  });
  
  // Extract the actual db health from the response
  const dbHealth = dbHealthResponse?.dbHealth;

  // Get system information
  const { data: systemInfo, isLoading: loadingSystemInfo, refetch: refetchSystemInfo, error: systemInfoError } = useQuery({
    queryKey: ['/api/admin/system'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/system");
      return await res.json();
    },
    retry: 1
  });

  // Get logs information
  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs, error: logsError } = useQuery({
    queryKey: ['/api/admin/logs'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/logs");
      return await res.json();
    },
    retry: 1
  });

  // Process scheduled invoices and recurring templates
  const handleProcessAll = async () => {
    setProcessingState({
      isProcessing: true,
      message: "Processing scheduled invoices and recurring templates..."
    });

    try {
      const res = await apiRequest("POST", "/api/process/all");
      const data = await res.json();
      
      setProcessingState({
        isProcessing: false,
        message: `Processing complete. Processed ${data.scheduledResults.success + data.recurringResults.success} items successfully.`
      });
      
      // Refresh logs after processing
      refetchLogs();
    } catch (error) {
      setProcessingState({
        isProcessing: false,
        message: "Error processing items. Please check logs."
      });
    }
  };

  const refreshAll = () => {
    refetchDbHealth();
    refetchSystemInfo();
    refetchLogs();
  };

  useEffect(() => {
    // Auto-clear processing message after 5 seconds
    let timer: number;
    if (!processingState.isProcessing && processingState.message) {
      timer = window.setTimeout(() => {
        setProcessingState(prev => ({ ...prev, message: "" }));
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [processingState]);

  return (
    <div className="container py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground">
            Monitor and manage your invoice application
          </p>
        </div>
        <Button onClick={refreshAll} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </motion.div>

      {processingState.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-md bg-primary/10 text-primary flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {processingState.isProcessing ? (
              <Clock className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{processingState.message}</span>
          </div>
          {!processingState.isProcessing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setProcessingState(prev => ({ ...prev, message: "" }))}
            >
              Dismiss
            </Button>
          )}
        </motion.div>
      )}

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Database Health Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
                <CardDescription>
                  Database connection and table counts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDbHealth ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : dbHealth ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection</span>
                      <Badge variant={dbHealth.status === "healthy" ? "default" : "destructive"}>
                        {dbHealth.status === "healthy" ? "Connected" : "Error"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Users</span>
                        <span className="font-medium">{dbHealth.users || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Invoices</span>
                        <span className="font-medium">{dbHealth.invoices || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Response Time</span>
                        <span className="font-medium">{dbHealth.responseTimeMs || 0} ms</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to fetch database status</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Current system metrics and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSystemInfo ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : systemInfo ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Node Version</span>
                        <span className="font-medium">{systemInfo.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span className="font-medium">
                          {Math.round(systemInfo.memoryUsage.usedMB)} / {Math.round(systemInfo.memoryUsage.totalMB)} MB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>CPU Load</span>
                        <span className="font-medium">
                          {systemInfo.cpuLoad.map((load: number) => Math.round(load * 100) / 100).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">
                          {Math.floor(systemInfo.uptime / 86400)}d {Math.floor((systemInfo.uptime % 86400) / 3600)}h
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to fetch system information</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Statistics
                </CardTitle>
                <CardDescription>
                  User account metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDbHealth ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : dbHealth ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Users</span>
                        <span className="font-medium">{dbHealth.counts.users}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Premium Users</span>
                        <span className="font-medium">{dbHealth.counts.premiumUsers || "N/A"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Active Today</span>
                        <span className="font-medium">{dbHealth.counts.activeToday || "N/A"}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <Button 
                        className="w-full"
                        size="sm"
                        onClick={handleProcessAll}
                        disabled={processingState.isProcessing}
                      >
                        {processingState.isProcessing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process Scheduled Tasks"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to fetch user statistics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Details</CardTitle>
              <CardDescription>
                Detailed information about the server environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSystemInfo ? (
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              ) : systemInfo ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Environment</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Node Version</div>
                      <div>{systemInfo.nodeVersion}</div>
                      
                      <div className="font-medium">Environment</div>
                      <div>{systemInfo.environment}</div>
                      
                      <div className="font-medium">Platform</div>
                      <div>{systemInfo.platform}</div>
                      
                      <div className="font-medium">Architecture</div>
                      <div>{systemInfo.arch}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Memory</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Total Memory</div>
                      <div>{Math.round(systemInfo.memoryUsage.totalMB)} MB</div>
                      
                      <div className="font-medium">Free Memory</div>
                      <div>{Math.round(systemInfo.memoryUsage.freeMB)} MB</div>
                      
                      <div className="font-medium">Used Memory</div>
                      <div>{Math.round(systemInfo.memoryUsage.usedMB)} MB</div>
                      
                      <div className="font-medium">Memory Usage</div>
                      <div>{Math.round(systemInfo.memoryUsage.usedPercent * 100)}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Server</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Uptime</div>
                      <div>
                        {Math.floor(systemInfo.uptime / 86400)}d {Math.floor((systemInfo.uptime % 86400) / 3600)}h {Math.floor((systemInfo.uptime % 3600) / 60)}m
                      </div>
                      
                      <div className="font-medium">CPU Cores</div>
                      <div>{systemInfo.cpuCount}</div>
                      
                      <div className="font-medium">CPU Load (1m, 5m, 15m)</div>
                      <div>{systemInfo.cpuLoad.map((load: number) => Math.round(load * 100) / 100).join(', ')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p>Could not retrieve system information</p>
                  <Button 
                    onClick={() => refetchSystemInfo()} 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Application Logs</CardTitle>
                <CardDescription>
                  Recent system logs and events
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchLogs()}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="animate-pulse space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              ) : logs && logs.entries ? (
                <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-xs">
                  {logs.entries.map((entry: any, index: number) => (
                    <div 
                      key={index}
                      className={`p-2 rounded ${
                        entry.level === 'ERROR' 
                          ? 'bg-red-50 text-red-800' 
                          : entry.level === 'WARN' 
                          ? 'bg-yellow-50 text-yellow-800' 
                          : entry.level === 'INFO' 
                          ? 'bg-blue-50 text-blue-800' 
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="inline-block w-24 flex-shrink-0">
                          {entry.timestamp ? formatDate(entry.timestamp) : "Unknown"}
                        </span>
                        <Badge 
                          variant={
                            entry.level === 'ERROR' 
                              ? 'destructive' 
                              : entry.level === 'WARN' 
                              ? 'secondary' 
                              : entry.level === 'INFO' 
                              ? 'default' 
                              : 'outline'
                          }
                          className="mr-2"
                        >
                          {entry.level}
                        </Badge>
                        <span className="flex-grow">{entry.message}</span>
                      </div>
                      {entry.details && (
                        <div className="mt-1 pl-24 text-gray-600">
                          {typeof entry.details === 'object' 
                            ? JSON.stringify(entry.details) 
                            : entry.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p>No logs available or failed to load logs</p>
                  <Button 
                    onClick={() => refetchLogs()} 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConsole;