"use client";

type ProgressSummaryProps = {
  reviewCount: number;
  newCount: number;
  masteredCount: number;
};

export default function ProgressSummary({
  reviewCount,
  newCount,
  masteredCount,
}: ProgressSummaryProps) {
  const total = reviewCount + newCount + masteredCount;
  const completedRatio = total > 0 ? masteredCount / total : 0;

  return (
    <section className="neo-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-secondary">
          待复习 {reviewCount} 题 · 新题 {newCount} 题 · 已掌握 {masteredCount} 题
        </p>
        <p className="text-foreground">{Math.round(completedRatio * 100)}%</p>
      </div>
      <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-primary/80 transition-[width] duration-300"
          style={{ width: `${completedRatio * 100}%` }}
        />
      </div>
    </section>
  );
}

