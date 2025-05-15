import React from 'react';
import { Spinner } from '@/components/ui/spinner';

const categories = [
  { key: 'repositories', label: 'Repositories' },
  { key: 'projects', label: 'Projects' },
  { key: 'groups', label: 'Groups' },
  { key: 'students', label: 'Students' },
  { key: 'advisors', label: 'Advisors' },
];

interface SearchSidebarProps {
  counts: Record<string, number>;
  currentType: string;
  onTypeChange: (type: string) => void;
  loading?: boolean;
}

export function SearchSidebar({ counts, currentType, onTypeChange, loading = false }: SearchSidebarProps) {
  return (
    <aside className="w-60 pr-6 border-r border-gray-200 dark:border-gray-800">
      <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
      <nav className="flex flex-col gap-1">
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-4 w-4" />
          </div>
        ) : (
          categories.map(cat => (
            <button
              key={cat.key}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${currentType === cat.key ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'}`}
              onClick={() => onTypeChange(cat.key)}
              type="button"
              disabled={loading}
            >
              <span>{cat.label}</span>
              <span className={`ml-2 inline-block min-w-[2em] text-xs px-2 py-0.5 rounded-full ${currentType === cat.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{counts[cat.key] ?? 0}</span>
            </button>
          ))
        )}
      </nav>
      {/* Add more filter sections here if needed */}
    </aside>
  );
} 