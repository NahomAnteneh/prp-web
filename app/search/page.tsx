'use client';

import React, { useState, useEffect } from 'react';
// import { SearchBar } from '@/components/SearchBar';
import { SearchFilters, SearchType } from '@/components/search/SearchFilters';
import { SearchResultsList } from '@/components/search/SearchResultsList';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SearchSidebar } from '@/components/search/SearchSidebar';
import { SearchSummaryBar } from '@/components/search/SearchSummaryBar';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchLanding from './SearchLanding';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import NavBar from '@/components/student/navbar';

const typeToResultType = {
  projects: 'project',
  repositories: 'repository',
  groups: 'group',
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
  const { data: session, status } = useSession();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [type, setType] = useState<SearchType>((searchParams.get('type') as SearchType) || 'projects');
  const [searchStatus, setStatus] = useState<string>(searchParams.get('status') || '');
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

  const isVisitor = status === 'authenticated';

  // Sync state with URL params when searchParams change
  useEffect(() => {
    const newQuery = searchParams.get('query') || '';
    const newType = (searchParams.get('type') as SearchType) || 'projects';
    const newStatus = searchParams.get('status') || '';
    const newDept = searchParams.get('dept') || '';
    const newBatch = searchParams.get('batch') || '';
    const newRole = searchParams.get('role') || '';
    const newPage = Number(searchParams.get('page')) || 1;
    const newSortBy = searchParams.get('sortBy') || 'best';
    const newSortOrder = searchParams.get('sortOrder') || 'desc';

    setQuery(newQuery);
    setType(newType);
    setStatus(newStatus);
    setDept(newDept);
    setBatch(newBatch);
    setRole(newRole);
    setPage(newPage);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, [searchParams]);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query && query.trim() !== '') {
      params.set('query', query);
      if (type) params.set('type', type);
      if (searchStatus) params.set('status', searchStatus);
      if (dept) params.set('dept', dept);
      if (batch) params.set('batch', batch);
      if (role) params.set('role', role);
      if (page > 1) params.set('page', String(page));
      if (sortBy && sortBy !== 'best') params.set('sortBy', sortBy);
      if (sortOrder && sortBy !== 'best') params.set('sortOrder', sortOrder);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    } else {
      router.replace('/search', { scroll: false });
    }
  }, [query, type, searchStatus, dept, batch, role, page, sortBy, sortOrder, router]);

  // Fetch data when query or filters change
  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      setPagination(null);
      setSidebarCounts({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.set('query', query);
    if (type) params.set('type', type);
    if (searchStatus) params.set('status', searchStatus);
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
      .catch(error => {
        console.error('Search error:', error);
        setResults([]);
        setPagination(null);
        setSidebarCounts({});
        setLoading(false);
      });
  }, [query, type, searchStatus, dept, batch, role, page, sortBy, sortOrder]);

  // Reset page to 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [query, type, searchStatus, dept, batch, role]);

  return (
    <>
      {isVisitor ? <NavBar /> : <Navbar />}
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
              {/* <div className="mb-4">
                <SearchBar
                  className="w-full"
                  defaultValue={query}
                  onSearch={(newQuery, newType) => {
                    setQuery(newQuery);
                    setType(newType as SearchType || 'projects');
                    setPage(1);
                  }}
                />
              </div> */}
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
                  status={type === 'projects' ? searchStatus : undefined}
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
    </>
  );
}