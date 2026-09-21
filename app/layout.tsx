import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "喵懂 AI｜猫咪观察助手",
  description: "结合声音、图像与场景，推测猫咪意图并观察情绪与可见异常。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
