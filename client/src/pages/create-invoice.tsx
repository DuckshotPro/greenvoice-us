import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  
  // Memoized calculations for better performance
  const calculations = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  }, [invoice.items, invoice.taxRate]);
  
  // Validation for invoice completeness
  const isInvoiceValid = useMemo(() => {
    return (
      invoice.clientName.trim() !== '' &&
      invoice.clientEmail.trim() !== '' &&
      invoice.senderName.trim() !== '' &&
      invoice.items.length > 0 &&
      invoice.items.every(item => 
        item.description.trim() !== '' && 
        item.quantity > 0 && 
        item.rate > 0
      )
    );
  }, [invoice]);
  
  // Auto-save draft to localStorage
  useEffect(() => {
    const saveDraft = () => {
      try {
        const draftKey = `invoice-draft-${Date.now()}`;
        localStorage.setItem(draftKey, JSON.stringify(invoice));
        
        // Keep only the latest 5 drafts
        const drafts = Object.keys(localStorage)
          .filter(key => key.startsWith('invoice-draft-'))
          .sort()
          .reverse();
          
        if (drafts.length > 5) {
          drafts.slice(5).forEach(key => localStorage.removeItem(key));
        }
      } catch (error) {
        console.warn('Failed to save draft to localStorage:', error);
      }
    };
    
    // Save draft after 3 seconds of inactivity
    const timeoutId = setTimeout(saveDraft, 3000);
    return () => clearTimeout(timeoutId);
  }, [invoice]);
  
  // Update invoice when calculations change
  useEffect(() => {
    setInvoice(prev => ({
      ...prev,
      ...calculations
    }));
  }, [calculations]);
  
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
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create invoice. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Invalid invoice data. Please check all fields.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error Creating Invoice',
        description: errorMessage,
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
  
  // Memoized handlers for better performance
  const handleSave = useCallback(() => {
    if (!isInvoiceValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before saving.",
        variant: "destructive"
      });
      return;
    }
    
    createInvoiceMutation.mutate(invoice);
  }, [createInvoiceMutation, invoice, isInvoiceValid, toast]);
  
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  
  // Memoized shareable link
  const shareableLink = useMemo(() => {
    if (invoice.id && invoice.shareableLink) {
      return `${baseUrl}/share/${invoice.shareableLink}`;
    }
    return `${baseUrl}/share/preview`;
  }, [baseUrl, invoice.id, invoice.shareableLink]);
  
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow" role="main">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Invoice Form */}
          <div className="lg:col-span-1">
            <section aria-label="Invoice Form">
              <InvoiceForm 
                onFormChange={handleFormChange}
              />
            </section>
          </div>
          
          {/* Invoice Preview and Sharing */}
          <div className="mt-5 lg:mt-0 lg:col-span-2">
            <div className="space-y-6">
              {/* Invoice Preview */}
              <section aria-label="Invoice Preview">
                <InvoicePreview 
                  ref={invoicePreviewRef}
                  invoice={invoice}
                  onPrint={handlePrint}
                  onSave={handleSave}
                />
              </section>
              
              {/* Sharing Options */}
              <section aria-label="Sharing Options">
                <ShareOptions 
                  invoice={{
                    ...invoice,
                    id: invoice.id || 0,
                    notes: invoice.notes || null,
                    discountType: invoice.discountType || null,
                    discountValue: invoice.discountValue || null,
                    discountTotal: invoice.discountTotal || null,
                  couponCode: invoice.couponCode || null,
                  shareableLink: shareableLink || null,
                  status: invoice.status || 'draft',
                  scheduledSendDate: null,
                  sentAt: null,
                  recurringTemplateId: null,
                  paidAt: null,
                  paymentMethod: null,
                  createdAt: null
                }}
                isLoading={createInvoiceMutation.isPending}
              />
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateInvoice;
