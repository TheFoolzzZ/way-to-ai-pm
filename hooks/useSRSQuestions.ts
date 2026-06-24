// hooks/useSRSQuestions.ts
"use client";

import useSWRInfinite from "swr/infinite";
import type { QuestionItem } from "@/data/mock-data";
import { PAGE_SIZE } from "@/hooks/useInfiniteQuestions";
import { getSrsQuestionsPage } from "@/app/actions/questions";

export type SRSQuestionItem = QuestionItem & {
  due_date?: string | null;
  srs_state: "新题" | "待复习" | "已掌握";
};

type UseSRSQuestionsOptions = { enabled?: boolean };
type SRSPageKey = [categoryId: string, pageIndex: number];

// SRS 数据走 Server Action，服务端从 httpOnly cookie 取身份；
// supabase 未配置时返回空数组（与 useInfiniteQuestions fallback 对齐）。
async function fetchSrsPage([categoryId, pageIndex]: SRSPageKey): Promise<SRSQuestionItem[]> {
  return getSrsQuestionsPage(categoryId, pageIndex);
}

export function useSRSQuestions(
  categoryId: string,
  _legacyUserId?: string,
  options?: UseSRSQuestionsOptions
) {
  const enabled = options?.enabled ?? true;

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!enabled || !categoryId) return null;
      if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
      return [categoryId, pageIndex] as SRSPageKey;
    },
    fetchSrsPage,
    { revalidateFirstPage: false, persistSize: true, parallel: false }
  );

  const pages = data ?? [];
  const questions = pages.flat();
  const lastPage = pages[pages.length - 1] ?? [];
  const hasMore = questions.length > 0 && lastPage.length === PAGE_SIZE;
  const isLoadingMore = isValidating && size > pages.length;

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    await setSize((prev) => prev + 1);
  };
  const refresh = async () => { await mutate(); };

  return { questions, error, hasMore, isLoading, isLoadingMore, loadMore, refresh };
}
