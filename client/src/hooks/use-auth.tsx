import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, UseMutationResult } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Login form data interface
interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// Registration form data interface
interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginCredentials>;
  registerMutation: UseMutationResult<User, Error, RegisterCredentials>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider component that wraps the application and provides authentication context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Fetch the current user from the server
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/user'], user);
      toast({
        title: 'Login successful',
        description: `Welcome back${user.username ? ', ' + user.username : ''}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await apiRequest('POST', '/api/register', credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(['/api/auth/user'], user);
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    },
  });

  // Logout helper function
  const logout = () => {
    window.location.href = '/api/logout';
  };

  // Create the auth context value
  const authContextValue: AuthContextType = {
    user: user || null,
    isLoading,
    error,
    loginMutation,
    registerMutation,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}