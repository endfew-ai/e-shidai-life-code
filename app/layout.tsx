import type { Metadata } from "next";
import "./globals.css";

function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
    || "http://localhost:3000";
  try {
    return new URL(configured);
  } catch {
    return new URL("http://localhost:3000");
  }
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "生命靈數分析儀",
  description: "以生日生命靈數為主，提供生日九宮、數字磁場、身分證流年、三數取卦與邵康節易學；版本化規則、完整算式、本機運算。",
  applicationName: "生命靈數分析儀",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "生命靈數分析儀",
    description: "看見你的數字軌跡。從生日命碼開始，逐步核對完整算式。",
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "生命靈數深靛古金天文儀主視覺",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "生命靈數分析儀",
    description: "看見你的數字軌跡。從生日命碼開始，逐步核對完整算式。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <head>
        <link rel="preload" as="image" href="/visuals/brush/brand-life-numerology-aaa-web-v1.webp" type="image/webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/visuals/ai-dashboard/reference-v10/hero-celestial-command-v10.webp" type="image/webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/visuals/ai-dashboard/reference-v13/hero-title-calligraphy-v13.webp" type="image/webp" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  );
}
