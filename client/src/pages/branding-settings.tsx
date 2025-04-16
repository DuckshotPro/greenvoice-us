import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save, Image, PaintBucket, RefreshCw, CheckCircle } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs as TabsComponent, TabsList as TabsListComponent, TabsTrigger as TabsTriggerComponent, TabsContent as TabsContentComponent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  BrandingSettings,
  getBrandingSettings, 
  saveBrandingSettings, 
  generateLogo, 
  generatePattern,
  blobToDataUrl,
  getAvailableFonts,
  getAvailableTemplates
} from "@/lib/branding-service";

export default function BrandingSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeColor, setActiveColor] = useState<"primary" | "secondary" | "accent">("primary");
  const [logoDescription, setLogoDescription] = useState("");
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [patternColors, setPatternColors] = useState("");
  const [patternStyle, setPatternStyle] = useState("");
  const [isGeneratingPattern, setIsGeneratingPattern] = useState(false);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [previewPatternUrl, setPreviewPatternUrl] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // Check if user has premium access
  const hasPremium = user?.subscriptionPlan === "premium" || (user?.premiumDaysRemaining && user.premiumDaysRemaining > 0);
  
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getBrandingSettings();
        setSettings(data);
      } catch (error) {
        toast({
          title: "Error loading settings",
          description: "Could not load your branding settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, [toast]);
  
  const handleColorChange = (color: string) => {
    if (!settings) return;
    
    if (activeColor === "primary") {
      setSettings({ ...settings, primaryColor: color });
    } else if (activeColor === "secondary") {
      setSettings({ ...settings, secondaryColor: color });
    } else if (activeColor === "accent") {
      setSettings({ ...settings, accentColor: color });
    }
  };
  
  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // If we have generated a logo, use that
      if (previewLogoUrl) {
        // In a real implementation, you would upload the image here
        // For this example, we'll just use the data URL
        setSettings({ ...settings, logoUrl: previewLogoUrl });
      }
      
      await saveBrandingSettings(settings);
      toast({
        title: "Settings saved",
        description: "Your branding settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Could not save your branding settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGenerateLogo = async () => {
    if (!logoDescription) {
      toast({
        title: "Description needed",
        description: "Please enter a description for your logo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasPremium) {
      toast({
        title: "Premium Feature",
        description: "Logo generation is available with premium access. Watch an ad to gain temporary access.",
        variant: "default",
      });
      return;
    }
    
    setIsGeneratingLogo(true);
    try {
      const logoBlob = await generateLogo(logoDescription);
      const logoUrl = await blobToDataUrl(logoBlob);
      setPreviewLogoUrl(logoUrl);
    } catch (error) {
      toast({
        title: "Error generating logo",
        description: "Could not generate a logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLogo(false);
    }
  };
  
  const handleGeneratePattern = async () => {
    if (!patternColors || !patternStyle) {
      toast({
        title: "Information needed",
        description: "Please enter both colors and style for your pattern.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasPremium) {
      toast({
        title: "Premium Feature",
        description: "Pattern generation is available with premium access. Watch an ad to gain temporary access.",
        variant: "default",
      });
      return;
    }
    
    setIsGeneratingPattern(true);
    try {
      const patternBlob = await generatePattern(patternColors, patternStyle);
      const patternUrl = await blobToDataUrl(patternBlob);
      setPreviewPatternUrl(patternUrl);
    } catch (error) {
      toast({
        title: "Error generating pattern",
        description: "Could not generate a pattern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPattern(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Error Loading Settings</h1>
        <p className="text-muted-foreground">Could not load branding settings.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Branding Settings</h1>
          <p className="text-muted-foreground">
            Customize your invoice appearance and branding
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Colors & Fonts */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Colors & Typography</CardTitle>
              <CardDescription>
                Personalize the look and feel of your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsComponent defaultValue="colors">
                <TabsListComponent>
                  <TabsTriggerComponent value="colors">Colors</TabsTriggerComponent>
                  <TabsTriggerComponent value="typography">Typography</TabsTriggerComponent>
                </TabsListComponent>
                
                <TabsContentComponent value="colors" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label 
                        htmlFor="primaryColor" 
                        className="mb-2 block font-medium"
                        onClick={() => {
                          setActiveColor("primary");
                          setColorPickerOpen(true);
                        }}
                      >
                        Primary Color
                      </Label>
                      <div 
                        className="h-12 rounded-md cursor-pointer flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: settings.primaryColor }}
                        onClick={() => {
                          setActiveColor("primary");
                          setColorPickerOpen(true);
                        }}
                      >
                        {settings.primaryColor}
                      </div>
                    </div>
                    
                    <div>
                      <Label 
                        htmlFor="secondaryColor" 
                        className="mb-2 block font-medium"
                        onClick={() => {
                          setActiveColor("secondary");
                          setColorPickerOpen(true);
                        }}
                      >
                        Secondary Color
                      </Label>
                      <div 
                        className="h-12 rounded-md cursor-pointer flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: settings.secondaryColor }}
                        onClick={() => {
                          setActiveColor("secondary");
                          setColorPickerOpen(true);
                        }}
                      >
                        {settings.secondaryColor}
                      </div>
                    </div>
                    
                    <div>
                      <Label 
                        htmlFor="accentColor" 
                        className="mb-2 block font-medium"
                        onClick={() => {
                          setActiveColor("accent");
                          setColorPickerOpen(true);
                        }}
                      >
                        Accent Color
                      </Label>
                      <div 
                        className="h-12 rounded-md cursor-pointer flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: settings.accentColor }}
                        onClick={() => {
                          setActiveColor("accent");
                          setColorPickerOpen(true);
                        }}
                      >
                        {settings.accentColor}
                      </div>
                    </div>
                  </div>
                  
                  {colorPickerOpen && (
                    <div className="mt-6">
                      <Label className="mb-2 block font-medium">
                        {activeColor === "primary" 
                          ? "Select Primary Color" 
                          : activeColor === "secondary" 
                          ? "Select Secondary Color" 
                          : "Select Accent Color"}
                      </Label>
                      <div className="flex flex-col items-center">
                        <HexColorPicker 
                          color={
                            activeColor === "primary" 
                              ? settings.primaryColor 
                              : activeColor === "secondary" 
                              ? settings.secondaryColor 
                              : settings.accentColor
                          }
                          onChange={handleColorChange} 
                        />
                        <Input 
                          className="w-32 mt-4"
                          value={
                            activeColor === "primary" 
                              ? settings.primaryColor 
                              : activeColor === "secondary" 
                              ? settings.secondaryColor 
                              : settings.accentColor
                          }
                          onChange={(e) => handleColorChange(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </TabsContentComponent>
                
                <TabsContentComponent value="typography" className="py-4">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fontFamily" className="mb-2 block font-medium">
                        Font Family
                      </Label>
                      <Select 
                        value={settings.fontFamily} 
                        onValueChange={(value) => 
                          setSettings({ ...settings, fontFamily: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a font family" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFonts().map((font) => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="template" className="mb-2 block font-medium">
                        Invoice Template
                      </Label>
                      <Select 
                        value={settings.customTemplate || "default"} 
                        onValueChange={(value) => 
                          setSettings({ ...settings, customTemplate: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTemplates().map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}{template.premium && " (Premium)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContentComponent>
              </TabsComponent>
            </CardContent>
          </Card>
          
          {/* AI Generation Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI-Powered Branding</CardTitle>
              <CardDescription>
                Generate custom logos and patterns for your invoices
                {!hasPremium && " (Premium Feature)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="logo">
                <TabsList>
                  <TabsTrigger value="logo">Logo Generator</TabsTrigger>
                  <TabsTrigger value="pattern">Pattern Generator</TabsTrigger>
                </TabsList>
                
                <TabsContent value="logo" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="logoDescription" className="mb-2 block font-medium">
                        Logo Description
                      </Label>
                      <div className="space-y-4">
                        <Input
                          id="logoDescription"
                          placeholder="e.g., minimalist tech logo with blue colors"
                          value={logoDescription}
                          onChange={(e) => setLogoDescription(e.target.value)}
                        />
                        <Button 
                          onClick={handleGenerateLogo} 
                          disabled={isGeneratingLogo || !logoDescription || !hasPremium}
                          className="w-full"
                        >
                          {isGeneratingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Image className="mr-2 h-4 w-4" />
                              Generate Logo
                            </>
                          )}
                        </Button>
                        
                        {!hasPremium && (
                          <p className="text-sm text-muted-foreground">
                            Logo generation requires premium access. Watch an ad to gain temporary access.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block font-medium">Preview</Label>
                      <div className="border rounded-md flex items-center justify-center bg-background h-40">
                        {previewLogoUrl ? (
                          <img 
                            src={previewLogoUrl} 
                            alt="Generated Logo" 
                            className="max-h-full max-w-full object-contain" 
                          />
                        ) : (
                          <p className="text-muted-foreground text-sm text-center px-4">
                            Your generated logo will appear here
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pattern" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="patternColors" className="mb-2 block font-medium">
                          Color Scheme
                        </Label>
                        <Input
                          id="patternColors"
                          placeholder="e.g., blue and gold"
                          value={patternColors}
                          onChange={(e) => setPatternColors(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="patternStyle" className="mb-2 block font-medium">
                          Pattern Style
                        </Label>
                        <Input
                          id="patternStyle"
                          placeholder="e.g., geometric, abstract, waves"
                          value={patternStyle}
                          onChange={(e) => setPatternStyle(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleGeneratePattern} 
                        disabled={isGeneratingPattern || !patternColors || !patternStyle || !hasPremium}
                        className="w-full"
                      >
                        {isGeneratingPattern ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <PaintBucket className="mr-2 h-4 w-4" />
                            Generate Pattern
                          </>
                        )}
                      </Button>
                      
                      {!hasPremium && (
                        <p className="text-sm text-muted-foreground">
                          Pattern generation requires premium access. Watch an ad to gain temporary access.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label className="mb-2 block font-medium">Preview</Label>
                      <div className="border rounded-md flex items-center justify-center bg-background h-40">
                        {previewPatternUrl ? (
                          <img 
                            src={previewPatternUrl} 
                            alt="Generated Pattern" 
                            className="max-h-full max-w-full object-cover w-full h-full"
                          />
                        ) : (
                          <p className="text-muted-foreground text-sm text-center px-4">
                            Your generated pattern will appear here
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Preview & Info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Branding Preview</CardTitle>
              <CardDescription>
                See how your branding will look on invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-white" style={{
                fontFamily: settings.fontFamily
              }}>
                <div className="flex justify-between items-center mb-4">
                  {settings.logoUrl || previewLogoUrl ? (
                    <img 
                      src={previewLogoUrl || settings.logoUrl}
                      alt="Company Logo" 
                      className="h-12"
                    />
                  ) : (
                    <div 
                      className="h-12 w-32 bg-gray-100 rounded flex items-center justify-center font-bold"
                      style={{ color: settings.primaryColor }}
                    >
                      COMPANY
                    </div>
                  )}
                  <div 
                    className="text-xl font-bold"
                    style={{ color: settings.primaryColor }}
                  >
                    INVOICE
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="h-1 w-full" style={{ backgroundColor: settings.primaryColor }}></div>
                  <div className="h-0.5 w-full mt-0.5" style={{ backgroundColor: settings.secondaryColor }}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">From:</p>
                    <p className="font-bold">Your Company</p>
                    <p className="text-sm">your.email@example.com</p>
                    <p className="text-sm">123 Business St.</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To:</p>
                    <p className="font-bold">Client Name</p>
                    <p className="text-sm">client@example.com</p>
                    <p className="text-sm">456 Client Ave.</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="grid grid-cols-4 gap-2 font-bold text-sm p-2"
                    style={{ backgroundColor: settings.secondaryColor, color: "white" }}
                  >
                    <div className="col-span-2">Item</div>
                    <div>Price</div>
                    <div>Amount</div>
                  </div>
                  <div className="border-b py-2 grid grid-cols-4 gap-2 text-sm">
                    <div className="col-span-2">Service 1</div>
                    <div>$100.00</div>
                    <div>$100.00</div>
                  </div>
                  <div className="border-b py-2 grid grid-cols-4 gap-2 text-sm">
                    <div className="col-span-2">Service 2</div>
                    <div>$200.00</div>
                    <div>$200.00</div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <div className="w-1/3">
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Subtotal:</span>
                      <span className="text-sm">$300.00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Tax (10%):</span>
                      <span className="text-sm">$30.00</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold"
                      style={{ color: settings.accentColor }}
                    >
                      <span>Total:</span>
                      <span>$330.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Branding Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Use your brand's official colors for consistency</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Choose fonts that are easy to read in print and digital formats</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Keep your logo simple and recognizable</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Save your settings to apply them to all your invoices</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}