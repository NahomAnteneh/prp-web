import React from 'react';
import { SearchResultCard, SearchResultType } from './SearchResultCard';
import { Spinner } from '@/components/ui/spinner';

interface SearchResultsListProps {
  type: SearchResultType;
  results: any[];
  loading?: boolean;
}

export function SearchResultsList({ type, results, loading }: SearchResultsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (!results || results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">No results found.</div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {results.map((item, idx) => {
        // Generate a unique key based on the result type
        let key: string | number = idx; // Default fallback
        if (item.id) key = item.id;
        else if (item.userId) key = item.userId;
        else if (type === 'repository' && item.name && item.groupUserName) {
          key = `${item.groupUserName}-${item.name}`; 
        }
        return <SearchResultCard key={key} type={type} data={item} />;
      })}
    </div>
  );
} 