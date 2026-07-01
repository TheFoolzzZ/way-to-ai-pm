"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type UnlockModalProps = {
  open: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
};

const ERROR_TEXT: Record<string, string> = {
  TOKEN_NOT_FOUND: "暗号无效，请确认后重试",
  TOKEN_ALREADY_BOUND: "该暗号已被使用，请联系管理员获取新的暗号",
  INVALID_INPUT: "请先完整填写暗号与昵称",
  NETWORK_ERROR: "网络异常，请稍后重试",
  UNKNOWN_ERROR: "解锁失败，请稍后重试",
};

export default function UnlockModal({ open, onClose, onUnlocked }: UnlockModalProps) {
  const { unlock } = useAuth();
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return token.trim().length > 0 && username.trim().length > 0 && !submitting;
  }, [token, username, submitting]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorText("");
    const result = await unlock(token, username);
    setSubmitting(false);

    if (!result.success) {
      setErrorText(ERROR_TEXT[result.error] ?? ERROR_TEXT.UNKNOWN_ERROR);
      return;
    }

    setToken("");
    setUsername("");
    onUnlocked?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="neo-panel w-full max-w-[520px] rounded-3xl p-6 md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-foreground md:text-2xl">
            🔐 解锁完整题库
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-secondary transition-colors hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-foreground/90">内测暗号</span>
            <input
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setErrorText("");
              }}
              placeholder="请输入暗号..."
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-foreground/90">你的昵称</span>
            <input
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrorText("");
              }}
              placeholder="请输入昵称..."
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
              autoComplete="off"
            />
          </label>

          {errorText && <p className="text-sm text-danger">{errorText}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="neo-glow-btn mt-2 w-full rounded-xl border border-primary/45 bg-primary/20 px-4 py-3 text-sm font-semibold text-foreground transition-all disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "解锁中..." : "解锁"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-secondary">向愚者先生祈祷吧。</p>
      </div>
    </div>
  );
}
