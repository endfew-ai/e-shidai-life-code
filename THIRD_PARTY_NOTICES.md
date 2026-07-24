# 第三方資料與授權

## 《周易》本文

- 來源：維基文庫《周易》 https://zh.wikisource.org/zh/周易
- 範圍：六十四卦的卦辭、爻辭、《彖傳》、《象傳》及乾坤《文言》本文。
- 原典狀態：公有領域。
- 維基文庫編排：依 CC BY-SA 4.0 授權；各卦資料保留來源頁面與修訂版本編號。

本專案只呈現古籍本文與固定規則計算，不收錄或產生吉凶解讀。

## Unicode Unihan 17.0.0

- 來源：[Unicode 17.0.0 Unihan.zip](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip)
- 欄位：`kTotalStrokes`
- 原始 ZIP SHA-256：`f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e`
- 生成索引：`public/data/unihan-kTotalStrokes-17.0.0.json`
- 索引筆數：102,998
- 索引 SHA-256：`ff6b6fd20c0a372af064281f6a48bd0c6ac019c600e3e97c4e7cc880dbb54eca`
- 授權：Unicode License v3，完整通知見 `public/data/UNICODE-LICENSE.txt`

`kTotalStrokes` 是 Unicode／IRG informative 總筆畫，不是教育部標準字體筆畫，也不是康熙筆畫。

## 教育部筆畫資料

程式保留教育部《國語辭典簡編本》provider 介面與來源資訊。考量 CC BY-ND 3.0 TW 的禁止改作條款，公開版本沒有散布轉換後的教育部筆畫 JSON，也沒有把教育部筆順動畫或圖片打包進本站。詳細界線見 `docs/stroke-data.md`。
