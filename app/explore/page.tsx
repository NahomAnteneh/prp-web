import { TopProjects } from "@/components/explore/TopProjects";
import { TopRepositories } from "@/components/explore/TopRepositories";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExplorePage() {
  return (
    <main className="min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Explore</h1>
          <p className="text-muted-foreground">
            Discover top projects and repositories from the community
          </p>
        </div>

        <Tabs defaultValue="projects" className="space-y-4">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="projects">Top Projects</TabsTrigger>
              <TabsTrigger value="repositories">Top Repositories</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="projects" className="space-y-4">
            <TopProjects limit={6} />
          </TabsContent>
          
          <TabsContent value="repositories" className="space-y-4">
            <TopRepositories limit={6} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 