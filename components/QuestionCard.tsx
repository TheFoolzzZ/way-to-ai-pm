"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/components/ui";
import type { QuestionItem } from "@/data/mock-data";
import { stripMarkdown } from "@/lib/text";

type QuestionCardProps = {
  question: QuestionItem;
  className?: string;
  onClick: () => void;
};

export default function QuestionCard({ question, className, onClick }: QuestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tarot-card group flex h-full flex-col justify-between rounded-2xl p-6 text-left transition-transform duration-200 hover:-translate-y-2",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-secondary">
        <span>Question</span>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="mt-6 space-y-4">
        <h4 className="line-clamp-4 text-center text-xl font-semibold text-foreground md:text-2xl">
          {stripMarkdown(question.question)}
        </h4>
        <p className="text-sm text-secondary">点击查看完整题干与答案。</p>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-secondary">
        <span>ANKI FLIP</span>
        <span className="text-primary">OPEN</span>
      </div>
    </button>
  );
}
