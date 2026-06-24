import { Rating, State, createEmptyCard, fsrs, type Card } from "ts-fsrs";

export type ReviewRating = 1 | 2 | 3 | 4;

export type UserQuestionReviewRecord = {
  due_date: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: "New" | "Learning" | "Review" | "Relearning";
  last_review: string | null;
};

const stateMap: Record<UserQuestionReviewRecord["state"], State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning,
};

const reverseStateMap: Record<State, UserQuestionReviewRecord["state"]> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

const scheduler = fsrs();

function toFiniteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function dbRecordToCard(review: UserQuestionReviewRecord): Card {
  return {
    due: new Date(review.due_date),
    stability: toFiniteNumber(review.stability),
    difficulty: toFiniteNumber(review.difficulty),
    reps: Math.max(0, Math.floor(toFiniteNumber(review.reps))),
    lapses: Math.max(0, Math.floor(toFiniteNumber(review.lapses))),
    state: stateMap[review.state] ?? State.New,
    last_review: review.last_review ? new Date(review.last_review) : undefined,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
  };
}

export function scheduleReview(
  review: UserQuestionReviewRecord | null,
  rating: ReviewRating
): UserQuestionReviewRecord {
  const card = review ? dbRecordToCard(review) : createEmptyCard(new Date());
  const now = new Date();
  const result = scheduler.repeat(card, now);
  const next = result[rating].card;

  return {
    due_date: next.due.toISOString(),
    stability: toFiniteNumber(next.stability),
    difficulty: toFiniteNumber(next.difficulty),
    reps: Math.max(0, Math.floor(toFiniteNumber(next.reps))),
    lapses: Math.max(0, Math.floor(toFiniteNumber(next.lapses))),
    state: reverseStateMap[next.state],
    last_review: now.toISOString(),
  };
}

export { Rating };

