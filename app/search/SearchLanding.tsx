import React from 'react';
import { SearchBar } from '@/components/SearchBar';

interface SearchLandingProps {
  setQuery: (q: string) => void;
  setType: (t: string) => void;
}

export default function SearchLanding({ setQuery, setType }: SearchLandingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <h1 className="text-4xl font-bold mb-8 mt-12">Search</h1>
      <div className="w-full max-w-xl mb-6">
        <SearchBar className="w-full" onSearch={(q, t) => { setQuery(q); if (t) setType(t); }} />
      </div>
      <div className="mb-4 text-gray-500">Tip: Start typing to search for projects, users, and more!</div>
      {/* Placeholder SVG illustration */}
      <div className="mt-8">
        <svg width="320" height="180" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="160" cy="150" rx="120" ry="20" fill="#E5E7EB" />
          <rect x="90" y="40" width="140" height="80" rx="20" fill="#F3F4F6" />
          <circle cx="160" cy="80" r="30" fill="#A5B4FC" />
          <rect x="140" y="70" width="40" height="20" rx="8" fill="#6366F1" />
        </svg>
      </div>
    </div>
  );
} 