import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type SearchResultType = 'project' | 'repository' | 'group' | 'user' | 'student' | 'advisor';

interface SearchResultCardProps {
  type: SearchResultType;
  data: any;
}

export function SearchResultCard({ type, data }: SearchResultCardProps) {
  // Render based on type
  if (type === 'project') {
    return (
      <Card className="mb-4 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <a href={`/${data.group?.groupUserName}/projects/${data.id}`} className="font-semibold text-blue-700 hover:underline text-lg">{data.title}</a>
          <Badge variant="outline" className="ml-2 text-xs">{data.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">{data.description}</div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span>Group: <a href={`/${data.group?.groupUserName}`} className="hover:underline">{data.group?.name}</a></span>
          {data.advisor && <span>Advisor: {data.advisor.firstName} {data.advisor.lastName}</span>}
        </div>
      </Card>
    );
  }
  if (type === 'repository') {
    // Use the standardized repository format
    return (
      <Card className="mb-4 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <a href={`/${data.groupUserName}/${data.name}`} className="font-semibold text-blue-700 hover:underline text-lg">{data.name}</a>
          {data.isPrivate && <Badge variant="outline" className="ml-2 text-xs">Private</Badge>}
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">{data.description || "No description provided"}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>Commits: {data.stats?.commits ?? 0}</span>
            <span>Branches: {data.stats?.branches ?? 0}</span>
            <span>Group: <a href={`/${data.groupUserName}`} className="hover:underline">{data.group?.name}</a></span>
          </div>
          {data.lastActivity && (
            <span className="text-xs text-muted-foreground">{data.lastActivity}</span>
          )}
        </div>
      </Card>
    );
  }
  if (type === 'group') {
    return (
      <Card className="mb-4 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <a href={`/${data.groupUserName}`} className="font-semibold text-blue-700 hover:underline text-lg">{data.name}</a>
          <span className="text-xs text-muted-foreground">@{data.groupUserName}</span>
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">{data.description}</div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span>Leader: {data.leader?.firstName} {data.leader?.lastName}</span>
          <span>Members: {data._count?.members ?? 0}</span>
          <span>Projects: {data._count?.projects ?? 0}</span>
        </div>
      </Card>
    );
  }
  if (type === 'user' || type === 'student' || type === 'advisor') {
    return (
      <Card className="mb-4 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <a href={`/${data.userId}`} className="font-semibold text-blue-700 hover:underline text-lg">{data.firstName} {data.lastName}</a>
          <Badge variant="outline" className="ml-2 text-xs">{data.role}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          {data.profileInfo?.department && <span>Dept: {data.profileInfo.department}</span>}
          {data.profileInfo?.batchYear && <span>Batch: {data.profileInfo.batchYear}</span>}
          {data._count?.groupsMemberOf !== undefined && <span>Groups: {data._count.groupsMemberOf}</span>}
          {data._count?.advisedProjects !== undefined && <span>Advised: {data._count.advisedProjects}</span>}
        </div>
      </Card>
    );
  }
  return null;
}