# 字占筆畫資料、授權與稽核規則

日期：2026-07-24

## 一、直接結論

本專案將「筆畫數」視為有版本、有來源且可能互相衝突的資料，不把任何單一資料表冒充所有流派的唯一標準。

公開版本目前採用：

1. 本機打包的 Unicode 17.0.0 Unihan `kTotalStrokes` 索引，供自動查找與離線運算。
2. 教育部《國語辭典簡編本》的 provider 介面與來源標籤，但基於 `CC BY-ND 3.0 TW` 的禁止改作限制，公開版本未散布由教育部原始 XLSX 轉換而成的 JSON 索引。
3. 查無資料、資料衝突或使用者認為字形版本不同時，要求使用者手動輸入。
4. 原程式的筆畫規則只在 `legacy-existing-v1` 模式中使用，不標示為 Unicode、教育部或康熙資料。

## 二、Unicode Unihan 17.0.0

### 2.1 固定版本

| 項目 | 值 |
| --- | --- |
| Unicode 版本 | `17.0.0` |
| 屬性 | `kTotalStrokes` |
| 原始資料 | [Unihan.zip](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip) |
| 規格文件 | [UAX #38：Unicode Han Database](https://www.unicode.org/reports/tr38/) |
| 授權 | [Unicode License v3](https://www.unicode.org/license.txt) |
| 原始 ZIP SHA-256 | `f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e` |
| 本機索引筆數 | `102998` |
| 本機索引 schema | `unihan-total-strokes-index-v1` |
| 建置器版本 | `build-unihan-strokes-v1` |

本機公開索引位於：

```text
public/data/unihan-kTotalStrokes-17.0.0.json
```

索引保留原始版本、來源網址、授權網址、原始 ZIP 雜湊、各輸入檔雜湊、解析器版本與筆數，供日後重建及比對。

### 2.2 欄位意義

Unihan 原始文字資料每筆為三個 Tab 分隔欄位：

```text
Unicode scalar value    property name    property value
```

例如：

```text
U+5EB7    kTotalStrokes    11
```

`kTotalStrokes`：

- 包含部首的總筆畫數；
- 依 IRG 的筆畫計數慣例建立；
- 在 UAX #38 中屬 `Informative`；
- 數值語法為 1 至 999；
- 主要服務 Unicode／CLDR 排序與轉寫等用途。

因此畫面與演算明細必須標示：

```text
Unicode Unihan kTotalStrokes
Unicode／IRG informative 總筆畫
```

不得把它改稱為「教育部標準筆畫」或「康熙筆畫」。

`kAlternateTotalStrokes` 屬 `Provisional`，且規格明示並非完整列出所有異體計數。它只能作為候選與警告資料，不能無條件覆蓋 `kTotalStrokes`。

UAX #38 亦明示各屬性所在的 Unihan 檔案可能隨 Unicode 版本變動。因此重建索引時應掃描該版本的所有 `Unihan_*.txt`，以屬性名稱辨識資料，不得假定 `kTotalStrokes` 永遠位於固定檔名。

### 2.3 授權要求

Unicode License v3 允許使用、複製、修改、合併、發布、散布及商業利用資料，但必須在資料副本或隨附文件保留著作權與授權通知。

專案升級 Unicode 版本時不得直接覆蓋既有索引。應另建版本檔，重新記錄：

- Unicode 版本；
- 原始下載網址；
- 下載日期；
- 原始 ZIP SHA-256；
- 解析器版本；
- 輸入檔雜湊；
- 產出筆數；
- 舊版與新版差異。

## 三、教育部《國語辭典簡編本》

### 3.1 官方資料

| 項目 | 值 |
| --- | --- |
| 資料名稱 | 中華民國教育部《國語辭典簡編本》 |
| 下載版本 | `dict_concised_2014_20260626` |
| 下載頁 | [教育部公眾授權資料下載](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html) |
| 使用說明 | [《國語辭典簡編本》公眾授權使用說明](https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/conciseddict_10312.pdf) |
| 筆畫依據說明 | [教育部《國語辭典簡編本》常見問題](https://dict.concised.moe.edu.tw/page.jsp?ID=10) |
| 授權 | `CC BY-ND 3.0 TW` |
| 原始 ZIP SHA-256 | `fc83d27eb3fbf6fcfdb791e7d05ef60946b58ef8e8857ed165b612217b392806` |

官方 XLSX 包含：

```text
字詞名
字詞號
部首字
總筆畫數
部首外筆畫數
多音排序
注音一式
變體類型
變體注音
漢語拼音
變體漢語拼音
相似詞
相反詞
釋義
多音參見訊息
```

本專案所需的來源欄位是 `字詞名` 與 `總筆畫數`。教育部說明該辭典的字形、部首及筆畫數主要依據教育部頒訂的國字標準字體表，因此若載入此 provider，來源標籤必須完整顯示：

```text
教育部《國語辭典簡編本》
版本：2014_20260626
欄位：總筆畫數
```

### 3.2 授權與公開版本限制

`CC BY-ND 3.0 TW` 允許重製、散布及商業利用原著作，但不得修改個別條目的詞目、部首、筆畫、字形、音讀或釋義，並須保留完整使用說明及版本資訊。

為保守遵守禁止改作條款：

- 公開版本不打包教育部 XLSX 的轉換後 JSON 子集；
- 專案只保留 `moe-concised` provider 介面、欄位定義、來源網址、版本及授權標籤；
- 未來若要公開散布轉換索引，應先取得教育部書面授權或完成適用授權的法律確認；
- 載入獲授權資料時，原始檔必須保持不變，轉換索引與原始資料分開存放。

教育部「4,808 常用字」ODS 只有流水序、教育部字號、Unicode 與常用字，不含筆畫數，不能拿來生成筆畫。

教育部國字標準字體筆順學習網的筆順動畫及全筆順提示採 `CC BY-NC-ND 3.0 TW`。公開版本不得直接打包、改作或藉由圖片反推成商用筆畫資料庫。

## 四、供應器與選擇順序

目前供應器識別碼：

| provider | 用途 | 公開版本狀態 |
| --- | --- | --- |
| `manual-user` | 使用者對本次演算的明確覆寫 | 可用 |
| `moe-concised` | 教育部《國語辭典簡編本》總筆畫 | 介面可用，未散布轉換索引 |
| `unicode-unihan` | Unicode／IRG `kTotalStrokes` | 本機索引可用 |
| `legacy-existing-v1` | 原程式既有筆畫規則 | 僅舊版 profile |
| `kangxi-authorized` | 經授權且可稽核的康熙資料 | 尚未取得資料，不啟用 |

臺灣標準 profile 的優先序：

```text
本次人工覆寫
→ 教育部 provider
→ Unicode Unihan provider
→ 要求人工輸入
```

Unicode profile 的優先序：

```text
本次人工覆寫
→ Unicode Unihan provider
→ 教育部 provider
→ 要求人工輸入
```

`legacy-existing-v1` 只在使用者明確選擇「原程式舊版」時使用，不得偷偷成為新 profile 的資料補洞。

## 五、查無、衝突與人工覆寫

### 5.1 查無資料

查無筆畫時必須回傳：

```text
count = null
requiresManualInput = true
```

並阻止該筆字占正式起卦，直到所有漢字都有可稽核筆畫。不得：

- 將查無值當成 0；
- 以字串長度代替；
- 自動改成繁體或簡體字；
- 以相似字、異體字或網路姓名學表猜測；
- 顯示成教育部或康熙筆畫。

### 5.2 資料衝突

教育部與 Unicode 的筆畫不同時：

- 同時保留兩個候選值與來源；
- 依目前 profile 選擇結果；
- 畫面顯示差異警告；
- 演算紀錄保存 `selectedBy = profile`；
- 不修改任何原始資料。

同一 provider 內若相同漢字出現不同 `總筆畫數`，狀態應為 `conflict`，要求人工確認，不可任意取第一筆、最大值、最小值或多數決。

### 5.3 人工覆寫

人工筆畫必須是 1 至 999 的完整整數。人工覆寫：

- 優先於自動 provider；
- 只作用於本次演算；
- 不寫回 Unicode 或教育部索引；
- 必須顯示「手動輸入」；
- 演算明細保存字、Unicode code point、輸入值及 `manualOverride = true`；
- 若與官方候選不同，仍保留候選值供使用者核對。

## 六、康熙資料不可冒充

Unihan 的 `kKangXi` 與 `kIRGKangXi` 是 1989 年中華書局第七版《康熙字典》的 `page.position` 索引，用於查找與排序，不是筆畫數。末位甚至可能表示字典未實際收錄、只配置虛擬位置。

此外，`kRSKangXi` 已於 Unicode 15.1 移除。下列資料都不得改名為「康熙筆畫」：

- `kTotalStrokes`；
- `kRSUnicode`；
- `kKangXi` 或 `kIRGKangXi`；
- 教育部《國語辭典簡編本》總筆畫數；
- 原程式舊筆畫表；
- 未標示版本與授權的網路姓名學資料。

在取得明確授權、版本固定、字碼對應可稽核且經校勘的康熙筆畫資料集以前，`kangxi-authorized` 必須回傳：

```text
status = unavailable
requiresManualInput = true
```

畫面應顯示「尚無可稽核的康熙筆畫資料，請手動輸入」，不得以其他來源冒充。

## 七、結果稽核欄位

每一字的筆畫結果至少保存：

```text
character
codePoints
count
providerId
sourceLabel
sourceVersion
sourceField
rawValue
sourceUrl
licenseId
authority
manualOverride
selectedBy
warnings
```

資料快照另應保存：

```text
sourceId
sourceVersion
originalUrl
licenseUrl
downloadedAt
sha256
originalFilename
parserVersion
recordCount
conflictCount
```

這些欄位是重現字占演算的必要證據；只顯示「某字幾畫」而不記錄來源與版本，不符合本專案的稽核要求。
