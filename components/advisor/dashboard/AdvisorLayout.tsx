"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, User, LogOut, Menu, X, Home, Book, Users, Activity, BarChart2 } from 'lucide-react';
import NotificationsPopover from '@/components/advisor/dashboard/NotificationsPopover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

interface AdvisorLayoutProps {
  children: React.ReactNode;
  unreadNotifications?: number;
}

export default function AdvisorLayout({ children, unreadNotifications = 0 }: AdvisorLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Overview', href: '/dashboard/advisor', icon: Home },
    { name: 'Projects', href: '/dashboard/advisor/projects', icon: Book },
    { name: 'Groups', href: '/dashboard/advisor/groups', icon: Users },
    { name: 'Activities', href: '/dashboard/advisor/activities', icon: Activity },
    { name: 'Analytics', href: '/dashboard/advisor/analytics', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Advisor Dashboard</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon 
                      size={16} 
                      className={cn(
                        "mr-2",
                        isActive ? "text-blue-700" : "text-gray-500"
                      )} 
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <NotificationsPopover count={unreadNotifications} />
              
              <Link href="/dashboard/advisor/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <Mail size={20} />
                </Button>
              </Link>
              
              <Button variant="ghost" size="icon">
                <User size={20} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut size={20} />
              </Button>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t">
              <div className="space-y-1 px-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        isActive 
                          ? "bg-blue-50 text-blue-700" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon 
                        size={16} 
                        className={cn(
                          "mr-2",
                          isActive ? "text-blue-700" : "text-gray-500"
                        )} 
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 