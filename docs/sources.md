# 古籍與資料來源

所有 runtime 計算只讀本機固定資料，不在演算時爬網。

| Source ID | 來源 | 用途 |
|---|---|---|
| `MYS-WIKI-01` | 維基文庫《梅花易數》卷一 | 起卦方法主文 |
| `MYS-CTEXT-01` | 中國哲學書電子化計劃《梅花易數》卷一 | 傳本文字交叉核對 |
| `MYS-CTEXT-02` | 中國哲學書電子化計劃《梅花易數》卷二 | 體用與五行 |
| `MYS-WIKI-02` | 維基文庫《梅花易數》卷二 | 體用、互變對體的生剋及月令旺衰 |
| `MYS-NLC-1925-01` | 中國國家圖書館藏 1925 文明書局本影像 | 除八除六、字占、尺寸、後天端法影像校勘 |
| `HUANGJI-KANRIPO-01` | 漢籍リポジトリ《皇極經世書》 | 元會運世結構 |
| `HUANGJI-NCL-1936-01` | 臺灣國家圖書館藏 1936《皇極經世書》影像 | 元會運世尺度影像校勘；不提供唯一西元錨點 |
| `CWA-CALENDAR-01` | 中央氣象署 A-A0087-001 | 國曆、農曆資料欄位與固定測試基準 |
| `CWA-SOLAR-TERMS-01` | 中央氣象署 A-A0087-003 | 二十四節氣與立春交節時刻 |
| `UNICODE-UNIHAN-17.0.0` | Unicode 17.0 Unihan | `kTotalStrokes` 自動筆畫 |
| `MOE-CONCISED-DICT-01` | 教育部《國語辭典簡編本》公眾授權資料 | 簡編本總筆畫 provider 與人工核對；不等於康熙筆畫 |

## 直接連結

- [1925 年國立北平圖書館藏《梅花易數》影本](https://commons.wikimedia.org/wiki/File:NLC416-12jh005426-44577_%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8.pdf)
- [維基文庫《梅花易數》卷一](https://zh.wikisource.org/zh-hant/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%B8%80)
- [中國哲學書電子化計劃《梅花易數》卷一](https://ctext.org/wiki.pl?chapter=867487&if=gb)
- [中國哲學書電子化計劃《梅花易數》卷二](https://ctext.org/wiki.pl?chapter=475043&if=gb)
- [維基文庫《梅花易數》卷二](https://zh.wikisource.org/wiki/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%BA%8C)
- [漢籍リポジトリ《皇極經世書》](https://www.kanripo.org/text/KR3g0006/001)
- [臺灣國家圖書館藏 1936《皇極經世書》影像鏡像](https://commons.wikimedia.org/wiki/File:NCL-002452168_%E7%9A%87%E6%A5%B5%E7%B6%93%E4%B8%96%E6%9B%B8_%E4%B9%9D%E5%8D%B7%2C_%E9%A6%96%E4%B8%80%E5%8D%B7_v.2.pdf)
- [中央氣象署日曆資料](https://opendata.cwa.gov.tw/dataset/all/A-A0087-001)
- [中央氣象署二十四節氣資料](https://opendata.cwa.gov.tw/dataset/all/A-A0087-003)
- [中央氣象署 2023 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2023cal.pdf)
- [中央氣象署 2024 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2024cal.pdf)
- [中央氣象署 2025 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2025cal.pdf)
- [中央氣象署 2026 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2026cal.pdf)
- [中央氣象署 2027 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2027cal.pdf)
- [中央氣象署 2028 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2028cal.pdf)
- [UAX #38 Unihan](https://www.unicode.org/reports/tr38/)
- [Unicode 17.0.0 Unihan.zip](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip)
- [教育部《國語辭典簡編本》資料下載](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html)

重要公式先用可檢索轉錄定位，再以古籍影本交叉核對。五行多位置關係與旺衰以《梅花易數》卷二文字及影像核對。中央氣象署資料支持臺灣國農曆日期、節氣與閏月核對；立春換年、正月初一換年及子時換日屬本工具的可切換術數規約，不宣稱為氣象署規則。

現代三數的「三個輸入依序取上卦、下卦、動爻」公式本身沒有古籍來源依據；共用結果所列《梅花易數》來源只支持卦序、體用、五行等共用結構，不替現代三數公式背書。方法結果固定保存「本次核對未見於古籍主法」警告；`modern-current-v1` 使用現代資料 provider 也不等於取得古籍權威。

## 《周易》本文

`iching-text.js` 的實際來源是[維基文庫《周易》](https://zh.wikisource.org/zh/%E5%91%A8%E6%98%93)，每卦保留修訂版本。中國哲學書電子化計劃只作交叉核對，不再標成內嵌資料的來源。

## 版本與授權

- Unihan 原始 ZIP SHA-256：`f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e`。
- Unihan 生成索引 SHA-256：`ff6b6fd20c0a372af064281f6a48bd0c6ac019c600e3e97c4e7cc880dbb54eca`。
- Unicode License v3 全文保存在 `public/data/UNICODE-LICENSE.txt`。
- 教育部筆畫的授權界線詳見 `docs/stroke-data.md`。
