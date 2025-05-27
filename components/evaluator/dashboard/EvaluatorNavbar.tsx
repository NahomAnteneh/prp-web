"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut, Menu, X, Settings, GraduationCap, Mail } from 'lucide-react';
// Assuming NotificationsPopover can be used or adapted. 
// If it's advisor-specific, a new evaluator version would be needed.
import NotificationsPopover from '@/components/advisor/dashboard/NotificationsPopover'; 
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // For potential cn usage if needed for active links in mobile

interface EvaluatorNavbarProps {
  unreadNotifications?: number;
  // Add username or user object if needed for display, similar to AdvisorNavbar if profile link is dynamic
  // For now, assuming /profile and /settings are static links for evaluator
}

export default function EvaluatorNavbar({ unreadNotifications = 0 }: EvaluatorNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.userId; // Get userId for dynamic profile link

  // Mobile navigation items (not part of the main tabs in EvaluatorDashboard)
  const mobileOnlyNavigationItems = [
    { name: 'Messages', href: '/dashboard/evaluator/messages', icon: Mail },
    { name: 'Settings', href: '/settings', icon: Settings }, // Adjusted to a generic /settings
  ];

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                {/* Using GraduationCap like AdvisorNavbar for consistency */}
                <GraduationCap className="h-4 w-4 text-cyan-600" /> 
              </span>
              <h1 className="text-xl font-bold">PRP</h1>
            </Link>
          </div>

          {/* Desktop Navigation Links - Removed as main navigation is via Dashboard Tabs */}
          {/* <nav className="ml-10 flex items-center space-x-4">
            ...
          </nav> */}

          {/* Spacer to push User Actions to the right */}
          <div className="flex-grow md:block hidden"></div>

          {/* User Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-1.5">
            <NotificationsPopover count={unreadNotifications} />

            {/* Profile/User ID Button - Make it dynamic if userId is available */}
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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

        {/* Mobile Navigation Menu */}
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