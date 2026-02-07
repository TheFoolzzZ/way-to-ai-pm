"use client";

import QuestionCard from "@/components/QuestionCard";
import type { QuestionCategory, QuestionItem } from "@/data/mock-data";

const cardWidth = "w-[220px] sm:w-[240px] md:w-[260px] aspect-[2.5/3.5]";

type CategorySectionProps = {
  category: QuestionCategory;
  questions: QuestionItem[];
  anchorId: string;
  onSelect: (question: QuestionItem) => void;
};

export default function CategorySection({
  category,
  questions,
  anchorId,
  onSelect,
}: CategorySectionProps) {
  if (!questions.length) return null;

  return (
    <section id={anchorId} className="py-16">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="section-title text-xs text-primary">SECTION</span>
            <div className="glow-line flex-1" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
            {category.name}
          </h3>
        </div>

        <div className="scroll-row mt-8 flex gap-6 overflow-x-auto pb-6 pr-8">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              className={cardWidth}
              onClick={() => onSelect(question)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
