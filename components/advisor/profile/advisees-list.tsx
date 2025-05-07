"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Advisee {
  id: string;
  name: string;
  imageUrl?: string;
  department: string;
  batchYear: string;
  graduationStatus: "CURRENT" | "GRADUATED" | "INACTIVE";
  projectTitle?: string;
}

interface AdviseesListProps {
  userId: string;
  isOwner?: boolean;
}

export default function AdviseesList({ userId, isOwner = false }: AdviseesListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [advisees, setAdvisees] = useState<Advisee[]>([]);
  const [filteredAdvisees, setFilteredAdvisees] = useState<Advisee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "current" | "graduated">("all");

  useEffect(() => {
    async function fetchAdvisees() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}/advisees`);
        if (!response.ok) {
          throw new Error("Failed to fetch advisees");
        }
        const data = await response.json();
        setAdvisees(data);
        setFilteredAdvisees(data);
      } catch (error) {
        console.error("Error fetching advisees:", error);
        toast.error("Failed to load advisees");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAdvisees();
  }, [userId]);

  useEffect(() => {
    // Filter based on search query and active filter
    let result = advisees;
    
    // Apply status filter
    if (activeFilter === "current") {
      result = result.filter(advisee => advisee.graduationStatus === "CURRENT");
    } else if (activeFilter === "graduated") {
      result = result.filter(advisee => advisee.graduationStatus === "GRADUATED");
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(advisee => 
        advisee.name.toLowerCase().includes(query) || 
        advisee.department.toLowerCase().includes(query) ||
        (advisee.projectTitle && advisee.projectTitle.toLowerCase().includes(query))
      );
    }
    
    setFilteredAdvisees(result);
  }, [searchQuery, activeFilter, advisees]);

  const getStatusBadge = (status: Advisee["graduationStatus"]) => {
    switch (status) {
      case "CURRENT":
        return <Badge variant="default">Current</Badge>;
      case "GRADUATED":
        return <Badge variant="outline" className="border-green-500 text-green-500">Graduated</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Advisees
        </CardTitle>
        <CardDescription>
          Students currently or previously advised
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, department, or project..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              All
            </Button>
            <Button 
              variant={activeFilter === "current" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("current")}
            >
              Current
            </Button>
            <Button 
              variant={activeFilter === "graduated" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("graduated")}
            >
              Graduated
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="w-16 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredAdvisees.length > 0 ? (
          <div className="space-y-1">
            {filteredAdvisees.map((advisee) => (
              <Link 
                key={advisee.id} 
                href={`/${advisee.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Avatar className="h-10 w-10 border">
                  {advisee.imageUrl ? (
                    <AvatarImage src={advisee.imageUrl} alt={advisee.name} />
                  ) : (
                    <AvatarFallback>{advisee.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{advisee.name}</div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{advisee.department}</span>
                    <span>·</span>
                    <span>Batch {advisee.batchYear}</span>
                  </div>
                  {advisee.projectTitle && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      Project: {advisee.projectTitle}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(advisee.graduationStatus)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No advisees found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 