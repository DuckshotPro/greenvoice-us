import React, { useState, useEffect } from "react";
import { Invoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getBrandingSettings, BrandingSettings } from "@/lib/branding-service";
import { handleInputFocus, handleTextareaFocus } from "@/lib/focus-handlers";
import { Clipboard, Copy, Link, Mail, MessageCircle, Share2, Facebook, Linkedin, Twitter, Check, FileText, Download, Instagram, Smartphone } from "lucide-react";
import { 
  SiGithub, SiLinkedin, SiFacebook, SiX, SiInstagram, 
  SiWhatsapp, SiTelegram, SiSnapchat, SiTiktok, 
  SiSlack, SiDiscord, SiReddit, SiPaypal, SiApple,
  SiGoogle, SiAmazon, SiAdobe, SiShopify, 
  SiWordpress, SiWix, SiSquarespace, SiStripe,
  SiSalesforce, SiHubspot, SiMailchimp
} from "react-icons/si";
import generatePdf from "@/lib/pdf-generator";
// Import our GreenVoice logo
import greenVoiceLogo from "../../assets/green-voice-logo.png";

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
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);
  const [selectedBranding, setSelectedBranding] = useState<string>("none");
  
  // Fetch branding settings when component mounts
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const settings = await getBrandingSettings();
        setBrandingSettings(settings);
      } catch (error) {
        console.error("Failed to fetch branding settings:", error);
        // Show user-friendly error message
        toast({
          title: "Warning",
          description: "Could not load branding settings. Using default branding.",
          variant: "destructive",
        });
      }
    };
    
    fetchBranding();
  }, [toast]);

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
          recipient_email: email || null,
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
      case "instagram":
        // Instagram doesn't have a direct share URL, alert user to use the link or story
        toast({
          title: "Instagram Sharing",
          description: "Copy the link to share in your Instagram story or post"
        });
        navigator.clipboard.writeText(getShareableUrl(platform));
        trackShare(platform);
        return;
      case "telegram":
        url = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
        break;
      case "email":
        url = `mailto:?subject=${shareText}&body=${shareText}%20${shareUrl}`;
        break;
      case "sms":
        url = `sms:?body=${shareText}%20${shareUrl}`;
        break;
      default:
        return;
    }
    
    // Track the share
    trackShare(platform);
    
    // Open in a new window (except for mobile-specific options)
    if (platform === "sms") {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "width=600,height=400");
    }
    
    toast({
      title: "Shared!",
      description: `The invoice has been shared via ${platform.charAt(0).toUpperCase() + platform.slice(1)}.`
    });
  };
  
  // Export to PDF
  const exportToPdf = () => {
    try {
      // Use the generatePdf function from our imported module
      generatePdf(invoice as any);
      
      // Track the export
      trackShare("pdf_export");
      
      toast({
        title: "PDF Generated!",
        description: "Your invoice has been exported as a PDF file."
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle sharing with company logo/branding
  const shareWithBranding = (platform: string) => {
    if (!selectedBranding || selectedBranding === "none") {
      // If no branding is selected, use regular share
      shareToSocial(platform);
      return;
    }
    
    // Otherwise, track the branded share
    trackShare(`branded_${platform}`);
    
    // For now, we're just showing a toast with the branding info
    // In a full implementation, this would create a custom share card with branding
    toast({
      title: "Branded Share",
      description: `Sharing to ${platform} with ${selectedBranding} branding`,
    });
    
    // Still use the regular sharing mechanism
    shareToSocial(platform);
  };
  
  // Custom GreenVoice icon component
  const GreenVoiceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <div className={`relative flex items-center justify-center ${props.className}`}>
      <img 
        src={greenVoiceLogo} 
        alt="GreenVoice Logo" 
        className="object-contain w-full h-full"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );

  // Define company logo options for branded sharing
  const companyLogos = [
    // Add GreenVoice as the first option
    { id: "greenvoice", name: "GreenVoice", icon: GreenVoiceIcon, color: "#4CAF50", isCustom: true },
    { id: "facebook", name: "Facebook", icon: SiFacebook, color: "#4267B2" },
    { id: "google", name: "Google", icon: SiGoogle, color: "#4285F4" },
    { id: "amazon", name: "Amazon", icon: SiAmazon, color: "#FF9900" },
    { id: "apple", name: "Apple", icon: SiApple, color: "#A2AAAD" },
    { id: "twitter", name: "Twitter/X", icon: SiX, color: "#000000" },
    { id: "linkedin", name: "LinkedIn", icon: SiLinkedin, color: "#0A66C2" },
    { id: "stripe", name: "Stripe", icon: SiStripe, color: "#635BFF" },
    { id: "salesforce", name: "Salesforce", icon: SiSalesforce, color: "#00A1E0" },
    { id: "shopify", name: "Shopify", icon: SiShopify, color: "#7AB55C" },
    { id: "hubspot", name: "HubSpot", icon: SiHubspot, color: "#FF7A59" },
    { id: "mailchimp", name: "Mailchimp", icon: SiMailchimp, color: "#FFE01B" },
    { id: "adobe", name: "Adobe", icon: SiAdobe, color: "#FF0000" }
  ];

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
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="branded">
              <GreenVoiceIcon className="mr-2 h-4 w-4" />
              Branded
            </TabsTrigger>
            <TabsTrigger value="export">
              <FileText className="mr-2 h-4 w-4" />
              Export
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
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("instagram")}
                disabled={isLoading}
              >
                <Instagram className="h-5 w-5 text-[#E1306C]" />
                <span>Instagram</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("telegram")}
                disabled={isLoading}
              >
                <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                <span>Telegram</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("sms")}
                disabled={isLoading}
              >
                <Smartphone className="h-5 w-5 text-[#5BC236]" />
                <span>SMS</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2"
                variant="outline"
                onClick={() => shareToSocial("email")}
                disabled={isLoading}
              >
                <Mail className="h-5 w-5 text-[#D44638]" />
                <span>Email Link</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Share this invoice directly to social media and messaging platforms
            </p>
          </TabsContent>
          
          {/* Branded sharing options */}
          <TabsContent value="branded" className="space-y-4">
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="brandingSelect">Select Company Branding</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    key="none"
                    variant={selectedBranding === "none" ? "default" : "outline"}
                    className="flex flex-col items-center justify-center p-3 h-auto text-xs"
                    onClick={() => setSelectedBranding("none")}
                  >
                    <div className="rounded-full bg-muted p-2 mb-1">
                      <span className="text-muted-foreground">None</span>
                    </div>
                    <span>No Logo</span>
                  </Button>
                  
                  {companyLogos.map((company) => {
                    const IconComponent = company.icon;
                    return (
                      <Button
                        key={company.id}
                        variant={selectedBranding === company.id ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-3 h-auto"
                        onClick={() => setSelectedBranding(company.id)}
                      >
                        <div className="rounded-full bg-white p-2 mb-1">
                          <IconComponent style={{ color: company.color }} className="h-6 w-6" />
                        </div>
                        <span className="text-xs">{company.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Share with {selectedBranding !== "none" ? companyLogos.find(c => c.id === selectedBranding)?.name || "" : "No"} Branding</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                    onClick={() => shareWithBranding("linkedin")}
                    disabled={isLoading}
                  >
                    <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />
                    <span>LinkedIn</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                    onClick={() => shareWithBranding("twitter")}
                    disabled={isLoading}
                  >
                    <SiX className="h-5 w-5" />
                    <span>Twitter/X</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                    onClick={() => shareWithBranding("facebook")}
                    disabled={isLoading}
                  >
                    <SiFacebook className="h-5 w-5 text-[#4267B2]" />
                    <span>Facebook</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                    onClick={() => shareWithBranding("email")}
                    disabled={isLoading}
                  >
                    <Mail className="h-5 w-5 text-[#D44638]" />
                    <span>Email</span>
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {selectedBranding === "none" 
                      ? "Select a company brand to enhance your invoice sharing with professional logos" 
                      : `Your invoice will be shared with ${companyLogos.find(c => c.id === selectedBranding)?.name} branding, enhancing your professional presence.`}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Export options */}
          <TabsContent value="export" className="space-y-4">
            <div className="mt-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <h3 className="font-medium">PDF Document</h3>
                        <p className="text-sm text-muted-foreground">Export invoice as a professional PDF document</p>
                      </div>
                    </div>
                    <Button 
                      onClick={exportToPdf}
                      disabled={isLoading}
                      className="ml-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {/* Add more export options in the future */}
                <div className="border border-dashed rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-muted-foreground mr-3" />
                      <div>
                        <h3 className="font-medium">More Export Options</h3>
                        <p className="text-sm text-muted-foreground">Additional export formats coming soon</p>
                      </div>
                    </div>
                    <Button disabled className="ml-4">
                      <Download className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
        ) : activeTab === "export" ? (
          <Button
            onClick={exportToPdf}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        ) : activeTab === "branded" ? (
          <Button
            onClick={() => shareWithBranding(selectedBranding !== "none" ? selectedBranding : "generic")}
            disabled={isLoading}
            className="gap-2"
          >
            {selectedBranding !== "none" && companyLogos.find(c => c.id === selectedBranding)?.icon && React.createElement(
              companyLogos.find(c => c.id === selectedBranding)?.icon as any, 
              { className: "h-4 w-4" }
            )}
            Share with Branding
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