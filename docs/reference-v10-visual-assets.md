# Reference v10 視覺模組與反推提示詞

## 使用原則

- 參考使用者提供的桌機與手機介面圖，只取資訊密度、模組比例、黑玉與古金材質語彙，不複製任何商標。
- AI 圖只負責無文字的儀器、紋理與空間感。所有中文、日期、數值、按鈕、圖表與狀態均保留為真實 HTML。
- 不讓生成圖片承擔演算結果，不在圖片中放不可核對的數字，也不把裝飾圖冒充功能。
- 原始生成 PNG 保留在 Codex 生成圖目錄；公開版另轉成 WebP，未覆寫先前版本。

## 共用反推提示詞

```text
Premium future-oriental numerology dashboard module, deep black jade and midnight teal lacquer, aged brushed brass and restrained metallic gold ink, museum-grade Chinese astronomical instrument craftsmanship, finely engraved concentric rings, subtle cloud scrolls, precise radial geometry, soft cyan energy filaments, high micro-detail, cinematic low-key lighting, compact information-dense composition, realistic material depth, no readable text, no letters, no numbers, no logos, no watermark, no people, leave controlled dark negative space for real HTML labels and controls.
```

負面限制：

```text
no fake UI text, no gibberish Chinese, no neon cyberpunk purple, no cartoon, no plastic, no oversized empty background, no blurred details, no Western zodiac symbols, no fortune-telling claims
```

## 各模組提示詞與用途

### 主視覺儀表

```text
Wide 2:1 command-center hero. Place a large precision nine-node celestial numerology wheel on the right two-thirds, with nested brass rings, jade inlays, fine orbital wires and subtle turquoise energy. Keep the left third dark and calm for real golden brush title and summary. Dense premium framing, antique Chinese scientific instrument fused with restrained futuristic engineering, no text or numbers.
```

- 生成原檔：`call_QXvL0txx32N799cEivBJs22y.png`
- 網頁檔：`public/visuals/ai-dashboard/reference-v10/hero-celestial-command-v10.webp`
- 尺寸：1774 × 887
- SHA-256：`79D5878470F83FE0308C42A2EDDBDB108169C82186D27DA90F9FD813277625BD`

### 四區分析儀表

```text
Wide modular analytical instrument surface divided into four visually related stations: circular life-path dial, nine-column frequency analyzer, central core-number medallion and annual-cycle orbital ring. Brass separators, black-jade recessed panels, subtle cyan wave energy, strong legibility space for live HTML values, no text, no numbers.
```

- 生成原檔：`call_sm2ZRSUMTISyphQPmgGGqrMR.png`
- 網頁檔：`public/visuals/ai-dashboard/reference-v10/analytics-instrument-triad-v10.webp`
- 尺寸：2046 × 769
- SHA-256：`392B8E82AEC958099129EF823E7FAD4696DBB6548FC6296B025C7ACF9D2C221A`

### 側欄三步流程

```text
Tall narrow 9:19 navigation rail for a premium numerology workstation. Three stacked circular brass checkpoints connected by a thin glowing path, black-jade architectural frame, subtle engraved cloud lines, enough calm space beside each checkpoint for real HTML step labels, no text and no numbers.
```

- 生成原檔：`call_UI1FOBxJM1G5OH79wobUvp9P.png`
- 網頁檔：`public/visuals/ai-dashboard/reference-v10/sidebar-three-step-rail-v10.webp`
- 尺寸：864 × 1821
- SHA-256：`5B5323333730088084D8E6149968BC6E9ECFB088FC17EB441B56913E1ABF2190`

### 姓名筆畫工作台

```text
Wide premium Chinese character stroke-analysis workbench. Show a jade-and-brass writing tablet, a mechanical stroke counter, layered character-grid plates and a fine abacus-like calculation rail. Keep the left foreground darker for real HTML feature labels. No characters, no handwriting, no text and no numbers.
```

- 生成原檔：`call_SLPOhFrFRHTz6HTWEbmBtBkf.png`
- 網頁檔：`public/visuals/ai-dashboard/reference-v10/name-stroke-workbench-v10.webp`
- 尺寸：1672 × 941
- SHA-256：`01B2319C44FF93A72FD9523F6791E12E0E6D45F88130130FFFEF0665BE00085C`

### 本機紀錄與隱私庫

```text
Wide premium local-history privacy vault for an offline analytical tool. A circular jade-and-brass archive seal, mechanical lock, nested record discs and subtle protected data paths. Dark restrained left side for HTML copy, secure and calm rather than threatening, no text, no binary digits, no logos.
```

- 生成原檔：`call_uTTNaEQ3PhvyFZJ02B6IRcmA.png`
- 網頁檔：`public/visuals/ai-dashboard/reference-v10/local-history-vault-v10.webp`
- 尺寸：1672 × 941
- SHA-256：`F331CDB3CD84F28DB7CA69272C6E3FF7A2DAFBFF155029D990EC852355495EBD`

## 版面接線

- 桌機：固定窄側欄、60px 功能列、主視覺與分析台雙欄、四區即時儀表、五張主功能卡與三張支援卡。
- 手機：50px 頂欄、四個模式入口、輸入與主要按鈕、2 × 2 即時摘要、4 × 2 全功能入口。
- 1181px 以上不重複顯示分析模式列；生日、頻譜與其他功能從頂欄或側欄直接進入。767px 以下保留四模式列，方便單手操作。
- 最小觸控高度 44px；手機說明與入口文字以 15px 為基準；所有動態數值仍由既有演算程式更新。

## 社群分享封面

- 生成原檔：`call_IgRJPmWSvtM7Ezt8lWx782Gq.png`
- 網頁檔：`public/og.png`、`public/og-life-numerology-v10.png`
- 尺寸：1200 × 630
- SHA-256：`4719A764AA854719D84473BF2B5F1182630EFE79AA2B20D37365BD97985C075A`
- 人工檢查：標題「生命靈數」與副標「數字有軌跡，規則可核對」字形正確、完整、未裁切。
