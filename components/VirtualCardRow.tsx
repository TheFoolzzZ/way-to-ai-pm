"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import QuestionCard from "@/components/QuestionCard";
import ScrollIndicator from "@/components/ScrollIndicator";
import type { QuestionItem } from "@/data/mock-data";

const CARD_WIDTH = 284;
const GAP = 24;
const PRELOAD_THRESHOLD = 5;

type VirtualCardRowProps = {
  questions: QuestionItem[];
  onSelect: (question: QuestionItem) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  errorText?: string;
  onRetry?: () => void;
  lockedCard?: {
    title: string;
    description: string;
    cta: string;
    onClick: () => void;
  };
};

export default function VirtualCardRow({
  questions,
  onSelect,
  hasMore,
  isLoadingMore,
  onLoadMore,
  errorText,
  onRetry,
  lockedCard,
}: VirtualCardRowProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const items = useMemo(() => {
    const base: Array<
      | { kind: "question"; question: QuestionItem }
      | { kind: "locked" }
      | { kind: "error" }
      | { kind: "loading" }
    > = questions.map((question) => ({ kind: "question" as const, question }));
    if (lockedCard) {
      base.push({ kind: "locked" as const });
      return base;
    }
    if (errorText) {
      base.push({ kind: "error" as const });
      return base;
    }
    if (hasMore || isLoadingMore) {
      base.push({ kind: "loading" as const });
    }
    return base;
  }, [questions, hasMore, isLoadingMore, errorText, lockedCard]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_WIDTH + GAP,
    horizontal: true,
    overscan: 2,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    const reachedTail = virtualItems.some(
      (item) => item.index >= questions.length - PRELOAD_THRESHOLD
    );
    if (reachedTail && hasMore && !isLoadingMore && !lockedCard && !errorText) {
      onLoadMore();
    }
  }, [rowVirtualizer, questions.length, hasMore, isLoadingMore, onLoadMore, lockedCard, errorText]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const update = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      if (maxScrollLeft <= 0) {
        setProgress(0);
        return;
      }
      setProgress(element.scrollLeft / maxScrollLeft);
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div>
      <div ref={scrollRef} className="scroll-row mt-8 overflow-x-auto pb-4 pr-8">
        <div
          className="relative h-[380px]"
          style={{ width: rowVirtualizer.getTotalSize() }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            const left = virtualItem.start;
            const width = virtualItem.size - GAP;

            if (item?.kind === "question") {
              return (
                <div
                  key={item.question.id}
                  className="absolute top-0 h-full"
                  style={{ left, width }}
                >
                  <QuestionCard
                    question={item.question}
                    className="h-full w-full aspect-[2.5/3.5]"
                    onClick={() => onSelect(item.question)}
                  />
                </div>
              );
            }

            if (item?.kind === "locked" && lockedCard) {
              return (
                <button
                  key="locked-entry"
                  type="button"
                  onClick={lockedCard.onClick}
                  className="absolute top-0 h-full rounded-2xl border border-dashed border-primary/45 bg-white/[0.03] p-6 text-left transition-colors hover:bg-white/[0.06]"
                  style={{ left, width }}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="text-xs uppercase tracking-[0.24em] text-secondary">Locked</div>
                    <div>
                      <div className="mb-3 text-2xl">🔒</div>
                      <h4 className="text-lg font-semibold text-foreground">{lockedCard.title}</h4>
                      <p className="mt-2 text-sm text-secondary">{lockedCard.description}</p>
                    </div>
                    <div className="text-xs text-primary">{lockedCard.cta}</div>
                  </div>
                </button>
              );
            }

            if (item?.kind === "error") {
              return (
                <div
                  key="error-entry"
                  className="absolute top-0 flex h-full rounded-2xl border border-danger/45 bg-danger/10 p-6"
                  style={{ left, width }}
                >
                  <div className="my-auto">
                    <p className="text-sm text-foreground">{errorText}</p>
                    {onRetry && (
                      <button
                        type="button"
                        className="mt-3 text-sm text-primary underline underline-offset-4"
                        onClick={onRetry}
                      >
                        点击重试
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key="loading-entry"
                className="absolute top-0 h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                style={{ left, width }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/15" />
                  <div>
                    <div className="h-5 w-40 animate-pulse rounded bg-white/15" />
                    <p className="mt-4 text-sm text-secondary">
                      正在从脑机接口下载更多题目...
                    </p>
                  </div>
                  <div className="h-3 w-20 animate-pulse rounded bg-white/15" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ScrollIndicator progress={progress} />
    </div>
  );
}

