import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Bell, LogIn, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const Header = () => {
  const [location] = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, logoutMutation, isPremium } = useAuth();

  // Navigation links
  const navLinks = [
    { href: '/create-invoice', label: 'Create Invoice' },
    { href: '/templates', label: 'Templates' },
    { href: '/history', label: 'History' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/settings', label: 'Settings' },
  ];

  const isActive = (path: string) => location === path;

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-primary font-bold text-xl">
                Invoice<span className="text-accent">Flow</span>
              </Link>
            </div>
            
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`${
                    isActive(link.href)
                      ? 'border-primary text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Premium badge/button */}
            {user && (
              <Link href="/premium">
                <Button 
                  variant={isPremium ? "outline" : "default"}
                  size="sm"
                  className={`hidden sm:flex items-center ${isPremium ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100' : ''}`}
                >
                  <Crown className={`h-4 w-4 ${isPremium ? 'text-yellow-500' : 'text-white'} mr-1`} />
                  {isPremium ? 'Premium' : 'Upgrade'}
                </Button>
              </Link>
            )}
            
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="mr-1">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <span className="sr-only">Notifications</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-primary text-white">
                      {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <span className="block text-sm">{user.fullName || user.username}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/premium">
                        <div className="flex items-center">
                          <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                          {isPremium ? 'Premium Status' : 'Upgrade to Premium'}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Profile Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="flex items-center">
                <Link href="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
          
          <div className="-mr-2 flex items-center md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="inline-flex items-center justify-center"
                >
                  <Menu className="h-6 w-6 text-gray-400" />
                  <span className="sr-only">Open main menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="pt-12">
                <div className="flex flex-col space-y-4 pt-4">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`${
                        isActive(link.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-600 hover:bg-gray-50'
                      } px-3 py-2 rounded-md text-base font-medium`}
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {/* Mobile premium link */}
                  {user && (
                    <Link
                      href="/premium"
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-yellow-700 bg-yellow-50"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                      {isPremium ? 'Premium Status' : 'Upgrade to Premium'}
                    </Link>
                  )}
                  
                  {/* Mobile logout */}
                  {user && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        handleLogout();
                        setIsSheetOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
