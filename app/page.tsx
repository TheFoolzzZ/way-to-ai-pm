"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar, { NavSection } from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import QuestionModal from "@/components/QuestionModal";
import { mockCategories, mockQuestions, QuestionCategory, QuestionItem } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";

const getCategoryAnchor = (category: QuestionCategory) => `category-${category.id}`;

export default function HomePage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (!supabase) {
          if (!isMounted) return;
          setCategories(mockCategories);
          setQuestions(mockQuestions);
          return;
        }

        const [{ data: categoryData, error: categoryError }, { data: questionData, error: questionError }] =
          await Promise.all([
            supabase.from("question_categories").select("*").order("sort_order", { ascending: true }),
            supabase.from("questions").select("*").order("created_at", { ascending: false }),
          ]);

        if (categoryError || questionError) {
          throw categoryError || questionError;
        }

        if (!isMounted) return;
        setCategories((categoryData as QuestionCategory[]) || []);
        setQuestions((questionData as QuestionItem[]) || []);
      } catch (error) {
        if (!isMounted) return;
        setCategories(mockCategories);
        setQuestions(mockQuestions);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesWithQuestions = useMemo(() => {
    const categoryMap = new Map<string, QuestionItem[]>();
    questions.forEach((question) => {
      if (!question.category_id) return;
      const list = categoryMap.get(question.category_id) || [];
      list.push(question);
      categoryMap.set(question.category_id, list);
    });

    return categories
      .map((category) => ({
        category,
        questions: categoryMap.get(category.id) || [],
        anchorId: getCategoryAnchor(category),
      }))
      .filter((entry) => entry.questions.length > 0);
  }, [categories, questions]);

  const navSections: NavSection[] = useMemo(() => {
    const sections = categoriesWithQuestions.map((entry) => ({
      id: entry.anchorId,
      label: entry.category.name,
    }));
    return [{ id: "home", label: "HOME" }, ...sections];
  }, [categoriesWithQuestions]);

  const handleStart = () => {
    const targetId = categoriesWithQuestions[0]?.anchorId;
    if (!targetId) return;
    const element = document.getElementById(targetId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const demoQuestion = useMemo(() => {
    const productCategoryId =
      categories.find((category) => category.name === "产品思维")?.id ?? "cat-product";
    const productQuestion = questions.find((question) => question.category_id === productCategoryId);
    return productQuestion || questions[0];
  }, [categories, questions]);

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
              <h3 className="font-display mt-3 text-2xl font-semibold text-foreground">沉浸学习节奏</h3>
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

        {!loading && categoriesWithQuestions.length === 0 && (
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
            questions={entry.questions}
            anchorId={entry.anchorId}
            onSelect={(question) => setActiveQuestion(question)}
          />
        ))}
      </main>

      <footer className="py-12">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-12">
          <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 text-sm text-secondary md:flex-row md:items-center">
            <span>Way to AI PM · 学习系统</span>
            <span>Designed for focused practice · 2026</span>
          </div>
        </div>
      </footer>

      <QuestionModal question={activeQuestion} onClose={() => setActiveQuestion(null)} />
    </div>
  );
}
