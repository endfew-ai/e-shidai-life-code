# Reference v3 AI 視覺資產規格與重製紀錄

- 文件版本：v3
- 紀錄日期：2026-07-28
- 適用範圍：生命靈數網站的電腦版主視覺與手機版天象拱門
- 核心原則：AI 圖片只承擔裝飾、材質、框架與氛圍；所有文字、按鈕、時間、數字及分析結果都必須由 HTML／CSS／JavaScript 即時呈現。

## 1. 資產清單與來源

### 1.1 電腦版主視覺

- 資產 ID：`desktop-hero-command-v3`
- ImageGen 原始 PNG：
  `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_5LvdtAflDaRWOG2TSygB5XeZ.png`
- 專案輸出：
  `public/visuals/ai-dashboard/reference-v3/desktop-hero-command-v3.webp`
- 原始尺寸／格式：1672 × 941 px、PNG、RGB24
- 網站尺寸／格式：1672 × 941 px、WebP、YUV420P
- 原始檔大小：2,662,784 bytes
- 網站檔大小：148,650 bytes
- 原始 PNG SHA-256：
  `CEAB17978D6070DF1861C05CDBFEE7972A2B42C9185E1E810F7E39DBFD9FBA9A`
- 網站 WebP SHA-256：
  `717B10BD010ED45B003A18F9953E10F791CC153DAE2DCA4251206F331C966BF1`
- 用途：電腦版首頁／分析儀表板的主視覺背景。畫面左側保留低細節留白，供即時標題、說明與操作按鈕疊放；右側呈現九節點天象儀。
- 畫面內容：深玉黑漆、黑曜石、古銅金機械、克制的青色能量線與宋式雲紋；圖內不得有可辨識文字、數字、標誌或水印。
- 功能定位：純裝飾圖片，不是按鈕，也不應攔截滑鼠或觸控事件。

### 1.2 手機版天象拱門

- 資產 ID：`mobile-celestial-arch-v3`
- ImageGen 原始 PNG：
  `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_0kfKc1y2UHJxtJ5XYvqgpH7e.png`
- 專案輸出：
  `public/visuals/ai-dashboard/reference-v3/mobile-celestial-arch-v3.webp`
- 原始尺寸／格式：1942 × 809 px、PNG、RGB24
- 網站尺寸／格式：1200 × 500 px、WebP、YUV420P
- 原始檔大小：2,688,178 bytes
- 網站檔大小：53,806 bytes
- 原始 PNG SHA-256：
  `E01E5A830079F722B2182F0AD258C5DDEB5F901A1085E7BD787EF82E3E886EBB`
- 網站 WebP SHA-256：
  `37B5847511313E2D688C2E1F1577F5B937F54AEB5CC458CED75B7B185EF3D363`
- 用途：手機版功能入口上方的天象拱門／結構背景。上方保留中央徽章，拱門橫跨畫面；下方 58% 保持深色、低細節，供四個真正的 HTML 功能入口排列。
- 畫面內容：對稱古銅金雙層拱門、中央小型天象徽章、黑玉漆面、雲紋雕刻與細金框；圖內不得內建入口圓鈕、文字、數字、標誌或水印。
- 功能定位：純裝飾圖片，四個入口必須另外以可操作、可鍵盤聚焦的 HTML 元件建立。

## 2. 參考圖與 built-in ImageGen 模式

兩張 v3 圖資均使用 Codex 內建 `image_gen.imagegen` 產生，模式為「提供本機參考圖的引導式生成」：

- 使用欄位：`referenced_image_paths`
- 未使用欄位：`num_last_images_to_include`
- 產生方式：以兩張既有畫面作為構圖、材質與品牌語言參考，生成新的無字圖像；不是直接覆寫專案內現有圖片。
- 主要手機參考圖：
  `C:\Users\Hung\.codex\attachments\f4f91585-85c3-4d24-8a88-adf15a866eb1\image-1.png`
- 主要電腦參考圖：
  `C:\Users\Hung\.codex\attachments\f4f91585-85c3-4d24-8a88-adf15a866eb1\image-2.png`
- 電腦版生成時的參考圖順序：`image-2.png`、`image-1.png`
- 手機版生成時的參考圖順序：`image-1.png`、`image-2.png`

ImageGen 是生成式模型，提示詞與參考圖可以重製相同設計方向，但未提供固定亂數種子，因此不能保證逐像素重現。需要完全相同的正式圖資時，應以本文件記錄的 WebP 檔案與 SHA-256 為準。

### 2.1 WebP 衍生方式

在專案根目錄執行：

```powershell
ffmpeg -hide_banner -loglevel error -y `
  -i "C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_5LvdtAflDaRWOG2TSygB5XeZ.png" `
  -vf "scale=1672:941:flags=lanczos" `
  -c:v libwebp -quality 72 -compression_level 6 `
  "public/visuals/ai-dashboard/reference-v3/desktop-hero-command-v3.webp"

ffmpeg -hide_banner -loglevel error -y `
  -i "C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_0kfKc1y2UHJxtJ5XYvqgpH7e.png" `
  -vf "scale=1200:500:flags=lanczos" `
  -c:v libwebp -quality 72 -compression_level 6 `
  "public/visuals/ai-dashboard/reference-v3/mobile-celestial-arch-v3.webp"
```

重新衍生後，必須再用 `Get-FileHash -Algorithm SHA256`、`ffprobe` 與實際瀏覽器畫面核對，不可只依 ffmpeg 的成功代碼判定完成。

## 3. 圖片與即時介面的責任邊界

| 項目 | 可否烘焙在圖片 | 正確作法 |
| --- | --- | --- |
| 漆面、金屬、雲紋、天象儀、裝飾框、環境光 | 可以 | 由 AI 圖資提供 |
| 「生命靈數」品牌名稱、主標題、副標題 | 不可以 | 使用 HTML 文字；毛筆感由合法 Web Font／字型堆疊與 CSS 處理 |
| 功能名稱、導覽文字、說明文字 | 不可以 | 使用語意化 HTML，確保可放大、可搜尋、可由讀屏軟體朗讀 |
| 「開始生命靈數分析」等按鈕文字 | 不可以 | 使用真正的 `button` 或 `a` 元件 |
| 日期、時間、累積造訪次數 | 不可以 | 由 JavaScript／後端資料即時更新 |
| 生日、生命靈數、卦象、流年及其他分析結果 | 不可以 | 由演算結果動態輸出，不得製作成假資料背景 |
| 九宮格數字、八卦符號、陰陽圖、可讀圖騰 | 不可以 | 若具功能意義，使用 HTML／CSS／SVG 依真實資料繪製 |
| Logo、水印、模型簽名、亂碼 | 不可以 | 生成提示詞明確排除，交付前逐張目視檢查 |

實作時，裝飾圖應使用空的替代文字 `alt=""`，或以 CSS 背景呈現；若使用 `<img>`，應設定不攔截操作的樣式，例如 `pointer-events: none`。任何可點擊區域不得只存在於圖片像素中。

## 4. 可重製提示詞

以下提示詞可直接配合第 2 節記錄的參考圖順序使用。英文版是本次生成時使用的提示詞；繁中版為等義重製版。

### 4.1 電腦版主視覺：英文

```text
Use case: stylized-concept
Asset type: desktop website dashboard hero background, panoramic 16:7 composition
Primary request: create a premium East Asian celestial numerology command-instrument scene closely matching the supplied reference design language, for a real responsive web dashboard.
Input images: Image 1 is the desktop layout and style reference; Image 2 is the mobile material and ornament reference. Use them only as visual references, do not copy any text or UI data.
Scene/backdrop: deep jade-black lacquer and obsidian panel with restrained Song-style cloud engravings and aged brass trim.
Subject: one large, highly detailed nine-node celestial numerology astrolabe occupying the right 58% of the frame, concentric rings, radial geometry, nine empty circular node sockets, subtle cyan-teal energy filaments, aged brass mechanisms. Leave the left 42% dark and low-detail as clean negative space for live HTML headline and controls.
Style/medium: ultra-detailed cinematic 3D antique scientific instrument, front orthographic view, premium museum-grade East Asian celestial mechanics, physically plausible metal, lacquer, etched relief, coherent geometry.
Composition/framing: very wide horizontal banner; the instrument must remain fully visible on the right without touching the edges; left side must stay calm and readable under text; no built-in borders that would conflict with CSS frame.
Lighting/mood: low-key jade-black ambient light, restrained warm gold highlights, subtle cyan core glow, no neon bloom.
Color palette: near-black, deep jade green, antique gold, restrained teal.
Materials/textures: black lacquer, obsidian, aged brass, engraved metal, faint xuan-paper grain.
Constraints: no text, no Chinese characters, no Latin letters, no numbers, no UI labels, no watermark, no logo, no fake results, no readable glyphs, no trigrams, no yin-yang symbol, no human figures; nine node sockets must be evenly spaced and geometrically coherent; preserve large clean negative space on the left.
```

### 4.2 電腦版主視覺：繁體中文

```text
用途：風格化概念設計
資產類型：電腦版網站儀表板主視覺背景，超寬 16:7 構圖
主要要求：為真正的響應式網頁儀表板製作高級東方天象生命靈數中樞儀器場景，緊密延續所提供參考圖的設計語言。
輸入圖片：圖片 1 是電腦版版面與風格參考；圖片 2 是手機版材質與裝飾參考。只能作為視覺參考，不可複製其中任何文字或 UI 資料。
場景／背景：深玉黑漆與黑曜石面板，搭配克制的宋式雲紋雕刻及老化黃銅飾邊。
主體：一座大型、高細節、九節點的天象生命靈數星盤，占畫面右側 58%；包含同心環、放射幾何、九個空白圓形節點槽、細微青藍綠能量線及老化黃銅機構。左側 42% 必須保持深色、低細節，作為即時 HTML 標題與控制元件的乾淨留白。
風格／媒材：超高細節電影級 3D 古代科學儀器，正面正投影視角，博物館級東方天文機械質感，金屬、漆面與蝕刻浮雕必須合理，幾何結構一致。
構圖／取景：極寬橫向橫幅；儀器完整位於右側且不可碰觸畫面邊緣；左側必須平靜，疊放文字後仍清楚可讀；不可內建會與 CSS 外框衝突的邊框。
光線／氣氛：低調玉黑環境光、克制暖金高光、輕微青色核心光，不要霓虹泛光。
色彩：近黑、深玉綠、古董金、克制青綠。
材質／紋理：黑漆、黑曜石、老化黃銅、雕刻金屬、極淡宣紙顆粒。
限制：不得出現文字、中文字、拉丁字母、數字、UI 標籤、水印、Logo、假分析結果、可辨識字形、八卦符號、陰陽圖或人物；九個節點槽必須均勻分布且幾何一致；左側必須保留大面積乾淨留白。
```

### 4.3 手機版天象拱門：英文

```text
Use case: stylized-concept
Asset type: mobile website celestial portal header background, very wide shallow 12:5 composition
Primary request: create the ornate top celestial arch and structural background for a responsive mobile numerology interface, matching the supplied mobile reference's black lacquer and antique gold craftsmanship.
Input images: Image 1 is the primary mobile composition and ornament reference; Image 2 is the shared desktop material and brand-system reference. Use as style references only.
Scene/backdrop: deep obsidian-black lacquer panel with subtle engraved East Asian cloud patterns, a monumental double antique-brass celestial arch spanning edge to edge, and one small centered celestial medallion at the top.
Subject: the arch, top-center medallion, symmetrical brass framework, engraved cloud corners, thin inner gold frame. Keep the lower 58% of the image dark, simple, evenly lit, and structurally empty so four real HTML portal buttons can be overlaid in one row.
Style/medium: ultra-detailed 3D relief, premium antique scientific instrument panel, front orthographic composition, physically plausible aged brass and black lacquer.
Composition/framing: wide shallow header; symmetrical; no built-in portal circles in the lower band; no strong focal objects except the small top medallion; safe empty zones for four equal UI portals.
Lighting/mood: restrained warm gold edge light, deep black-green shadows, calm and readable, no bloom.
Color palette: near-black, deep jade-black, antique gold.
Materials/textures: obsidian, black lacquer, aged brass engraving, subtle xuan-paper grain.
Constraints: no text, no Chinese characters, no Latin letters, no numbers, no UI labels, no watermark, no logo, no fake data, no readable glyphs, no trigrams, no yin-yang symbol, no portal icons, no human figures; keep the lower area uncluttered for live interface elements.
```

### 4.4 手機版天象拱門：繁體中文

```text
用途：風格化概念設計
資產類型：手機版網站天象入口標頭背景，極寬而淺的 12:5 構圖
主要要求：為響應式手機生命靈數介面製作華麗的上方天象拱門及結構背景，延續手機參考圖的黑漆與古董金工藝。
輸入圖片：圖片 1 是主要手機版構圖與裝飾參考；圖片 2 是共用的電腦版材質與品牌系統參考。只能作為風格參考。
場景／背景：深黑曜石漆面板，帶有細微東方雲紋雕刻；一座宏大的雙層古董黃銅天象拱門橫跨左右邊緣，上方中央只有一枚小型天象徽章。
主體：拱門、上方中央徽章、左右對稱黃銅骨架、雲紋雕刻角飾與細金內框。圖片下方 58% 必須維持深色、簡潔、照明均勻且結構留空，讓四個真正的 HTML 入口按鈕可以在同一列疊放。
風格／媒材：超高細節 3D 浮雕、高級古代科學儀器面板、正面正投影構圖；老化黃銅與黑漆材質必須符合物理質感。
構圖／取景：寬而淺的標頭，左右對稱；下方區域不得內建入口圓環；除上方小徽章外不得有強烈焦點物件；保留四個等寬 UI 入口的安全留白區。
光線／氣氛：克制的暖金邊緣光、深黑綠陰影，沉穩且清楚可讀，不要泛光。
色彩：近黑、深玉黑、古董金。
材質／紋理：黑曜石、黑漆、老化黃銅雕刻、細微宣紙顆粒。
限制：不得出現文字、中文字、拉丁字母、數字、UI 標籤、水印、Logo、假資料、可辨識字形、八卦符號、陰陽圖、入口圖示或人物；下方區域必須保持乾淨，供即時介面元件使用。
```

## 5. 視覺與功能驗收清單

### 5.1 共通檢查

- [ ] 兩個 WebP 均能正常解碼，實際尺寸分別為 1672 × 941 與 1200 × 500 px。
- [ ] SHA-256 與第 1 節紀錄一致；若不同，先確認是否為重新壓縮或未經紀錄的替換。
- [ ] 圖片內沒有中文字、英文字母、數字、亂碼、Logo、模型簽名或水印。
- [ ] 圖片內沒有假時間、假訪客數、假生命靈數或假分析結果。
- [ ] 所有可見文字仍是 HTML 文字，可選取、可放大、可搜尋且可由讀屏軟體讀取。
- [ ] 裝飾圖片使用 `alt=""` 或 CSS 背景，不重複朗讀頁面資訊。
- [ ] 圖片不攔截點擊、觸控、滑鼠懸停或鍵盤焦點。
- [ ] 圖片與黑金介面外框沒有重複邊框、錯位接縫或突然變亮的色塊。
- [ ] 關閉圖片載入後，主要功能與文字仍可操作，不依賴圖片才能理解流程。

### 5.2 電腦版檢查

- [ ] 在 1024、1280、1440、1920 px 寬度檢查，不得出現水平捲軸。
- [ ] 九節點天象儀完整落在右側，外環不被不合理裁切，也不碰觸容器邊緣。
- [ ] 九個圓形節點等距、形狀一致，沒有多餘節點或幾何斷裂。
- [ ] 左側留白足以容納即時標題、說明及主要操作，文字不壓在高細節機械上。
- [ ] 主標、內文與按鈕在深色背景上清楚可讀，且不靠把文字烘焙進圖片解決。
- [ ] 圖片縮放維持比例，未被強制拉寬、壓扁或出現明顯模糊。

### 5.3 手機版檢查

- [ ] 在 320、360、375、390、412、430 px 寬度逐一檢查，無水平捲軸或內容溢出。
- [ ] 上方中央徽章可見、拱門左右平衡，縮放或裁切後仍保持對稱。
- [ ] 下方 58% 的低細節區可清楚承載四個真正的 HTML 入口。
- [ ] 四個入口在常用手機寬度下沒有文字重疊、截斷或彼此蓋住。
- [ ] 每個可操作入口的觸控目標至少 44 × 44 CSS px，且可用鍵盤聚焦。
- [ ] 裝飾圖層位於文字及按鈕下方，不遮住入口，也不攔截觸控。
- [ ] 直向與橫向切換後版面會重新排列，時間、功能入口與分析內容仍正常顯示。
- [ ] 系統字體放大至 200% 時，按鈕文字仍可讀，圖片不造成主要內容消失。

### 5.4 動態資料檢查

- [ ] 日期與時間來自使用者裝置或明確設定的時區，不存在於圖片內。
- [ ] 累積造訪次數由實際計數來源輸出；無資料時顯示可辨識的等待或不可用狀態，不使用圖片中的固定數字代替。
- [ ] 生命靈數、流年、卦象及其他結果都由目前輸入重新計算，刷新或更改輸入後會正確更新。
- [ ] 主標題、功能名稱與 CTA 可由程式修改，不需要重新生圖。

## 6. 版本與保存規則

- v3 圖資不得無紀錄覆蓋；若重新生成或修改構圖，使用 `reference-v4` 與新檔名。
- 每次換圖都要記錄原始 PNG、正式輸出、生成提示詞、參考圖順序、尺寸與 SHA-256。
- ImageGen 原始 PNG 位於專案外的 `generated_images` 目錄；清理該目錄前，必須確認正式 WebP、來源路徑及雜湊已另行保存。
- 只改文案、時間、按鈕或分析數字時，不應重新生圖；應直接修改語意化 HTML／CSS／JavaScript。
- 正式發布前需同時完成桌機與手機實機／瀏覽器視覺驗收，不可只以靜態圖片或建置成功代替。
