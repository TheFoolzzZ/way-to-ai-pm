"use client";

type ScrollIndicatorProps = {
  progress: number;
};

export default function ScrollIndicator({ progress }: ScrollIndicatorProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full bg-primary/80 transition-[width] duration-200"
        style={{ width: `${safeProgress * 100}%` }}
      />
    </div>
  );
}

