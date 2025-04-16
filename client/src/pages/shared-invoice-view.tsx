import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Invoice, LineItem } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ShareViewTracker from "@/components/analytics/share-view-tracker";
import { Loader2, Printer, ChevronLeft, Download } from "lucide-react";
import generatePdf from "@/lib/pdf-generator";
import { formatCurrency } from "@/lib/utils";

interface ExtendedLineItem extends LineItem {
  details?: string;
}

interface InvoiceWithItems extends Invoice {
  items: ExtendedLineItem[];
  discount?: number;
  status: string; // Ensure status is required, not optional
}

/**
 * SharedInvoiceView - A public view of an invoice via a shareable link
 * Shows a read-only view of an invoice with share analytics tracking
 */
const SharedInvoiceView = () => {
  const params = useParams<{ shareableLink: string }>();
  const [, setLocation] = useLocation();
  const [shareMethod, setShareMethod] = useState<string>("link");
  
  // Extract UTM parameters from URL for improved analytics
  useEffect(() => {
    // Determine share method based on UTM source if available
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    
    if (utmSource) {
      switch (utmSource) {
        case "email":
          setShareMethod("email");
          break;
        case "whatsapp":
          setShareMethod("whatsapp");
          break;
        case "twitter":
        case "x":
          setShareMethod("twitter");
          break;
        case "facebook":
          setShareMethod("facebook");
          break;
        case "linkedin":
          setShareMethod("linkedin");
          break;
        case "sms":
          setShareMethod("sms");
          break;
        default:
          setShareMethod(utmSource);
      }
    }
  }, []);

  // Fetch the invoice by shareable link
  const { data: invoice, isLoading, error } = useQuery<InvoiceWithItems>({
    queryKey: [`/api/share/${params.shareableLink}`],
    retry: 1,
  });

  // Handle invoice download
  const handleDownload = () => {
    if (invoice) {
      generatePdf(invoice);
    }
  };

  // Handle print invoice
  const handlePrint = () => {
    window.print();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  // Show error state
  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              The invoice you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Add the invisible tracking component */}
      <ShareViewTracker 
        invoiceId={invoice.id} 
        shareMethod={shareMethod} 
      />
      
      <Card className="w-full bg-white shadow-lg border-0 print:shadow-none">
        <CardHeader className="border-b pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                Invoice #{invoice.invoiceNumber}
              </CardTitle>
              <CardDescription className="mt-1">
                {invoice.status === "paid" ? (
                  <span className="text-green-600 font-semibold">Paid</span>
                ) : invoice.status === "overdue" ? (
                  <span className="text-red-600 font-semibold">Overdue</span>
                ) : (
                  <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                )}
              </CardDescription>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-sm">Issue Date: {invoice.issueDate}</p>
              <p className="text-sm font-semibold">Due Date: {invoice.dueDate}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold mb-2 text-sm">From:</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{invoice.senderName}</p>
                <p className="whitespace-pre-line">{invoice.senderAddress}</p>
                <p>{invoice.senderEmail}</p>
                {invoice.senderPhone && <p>{invoice.senderPhone}</p>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">To:</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{invoice.clientName}</p>
                <p className="whitespace-pre-line">{invoice.clientAddress}</p>
                <p>{invoice.clientEmail}</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items && invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.details && (
                        <p className="text-sm text-muted-foreground">{item.details}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.rate, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.amount, invoice.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-1/2 space-y-2">
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({invoice.taxRate}%):</span>
                <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-b py-2">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm">Notes:</h3>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between print:hidden">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SharedInvoiceView;