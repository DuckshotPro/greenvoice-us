import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { shareToSocial, sendViaEmail, copyShareableLink, shareViaWebShareAPI } from '@/lib/sharing';
import { downloadPDF } from '@/lib/pdf-generator';
import { downloadImage } from '@/lib/image-generator';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { apiRequest } from '@/lib/queryClient';
import { Invoice } from '@/types/invoice';
import {
  FileText,
  Image as ImageIcon,
  Link,
  Share2,
  Mail,
  Copy,
} from 'lucide-react';
import {
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaWhatsapp,
  FaTelegram,
} from 'react-icons/fa';

interface ShareOptionsProps {
  invoice: Invoice;
  invoicePreviewRef: React.RefObject<HTMLDivElement>;
  shareUrl: string;
  onSaveInvoice?: (invoice: Invoice) => Promise<Invoice | undefined>;
}

const ShareOptions = ({ invoice, invoicePreviewRef, shareUrl, onSaveInvoice }: ShareOptionsProps) => {
  const { toast } = useToast();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipient: invoice.clientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`,
    message: `Please find your invoice attached. The total amount due is ${invoice.total.toFixed(2)} ${invoice.currency}.`,
  });
  
  // Handle export options
  const handleExport = async (format: 'pdf' | 'png' | 'jpeg' | 'link') => {
    try {
      // Track export analytics if applicable
      if (invoice.id) {
        try {
          await apiRequest('POST', '/api/analytics/track-share', {
            invoiceId: invoice.id,
            shareMethod: `export-${format}`,
            metadata: { format }
          });
        } catch (analyticsError) {
          // Don't let analytics errors stop the export
          console.warn('Failed to track export analytics:', analyticsError);
        }
      }
      
      if (format === 'pdf') {
        await downloadPDF(invoice);
        toast({
          title: 'PDF Downloaded',
          description: 'Your invoice has been downloaded as a PDF file.',
        });
      } else if (format === 'png' || format === 'jpeg') {
        if (!invoicePreviewRef.current) {
          throw new Error('Invoice preview element not found');
        }
        await downloadImage(invoicePreviewRef.current, invoice, format);
        toast({
          title: `${format.toUpperCase()} Downloaded`,
          description: `Your invoice has been downloaded as a ${format.toUpperCase()} file.`,
        });
      } else if (format === 'link') {
        const success = await copyShareableLink(shareUrl, invoice.id);
        if (success) {
          toast({
            title: 'Link Copied',
            description: 'Shareable link has been copied to clipboard.',
          });
        } else {
          throw new Error('Failed to copy link to clipboard');
        }
      }
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : `Failed to export as ${format}`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle social media sharing
  const handleSocialShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'email') => {
    try {
      await shareToSocial(platform, invoice, shareUrl);
      
      // Different toast for email as it behaves differently
      if (platform === 'email') {
        toast({
          title: 'Email',
          description: 'Opening email client...',
        });
      } else {
        toast({
          title: 'Sharing',
          description: `Opening ${platform} sharing...`,
        });
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      toast({
        title: 'Sharing Failed',
        description: error instanceof Error ? error.message : `Failed to share to ${platform}`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle email sending
  // Save invoice and then send email
  const handleSaveAndSend = async () => {
    if (!onSaveInvoice) {
      toast({
        title: 'Error',
        description: 'Cannot save invoice at this time',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Saving Invoice',
        description: 'Please wait while we save your invoice...',
      });

      // Save the invoice
      const savedInvoice = await onSaveInvoice(invoice);
      
      if (!savedInvoice || !savedInvoice.id) {
        throw new Error('Failed to save invoice');
      }

      // Update the invoice reference and close the dialog
      toast({
        title: 'Invoice Saved',
        description: 'Your invoice has been saved. Now sending email...',
      });
      
      // Send the email with the saved invoice ID
      const result = await sendViaEmail(savedInvoice.id, {
        recipient: emailForm.recipient,
        subject: emailForm.subject,
        message: emailForm.message,
        attachPdf: true
      });
      
      if (result.success) {
        setIsEmailDialogOpen(false);
        toast({
          title: 'Email Sent',
          description: 'Your invoice has been saved and sent successfully.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error during save and send operation:', error);
      toast({
        title: 'Operation Failed',
        description: error instanceof Error ? error.message : 'Failed to save and send invoice',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async () => {
    if (!invoice.id) {
      // If invoice isn't saved yet, show save and send dialog
      toast({
        title: 'Save Required',
        description: 'This invoice needs to be saved first. Would you like to save it now and send?',
        action: (
          <ToastAction altText="Save and Send" onClick={handleSaveAndSend}>
            Save & Send
          </ToastAction>
        ),
      });
      return;
    }
    
    try {
      // Track email analytics through the server-side API
      try {
        await apiRequest('POST', '/api/analytics/track-share', {
          invoiceId: invoice.id,
          shareMethod: 'email-direct',
          metadata: { recipient: emailForm.recipient }
        });
      } catch (analyticsError) {
        // Don't let analytics tracking failure stop the email
        console.warn('Failed to track email analytics:', analyticsError);
      }
      
      const result = await sendViaEmail(invoice.id, {
        recipient: emailForm.recipient,
        subject: emailForm.subject,
        message: emailForm.message,
        attachPdf: true
      });
      
      if (result.success) {
        setIsEmailDialogOpen(false);
        toast({
          title: 'Email Sent',
          description: 'Your invoice has been sent successfully.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Email Failed',
        description: error instanceof Error ? error.message : 'Failed to send email',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card className="shadow rounded-lg overflow-hidden">
      <CardContent className="bg-gray-50 px-4 py-5 sm:px-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Share Invoice</h3>
        
        {/* Export Options */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Format</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('pdf')}
              className="text-sm"
            >
              <FileText className="mr-1.5 h-4 w-4 text-red-500" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('png')}
              className="text-sm"
            >
              <ImageIcon className="mr-1.5 h-4 w-4 text-blue-500" /> PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('jpeg')}
              className="text-sm"
            >
              <ImageIcon className="mr-1.5 h-4 w-4 text-purple-500" /> JPEG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('link')}
              className="text-sm"
            >
              <Link className="mr-1.5 h-4 w-4 text-gray-500" /> Copy Link
            </Button>
          </div>
        </div>
        
        {/* Social Sharing */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Share via Social Media</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleSocialShare('twitter')}
              className="bg-[#1DA1F2] hover:bg-[#1a94df] text-white text-sm"
            >
              <FaTwitter className="mr-1.5 h-4 w-4" /> Twitter
            </Button>
            <Button
              size="sm"
              onClick={() => handleSocialShare('facebook')}
              className="bg-[#4267B2] hover:bg-[#3b5998] text-white text-sm"
            >
              <FaFacebook className="mr-1.5 h-4 w-4" /> Facebook
            </Button>
            <Button
              size="sm"
              onClick={() => handleSocialShare('linkedin')}
              className="bg-[#0A66C2] hover:bg-[#0958a7] text-white text-sm"
            >
              <FaLinkedin className="mr-1.5 h-4 w-4" /> LinkedIn
            </Button>
            <Button
              size="sm"
              onClick={() => handleSocialShare('whatsapp')}
              className="bg-[#25D366] hover:bg-[#22c15e] text-white text-sm"
            >
              <FaWhatsapp className="mr-1.5 h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>
        
        {/* Messaging and Email */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Send Directly</h4>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  <Mail className="mr-1.5 h-4 w-4 text-primary" /> Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Invoice via Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4" aria-describedby="email-form-description">
                  <p id="email-form-description" className="sr-only">Email form for sending invoice</p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Recipient Email</label>
                    <Input
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <Input
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <Textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSendEmail}>Send Email</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialShare('whatsapp')}
              className="text-sm"
            >
              <FaWhatsapp className="mr-1.5 h-4 w-4 text-[#25D366]" /> WhatsApp
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialShare('telegram')}
              className="text-sm"
            >
              <FaTelegram className="mr-1.5 h-4 w-4 text-[#0088cc]" /> Telegram
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={async () => {
                // Track SMS share analytics if invoice has an ID
                if (invoice.id) {
                  try {
                    await apiRequest('POST', '/api/analytics/track-share', {
                      invoiceId: invoice.id,
                      shareMethod: 'sms',
                      metadata: { url: shareUrl }
                    });
                  } catch (analyticsError) {
                    // Don't let analytics tracking failure stop the SMS
                    console.warn('Failed to track SMS analytics:', analyticsError);
                  }
                }
                
                window.open(`sms:?&body=${encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.senderName}: ${shareUrl}`)}`);
                toast({
                  title: 'SMS',
                  description: 'Opening SMS app...',
                });
              }}
            >
              <Copy className="mr-1.5 h-4 w-4 text-gray-700" /> SMS
            </Button>
            
            <Button
              size="sm"
              className="text-sm bg-primary hover:bg-primary/90"
              onClick={() => {
                try {
                  const shareData = {
                    title: `Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`,
                    text: `Invoice amount: ${invoice.total.toFixed(2)} ${invoice.currency}. Due date: ${invoice.dueDate}`,
                    url: shareUrl,
                  };
                  
                  // Use our enhanced Web Share API function that includes analytics tracking
                  if (invoice.id) {
                    shareViaWebShareAPI(shareData, invoice.id)
                      .then((shared) => {
                        if (shared) {
                          toast({
                            title: 'Shared Successfully',
                            description: 'Invoice has been shared',
                          });
                        }
                      });
                  } else {
                    // If no invoice ID (unsaved invoice), fall back to standard sharing
                    if (navigator.share) {
                      navigator.share(shareData)
                        .then(() => {
                          toast({
                            title: 'Shared Successfully',
                            description: 'Invoice has been shared',
                          });
                        })
                        .catch((error) => {
                          if (error.name !== 'AbortError') {
                            // Only show error if it's not a user cancellation
                            throw error;
                          }
                        });
                    } else {
                      // Fallback to copying the link without tracking
                      copyShareableLink(shareUrl).then(success => {
                        if (success) {
                          toast({
                            title: 'Link Copied',
                            description: 'Native sharing not available. Link copied to clipboard instead.',
                          });
                        } else {
                          throw new Error('Failed to copy link');
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error using share API:', error);
                  toast({
                    title: 'Share Failed',
                    description: error instanceof Error ? error.message : 'Failed to share invoice',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <Share2 className="mr-1.5 h-4 w-4" /> Share All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareOptions;
