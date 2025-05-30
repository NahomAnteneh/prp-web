"use client";

import React from 'react';
import EvaluatorNavbar from './EvaluatorNavbar';
import EvaluatorFooter from './EvaluatorFooter';

interface EvaluatorLayoutProps {
  children: React.ReactNode;
  unreadNotifications?: number;
}

export default function EvaluatorLayout({ children, unreadNotifications = 0 }: EvaluatorLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EvaluatorNavbar unreadNotifications={unreadNotifications} />
      
      {/* Page content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <EvaluatorFooter />
    </div>
  );
} 