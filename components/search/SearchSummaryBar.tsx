import React from 'react';
import { Spinner } from '@/components/ui/spinner';

interface SearchSummaryBarProps {
  totalCount: number;
  searchTimeMs?: number;
  sortBy: string;
  sortOrder: string;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  loading?: boolean;
}

const sortOptions = [
  { value: 'best', label: 'Best match' },
  { value: 'updatedAt-desc', label: 'Recently updated' },
  { value: 'createdAt-desc', label: 'Recently created' },
  { value: 'createdAt-asc', label: 'Oldest' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
];

export function SearchSummaryBar({ 
  totalCount, 
  searchTimeMs, 
  sortBy, 
  sortOrder, 
  onSortChange,
  loading = false 
}: SearchSummaryBarProps) {
  const currentSort = sortOptions.find(opt => {
    if (opt.value === 'best') return sortBy === 'best';
    const [field, order] = opt.value.split('-');
    return sortBy === field && sortOrder === order;
  })?.value || 'best';

  return (
    <div className="flex items-center justify-between border-b pb-2 mb-4">
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner className="h-3 w-3" /> 
            <span>Loading results...</span>
          </div>
        ) : (
          <>
            <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> results
            {searchTimeMs !== undefined && (
              <span className="ml-2">({searchTimeMs} ms)</span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-xs text-muted-foreground mr-1">Sort by:</label>
        <select
          id="sort"
          className="border rounded px-2 py-1 text-sm"
          value={currentSort}
          onChange={e => {
            const val = e.target.value;
            if (val === 'best') {
              onSortChange('best', 'desc');
            } else {
              const [field, order] = val.split('-');
              onSortChange(field, order);
            }
          }}
          disabled={loading}
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
} 