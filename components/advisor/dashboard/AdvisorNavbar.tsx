"use client";

import React, { useState } from 'react';
import Link from 'next/link';
// import { usePathname } from 'next/navigation'; // No longer needed for these items
import { Mail, User, LogOut, Menu, X, /*Book,*/ Settings, GraduationCap } from 'lucide-react'; // Home, Users, Activity, BarChart2 removed, Book commented, GraduationCap added
import NotificationsPopover from '@/components/advisor/dashboard/NotificationsPopover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';

interface AdvisorNavbarProps {
  unreadNotifications?: number;
}

export default function AdvisorNavbar({ unreadNotifications = 0 }: AdvisorNavbarProps) {
  // const pathname = usePathname(); // No longer needed for navigationItems
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.userId;

  // const navigationItems = [ // Removed redundant navigation items
  //   { name: 'Overview', href: '/dashboard/advisor', icon: Home },
  //   { name: 'Projects', href: '/dashboard/advisor/projects', icon: Book },
  //   { name: 'Groups', href: '/dashboard/advisor/groups', icon: Users },
  //   { name: 'Activities', href: '/dashboard/advisor/activities', icon: Activity },
  //   { name: 'Analytics', href: '/dashboard/advisor/analytics', icon: BarChart2 },
  // ];

  // Mobile navigation items that are NOT part of the main tabs
  const mobileOnlyNavigationItems = [
    { name: 'Messages', href: '/dashboard/advisor/messages', icon: Mail },
    { name: 'Settings', href: '/dashboard/advisor/settings', icon: Settings },
  ];

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-cyan-600" />
              </span>
              <h1 className="text-xl font-bold">PRP</h1>
            </Link>
          </div>

          {/* Desktop Navigation - Removed, as tabs handle this now */}
          {/* <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || 
                              (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard/advisor');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon 
                    size={16} 
                    className={cn(
                      "mr-2",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav> */}

          {/* Spacer to push User Actions to the right if no desktop nav items */}
          <div className="flex-grow md:block hidden"></div>

          {/* User Actions - Directly in the bar for desktop */}
          <div className="hidden md:flex items-center space-x-1.5">
            <NotificationsPopover count={unreadNotifications} />

            <Link href="/dashboard/advisor/messages" passHref legacyBehavior>
              <Button variant="ghost" size="icon" aria-label="Messages">
                <Mail size={20} />
              </Button>
            </Link>

            {/* Profile/User ID Button */}
            {userId ? (
              <Link href={`/${userId}`} passHref legacyBehavior>
                <Button variant="ghost" className="items-center">
                  <User size={18} className="mr-1.5" />
                  Profile
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" className="items-center" disabled>
                <User size={18} className="mr-1.5" />
                Profile
              </Button>
            )}

            {/* Direct Logout Button */}
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="items-center text-red-600 hover:text-red-700 hover:bg-red-100/50"
            >
              <LogOut size={18} className="mr-1.5" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button (visible only on md and down) */}
          <div className="md:hidden flex items-center">
            {/* Moved NotificationsPopover inside for mobile consistency before menu button */}
            <NotificationsPopover count={unreadNotifications} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t">
            <div className="space-y-1 px-2">
              {/* Dynamic Profile Link for Mobile Menu */}
              {userId ? (
                <Link
                  href={`/${userId}`}
                  className="flex items-center px-3 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={20} className="mr-3 text-muted-foreground" />
                  Profile
                </Link>
              ) : (
                 <button
                    className="flex items-center px-3 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted hover:text-foreground w-full text-left opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <User size={20} className="mr-3 text-muted-foreground" />
                    Profile
                </button>
              )}

              {mobileOnlyNavigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-3 text-base font-medium rounded-md text-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={20} className="mr-3 text-muted-foreground" />
                  {item.name}
                </Link>
              ))}

              {/* Logout Button for Mobile Menu */}
              <div className="border-t mt-2 pt-2">
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center px-3 py-3 text-base font-medium rounded-md text-red-600 hover:bg-red-100/50 hover:text-red-700 w-full text-left"
                >
                  <LogOut size={20} className="mr-3 text-muted-foreground" />
                  Log out
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
} 