'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileIcon, 
  FileText, 
  FileImage, 
  FileArchive, 
  Plus, 
  Filter, 
  Loader2,
  MoreHorizontal,
  X,
  FilePlus2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import { DocumentContextMenu } from './document-context-menu';
import { MultiFileUploadModal } from './multi-file-upload-modal';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Updated to match API schema in route.ts
interface Document {
  id: string;
  title: string; // API uses title instead of name
  content?: string;
  type?: string;
  url?: string;
  createdAt: string;
  uploadedBy?: User;
  category?: string;
  size?: number;
}

interface ProjectDocumentsProps {
  ownerId: string;
  projectId: string;
}

export function ProjectDocuments({ ownerId, projectId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isMultiUploadOpen, setIsMultiUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentDetails, setDocumentDetails] = useState({
    title: '', // Changed from name to title
    description: '',
    category: 'general'
  });
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/documents`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if we got the placeholder response
        if (data.message === 'Documents feature coming soon' && Array.isArray(data.documents)) {
          setDocuments([]);
          return;
        }
        
        // If we get actual documents, make sure they match our expected format
        const sanitizedDocuments = Array.isArray(data) ? data.map((doc: any) => ({
          id: doc.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          title: doc.title || doc.name || 'Unnamed Document',
          content: doc.content || '',
          type: doc.type || 'application/octet-stream',
          size: doc.size || 0,
          url: doc.url || '#',
          createdAt: doc.createdAt || new Date().toISOString(),
          uploadedBy: doc.uploadedBy ? {
            userId: doc.uploadedBy.userId || 'unknown',
            firstName: doc.uploadedBy.firstName || 'Unknown',
            lastName: doc.uploadedBy.lastName || 'User',
            email: doc.uploadedBy.email || ''
          } : undefined,
          category: doc.category || 'general'
        })) : [];
        
        setDocuments(sanitizedDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [ownerId, projectId]);

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFiles(files);
      // Auto-fill the title field with the file name (without extension)
      const fileName = files[0].name.replace(/\.[^/.]+$/, "");
      setDocumentDetails({ ...documentDetails, title: fileName });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      // Create FormData object to send file and metadata
      const formData = new FormData();
      const file = selectedFiles[0];
      
      // Add the file
      formData.append('file', file);
      
      // Add metadata
      formData.append('title', documentDetails.title);
      formData.append('content', documentDetails.description || '');
      formData.append('category', documentDetails.category || 'general');
      
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
        throw new Error(`Failed to upload document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle placeholder response
      if (data.message === 'Document creation feature coming soon') {
        toast.info('Document uploaded successfully (preview mode)');
        
        // Create a temporary document object for the UI
        const tempDocument: Document = {
          id: data.document?.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          title: documentDetails.title,
          content: documentDetails.description,
          type: file.type,
          createdAt: new Date().toISOString(),
          category: documentDetails.category,
          size: file.size,
          url: URL.createObjectURL(file) // Create temporary URL for preview
        };
        
        setDocuments([tempDocument, ...documents]);
        setIsUploadDialogOpen(false);
        return;
      }
      
      const newDocument = data.document || data;
      setDocuments([newDocument, ...documents]);
      
      toast.success('Document uploaded successfully');
      
      // Reset form
      setSelectedFiles([]);
      setDocumentDetails({ title: '', description: '', category: 'general' });
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Check if this is a temporary or placeholder document
      const isTemporaryDocument = documentId.startsWith('temp-') || 
                                 documentId === 'placeholder-id' || 
                                 documentId === 'sample-id' ||
                                 documentId === 'unknown';
      
      // Also check if the document exists in our state but not on the server
      const document = documents.find(doc => doc.id === documentId);
      const isLocalOnlyDocument = document && 
                                 (document.id.includes('placeholder') || 
                                  document.id.includes('sample') || 
                                  document.id.includes('temp-'));
      
      if (isTemporaryDocument || isLocalOnlyDocument) {
        // For temporary/placeholder documents, just remove from state
        const documentToRemove = document;
        
        // Revoke the blob URL if it exists to prevent memory leaks
        if (documentToRemove?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(documentToRemove.url);
        }
        
        setDocuments(documents.filter(doc => doc.id !== documentId));
        toast.success('Document removed');
        return;
      }
      
      // For regular documents, call the API
      try {
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/documents/${documentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // If we get a 404, the document might not exist on the server but exists in our state
          if (response.status === 404) {
            // Just remove it from our state
            setDocuments(documents.filter(doc => doc.id !== documentId));
            toast.success('Document removed');
            return;
          }
          
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.message || `Failed to delete document: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        // Remove the document from the state
        setDocuments(documents.filter(doc => doc.id !== documentId));
        toast.success('Document deleted successfully');
      } catch (apiError) {
        console.error('API Error deleting document:', apiError);
        toast.error(apiError instanceof Error ? apiError.message : 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error in delete document handler:', error);
      toast.error('An unexpected error occurred while deleting the document');
    }
  };

  const handleMultiUploadSuccess = (newDocuments: Document[]) => {
    setDocuments([...newDocuments, ...documents]);
  };

  const getFileIcon = (type: string = '') => {
    if (type?.includes('pdf')) {
      return <FileText className="h-7 w-7 text-red-500" />;
    } else if (type?.includes('image')) {
      return <FileImage className="h-7 w-7 text-blue-500" />;
    } else if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar')) {
      return <FileArchive className="h-7 w-7 text-yellow-500" />;
    } else if (type?.includes('text') || type?.includes('doc') || type?.includes('ppt') || type?.includes('xls')) {
      return <FileText className="h-7 w-7 text-green-500" />;
    } else {
      return <FileIcon className="h-7 w-7 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = activeCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === activeCategory);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Access and manage project documents and files.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsMultiUploadOpen(true)}
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Batch Upload
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <Label htmlFor="file">File</Label>
                  <FileUpload 
                    onChange={handleFileChange}
                    value={selectedFiles}
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
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="Title for this document"
                    value={documentDetails.title}
                    onChange={(e) => setDocumentDetails({ ...documentDetails, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this document"
                    value={documentDetails.description}
                    onChange={(e) => setDocumentDetails({ ...documentDetails, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={documentDetails.category}
                    onChange={(e) => setDocumentDetails({ ...documentDetails, category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="report">Report</option>
                    <option value="diagram">Diagram</option>
                    <option value="proposal">Proposal</option>
                    <option value="presentation">Presentation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedFiles.length === 0}>Upload</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="mt-4 text-sm text-muted-foreground">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-red-500">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Upload project documentation, reports, diagrams, or other files for your team.
            </p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setIsMultiUploadOpen(true)}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Batch Upload
              </Button>
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Tabs 
                defaultValue="all" 
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="report">Reports</TabsTrigger>
                  <TabsTrigger value="diagram">Diagrams</TabsTrigger>
                  <TabsTrigger value="presentation">Presentations</TabsTrigger>
                </TabsList>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <div className="space-y-4 mt-4">
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No documents found in this category</p>
                    </div>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-start p-4 border rounded-lg">
                        <div className="mr-4 flex items-center justify-center">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium truncate">{doc.title}</h3>
                              {doc.content && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.content}
                                </p>
                              )}
                            </div>
                            <DocumentContextMenu document={doc} onDelete={handleDeleteDocument} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 mt-2 text-xs text-muted-foreground">
                            {doc.uploadedBy && (
                              <span>Uploaded by {doc.uploadedBy?.firstName || 'Unknown'} {doc.uploadedBy?.lastName || 'User'}</span>
                            )}
                            <span>{doc.createdAt ? format(new Date(doc.createdAt), 'MMM d, yyyy') : 'Unknown date'}</span>
                            {doc.size !== undefined && (
                              <span>{formatFileSize(doc.size)}</span>
                            )}
                            {doc.category && (
                              <Badge variant="outline" className="text-xs">
                                {doc.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tabs>
            </div>
          </>
        )}
      </CardContent>

      {/* Multi-file upload modal */}
      <MultiFileUploadModal 
        isOpen={isMultiUploadOpen}
        onClose={() => setIsMultiUploadOpen(false)}
        ownerId={ownerId}
        projectId={projectId}
        onSuccess={handleMultiUploadSuccess}
      />
    </Card>
  );
} 