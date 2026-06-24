"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { submitReview, undoReview } from "@/app/actions/review";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import ProgressSummary from "@/components/ProgressSummary";
import QuestionListItem from "@/components/QuestionListItem";
import QuestionModal from "@/components/QuestionModal";
import ReviewButtons from "@/components/ReviewButtons";
import UndoToast from "@/components/UndoToast";
import UnlockModal from "@/components/UnlockModal";
import { mockCategories, type QuestionCategory, type QuestionItem } from "@/data/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteQuestions } from "@/hooks/useInfiniteQuestions";
import { useSRSQuestions, type SRSQuestionItem } from "@/hooks/useSRSQuestions";
import type { ReviewRating, UserQuestionReviewRecord } from "@/lib/srs";
import { supabase } from "@/lib/supabase";

const PREVIEW_LIMIT = 5;

type UndoState = {
  questionId: string;
  previousReview: UserQuestionReviewRecord | null;
};

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const { isUnlocked, user } = useAuth();

  const guestFeed = useInfiniteQuestions(categoryId, { enabled: !isUnlocked });
  const srsFeed = useSRSQuestions(categoryId, user?.id ?? "", {
    enabled: isUnlocked && Boolean(user?.id),
  });

  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [reviewAnimating, setReviewAnimating] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [dismissedCelebration, setDismissedCelebration] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCategory = async () => {
      if (!categoryId) return;

      const fallback = mockCategories.find((item) => item.id === categoryId) ?? null;
      if (!supabase) {
        if (mounted) setCategory(fallback);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("question_categories")
        .select("*")
        .eq("id", categoryId)
        .maybeSingle();

      if (!mounted) return;
      if (queryError || !data) {
        setCategory(fallback);
        return;
      }

      setCategory(data as QuestionCategory);
    };

    loadCategory();
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  const unlockedQuestions = useMemo(
    () => (isUnlocked ? srsFeed.questions : []),
    [isUnlocked, srsFeed.questions]
  );
  const guestQuestions = guestFeed.questions;
  const visibleQuestions = isUnlocked
    ? unlockedQuestions
    : guestQuestions.slice(0, PREVIEW_LIMIT);

  const isLoading = isUnlocked ? srsFeed.isLoading : guestFeed.isLoading;
  const hasMore = isUnlocked ? srsFeed.hasMore : guestQuestions.length > PREVIEW_LIMIT;
  const isLoadingMore = isUnlocked ? srsFeed.isLoadingMore : false;
  const hasError = isUnlocked ? Boolean(srsFeed.error) : Boolean(guestFeed.error);

  const summary = useMemo(() => {
    if (!isUnlocked) {
      return { reviewCount: 0, newCount: visibleQuestions.length, masteredCount: 0 };
    }

    const reviewCount = unlockedQuestions.filter((item) => item.srs_state === "待复习").length;
    const masteredCount = unlockedQuestions.filter((item) => item.srs_state === "已掌握").length;
    const newCount = unlockedQuestions.filter((item) => item.srs_state === "新题").length;
    return { reviewCount, newCount, masteredCount };
  }, [isUnlocked, unlockedQuestions, visibleQuestions.length]);

  const totalCount = summary.reviewCount + summary.newCount + summary.masteredCount;
  const allMastered = isUnlocked && totalCount > 0 && summary.masteredCount === totalCount;
  const celebrationOpen = allMastered && !dismissedCelebration;

  const refreshList = async () => {
    if (isUnlocked) {
      await srsFeed.refresh();
      return;
    }
    await guestFeed.retry();
  };

  const handleRate = async (rating: ReviewRating) => {
    if (!user?.id || !activeQuestion) return;

    setDismissedCelebration(false);
    setReviewAnimating(true);
    await new Promise((resolve) => setTimeout(resolve, 460));

    const result = await submitReview(activeQuestion.id, rating);
    setReviewAnimating(false);
    if (!result.success) return;

    setUndoState({
      questionId: activeQuestion.id,
      previousReview: result.previousReview,
    });
    setToastOpen(true);
    setActiveQuestion(null);
    await srsFeed.refresh();
  };

  const handleUndo = async () => {
    if (!undoState || !user?.id) {
      setToastOpen(false);
      return;
    }

    await undoReview(undoState.questionId, undoState.previousReview);
    setToastOpen(false);
    setUndoState(null);
    await srsFeed.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-24 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="section-title text-xs text-primary">CATEGORY</p>
          <h1 className="font-display mt-2 text-3xl text-foreground md:text-4xl">
            {category?.name ?? "题库列表"}
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-secondary transition-colors hover:text-foreground"
        >
          返回首页
        </Link>
      </div>

      <ProgressSummary
        reviewCount={summary.reviewCount}
        newCount={summary.newCount}
        masteredCount={summary.masteredCount}
      />

      {!isUnlocked && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-secondary">
          当前为游客预览，仅展示前 5 题。点击下方按钮解锁完整列表。
          <button
            type="button"
            className="ml-2 text-primary underline underline-offset-4"
            onClick={() => setUnlockOpen(true)}
          >
            立即解锁
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-secondary">
            正在加载题目...
          </div>
        )}

        {!isLoading &&
          visibleQuestions.map((question) => (
            <QuestionListItem
              key={question.id}
              question={question}
              status={isUnlocked ? (question as SRSQuestionItem).srs_state : "新题"}
              onClick={() => setActiveQuestion(question)}
            />
          ))}

        {!isLoading && !hasError && visibleQuestions.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-secondary">
            当前分类暂无题目，稍后再来看看。
          </div>
        )}

        {hasError && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-foreground">
            加载失败，请稍后重试。
            <button
              type="button"
              className="ml-2 text-primary underline underline-offset-4"
              onClick={refreshList}
            >
              重试
            </button>
          </div>
        )}
      </div>

      {isUnlocked && hasMore && (
        <div className="mt-6">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={srsFeed.loadMore}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-secondary transition-colors hover:text-foreground disabled:opacity-50"
          >
            {isLoadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}

      {!isUnlocked && hasMore && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setUnlockOpen(true)}
            className="rounded-full border border-primary/40 bg-primary/15 px-5 py-2 text-sm text-foreground"
          >
            🔒 解锁查看更多
          </button>
        </div>
      )}

      <QuestionModal
        question={activeQuestion}
        onClose={() => setActiveQuestion(null)}
        isExiting={reviewAnimating}
        footer={
          isUnlocked && activeQuestion ? (
            <ReviewButtons onRate={handleRate} />
          ) : null
        }
      />
      <UnlockModal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => setUnlockOpen(false)}
      />
      <UndoToast
        open={toastOpen}
        message="评价已提交，3-5 秒内可撤销。"
        durationMs={4500}
        onUndo={handleUndo}
        onClose={() => {
          setToastOpen(false);
          setUndoState(null);
        }}
      />
      <CelebrationOverlay
        open={celebrationOpen}
        onClose={() => setDismissedCelebration(true)}
      />
    </div>
  );
}
