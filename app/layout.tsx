import type { Metadata } from "next";

import "./globals.css";
import { profile } from "@/data";
import { ThemeProvider } from "./provider";

export const metadata: Metadata = {
  title: `${profile.name} | ${profile.role}`,
  description: profile.intro,
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