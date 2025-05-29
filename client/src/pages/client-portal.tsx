import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Download, 
  Eye, 
  FileText, 
  Calendar, 
  DollarSign,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import ShareViewTracker from "@/components/analytics/share-view-tracker";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString));
};

const ClientPortal = () => {
  const [match, params] = useRoute("/client/:shareableLink");
  const { toast } = useToast();
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const shareableLink = params?.shareableLink;

  // Fetch invoice data using the shareable link
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['/api/share', shareableLink],
    queryFn: async () => {
      if (!shareableLink) throw new Error('No shareable link provided');
      const res = await apiRequest("GET", `/api/share/${shareableLink}`);
      if (!res.ok) {
        throw new Error('Invoice not found');
      }
      return await res.json();
    },
    enabled: !!shareableLink,
    retry: false
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('No invoice data');
      
      // Track payment initiation
      await apiRequest("POST", "/api/analytics/track-share", {
        invoiceId: invoice.id,
        shareMethod: "payment_initiation",
        metadata: {
          action: "payment_started",
          invoice_total: invoice.total,
          payment_method: "stripe",
          timestamp: new Date().toISOString()
        }
      });

      // Create payment intent
      const res = await apiRequest("POST", "/api/create-payment-intent", {
        amount: invoice.total,
        invoiceId: invoice.id,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName
        }
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe or handle payment
      toast({
        title: "Payment Processing",
        description: "Redirecting to secure payment...",
      });
      // In a real implementation, redirect to Stripe
      console.log("Payment intent created:", data);
    },
    onError: (error) => {
      toast({
        title: "Payment Error", 
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Download invoice mutation with tracking
  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('No invoice data');
      
      // Track download event
      await apiRequest("POST", "/api/analytics/track-share", {
        invoiceId: invoice.id,
        shareMethod: "pdf_download_client",
        metadata: {
          action: "invoice_downloaded",
          download_source: "client_portal",
          timestamp: new Date().toISOString()
        }
      });

      // Generate and download PDF
      const res = await apiRequest("GET", `/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "Your invoice PDF is downloading...",
      });
    },
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePayment = () => {
    setPaymentProcessing(true);
    paymentMutation.mutate();
  };

  const handleDownload = () => {
    downloadMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              The invoice you're looking for could not be found or may have expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Include analytics tracking */}
      <ShareViewTracker invoiceId={invoice.id} shareMethod="client_portal" />
      
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Invoice Portal
            </h1>
            <p className="text-muted-foreground">
              View and pay your invoice securely
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Invoice Card */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Invoice #{invoice.invoiceNumber}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        From: {invoice.businessName || 'Business'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        isPaid ? "default" : 
                        isOverdue ? "destructive" : 
                        "outline"
                      }
                      className="text-sm px-3 py-1"
                    >
                      {isPaid ? (
                        <><CheckCircle className="h-4 w-4 mr-1" /> Paid</>
                      ) : isOverdue ? (
                        <><AlertCircle className="h-4 w-4 mr-1" /> Overdue</>
                      ) : (
                        <><Clock className="h-4 w-4 mr-1" /> Pending</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Issue Date</label>
                      <p className="mt-1">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Due Date</label>
                      <p className="mt-1">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Client</label>
                      <p className="mt-1">{invoice.clientName}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">Total Amount</label>
                      <p className="mt-1 text-2xl font-bold text-primary">
                        {formatCurrency(invoice.total)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div>
                    <h3 className="font-semibold mb-4">Invoice Items</h3>
                    <div className="space-y-3">
                      {invoice.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {formatCurrency(item.rate)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(invoice.subtotal || invoice.total)}</span>
                      </div>
                      {invoice.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <p className="text-muted-foreground">{invoice.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Panel */}
            <div className="space-y-6">
              {/* Payment Card */}
              {!isPaid && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment
                    </CardTitle>
                    <CardDescription>
                      Pay securely with Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <p className="text-lg font-semibold">Amount Due</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrency(invoice.total)}
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePayment}
                        disabled={paymentMutation.isPending}
                      >
                        {paymentMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Download Card */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Download
                  </CardTitle>
                  <CardDescription>
                    Get a PDF copy of this invoice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    {downloadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Business Info Card */}
              {(invoice.businessAddress || invoice.businessEmail || invoice.businessPhone) && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Business Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {invoice.businessEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.businessEmail}</span>
                      </div>
                    )}
                    {invoice.businessPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.businessPhone}</span>
                      </div>
                    )}
                    {invoice.businessAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{invoice.businessAddress}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Security Notice */}
              <Card className="glass-card border-muted">
                <CardContent className="pt-6">
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Secure Portal</span>
                    </div>
                    <p>
                      This is a secure client portal. All payments are processed safely through Stripe.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientPortal;