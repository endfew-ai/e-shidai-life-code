# 參考稿第二版視覺資產

## 設計判讀

- 使用情境：生命靈數桌機與手機首頁。
- 視覺方向：深墨玉、玄黑、古金、少量青綠能量光。
- 桌機：高密度東方天文儀器工作臺。
- 手機：四個圓形入口、立即分析表單、2×2 狀態盤與兩欄功能卡。
- 所有可讀文字、日期、數值、卦象與狀態一律由 HTML 與程式產生。
- AI 圖只負責器物、材質、光影與裝飾，不得承載文字或動態資料。

## 產出資產

| 檔名 | 用途 | 線上尺寸 |
|---|---|---:|
| `brand-crest-v2.webp` | 桌機側欄品牌徽章 | 512×512 |
| `portal-birthday-v2.webp` | 生日命碼圓形入口 | 512×512 |
| `portal-spectrum-v2.webp` | 數字頻譜圓形入口 | 512×512 |
| `portal-iching-v2.webp` | 三數取卦圓形入口 | 512×512 |
| `portal-kangjie-v2.webp` | 邵康節易學圓形入口 | 512×512 |
| `cockpit-seal-frame-v2.webp` | 手機 2×2 狀態盤中央外框 | 384×384 |
| `analyze-dragon-seal-v2.webp` | 手機主要分析按鈕龍紋章 | 384×384 |

正式檔案位置：

`public/visuals/ai-dashboard/reference-v2/`

## 共用提示詞骨架

```text
Use case: production UI asset for the responsive website 生命靈數.
Match the supplied mobile and desktop UI references.

Style:
premium futuristic Oriental observatory,
deep blue-black and dark emerald lacquer,
antique gold and restrained teal luminescence,
finely engraved brass,
tactile museum-instrument realism,
dramatic low-key lighting,
crisp micro-detail,
subtle mist and stars.

Hard constraints:
no text,
no Chinese characters,
no letters,
no Arabic numerals,
no glyph labels,
no logos,
no watermark,
no UI screenshot,
no human figure.
Do not reproduce text visible in the references.
```

## 各模塊構圖提示

### 品牌徽章

```text
Perfectly centered compact circular crest.
Nine small jade-gold nodes connected by one continuous orbital path.
Empty dark central gem.
Two narrow antique brass rings.
Restrained cloud engravings.
Clear silhouette at 80px.
```

### 生日命碼

```text
Centered round antique East Asian celestial calculator.
Layered concentric brass rings.
Subtle calendar-gate geometry.
Nine orbital nodes.
Symmetric silhouette.
Readable at 72px.
```

### 數字頻譜

```text
Centered antique scientific resonator.
Three concentric brass rings.
Luminous teal waveform.
Nine small signal nodes.
Suggest frequency and distribution without actual digits.
```

### 三數取卦

```text
Centered antique divination mechanism.
Eight radial sectors represented only by abstract solid and broken gold bars.
Three luminous jade beads aligned in a triangular orbital mechanism.
Central bronze disk and layered armillary rings.
```

### 邵康節易學

```text
Centered Chinese armillary sphere nested inside an astrolabe.
Small jade core at the center.
Sweeping bronze orbital arcs.
Subtle mountain-cloud silhouettes inside the dark inner disk.
```

### 中央狀態盤

```text
Centered antique gold instrument frame.
Double engraved brass ring.
Four cardinal clasps.
Plain empty near-black circular center.
No yin-yang and no trigrams.
The correct yin-yang symbol will be overlaid by HTML and CSS.
```

### 分析按鈕龍紋章

```text
Centered compact round bronze seal.
One elegant coiled Eastern dragon as engraved relief.
Small blank jade core.
Bold simple outer silhouette.
Readable at 44px.
```

## 壓縮與使用規則

- 原始 PNG 保留在 Codex 生成圖片目錄。
- 網站只使用縮放後的 WebP。
- 圓形入口使用 CSS `border-radius: 50%` 裁切。
- 裝飾圖片使用空白 `alt`，功能名稱保留在 DOM。
- 手機首屏小圖使用 eager load，避免入口先顯示空框。
- 卡片與後續模塊維持 lazy load。
- 中央狀態盤設定 `pointer-events: none`，不得遮擋四格功能。
