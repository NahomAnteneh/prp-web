'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface AdvisorRatingProps {
  ownerId: string;
  projectId: string;
  advisorId: string;
  advisorName: string;
  onRatingComplete: () => void;
}

export function AdvisorRating({ 
  ownerId, 
  projectId, 
  advisorId, 
  advisorName, 
  onRatingComplete 
}: AdvisorRatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/groups/${ownerId}/projects/${projectId}/advisor/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisorId,
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }

      toast.success('Rating submitted', {
        description: 'Thank you for your feedback.'
      });
      
      setIsOpen(false);
      onRatingComplete();
    } catch (error) {
      console.error('Error submitting advisor rating:', error);
      toast.error('Failed to submit rating', {
        description: error instanceof Error ? error.message : 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Rate Advisor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Advisor</DialogTitle>
          <DialogDescription>
            Share your experience with {advisorName}. Your feedback helps improve the advising process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-all ${
                    (hoverRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this advisor..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitRating} 
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 