import React from 'react';
import Link from 'next/link';

export default function EvaluatorFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/help" className="text-gray-500 hover:text-gray-600">
              Help Center
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-600">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-600">
              Privacy Policy
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500">
              &copy; {currentYear} Bahir Dar Institute of Technology. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 