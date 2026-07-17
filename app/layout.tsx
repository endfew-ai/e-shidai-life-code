import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "e世代生命密碼分析儀",
  description: "輸入一組數字，探索你的核心特質、溝通模式與下一步行動提醒。資料只在瀏覽器內計算。",
  applicationName: "e世代生命密碼分析儀",
  openGraph: {
    title: "e世代生命密碼分析儀",
    description: "從數字出發，閱讀你的行動慣性、溝通模式與成長提醒。",
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
    description: "從數字出發，閱讀你的行動慣性、溝通模式與成長提醒。",
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
