import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import InvoiceForm from '@/components/ui/invoice-form';
import InvoicePreview from '@/components/ui/invoice-preview';
import ShareOptions from '@/components/ui/share-options';
import { downloadPDF } from '@/lib/pdf-generator';
import { generatePDF } from '@/lib/pdf-generator';
import { downloadImage } from '@/lib/image-generator';
import { type Invoice } from '@/types/invoice';

const CreateInvoice = () => {
  // Get base URL for shareable links
  const baseUrl = window.location.origin;
  
  // Set up hooks
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const invoicePreviewRef = useRef<HTMLDivElement>(null);
  
  // Invoice state
  const [invoice, setInvoice] = useState<Invoice>({
    userId: 1, // Default user ID
    invoiceNumber: 'INV-001',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    
    // Sender details
    senderName: 'Your Business Name',
    senderEmail: 'your@email.com',
    senderAddress: '123 Business Street\nSan Francisco, CA 94103\nUnited States',
    senderPhone: '(555) 123-4567',
    
    // Client details
    clientName: 'Acme Corporation',
    clientEmail: 'billing@acmecorp.com',
    clientAddress: '456 Client Avenue\nNew York, NY 10001\nUnited States',
    
    // Financial details
    subtotal: 0,
    taxRate: 8,
    taxAmount: 0,
    total: 0,
    
    // Additional info
    notes: 'Thank you for your business. Payment is due within 30 days.',
    
    // Line items
    items: [
      {
        description: 'Website Design',
        quantity: 1,
        rate: 1500,
        amount: 1500
      },
      {
        description: 'Logo Design',
        quantity: 1,
        rate: 500,
        amount: 500
      },
      {
        description: 'Content Writing (5 pages)',
        quantity: 5,
        rate: 100,
        amount: 500
      }
    ],
  });
  
  // Calculate totals on initial load
  useEffect(() => {
    // Calculate subtotal
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate tax
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    
    // Calculate total
    const total = subtotal + taxAmount;
    
    // Update invoice
    setInvoice(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }));
  }, []);
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: Invoice) => {
      const response = await apiRequest('POST', '/api/invoices', invoiceData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      // Update invoice with server-generated data
      setInvoice(prev => ({
        ...prev,
        id: data.id,
        shareableLink: data.shareableLink
      }));
      
      toast({
        title: 'Invoice Created',
        description: 'Your invoice has been created successfully.',
      });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  });
  
  // Handle form changes
  const handleFormChange = (formData: any) => {
    setInvoice(prev => ({
      ...prev,
      ...formData
    }));
  };
  
  // Handle save action
  const handleSave = () => {
    createInvoiceMutation.mutate(invoice);
  };
  
  // Handle print action
  const handlePrint = () => {
    window.print();
  };
  
  // Get shareable link for the invoice
  const shareableLink = invoice.id && invoice.shareableLink
    ? `${baseUrl}/share/${invoice.shareableLink}`
    : `${baseUrl}/share/preview`;
  
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Invoice Form */}
          <div className="lg:col-span-1">
            <InvoiceForm 
              onFormChange={handleFormChange}
            />
          </div>
          
          {/* Invoice Preview and Sharing */}
          <div className="mt-5 lg:mt-0 lg:col-span-2">
            <div className="space-y-6">
              {/* Invoice Preview */}
              <InvoicePreview 
                ref={invoicePreviewRef}
                invoice={invoice}
                onPrint={handlePrint}
                onSave={handleSave}
              />
              
              {/* Sharing Options */}
              <ShareOptions 
                invoice={invoice}
                invoicePreviewRef={invoicePreviewRef}
                shareUrl={shareableLink}
                onSaveInvoice={async (invoiceToSave) => {
                  try {
                    const result = await createInvoiceMutation.mutateAsync(invoiceToSave);
                    return {
                      ...invoiceToSave,
                      id: result.id,
                      shareableLink: result.shareableLink
                    };
                  } catch (error) {
                    console.error('Failed to save invoice:', error);
                    return undefined;
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateInvoice;
