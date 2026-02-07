"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/components/ui";

export type NavSection = {
  id: string;
  label: string;
};

type NavbarProps = {
  sections: NavSection[];
  onStart: () => void;
};

export default function Navbar({ sections, onStart }: NavbarProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!sections.length) return;

    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActiveSection(section.id);
          }
        },
        {
          rootMargin: "-20% 0px -40% 0px",
          threshold: [0.5],
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  const handleScrollTo = (id: string) => {
    if (isScrollingRef.current || activeSection === id) {
      return;
    }

    const element = document.getElementById(id);
    if (!element) return;

    isScrollingRef.current = true;
    const headerOffset = 88;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    setIsMobileMenuOpen(false);

    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 700);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center neo-navbar">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 md:px-12">
        <button
          className="flex items-center gap-2 text-left"
          onClick={() => handleScrollTo("home")}
        >
          <span className="text-primary" aria-hidden="true">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path
                d="M12 2v5M12 17v5M2 12h5M17 12h5M4.6 4.6l3.6 3.6M15.8 15.8l3.6 3.6M4.6 19.4l3.6-3.6M15.8 8.2l3.6-3.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">克莱恩的AI搭子</span>
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {sections.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className={cn(
                  "relative text-sm font-medium tracking-wide transition-all duration-200",
                  isActive
                    ? "text-[#dc2626] scale-110"
                    : "text-foreground/80 hover:text-primary"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#dc2626]" />
                )}
              </button>
            );
          })}
          <button
            onClick={onStart}
            className="neo-outline-btn rounded-full px-5 py-2 text-sm font-semibold"
          >
            开始刷题
          </button>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 neo-panel md:hidden">
          <div className="flex flex-col gap-4 p-6">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className={cn(
                  "text-left text-base font-medium",
                  activeSection === item.id
                    ? "text-[#dc2626]"
                    : "text-foreground/80"
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={onStart}
              className="neo-outline-btn rounded-full px-5 py-2 text-sm font-semibold"
            >
              开始刷题
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
