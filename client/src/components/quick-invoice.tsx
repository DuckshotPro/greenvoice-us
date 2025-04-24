import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Play,
  Send,
  X,
} from "lucide-react";

// Form schema
const quickInvoiceSchema = z.object({
  clientEmail: z.string().email({ message: "Please enter a valid email address" }),
  itemName: z.string().min(1, { message: "Item name is required" }),
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  currency: z.string().default("USD"),
});

type QuickInvoiceFormValues = z.infer<typeof quickInvoiceSchema>;

const QuickInvoice = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useNavigate();
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  
  const isPremiumUser = user?.subscriptionPlan === "premium" || user?.subscriptionPlan === "enterprise";

  const form = useForm<QuickInvoiceFormValues>({
    resolver: zodResolver(quickInvoiceSchema),
    defaultValues: {
      clientEmail: "",
      itemName: "",
      amount: 0,
      currency: "USD",
    },
  });

  const onSubmit = (data: QuickInvoiceFormValues) => {
    if (user && isPremiumUser) {
      // Premium user - send directly
      handleSendInvoice(data);
    } else {
      // Non-premium user - show ad dialog
      setAdDialogOpen(true);
    }
  };

  const handleSendInvoice = async (data: QuickInvoiceFormValues) => {
    setSendingInvoice(true);
    try {
      // Create a simplified invoice object
      const invoiceData = {
        clientEmail: data.clientEmail,
        items: [
          {
            description: data.itemName,
            quantity: 1,
            rate: data.amount,
            amount: data.amount,
          },
        ],
        currency: data.currency,
        total: data.amount,
        status: "sent",
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
      };

      // Send the invoice (if user is logged in, it will be saved, otherwise anonymous)
      await apiRequest("POST", "/api/invoices/quick", invoiceData);
      
      // Show success message
      setInvoiceSent(true);
      
      toast({
        title: "Invoice Sent!",
        description: `Your invoice for ${data.currency} ${data.amount} has been sent to ${data.clientEmail}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to send invoice",
        description: "There was an error sending your invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingInvoice(false);
    }
  };

  const startAdPlayback = () => {
    setAdProgress(0);
    const totalTime = 5; // 5 seconds ad
    const interval = 100; // update progress every 100ms
    const steps = (totalTime * 1000) / interval;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep += 1;
      setAdProgress(Math.min((currentStep / steps) * 100, 100));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAdWatched(true);
      }
    }, interval);
  };

  const resetAdDialog = () => {
    setAdDialogOpen(false);
    setAdWatched(false);
    setAdProgress(0);
    setInvoiceSent(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-center gradient-text">
          Quick Invoice Generator
        </CardTitle>
        <CardDescription className="text-center">
          Create and send a simple invoice in seconds
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client's Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="client@example.com" 
                      type="email"
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Product or service" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-9"
                          {...field}
                          onChange={(e) => {
                            // Parse as a number with 2 decimal places
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          onFocus={(e) => {
                            // Select all text when focusing if value is 0
                            if (parseFloat(e.target.value) === 0) {
                              e.target.select();
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Currency</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80">
              <Send className="h-4 w-4 mr-2" /> Send Invoice
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4 text-sm text-muted-foreground">
        <span>{user ? "Invoice will be saved to your account" : "Create an account to track invoices"}</span>
        <Button variant="link" onClick={() => navigate("/create-invoice")}>
          Advanced Options <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>

      {/* Ad Dialog */}
      <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {invoiceSent 
                ? "Invoice Sent Successfully!" 
                : adWatched 
                  ? "Ready to Send" 
                  : "Watch an Ad to Continue"}
            </DialogTitle>
            <DialogDescription>
              {invoiceSent 
                ? "Your invoice has been sent to the recipient's email." 
                : adWatched
                  ? "Thank you for watching. Your invoice is ready to be sent."
                  : "Free users need to watch a short ad before sending invoices."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {invoiceSent ? (
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Thank you for using GreenVoice!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to premium to skip ads and access advanced features.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={resetAdDialog}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      resetAdDialog();
                      navigate("/premium-page");
                    }}
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            ) : adWatched ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium mb-4">Ad watched successfully!</p>
                <Button 
                  onClick={() => handleSendInvoice(form.getValues())}
                  disabled={sendingInvoice}
                  className="w-full"
                >
                  {sendingInvoice ? "Sending..." : "Send Invoice Now"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md aspect-video flex items-center justify-center">
                  {adProgress > 0 ? (
                    <div className="text-center">
                      <p className="mb-2">Ad playing...</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${adProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-2 text-muted-foreground">
                        Please wait {Math.ceil(5 * (1 - adProgress / 100))} seconds
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="gap-2 rounded-full h-16 w-16 flex items-center justify-center p-0"
                        onClick={startAdPlayback}
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                      <p className="mt-2 text-sm">Click to watch ad (5 seconds)</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetAdDialog}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      resetAdDialog();
                      navigate("/premium-page");
                    }}
                  >
                    Skip ads with Premium
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuickInvoice;