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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdvisorNavbar unreadNotifications={unreadNotifications} />
      
      {/* Page content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow">
        {children}
      </main>
      
      <AdvisorFooter />
    </div>
  );
} 