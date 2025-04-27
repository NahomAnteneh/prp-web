"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { StateFilter } from "@/components/state-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FeedbackAuthor {
  name: string;
  avatarUrl: string;
}

interface FeedbackTag {
  name: string;
  color: string;
}

interface Feedback {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  author: FeedbackAuthor;
  tags: FeedbackTag[];
  commentCount: number;
}

interface FeedbackListResponse {
  items: Feedback[];
  totalCount: number;
  nextCursor: number | null;
}

interface FeedbacksClientProps {
  owner: string;
  repository: string;
  initialState: "open" | "closed" | "all";
  initialSearch?: string;
}

export function FeedbacksClient({
  owner,
  repository,
  initialState,
  initialSearch,
}: FeedbacksClientProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [cursor, setCursor] = useState(1);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLTableRowElement | null) => {
      rowRefs.current[index] = el;
    },
    []
  );

  const fetchFeedbacks = useCallback(async (isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setIsFetching(true);
      } else {
        setLoadingMore(true);
      }

      const queryParams = new URLSearchParams({
        state,
        ...(search && { search }),
        cursor: cursor.toString(),
        limit: "25",
      });

      const response = await fetch(
        `/api/feedbacks?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feedbacks: ${response.statusText}`);
      }

      const data: FeedbackListResponse = await response.json();
      
      if (isLoadingMore) {
        setAllFeedbacks((prev) => [...prev, ...data.items]);
      } else {
        setAllFeedbacks(data.items);
      }
      
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setIsFetching(false);
      setLoadingMore(false);
    }
  }, [state, search, cursor]);

  // Reset feedbacks when search params change
  useEffect(() => {
    setAllFeedbacks([]);
    setCursor(1);
    fetchFeedbacks();
  }, [state, search, fetchFeedbacks]);

  // Fetch more feedbacks when cursor changes (except on initial load)
  useEffect(() => {
    if (cursor > 1) {
      fetchFeedbacks(true);
    }
  }, [cursor, fetchFeedbacks]);

  // Intersection Observer setup for rows
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            nextCursor &&
            !isFetching &&
            !loadingMore
          ) {
            setCursor(nextCursor);
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    // Get the index to observe (10th from last if there are enough items)
    const targetIndex = Math.max(0, allFeedbacks.length - 10);
    const targetRef = rowRefs.current[targetIndex];

    if (targetRef) {
      observer.observe(targetRef);
    }

    return () => observer.disconnect();
  }, [nextCursor, isFetching, loadingMore, allFeedbacks.length]);

  const handleSearch = (value: string) => {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("search", value);
    } else {
      url.searchParams.delete("search");
    }
    router.push(url.pathname + url.search);
  };

  const handleStateChange = (value: "open" | "closed" | "all") => {
    setState(value);
    const url = new URL(window.location.href);
    url.searchParams.set("state", value);
    router.push(url.pathname + url.search);
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SearchBar
            placeholder="Search feedbacks..."
            defaultValue={search}
            onSearch={handleSearch}
          />
          <StateFilter value={state} onChange={handleStateChange} />
        </div>
      </div>

      {allFeedbacks.length === 0 && !isFetching ? (
        <div className="text-center text-muted-foreground">No feedbacks found</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allFeedbacks.map((feedback, index) => (
                <TableRow key={feedback.id} ref={setRowRef(index)}>
                  <TableCell>
                    <Link
                      href={`/${owner}/${repository}/feedbacks/${feedback.number}`}
                      className="font-medium hover:underline"
                    >
                      {feedback.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={feedback.state === "open" ? "default" : "secondary"}
                    >
                      {feedback.state}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {feedback.tags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          style={{ backgroundColor: `#${tag.color}20` }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={feedback.author.avatarUrl}
                        alt={feedback.author.name}
                        className="h-5 w-5 rounded-full"
                      />
                      <span>{feedback.author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(feedback.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>{feedback.commentCount}</TableCell>
                </TableRow>
              ))}
              {(isFetching || loadingMore) && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
