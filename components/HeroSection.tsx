"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui";
import type { QuestionItem } from "@/data/mock-data";
import { stripMarkdown } from "@/lib/text";

const defaultDemo = {
  question: "什么是 MVP？",
  answer: "MVP 是用最小成本验证核心假设的最小可行产品。",
};

type HeroSectionProps = {
  onStart: () => void;
  demoQuestion?: QuestionItem;
};

export default function HeroSection({ onStart, demoQuestion }: HeroSectionProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  const preview = useMemo(() => {
    const question = demoQuestion?.question ?? defaultDemo.question;
    const answer = demoQuestion?.answer ?? defaultDemo.answer;
    return {
      question: stripMarkdown(question),
      answer: stripMarkdown(answer),
    };
  }, [demoQuestion]);

  return (
    <section
      id="home"
      className="min-h-[85vh] pt-28 pb-12 flex items-center overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-stretch gap-12 px-4 md:grid-cols-2 md:px-12">
        <div className="flex min-h-[420px] flex-col justify-between md:min-h-[520px]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-primary">
              <span className="h-[2px] w-10 bg-primary" />
              PM INTERVIEW 2026
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.05] md:text-6xl lg:text-7xl">
              HELLO<span className="ml-2 inline-block h-4 w-4 bg-primary align-baseline md:h-5 md:w-5" />
            </h1>

            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
                Way to AI product manager
              </h2>
              <p className="text-lg text-secondary md:text-xl">
                覆盖产品思维、项目经历、技术背景、商业分析等核心维度。
              </p>
            </div>

            <div className="flex items-start gap-4 text-base text-secondary md:text-lg">
              <span className="mt-1 h-10 w-[3px] bg-primary" />
              <div>
                翻转即见答案，像 Anki 一样高效记忆，
                <span className="text-foreground">沉浸式学习节奏</span>。
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <Button
              size="lg"
              className="neo-glow-btn rounded-full px-6 py-3 text-base"
              onClick={onStart}
            >
              开始学习
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="neo-outline-btn rounded-full px-6 py-3 text-base"
              onClick={onStart}
            >
              了解题目结构
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-[420px] items-center justify-center md:min-h-[520px]">
          <div className="relative w-full max-w-[360px] md:max-w-[400px]">
            <div className="absolute -right-6 top-4 h-full w-full rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(10,18,38,0.5)] blur-[1px]" />
            <div className="absolute -right-10 top-10 h-full w-full rounded-3xl border border-[rgba(255,255,255,0.05)] bg-[rgba(6,10,24,0.5)]" />

            <div
              className="flip-card h-[520px] rounded-3xl"
              style={{ animation: "float 6s ease-in-out infinite" }}
            >
              <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
                <div className="flip-face front">
                  <div className="tarot-card flex h-full flex-col justify-between rounded-3xl p-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-secondary">
                      <span>DEMO CARD</span>
                      <span className="text-primary">FRONT</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-lg font-semibold text-foreground md:text-xl">
                        {preview.question}
                      </p>
                      <p className="text-sm text-secondary">
                        点击翻转，查看完整答案与拆解思路。
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span>ANKI FLIP</span>
                      <span>04s AUTO</span>
                    </div>
                  </div>
                </div>
                <div className="flip-face back">
                  <div className="tarot-card flex h-full flex-col justify-between rounded-3xl p-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-secondary">
                      <span>ANSWER KEY</span>
                      <span className="text-accent">BACK</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-base text-foreground md:text-lg">
                        {preview.answer}
                      </p>
                    </div>
                    <div className="text-xs text-secondary">Flip again to review.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
