"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Flag, Calendar, Quote } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  rating: number;
  comment: string;
  projectTitle?: string;
  date: string;
  helpfulCount: number;
  userHasMarkedHelpful?: boolean;
}

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface RatingsReviewsProps {
  userId: string;
  isOwner?: boolean;
}

export default function RatingsReviews({ userId, isOwner = false }: RatingsReviewsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchRatingsAndReviews() {
      try {
        setIsLoading(true);
        
        // Fetch reviews
        const reviewsResponse = await fetch(`/api/users/${userId}/reviews`);
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
        
        // Fetch rating stats
        const statsResponse = await fetch(`/api/users/${userId}/rating-stats`);
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch rating statistics");
        }
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching ratings and reviews:", error);
        toast.error("Failed to load ratings and reviews");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRatingsAndReviews();
  }, [userId]);

  const handleMarkHelpful = async (reviewId: string) => {
    if (!session) {
      toast.error("Please sign in to mark reviews as helpful");
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to mark review as helpful");
      }

      // Update the local state
      setReviews(reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            helpfulCount: review.userHasMarkedHelpful ? review.helpfulCount - 1 : review.helpfulCount + 1,
            userHasMarkedHelpful: !review.userHasMarkedHelpful
          };
        }
        return review;
      }));
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      toast.error("Failed to mark review as helpful");
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!session) {
      toast.error("Please sign in to report reviews");
      return;
    }

    toast.info("Report submitted", {
      description: "Thank you for helping maintain community standards."
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ));
  };

  const filteredReviews = activeTab === "all" 
    ? reviews 
    : reviews.filter(review => {
        const rating = parseInt(activeTab);
        return review.rating === rating;
      });

  const calculatePercentage = (count: number) => {
    return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Ratings & Reviews
        </CardTitle>
        <CardDescription>
          Student feedback from those who have been advised
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex gap-6 animate-pulse">
              <div className="w-1/3">
                <div className="h-20 bg-muted rounded-lg mb-4"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
              <div className="w-2/3">
                <div className="h-12 bg-muted rounded-lg mb-4"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-muted rounded-lg"></div>
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating Summary */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex flex-col items-center p-4 border rounded-lg bg-muted/30">
                <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="flex my-2">{renderStars(Math.round(stats.averageRating))}</div>
                <div className="text-sm text-muted-foreground">Based on {stats.totalReviews} reviews</div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="w-3 text-sm">{rating}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${calculatePercentage(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution])}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-sm text-right text-muted-foreground">
                      {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
              
              {session && !isOwner && (
                <Button className="w-full" asChild>
                  <Link href={`/review/${userId}`}>
                    Write a Review
                  </Link>
                </Button>
              )}
            </div>
            
            {/* Reviews List */}
            <div className="md:col-span-2">
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Reviews</TabsTrigger>
                  <TabsTrigger value="5">5 Star</TabsTrigger>
                  <TabsTrigger value="4">4 Star</TabsTrigger>
                  <TabsTrigger value="3">3 Star</TabsTrigger>
                  <TabsTrigger value="2">2 Star</TabsTrigger>
                  <TabsTrigger value="1">1 Star</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-0">
                  {filteredReviews.length > 0 ? (
                    <div className="space-y-4">
                      {filteredReviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {review.authorImageUrl ? (
                                  <AvatarImage src={review.authorImageUrl} alt={review.authorName} />
                                ) : (
                                  <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <div className="font-medium">{review.authorName}</div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(review.date)}
                                </div>
                              </div>
                            </div>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                          
                          {review.projectTitle && (
                            <div className="mb-2 flex items-center gap-1 text-sm">
                              <span className="font-medium">Project:</span> {review.projectTitle}
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <Quote className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                              <p>{review.comment}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className={`flex items-center gap-1 ${review.userHasMarkedHelpful ? 'text-primary' : ''}`}
                              onClick={() => handleMarkHelpful(review.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpfulCount}</span>
                            </Button>
                            
                            {session && !isOwner && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground"
                                onClick={() => handleReportReview(review.id)}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No reviews found for this rating.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 