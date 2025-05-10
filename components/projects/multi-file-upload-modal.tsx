'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Updated to match API schema
interface Document {
  id: string;
  title: string;
  content?: string;
  type?: string;
  url?: string;
  createdAt: string;
  category?: string;
  size?: number;
}

interface MultiFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  projectId: string;
  onSuccess: (newDocuments: Document[]) => void;
}

export function MultiFileUploadModal({ 
  isOpen, 
  onClose, 
  ownerId, 
  projectId, 
  onSuccess 
}: MultiFileUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setErrors([]);
    
    const uploadedDocuments: Document[] = [];
    const failedUploads: string[] = [];
    const totalFiles = files.length;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        
        try {
          // Create FormData object for each file
          const formData = new FormData();
          
          // Add the file
          formData.append('file', file);
          
          // Add metadata
          formData.append('title', fileName);
          formData.append('content', '');
          formData.append('category', category);
          
          // Add file type
          formData.append('type', file.type);
          
          const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/documents`, {
            method: 'POST',
            body: formData,
            // Important: Do not set Content-Type header, browser will set it with boundary
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to upload ${file.name}: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          
          // Handle placeholder response
          if (data.message === 'Document creation feature coming soon') {
            // Create a temporary document object for the UI
            const tempDocument: Document = {
              id: data.document?.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
              title: fileName,
              content: '',
              type: file.type,
              createdAt: new Date().toISOString(),
              category: category,
              size: file.size,
              url: URL.createObjectURL(file) // Create temporary URL for preview
            };
            uploadedDocuments.push(tempDocument);
          } else {
            // Use the actual document data
            const newDocument = data.document || data;
            uploadedDocuments.push(newDocument);
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failedUploads.push(file.name);
          setErrors(prev => [...prev, `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        }
        
        // Update progress even if upload failed
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      
      if (uploadedDocuments.length > 0) {
        if (failedUploads.length > 0) {
          toast.warning(`Uploaded ${uploadedDocuments.length} of ${totalFiles} documents. ${failedUploads.length} failed.`);
        } else {
          toast.success(`Successfully uploaded ${uploadedDocuments.length} documents`);
        }
        
        onSuccess(uploadedDocuments);
        
        // Reset form and close modal if all uploads were successful
        if (failedUploads.length === 0) {
          setFiles([]);
          setCategory('general');
          setErrors([]);
          onClose();
        }
      } else {
        toast.error('All uploads failed');
      }
    } catch (error) {
      console.error('Error in batch upload process:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setCategory('general');
      setErrors([]);
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Multiple Documents</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-4">
            <Label>Files</Label>
            <FileUpload 
              onChange={handleFileChange}
              value={files}
              multiple={true}
              maxFiles={10}
              accept={{
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-powerpoint': ['.ppt'],
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                'application/zip': ['.zip'],
                'application/x-rar-compressed': ['.rar'],
                'text/plain': ['.txt']
              }}
              disabled={isUploading}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category for all files</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isUploading}
            >
              <option value="general">General</option>
              <option value="report">Report</option>
              <option value="diagram">Diagram</option>
              <option value="proposal">Proposal</option>
              <option value="presentation">Presentation</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {isUploading && (
            <div className="w-full bg-muted rounded-full h-2.5 mt-4">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
              <p className="text-xs text-center mt-1 text-muted-foreground">
                Uploading {progress}%
              </p>
            </div>
          )}
          
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Upload Errors:</h4>
              <ul className="text-xs text-red-700 dark:text-red-400 list-disc pl-4 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={files.length === 0 || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload All'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 