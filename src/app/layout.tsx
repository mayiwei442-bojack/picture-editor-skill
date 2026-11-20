import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { skillCountLabel } from "@/lib/skills";

const editorial = localFont({
  src: "./fonts/CormorantGaramond-Latin.woff2",
  weight: "500 700",
  variable: "--font-editorial",
  display: "swap",
  adjustFontFallback: "Times New Roman",
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
