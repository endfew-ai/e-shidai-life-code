# Reference v5 功能物件徽章紀錄

## 目的

Reference v5 將原本縮小後外觀相近的八個圓環徽章，改成八個具有明確物件輪廓的功能圖。圖片只負責材質與視覺辨識，不含文字、數字、演算結果、假按鈕或假資料；功能名稱、狀態與結果全部由 HTML 與程式即時呈現。

## 生成與後製

- 生成工具：OpenAI 內建 ImageGen。
- 原始輸出：各 1536×1536 PNG。
- 正式輸出：以 FFmpeg Lanczos 縮放為 384×384，轉成品質 84 的 WebP。
- 原始 ImageGen PNG 保留在 `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8`，未刪除或覆寫。

## 功能對照

| 編號 | 功能 | 明確物件 | ImageGen 原始檔 | 正式輸出 |
| --- | --- | --- | --- | --- |
| 1 | 生日分析 | 日曆天象盤、旭日、紅色日期珠 | `exec-594c93d9-d5c8-4473-8e65-e213a4cd8e6d.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-1-v5.webp` |
| 2 | 生命路徑 | 發光路徑、三個節點、終點星 | `exec-511fe8c5-6ee5-4e39-b244-7062bc31bdff.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-2-v5.webp` |
| 3 | 數字頻譜 | 共振環、調諧晶體、頻率節點 | `exec-2ad1bead-6cb7-420b-969b-ee7ba08dc51d.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-3-v5.webp` |
| 4 | 九宮配置 | 三乘三玉石格與九顆節點 | `exec-b8e927b1-ca94-471c-8040-c373e9c66913.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-4-v5.webp` |
| 5 | 流年分析 | 太陽、月亮與四季軌道 | `exec-f32b221b-e9d4-4054-a2f7-93b795a59025.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-5-v5.webp` |
| 6 | 專業工作台 | 算盤、羅盤、卷軸 | `exec-e8b64fca-59c9-46ad-8cd4-626ed2f8327d.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-6-v5.webp` |
| 7 | 規則來源 | 線裝書、竹簡、空白驗證印 | `exec-eaf2199a-4ed9-4ea5-b5fe-b266f14b3d79.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-7-v5.webp` |
| 8 | 本機隱私 | 玉石機械鎖與盾牌 | `exec-7be3a39b-a951-490d-b523-3dcfdefdc203.png` | `public/visuals/ai-dashboard/reference-v5/function-bay-8-v5.webp` |

## 共同提示詞骨架

```text
Create a square 1:1 premium UI icon asset for a Traditional Chinese numerology dashboard.
Use one clearly recognizable centered function object, antique-gold brass, black-jade enamel,
restrained emerald inner glow, engraved metal, and a refined archaeo-futurist Chinese observatory aesthetic.
Keep a generous safe margin and a strong silhouette readable at 32 pixels on a deep nearly-black background.
No text, no letters, no Chinese characters, no numbers, no UI labels, no fake data, no watermark.
```

各圖再分別指定：生日天象日曆、發光生命路徑、頻譜調諧晶體、三乘三九宮格、四季日月軌道、算盤羅盤工作台、線裝書竹簡來源庫、機械鎖盾隱私。

## SHA-256

```text
093F9F43722491BC6A6250D66ADD0F1CB0DF6AC99FD71289C76C005510B15CFD  function-bay-1-v5.webp
20C71E1E9723C12A13BFD492816398167C50E48B504DA6176A6D11341F6F2B2D  function-bay-2-v5.webp
4F454BCAD6AA9DC31CF8F1A0DC347F65B553E7993B6C6FC353C2948BF72E66E5  function-bay-3-v5.webp
74ABF9A2003DFEDBD3B7BBACF710B5149CFC52C4C81AB2332C78C4910F7AB6A7  function-bay-4-v5.webp
E304CA055DE7029C1CD74A206E1F6C0716073C2E8E2C515FC574E9A6D345997D  function-bay-5-v5.webp
06A4A03D99FF49E34CDFD43A071EF41C6DE60C41A90C8EA3ECADE4A1E0F949CF  function-bay-6-v5.webp
CCEE6D308FF7DAEEBCF91C4B472F70DFE12EC2F274C012DC76481DBE7345A989  function-bay-7-v5.webp
06954C869B57B0255864D3E8334C6D024234CC907738BD771EED96E6A5D2D3E7  function-bay-8-v5.webp
```
