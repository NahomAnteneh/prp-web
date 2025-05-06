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
  MoreHorizontal 
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: User;
  description?: string;
  category?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentDetails, setDocumentDetails] = useState({
    name: '',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/documents`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error instanceof Error ? error.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [ownerId, projectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-fill the name field with the file name (without extension)
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setDocumentDetails({ ...documentDetails, name: fileName });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    try {
      // Create FormData object to send file and metadata
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentDetails.name);
      formData.append('description', documentDetails.description);
      formData.append('category', documentDetails.category);
      
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload document: ${response.statusText}`);
      }

      const newDocument = await response.json();
      setDocuments([newDocument, ...documents]);
      
      // Reset form
      setSelectedFile(null);
      setDocumentDetails({ name: '', description: '', category: 'general' });
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload document');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="h-7 w-7 text-red-500" />;
    } else if (type.includes('image')) {
      return <FileImage className="h-7 w-7 text-blue-500" />;
    } else if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {
      return <FileArchive className="h-7 w-7 text-yellow-500" />;
    } else if (type.includes('text') || type.includes('doc') || type.includes('ppt') || type.includes('xls')) {
      return <FileText className="h-7 w-7 text-green-500" />;
    } else {
      return <FileIcon className="h-7 w-7 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Access and manage project documents and files.
          </CardDescription>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  placeholder="Name for this document"
                  value={documentDetails.name}
                  onChange={(e) => setDocumentDetails({ ...documentDetails, name: e.target.value })}
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
              <div className="flex justify-end">
                <Button type="submit" disabled={!selectedFile}>Upload</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <Button 
              className="mt-4" 
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                  <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
                  <TabsTrigger value="presentations">Presentations</TabsTrigger>
                </TabsList>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <TabsContent value="all" className="space-y-4 mt-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start p-4 border rounded-lg">
                      <div className="mr-4 flex items-center justify-center">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium truncate">{doc.name}</h3>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                          <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                          <span>{formatFileSize(doc.size)}</span>
                          {doc.category && (
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="general" className="space-y-4 mt-4">
                  {documents
                    .filter((doc) => doc.category === 'general')
                    .map((doc) => (
                      <div key={doc.id} className="flex items-start p-4 border rounded-lg">
                        <div className="mr-4 flex items-center justify-center">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium truncate">{doc.name}</h3>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 mt-2 text-xs text-muted-foreground">
                            <span>Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                            <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                            <span>{formatFileSize(doc.size)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                {/* Similar pattern for other tab contents */}
              </Tabs>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 