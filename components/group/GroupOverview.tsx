'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group } from '@prisma/client';
import Link from 'next/link';


export default function GroupOverview({
  group,
}: {
  group: Group;
  maxGroupSize?: number;
  isLeader?: boolean;
  onUpdate?: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Left Section: Group Profile and Repositories */}
      <div className="col-span-3">
        {/* Group Profile Card */}
        <Card className="mb-4">
          <CardContent className="flex items-start pt-6">
            <Avatar className="h-20 w-20 mr-4 bg-blue-100">
              <AvatarFallback>
                {group.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-black">{group.name}</CardTitle>
              <p className="text-gray-500 text-sm">{group.description || "No description provided."}</p>
            </div>
          </CardContent>
        </Card>

        {/* Repositories Section */}
    {/* Heading */}
    <h3 className="text-base font-semibold mb-2 px-1">Repositories & Projects</h3>

    {/* Conditional Rendering: Check if there's anything to display */}
    {(!group.repositories || group.repositories.length === 0) &&
     (!group.projects || group.projects.length === 0) ? (
        // --- Empty State ---
        <Card className="border-dashed mt-1 bg-muted/20">
            <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground italic">
                No repositories or projects found.
            </p>
            </CardContent>
        </Card>
     ) : (
        // --- Grid Container using Tailwind (Shadcn uses Tailwind) ---
        <div className="grid grid-cols-2 gap-2.5 mt-1"> {/* 2 columns, adjust gap as needed */}

            {/* Map over Repositories and render cards directly */}
            {group.repositories?.map((repo) => (
                <Link key={`repo-${repo.id}`} href={`/repositories/${repo.id}`} passHref legacyBehavior>
                  {/* legacyBehavior needed for Card to correctly receive the click via <a> */}
                  <a className="block outline-none rounded-lg h-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Card className="hover:border-primary/50 hover:bg-muted/40 transition-all duration-150 cursor-pointer h-full flex flex-col shadow-sm border">
                      <CardContent className="p-3 flex-grow flex flex-col justify-center"> {/* Small padding, center content */}
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
                  </a>
                </Link>
            ))}

            {/* Map over Projects and render cards directly */}
            {group.projects?.map((project) => (
                <Link key={`proj-${project.id}`} href={`/projects/${project.id}`} passHref legacyBehavior>
                  <a className="block outline-none rounded-lg h-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Card className="hover:border-primary/50 hover:bg-muted/40 transition-all duration-150 cursor-pointer h-full flex flex-col shadow-sm border">
                       <CardContent className="p-3 flex-grow flex flex-col justify-center">
                        <p className="font-semibold text-sm text-foreground leading-snug break-words mb-1 text-center">
                          {project.title} {/* Use project.title */}
                        </p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 text-center">
                            {project.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </a>
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
              <Link key={member.userId} href={`/${member.user?.username || '#'}`} passHref>
                <div className="group relative">
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarFallback>
                      {member.user?.firstName ? member.user.firstName.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {member.user?.firstName} {member.user?.lastName}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}