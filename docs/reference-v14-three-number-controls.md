# Reference v14 三數取卦與「感而遂通」模組

## 目標

三數取卦維持原有固定演算核心，介面改為三個完全獨立的取數控制：

- 第一數只定上卦，除 8 取餘；整除時取 8。
- 第二數只定下卦，除 8 取餘；整除時取 8。
- 第三數只定動爻，除 6 取餘；整除時取 6。
- 每個「感而遂通」按鍵只改自己的欄位，範圍固定為 1–1000。
- 仍可手動輸入任意正整數，不會把生日、電話或其他號碼自動拆成三數。

「感而遂通」是取數互動名稱，不宣稱安全亂數本身出自《梅花易數》。卦象、互卦、變卦、體用及《周易》原文仍由既有演算與資料模組產生。

## 亂數規則

`secure-random.js` 使用瀏覽器 Web Crypto `crypto.getRandomValues()`，再以拒絕取樣排除直接取模造成的偏差：

1. 取得一個 32 位元無號整數。
2. 超過可被 1000 整除的最大完整區段時捨棄重取。
3. 轉為 1–1000 的等機率整數。
4. 不使用 `Math.random()`，不設固定種子，也不保存取數序列。

一般模式以十次安全亂數快速輪替呈現「數字亂跑」；系統開啟減少動態效果時只取一次，避免造成暈動或視覺負擔。

## AI 模組提示詞

按鍵底板：

> A text-free, front-facing 3:1 premium button plate for a Traditional Chinese divination interface. Deep black jade, oxidized antique gold, one small concentric I Ching resonance instrument on the left, quiet empty center for live calligraphy, refined Shao Kangjie astronomical craftsmanship, restrained low-key light, no characters, no letters, no numerals, no watermark, no fake browser UI.

毛筆字：

> Render exactly four Traditional Chinese characters and nothing else: 感而遂通. One horizontal line, expressive running-script calligraphy, handmade metallic golden ink, natural bristle and dry-brush texture, dignified and highly legible, uniform near-black background, no seal, punctuation, English, numeral, border or watermark.

文字圖片只負責毛筆視覺；每個按鍵另有螢幕閱讀器文字與完整 `aria-label`，停用圖片後仍能辨識功能。

## 正式資產

| 檔案 | 尺寸（bytes） | SHA-256 |
| --- | ---: | --- |
| `brush-feel-and-respond-v14.webp` | 21160 | `be1414329e7da315b312f7da7719e9a1cc9db9db02391b66d92032d1e41efa54` |
| `iching-resonance-button-v14.webp` | 20638 | `657deb5edddc72aa71e71e24899d79b7ad022293f3a993844b0773b356105612` |

正式檔案位於 `public/visuals/ai-dashboard/reference-v14/`；ImageGen 原始 PNG 保留於 Codex 生成資產目錄，沒有刪除或覆寫。

## 排版與可及性

- 桌機與手機均維持三欄對照，三個按鍵位置與三個數字一一對齊。
- 按鍵在平板與手機至少 44 CSS px 高。
- 提示、清除鍵與錯誤訊息各有獨立排版列，不再互相遮蔽。
- 超長手動整數保留原值，可在輸入框內水平檢視，但不會撐破分析卡或造成整頁水平捲動。
- 動態效果遵守 `prefers-reduced-motion`。
