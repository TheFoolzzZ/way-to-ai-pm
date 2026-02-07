"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, Lock, Plus, Save, ShieldAlert, Tag } from "lucide-react";
import MarkdownPreview from "@/components/MarkdownPreview";
import { mockCategories, mockQuestions, QuestionCategory, QuestionItem } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";
import { stripMarkdown } from "@/lib/text";

const formatLabel = (text: string) => stripMarkdown(text).slice(0, 32) || "未命名题目";

export default function AdminQuestionsPage() {
  const isSupabaseReady = Boolean(supabase);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    if (!isSupabaseReady) {
      setIsAuthenticated(true);
      return;
    }

    const authenticated = sessionStorage.getItem("admin_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
  }, [isSupabaseReady]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        if (!supabase) {
          setCategories(mockCategories);
          setQuestions(mockQuestions);
          return;
        }

        const [
          { data: categoryData, error: categoryError },
          { data: questionData, error: questionError },
        ] = await Promise.all([
          supabase.from("question_categories").select("*").order("sort_order", { ascending: true }),
          supabase.from("questions").select("*").order("created_at", { ascending: false }),
        ]);

        if (categoryError || questionError) throw categoryError || questionError;

        setCategories((categoryData as QuestionCategory[]) || []);
        setQuestions((questionData as QuestionItem[]) || []);
      } catch (err) {
        setCategories(mockCategories);
        setQuestions(mockQuestions);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedId) || null,
    [questions, selectedId]
  );

  useEffect(() => {
    if (!selectedQuestion) return;

    setQuestionText(selectedQuestion.question);
    setAnswerText(selectedQuestion.answer);
    const matchCategory = categories.find(
      (category) => category.id === selectedQuestion.category_id
    );
    setCategoryName(matchCategory?.name ?? "");
  }, [selectedQuestion, categories]);

  const questionList = useMemo(() => {
    return [...questions].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [questions]);

  const resetForm = () => {
    setSelectedId(null);
    setQuestionText("");
    setAnswerText("");
    setCategoryName("");
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Database connection unavailable");
      return;
    }

    const { data, error: dbError } = await supabase
      .from("admin_secrets")
      .select("id")
      .eq("passcode", passcode)
      .single();

    if (dbError || !data) {
      setError("Access Denied");
      setPasscode("");
      return;
    }

    sessionStorage.setItem("admin_authenticated", "true");
    setIsAuthenticated(true);
  };

  const handlePublish = async () => {
    setError("");

    if (!questionText.trim() || !answerText.trim() || !categoryName.trim()) {
      setError("题干、答案与类型不能为空");
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedCategory = categoryName.trim();
      let categoryId = categories.find((cat) => cat.name === trimmedCategory)?.id;

      if (!categoryId) {
        const newCategory: QuestionCategory = {
          id: `local-${Date.now()}`,
          name: trimmedCategory,
          sort_order: categories.length + 1,
        };

        if (supabase) {
          const { data, error: insertError } = await supabase
            .from("question_categories")
            .insert({ name: trimmedCategory, sort_order: newCategory.sort_order })
            .select("*")
            .single();

          if (insertError) throw insertError;
          categoryId = (data as QuestionCategory).id;
          setCategories((prev) => [...prev, data as QuestionCategory]);
        } else {
          categoryId = newCategory.id;
          setCategories((prev) => [...prev, newCategory]);
        }
      }

      if (selectedQuestion) {
        const updated: QuestionItem = {
          ...selectedQuestion,
          question: questionText,
          answer: answerText,
          category_id: categoryId,
          updated_at: new Date().toISOString(),
        };

        if (supabase) {
          const { error: updateError } = await supabase
            .from("questions")
            .update({
              question: updated.question,
              answer: updated.answer,
              category_id: updated.category_id,
              updated_at: updated.updated_at,
            })
            .eq("id", updated.id);

          if (updateError) throw updateError;
        }

        setQuestions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const newItem: QuestionItem = {
          id: `local-${Date.now()}`,
          question: questionText,
          answer: answerText,
          category_id: categoryId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (supabase) {
          const { data, error: insertError } = await supabase
            .from("questions")
            .insert({
              question: newItem.question,
              answer: newItem.answer,
              category_id: newItem.category_id,
              created_at: newItem.created_at,
              updated_at: newItem.updated_at,
            })
            .select("*")
            .single();

          if (insertError) throw insertError;
          setQuestions((prev) => [data as QuestionItem, ...prev]);
        } else {
          setQuestions((prev) => [newItem, ...prev]);
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      resetForm();
    } catch (err) {
      setError("发布失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.2),transparent_60%)] opacity-70" />
        <form
          onSubmit={handleLogin}
          className="neo-panel relative z-10 w-full max-w-md rounded-3xl p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">Admin Access</h1>
            <p className="text-sm text-secondary">输入口令进入题目编辑器</p>
          </div>

          <input
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Enter passcode..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-foreground outline-none transition focus:border-primary"
          />

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black"
          >
            验证并进入
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 pt-24">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Admin Panel</p>
            <h1 className="text-lg font-semibold text-foreground">题目管理后台</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isSupabaseReady && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-secondary">
                本地预览模式
              </span>
            )}
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black"
            >
              {showSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {showSuccess ? "已发布" : "发布/保存"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 md:px-8 lg:grid-cols-[280px_1fr_360px]">
        <aside className="neo-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">题目目录</h2>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-secondary"
            >
              <Plus className="h-3 w-3" />
              新增题目
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {questionList.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-secondary">
                暂无题目，点击右上角发布即可新增。
              </p>
            )}
            {questionList.map((item) => {
              const label = formatLabel(item.question);
              const category = categories.find((cat) => cat.id === item.category_id)?.name;
              const isActive = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-white/10 bg-white/5 text-secondary hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground/90">{label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-secondary">
                    {category || "未分类"}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="neo-panel rounded-3xl p-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-secondary">题目类型</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                <Tag className="h-4 w-4 text-secondary" />
                <input
                  list="category-list"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="选择或输入新类型"
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                />
                <datalist id="category-list">
                  {categories.map((category) => (
                    <option key={category.id} value={category.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-secondary">题干 (Markdown)</label>
              <textarea
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                placeholder="请输入题干内容..."
                className="mt-2 h-48 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-secondary">答案 (Markdown)</label>
              <textarea
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                placeholder="请输入答案内容..."
                className="mt-2 h-48 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </section>

        <aside className="neo-panel rounded-3xl p-6">
          <MarkdownPreview title="题干预览" content={questionText} highlight={categoryName || "TYPE"} />
          <div className="my-6 border-t border-white/10" />
          <MarkdownPreview title="答案预览" content={answerText} />
        </aside>
      </div>
    </div>
  );
}
