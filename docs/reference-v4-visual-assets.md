# Reference v4 視覺素材紀錄

## 用途與原則

Reference v4 依使用者提供的黑金玄星儀表參考圖，補足首頁各功能模塊的細節。所有儀表與功能徽章均為裝飾素材，不含預填數字、分析結果、假按鈕或不可驗證文字；可操作文字與即時計算結果仍由 HTML 與程式呈現。

生成方式：OpenAI 內建 ImageGen。生成後只做裁切、WebP 轉檔、尺寸縮放及主標題綠幕去背，未在生成圖中加入分析資料。

## 來源與輸出

| 分組 | ImageGen 原始檔 | 專案輸出 | 尺寸 |
| --- | --- | --- | --- |
| 四格分析儀表 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_5bQGSQAG2ju1HoUC5vu1o7MV.png` | `public/visuals/ai-dashboard/reference-v4/analytics-*-instrument-v4.webp` | 各 512×768 |
| 八格功能徽章 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_Eet8mVPB7T8L9IWdUn4OsalP.png` | `public/visuals/ai-dashboard/reference-v4/function-bay-1-v4.webp` 至 `function-bay-8-v4.webp` | 各 384×384 |
| 分析輸入台 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_7XT8aiHx4RK11PCsJJzvUZB2.png` | `public/visuals/ai-dashboard/reference-v4/analyzer-console-frame-v4.webp` | 724×543 |
| 黃金毛筆主標 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\call_gjzLY43UOCMr4T7A9c5abRoj.png` | `public/visuals/ai-dashboard/reference-v4/hero-title-calligraphy-v4.png` | 2014×780，RGBA |

### 四模式毛筆標題

四個模式名稱各由一張獨立 ImageGen 原圖製作，完成綠幕去背、裁切與高解析
WebP 後，再產生首頁使用的 600px 寬網站副本。可讀名稱另保留在 HTML 的
`sr-only` 文字中，圖片不承擔功能語意。

| 模式 | ImageGen 原始 PNG | 原圖尺寸／位元組 | 原圖 SHA-256 | 高解析 → 網站副本 |
| --- | --- | --- | --- | --- |
| 生日命碼 | `C:\Users\Hung\.codex\generated_images\019f75c2-ca06-79a3-a780-332368133223\exec-640640b2-f7b0-4180-b146-da71fd54b370.png` | 1774×887／1,549,409 | `57A6B2A9F5FC179A6FA098F5400EB147EAE01BBFFC9AD312821914113848E62E` | `title-birthday-v4.webp` → `title-birthday-web-v1.webp` |
| 數字頻譜 | `C:\Users\Hung\.codex\generated_images\019f75c2-ca06-79a3-a780-332368133223\exec-522ea2a5-b604-4942-8dfc-e277f77d7ef5.png` | 1920×819／1,691,168 | `03D3ADBA48D33E9AB52E15804B00C625732AF23A5570D1DD030D8AD5F5D40123` | `title-spectrum-v4.webp` → `title-spectrum-web-v1.webp` |
| 三數取卦 | `C:\Users\Hung\.codex\generated_images\019f75c3-1671-7933-9493-8d0ff4259c8a\exec-f5fbf2d7-5e90-4d0c-aca5-fc934ea1a6fe.png` | 1997×788／1,603,157 | `05825898B68D6A5FBBC83442629D3AFF84D7A93C3712B93224B74DBFA797621A` | `title-iching-v4.webp` → `title-iching-web-v1.webp` |
| 邵康節易學 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\exec-4bfd8482-5259-4bf5-884d-a4edf9fc8178.png` | 1905×825／1,472,001 | `C0712A7978CBFE2D2CD2824A612C22B1D97F52F3A1120873E421CFD73E3B54F8` | `title-kangjie-entry-v1.webp` → `title-kangjie-entry-web-v1.webp` |

高解析與網站副本均位於 `public/visuals/brush/`；轉換關係由
`scripts/build-aaa-social-assets.py` 固定記錄。

## 提示詞摘要

### 四格分析儀表

深墨玉綠與古金材質的東方天文儀器控制台，超寬四腔室構圖；各腔分別呈現核心環、九柱頻譜、中央核心儀與年度軌道。要求細密黃銅刻線、玉石、星盤與工程級邊框；禁止文字、數字、假資料、標誌與現成按鈕。

### 八格功能徽章

與參考頁一致的黑金玄星儀表風格，精確 4×2 共八個獨立圓形功能艙，分別以生日軌道、生命路徑、頻譜、九宮、流年、工作台、典籍與隱私鎖為視覺語彙。要求每格可單獨裁切，禁止文字、數字與假操作元件。

### 分析輸入台

高級東方天文觀測控制台正視圖，頂部四個空白模式槽、中段一個寬輸入凹槽、側邊操作凹槽、下方四個結果插槽；以黃銅細框、深玉與墨黑材質完成。禁止任何文字、數字或預填值。

### 黃金毛筆主標

在純綠底上以手寫毛筆與金墨製作單行繁體中文「解碼生命・掌握命運」，保持筆鋒、飛白、墨量與不規則手感；禁止電腦字體、襯線印刷感、額外符號與其他文字。完成後以色鍵工具輸出透明 PNG。

## SHA-256

```text
55002B5EC6ACBEA1471F6D8010ED402DD42E9B680230AEDC7092D4A534B4B710  analytics-overview-instrument-v4.webp
05E089EB5CA0E268BE73C3568DFC19B6A5C184B5EDD7E1DA45BF9F713F4C213D  analytics-spectrum-instrument-v4.webp
111B524AC99D98E568205FD3DD3A7FFD003642E9474B9F5275CEE4BA67D99B7C  analytics-core-instrument-v4.webp
88191FEC42CD56BEEFEDF9306999D206646E8A1AEB40260B7DBA714E30CA1DBC  analytics-annual-instrument-v4.webp
2DBDC37B8AD38F6021F61B25F70FAFDBF38C4D242C44F293FFD897BAE3B04B92  analyzer-console-frame-v4.webp
5238D314024281AB8881ACAC0E9CD74448FFB32382D712E6D708968E2584030E  function-bay-1-v4.webp
AA75F0ED838957783EA42DEBDCB30F8F6A7D9C90AE9D95E4C6B65CDDE7268C5F  function-bay-2-v4.webp
CC395BC9CC1D71C3ABFF63AB6CAD948F712738BBB7728423786ABA31E9FF65C0  function-bay-3-v4.webp
B89EA9EBCC1895707B8EE5642ED716820EA262BB6108316600A497C44DCC28CF  function-bay-4-v4.webp
5707C88B6FA55401FD67AD5A355136375BE98D462EEE6CC07278B8B92849F8ED  function-bay-5-v4.webp
5B61C3D804E11C6F59D2C7EE84851C1BF0D45E0E9789D701373E9D8E16C94FD6  function-bay-6-v4.webp
D835C137A129637C7C26315BA3B86AF858DCB1A7066AB518C9394DC4E8C3D708  function-bay-7-v4.webp
1A46077861B38C17085619D566A688714385FDB7E565A6467EF6BCA56D36355A  function-bay-8-v4.webp
BC414198C62B60158363438BCBD086C13B90A12CE812A05486EAE099C87E06DE  hero-title-calligraphy-v4.png
```

## 使用位置

- 桌機：頂部八功能導覽、側欄六個快速工具、主視覺標題、分析輸入台、四格即時分析儀表。
- 手機：四個分析模式保留於頂部，另以八格功能徽章呈現全部主要入口；原本過長的卡片牆在首屏隱藏。
- 所有入口都連到既有的實際模式、工作台、規則或隱私區，不建立無功能的裝飾按鈕。
