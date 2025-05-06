'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Extended group interface to include the nested properties
interface ExtendedGroup {
  id: string;
  name: string;
  groupUserName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  leaderId: string;
  repositories?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  members?: Array<{
    userId: string;
    user?: {
      userId: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
}

export default function GroupOverview({
  group,
}: {
  group: ExtendedGroup;
  maxGroupSize?: number;
  isLeader?: boolean;
  onUpdate?: () => void;
}) {
  // Format the creation date
  const formattedCreatedAt = new Date(group.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Left Section: Group Profile, Overview, and Repositories */}
      <div className="col-span-3">
        {/* Group Profile Card */}
        <Card className="mb-4">
          <CardContent className="flex items-start pt-6">
            <Avatar className="h-20 w-20 mr-4 bg-blue-100">
              <AvatarFallback>
                {group.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-black">{group.name}</CardTitle>
              <p className="text-gray-500 text-sm">@{group.groupUserName}</p>
              <p className="text-gray-500 text-sm">{group.description || "No description provided."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Group Overview Card */}
        <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-blue-800">Projects</p>
              <p className="text-lg font-bold text-blue-600">
                {group.projects?.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-green-800">Repositories</p>
              <p className="text-lg font-bold text-green-600">
                {group.repositories?.length || 0}
              </p>
            </CardContent>
          </Card>
          {/* <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-purple-800">Members</p>
              <p className="text-lg font-bold text-purple-600">
                {group.members?.length || 0}
              </p>
            </CardContent>
          </Card> */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-orange-800">Created On</p>
              <p className="text-lg font-bold text-orange-600">
                {formattedCreatedAt}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
        {/* Repositories & Projects Section */}
        <h3 className="text-base font-semibold mb-2 px-1">Repositories & Projects</h3>

        {/* Conditional Rendering: Check if there's anything to display */}
        {(!group.repositories || group.repositories.length === 0) &&
        (!group.projects || group.projects.length === 0) ? (
          <Card className="border-dashed mt-1 bg-muted/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground italic">
                No repositories or projects found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            {/* Map over Top 3 Repositories */}
            {group.repositories?.slice(0, 3).map((repo) => (
              <Link
                key={`repo-${repo.id}`}
                href={`/repositories/${repo.id}`}
                className="block outline-none rounded-lg h-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="hover:border-primary/50 hover:bg-muted/40 transition-all duration-150 cursor-pointer h-full flex flex-col shadow-sm border">
                  <CardContent className="p-3 flex-grow flex flex-col justify-center">
                    <p className="font-semibold text-sm text-foreground leading-snug break-words mb-1 text-center">
                      {repo.name}
                    </p>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                        {repo.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Map over Top 3 Projects */}
            {group.projects?.slice(0, 3).map((project) => (
              <Link
                key={`proj-${project.id}`}
                href={`/projects/${project.id}`}
                className="block outline-none rounded-lg h-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="hover:border-primary taxonomy:category cursor-pointer h-full flex flex-col shadow-sm border">
                  <CardContent className="p-3 flex-grow flex flex-col justify-center">
                    <p className="font-semibold text-sm text-foreground leading-snug break-words mb-1 text-center">
                      {project.title}
                    </p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                        {project.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right Section: Members */}
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {group.members?.map((member) => (
              <Link
                key={member.userId}
                href={`/${member.user?.userId || '#'}`}
                className="group relative"
              >
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarFallback>
                    {member.user?.firstName
                      ? member.user.firstName.charAt(0).toUpperCase()
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {member.user?.firstName} {member.user?.lastName}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}