import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { skillCountLabel } from "@/lib/skills";

const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: `IMAGE FIELD — ${skillCountLabel}种视觉转译`,
  description: "上传一张照片，选择一种 Skill，生成一张可下载的视觉作品。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={editorial.variable}>{children}</body>
    </html>
  );
}
