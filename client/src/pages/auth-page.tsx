import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FileText, FileCheck, Calendar, Mail, Github, Facebook, AlignJustify } from 'lucide-react';
import { SiFacebook, SiGoogle, SiGithub } from 'react-icons/si';
import { useToast } from '@/hooks/use-toast';
import { BrandLogo } from '@/components/ui/brand-logo';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  fullName: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      fullName: '',
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    // Pass the rememberMe value to the login mutation
    loginMutation.mutate({
      username: data.username,
      password: data.password,
      rememberMe: data.rememberMe || false
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // Handle social login/signup
  const handleSocialLogin = (provider: string) => {
    // In a real implementation, this would redirect to OAuth provider
    console.log(`${provider} login requested`);
    
    // For now, show a toast notification
    toast({
      title: "Social Login",
      description: `${provider} login will be implemented soon.`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        {/* Left side: Auth forms */}
        <div className="flex flex-col justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-nunito font-bold text-greenvoice-primary">
                {activeTab === 'login' ? 'Sign in to your account' : 'Create an account'}
              </CardTitle>
              <CardDescription className="font-montserrat text-gray-600">
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Fill in the details to create your GreenVoice account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                  <TabsTrigger value="login" className="data-[state=active]:bg-greenvoice-primary data-[state=active]:text-white font-montserrat">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-greenvoice-primary data-[state=active]:text-white font-montserrat">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                className="focus-visible:ring-greenvoice-primary/50" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Password</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-greenvoice-primary/50" type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 my-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-greenvoice-primary data-[state=checked]:border-greenvoice-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal text-sm">
                                Remember me
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Stay signed in on this device
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        variant="gradient"
                        className="w-full font-nunito"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-card px-2 text-muted-foreground text-xs">OR SIGN IN WITH</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("Google")}
                        >
                          <SiGoogle className="h-4 w-4 text-red-500" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">Google</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("Facebook")}
                        >
                          <SiFacebook className="h-4 w-4 text-blue-600" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">Facebook</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("GitHub")}
                        >
                          <SiGithub className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">GitHub</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Username</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-greenvoice-primary/50" placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Email</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-greenvoice-primary/50" type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-greenvoice-primary/50" placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-montserrat">Password</FormLabel>
                            <FormControl>
                              <Input className="focus-visible:ring-greenvoice-primary/50" type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        variant="gradient"
                        className="w-full font-nunito"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-card px-2 text-muted-foreground text-xs">OR SIGN UP WITH</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("Google")}
                        >
                          <SiGoogle className="h-4 w-4 text-red-500" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">Google</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("Facebook")}
                        >
                          <SiFacebook className="h-4 w-4 text-blue-600" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">Facebook</span>
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleSocialLogin("GitHub")}
                        >
                          <SiGithub className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:text-xs md:font-normal">GitHub</span>
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side: App info */}
        <div className="hidden lg:flex lg:flex-col justify-center">
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <BrandLogo size="xl" showText={true} />
              </div>
              <p className="text-xl text-gray-600 font-montserrat">The professional invoice solution for freelancers and businesses</p>
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-greenvoice-primary/10 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-greenvoice-primary" />
                </div>
                <div>
                  <h3 className="font-nunito font-bold text-greenvoice-primary">Professional Invoices</h3>
                  <p className="text-gray-600 font-montserrat text-sm">Create beautiful invoices with our easy-to-use templates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-greenvoice-primary/10 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-greenvoice-primary" />
                </div>
                <div>
                  <h3 className="font-nunito font-bold text-greenvoice-primary">Multiple Sharing Options</h3>
                  <p className="text-gray-600 font-montserrat text-sm">Share via email, social media, or generate PDF and images</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-greenvoice-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-greenvoice-primary" />
                </div>
                <div>
                  <h3 className="font-nunito font-bold text-greenvoice-primary">Recurring Invoices</h3>
                  <p className="text-gray-600 font-montserrat text-sm">Set up recurring invoices for regular clients</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-greenvoice-primary/10 p-3 rounded-full">
                  <FileCheck className="h-6 w-6 text-greenvoice-primary" />
                </div>
                <div>
                  <h3 className="font-nunito font-bold text-greenvoice-primary">Analytics & Tracking</h3>
                  <p className="text-gray-600 font-montserrat text-sm">Monitor your invoice performance and client engagement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}