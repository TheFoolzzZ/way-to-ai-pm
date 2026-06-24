"use client";

type UserBadgeProps = {
  username: string;
};

export default function UserBadge({ username }: UserBadgeProps) {
  return (
    <div className="rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-xs font-medium tracking-wide text-foreground">
      👤 {username} (已解锁)
    </div>
  );
}

