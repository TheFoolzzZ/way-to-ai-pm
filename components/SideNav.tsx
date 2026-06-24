"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui";
import type { NavSection } from "@/components/Navbar";

type SideNavProps = {
  sections: NavSection[]; // 章节列表（不含 HOME）
  activeId: string; // 当前 scrollspy 命中章节
  visible: boolean; // 滚动到第一个章节后才显示
  onNavigate: (id: string) => void;
};

// 左侧悬浮章节导航：
// - 平时：最左侧细窄竖条（仅圆点），不遮挡内容
// - 悬停整栏：宽度展开，显示「序号 + 章节名」
// - 悬停/点击某项：该项放大高亮
export default function SideNav({ sections, activeId, visible, onNavigate }: SideNavProps) {
  const [barHovered, setBarHovered] = useState(false);
  const [itemHovered, setItemHovered] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          onMouseEnter={() => setBarHovered(true)}
          onMouseLeave={() => {
            setBarHovered(false);
            setItemHovered(null);
          }}
          className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 md:block"
          aria-label="章节导航"
        >
          <motion.div
            animate={{
              width: barHovered ? 232 : 30,
              backgroundColor: barHovered ? "rgba(18,18,22,0.82)" : "rgba(255,255,255,0)",
              borderColor: barHovered ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0)",
              boxShadow: barHovered ? "0 10px 36px rgba(0,0,0,0.45)" : "0 0 0 rgba(0,0,0,0)",
              paddingLeft: barHovered ? 12 : 9,
              paddingRight: barHovered ? 12 : 9,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="flex flex-col gap-1 rounded-2xl border py-3 backdrop-blur-sm"
          >
            {sections.map((s, i) => {
              const isActive = activeId === s.id;
              const isItemHovered = itemHovered === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onNavigate(s.id)}
                  onMouseEnter={() => setItemHovered(s.id)}
                  onMouseLeave={() => setItemHovered(null)}
                  className={cn(
                    "group relative flex items-center rounded-full py-2 text-left transition-colors",
                    isActive ? "text-[#dc2626]" : "text-foreground/70 hover:text-primary"
                  )}
                >
                  <motion.span
                    animate={{
                      width: barHovered ? 8 : 4,
                      height: barHovered ? 8 : 4,
                      opacity: isActive ? 1 : barHovered ? 1 : 0.4,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={cn(
                      "shrink-0 rounded-full",
                      isActive ? "bg-[#dc2626]" : "bg-white/80 group-hover:bg-primary"
                    )}
                  />
                  <motion.span
                    animate={{
                      scale: isItemHovered ? 1.12 : 1,
                      opacity: barHovered ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="flex items-baseline gap-2 whitespace-nowrap pl-3 text-sm font-medium"
                  >
                    <span className="text-xs opacity-50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.label}
                  </motion.span>
                </button>
              );
            })}
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
