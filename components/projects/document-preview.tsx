'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    type: string;
    url: string;
  } | null;
}

export function DocumentPreview({ isOpen, onClose, document }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!document) return null;

  // Ensure document has all required properties
  const safeDocument = {
    id: document.id || 'unknown',
    title: document.title || 'Unnamed Document',
    type: document.type || '',
    url: document.url || '#'
  };

  const isPDF = safeDocument.type.includes('pdf');
  const isImage = safeDocument.type.includes('image');
  const isText = safeDocument.type.includes('text') || safeDocument.type.includes('plain');
  
  const handleDownload = () => {
    try {
      if (!safeDocument.url || safeDocument.url === '#') {
        console.error('Document URL is not available');
        return;
      }
      
      // Check if this is a temporary blob URL
      if (safeDocument.url.startsWith('blob:')) {
        // For blob URLs, we open in a new tab instead of direct download
        // as direct download from blob URLs can be unreliable
        window.open(safeDocument.url, '_blank');
        return;
      }
      
      // For regular URLs
      const link = document.createElement('a');
      link.href = safeDocument.url;
      link.download = safeDocument.title;
      link.target = '_blank'; // Add target for better compatibility
      link.rel = 'noopener noreferrer'; // Security best practice
      document.body.appendChild(link);
      link.click();
      
      // Use setTimeout to ensure the click event is processed before removing
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Error during download:', error);
    }
  };

  const renderContent = () => {
    if (!safeDocument.url || safeDocument.url === '#') {
      return (
        <div className="p-6 h-full">
          <div className="bg-muted/20 p-4 rounded-md h-full flex items-center justify-center">
            <p className="text-center text-muted-foreground">
              Document preview is not available.
            </p>
          </div>
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe 
          src={`${safeDocument.url}#toolbar=0`} 
          className="w-full h-full" 
          onLoad={() => setIsLoading(false)}
        />
      );
    } else if (isImage) {
      return (
        <div className="flex items-center justify-center h-full bg-muted/20 p-4">
          <img 
            src={safeDocument.url} 
            alt={safeDocument.title}
            className="max-h-full max-w-full object-contain" 
            onLoad={() => setIsLoading(false)}
          />
        </div>
      );
    } else {
      return (
        <div className="p-6 h-full">
          <div className="bg-muted/20 p-4 rounded-md h-full flex items-center justify-center">
            <p className="text-center text-muted-foreground">
              Preview not available for this file type.<br />
              <Button variant="link" onClick={handleDownload} className="mt-2">
                Download to view
              </Button>
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">{safeDocument.title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-0">
          {renderContent()}
          {isLoading && (isPDF || isImage) && safeDocument.url !== '#' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 