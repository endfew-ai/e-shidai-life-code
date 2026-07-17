"use client";

import { FormEvent, useRef, useState } from "react";

type LifeProfile = {
  title: string;
  symbol: string;
  traits: string;
  shadow: string;
  wellbeing: string;
  color: string;
  hex: string;
  marker: string;
  markerDesc: string;
  advice: string;
};

const profiles: Record<number, LifeProfile> = {
  1: {
    title: "領導與獨立",
    symbol: "陽性力量之源 · 開創與自主",
    traits:
      "具備強烈的開創力與帶動力，重視自主與決策空間。當目標明確時，往往能率先行動並帶領他人前進。",
    shadow:
      "壓力下容易固守自己的判斷，把不同意見解讀成阻礙。若能先聽完再決定，會更容易保有影響力與人際連結。",
    wellbeing:
      "緊繃時可留意消化與作息狀態，安排規律進食、休息與放鬆。若有持續不適，請尋求合格醫療專業協助。",
    color: "赤紅",
    hex: "#ef5350",
    marker: "先照我的方法做",
    markerDesc: "以快速決策維持掌控感，也可能讓別人來不及表達。",
    advice:
      "把接納建議視為擴充選項，而不是失去主導權。先定方向，再邀請一個不同觀點，決策會更完整。",
  },
  2: {
    title: "配合與連結",
    symbol: "共生之力 · 關聯與協調",
    traits:
      "擅長察言觀色、協調關係與照顧氣氛。對合作品質敏感，常能看見別人的需要與未說出口的訊息。",
    shadow:
      "為了維持和諧，可能壓下真實感受或過度迎合。長期下來容易累積委屈，也讓他人難以理解你的界線。",
    wellbeing:
      "情緒壓力增加時，可練習深呼吸、散步與說出需要。若身體不適持續，請交由合格醫療專業判斷。",
    color: "暖橙",
    hex: "#ff8a3d",
    marker: "好，都聽你的",
    markerDesc: "用配合換取安全感，有時會把自己的意見藏起來。",
    advice:
      "先從低風險的小事表達偏好，例如「我比較希望……」。溫和但清楚的界線，反而能讓關係更穩定。",
  },
  3: {
    title: "創意與表達",
    symbol: "赤子之心 · 靈感與感性",
    traits:
      "感受力與創意豐富，擅長把抽象想法轉成有感染力的表達。安全自在時，幽默、直接且充滿活力。",
    shadow:
      "遇到批評時可能迅速防禦、轉移話題或封閉自己。情緒來得快，也容易讓原本有價值的回饋被擋在門外。",
    wellbeing:
      "用腦過度或情緒起伏大時，可留意休息、補水與螢幕使用時間。持續疼痛或不適請諮詢醫療專業。",
    color: "明黃",
    hex: "#f5c451",
    marker: "我知道",
    markerDesc: "快速結束回饋，保護內在敏感與自尊。",
    advice:
      "先把回饋記下來，不急著同意或反駁。隔一段時間再挑出一個可試驗的部分，創意會更容易落地。",
  },
  4: {
    title: "穩定與秩序",
    symbol: "四方成形 · 結構與安全",
    traits:
      "重視可驗證的經驗、流程與穩定性，擅長整理資源、建立秩序並守住品質，是值得信賴的執行者。",
    shadow:
      "面對未知變動時容易過度評估風險，甚至因害怕重來而停在原地。太早否定改變，可能錯過更好的做法。",
    wellbeing:
      "高警覺時可留意睡眠與放鬆品質，建立固定睡前流程。若長期失眠，請向醫療專業尋求協助。",
    color: "青綠",
    hex: "#48c78e",
    marker: "真的要做嗎？",
    markerDesc: "透過反覆確認延緩不可控的變動。",
    advice:
      "把改變切成可回復的小步驟，先試一次、保留退路再評估。可控的實驗，比一次全面改動更適合你。",
  },
  5: {
    title: "自由與溝通",
    symbol: "流動之口 · 冒險與多樣",
    traits:
      "喜歡自由、多樣與新鮮感，對人事物反應快，通常具備良好口才與說服力，能為環境帶來動能。",
    shadow:
      "害怕承諾縮小可能性，容易延後決定或保留過多退路。當選項太多時，反而可能焦慮與分心。",
    wellbeing:
      "忙碌或頻繁說話時，可留意呼吸、喉部休息與補水。若不適反覆出現，請諮詢合格醫療專業。",
    color: "澄藍",
    hex: "#4f9cf9",
    marker: "再看看吧",
    markerDesc: "保留彈性與撤退空間，避免太快被承諾綁住。",
    advice:
      "給選擇加上期限，只承諾下一個具體步驟。自由不必等於無限延後，清楚的邊界也能保留彈性。",
  },
  6: {
    title: "奉獻與關懷",
    symbol: "療癒之心 · 照顧與責任",
    traits:
      "同理心強，願意照顧他人並承擔責任。常是團隊中的穩定力量，能讓人感受到支持與被理解。",
    shadow:
      "容易把別人的問題變成自己的責任，也可能因難以拒絕而過度消耗。照顧若沒有界線，會逐漸變成負擔。",
    wellbeing:
      "承擔過多時，可留意肩頸緊繃與休息不足，安排伸展與獨處時間。持續不適請尋求醫療協助。",
    color: "靛青",
    hex: "#7477e8",
    marker: "沒關係，我來就好",
    markerDesc: "以代勞確認自己的價值，也可能讓責任分配失衡。",
    advice:
      "在答應前先停十秒，確認「這真的是我的責任嗎？」。適度拒絕不是冷漠，而是讓關懷得以長久。",
  },
  7: {
    title: "分析與洞察",
    symbol: "探究之眼 · 邏輯與直覺",
    traits:
      "分析力強、對細節與資料敏感，喜歡追根究柢。能從線索中發現規律，也常有精準的直覺判斷。",
    shadow:
      "過度懷疑時容易反覆查證、難以信任，最後因想得太多而延遲行動。完美資訊往往不存在。",
    wellbeing:
      "思緒停不下來時，可透過規律運動與書寫讓注意力回到當下。若焦慮影響生活，請尋求專業協助。",
    color: "暮紫",
    hex: "#a675e5",
    marker: "真的嗎？",
    markerDesc: "以質疑確認可靠性，也可能讓交流變成持續考驗。",
    advice:
      "先定義「足夠的證據」與決策期限。把小型行動當成新的資料來源，能讓分析與實踐形成循環。",
  },
  8: {
    title: "權能與實踐",
    symbol: "資源之輪 · 成果與影響",
    traits:
      "對數字、資源與成果敏銳，具備強烈執行力與商業判斷。能把抽象目標轉成可衡量的進度。",
    shadow:
      "壓力下容易用投入產出衡量所有關係，讓人感到距離或功利。只看效率時，可能忽略長期信任。",
    wellbeing:
      "長期高速運轉時，可留意心情、睡眠與身體壓力訊號。任何持續或急性不適都應由醫療專業評估。",
    color: "玫紅",
    hex: "#e85b9c",
    marker: "這能帶來什麼成果？",
    markerDesc: "以效益過濾資訊，快速保護時間與資源。",
    advice:
      "在成果指標之外，加上一項關係或永續指標。真正穩固的影響力，來自效率與信任同時累積。",
  },
  9: {
    title: "理想與服務",
    symbol: "遠方之光 · 願景與共好",
    traits:
      "視野宏觀、富使命感，容易看見更大的可能性。願意服務群體，也能以願景鼓舞身邊的人。",
    shadow:
      "理想過大時，可能低估執行細節或先答應再評估。若願景沒有下一步，就容易停留在想像。",
    wellbeing:
      "投入理想時也要保留規律飲食、睡眠與休息。身體狀況若有異常，請以合格醫療專業意見為準。",
    color: "鎏金",
    hex: "#e6b74e",
    marker: "沒問題",
    markerDesc: "先用承諾回應期待，之後才處理可行性。",
    advice:
      "把願景縮成七天內能完成的一件事，並寫下負責人與期限。每一個落地步驟，都在替理想增加可信度。",
  },
};

function calculateLifeNumber(value: string) {
  const digits = value.match(/\d/g)?.map(Number) ?? [];
  if (digits.length === 0) return 0;

  let sum = digits.reduce((total, digit) => total + digit, 0);
  while (sum > 9) {
    sum = String(sum)
      .split("")
      .reduce((total, digit) => total + Number(digit), 0);
  }
  return sum;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const resultRef = useRef<HTMLElement>(null);

  const profile = activeNumber ? profiles[activeNumber] : null;

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = calculateLifeNumber(input);

    if (!number) {
      setActiveNumber(null);
      setMessage("請至少輸入一個 1–9 的數字再進行分析。只輸入 0 無法產生結果。");
      return;
    }

    setMessage("");
    setActiveNumber(number);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function handleReset() {
    setInput("");
    setActiveNumber(null);
    setMessage("");
  }

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="hero">
        <div className="brand-mark" aria-hidden="true">
          <span>易</span>
        </div>
        <p className="eyebrow">I CHING · NUMEROLOGY · SELF REFLECTION</p>
        <h1>
          e世代<span>生命密碼</span>分析儀
        </h1>
        <p className="hero-copy">以數字收斂為起點，閱讀你的行動慣性、溝通模式與成長提醒。</p>
        <div className="hero-note" role="note">
          <span className="note-dot" aria-hidden="true" />
          所有計算只在你的瀏覽器內完成，不儲存、不傳送輸入內容。
        </div>
      </header>

      <section className="analyzer-card" aria-labelledby="analyzer-title">
        <div className="analyzer-heading">
          <div>
            <p className="section-kicker">開始分析</p>
            <h2 id="analyzer-title">輸入一組對你有意義的數字</h2>
          </div>
          <span className="step-badge">01</span>
        </div>

        <form onSubmit={handleAnalyze} noValidate>
          <label htmlFor="number-code">數字符碼</label>
          <div className="input-row">
            <input
              id="number-code"
              name="number-code"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={40}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：19950102"
              aria-describedby="input-help input-message"
            />
            <button type="submit" className="primary-button">
              解碼核心特質
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="form-meta">
            <p id="input-help">可輸入生日、手機末碼或自訂數字；為保護隱私，請勿輸入完整身分證號。</p>
            {input && (
              <button type="button" className="text-button" onClick={handleReset}>
                清除
              </button>
            )}
          </div>
          <p id="input-message" className="form-message" role="alert" aria-live="polite">
            {message}
          </p>
        </form>

        <div className="method-strip" aria-label="分析流程">
          <span>提取數字</span>
          <i aria-hidden="true" />
          <span>逐位加總</span>
          <i aria-hidden="true" />
          <span>收斂至 1–9</span>
          <i aria-hidden="true" />
          <span>對照特質</span>
        </div>
      </section>

      {profile && activeNumber && (
        <section
          className="results"
          ref={resultRef}
          aria-labelledby="result-title"
          aria-live="polite"
          style={{ "--profile-color": profile.hex } as React.CSSProperties}
        >
          <div className="result-hero">
            <div className="number-orbit" aria-hidden="true">
              <span>{activeNumber}</span>
            </div>
            <div className="result-heading">
              <p className="section-kicker">你的核心原型</p>
              <h2 id="result-title">{profile.title}</h2>
              <p>{profile.symbol}</p>
            </div>
            <div className="energy-color">
              <span style={{ backgroundColor: profile.hex }} aria-hidden="true" />
              <div>
                <small>能量共振色</small>
                <strong>{profile.color}</strong>
              </div>
            </div>
          </div>

          <div className="insight-grid">
            <article
              className="insight-card ai-module-card core-module"
              style={{ "--module-image": "url('/ai-modules/core-orbit.webp')" } as React.CSSProperties}
            >
              <span className="card-index">A</span>
              <p className="card-label">CORE PATTERN</p>
              <h3>核心人格特質</h3>
              <p>{profile.traits}</p>
            </article>
            <article
              className="insight-card ai-module-card shadow-card shadow-module"
              style={{ "--module-image": "url('/ai-modules/shadow-prism.webp')" } as React.CSSProperties}
            >
              <span className="card-index">B</span>
              <p className="card-label">BLIND SPOT</p>
              <h3>壓力下的盲點</h3>
              <p>{profile.shadow}</p>
            </article>
            <article
              className="insight-card ai-module-card wellbeing-module"
              style={{ "--module-image": "url('/ai-modules/wellbeing-flow.webp')" } as React.CSSProperties}
            >
              <span className="card-index">C</span>
              <p className="card-label">WELLBEING</p>
              <h3>身心照顧提醒</h3>
              <p>{profile.wellbeing}</p>
            </article>
            <article
              className="insight-card ai-module-card language-card language-module"
              style={{ "--module-image": "url('/ai-modules/language-signal.webp')" } as React.CSSProperties}
            >
              <span className="card-index">D</span>
              <p className="card-label">LANGUAGE MARKER</p>
              <h3>常見防禦語句</h3>
              <blockquote>「{profile.marker}」</blockquote>
              <p>{profile.markerDesc}</p>
            </article>
          </div>

          <article className="advice-card">
            <div className="advice-symbol" aria-hidden="true">策</div>
            <div>
              <p className="section-kicker">本次行動建議</p>
              <h3>讓洞察成為下一步</h3>
              <p>{profile.advice}</p>
            </div>
          </article>

          <div className="result-actions">
            <button type="button" className="secondary-button" onClick={handleReset}>
              重新分析另一組數字
            </button>
          </div>
        </section>
      )}

      <section className="disclaimer" aria-labelledby="disclaimer-title">
        <span aria-hidden="true">※</span>
        <div>
          <h2 id="disclaimer-title">使用提醒</h2>
          <p>
            本工具內容屬文化娛樂與自我反思用途，不是科學測驗、醫療診斷、心理評估或專業建議。重要的健康、財務、工作或關係決定，請依實際情況並諮詢合格專業人士。
          </p>
        </div>
      </section>

      <footer>
        <p>© {new Date().getFullYear()} e世代生命密碼研究中心</p>
        <p>易經河洛意象 × 數字原型 × 自我覺察</p>
      </footer>
    </main>
  );
}
