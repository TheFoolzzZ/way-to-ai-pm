// app/actions/review.ts
"use server";

import {
  scheduleReview,
  type ReviewRating,
  type UserQuestionReviewRecord,
} from "@/lib/srs";
import { getServerSupabase } from "@/lib/server-supabase";
import { readSession } from "@/lib/session";

type PersistedReview = UserQuestionReviewRecord;

type SubmitResult =
  | { success: true; nextReview: PersistedReview; previousReview: PersistedReview | null }
  | { success: false; error: string };

export async function submitReview(
  questionId: string,
  rating: ReviewRating
): Promise<SubmitResult> {
  const session = await readSession();
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const supabase = getServerSupabase();
  if (!supabase) return { success: false, error: "SUPABASE_NOT_CONFIGURED" };

  const safeQuestionId = questionId.trim();
  if (!safeQuestionId) return { success: false, error: "INVALID_INPUT" };

  const { data: existing, error: existingError } = await supabase
    .from("user_question_reviews")
    .select("due_date, stability, difficulty, reps, lapses, state, last_review")
    .eq("user_id", session.userId)
    .eq("question_id", safeQuestionId)
    .maybeSingle();

  if (existingError) return { success: false, error: existingError.message };

  const previousReview = (existing as PersistedReview | null) ?? null;
  const nextReview = scheduleReview(previousReview, rating);

  const { error: upsertError } = await supabase
    .from("user_question_reviews")
    .upsert(
      { user_id: session.userId, question_id: safeQuestionId, ...nextReview },
      { onConflict: "user_id,question_id" }
    );

  if (upsertError) return { success: false, error: upsertError.message };
  return { success: true, nextReview, previousReview };
}

export async function undoReview(
  questionId: string,
  previousReview: PersistedReview | null
): Promise<{ success: boolean; error?: string }> {
  const session = await readSession();
  if (!session) return { success: false, error: "UNAUTHORIZED" };

  const supabase = getServerSupabase();
  if (!supabase) return { success: false, error: "SUPABASE_NOT_CONFIGURED" };

  const safeQuestionId = questionId.trim();
  if (!safeQuestionId) return { success: false, error: "INVALID_INPUT" };

  if (!previousReview) {
    const { error } = await supabase
      .from("user_question_reviews")
      .delete()
      .eq("user_id", session.userId)
      .eq("question_id", safeQuestionId);
    return error ? { success: false, error: error.message } : { success: true };
  }

  const { error } = await supabase.from("user_question_reviews").upsert(
    { user_id: session.userId, question_id: safeQuestionId, ...previousReview },
    { onConflict: "user_id,question_id" }
  );
  return error ? { success: false, error: error.message } : { success: true };
}
