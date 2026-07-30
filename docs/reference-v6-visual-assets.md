# Reference v6 三數取卦感應儀模塊

本版補齊使用者手機範本中三數取卦輸入區的三枚獨立物件層。數字、上卦／下卦／動爻標籤及演算規則仍由 HTML 與程式碼即時呈現，AI 圖只負責材質、輪廓與儀器感，避免圖片內出現錯字或固定卦象。

## 正式資產

| 檔案 | 用途 | 尺寸 | 位元組 | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `public/visuals/ai-dashboard/reference-v6/iching-sensor-upper-v6.webp` | 第一數／上卦感應儀 | 384×384 | 25,244 | `3F270B166D6AF120E09795EBBF3101D5B981AAD707A9AC0330C398749F7B7936` |
| `public/visuals/ai-dashboard/reference-v6/iching-sensor-lower-v6.webp` | 第二數／下卦感應儀 | 384×384 | 24,768 | `D105F776F80E76B1FA22B16210D64124DE051DDFA999A838821740A14AB14D64` |
| `public/visuals/ai-dashboard/reference-v6/iching-sensor-moving-v6.webp` | 第三數／動爻感應儀 | 384×384 | 30,598 | `E9D6D31294F41B4536A5F482D78EF72AF8729113681CF079B2F9C90B873A73DB` |

正式 WebP 由 ImageGen 原始 PNG 以 Lanczos 縮放至 384×384，WebP 品質 84。原始生成檔保留於：

| 用途 | ImageGen 原始 PNG | 尺寸 | 位元組 | SHA-256 |
| --- | --- | ---: | ---: | --- |
| 第一數／上卦 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\exec-26b5410e-169b-4c7e-9034-d64bcab014d8.png` | 1254×1254 | 2,462,574 | `81B9181403CD64332AFB83018A02797D6A2992365C347362B52D7D6993C2DD3F` |
| 第二數／下卦 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\exec-285d692b-e03d-4ea2-b04f-81fc3c8f6b81.png` | 1254×1254 | 2,669,884 | `DA853491019D6F3D546DE57AEAFEB5AC60B4BD3D90D80854BB0974EC3D8220AB` |
| 第三數／動爻 | `C:\Users\Hung\.codex\generated_images\019f6ddd-80b7-77b3-8c43-bf9970819ab8\exec-cfd706a5-b3bc-475d-9c11-066d896adc8c.png` | 1254×1254 | 2,785,164 | `4FCF81B2B27098AE90FB1E80CEA0C10A895DD678947DA983494DBCC75BCCF501` |

## 提示詞設計

三張圖分別使用獨立提示詞生成，並共同參考：

1. 使用者手機範本：黑漆、古金、雕刻框與大型感應物件的材質方向。
2. Reference v5 八功能物件：本站既有暗玉、古銅、低亮青綠點光的設計系統。

共同限制：

- 正面正交視角、博物館級古儀器 3D 浮雕。
- 每張只保留一件主要物件，縮至 42～88px 仍能靠輪廓辨識。
- 上卦為高架天穹儀、下卦為山水基座儀、動爻為偏心旋轉樞軸。
- 禁止文字、中文字、英文字、數字、八卦、六十四卦、陰陽圖、假輸入框、浮水印與標誌。
- 禁止三張共用同一枚硬幣模板，只靠換色區分。

完整提示詞由本次 ImageGen 工具呼叫保留於工作紀錄；三張圖皆使用內建 ImageGen 模式生成。
