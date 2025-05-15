import React from 'react';
import { Button } from '@/components/ui/button';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function SearchPagination({ currentPage, totalPages, onPageChange, disabled = false }: SearchPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = [];
  
  // Calculate page range to display (max 5 buttons)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust start if end is maxed
  if (endPage === totalPages) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button 
        variant="outline" 
        size="sm" 
        disabled={currentPage === 1 || disabled} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      
      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={disabled}
          >
            1
          </Button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
          disabled={disabled}
        >
          {page}
        </Button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={disabled}
          >
            {totalPages}
          </Button>
        </>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        disabled={currentPage === totalPages || disabled} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
} 