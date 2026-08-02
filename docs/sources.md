# 古籍與資料來源

所有 runtime 計算只讀本機固定資料，不在演算時爬網。

| Source ID | 來源 | 用途 |
|---|---|---|
| `MYS-WIKI-01` | 維基文庫《梅花易數》卷一 | 起卦方法主文 |
| `MYS-CTEXT-01` | 中國哲學書電子化計劃《梅花易數》卷一 | 傳本文字交叉核對 |
| `MYS-CTEXT-02` | 中國哲學書電子化計劃《梅花易數》卷二 | 體用與五行 |
| `MYS-WIKI-02` | 維基文庫《梅花易數》卷二 | 體用、互變對體的生剋及月令旺衰 |
| `MYS-NLC-1925-01` | 中國國家圖書館藏 1925 文明書局本影像 | 除八除六、字占、尺寸、後天端法影像校勘 |
| `HUANGJI-KANRIPO-BOOK-01` | 漢籍リポジトリ邵雍《皇極經世書》 | 原書書目、卷次與傳本文字入口 |
| `HUANGJI-KANRIPO-01` | 漢籍リポジトリ張行成《皇極經世索隱》 | 明載一世 30 年、一運 12 世、一會 30 運、一元 12 會 |
| `HUANGJI-NCL-1936-01` | 臺灣國家圖書館藏 1936 黃粵洲註《皇極經世書》影像 | 後出註本尺度影像校勘；不提供唯一西元錨點 |
| `CWA-CALENDAR-01` | 中央氣象署 A-A0087-001 | 國曆、農曆資料欄位與固定測試基準 |
| `CWA-SOLAR-TERMS-01` | 中央氣象署 A-A0087-003 | 二十四節氣與立春交節時刻 |
| `ECMA402-INTL-CHINESE-01` | ECMA-402 `Intl.DateTimeFormat` | 瀏覽器自動農曆換算的實際 runtime provider；與氣象署固定核對點分開標示 |
| `UNICODE-UNIHAN-17.0.0` | Unicode 17.0 Unihan | `kTotalStrokes` 自動筆畫 |
| `MOE-CONCISED-DICT-01` | 教育部《國語辭典簡編本》公眾授權資料 | 簡編本總筆畫 provider 與人工核對；不等於康熙筆畫 |
| `NUMEROLOGY-MODERN-CYCLES-01` | Hans Decoz／World Numerology 公開計算說明 | 個人年、個人月與個人日的現代流傳公式；不作古籍或科學權威 |
| `TW-GOV-SCHEMA-167` | 政府資料標準平臺「人屬性基本資料」 | 國民身分證與新式外來人口統一證號格式、性別碼及檢查碼欄位 |
| `TW-GAZETTE-NATIONAL-ID-CHECKSUM` | 行政院公報國民身分證檢查方法 | 國民身分證字母區碼與檢查碼邏輯 |
| `TW-NIA-FOREIGN-UI` | 內政部移民署外來人口統一證號資料 | 新式 1 英文＋9 數字、8／9 性別碼、舊式 2 英文＋8 數字及編碼原則 |
| `TW-MOF-FOREIGN-UI-FORMAT` | 財政部新舊式外來人口統一證號格式說明 | 舊式第 2 碼 A～D 與新式第 2 碼 8／9 的格式界線 |

## 直接連結

- [1925 年國立北平圖書館藏《梅花易數》影本](https://commons.wikimedia.org/wiki/File:NLC416-12jh005426-44577_%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8.pdf)
- [維基文庫《梅花易數》卷一](https://zh.wikisource.org/zh-hant/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%B8%80)
- [中國哲學書電子化計劃《梅花易數》卷一](https://ctext.org/wiki.pl?chapter=867487&if=gb)
- [中國哲學書電子化計劃《梅花易數》卷二](https://ctext.org/wiki.pl?chapter=475043&if=gb)
- [維基文庫《梅花易數》卷二](https://zh.wikisource.org/wiki/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%BA%8C)
- [漢籍リポジトリ邵雍《皇極經世書》](https://www.kanripo.org/text/KR3g0005/000)
- [漢籍リポジトリ張行成《皇極經世索隱》](https://www.kanripo.org/text/KR3g0006/001)
- [臺灣國家圖書館藏 1936《皇極經世書》影像鏡像](https://commons.wikimedia.org/wiki/File:NCL-002452168_%E7%9A%87%E6%A5%B5%E7%B6%93%E4%B8%96%E6%9B%B8_%E4%B9%9D%E5%8D%B7%2C_%E9%A6%96%E4%B8%80%E5%8D%B7_v.2.pdf)
- [中央氣象署日曆資料](https://opendata.cwa.gov.tw/dataset/all/A-A0087-001)
- [中央氣象署二十四節氣資料](https://opendata.cwa.gov.tw/dataset/all/A-A0087-003)
- [中央氣象署 2023 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2023cal.pdf)
- [中央氣象署 2024 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2024cal.pdf)
- [中央氣象署 2025 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2025cal.pdf)
- [中央氣象署 2026 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2026cal.pdf)
- [中央氣象署 2027 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2027cal.pdf)
- [中央氣象署 2028 年日曆 PDF](https://www.cwa.gov.tw/Data/astronomy/2028cal.pdf)
- [ECMA-402 DateTimeFormat 規格](https://tc39.es/ecma402/#datetimeformat-objects)
- [UAX #38 Unihan](https://www.unicode.org/reports/tr38/)
- [Unicode 17.0.0 Unihan.zip](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip)
- [教育部《國語辭典簡編本》資料下載](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html)
- [World Numerology：個人年／月／日公開計算說明](https://www.worldnumerology.com/do-your-own-reading/)
- [政府資料標準平臺：身分證與外來人口統一證號欄位](https://schema.gov.tw/lists/167)
- [行政院公報：國民身分證統一編號檢查方法](https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg011228/ch04/type2/gov30/num2/OEg.pdf)
- [內政部移民署：外來人口統一證號](https://www.immigration.gov.tw/5385/12162/238449//CP_QA?alias=QAClass&type=%E5%85%A7%E6%94%BF%E9%83%A8%E7%A7%BB%E6%B0%91%E7%BD%B2)
- [財政部：新舊式外來人口統一證號格式差異](https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/alien-tax-question/other/781zJ3Y)

重要公式先用可檢索轉錄定位，再以古籍影本交叉核對。五行多位置關係與旺衰以《梅花易數》卷二文字及影像核對。自動農曆由 ECMA-402 `Intl` provider 計算；中央氣象署資料只支持固定國農曆、節氣與閏月核對點。立春換年、正月初一換年及子時換日屬本工具的可切換術數規約，不宣稱為氣象署規則。

## 生日色彩資料界線

Cheiro《Cheiro's Book of Numbers》第 23、27 章只支撐出生日數 1 至 9 的歷史色名家族；原書沒有現代 HEX。程式將資料拆成 `historicalColorFamilies` 與 `editorialDigitalSwatches`，後者一律標為本站數位轉譯，不得冒充原書色碼，也不代表科學個人色彩鑑定。

- [Cheiro 原書第 23 章](https://archive.org/details/in.ernet.dli.2015.70770/page/n125/mode/2up)
- [Cheiro 原書第 27 章](https://archive.org/details/in.ernet.dli.2015.70770/page/n137/mode/2up)
- [WCAG 2.2 色彩與對比標準](https://www.w3.org/TR/WCAG22/)

現代三數的「三個輸入依序取上卦、下卦、動爻」公式本身沒有古籍來源依據；共用結果所列《梅花易數》來源只支持卦序、體用、五行等共用結構，不替現代三數公式背書。方法結果固定保存「本次核對未見於古籍主法」警告；`modern-current-v1` 使用現代資料 provider 也不等於取得古籍權威。

## 《周易》本文

`iching-text.js` 的實際來源是[維基文庫《周易》](https://zh.wikisource.org/zh/%E5%91%A8%E6%98%93)，每卦保留修訂版本。中國哲學書電子化計劃只作交叉核對，不再標成內嵌資料的來源。

## 版本與授權

- Unihan 原始 ZIP SHA-256：`f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e`。
- Unihan 生成索引 SHA-256：`ff6b6fd20c0a372af064281f6a48bd0c6ac019c600e3e97c4e7cc880dbb54eca`。
- Unicode License v3 全文保存在 `public/data/UNICODE-LICENSE.txt`。
- 教育部筆畫的授權界線詳見 `docs/stroke-data.md`。
