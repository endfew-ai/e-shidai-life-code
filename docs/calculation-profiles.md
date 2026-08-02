# 演算版本設定

## `classic-primary-v1`：古籍主法

- 互卦固定取本卦第 2 至 4 爻、第 3 至 5 爻。
- 4 至 10 字採人工確認的古代平上去入。
- 尺寸占採傳本文字的加時辰版本。
- 預設 UI 選項。

## `classic-variant-v1`：古本異文（未證異法）

- 純乾、純坤採「乾坤無互，互其變卦」。
- 尺寸占動爻預設不加時辰，但目前未找到足以證實此說的古本影證。
- 其他規則與古籍主法相同。

這個 profile 是為了相容使用需求而保留的流傳異法，不代表本次研究已證實它是古本。

## `modern-current-v1`：今本

- 互卦固定由本卦取得。
- 尺寸占動爻加入時辰。
- 使用版本化的現代曆法與筆畫 provider。

## `legacy-existing-v1`：原程式舊版

只代表實際存在的舊功能：

- 年月日時。
- 物數。
- 分段聲數。
- 11 至 100 字字數法。
- 時間長度拆分。
- 純乾、純坤改取變卦互卦。

原程式沒有姓名筆畫、單聲、1 至 10 字、丈尺尺寸、後天端法、現代三數或歷史錨點。現在不只 UI 阻擋，domain 層 `assertProfileSupportsMethod()` 也會拒絕把這些新增功能標成舊版。

### 能力限制

`supportedMethods` 是可執行限制，不是說明文字。梅花演算的 `legacy-existing-v1` 只允許：

| Method ID | 舊版能力 |
|---|---|
| `calendar` | 年月日時 |
| `object` | 物數 |
| `sound-segmented` | 分段聲數 |
| `text-count` | 11 至 100 字字數法 |

其他 Method ID 會在統一引擎進入計算前拋出錯誤。皇極的舊版時間長度拆分由獨立 `domain/huangji` 引擎保存，不列入上述梅花 Method ID 清單。

`classic-primary-v1`、`classic-variant-v1`、`modern-current-v1` 與未另設清單的使用者自訂 profile，`supportedMethods = null`，表示不以 legacy 白名單限制；這不代表每個方法都有古籍權威。公式來源仍以 method 自身的來源、假設與警告為準，例如現代三數仍只能標為現代算法。

## 使用者自訂

介面的「使用者自訂」可切換純乾坤互卦來源、尺寸是否加時及四至十字取數方式；純函式也接受自訂 profile 物件，至少保存：

```json
{
  "id": "user-custom-v1",
  "label": "使用者自訂",
  "pureHexagramMutual": "original",
  "sizeMovingIncludesHour": true,
  "textFourToTen": "tone",
  "supportedMethods": null
}
```

自訂 profile 只影響本次演算，不修改內建版本；結果會保存完整設定。需要縮小用途時可明列 `supportedMethods`，不可借 profile 名稱變更 method 的古籍／今法／現代來源界線。
