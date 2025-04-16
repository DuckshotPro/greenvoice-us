import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface ShareViewTrackerProps {
  invoiceId: number;
  shareMethod: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * ShareViewTracker - Records when a shared invoice is viewed
 * This is a non-visual component that should be added to shared invoice view pages
 * It automatically tracks views and UTM parameters when present in the URL
 */
export const ShareViewTracker: React.FC<ShareViewTrackerProps> = ({ 
  invoiceId, 
  shareMethod,
  utmSource,
  utmMedium,
  utmCampaign
}) => {
  useEffect(() => {
    // Define a function to get UTM parameters from URL
    const getUtmParamsFromUrl = () => {
      if (typeof window === "undefined") return {}; // SSR check
      
      const urlParams = new URLSearchParams(window.location.search);
      return {
        utmSource: urlParams.get("utm_source") || utmSource,
        utmMedium: urlParams.get("utm_medium") || utmMedium,
        utmCampaign: urlParams.get("utm_campaign") || utmCampaign
      };
    };

    // Record the view
    const recordView = async () => {
      try {
        // First record a basic view
        await apiRequest("POST", "/api/analytics/record-view", {
          invoiceId, 
          shareMethod
        });
        
        // Check for UTM parameters
        const { utmSource, utmMedium, utmCampaign } = getUtmParamsFromUrl();
        
        // If we have UTM parameters, track them too
        if (utmSource || utmMedium || utmCampaign) {
          await apiRequest("POST", "/api/analytics/track-utm", {
            invoiceId,
            shareMethod,
            utmSource,
            utmMedium,
            utmCampaign
          });
        }
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };

    // Execute the tracking on component mount
    recordView();
  }, [invoiceId, shareMethod, utmSource, utmMedium, utmCampaign]);

  // This component doesn't render anything
  return null;
};

export default ShareViewTracker;