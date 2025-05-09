import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, FileText, CheckCircle, Clock, Pencil, AlertCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';

// Type definitions for progress contracts and milestones
interface Milestone {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  orderIndex: number;
  status: 'pending' | 'current' | 'completed' | 'invoiced' | 'paid';
  startedAt: string | null;
  completedAt: string | null;
  invoicedAt: string | null;
  invoiceId: number | null;
}

interface Contract {
  id: number;
  name: string;
  contractNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  totalValue: number;
  invoicedValue: number;
  remainingValue: number;
  currency: string;
  taxRate: number | null;
  status: string;
  attachmentUrls: string[] | null;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
}

interface ContractsResponse {
  data: Contract[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Helper functions for milestone status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-gray-500';
    case 'current': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'invoiced': return 'bg-purple-500';
    case 'paid': return 'bg-emerald-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Main component
export default function ProgressBillingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState('active');

  // Fetch contracts
  const { data: contractsData, isLoading, error } = useQuery<ContractsResponse>({
    queryKey: ['/api/progress-billing', page, limit],
    keepPreviousData: true,
  });

  // Update milestone status mutation
  const updateMilestoneStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/progress-billing/milestone/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress-billing'] });
      toast({
        title: "Status updated",
        description: "Milestone status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (milestoneId: number) => {
      const res = await apiRequest('POST', `/api/progress-billing/milestone/${milestoneId}/invoice`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress-billing'] });
      toast({
        title: "Invoice generated",
        description: `Invoice #${data.invoiceNumber} has been generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating invoice",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredContracts = contractsData?.data.filter(contract => {
    if (activeTab === 'active') return contract.status !== 'completed' && contract.status !== 'cancelled';
    if (activeTab === 'completed') return contract.status === 'completed';
    return true; // all contracts
  }) || [];

  // Handler for updating milestone status
  const handleUpdateStatus = (milestoneId: number, newStatus: string) => {
    updateMilestoneStatusMutation.mutate({ id: milestoneId, status: newStatus });
  };

  // Handler for generating invoice
  const handleGenerateInvoice = (milestoneId: number) => {
    generateInvoiceMutation.mutate(milestoneId);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Contracts</h2>
        <p className="text-muted-foreground mb-4">
          {(error as Error).message || "Something went wrong. Please try again."}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/progress-billing'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  const progressWidth = (value: number, total: number) => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Progress Billing</h1>
          <p className="text-muted-foreground">Manage your progress-based contracts and milestones</p>
        </div>
        <Button onClick={() => navigate('/progress-billing/new')} className="bg-gradient-to-r from-primary to-primary/80">
          <Plus className="mr-2 h-4 w-4" /> New Contract
        </Button>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No active contracts found.</p>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => navigate('/progress-billing/new')}
                >
                  Create Your First Contract
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map(contract => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onUpdateStatus={handleUpdateStatus}
                onGenerateInvoice={handleGenerateInvoice}
                isUpdating={updateMilestoneStatusMutation.isPending}
                isGenerating={generateInvoiceMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No completed contracts found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map(contract => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onUpdateStatus={handleUpdateStatus}
                onGenerateInvoice={handleGenerateInvoice}
                isUpdating={updateMilestoneStatusMutation.isPending}
                isGenerating={generateInvoiceMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No contracts found.</p>
                <Button 
                  className="mt-4" 
                  variant="outline" 
                  onClick={() => navigate('/progress-billing/new')}
                >
                  Create Your First Contract
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map(contract => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onUpdateStatus={handleUpdateStatus}
                onGenerateInvoice={handleGenerateInvoice}
                isUpdating={updateMilestoneStatusMutation.isPending}
                isGenerating={generateInvoiceMutation.isPending}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {contractsData && contractsData.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {contractsData.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(contractsData.pagination.totalPages, p + 1))}
            disabled={page === contractsData.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// Contract Card Component
function ContractCard({ 
  contract, 
  onUpdateStatus, 
  onGenerateInvoice, 
  isUpdating, 
  isGenerating 
}: { 
  contract: Contract, 
  onUpdateStatus: (id: number, status: string) => void,
  onGenerateInvoice: (id: number) => void,
  isUpdating: boolean,
  isGenerating: boolean
}) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState(false);
  
  const totalValue = contract.totalValue;
  const invoicedValue = contract.invoicedValue || 0;
  const invoicedPercent = progressWidth(invoicedValue, totalValue);
  
  return (
    <Card className="overflow-hidden transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              {contract.name}
              <Badge className="ml-2 text-xs" variant="outline">
                {contract.contractNumber}
              </Badge>
            </CardTitle>
            <CardDescription>{contract.clientName}</CardDescription>
          </div>
          <div className="text-right">
            <div className="font-semibold">{contract.currency} {totalValue.toLocaleString()}</div>
            <CardDescription>
              Started {format(new Date(contract.startDate), 'MMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{invoicedPercent.toFixed(0)}% invoiced</span>
          </div>
          <Progress value={invoicedPercent} className="h-2" />
        </div>

        {expanded && (
          <div className="mt-4 space-y-4">
            <Separator />
            <h3 className="font-semibold">Milestones</h3>
            <div className="space-y-3">
              {contract.milestones.map((milestone) => (
                <div key={milestone.id} className="p-3 bg-secondary/30 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{milestone.name}</div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(milestone.status)} text-white`}>
                      {getStatusText(milestone.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm font-medium">
                      {contract.currency} {milestone.amount.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      {milestone.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onUpdateStatus(milestone.id, 'current')}
                          disabled={isUpdating}
                        >
                          <Clock className="h-4 w-4 mr-1" /> Start
                        </Button>
                      )}
                      
                      {milestone.status === 'current' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onUpdateStatus(milestone.id, 'completed')}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      )}
                      
                      {milestone.status === 'completed' && !milestone.invoiceId && (
                        <Button 
                          size="sm"
                          onClick={() => onGenerateInvoice(milestone.id)}
                          disabled={isGenerating}
                          className="bg-gradient-to-r from-purple-500 to-purple-700 text-white"
                        >
                          <FileText className="h-4 w-4 mr-1" /> Generate Invoice
                        </Button>
                      )}
                      
                      {milestone.invoiceId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/invoices/${milestone.invoiceId}`)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" /> View Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'Show Milestones'}
        </Button>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/progress-billing/${contract.id}`)}
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}