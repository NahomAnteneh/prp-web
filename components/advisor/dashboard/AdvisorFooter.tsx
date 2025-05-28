"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail } from 'lucide-react';

export default function AdvisorFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/dashboard/advisor/help" className="text-sm text-gray-500 hover:text-gray-700">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/advisor/guidelines" className="text-sm text-gray-500 hover:text-gray-700">
                    Advising Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/advisor/faq" className="text-sm text-gray-500 hover:text-gray-700">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Contact</h3>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <a href="mailto:support@example.com" className="text-sm text-gray-500 hover:text-gray-700">
                    support@example.com
                  </a>
                </li>
                <li className="flex items-center">
                  <Github className="h-4 w-4 text-gray-500 mr-2" />
                  <a href="https://github.com/example" className="text-sm text-gray-500 hover:text-gray-700" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </li>
                <li className="flex items-center">
                  <Twitter className="h-4 w-4 text-gray-500 mr-2" />
                  <a href="https://twitter.com/example" className="text-sm text-gray-500 hover:text-gray-700" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} PRP Platform. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-gray-500">
                Platform designed for academic project review and advising.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 