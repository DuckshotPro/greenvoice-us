import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { SiFacebook, SiGithub } from 'react-icons/si';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Configuration for detecting available OAuth providers
 */
const PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    icon: FcGoogle,
    envCheck: () => true, // Google auth is always available with Replit Auth
    color: 'bg-white hover:bg-slate-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: SiFacebook,
    envCheck: () => !!import.meta.env.VITE_FACEBOOK_APP_ID,
    color: 'bg-[#1877F2] hover:bg-[#0e67d9]',
    textColor: 'text-white',
    borderColor: 'border-[#1877F2]',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: SiGithub,
    envCheck: () => !!import.meta.env.VITE_GITHUB_CLIENT_ID,
    color: 'bg-[#333] hover:bg-[#000]',
    textColor: 'text-white',
    borderColor: 'border-[#333]',
  },
];

interface OAuthButtonsProps {
  isLoading?: boolean;
  className?: string;
}

/**
 * Renders OAuth login buttons based on available providers
 * Automatically detects which providers are available from environment variables
 */
const OAuthButtons: React.FC<OAuthButtonsProps> = ({ 
  isLoading = false,
  className = '' 
}) => {
  const { toast } = useToast();
  
  // Filter to only show buttons for available OAuth providers
  const availableProviders = PROVIDERS.filter(provider => provider.envCheck());
  
  // Handle click on OAuth button
  const handleOAuthLogin = (providerId: string) => {
    if (isLoading) return;
    
    // Redirect to appropriate OAuth endpoint
    window.location.href = `/api/auth/${providerId}`;
  };

  if (availableProviders.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-3 w-full ${className}`}>
      <div className="relative flex items-center justify-center text-xs uppercase my-2">
        <span className="bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
        <div className="absolute left-0 right-0 w-full border-t border-border" style={{ top: '50%' }}></div>
      </div>
      
      {availableProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className={`flex items-center justify-center w-full h-10 gap-2 
                    ${provider.color} ${provider.textColor} ${provider.borderColor}`}
          onClick={() => handleOAuthLogin(provider.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <provider.icon className="h-5 w-5" />
          )}
          <span>{provider.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default OAuthButtons;