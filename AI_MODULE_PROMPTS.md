# 玄星觀象 B 版：Image2 模組提示詞

本文件記錄參考圖的反推風格，以及本次實際交付的 AI 視覺模組。背景圖只負責材質、構圖與文化氛圍；固定主題與功能標題另製作成逐字校對的黃金墨水毛筆字模，並在 HTML 內保留隱藏真實文字。輸入欄、按鈕、數字、卦名、日期與動態結果仍全部由 HTML 顯示，避免 AI 假字並保留無障礙與響應式能力。

## 反推母提示詞

```text
Use case: responsive website module background.
Create a museum-grade East Asian celestial calculation instrument on edge-to-edge deep indigo-black lacquered handmade paper. Use precise antique-gold and aged-brass engraved linework, subtle natural fibers, sparse celestial dust, restrained low-key museum lighting, matte material, crisp geometry, dense but calm composition, and a contemporary luxury Taiwanese/Chinese heritage mood.

Compose as a wide horizontal banner. Put the strongest instrument motif on the right half and preserve a calm dark safe area on the left-center for real accessible HTML. Important motifs must survive both desktop and narrow mobile crops. Use one restrained antique-gold accent only.

No readable text, letters, digits, Chinese characters, pseudo-text, equations, logo, watermark, people, faces, animals, UI controls, input fields, buttons, tabs, cards, device frames, game HUD, cyberpunk, purple neon, electric-blue glow, glassmorphism, glossy 3D, excessive particles, temples, dragons, or occult horror.
```

## 模組 01：無字主視覺背景

- 網站檔案：`public/visuals/hero-celestial-background-v4.webp`
- 社群預覽：`og-b-v3.png`、`public/og-b-v3.png`

```text
Edit the supplied hero artwork into a background-only asset. Remove all Chinese characters and calligraphy completely. Reconstruct the left side as deep indigo-black celestial handmade-paper texture with subtle gold dust. Preserve the antique brass astrolabe, orbital lines, star points, lighting and premium composition on the right. No text, letters, logo, watermark or writing-like symbols. Leave a calm left safe area for a separate transparent title module.
```

主標語不再烘焙於背景中；前端另外疊放 `public/visuals/brush/title-hero-v5.webp`。

## 模組 02：生日命碼

- 網站檔案：`public/visuals/birthday-panel-b-v3.webp`

```text
Apply the mother prompt. Visualize birth date as intersecting calendar rings, solar and lunar orbital paths, abstract day and month tick marks, and a few precise brass nodes. This is the primary and brightest functional module. Put the calendar mechanism and sun-moon assembly on the right 42 percent; preserve the left-center 55 percent as a dark HTML safe area. Abstract ticks must not resemble readable numerals. Do not use I Ching, bagua, yin-yang or divination symbols.
```

## 模組 03：數字頻譜

- 網站檔案：`public/visuals/digit-spectrum-panel-b-v3.webp`

```text
Apply the mother prompt. Create a refined nine-node rhythmic matrix connected by fine brass paths, crossed by one graceful horizontal harmonic waveform, frequency trails and small resonance arcs. Keep the visual luminosity about 20 percent lower than the birthday module. Place the matrix and waveform across the right two-thirds, leaving a dark left-center HTML safe area. Nodes must be plain geometry, never digits. Do not use calendar rings, planets or I Ching symbols.
```

## 模組 04：數理結果摘要

- 網站檔案：`public/visuals/numerology-result-panel-b-v3.webp`

```text
Apply the mother prompt. Build an abstract nine-position Lo Shu spatial lattice without numbers. Use nine plain brass nodes in a precise three-by-three relationship, with several thin segmented reduction paths converging into one result point and nested calculation arcs. Weight the composition to the right; preserve the left 52 percent and central horizontal band for real result text and metrics. No equations, operators, labels, planets or divination symbols.
```

## 模組 05：三數取卦補充儀

- 網站檔案：`public/visuals/iching-instrument-b-v3.webp`

```text
Apply the mother prompt at lower visual weight. Create a precision six-line measuring instrument using six horizontal solid-or-split brass rails, tiny ticks, concentric arcs and one restrained mechanical pivot. Place it on the right and leave the left half dark for HTML. It may suggest line measurement but must contain no卦名、可讀文字、吉凶符號、八卦輪或陰陽圖。Keep it clearly subordinate to birthday numerology.
```

## 模組 06：易經本文紙材

- 網站檔案：`public/visuals/iching-manuscript-b-v3.webp`

```text
Apply the mother prompt at the lowest visual weight. Create a dark-indigo archival manuscript background with warm handmade-paper fibers, restrained brass registration lines, torn paper edges and a small low-contrast abstract hexagram index in the lower-right. Preserve a very large calm central area for real HTML《周易》text. No readable writing, no labels and no interpretation. Any generated index is decoration only and must never be used as a factual 64-hexagram table.
```

## 模組 07：獨立黃金墨水毛筆字模

每張字模均使用一次獨立生圖呼叫，先生成於純綠幕，再以 `auto-key border + soft matte + despill + edge-contract 1` 去背、清除殘留綠色溢光、依透明內容裁切並輸出無損 WebP。網站以裝飾圖片呈現，正確文字仍保留在 `.sr-only` 中供讀屏、搜尋與功能辨識。

| 精確文字 | 網站檔案 |
| --- | --- |
| 玄星觀象 | `public/visuals/brush/theme-xuanxing-v4.webp` |
| e世代生命密碼 | `public/visuals/brush/brand-life-code-v4.webp` |
| 生日命碼 | `public/visuals/brush/title-birthday-v4.webp` |
| 數字頻譜 | `public/visuals/brush/title-spectrum-v4.webp` |
| 三數取卦 | `public/visuals/brush/title-iching-v4.webp` |
| 數理結果 | `public/visuals/brush/title-result-v4.webp` |
| 易經本文 | `public/visuals/brush/title-classic-v4.webp` |
| 規則與來源 | `public/visuals/brush/title-rules-v4.webp` |
| 看見你的／數字軌跡 | `public/visuals/brush/title-hero-v5.webp` |
| 把結果變成可觀察的問題 | `public/visuals/brush/title-insight-v5.webp` |
| 方法與本文來源 | `public/visuals/brush/title-source-v5.webp` |
| 使用提醒 | `public/visuals/brush/title-disclaimer-v5.webp` |

```text
Use case: logo-brand.
Asset type: standalone horizontal Chinese brush-calligraphy website title cutout source.
Primary request: Create one premium hand-painted calligraphy title containing only the exact Traditional Chinese text “{TEXT}”.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for later removal. The whole background must be one uniform pure color with no shadow, gradient, texture, reflection, floor, glow, halo, vignette, frame or lighting variation.
Subject: only the exact text “{TEXT}”, written once on one horizontal line.
Style/medium: authentic traditional Chinese hand brush calligraphy painted in rich metallic golden ink with subtle gold-leaf particles; visible real bristle splits, dry-brush flying-white texture, ink pooling, varied stroke density and a slightly irregular organic baseline; premium mysterious future-oriental mood; unmistakably handmade and never a computer font.
Composition/framing: centered, every character fully visible and readable, generous clean padding on all sides, no clipping.
Color palette: warm antique gold and restrained bright-gold highlights only; the lettering must contain no green.
Text accuracy lock: render exactly “{TEXT}” in the specified order. Use Traditional Chinese. Do not substitute, simplify, omit, repeat, merge or add punctuation.
Constraints: no other text, seal, stamp, logo, icon, frame, diagram, ornament, symbol, watermark, cast shadow, contact shadow or reflection.
```

品牌字模另加下列鎖定句：

```text
Begin with one clearly recognizable lowercase Latin letter e, immediately followed by 世代生命密碼. Character order: e / 世 / 代 / 生 / 命 / 密 / 碼. Do not use uppercase E or simplified 码.
```

## 模組 08：邵康節專頁獨立字模

新專頁的入口、頁面主題、頁面主標、四個內容區標題、結果標題與使用界線全部分開生成，不重複裁切同一張圖。每張使用上方共用字模提示詞，再以逐字鎖定句指定下列精確文字：

| 用途 | 精確文字 | 網站檔案 |
| --- | --- | --- |
| 主頁第 4 入口 | 邵康節易學 | `public/visuals/brush/title-kangjie-entry-v1.webp` |
| 專頁主題 | 康節觀象 | `public/visuals/brush/theme-kangjie-v1.webp` |
| 專頁主標 | 象數觀物 | `public/visuals/brush/title-kangjie-hero-v1.webp` |
| 傳本說明 | 原典脈絡 | `public/visuals/brush/title-kangjie-origins-v1.webp` |
| 起卦工作台 | 梅花起卦 | `public/visuals/brush/title-kangjie-meihua-v1.webp` |
| 皇極工作台 | 皇極尺度 | `public/visuals/brush/title-kangjie-huangji-v1.webp` |
| 動態結果 | 衍算結果 | `public/visuals/brush/title-kangjie-result-v1.webp` |
| 來源分頁 | 原文與來源 | `public/visuals/brush/title-kangjie-source-v1.webp` |
| 使用界線 | 推演界線 | `public/visuals/brush/title-kangjie-boundary-v1.webp` |

逐字鎖定句模板：

```text
Character lock: {CHARACTER_1} / {CHARACTER_2} / {CHARACTER_3} / {CHARACTER_4...}. Render all characters in exact left-to-right order as structurally correct Traditional Chinese. Keep authentic irregular hand-brush pressure, split bristles, flying-white gaps and antique-gold mineral pigment. Do not use geometric font outlines or typeset proportions.
```

## 模組 09：主頁固定標題完整字模化

主頁計算區、結果洞察及《周易》原文區的固定結構標題，全部各用一次獨立生圖呼叫製作。計算出的數值與卦名仍保留為真實 HTML 資料，不烘焙進字模。

| 精確文字 | 網站檔案 |
| --- | --- |
| 這個結果怎麼算 | `public/visuals/brush/title-calculation-explain-v2.webp` |
| 生日數字九宮分布 | `public/visuals/brush/title-grid-birthday-v2.webp` |
| 自訂數字九宮分布 | `public/visuals/brush/title-grid-code-v2.webp` |
| 核心傾向 | `public/visuals/brush/title-insight-core-v2.webp` |
| 壓力提醒 | `public/visuals/brush/title-insight-pressure-v2.webp` |
| 日常照顧 | `public/visuals/brush/title-insight-care-v2.webp` |
| 溝通提醒 | `public/visuals/brush/title-insight-communication-v2.webp` |
| 本次自我提問 | `public/visuals/brush/title-self-question-v2.webp` |
| 卦辭 | `public/visuals/brush/title-judgment-v2.webp` |
| 彖曰 | `public/visuals/brush/title-tuan-v2.webp` |
| 象曰 | `public/visuals/brush/title-image-saying-v2.webp` |
| 六爻原文 | `public/visuals/brush/title-six-lines-v2.webp` |

## 模組 10：康節專頁次級標題完整字模化

功能摘要、分頁、方法選擇、表單、卦象角色及古籍節錄標題也全部拆成獨立透明字模。這 22 張不由合圖裁切，也不重複使用錯誤文字。

| 精確文字 | 網站檔案 |
| --- | --- |
| 四種起卦入口 | `public/visuals/brush/title-kangjie-overview-entry-v2.webp` |
| 三層卦象 | `public/visuals/brush/title-kangjie-overview-layers-v2.webp` |
| 五級時間尺度 | `public/visuals/brush/title-kangjie-overview-scale-v2.webp` |
| 乾一至坤八 | `public/visuals/brush/title-kangjie-origin-sequence-v2.webp` |
| 傳統曆序手動輸入 | `public/visuals/brush/title-kangjie-origin-calendar-v2.webp` |
| 每個入口各守其法 | `public/visuals/brush/title-kangjie-origin-boundaries-v2.webp` |
| 只做時間長度分解 | `public/visuals/brush/title-kangjie-origin-duration-v2.webp` |
| 年月日時 | `public/visuals/brush/title-kangjie-method-calendar-v2.webp` |
| 物數 | `public/visuals/brush/title-kangjie-method-object-v2.webp` |
| 雙段聲數 | `public/visuals/brush/title-kangjie-method-sound-v2.webp` |
| 十一字以上 | `public/visuals/brush/title-kangjie-method-text-v2.webp` |
| 年月日時起例 | `public/visuals/brush/title-kangjie-form-calendar-v2.webp` |
| 物數起例 | `public/visuals/brush/title-kangjie-form-object-v2.webp` |
| 雙段敲聲法 | `public/visuals/brush/title-kangjie-form-sound-v2.webp` |
| 十一字以上字數法 | `public/visuals/brush/title-kangjie-form-text-v2.webp` |
| 本卦 | `public/visuals/brush/title-hex-original-v2.webp` |
| 互卦 | `public/visuals/brush/title-hex-mutual-v2.webp` |
| 變卦 | `public/visuals/brush/title-hex-changed-v2.webp` |
| 本卦原文節錄 | `public/visuals/brush/title-kangjie-classic-v2.webp` |
| 動爻原文 | `public/visuals/brush/title-moving-line-v2.webp` |
| 變卦本文 | `public/visuals/brush/title-changed-text-v2.webp` |
| 原文與來源 | `public/visuals/brush/title-kangjie-tab-source-v2.webp` |

正式檔案以 `scripts/audit-brush-assets.py` 統一檢查兩頁實際引用的全部字模。發布門檻為：檔案存在、RGBA、四邊透明、四角透明及可見綠邊像素為 0；另輸出 34 張本次新增字模的接觸表作人工校字。

## 使用規則

1. 除了逐字校對的固定毛筆標題，AI 圖不可承載資料、公式、卦序、按鈕或輸入欄。
2. 每個固定毛筆字模都必須搭配真實 HTML 隱藏文字；動態算出的卦名、數值、年份、公式與說明維持可選取的 HTML，且不冒充固定結構標題。
3. 生日命碼永遠是最亮、最先出現的主功能；數字頻譜次之；三數取卦為補充；邵康節易學使用第 4 入口開啟獨立專頁。
4. 手機版可裁切或降低背景圖對比，但不可把操作文字做進圖片。
5. `iching-manuscript-b-v3.webp` 右下索引只是裝飾，不可當成六十四卦資料來源。
6. Hero 背景與「看見你的／數字軌跡」必須維持兩個不同檔案，禁止再次合成為單張 UI 圖。
