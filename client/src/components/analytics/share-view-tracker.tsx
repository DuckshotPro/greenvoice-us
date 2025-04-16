import { useEffect } from "react";

interface ShareViewTrackerProps {
  invoiceId: number;
  shareMethod?: string;
}

/**
 * Invisible component that tracks when a shared invoice is viewed
 * Also captures UTM parameters for marketing campaigns
 */
const ShareViewTracker = ({ invoiceId, shareMethod = "link" }: ShareViewTrackerProps) => {
  useEffect(() => {
    // Only run on mount
    const trackView = async () => {
      try {
        // Extract UTM parameters and other query params
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source");
        const utmMedium = urlParams.get("utm_medium");
        const utmCampaign = urlParams.get("utm_campaign");
        const utmContent = urlParams.get("utm_content");
        const utmTerm = urlParams.get("utm_term");
        
        // Use the UTM source as share method if available, otherwise use the provided shareMethod
        const method = utmSource || shareMethod;
        
        // Record view data
        const response = await fetch("/api/analytics/record-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            shareMethod: method,
            // Include metadata with view details
            metadata: {
              viewedAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
              screenSize: `${window.innerWidth}x${window.innerHeight}`,
              referrer: document.referrer || null
            }
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to record view");
        }
        
        // Track UTM parameters if present
        if (utmSource || utmMedium || utmCampaign) {
          await fetch("/api/analytics/track-utm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              invoiceId,
              utmSource: utmSource || null,
              utmMedium: utmMedium || null,
              utmCampaign: utmCampaign || null,
              utmContent: utmContent || null,
              utmTerm: utmTerm || null,
            }),
          });
        }
      } catch (error) {
        console.error("Error tracking invoice view:", error);
      }
    };
    
    trackView();
  }, [invoiceId, shareMethod]);
  
  // This component doesn't render anything
  return null;
};

export default ShareViewTracker;