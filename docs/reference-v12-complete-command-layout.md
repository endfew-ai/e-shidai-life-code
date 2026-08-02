# Reference v12：完整功能單畫面控制台

## 目的

將首頁由 16 個入口擴充為 22 個可直接操作的功能模組，補回原本藏在「康節易學」專頁內的六大方法，同時維持桌機、平板與手機首屏可見。

## 版面規則

- 桌機：8 欄 3 列；最後 6 格置中。短高螢幕取消舊版最低高度，`1280×640` 仍能完整顯示。
- 平板：8 欄 3 列；`1024×768` 移除舊版空白信任列，主視覺、分析器、摘要與功能牆連續排列。
- 手機：4 欄密集排列，共 6 列；最後 2 格置中。`320×720` 可完整看到四模式、輸入、四項摘要與全部 22 個入口。
- 完整分析內容仍可向下捲動；「單畫面」指首頁所有功能入口均在首屏可見，不以縮小完整報告文字換取假性塞入。

## 22 個直接入口

1. 生日分析
2. 生命路徑
3. 數字頻譜
4. 九宮配置
5. 個人流年
6. 適合色彩
7. 三數取卦
8. 姓名筆畫
9. 康節易學
10. 年月日時
11. 物數起卦
12. 聲音起卦
13. 字占姓名
14. 古例補充
15. 元會運世
16. 身分證命格
17. 手機磁場
18. 車牌門牌
19. 自訂序列
20. 本機紀錄
21. 規則設定
22. 規則來源

## 康節直達雜湊

- `kangjie.html#method-calendar`
- `kangjie.html#method-object`
- `kangjie.html#method-sound`
- `kangjie.html#method-text`
- `kangjie.html#method-supplement`
- `kangjie.html#method-huangji`

輸入密碼 `0000` 後保留指定分頁，不會退回康節原典首頁。React 路由使用相同雜湊：`/kangjie#method-*`。

## AI 模組圖資

本輪使用內建 ImageGen 產生六張無文字、1:1、安全區一致的黑玉／古金儀器圖，再轉為 768×768 WebP：

| 功能 | 檔案 | 核心提示詞 |
| --- | --- | --- |
| 年月日時 | `public/visuals/ai-dashboard/reference-v12/kangjie-calendar-v12.webp` | 月相曆輪、四季門、十二軌道節點與中央時間盤 |
| 物數起卦 | `public/visuals/ai-dashboard/reference-v12/kangjie-object-v12.webp` | 青銅計數籌、八位環與平衡指針 |
| 聲音起卦 | `public/visuals/ai-dashboard/reference-v12/kangjie-sound-v12.webp` | 雙層共鳴室、聲波環、懸浮調音球與八向感測器 |
| 字占姓名 | `public/visuals/ai-dashboard/reference-v12/kangjie-text-v12.webp` | 無字卷軸、毛筆、金墨筆畫路徑與計數環 |
| 古例補充 | `public/visuals/ai-dashboard/reference-v12/kangjie-supplement-v12.webp` | 青銅尺、比例桿、羅盤、方位瞄具與玉鏡 |
| 元會運世 | `public/visuals/ai-dashboard/reference-v12/kangjie-huangji-v12.webp` | 四層宇宙時間環、三十節點、玉球與紀元指針 |

共同限制：黑玉底、古金與低彩度青綠、中央 68% 安全區、卡片縮圖仍可辨識；禁止文字、字母、數字、漢字、浮水印、人物與明亮霓虹。

## 驗收範圍

- `1672×941`、`1440×900`、`1366×768`、`1280×720`、`1280×640`
- `1024×768`、`768×1024`
- `390×844`、`390×693`、`360×800`、`320×720`
- 驗證模組數量、欄數、首屏底界、文字裁切、水平溢位、中心點可點、AI 圖載入與康節深連結。
