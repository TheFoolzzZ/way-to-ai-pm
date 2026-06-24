"use client";

import type { QuestionItem } from "@/data/mock-data";
import { stripMarkdown } from "@/lib/text";

type QuestionStatus = "新题" | "待复习" | "已掌握";

type QuestionListItemProps = {
  question: QuestionItem;
  status?: QuestionStatus;
  onClick: () => void;
};

export default function QuestionListItem({
  question,
  status = "新题",
  onClick,
}: QuestionListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="line-clamp-2 text-sm text-foreground md:text-base">
          {stripMarkdown(question.question)}
        </p>
        <span className="shrink-0 text-xs text-secondary">{status}</span>
      </div>
    </button>
  );
}

