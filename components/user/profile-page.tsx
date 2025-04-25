"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { User, Users, BookOpen, Clock, Folder, Settings, Shield, PenTool, School } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import RepositoryList from "@/app/components/repository/repository-list"

interface ProfileInfo {
  idNumber?: string;
  department?: string;
  batchYear?: string;
  bio?: string;
  skills?: string[];
}

interface Repository {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranchRef?: {
    name: string;
  } | null;
}

interface Group {
  group: {
    id: string;
    name: string;
    description: string | null;
  }
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  profile?: ProfileInfo;
  repositories: Repository[];
  groups: Group[];
  projects: Project[];
}

interface ViewerInfo {
  isLoggedIn: boolean;
  isProfileOwner: boolean;
  role: string | null;
}

interface ProfileResponse {
  user: UserData;
  viewer: ViewerInfo;
}

// Toast implementation
const useToast = () => {
  return {
    toast: ({ title, description, variant }: any) => {
      console.log(`${title}: ${description}`);
    }
  };
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username;
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/profile/${username}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile data: ${response.status}`);
        }
        
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load profile data";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [username, toast]);

  if (error) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const { user, viewer } = profileData || { user: null, viewer: null };
  
  if (!user) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <div className="bg-muted p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p>The requested profile could not be found.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <ProfileHeader user={user} viewer={viewer} />
        
        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="repositories" className="flex items-center gap-2">
              <Folder className="h-4 w-4" /> Repositories
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" /> Projects
            </TabsTrigger>
            {viewer.isProfileOwner && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </TabsTrigger>
            )}
            {!viewer.isProfileOwner && (
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Activities
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <ProfileOverview user={user} viewer={viewer} />
          </TabsContent>
          
          <TabsContent value="repositories" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Repositories</CardTitle>
                    <CardDescription>
                      {user.repositories.length > 0 
                        ? `${user.repositories.length} repositories` 
                        : "No repositories yet"}
                    </CardDescription>
                  </div>
                  {viewer.isProfileOwner && (
                    <Button size="sm" onClick={() => router.push("/new-repository")}>
                      New Repository
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <RepositoryList repositories={user.repositories.map(repo => ({
                  ...repo,
                  owner: {
                    id: user.id,
                    username: user.username,
                    name: user.name
                  },
                  description: repo.description || '',
                  updatedAt: repo.updatedAt
                }))} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects" className="mt-6">
            <ProjectsTab projects={user.projects} isOwner={viewer.isProfileOwner} />
          </TabsContent>
          
          <TabsContent value="activities" className="mt-6">
            <ActivitiesTab username={user.username} />
          </TabsContent>
          
          {viewer.isProfileOwner && (
            <TabsContent value="settings" className="mt-6">
              <SettingsTab user={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Profile Header Component
function ProfileHeader({ user, viewer }: { user: UserData, viewer: ViewerInfo }) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 flex flex-col items-center">
        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-muted mb-4">
          {user.image ? (
            <img 
              src={user.image} 
              alt={`${user.name}'s profile picture`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
              <span className="text-4xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        {viewer.isProfileOwner && (
          <Button variant="outline" size="sm" className="mb-4">
            Change Picture
          </Button>
        )}
        {!viewer.isProfileOwner && viewer.isLoggedIn && (
          <Button variant="outline" size="sm" className="mb-4">
            Follow
          </Button>
        )}
      </div>
      
      <div className="md:w-2/3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground text-lg">@{user.username}</p>
            {user.role && (
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {user.role === "STUDENT" && <School className="w-3 h-3 mr-1" />}
                {user.role === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                {user.role}
              </div>
            )}
          </div>
          
          {viewer.isProfileOwner && (
            <Button
              variant="outline"
              onClick={() => router.push("/settings/profile")}
            >
              Edit Profile
            </Button>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-muted-foreground">
            {user.profile?.bio || "No bio available"}
          </p>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {user.profile?.department && (
            <div className="flex items-center gap-1.5">
              <School className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.profile.department}</span>
            </div>
          )}
          {user.email && viewer.isProfileOwner && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
          )}
          {user.profile?.batchYear && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Batch {user.profile.batchYear}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Overview Component
function ProfileOverview({ user, viewer }: { user: UserData, viewer: ViewerInfo }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Groups */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            {user.groups.length > 0 
              ? `Member of ${user.groups.length} groups` 
              : "Not a member of any groups"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.groups.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No groups joined yet</p>
          ) : (
            <div className="space-y-4">
              {user.groups.map(({ group }) => (
                <div key={group.id} className="border rounded-md p-3">
                  <h3 className="font-medium">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" size="sm">
            View All Groups
          </Button>
        </CardFooter>
      </Card>
      
      {/* Right Column - Skills and Stats */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Skills & Expertise</CardTitle>
        </CardHeader>
        <CardContent>
          {!user.profile?.skills || user.profile.skills.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No skills listed yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.profile.skills.map((skill, index) => (
                <div 
                  key={index}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {skill}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <Separator />
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <p className="text-3xl font-bold">{user.repositories.length}</p>
              <p className="text-sm text-muted-foreground">Repositories</p>
            </div>
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <p className="text-3xl font-bold">{user.projects.length}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
            <div className="text-center p-4 bg-muted/40 rounded-lg">
              <p className="text-3xl font-bold">{user.groups.length}</p>
              <p className="text-sm text-muted-foreground">Groups</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Projects Tab Component
function ProjectsTab({ projects, isOwner }: { projects: Project[], isOwner: boolean }) {
  const router = useRouter();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              {projects.length > 0 
                ? `${projects.length} projects` 
                : "No projects yet"}
            </CardDescription>
          </div>
          {isOwner && (
            <Button size="sm" onClick={() => router.push("/projects/new")}>
              New Project
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No projects created yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                    {project.status}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || "No description provided"}
                  </p>
                </CardContent>
                <CardFooter className="p-4 border-t bg-muted/20 flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Activities Tab Component
function ActivitiesTab({ username }: { username: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Recent contributions and activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="text-muted-foreground text-center py-12">
            No recent activity to display
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Tab Component
function SettingsTab({ user }: { user: UserData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account and profile settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <h3 className="text-lg font-medium">General Information</h3>
              <Separator />
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="p-2 border rounded-md"
                  defaultValue={user.name}
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="p-2 border rounded-md min-h-[100px]"
                  defaultValue={user.profile?.bio || ""}
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Profile Skeleton Loader
function ProfileSkeleton() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex flex-col items-center">
          <Skeleton className="w-40 h-40 rounded-full" />
          <Skeleton className="w-32 h-9 mt-4" />
        </div>
        
        <div className="md:w-2/3">
          <Skeleton className="h-10 w-2/3 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-20 w-full" />
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
      
      <Skeleton className="h-12 w-full" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] lg:col-span-1" />
        <Skeleton className="h-[400px] lg:col-span-2" />
      </div>
    </div>
  );
} 