"use client";

import React from 'react';
import AdvisorNavbar from './AdvisorNavbar';
import AdvisorFooter from './AdvisorFooter';

interface AdvisorLayoutProps {
  children: React.ReactNode;
  unreadNotifications?: number;
}

export default function AdvisorLayout({ children, unreadNotifications = 0 }: AdvisorLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdvisorNavbar unreadNotifications={unreadNotifications} />
      
      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <AdvisorFooter />
    </div>
  );
} 