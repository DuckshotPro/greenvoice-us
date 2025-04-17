import { useState } from "react";
import { Invoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { handleInputFocus, handleTextareaFocus } from "@/lib/focus-handlers";
import { Clipboard, Copy, Link, Mail, MessageCircle, Share2, Facebook, Linkedin, Twitter, Check } from "lucide-react";

interface ShareOptionsProps {
  invoice: Invoice;
  isLoading?: boolean;
  onClose?: () => void;
}

/**
 * ShareOptions component - Provides various ways to share an invoice
 * Tracks analytics for each sharing method
 */
export function ShareOptions({ invoice, isLoading = false, onClose }: ShareOptionsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("link");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`);
  const [emailMessage, setEmailMessage] = useState(`Please find your invoice attached.`);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Generate the shareable URL
  const getShareableUrl = (source?: string) => {
    if (!invoice.shareableLink) return "";
    
    const baseUrl = `${window.location.origin}/share/${invoice.shareableLink}`;
    
    // Add UTM parameters for tracking
    if (source) {
      return `${baseUrl}?utm_source=${source}&utm_medium=share&utm_campaign=invoice_share`;
    }
    
    return baseUrl;
  };

  // Track the share event
  const trackShare = async (method: string, email?: string) => {
    try {
      // Use fetch directly with no-cors to prevent page reloads
      fetch("/api/analytics/track-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          shareMethod: method,
          recipientEmail: email || null,
          metadata: {
            shared_at: new Date().toISOString(),
            invoice_number: invoice.invoiceNumber,
            client_name: invoice.clientName,
            amount: invoice.total
          }
        }),
        // Add credentials to ensure cookies are sent
        credentials: "same-origin"
      }).catch(e => {
        // Silently handle errors to prevent disrupting the user experience
        console.error("Analytics tracking error:", e);
      });
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  // Copy shareable link to clipboard
  const copyLinkToClipboard = async () => {
    const url = getShareableUrl("link");
    
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      trackShare("link");
      
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard."
      });
      
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Send invoice via email
  const sendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);
    
    try {
      // Call the email API
      await apiRequest("POST", `/api/invoices/${invoice.id}/email`, {
        recipient: recipientEmail,
        subject: emailSubject,
        message: emailMessage
      });
      
      // Track is handled by the server in this case
      
      toast({
        title: "Email sent!",
        description: `The invoice was sent to ${recipientEmail}.`
      });
      
      // Reset form
      setRecipientEmail("");
      
      // Close modal if provided
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "There was an error sending the email. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Share via social media
  const shareToSocial = (platform: string) => {
    let url = "";
    const shareUrl = encodeURIComponent(getShareableUrl(platform));
    const shareText = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`);
    
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${shareText}%20${shareUrl}`;
        break;
      default:
        return;
    }
    
    // Track the share
    trackShare(platform);
    
    // Open in a new window
    window.open(url, "_blank", "width=600,height=400");
    
    toast({
      title: "Shared!",
      description: `The invoice has been shared via ${platform.charAt(0).toUpperCase() + platform.slice(1)}.`
    });
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="mr-2 h-5 w-5" />
          Share Invoice
        </CardTitle>
        <CardDescription>
          Share invoice #{invoice.invoiceNumber} with {invoice.clientName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link className="mr-2 h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="social">
              <MessageCircle className="mr-2 h-4 w-4" />
              Social
            </TabsTrigger>
          </TabsList>
          
          {/* Link sharing */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2 mt-4">
              <Label htmlFor="shareLink">Shareable Link</Label>
              <div className="flex space-x-2">
                <Input
                  id="shareLink"
                  value={getShareableUrl("link")}
                  readOnly
                  className="flex-1"
                  onFocus={handleInputFocus}
                />
                <Button 
                  onClick={copyLinkToClipboard} 
                  variant="outline"
                  disabled={isLoading}
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {linkCopied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view the invoice without signing in.
              </p>
            </div>
          </TabsContent>
          
          {/* Email sharing */}
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="client@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onFocus={handleInputFocus}
                disabled={isLoading || sendingEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                onFocus={handleInputFocus}
                disabled={isLoading || sendingEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailMessage">Message</Label>
              <Textarea
                id="emailMessage"
                rows={3}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                onFocus={handleTextareaFocus}
                disabled={isLoading || sendingEmail}
              />
            </div>
          </TabsContent>
          
          {/* Social media sharing */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("twitter")}
                disabled={isLoading}
              >
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                <span>Twitter</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("facebook")}
                disabled={isLoading}
              >
                <Facebook className="h-5 w-5 text-[#4267B2]" />
                <span>Facebook</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("linkedin")}
                disabled={isLoading}
              >
                <Linkedin className="h-5 w-5 text-[#0077B5]" />
                <span>LinkedIn</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("whatsapp")}
                disabled={isLoading}
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                <span>WhatsApp</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Share this invoice directly to social media platforms
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isLoading || sendingEmail}>
            Cancel
          </Button>
        )}
        {activeTab === "email" ? (
          <Button 
            onClick={sendEmail} 
            disabled={!recipientEmail || isLoading || sendingEmail}
          >
            {sendingEmail ? "Sending..." : "Send Email"}
          </Button>
        ) : (
          <Button
            onClick={copyLinkToClipboard}
            disabled={isLoading}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShareOptions;