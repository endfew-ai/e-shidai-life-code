import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "邵康節易學｜象數觀物",
  description: "依現行本《梅花易數》與《皇極經世書》製作的固定文化演算，提供完整算式與來源核對。",
  openGraph: {
    title: "邵康節易學｜象數觀物",
    description: "年月日時、物數、雙段聲數、十一字以上字數法與元會運世尺度分解。",
    type: "website",
    locale: "zh_TW",
    url: "https://endfew-ai.github.io/e-shidai-life-code/kangjie.html",
    images: ["https://endfew-ai.github.io/e-shidai-life-code/og-b-v3.png"],
  },
};

export default function KangjieLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
