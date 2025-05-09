import React from 'react';
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OAuthButtonsProps {
  isLoading?: boolean;
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({ isLoading = false }) => {
  const { toast } = useToast();

  const handleOAuthLogin = (provider: string) => {
    try {
      // Redirect to the OAuth provider's login page
      window.location.href = `/api/auth/${provider}`;
    } catch (error) {
      console.error(`Error with ${provider} login:`, error);
      toast({
        title: "Authentication Error",
        description: `Failed to login with ${provider}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleOAuthLogin('google')}
          className="flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
          )}
          Google
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleOAuthLogin('facebook')}
          className="flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
          )}
          Facebook
        </Button>

        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleOAuthLogin('github')}
          className="flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaGithub className="mr-2 h-4 w-4" />
          )}
          GitHub
        </Button>
      </div>
    </div>
  );
};

export default OAuthButtons;