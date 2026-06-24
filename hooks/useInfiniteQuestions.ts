"use client";

import useSWRInfinite from "swr/infinite";
import type { QuestionItem } from "@/data/mock-data";
import { mockQuestions } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";

export const PAGE_SIZE = 20;

type UseInfiniteQuestionsOptions = {
  enabled?: boolean;
};

type QuestionPageKey = [categoryId: string, pageIndex: number];

async function fetchQuestionPage([categoryId, pageIndex]: QuestionPageKey): Promise<QuestionItem[]> {
  const from = pageIndex * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (!supabase) {
    const fallback = mockQuestions
      .filter((item) => item.category_id === categoryId)
      .slice(from, to + 1);
    return fallback;
  }

  // 列表只取轻量字段（不含 answer），答案在点开时按需查询
  const { data, error } = await supabase
    .from("questions")
    .select("id,question,category_id,created_at")
    .eq("category_id", categoryId)
    .range(from, to)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;
  return (data as QuestionItem[]) ?? [];
}

export function useInfiniteQuestions(categoryId: string, options?: UseInfiniteQuestionsOptions) {
  const enabled = options?.enabled ?? true;

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!enabled || !categoryId) return null;
      if (previousPageData && previousPageData.length < PAGE_SIZE) return null;
      return [categoryId, pageIndex] as QuestionPageKey;
    },
    fetchQuestionPage,
    {
      revalidateFirstPage: false,
      persistSize: true,
      parallel: false,
    }
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

  const retry = async () => {
    await mutate();
  };

  return {
    questions,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    retry,
  };
}

