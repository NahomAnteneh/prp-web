'use client';

import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SearchFilters, SearchType } from '@/components/search/SearchFilters';
import { SearchResultsList } from '@/components/search/SearchResultsList';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SearchSidebar } from '@/components/search/SearchSidebar';
import { SearchSummaryBar } from '@/components/search/SearchSummaryBar';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchLanding from './SearchLanding';

const typeToResultType = {
  projects: 'project',
  repositories: 'repository',
  groups: 'group',
  users: 'user',
  students: 'student',
  advisors: 'advisor',
} as const;

type Pagination = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type SidebarCounts = Record<string, number>;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [type, setType] = useState<SearchType>((searchParams.get('type') as SearchType) || 'projects');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [dept, setDept] = useState<string>(searchParams.get('dept') || '');
  const [batch, setBatch] = useState<string>(searchParams.get('batch') || '');
  const [role, setRole] = useState<string>(searchParams.get('role') || '');
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1);
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [sidebarCounts, setSidebarCounts] = useState<SidebarCounts>({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('best');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTimeMs, setSearchTimeMs] = useState<number | undefined>(undefined);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query && query.trim() !== '') {
      params.set('query', query);
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (dept) params.set('dept', dept);
      if (batch) params.set('batch', batch);
      if (role) params.set('role', role);
      if (page > 1) params.set('page', String(page));
      if (sortBy && sortBy !== 'best') params.set('sortBy', sortBy);
      if (sortOrder && sortBy !== 'best') params.set('sortOrder', sortOrder);
      router.replace(`/search?${params.toString()}`);
    } else {
      router.replace('/search');
    }
  }, [query, type, status, dept, batch, role, page, sortBy, sortOrder, router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (dept) params.set('dept', dept);
    if (batch) params.set('batch', batch);
    if (role) params.set('role', role);
    if (page) params.set('page', String(page));
    params.set('limit', '10');
    if (sortBy && sortBy !== 'best') params.set('sortBy', sortBy);
    if (sortOrder && sortBy !== 'best') params.set('sortOrder', sortOrder);
    const start = performance.now();
    fetch(`/api/search?${params.toString()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Search request failed: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setResults(data.data || []);
        setPagination(data.pagination || null);
        setSidebarCounts(data.meta?.sidebarCounts || {});
        setSearchTimeMs(Math.round(performance.now() - start));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Search error:', error);
        setLoading(false);
      });
  }, [query, type, status, dept, batch, role, page, sortBy, sortOrder]);

  // Reset page to 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [query, type, status, dept, batch, role]);

  return (
    <div className="flex w-full max-w-7xl mx-auto px-4 py-8">
      {(!query || query.trim() === '') ? (
        <SearchLanding setQuery={setQuery} setType={(t) => setType(t as SearchType)} />
      ) : (
        <>
          <SearchSidebar
            counts={sidebarCounts}
            currentType={type}
            onTypeChange={t => setType(t as SearchType)}
          />
          <main className="flex-1 pl-8">
            <div className="mb-4">
              <SearchBar className="w-full" />
            </div>
            <SearchSummaryBar
              totalCount={pagination?.totalCount || 0}
              searchTimeMs={searchTimeMs}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(by, order) => {
                setSortBy(by);
                setSortOrder(order);
              }}
            />
            <div className="mb-6">
              <SearchFilters
                type={type}
                setType={setType}
                status={type === 'projects' ? status : undefined}
                setStatus={type === 'projects' ? setStatus : undefined}
                dept={['students', 'advisors', 'users'].includes(type) ? dept : undefined}
                setDept={['students', 'advisors', 'users'].includes(type) ? setDept : undefined}
                batch={['students', 'users'].includes(type) ? batch : undefined}
                setBatch={['students', 'users'].includes(type) ? setBatch : undefined}
                role={type === 'users' ? role : undefined}
                setRole={type === 'users' ? setRole : undefined}
              />
            </div>
            <SearchResultsList
              type={typeToResultType[type]}
              results={results}
              loading={loading}
            />
            {pagination && (
              <SearchPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
} 