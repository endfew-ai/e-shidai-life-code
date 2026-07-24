# 古籍與資料來源

所有 runtime 計算只讀本機固定資料，不在演算時爬網。

| Source ID | 來源 | 用途 |
|---|---|---|
| `MYS-WIKI-01` | 維基文庫《梅花易數》卷一 | 起卦方法主文 |
| `MYS-CTEXT-01` | 中國哲學書電子化計劃《梅花易數》卷一 | 傳本文字交叉核對 |
| `MYS-CTEXT-02` | 中國哲學書電子化計劃《梅花易數》卷二 | 體用與五行 |
| `HUANGJI-KANRIPO-01` | 漢籍リポジトリ《皇極經世書》 | 元會運世結構 |
| `CWA-CALENDAR-01` | 中央氣象署 A-A0087-001 | 國農曆與節氣測試基準 |
| `UNICODE-UNIHAN-17.0.0` | Unicode 17.0 Unihan | `kTotalStrokes` 自動筆畫 |
| `MOE-STANDARD-FONT-01` | 教育部標準字體與辭典公眾授權資料 | 臺灣字體筆畫 provider 與人工核對 |

## 直接連結

- [1925 年國立北平圖書館藏《梅花易數》影本](https://commons.wikimedia.org/wiki/File:NLC416-12jh005426-44577_%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8.pdf)
- [維基文庫《梅花易數》卷一](https://zh.wikisource.org/zh-hant/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%B8%80)
- [中國哲學書電子化計劃《梅花易數》卷一](https://ctext.org/wiki.pl?chapter=867487&if=gb)
- [中國哲學書電子化計劃《梅花易數》卷二](https://ctext.org/wiki.pl?chapter=475043&if=gb)
- [漢籍リポジトリ《皇極經世書》](https://www.kanripo.org/text/KR3g0006/001)
- [中央氣象署日曆資料](https://opendata.cwa.gov.tw/dataset/all/A-A0087-001)
- [UAX #38 Unihan](https://www.unicode.org/reports/tr38/)
- [Unicode 17.0.0 Unihan.zip](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip)
- [教育部辭典公眾授權網](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html)

重要公式先用可檢索轉錄定位，再以古籍影本交叉核對。中央氣象署資料支持臺灣國農曆日期、節氣與閏月核對；立春換年、正月初一換年及子時換日屬本工具的可切換術數規約，不宣稱為氣象署規則。

## 《周易》本文

`iching-text.js` 的實際來源是[維基文庫《周易》](https://zh.wikisource.org/zh/%E5%91%A8%E6%98%93)，每卦保留修訂版本。中國哲學書電子化計劃只作交叉核對，不再標成內嵌資料的來源。

## 版本與授權

- Unihan 原始 ZIP SHA-256：`f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e`。
- Unihan 生成索引 SHA-256：`ff6b6fd20c0a372af064281f6a48bd0c6ac019c600e3e97c4e7cc880dbb54eca`。
- Unicode License v3 全文保存在 `public/data/UNICODE-LICENSE.txt`。
- 教育部筆畫的授權界線詳見 `docs/stroke-data.md`。
