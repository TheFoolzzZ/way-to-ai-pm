"use client";

import Link from "next/link";
import VirtualCardRow from "@/components/VirtualCardRow";
import type { QuestionCategory, QuestionItem } from "@/data/mock-data";
import { useInfiniteQuestions } from "@/hooks/useInfiniteQuestions";

type CategorySectionProps = {
  category: QuestionCategory;
  anchorId: string;
  onSelect: (question: QuestionItem) => void;
  isUnlocked: boolean;
  previewLimit?: number;
  onRequireUnlock: () => void;
};

export default function CategorySection({
  category,
  anchorId,
  onSelect,
  isUnlocked,
  previewLimit = 5,
  onRequireUnlock,
}: CategorySectionProps) {
  const { questions, error, hasMore, isLoading, isLoadingMore, loadMore, retry } =
    useInfiniteQuestions(category.id);

  const visibleQuestions = isUnlocked ? questions : questions.slice(0, previewLimit);
  const hasMoreLocked = !isUnlocked && questions.length > previewLimit;

  if (!isLoading && questions.length === 0 && !error) return null;

  return (
    <section id={anchorId} className="py-16">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <span className="section-title text-xs text-primary">SECTION</span>
              <div className="glow-line flex-1" />
            </div>
            <h3 className="font-display mt-3 text-2xl font-semibold text-foreground md:text-3xl">
              {category.name}
            </h3>
          </div>
          {isUnlocked ? (
            <Link
              href={`/category/${category.id}`}
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              查看全部 &gt;
            </Link>
          ) : (
            <button
              type="button"
              onClick={onRequireUnlock}
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              查看全部 &gt;
            </button>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-sm text-secondary">
            正在加载题目...
          </div>
        )}

        {!isLoading && (
          <VirtualCardRow
            questions={visibleQuestions}
            onSelect={onSelect}
            hasMore={isUnlocked ? hasMore : false}
            isLoadingMore={isUnlocked ? isLoadingMore : false}
            onLoadMore={loadMore}
            errorText={error ? "加载失败，点击重试" : undefined}
            onRetry={retry}
            lockedCard={
              hasMoreLocked
                ? {
                    title: "解锁查看更多题目",
                    description: "前 5 题可预览，第 6 题起需解锁。",
                    cta: "点击解锁",
                    onClick: onRequireUnlock,
                  }
                : undefined
            }
          />
        )}
      </div>
    </section>
  );
}
