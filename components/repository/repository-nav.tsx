"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Code, 
  GitPullRequest, 
  CircleDot, 
  Bookmark, 
  Shield, 
  Settings, 
  PlaySquare,
  AlertCircle,
  GitBranchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepositoryNavProps {
  owner: string;
  repository: string;
}

export function RepositoryNav({ owner, repository }: RepositoryNavProps) {
  const pathname = usePathname();
  const basePath = `/${owner}/${repository}`;

  // Determine active tab based on the current path
  const isActive = (path: string) => {
    if (path === "code") {
      // Code is active only on the base path or when viewing code
      return pathname === basePath || 
             pathname.includes(`${basePath}/tree`) || 
             pathname.includes(`${basePath}/blob`);
    }
    return pathname.includes(`${basePath}/${path}`);
  };

  const navItems = [
    { name: "Code", path: "code", icon: <Code className="h-4 w-4" /> },
    { name: "Issues", path: "issues", icon: <CircleDot className="h-4 w-4" /> },
    { name: "Pull requests", path: "pulls", icon: <GitPullRequest className="h-4 w-4" /> },
    { name: "Actions", path: "actions", icon: <PlaySquare className="h-4 w-4" /> },
    { name: "Projects", path: "projects", icon: <Bookmark className="h-4 w-4" /> },
    { name: "Security", path: "security", icon: <Shield className="h-4 w-4" /> },
    { name: "Insights", path: "insights", icon: <AlertCircle className="h-4 w-4" /> },
    { name: "Settings", path: "settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center overflow-x-auto scrollbar-hide -mx-4 md:mx-0 border-b border-foreground/10">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path === "code" ? basePath : `${basePath}/${item.path}`}
          className={cn(
            "border-b-2 pb-2 pt-2 cursor-pointer border-transparent",
            {
              "border-primary": isActive(item.path),
              "text-foreground": isActive(item.path),
              "text-muted-foreground": !isActive(item.path),
            }
          )}
        >
          <Button
            variant="ghost"
            asChild
            className="flex items-center gap-2 px-3 py-1 rounded-none hover:bg-transparent hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.name}</span>
            </div>
          </Button>
        </Link>
      ))}
    </div>
  );
}