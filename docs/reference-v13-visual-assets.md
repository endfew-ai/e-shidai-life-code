# Reference v13 細緻模組、AI 圖像與一屏工作台

## 目標

Reference v13 不是單純換色，而是把首頁重新整理為可快速掃讀的「一屏儀表工作台」：

- 四個主要模式留在分析器，不再於工具牆重複。
- 十八個延伸功能依用途固定為三列六欄：生命分析、康節六法、進階工具。
- 每個容易混淆的工具採專用 AI 圖像，不再共用同一張暗色背景。
- 圖像只負責辨識與材質，不含文字、數字、假按鈕、假圖表或演算結果。
- 名稱、狀態與結果均由 HTML／程式即時呈現，放大文字或停用圖片仍可操作。

## 版面順序

| 列 | 模組 |
| --- | --- |
| 生命分析 | 生命路徑、九宮配置、個人流年、適合色彩、姓名筆畫、身分證命格 |
| 康節六法 | 年月日時、物數起卦、聲音起卦、字占姓名、古例補充、元會運世 |
| 進階工具 | 手機磁場、車牌門牌、自訂序列、本機紀錄、規則設定、規則來源 |

桌機為 6×3 精密儀器格；手機為四欄，最後兩格置中。模組間採共用 1px 金線骨架，不再讓十八張卡片各自疊加雙框。

## 反推風格提示詞

共同提示詞摘要：

> A text-free premium square instrument module for a Traditional Chinese numerology and classical cosmology web application. Deep ink-jade and near-black lacquer, restrained cold antique gold, subtle teal energy, engraved brass, aged paper and celestial mechanics. One unmistakable central physical metaphor, dense but orderly micro-detail, museum-grade East Asian scientific instrument, cinematic low-key lighting, front-facing composition, strong silhouette at 80 px, no people, no letters, no Chinese characters, no Arabic numerals, no UI text, no logo, no watermark, no fake buttons, no screen mockup.

共同負面條件：

- 禁止任何可辨識文字、偽漢字、數字、浮水印或商標。
- 禁止通用發光圓盤重複套用；每個功能必須有不同物件輪廓。
- 禁止廉價霓虹、遊戲寶箱、塑膠感、過度黃金或過亮背景。
- 縮至約 80×80 CSS px 時仍需看得出模組差異。

各模組的中央物件：

| 檔案 | 視覺語彙 |
| --- | --- |
| `color-compass-v13.webp` | 九槽礦物顏料盤、玉石色票與黃銅色彩羅盤 |
| `name-strokes-v13.webp` | 毛筆、空白九宮紙格、墨滴與玉珠；不生成任何字 |
| `identity-verification-v13.webp` | 黃銅防偽印章、遮罩卡片輪廓與鎖芯；無證號 |
| `phone-resonance-v13.webp` | 手機輪廓、聲波共振叉與相鄰節點 |
| `vehicle-address-map-v13.webp` | 車牌／門牌空框、道路刻線與定位羅盤；無號碼 |
| `custom-sequence-v13.webp` | 可重排的空白黃銅節點、連線與滑軌 |
| `local-history-v13.webp` | 封存抽屜、時間輪與本機鎖印 |
| `rule-profiles-v13.webp` | 可切換的同心刻度環、校準滑塊與規則卡匣 |
| `source-provenance-v13.webp` | 典籍卷軸、來源標籤封蠟與校驗放大鏡 |

姓名筆畫前兩次生成出現疑似偽漢字，均未納入網站；正式資產改用「空白紙格＋毛筆＋抽象墨滴」構圖。

## 主標優化

主標題從 504 KB PNG 轉為 108 KB WebP，保留金墨筆觸與透明背景；HTML 仍保留螢幕閱讀器文字，圖片只是視覺表現。桌機只預載主視覺與主標，不再預載非首要分析儀表。

## 正式資產

| 檔案 | 尺寸（bytes） | SHA-256 |
| --- | ---: | --- |
| `color-compass-v13.webp` | 114918 | `12f4b6fe752f0d3b1dd81c0d8b54f25334a9fcade539d61a00ee4d557e8beda5` |
| `custom-sequence-v13.webp` | 106878 | `b40d8fa1e16874547b80e3bad7343625c8c535a99bc7d615230fad09f91b1083` |
| `hero-title-calligraphy-v13.webp` | 108092 | `6bd72245230626aaf20a1431edd4a9f77a864463b758113505ac2068caaf4d2a` |
| `identity-verification-v13.webp` | 102518 | `c11aff7d9b5f0a25c40a388c52dd3a53d7ca797c5bd8c4552072b80b3fa1b619` |
| `local-history-v13.webp` | 93546 | `5068248259ba21dc25eecc448220505c5587c711b5dc980e4092f443e0826656` |
| `name-strokes-v13.webp` | 43050 | `92c763a502a3d77106da29b68ddc0574fa833ddf6db9313c64dc2a5eee453298` |
| `phone-resonance-v13.webp` | 64914 | `8af6ad882dbc3702b830fcf02b59cf488b23e98ab762e67715728931486bef84` |
| `rule-profiles-v13.webp` | 175120 | `ebcdb023065daac4a88681ce59e65323b45a780d5a8d784ce7eab93ba9f31bce` |
| `source-provenance-v13.webp` | 79958 | `6ed5da7b347018077e04ffcd731d073e61be345c5954e6f5fdf59db40fb5d030` |
| `vehicle-address-map-v13.webp` | 82372 | `d0e5132558343ff3e4b042c20982007c82473894275848f83a703449730b62eb` |

正式檔案位於 `public/visuals/ai-dashboard/reference-v13/`。ImageGen 原始 PNG 保留在 Codex 生成資產目錄，沒有覆寫或刪除。

## 可讀性依據

- 一般文字以 WCAG 2.2 的 4.5:1 對比為目標，大字至少 3:1。
- 本專案主要操作目標採至少 44×44 CSS px，較 WCAG 2.2 AA 的 24×24 最低門檻更寬裕，方便老花及手指觸控。
- 模式名稱、功能名稱與狀態不只靠顏色表達；焦點有明顯金色外框。
- 動畫尊重 `prefers-reduced-motion`，停用後不做縮放轉場。

參考：

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C：Older Users and Web Accessibility](https://www.w3.org/WAI/older-users/)

