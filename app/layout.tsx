import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "e世代生命密碼分析儀",
  description: "以生日命碼為主，提供數字頻譜與三數取卦補充工具；固定規則、完整算式、本機運算。",
  applicationName: "e世代生命密碼分析儀",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "e世代生命密碼分析儀",
    description: "看見你的數字軌跡。從生日命碼開始，逐步核對完整算式。",
    type: "website",
    locale: "zh_TW",
    url: "https://endfew-ai.github.io/e-shidai-life-code/",
    images: [
      {
        url: "https://endfew-ai.github.io/e-shidai-life-code/og-b-v3.png",
        width: 1200,
        height: 630,
        alt: "深靛古金數字軌跡與生日命碼主視覺",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "e世代生命密碼分析儀",
    description: "看見你的數字軌跡。從生日命碼開始，逐步核對完整算式。",
    images: ["https://endfew-ai.github.io/e-shidai-life-code/og-b-v3.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
