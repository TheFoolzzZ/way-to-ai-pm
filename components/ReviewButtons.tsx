"use client";

import { useState } from "react";
import type { ReviewRating } from "@/lib/srs";

type ReviewButtonsProps = {
  onRate: (rating: ReviewRating) => Promise<void>;
};

const REVIEW_OPTIONS: Array<{
  rating: ReviewRating;
  title: string;
  subtitle: string;
}> = [
  { rating: 1, title: "忘记", subtitle: "完全没印象" },
  { rating: 2, title: "一般", subtitle: "想了很久才想起来" },
  { rating: 3, title: "良好", subtitle: "略加思考就想起来了" },
  { rating: 4, title: "熟记", subtitle: "脱口而出" },
];

export default function ReviewButtons({ onRate }: ReviewButtonsProps) {
  const [pendingRating, setPendingRating] = useState<ReviewRating | null>(null);

  const handleClick = async (rating: ReviewRating) => {
    if (pendingRating !== null) return;
    setPendingRating(rating);
    try {
      await onRate(rating);
    } finally {
      setPendingRating(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {REVIEW_OPTIONS.map((item) => (
        <button
          key={item.rating}
          type="button"
          disabled={pendingRating !== null}
          onClick={() => handleClick(item.rating)}
          className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <p className="text-sm text-foreground">
            {pendingRating === item.rating ? "提交中..." : item.title}
          </p>
          <p className="mt-1 text-xs text-secondary">{item.subtitle}</p>
        </button>
      ))}
    </div>
  );
}

