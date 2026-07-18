/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { getIChingText } from "../../iching-text.js";
import { lineNames } from "../../calculator-core.js";
import {
  calculateCalendarHexagram,
  calculateDoubleSoundHexagram,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  countHanCharacters,
  decomposeHuangjiYears,
  earthlyBranches,
  type HuangjiAnalysis,
  type KangjieAnalysis,
} from "../../kangjie-core.js";

type PageTab = "origins" | "meihua" | "huangji" | "sources";
type MethodTab = "calendar" | "object" | "sound" | "text";

function BrushTitle({ src, text, className = "" }: { src: string; text: string; className?: string }) {
  return <span className={`brush-title ${className}`.trim()}><span className="sr-only">{text}</span><img className="brush-title-image" src={src} alt="" aria-hidden="true" /></span>;
}

function BranchSelect({ name, label }: { name: string; label: string }) {
  return <label className="field-block"><span>{label}<small>子 1 至亥 12</small></span><select name={name} required defaultValue=""><option value="">請選{label}</option>{earthlyBranches.map((item) => <option value={item.value} key={item.value}>{item.name}・{item.value}</option>)}</select></label>;
}

function HexagramLines({ lines, movingIndex = -1, mark = "" }: { lines: number[]; movingIndex?: number; mark?: string }) {
  return <div className="hexagram-lines" aria-label="六爻卦象，畫面由上爻排列至初爻">{[5, 4, 3, 2, 1, 0].map((index) => <div className={`line-row${index === movingIndex ? " is-moving" : ""}`} key={index}><span>{lineNames[index]}</span><span className={`yao ${lines[index] === 1 ? "yang" : "yin"}`} aria-label={lines[index] === 1 ? "陽爻" : "陰爻"}><i />{lines[index] === 0 && <i />}</span><strong>{index === movingIndex ? mark : ""}</strong></div>)}</div>;
}

function HexagramCard({ label, value, movingIndex, mark }: { label: string; value: KangjieAnalysis["original"]; movingIndex?: number; mark?: string }) {
  const text = getIChingText(value.hexId);
  return <article className="hexagram-card"><header><div><p>{label}</p><h3><span>{text.symbol}</span>{value.name}</h3></div><small>第 {value.hexId} 卦</small></header><p>上{value.upper.name}（{value.upper.nature}）・下{value.lower.name}（{value.lower.nature}）</p><HexagramLines lines={value.lines} movingIndex={movingIndex} mark={mark} /></article>;
}

function KangjieResult({ result }: { result: KangjieAnalysis }) {
  const original = getIChingText(result.original.hexId);
  const transformed = getIChingText(result.transformed.hexId);
  const movingLine = original.lines[result.moving.index];
  return <section className="kangjie-calculation-result" aria-labelledby="react-kangjie-result-title">
    <header className="kangjie-result-heading"><div><p className="section-index">{result.methodLabel}</p><h2 id="react-kangjie-result-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-kangjie-result-v1.webp" text="衍算結果" className="brush-kangjie-result" /></h2><p className="result-input-summary">{result.inputSummary}</p></div><p className="moving-summary">動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p></header>
    <div className="hexagram-grid"><HexagramCard label="本卦" value={result.original} movingIndex={result.moving.index} mark="動" /><HexagramCard label={result.mutualSource === "transformed" ? "互卦・取自變卦" : "互卦"} value={result.mutual} /><HexagramCard label="變卦" value={result.transformed} movingIndex={result.moving.index} mark="變" /></div>
    <div className="kangjie-trace">{result.trace.map((item) => <div key={item.label}><span>{item.label}</span><code>{item.equation}</code></div>)}</div>
    <div className="body-use-ledger"><article><span>體卦</span><strong>{result.roles.body.symbol} {result.roles.body.name}</strong><small>{result.roles.body.nature}</small></article><article><span>用卦</span><strong>{result.roles.use.symbol} {result.roles.use.name}</strong><small>{result.roles.use.nature}</small></article><p>{result.roles.note}</p></div>
    <p className="iching-boundary">此處只依固定規則呈現卦象結構、體用位置與原文節錄，不產生事件預測或決策建議。除以 6 整除時歸上爻，是為完整表示六爻範圍採用的實作判定。</p>
    <details className="kangjie-classic-excerpt"><summary><strong>查看本卦原文節錄</strong><span>卦辭・象曰・動爻</span></summary><div><article><h4>{original.symbol} {original.name}・卦辭</h4><p>{original.judgment}</p></article><article><h4>象曰</h4><p>{original.image}</p></article><article className="is-moving-copy"><h4>{result.moving.name}・{movingLine.text}</h4><p>《象》曰：{movingLine.image}</p></article><article><h4>變卦 {transformed.symbol} {transformed.name}</h4><p>{transformed.judgment}</p></article><p className="classic-source">本文核對：<a href="https://ctext.org/book-of-changes/zh" target="_blank" rel="noreferrer">中國哲學書電子化計劃《周易》</a>。只列原文，不作吉凶解讀。</p></div></details>
  </section>;
}

function PageHeading({ index, src, title, children, source = false }: { index: string; src: string; title: string; children: React.ReactNode; source?: boolean }) {
  return <header className="kangjie-panel-heading"><div><p className="section-index">{index}</p><h2><BrushTitle src={src} text={title} className={`brush-kangjie-section${source ? " brush-kangjie-source" : ""}`} /></h2></div><p>{children}</p></header>;
}

export default function KangjiePage() {
  const [pageTab, setPageTab] = useState<PageTab>("origins");
  const [method, setMethod] = useState<MethodTab>("calendar");
  const [result, setResult] = useState<KangjieAnalysis | null>(null);
  const [huangji, setHuangji] = useState<HuangjiAnalysis | null>(null);
  const [message, setMessage] = useState("");
  const [textCount, setTextCount] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const huangjiRef = useRef<HTMLDivElement>(null);

  function reveal(ref: React.RefObject<HTMLDivElement | null>) {
    window.setTimeout(() => { ref.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); ref.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true }); }, 60);
  }

  function changePage(next: PageTab) { setPageTab(next); setMessage(""); }

  function handleMeihua(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const next = method === "calendar" ? calculateCalendarHexagram(values) : method === "object" ? calculateObjectHexagram(values) : method === "sound" ? calculateDoubleSoundHexagram(values) : calculateLongTextHexagram(values.text);
      setMessage(""); setResult(next); reveal(resultRef);
    } catch (error) { setResult(null); setMessage(error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。"); }
  }

  function handleHuangji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { const next = decomposeHuangjiYears(values.years); setMessage(""); setHuangji(next); reveal(huangjiRef); } catch (error) { setHuangji(null); setMessage(error instanceof Error ? error.message : "年數無法分解，請重新確認。"); }
  }

  const pageTabs: Array<[PageTab, string, string]> = [["origins", "壹", "原典脈絡"], ["meihua", "貳", "梅花起卦"], ["huangji", "參", "皇極尺度"], ["sources", "肆", "原文來源"]];
  const methodTabs: Array<[MethodTab, string]> = [["calendar", "年月日時"], ["object", "物數"], ["sound", "雙段聲數"], ["text", "十一字以上"]];

  return <main className="site-shell kangjie-shell">
    <nav className="topbar" aria-label="邵康節專頁導覽"><Link className="wordmark kangjie-wordmark" href="/"><span aria-hidden="true"><i>易</i></span><strong><BrushTitle src="/visuals/brush/title-kangjie-entry-v1.webp" text="邵康節易學" className="brush-brand" /></strong></Link><div><Link href="/">返回首頁</Link><button type="button" className="nav-button" onClick={() => changePage("meihua")}>開始衍算</button><button type="button" className="nav-button" onClick={() => changePage("sources")}>原文來源</button></div></nav>
    <header className="hero kangjie-hero" id="top"><img className="hero-art" src="/visuals/hero-celestial-background-v4.webp" alt="" aria-hidden="true" /><div className="kangjie-hero-copy"><p className="section-index">同網域獨立專頁・固定規則・本機運算</p><h1 className="hero-title kangjie-hero-title"><BrushTitle src="/visuals/brush/title-kangjie-hero-v1.webp" text="象數觀物" className="brush-kangjie-hero" /></h1><p>把現行本所載公式逐步展開。只算卦象結構與時間尺度，不生成吉凶斷語。</p></div><div className="hero-rail kangjie-rail"><p><strong><BrushTitle src="/visuals/brush/theme-kangjie-v1.webp" text="康節觀象" className="brush-kangjie-theme" /></strong><span>相傳邵雍所撰的現行傳本規則</span></p><p>梅花易數・皇極經世・完整算式可核對</p></div></header>
    <section className="kangjie-overview" aria-label="專頁功能摘要"><article><span>01</span><strong>四種起卦入口</strong><p>年月日時、物數、雙段聲數、十一字以上字數法互不混用。</p></article><article><span>02</span><strong>三層卦象</strong><p>固定呈現本卦、互卦、變卦、動爻與體用位置。</p></article><article><span>03</span><strong>五級時間尺度</strong><p>把任意年數拆成元、會、運、世、年，不套用爭議西元基準。</p></article></section>
    <section className="kangjie-workspace" id="workspace" aria-label="邵康節易學內容與衍算">
      <div className="kangjie-tabs" role="tablist" aria-label="專頁分頁">{pageTabs.map(([key, number, label]) => <button type="button" role="tab" aria-selected={pageTab === key} onClick={() => changePage(key)} key={key}><span>{number}</span>{label}</button>)}</div>

      {pageTab === "origins" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="傳本與方法邊界" src="/visuals/brush/title-kangjie-origins-v1.webp" title="原典脈絡">本頁依現行本《梅花易數》及《皇極經世書》整理。書目常署宋邵雍撰，也有資料採「相傳」；本頁不宣稱現行傳本全為邵雍親筆。</PageHeading><div className="origin-ledger"><article><span>先天數序</span><h3>乾一至坤八</h3><p>乾 1、兌 2、離 3、震 4、巽 5、坎 6、艮 7、坤 8。卦數整除 8 時歸坤。</p></article><article><span>年月日時</span><h3>傳統曆序手動輸入</h3><p>年支、農曆月、農曆日、時支各自取數。原典沒有公曆自動換算、閏月與換日規則。</p></article><article><span>物、聲、字</span><h3>每個入口各守其法</h3><p>可數之物、兩段聲數與十一字以上字數法分開，避免把任意號碼冒充通用古法。</p></article><article><span>皇極數制</span><h3>只做時間長度分解</h3><p>一世 30 年、一運 360 年、一會 10,800 年、一元 129,600 年。這是傳統數制，不是科學宇宙週期。</p></article></div><button className="primary-button panel-next" type="button" onClick={() => changePage("meihua")}>進入梅花起卦<span aria-hidden="true">↘</span></button></section>}

      {pageTab === "meihua" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="四個獨立入口" src="/visuals/brush/title-kangjie-meihua-v1.webp" title="梅花起卦">請先選方法，再輸入該方法真正需要的數。所有資料只留在目前瀏覽器頁面，不儲存、不上傳。</PageHeading><div className="method-selector" role="tablist" aria-label="梅花起卦方法">{methodTabs.map(([key, label]) => <button type="button" role="tab" aria-selected={method === key} onClick={() => { setMethod(key); setResult(null); setMessage(""); }} key={key}>{label}</button>)}</div><div className="method-forms"><form className="kangjie-form" onSubmit={handleMeihua} noValidate><div className="form-intro"><div><span>{method === "sound" ? "原典明確驗例" : method === "text" ? "原典限定範圍" : "原典公式"}</span><h3>{method === "calendar" ? "年月日時起例" : method === "object" ? "物數起例" : method === "sound" ? "雙段敲聲法" : "十一字以上字數法"}</h3></div><p>{method === "calendar" ? "年支加農曆月日取上卦，再加時支取下卦與動爻。" : method === "object" ? "可數之物作上卦，時支配作下卦，兩數合計取動爻。" : method === "sound" ? "第一段聲數作上卦、第二段聲數作下卦，再加時支取動爻。" : "十一至一百字不用平仄，只依字數少分上卦、多分下卦。"}</p></div>
        {method === "calendar" && <div className="quad-input-grid"><BranchSelect name="yearBranch" label="年支" /><label className="field-block"><span>農曆月<small>正月為 1</small></span><input name="lunarMonth" type="number" inputMode="numeric" min="1" max="12" placeholder="1 至 12" required /></label><label className="field-block"><span>農曆日<small>初一為 1</small></span><input name="lunarDay" type="number" inputMode="numeric" min="1" max="30" placeholder="1 至 30" required /></label><BranchSelect name="hourBranch" label="時支" /></div>}
        {method === "object" && <div className="dual-input-grid"><label className="field-block"><span>可數之物數量<small>大於 0 的整數</small></span><input name="count" type="text" inputMode="numeric" placeholder="例如：8" required /></label><BranchSelect name="hourBranch" label="時支" /></div>}
        {method === "sound" && <div className="triple-input-grid"><label className="field-block"><span>第一段聲數<small>大於 0 的整數</small></span><input name="firstCount" type="text" inputMode="numeric" placeholder="例如：1" required /></label><label className="field-block"><span>第二段聲數<small>大於 0 的整數</small></span><input name="secondCount" type="text" inputMode="numeric" placeholder="例如：5" required /></label><BranchSelect name="hourBranch" label="時支" /></div>}
        {method === "text" && <label className="field-block text-field"><span>輸入 11 至 100 個漢字<small>空格、標點、數字與符號不計</small></span><textarea name="text" rows={4} placeholder="例如：天地定位山澤通氣雷風相薄" onChange={(event) => setTextCount(countHanCharacters(event.target.value))} required /><output>已計 {textCount} 個漢字</output></label>}
        <p className="form-note">{method === "calendar" ? "請自行確認農曆值。閏月、子初換日與年界需要依採用曆法另行核對。" : method === "text" ? "四至十字在原典另涉及古代平上去入聲調，本頁不以現代讀音自動代算。" : "每種起卦入口各守其法，不與生日命碼或任意號碼混用。"}</p><p className="form-message" role="alert" aria-live="polite">{message}</p><button className="primary-button" type="submit">開始固定衍算<span aria-hidden="true">↘</span></button></form></div><div ref={resultRef} className="kangjie-result-anchor">{result && <KangjieResult result={result} />}</div></section>}

      {pageTab === "huangji" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="元・會・運・世・年" src="/visuals/brush/title-kangjie-huangji-v1.webp" title="皇極尺度">這裡只把一段時間長度依固定倍率拆解，不把現代西元年對讀成唯一正統位置，也不產生預言。</PageHeading><div className="huangji-scale"><article><span>世</span><strong>30</strong><small>年</small></article><article><span>運</span><strong>360</strong><small>年・12 世</small></article><article><span>會</span><strong>10,800</strong><small>年・30 運</small></article><article><span>元</span><strong>129,600</strong><small>年・12 會</small></article></div><form className="huangji-form" onSubmit={handleHuangji} noValidate><label className="field-block"><span>要分解的時間長度<small>輸入大於 0 的完整年數</small></span><input name="years" type="text" inputMode="numeric" placeholder="例如：130000" required /></label><p className="form-message" role="alert" aria-live="polite">{message}</p><button className="primary-button" type="submit">分解元會運世<span aria-hidden="true">↘</span></button></form><div ref={huangjiRef} className="huangji-result-anchor">{huangji && <section className="huangji-calculation-result"><p className="section-index">時間長度 {huangji.totalYears} 年</p><h2 tabIndex={-1}><BrushTitle src="/visuals/brush/title-kangjie-result-v1.webp" text="衍算結果" className="brush-kangjie-result" /></h2><div className="huangji-output-grid">{[["元", huangji.units.yuan], ["會", huangji.units.hui], ["運", huangji.units.yun], ["世", huangji.units.shi], ["餘年", huangji.units.years]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><code className="huangji-equation">{huangji.equation}</code><p className="iching-boundary">這是時間長度的單位換算，不是西元紀年定位、天文週期證明或事件預言。</p></section>}</div></section>}

      {pageTab === "sources" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="可回到原文逐條核對" src="/visuals/brush/title-kangjie-source-v1.webp" title="原文與來源" source>來源連結直達電子古籍或館藏影像。本頁只節錄方法，不大量複製電子轉錄全文。</PageHeading><div className="source-ledger">{[["梅花易數・卷一", "卦數、年月日時、物數、聲數、字數公式", "https://ctext.org/wiki.pl?chapter=867487&if=en&remap=gb"], ["梅花易數・卷二", "體用、生剋、占法界線與不動不占", "https://ctext.org/wiki.pl?chapter=475043&if=en&remap=gb"], ["周易", "六十四卦名與卦爻辭核對", "https://ctext.org/book-of-changes/zh"], ["皇極經世書・卷一", "元會運世表與固定數制", "https://www.kanripo.org/text/KR3g0005/001"], ["觀物篇六十", "元、會、運、世的層級關係", "https://ctext.org/wiki.pl?chapter=404769&if=gb"]].map(([title, note, href]) => <a href={href} target="_blank" rel="noreferrer" key={title}><span>{title}</span><strong>{note}</strong><small>開啟原文 ↗</small></a>)}</div><aside className="kangjie-boundary"><span aria-hidden="true">※</span><div><h2><BrushTitle src="/visuals/brush/title-kangjie-boundary-v1.webp" text="推演界線" className="brush-kangjie-boundary" /></h2><p>本工具依現行傳本製作，供傳統文化研究、演算核對與娛樂。它不是科學預測，不主張唯一正統，也不作醫療、法律、投資、工作、人事或重大人生決策依據。</p></div></aside></section>}
    </section>
    <footer><p>© 2026 e世代生命密碼・邵康節易學專頁</p><p>同一網址體系，自動適配手機與電腦</p></footer>
  </main>;
}
