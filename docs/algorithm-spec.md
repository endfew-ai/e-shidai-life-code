# 生命靈數規則引擎規格

版本：2.0.0
日期：2026-07-23

## 一、用途與邊界

本規格只用於民俗文化、娛樂及自我觀察。結果不是科學預測，不具醫療診斷、心理診斷、法律判定、投資建議或命運保證效力。

所有計算必須：

1. 可重現：日期與規則由呼叫端明確傳入。
2. 可追溯：回傳公式、步驟、規則版本及來源 profile。
3. 可設定：流派差異不能寫成唯一真理。
4. 可相容：舊版以 `legacy-project-v1` 保留。
5. 保護隱私：身分證完整值不得寫入歷史紀錄或日誌。

## 二、模組架構

```text
domain/numerology/rule-data.js
  ├─ life-path.js
  ├─ birth-grid.js
  ├─ magnetic-field.js
  ├─ identity-timeline.js
  └─ interpretation.js
        ↓
application/numerology-analysis.js
        ↓
infrastructure/numerology-storage.js + UI
```

五個核心責任如下：

1. 生命靈數：生日解析、生命靈數、生日數、個人流年。
2. 生日九宮格：數字分布、缺數、主線、次線、強度。
3. 數字磁場：A=01、滑動配對、64 組映射、0／5、組合規則。
4. 身分證時間軸：官方格式／檢查碼、民俗序列與人生階段。
5. 解讀／報告：結構化段落、來源、警告、免責與隱私安全歷史摘要。

## 三、規則版本

### 新版預設 `uploaded-material-v2`

| 設定 | 值 |
| --- | --- |
| `lifePathMode` | `full_birth_digits` |
| `birthGridMode` | `raw_birth_digits` |
| `masterNumberMode` | `disabled` |
| `zeroFiveMode` | `bridge_modifier` |
| `timelineProfile` | `first_10_then_5` |
| 磁場表版本 | `uploaded-material-v1` |
| 解讀版本 | `neutral-zh-tw-v1` |

### 舊版相容 `legacy-project-v1`

| 設定 | 值 |
| --- | --- |
| `lifePathMode` | `legacy_segmented` |
| `birthGridMode` | `legacy_project` |
| `masterNumberMode` | `preserve_11_22_33` |
| `zeroFiveMode` | `legacy_project` |
| `timelineProfile` | `legacy_project` |

舊專案沒有八大磁場及身分證流年實作，所以 legacy 模式對這兩項只能標示「無舊公式」，不能捏造結果。

## 四、西元生日解析

輸入格式固定為：

```text
YYYY-MM-DD
```

驗證順序：

1. 去除字串前後空白。
2. 必須完全符合四位年、二位月、二位日。
3. 以 UTC 建立日期並反查年、月、日，排除 2025-02-29 等不存在日期。
4. 若提供 `todayValue`，正規化生日不得晚於今天。
5. 取出八位原始生日數字，保留 0 供生命靈數加總。

## 五、生命靈數

### 5.1 新版預設公式

令完整生日八位數為：

```text
d1 d2 d3 d4 d5 d6 d7 d8
```

第一次加總：

```text
S0 = d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8
```

若主數模式不保留目前值，且 `S > 9`，反覆執行：

```text
S(n+1) = sum(decimal digits of S(n))
```

直到得到 1～9，或命中已啟用的主數。

例：`1985-05-01`

```text
1+9+8+5+0+5+0+1 = 29
2+9 = 11
1+1 = 2
```

新版預設主數停用，所以生命靈數為 2；若選擇保留 11、22、33，則結果為 11、基底數為 2。

### 5.2 主數模式

- `disabled`：一律化簡到 1～9。
- `preserve_11_22_33`：中途或結果命中 11、22、33 即停止；另回傳 1～9 基底。
- `preserve_custom`：命中 `customMasterNumbers` 才停止；陣列至少要有一個大於 9 的安全整數。

### 5.3 舊版分段公式

```text
M = reduce(月)
D = reduce(日)
Y = reduce(年)
L = reduce(M + D + Y)
```

化簡過程依 legacy 主數設定保留 11、22、33。結果必須標記來源為 `legacy-project-v1`。

## 六、生日數與生日個人流年

### 6.1 生日數

只取二位日期 `DD`：

```text
BirthdayNumber = reduce(tens(D) + ones(D))
```

例：22 日在預設模式為 `2+2=4`；主數保留模式可為 22，基底仍為 4。

### 6.2 生日個人流年

此為既有站內規則，與身分證人生階段時間軸不同：

```text
PersonalYear = reduce(月 + 日 + 指定西元年)
```

個人流年固定化簡至 1～9。應用層需明確傳入 `currentYear`，並可顯示前一年、當年、下一年。

## 七、生日九宮格

### 7.1 數字來源模式

- `raw_birth_digits`：使用生日原始八位數，排除 0；新版預設。
- `raw_plus_life_path`：原始生日非 0 數字，再加入一次生命靈數 1～9 基底。
- `legacy_project`：計數仍使用原始生日非 0 數字，但顯示順序使用舊站洛書版位。

新版顯示順序為 `1,2,3,4,5,6,7,8,9`；舊站洛書順序為 `4,9,2,3,5,7,8,1,6`。

每個數字 `n` 的次數：

```text
count[n] = analysisDigits 中 n 的出現次數，n ∈ {1..9}
```

### 7.2 連線成立與強度

一條線的所有數字至少出現一次才成立：

```text
present(line) = every count[n] >= 1
strength(line) = min(count[n])，未成立則為 0
```

### 7.3 主線

| 數字 | 名稱 |
| --- | --- |
| 1-2-3 | 創意線／藝術線 |
| 4-5-6 | 組織線／秩序線 |
| 7-8-9 | 貴人線／權威線 |
| 1-4-7 | 物質線／實務線 |
| 2-5-8 | 情感線／溝通線 |
| 3-6-9 | 智慧線／思考線 |
| 1-5-9 | 事業線／執行線 |
| 3-5-7 | 人際線／表達線 |

### 7.4 次線

| 數字 | 名稱 |
| --- | --- |
| 2-4 | 靈巧線 |
| 2-6 | 公平線 |
| 4-8 | 模範線 |
| 6-8 | 感受線 |
| 2-4-6-8 | 情緒壓力組合 |

「情緒壓力組合」只保留為教材民俗描述，不是心理或醫療診斷。

## 八、1～9 人格資料

人格內容以結構化欄位保存：

- `number`
- `title`
- `positiveTraits`
- `challengeTraits`
- `socialTraits`
- `workTraits`
- `healthFolkloreNotes`
- `disclaimer`
- `sourceProfile`

人格以生命靈數基底 1～9 查表。任何健康對應都必須顯示：「此為原教材中的民俗對應，無醫學診斷效力；身體不適應諮詢合格醫療專業人員。」

## 九、八大磁場 64 組

只有數字 `1,2,3,4,6,7,8,9` 組成的 64 個有序二位組合列入基本表：

| 磁場 | 配對 |
| --- | --- |
| 伏位 | 11、22、33、44、66、77、88、99 |
| 延年 | 19、91、26、62、34、43、78、87 |
| 生氣 | 14、41、28、82、39、93、67、76 |
| 天醫 | 13、31、27、72、49、94、68、86 |
| 禍害 | 17、71、23、32、46、64、89、98 |
| 六煞 | 16、61、29、92、38、83、47、74 |
| 絕命 | 12、21、37、73、48、84、69、96 |
| 五鬼 | 18、81、24、42、36、63、79、97 |

啟動時規則資料必須驗證：

- 每類正好 8 組；
- 全表正好 64 組且不得重複；
- 不得含 0 或 5；
- 每組必須是二位數字字串。

磁場名稱與解讀屬近代民俗分類，不代表吉凶必然、健康、財富、事故或投資結果。

## 十、英數轉換與滑動配對

### 10.1 英文字母

民俗轉換採字母序：

```text
A=01, B=02, ... Z=26
```

保留前導 0。字母轉大寫，數字原樣保留。預設只略過空白與半形連字號；其他符號可選擇報錯或 `skip_all`。

每一個輸出數字必須保留：

- `outputIndex`
- `sourceIndex`
- `sourceCharacter`
- `normalizedCharacter`

此規則與台灣身分證官方字母區碼完全不同。

### 10.2 相鄰滑動

對正規化數字序列 `x0...xn` 建立：

```text
(x0,x1), (x1,x2), ... (x(n-1),xn)
```

每組回傳：

- `startIndex`、`endIndex`
- `rawPair`
- `basePair`
- 原始字元索引
- `fieldType` 或 `null`
- 修飾鏈
- 信心水準
- 可讀說明

不能跳著抓數字，也不能遺失原始索引。

## 十一、0 與 5

### `literal`

只建立原始相鄰組。含 0 或 5 的組合不在 64 組基本表，因此保持未分類，不跨越修飾數字。

### `bridge_modifier`

保留所有原始相鄰組；若結構為：

```text
基礎數字 + 一個以上 0／5 + 基礎數字
```

另建立一筆 bridge：

- 外側二數形成 `basePair`；
- 0 標記為「內隱／弱化」；
- 5 標記為「加強／顯化」；
- 多個 0／5 依原始順序保留；
- bridge 信心低於直接 64 組配對；
- 無左右基礎數字者標記 `unresolved`，不強行判定。

### `legacy_project`

舊站沒有 0／5 公式。含 0／5 者維持未分類並顯示警告。

## 十二、台灣身分證

### 12.1 正規化與遮罩

- 去除空白並轉大寫。
- 格式：`^[A-Z][12]\d{8}$`。
- 顯示與歷史紀錄只用遮罩，例如 `A12*****89`。

### 12.2 官方檢查碼

官方字母區碼：

```text
A10 B11 C12 D13 E14 F15 G16 H17 I34 J18 K19 L20 M21 N22
O35 P23 Q24 R25 S26 T27 U28 V29 W32 X30 Y31 Z33
```

將字母區碼拆成十位與個位，與身分證後九碼組成 11 位數，權重為：

```text
1,9,8,7,6,5,4,3,2,1,1
```

```text
checksumValid = weightedSum mod 10 == 0
```

格式或檢查碼未通過時，預設停止。若使用者明確勾選「仍要分析」，後續只視為自訂民俗序列，不代表有效身分證。

### 12.3 民俗轉換

通過格式判斷後，另以 A=01～Z=26 產生民俗序列，再進行滑動配對。官方區碼只供檢查碼，不得拿來代替 A=01。

## 十三、身分證人生階段

人生階段使用相鄰配對的原始順序。可選 profile：

| ID | 規則 |
| --- | --- |
| `uploaded_sheet_exact` | 教材原表：0–10、10–15、15–20、20–25、25–30、30–35、35–40、40–45、45–50、50–70、70–75 |
| `first_10_then_5` | 0–10，之後每 5 年，至 50–55；新版預設 |
| `first_13_then_5` | 0–13，之後每 5 年，至 53–58 |
| `cyclic_5_year` | 指定起訖年齡，每 5 年循環使用配對，標示輪次 |
| `legacy_project` | 舊站無公式，不產生時間軸 |

若區間數與配對數不同，必須：

- 保留所有區間；
- 無配對區間標示 `unmatched_interval`；
- 回傳數量不一致警告；
- 不得靜默截斷或自行補造配對。

## 十四、組合關係

目前只啟用「相鄰已分類磁場、順序不拘」模式：

- 天醫＋生氣
- 天醫＋延年
- 生氣＋延年
- 天醫＋絕命

結果採中性描述，不推論必然獲利、事故或危險。「前天、絕、後生」等原始簡寫因定義不足，保留為停用的 unresolved 規則。

## 十五、命格數

現有專案與使用者教材不足以證明命格數公式。正式輸出固定為：

```json
{
  "status": "unresolved",
  "label": "命格數：尚未設定演算規則",
  "sourceProfile": "destiny-number-unresolved"
}
```

在來源、公式與範例未經使用者確認前，不得以生命靈數、生日數或任何推測值代填。

## 十六、結構化輸出

應用層輸出 `AnalysisResult`，主要欄位：

```text
schemaVersion
id
inputType
maskedInput
normalizedInput（只供當次記憶體處理）
ruleSetId
ruleSet
calculationSteps
lifePathResult
birthdayNumberResult
birthGridResult
magneticFieldResult
timelineResult
personalYearResult
reportSections
warnings
disclaimer
createdAt
```

生日、通用序列與身分證是三個獨立應用入口，不得把缺少的模組結果偽裝成空白成功。

## 十七、儲存與隱私

設定儲存在：

```text
e-shidai-numerology-settings-v1
```

最多 20 筆歷史摘要儲存在：

```text
e-shidai-numerology-history-v1
```

歷史紀錄不得包含：

- `normalizedInput`
- 完整身分證
- 完整分析結構 `structuredResult`
- 可還原身分證的完整配對序列

只允許遮罩輸入、規則版本、非敏感摘要、主要磁場與建立時間。清除歷史必須是明確可執行操作。
