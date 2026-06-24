// app/actions/questions.ts
"use server";

import { getServerSupabase } from "@/lib/server-supabase";
import { readSession } from "@/lib/session";
import { PAGE_SIZE } from "@/hooks/useInfiniteQuestions";

export type SrsQuestionPageItem = {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  created_at?: string;
  due_date?: string | null;
  srs_state: "新题" | "待复习" | "已掌握";
};

type RpcRow = {
  id: string;
  question?: string;
  answer: string;
  category_id: string;
  created_at?: string;
  due_date?: string | null;
  sort_priority?: number | null;
};

function toSrsState(sortPriority: number | null | undefined, dueDate?: string | null) {
  if (sortPriority === 1) return "待复习" as const;
  if (sortPriority === 2 || !dueDate) return "新题" as const;
  return "已掌握" as const;
}

export async function getSrsQuestionsPage(
  categoryId: string,
  pageIndex: number
): Promise<SrsQuestionPageItem[]> {
  const session = await readSession();
  if (!session) return [];

  const supabase = getServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_srs_questions", {
    p_category_id: categoryId,
    p_user_id: session.userId,
    p_limit: PAGE_SIZE,
    p_offset: pageIndex * PAGE_SIZE,
  });

  if (error) throw error;

  // 列表只取轻量字段，answer 留空（点开时由 QuestionModal 按需查询）
  return ((data as RpcRow[]) ?? []).map((row) => ({
    id: row.id,
    category_id: row.category_id,
    question: row.question ?? "",
    answer: "",
    created_at: row.created_at,
    due_date: row.due_date,
    srs_state: toSrsState(row.sort_priority, row.due_date),
  }));
}
