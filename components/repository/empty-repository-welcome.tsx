"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Upload, GitBranch, GitFork, FileCode, FilePlus2, BookOpen, Copy, ArrowRight, FileUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/file-upload";

interface EmptyRepositoryWelcomeProps {
  ownerId: string;
  repoId: string;
  defaultBranchName?: string;
}

export function EmptyRepositoryWelcome({ ownerId, repoId, defaultBranchName = "main" }: EmptyRepositoryWelcomeProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("quick-setup");
  const [isCreatingReadme, setIsCreatingReadme] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCommitMessage, setUploadCommitMessage] = useState("");
  
  // SSH and HTTPS clone URLs
  const sshCloneUrl = `git@${window.location.host}:${ownerId}/${repoId}.git`;
  const httpsCloneUrl = `https://${window.location.host}/${ownerId}/${repoId}.git`;

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleInitializeWithReadme = async () => {
    setIsCreatingReadme(true);
    try {
      const response = await fetch(`/api/groups/${ownerId}/repositories/${repoId}/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withReadme: true,
          readmeTemplate: "default",
          commitMessage: "Initial commit with README.md",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize repository");
      }

      toast.success("Repository initialized with README.md");
      router.refresh();
    } catch (error) {
      toast.error("Failed to initialize repository");
      console.error("Error initializing repository:", error);
    } finally {
      setIsCreatingReadme(false);
    }
  };

  const handleCreateFile = async () => {
    if (!fileName) {
      toast.error("Filename is required");
      return;
    }

    if (!commitMessage) {
      toast.error("Commit message is required");
      return;
    }

    setIsCreatingFile(true);
    
    try {
      const response = await fetch(`/api/groups/${ownerId}/repositories/${repoId}/create-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: fileName,
          content: fileContent,
          commitMessage,
          branch: defaultBranchName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create file");
      }

      toast.success("File created successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create file");
      console.error("Error creating file:", error);
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!uploadCommitMessage) {
      toast.error("Commit message is required");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append("files", file);
      });
      
      formData.append("commitMessage", uploadCommitMessage);
      formData.append("branch", defaultBranchName);

      const response = await fetch(`/api/groups/${ownerId}/repositories/${repoId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      toast.success("Files uploaded successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to upload files");
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Get started with your repository</CardTitle>
          <CardDescription>
            Create your first file, upload existing files or use the command line to get started.
          </CardDescription>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick-setup">Quick Setup</TabsTrigger>
              <TabsTrigger value="create-file">Create New File</TabsTrigger>
              <TabsTrigger value="upload-files">Upload Files</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6 pt-3">
            <TabsContent value="quick-setup" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-lg font-medium">Initialize This Repository</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a README.md file to help others understand your project.
                  </p>
                  <Button 
                    onClick={handleInitializeWithReadme} 
                    className="w-fit mt-2"
                    disabled={isCreatingReadme}
                  >
                    {isCreatingReadme ? (
                      <>Creating README...</>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Initialize with README
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium">Use Command Line</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new repository on the command line
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Create a new repository</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleCopyToClipboard(`
echo "# ${repoId}" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin ${httpsCloneUrl}
git push -u origin main`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
echo "# {repoId}" {'>>'} README.md<br />
git init<br />
git add README.md<br />
git commit -m "first commit"<br />
git branch -M main<br />
git remote add origin {httpsCloneUrl}<br />
git push -u origin main
                    </pre>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">Push an existing repository</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleCopyToClipboard(`
git remote add origin ${httpsCloneUrl}
git branch -M main
git push -u origin main`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
git remote add origin {httpsCloneUrl}<br />
git branch -M main<br />
git push -u origin main
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="create-file" className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="fileName" className="block text-sm font-medium mb-1">
                    File name (including path)
                  </label>
                  <Input
                    id="fileName"
                    placeholder="e.g., src/main.js or README.md"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="fileContent" className="block text-sm font-medium mb-1">
                    File content
                  </label>
                  <Textarea
                    id="fileContent"
                    placeholder="Enter file content here..."
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="font-mono min-h-[200px]"
                  />
                </div>
                
                <div>
                  <label htmlFor="commitMessage" className="block text-sm font-medium mb-1">
                    Commit message
                  </label>
                  <Input
                    id="commitMessage"
                    placeholder="e.g., Add initial files"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateFile} 
                  disabled={isCreatingFile} 
                  className="w-full"
                >
                  {isCreatingFile ? 'Creating...' : 'Create File'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="upload-files" className="mt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Files to upload
                  </label>
                  <FileUpload
                    onChange={setUploadFiles}
                    value={uploadFiles}
                    multiple={true}
                    maxFiles={10}
                    maxSize={10 * 1024 * 1024} // 10MB
                  />
                </div>
                
                {uploadFiles.length > 0 && (
                  <div>
                    <label htmlFor="uploadCommitMessage" className="block text-sm font-medium mb-1">
                      Commit message
                    </label>
                    <Input
                      id="uploadCommitMessage"
                      placeholder="e.g., Upload initial files"
                      value={uploadCommitMessage}
                      onChange={(e) => setUploadCommitMessage(e.target.value)}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={handleUploadFiles} 
                  disabled={isUploading || uploadFiles.length === 0} 
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex flex-col items-start px-6 pt-0">
          <div className="text-sm text-muted-foreground mt-4">
            <p>Need help? Check out the <a href="/docs/getting-started" className="text-primary hover:underline">documentation</a>.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 