"use client";

type CelebrationOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const PARTICLE_COUNT = 28;

export default function CelebrationOverlay({ open, onClose }: CelebrationOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] overflow-hidden bg-[rgba(2,6,18,0.86)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,240,255,0.2),transparent_58%)]" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center">
        <p className="section-title text-xs text-primary">SYSTEM FEEDBACK</p>
        <h2 className="font-display mt-3 text-4xl text-foreground md:text-5xl">全部掌握</h2>
        <p className="mt-2 text-sm text-secondary">记忆网络稳定，继续保持节奏。</p>
      </div>

      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
        const left = `${(index / PARTICLE_COUNT) * 100}%`;
        const duration = 2.8 + (index % 7) * 0.35;
        const delay = (index % 6) * 0.2;
        const size = 4 + (index % 5) * 2;
        return (
          <span
            key={index}
            className="celebration-particle"
            style={{
              left,
              width: size,
              height: size * 1.6,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      <button
        type="button"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-5 py-2 text-sm text-secondary transition-colors hover:text-foreground"
        onClick={onClose}
      >
        关闭
      </button>
    </div>
  );
}
