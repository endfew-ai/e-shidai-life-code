# Reference v18 AI 模塊資產

## 製作原則

- 模式：OpenAI 內建 ImageGen，全新點陣圖生成。
- 視覺方向：深墨玉黑、舊金黃銅、東方未來儀器、實體材質、中央安全區、高對比粗輪廓。
- 禁止內容：可辨識文字、數字、字母、卦名、卦線、人物、假按鈕、假結果。
- 所有功能名稱、數值及說明一律由 HTML 顯示，避免 AI 圖中文字錯誤，也保留縮放與無障礙能力。
- 生成原始 PNG 保留在 Codex `generated_images` 工作區；公開站使用 768 × 768、WebP quality 86 的衍生檔，未覆寫任何舊資產。

## 最終提示詞

### 生命路徑

> Square 1:1 premium Eastern-futurist dashboard module, deep jade-black lacquer and aged gold brass, a clearly readable winding S-shaped jade life path with an unmistakable starting seal, several milestone nodes, directional progress and a radiant destination compass star, tactile sculptural instrument, restrained engraved cloud motifs, subtle cinematic rim light, one bold central silhouette that remains recognizable at thumbnail size, generous dark breathing space, no people, no text, no letters, no numbers, no symbols, no hexagrams, no fake controls, no watermark.

輸出：`public/visuals/ai-dashboard/reference-v18/life-path-wayfinder-v18.webp`

### 九宮配置

> Square 1:1 premium Eastern-futurist dashboard module, deep jade-black lacquer and aged gold brass, a bold perfectly square three-by-three mechanical lattice containing exactly nine large distinct natural jade and stone orbs, clear grid divisions, restrained connectors and engraved cloud texture, frontal orthographic composition, tactile museum-grade instrument, high contrast and thick recognizable silhouette for a small UI tile, no people, no text, no letters, no numbers, no Chinese characters, no bagua, no hexagrams, no fake controls, no watermark.

輸出：`public/visuals/ai-dashboard/reference-v18/lo-shu-nine-grid-v18.webp`

### 個人流年

> Square 1:1 premium Eastern-futurist dashboard module, deep jade-black lacquer and aged gold brass, a clear annual-cycle instrument with a central sun hub, a smaller moon gear, four large seasonal gates at the cardinal directions and one elegant year pointer, tactile carved jade panels with restrained cloud, wind, rain and harvest reliefs, bold circular silhouette legible at thumbnail size, cinematic rim light, no people, no text, no letters, no numbers, no zodiac signs, no bagua, no hexagrams, no fake controls, no watermark.

輸出：`public/visuals/ai-dashboard/reference-v18/annual-cycle-v18.webp`

## 整合位置

- 桌機上方導覽：生命路徑、九宮配置、流年分析。
- 01～18 收合功能圖譜：01、02、03。
- 生日分析結果：生命路徑主視覺、個人流年摘要底圖、九宮詳情標頭底圖。
- 分析總覽四格改回四張既有獨立儀器圖，不再把三主體圖硬切成四格。
- 進階工作台的證號、手機、車牌／門牌、自訂序列與規則設定，改用既有 v13 專屬模塊。
- 專業工作台、規則來源及本機隱私，改用既有專屬寬圖。

## 檔案驗證

| 檔案 | 尺寸 | SHA-256 |
|---|---:|---|
| `annual-cycle-v18.webp` | 768 × 768 | `54A6E407B43DAAFCC68BE1DDEA9558732CD2C6D1664196679770E7EDC4DC5606` |
| `life-path-wayfinder-v18.webp` | 768 × 768 | `32115D15FF8F39254858321AF1D20802BF713B5C6F1C9455416BE9D257804298` |
| `lo-shu-nine-grid-v18.webp` | 768 × 768 | `B9711EABF02ACEB5F6F4CC1DAE027A90EEA08C52235AE2111C0874CD2D5CDC90` |
