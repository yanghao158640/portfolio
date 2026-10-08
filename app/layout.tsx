import type { Metadata } from "next";

import "./globals.css";
import { profile } from "@/data";
import { ThemeProvider } from "./provider";

/**
 * 站点正式地址。metadataBase 靠它把 og:image 这类相对路径补成绝对地址 ——
 * 微信 / QQ / Twitter 抓取时只认绝对地址，少了这一句，链接分享出去就没有缩略图。
 * 以后换域名（比如挂了自定义域名），只改这一处。
 */
const SITE_URL = "https://yanghao158640.github.io";
const SITE_TITLE = `${profile.name} | ${profile.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: profile.intro,
  alternates: { canonical: SITE_URL },
  // 分享到微信 / QQ / 微博时用的卡片：图在 public/og.png（1200×630）
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: `${profile.name} · 个人作品集`,
    title: SITE_TITLE,
    description: profile.intro,
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${profile.name} · ${profile.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: profile.intro,
    images: ["/og.png"],
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
