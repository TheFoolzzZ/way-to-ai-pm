"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { QuestionItem } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";

type MarkdownProps = HTMLAttributes<HTMLElement> & { node?: unknown };

const markdownComponents = {
  h1: (props: MarkdownProps) => (
    <h1 {...props} className="text-xl font-semibold text-foreground" />
  ),
  h2: (props: MarkdownProps) => (
    <h2 {...props} className="text-lg font-semibold text-foreground" />
  ),
  h3: (props: MarkdownProps) => (
    <h3 {...props} className="text-base font-semibold text-foreground" />
  ),
  p: (props: MarkdownProps) => (
    <p {...props} className="text-sm leading-relaxed text-secondary" />
  ),
  li: (props: MarkdownProps) => (
    <li {...props} className="text-sm leading-relaxed text-secondary" />
  ),
  strong: (props: MarkdownProps) => (
    <strong {...props} className="text-foreground" />
  ),
};

type QuestionModalProps = {
  question: QuestionItem | null;
  onClose: () => void;
  footer?: ReactNode;
  isExiting?: boolean;
};

export default function QuestionModal({
  question,
  onClose,
  footer,
  isExiting = false,
}: QuestionModalProps) {
  useEffect(() => {
    if (!question) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [question, onClose]);

  if (!question || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modal-root fixed inset-0 z-[999] flex min-h-screen w-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-black/70 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[780px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute right-0 top-0 -translate-y-12 rounded-full border border-white/10 bg-white/5 p-2 text-foreground hover:bg-white/10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <QuestionFlipCard key={question.id} question={question} isExiting={isExiting} />
        {footer ? <div className="mx-auto mt-4 w-full max-w-[720px]">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

function QuestionFlipCard({
  question,
  isExiting,
}: {
  question: QuestionItem;
  isExiting: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  // 答案按需加载：列表里 answer 为空，点开时才查
  const [answer, setAnswer] = useState(question.answer ?? "");
  const [loadingAnswer, setLoadingAnswer] = useState(!question.answer);

  useEffect(() => {
    setAnswer(question.answer ?? "");
    setLoadingAnswer(!question.answer);
    if (question.answer) return;
    if (!supabase) return;

    let mounted = true;
    supabase
      .from("questions")
      .select("answer")
      .eq("id", question.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data?.answer) {
          setLoadingAnswer(false);
          return;
        }
        setAnswer(data.answer);
        setLoadingAnswer(false);
      });

    return () => {
      mounted = false;
    };
  }, [question.id, question.answer]);

  return (
    <div className="flip-card mx-auto w-full max-w-[520px] aspect-[2.5/3.5] max-h-[80vh]">
      <div className={`flip-card-inner ${flipped ? "flipped" : ""} ${isExiting ? "exiting" : ""}`}>
        <button
          type="button"
          className="flip-face front glass-card flex h-full w-full flex-col rounded-3xl p-8 text-left"
          onClick={() => setFlipped(true)}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-secondary">
            <span>QUESTION</span>
            <span className="text-primary">FRONT</span>
          </div>

          <div className="modal-scroll question-body mt-6 flex flex-1 items-center justify-center overflow-x-hidden overflow-y-auto px-4 text-center">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {question.question}
            </ReactMarkdown>
          </div>

          <div className="pt-6 text-sm text-secondary">
            ♾️ 点击翻转查看答案
          </div>
        </button>

        <button
          type="button"
          className="flip-face back glass-card flex h-full w-full flex-col rounded-3xl p-8 text-left"
          onClick={() => setFlipped(false)}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-secondary">
            <span>ANSWER KEY</span>
            <span className="text-accent">BACK</span>
          </div>

          <div className="modal-scroll answer-body mt-6 flex-1 space-y-4 overflow-x-hidden overflow-y-auto pr-2">
            {loadingAnswer ? (
              <p className="text-sm text-secondary">正在加载答案...</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {answer}
              </ReactMarkdown>
            )}
          </div>

          <div className="pt-6 text-sm text-secondary">
            ♾️ 点击翻回题目
          </div>
        </button>
      </div>
    </div>
  );
}
