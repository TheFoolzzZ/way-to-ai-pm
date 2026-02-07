import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Chakra_Petch, Spline_Sans } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const body = Spline_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Way to AI PM - 产品经理面试刷题",
  description: "产品经理面试刷题网站，支持分类浏览与 Anki 风格卡片翻转。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-Hans" className="scroll-smooth">
      <body
        className={`${display.variable} ${body.variable} antialiased bg-background text-foreground`}
      >
        <div className="app-root">{children}</div>
      </body>
    </html>
  );
}
