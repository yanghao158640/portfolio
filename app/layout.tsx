import type { Metadata } from "next";

import "./creative.css";
import "./portfolio-refinements.css";
import { profile } from "@/data";
import { ThemeProvider } from "./provider";

/**
 * 站点正式地址。metadataBase 靠它把 og:image 这类相对路径补成绝对地址 ——
 * 微信 / QQ / Twitter 抓取时只认绝对地址，少了这一句，链接分享出去就没有缩略图。
 * 以后换域名（比如挂了自定义域名），只改这一处。
 */
const SITE_URL = "https://yanghao158640.github.io";
const SITE_TITLE = `${profile.name} | AI 影像 × 创意工具 × 环境工程`;
const SITE_DESCRIPTION = "杨豫豪的个人作品集：独立创作《海妖囚岛》五集 AI 短剧，开发污水处理工艺模拟器与「先学一点」学习工具。查看成品、创作过程与项目案例。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  // Versioned image URL lets crawlers discover the refreshed 1200×630 cover.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: `${profile.name} · 个人作品集`,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "zh_CN",
    images: [
      {
        url: "/og-portfolio-202611.png",
        width: 1200,
        height: 630,
        alt: "杨豫豪 · 让想象不止于想象 · AI 影像、创意工具与环境工程作品集",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-portfolio-202611.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
