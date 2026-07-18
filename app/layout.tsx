import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "e世代生命密碼分析儀",
  description: "生日命碼、數字頻譜與三數取卦分開計算，提供可逐步核對的完整算式。資料只在瀏覽器內處理。",
  applicationName: "e世代生命密碼分析儀",
  openGraph: {
    title: "e世代生命密碼分析儀",
    description: "三種資料、三套固定規則；每一步都能核對。",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "https://endfew-ai.github.io/e-shidai-life-code/og.png",
        width: 1792,
        height: 922,
        alt: "e世代生命密碼分析儀",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "e世代生命密碼分析儀",
    description: "三種資料、三套固定規則；每一步都能核對。",
    images: ["https://endfew-ai.github.io/e-shidai-life-code/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body>{children}</body>
    </html>
  );
}
