'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Group } from '@/types/types'; // Adjusted the path to match the relative location

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
        <h3 className="text-lg font-medium mb-3">Top Repositories and Projects</h3>
        <div className="space-y-2">
          {group.repositories?.map((repo) => (
            <Link key={repo.id} href={`/repositories/${repo.id}`} passHref>
              <Card className="hover:bg-gray-100 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <p className="font-medium text-black">{repo.name}</p>
                  <p className="text-sm text-gray-500">{repo.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
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