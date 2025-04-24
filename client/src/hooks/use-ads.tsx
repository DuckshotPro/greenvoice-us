import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Types for our ad API responses
interface AdSettingsResponse {
  publisherId: string;
  adUnits: {
    [key: string]: {
      adUnitId: string;
      format: string;
      responsive: boolean;
    }
  };
  testMode: boolean;
}

interface AdViewResponse {
  success: boolean;
  skipAd: boolean;
  isPremium: boolean;
  viewId: string;
  message: string;
}

interface AdCompleteResponse {
  success: boolean;
  message: string;
}

interface TempPremiumStatusResponse {
  hasTempPremium: boolean;
  expiresAt: string | null;
  adViewsCount: number;
  requiredAdViews: number;
}

/**
 * Hook to interact with the ad system
 */
export function useAds() {
  const { user, isPremium } = useAuth();
  const userId = user?.id;

  // Get ad settings
  const {
    data: adSettings,
    isLoading: isLoadingSettings,
    error: settingsError
  } = useQuery<AdSettingsResponse>({
    queryKey: ['/api/ads/settings'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Record an ad view
  const recordViewMutation = useMutation({
    mutationFn: async ({ adType, sourceAction }: { adType: string, sourceAction: string }) => {
      const response = await apiRequest('POST', '/api/ads/view', {
        adType,
        userId: userId || undefined,
        sourceAction,
      });
      return await response.json() as AdViewResponse;
    },
  });

  // Complete an ad view
  const completeViewMutation = useMutation({
    mutationFn: async ({ viewId, completed, duration }: { viewId: string, completed: boolean, duration?: number }) => {
      const response = await apiRequest('POST', '/api/ads/complete', {
        viewId,
        userId: userId || undefined,
        completed,
        duration,
      });
      return await response.json() as AdCompleteResponse;
    },
    onSuccess: () => {
      // Invalidate the temp premium status cache
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['/api/ads/temp-premium-status'] });
      }
    }
  });

  // Get temporary premium status
  const {
    data: tempPremiumStatus,
    isLoading: isLoadingTempStatus,
    error: tempStatusError
  } = useQuery<TempPremiumStatusResponse>({
    queryKey: ['/api/ads/temp-premium-status'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId && !isPremium, // Only run if user is logged in and not premium
  });

  // Function to get Google Ads publisher ID
  const getPublisherId = () => {
    return adSettings?.publisherId || '';
  };

  // Function to get ad unit ID by name
  const getAdUnitId = (name: string) => {
    if (!adSettings || !adSettings.adUnits) return '';
    return adSettings.adUnits[name]?.adUnitId || '';
  };

  // Determine if user should see ads
  const shouldShowAds = () => {
    // Premium users don't see ads
    if (isPremium) return false;
    
    // Check if user has temporary premium access
    if (tempPremiumStatus?.hasTempPremium) return false;
    
    return true;
  };

  // Record that an ad action should be taken (show an ad)
  const recordAdAction = async (adType: string, sourceAction: string) => {
    if (!shouldShowAds()) {
      return {
        skipAd: true,
        isPremium: isPremium || tempPremiumStatus?.hasTempPremium || false,
        viewId: '',
      };
    }

    try {
      const result = await recordViewMutation.mutateAsync({ adType, sourceAction });
      return {
        skipAd: result.skipAd,
        isPremium: result.isPremium,
        viewId: result.viewId,
      };
    } catch (error) {
      console.error('Error recording ad action:', error);
      return {
        skipAd: true, // Skip the ad on error to not block the user
        isPremium: false,
        viewId: '',
      };
    }
  };

  // Complete an ad view (ad was watched)
  const completeAdView = async (viewId: string, completed: boolean = true, duration?: number) => {
    if (!viewId) return;
    
    try {
      await completeViewMutation.mutateAsync({ viewId, completed, duration });
    } catch (error) {
      console.error('Error completing ad view:', error);
    }
  };

  return {
    // Ad settings
    adSettings,
    isLoadingSettings,
    settingsError,
    
    // Premium status
    isPremium: isPremium || tempPremiumStatus?.hasTempPremium || false,
    tempPremiumStatus,
    isLoadingTempStatus,
    tempStatusError,
    
    // Utility functions
    getPublisherId,
    getAdUnitId,
    shouldShowAds,
    recordAdAction,
    completeAdView,
  };
}