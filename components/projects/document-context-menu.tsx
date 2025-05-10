'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Download,
  Trash2,
  Share,
  FileEdit,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentPreview } from './document-preview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Updated to match API schema
interface Document {
  id: string;
  title: string; // API uses title instead of name
  content?: string;
  type?: string;
  url?: string;
  createdAt?: string;
  category?: string;
}

interface DocumentContextMenuProps {
  document: Document;
  onDelete: (id: string) => void;
}

export function DocumentContextMenu({ document, onDelete }: DocumentContextMenuProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Ensure document has all required properties
  const safeDocument = {
    id: document?.id || 'unknown',
    title: document?.title || 'Unnamed Document',
    type: document?.type || '',
    url: document?.url || '#'
  };

  const handleDownload = async () => {
    try {
      if (!safeDocument.url || safeDocument.url === '#') {
        toast.error('Document URL is not available');
        return;
      }
      
      // Check if this is a temporary blob URL
      if (safeDocument.url.startsWith('blob:')) {
        // For blob URLs, we open in a new tab instead of direct download
        // as direct download from blob URLs can be unreliable
        window.open(safeDocument.url, '_blank');
        toast.success('Opening document in new tab');
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
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      onDelete(safeDocument.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleShare = () => {
    // Copy document URL to clipboard
    if (!safeDocument.url || safeDocument.url === '#') {
      toast.error('Document URL is not available');
      return;
    }
    
    navigator.clipboard.writeText(safeDocument.url)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleView = () => {
    if (!safeDocument.url || safeDocument.url === '#') {
      toast.error('Document preview is not available');
      return;
    }
    setIsPreviewOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share className="mr-2 h-4 w-4" />
            Share Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)} 
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentPreview 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        document={safeDocument} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{safeDocument.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 