'use client';

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X, Folder, GitBranch, Users, GraduationCap, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  className?: string;
  mobile?: boolean;
  defaultValue?: string;
  onSearch?: (query: string, type?: string) => void;
}

// Only show types that match the /search page
const searchTypes = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "repositories", label: "Repositories", icon: GitBranch },
  { id: "groups", label: "Groups", icon: Users },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "advisors", label: "Advisors", icon: Briefcase },
];

export function SearchBar({ className, mobile = false, defaultValue = '', onSearch }: SearchBarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(defaultValue);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim(), selectedTypes.length === 1 ? selectedTypes[0] : undefined);
      } else {
        const params = new URLSearchParams();
        params.set('query', searchQuery.trim());
        if (selectedTypes.length === 1) {
          params.set('type', selectedTypes[0]);
        }
        router.push(`/search?${params.toString()}`);
        router.refresh(); // Reload the page
      }
      setIsExpanded(false);
    }
  };

  const toggleSearchType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.length > 1 ? prev.filter(id => id !== typeId) : prev
        : [...prev, typeId]
    );
  };

  React.useEffect(() => {
    if (mobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isExpanded && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      } else if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, mobile, selectedTypes]);

  const inputClass = "w-full pl-9 h-10 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-md transition-colors";

  if (mobile) {
    return (
      <form onSubmit={handleSearch} className={cn("w-full", className)}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-4 h-10"
          />
        </div>
      </form>
    );
  }

  return (
    <div className={cn("relative w-full", className)} ref={popoverRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative group w-full">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            name="search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type / to search..."
            className={inputClass}
            onFocus={() => setIsExpanded(true)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!searchQuery && !isExpanded && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center justify-center h-5 w-5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-gray-300">/</kbd>
            </div>
          )}
        </div>
      </form>
      {isExpanded && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-50 p-3 max-h-80 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Search in</div>
          <div className="space-y-2.5">
            {searchTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              return (
                <div key={type.id} className="flex items-center space-x-2 group/checkbox">
                  <Checkbox
                    id={`search-${type.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleSearchType(type.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`search-${type.id}`}
                    className="flex items-center justify-between w-full text-sm cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Icon className={cn(
                        "h-3.5 w-3.5 mr-2",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
                        {type.label}
                      </span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
          {selectedTypes.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTypes.map(typeId => {
                  const type = searchTypes.find(a => a.id === typeId);
                  if (!type) return null;
                  return (
                    <Badge 
                      key={type.id} 
                      variant="outline" 
                      className="bg-primary/5 text-xs py-0"
                    >
                      <type.icon className="h-3 w-3 mr-1" />
                      {type.label}
                    </Badge>
                  );
                })}
              </div>
            </>
          )}
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Press <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted">/</kbd> to focus search
            </div>
            <div>
              Press <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted">ESC</kbd> to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}