"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar, { NavSection } from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import SideNav from "@/components/SideNav";
import QuestionModal from "@/components/QuestionModal";
import UnlockModal from "@/components/UnlockModal";
import { mockCategories, mockQuestions, QuestionCategory, QuestionItem } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const getCategoryAnchor = (category: QuestionCategory) => `category-${category.id}`;
const PREVIEW_LIMIT = 5;

export default function HomePage() {
  const { isUnlocked, isReady } = useAuth();
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [demoQuestion, setDemoQuestion] = useState<QuestionItem | undefined>(undefined);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!supabase) {
          if (!isMounted) return;
          setCategories(mockCategories);
          setDemoQuestion(mockQuestions[0]);
          return;
        }

        const [{ data: categoryData, error: categoryError }, { data: firstQuestion, error: questionError }] =
          await Promise.all([
            supabase.from("question_categories").select("*").order("sort_order", { ascending: true }),
            supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);

        if (categoryError || questionError) {
          throw categoryError || questionError;
        }

        if (!isMounted) return;
        setCategories((categoryData as QuestionCategory[]) || []);
        setDemoQuestion((firstQuestion as QuestionItem | null) ?? undefined);
      } catch {
        if (!isMounted) return;
        setCategories(mockCategories);
        setDemoQuestion(mockQuestions[0]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesWithQuestions = useMemo(
    () =>
      categories.map((category) => ({
        category,
        anchorId: getCategoryAnchor(category),
      })),
    [categories]
  );

  const navSections: NavSection[] = useMemo(() => {
    const sections = categoriesWithQuestions.map((entry) => ({
      id: entry.anchorId,
      label: entry.category.name,
    }));
    return [{ id: "home", label: "HOME" }, ...sections];
  }, [categoriesWithQuestions]);

  // 左侧导航显隐：滚动到第一个章节时出现
  useEffect(() => {
    if (!categoriesWithQuestions.length) return;
    const firstId = categoriesWithQuestions[0].anchorId;
    const update = () => {
      const el = document.getElementById(firstId);
      if (!el) return;
      setSideNavVisible(el.getBoundingClientRect().top < window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [categoriesWithQuestions]);

  // scrollspy：跟踪当前可见章节
  useEffect(() => {
    if (!categoriesWithQuestions.length) return;
    const observers: IntersectionObserver[] = [];
    categoriesWithQuestions.forEach((entry) => {
      const el = document.getElementById(entry.anchorId);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) setActiveSection(entry.anchorId);
        },
        { rootMargin: "-40% 0px -50% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categoriesWithQuestions]);

  const handleStart = () => {
    if (!isReady || !isUnlocked) {
      setUnlockOpen(true);
      return;
    }

    const targetId = categoriesWithQuestions[0]?.anchorId;
    if (!targetId) return;
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSideNavNavigate = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 88;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar sections={navSections} onStart={handleStart} />
      <HeroSection onStart={handleStart} demoQuestion={demoQuestion} />

      <section className="py-12">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
          <div className="neo-panel rounded-3xl p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="section-title text-xs text-primary">FLOW</p>
                <h3 className="font-display mt-3 text-2xl font-semibold text-foreground">
                  沉浸学习节奏
                </h3>
              </div>
              <div className="text-sm text-secondary">
                平滑滚动导航，快速跳转题目模块。卡片点击即放大，翻转查看答案，像 Anki 一样高效。
              </div>
              <div className="text-sm text-secondary">
                模块根据题目类型动态渲染，横向滚动卡片列表，保留轻量学习路径与节奏感。
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {loading && (
          <section className="py-24">
            <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
              <div className="neo-panel rounded-3xl p-10 text-center text-secondary">
                正在加载题目数据...
              </div>
            </div>
          </section>
        )}

        {!loading && categories.length === 0 && (
          <section className="py-24">
            <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
              <div className="neo-panel rounded-3xl p-10 text-center text-secondary">
                暂无题目，请在后台管理中录入新问题。
              </div>
            </div>
          </section>
        )}

        {categoriesWithQuestions.map((entry) => (
          <CategorySection
            key={entry.category.id}
            category={entry.category}
            anchorId={entry.anchorId}
            onSelect={(question) => setActiveQuestion(question)}
            isUnlocked={isUnlocked}
            previewLimit={PREVIEW_LIMIT}
            onRequireUnlock={() => setUnlockOpen(true)}
          />
        ))}
      </main>

      <SideNav
        sections={navSections.filter((s) => s.id !== "home")}
        activeId={activeSection}
        visible={sideNavVisible}
        onNavigate={handleSideNavNavigate}
      />

      <footer className="py-12">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
          <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 text-sm text-secondary md:flex-row md:items-center">
            <span>Way to AI PM · 学习系统</span>
            <span>Designed for focused practice · 2026</span>
          </div>
        </div>
      </footer>

      <QuestionModal question={activeQuestion} onClose={() => setActiveQuestion(null)} />
      <UnlockModal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => setUnlockOpen(false)}
      />
    </div>
  );
}
