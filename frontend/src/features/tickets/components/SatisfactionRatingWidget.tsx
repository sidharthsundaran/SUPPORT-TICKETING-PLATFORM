import React, { useState } from 'react';
import { Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface SatisfactionRatingWidgetProps {
  ticketId: string;
  existingRating?: {
    rating: number;
    comment?: string;
    ratedAt?: string;
  };
  onSuccess?: () => void;
}

export const SatisfactionRatingWidget: React.FC<SatisfactionRatingWidgetProps> = ({
  ticketId,
  existingRating,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [rating, setRating] = useState<number>(existingRating?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingRating?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingRating));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Please select a star rating from 1 to 5.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${baseUrl}/tickets/${ticketId}/satisfaction-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Rating submission failed');

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-sm">Satisfaction Feedback Submitted (BR-TRK-006)</h3>
        </div>
        <div className="flex items-center gap-1 my-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= (existingRating?.rating || rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          ))}
          <span className="text-xs font-bold ml-1.5 text-emerald-800">
            {existingRating?.rating || rating} / 5 Stars
          </span>
        </div>
        {(existingRating?.comment || comment) && (
          <p className="text-xs text-emerald-700 italic">
            "{existingRating?.comment || comment}"
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 shadow-xs space-y-4 font-sans">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          How satisfied were you with the resolution? (BR-TRK-006)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Your feedback helps us continuously improve our support quality.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Bar */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 hover:scale-110 transition focus:outline-none cursor-pointer"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-slate-700 ml-2">
            {hoverRating || rating ? `${hoverRating || rating} / 5 Stars` : 'Select rating'}
          </span>
        </div>

        {/* Comment Box */}
        <div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback comment (e.g. prompt resolution, helpful agent)..."
            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Rating</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
