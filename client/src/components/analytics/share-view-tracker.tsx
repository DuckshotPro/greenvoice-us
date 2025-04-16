import { useEffect } from 'react';
import { apiRequest } from '../../lib/queryClient';

interface ShareViewTrackerProps {
  invoiceId: number;
  shareMethod: string;
}

/**
 * ShareViewTracker - Records when a shared invoice is viewed
 * This is a non-visual component that should be added to shared invoice view pages
 */
export const ShareViewTracker: React.FC<ShareViewTrackerProps> = ({ invoiceId, shareMethod }) => {
  useEffect(() => {
    const recordView = async () => {
      try {
        // Send request to backend to record the view
        await apiRequest('POST', '/api/analytics/record-view', {
          invoiceId,
          shareMethod
        });
        console.log('Share view tracked successfully');
      } catch (error) {
        console.error('Failed to track share view:', error);
        // Don't display errors to user as this is a background tracking feature
      }
    };

    // Track the view when component mounts
    recordView();

    // Also add UTM parameter tracking here if coming from a marketing campaign
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    
    if (utmSource || utmMedium || utmCampaign) {
      const trackUtm = async () => {
        try {
          await apiRequest('POST', '/api/analytics/track-utm', {
            invoiceId,
            shareMethod,
            utmSource,
            utmMedium,
            utmCampaign
          });
        } catch (error) {
          console.error('Failed to track UTM parameters:', error);
        }
      };
      
      trackUtm();
    }
  }, [invoiceId, shareMethod]);

  // This component doesn't render anything
  return null;
};

export default ShareViewTracker;