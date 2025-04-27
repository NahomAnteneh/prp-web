"use client";

import { useId, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import type { Repository } from "@/app/api/repositories/search/route";
import { useQueryState } from "nuqs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Session } from "next-auth";
import { SignOut } from "./sign-in-button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function RepositoryListItem({ repo }: { repo: Repository }) {
  return (
    <li key={`${repo.owner.login}/${repo.name}`} className="">
      <Link
        href={`/${repo.owner.login}/${repo.name}`}
        className="block p-4 text-sm font-medium transition-colors border-b hover:bg-foreground hover:text-background"
        prefetch={true}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <div className="flex items-baseline gap-1">
              <h3>
                {repo.owner.login}/{repo.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {repo.isPrivate ? "private" : "public"}
              </span>
            </div>
            <span className="pt-2 text-xs text-muted-foreground max-w-96">
              {repo.description}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-32">
            <span className="text-xs text-muted-foreground">
              {repo.stargazerCount} stars
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(repo.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function RepositoryListSearch({
  initialRepos,
  session,
}: {
  initialRepos: Repository[];
  session: Session;
}) {
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [repositories, setRepositories] = useState<Repository[]>(initialRepos);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 33);
  const isSearching = debouncedSearchQuery.trim().length > 0;

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!isSearching) {
        // If not searching, load all repositories
        try {
          setIsFetching(true);
          const response = await fetch(`/api/repositories/search`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch repositories");
          }
          
          const data = await response.json();
          setRepositories(data);
        } catch (err) {
          console.error("Error fetching repositories:", err);
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setIsFetching(false);
        }
      }
    };
    
    if (!isSearching && repositories.length === 0) {
      fetchRepositories();
    }
  }, [isSearching, repositories.length]);

  useEffect(() => {
    const searchRepositories = async () => {
      if (!isSearching) return;
      
      try {
        setIsFetching(true);
        
        // Search user repositories
        const userRepoResponse = await fetch(
          `/api/repositories/search?q=${encodeURIComponent(debouncedSearchQuery)}`
        );
        
        if (!userRepoResponse.ok) {
          throw new Error("Failed to search repositories");
        }
        
        const userRepos = await userRepoResponse.json();
        
        // Search third-party repositories
        const thirdPartyResponse = await fetch(
          `/api/repositories/search?q=${encodeURIComponent(
            debouncedSearchQuery
          )}&thirdParty=true`
        );
        
        if (!thirdPartyResponse.ok) {
          throw new Error("Failed to search third-party repositories");
        }
        
        const thirdPartyRepos = await thirdPartyResponse.json();
        
        // Combine results
        const allResults = [...userRepos, ...thirdPartyRepos];
        
        // Remove duplicates
        const uniqueResults = allResults.filter(
          (repo, index, self) =>
            index ===
            self.findIndex(
              (r) => r.owner.login === repo.owner.login && r.name === repo.name
            )
        );
        
        setRepositories(uniqueResults);
      } catch (err) {
        console.error("Error searching repositories:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsFetching(false);
      }
    };
    
    searchRepositories();
  }, [debouncedSearchQuery, isSearching]);

  const inputId = useId();

  return (
    <div className="border-b">
      <div className="flex items-stretch justify-between w-full border-b">
        <div className="p-4 border-r">Hi, {session?.user.email || "Guest"}</div>
        <div className="relative flex items-center justify-center grow">
          <label
            htmlFor={inputId}
            className="flex items-center justify-center w-8 h-8 pl-4 text-muted-foreground"
          >
            <Search className="" />
          </label>
          <input
            type="text"
            placeholder="Search Repositories..."
            className="block p-4 border-0 grow outline-0 focus:ring-0 focus-visible:ring-0"
            id={inputId}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div
            className={cn(
              "absolute w-2 h-2 bg-blue-400 rounded-full right-4 animate-pulse",
              {
                hidden: !isFetching,
                block: isFetching,
              }
            )}
          ></div>
        </div>
        <SignOut className="border-l border-r-0" />
      </div>
      <div>
        <ul>
          {repositories.map((repo) => (
            <RepositoryListItem
              key={repo.owner.login + repo.name}
              repo={repo}
            />
          ))}
        </ul>
        {repositories.length === 0 && (
          <div className="flex items-center justify-center w-full p-4 text-sm text-muted-foreground">
            {isFetching ? (
              <span>Loading...</span>
            ) : (
              `No Repositories Found`
            )}
          </div>
        )}
      </div>
    </div>
  );
}
