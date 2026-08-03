/* eslint-disable @next/next/no-img-element */
import type { LineCorrespondenceAnalysis, LineCorrespondenceRow } from "../../kangjie-core.js";

function TimeCell({ row }: { row: LineCorrespondenceRow }) {
  return <div className="line-correspondence-cell is-time" data-label="時間" data-evidence-tier={row.time.sourceTier} role="cell"><div><b className="line-evidence-badge">現代等分</b><strong>現代均分・{row.time.relative}</strong><small>{row.time.percent}・非古籍應期法</small></div><ul className="line-time-presets">{row.time.presets.map((preset) => <li key={preset.id}><span>{preset.label}</span><b>{preset.span}</b></li>)}</ul></div>;
}

function CopyCell({ label, primary, secondary, tier, tierLabel, className = "" }: { label: string; primary: string; secondary: string; tier: string; tierLabel: string; className?: string }) {
  return <div className={`line-correspondence-cell ${className}`.trim()} data-label={label} data-evidence-tier={tier} role="cell"><b className="line-evidence-badge">{tierLabel}</b><strong>{primary}</strong><small>{secondary}</small></div>;
}

export function LineCorrespondencePanel({ analysis }: { analysis: LineCorrespondenceAnalysis }) {
  const active = analysis.active;
  const titleId = `line-correspondence-title-${active.position}`;
  return <section className="line-correspondence-panel" data-line-correspondence={analysis.version} aria-labelledby={titleId}>
    <header className="line-correspondence-heading"><div><p className="section-index">六爻層位・本次動爻 {active.lineName}</p><h3 className="line-correspondence-title" id={titleId}><img className="brush-title-image line-correspondence-title-mark" src="/visuals/marks/line-correspondence-v19.svg" alt="" aria-hidden="true" /><span>時序・身體・職位・家宅</span></h3></div><p className="line-correspondence-boundary">古典爻位、後世類象與現代等分時間分層顯示，不直接推成吉凶或疾病。</p></header>
    <div className="line-correspondence-active" aria-label={`${active.lineName}四項對應摘要`}>
      <article data-evidence-tier={active.time.sourceTier}><div className="line-evidence-meta"><span>時間</span><b className="line-evidence-badge">現代等分</b></div><strong>{active.time.relative}</strong><small>現代均分・{active.classicStage}・非古籍應期法</small></article>
      <article data-evidence-tier={active.evidence.body.tier}><div className="line-evidence-meta"><span>身體類象</span><b className="line-evidence-badge">後世類象</b></div><strong>{active.body.label}</strong><small>後世術數類象・非醫療診斷</small></article>
      <article data-evidence-tier="later-divination-analogy modern-analogy"><div className="line-evidence-meta"><span>職位</span><b className="line-evidence-badge">後世＋現代</b></div><strong>{active.occupation.laterDivination}</strong><small>後世官祿古例；現代生涯類比：{active.occupation.modernAnalogy}</small></article>
      <article data-evidence-tier={active.evidence.houseMapping.tier}><div className="line-evidence-meta"><span>家宅</span><b className="line-evidence-badge">後世類象</b></div><strong>{active.house.label}</strong><small>{active.house.zone}・不可直接判吉凶</small></article>
    </div>
    <details className="line-correspondence-details">
      <summary><span><strong>展開六爻完整對照</strong><small>上爻至初爻，四類一次核對</small></span><b aria-hidden="true">＋</b></summary>
      <details className="line-correspondence-sources"><summary>來源與使用界線</summary><div><ul>{analysis.notices.map((notice) => <li key={notice}>{notice}</li>)}</ul><div className="line-correspondence-source-links">{analysis.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><strong>{source.title}</strong><small>{source.organization}・{source.scope}</small></a>)}</div></div></details>
      <div className="line-correspondence-table" role="table" aria-label="六爻時間、身體、職位與家宅完整對照">
        <div className="line-correspondence-labels" role="row">{["爻位", "時間", "身體", "職位", "家宅"].map((label) => <span role="columnheader" key={label}>{label}</span>)}</div>
        {[...analysis.rows].reverse().map((row) => <article className={`line-correspondence-row${row.isMoving ? " is-active" : ""}`} data-line-position={row.position} role="row" aria-current={row.isMoving ? "true" : undefined} key={row.position}>
          <div className="line-correspondence-position" data-label="爻位" data-evidence-tier={row.evidence.stage.tier} role="cell"><b className="line-evidence-badge">古典爻位摘要</b><strong>{row.lineName}</strong><span>{row.classicStage}</span><small>{row.stageDetail}</small>{row.isMoving && <em>本次動爻</em>}</div>
          <TimeCell row={row} />
          <CopyCell label="身體" primary={row.body.label} secondary={`${row.body.detail} 非醫療診斷。`} tier={row.evidence.body.tier} tierLabel="後世類象" className="is-body" />
          <CopyCell label="職位" primary={`後世官祿古例：${row.occupation.laterDivination}`} secondary={`現代生涯類比：${row.occupation.modernAnalogy}`} tier="later-divination-analogy modern-analogy" tierLabel="後世＋現代" className="is-occupation" />
          <CopyCell label="家宅" primary={row.house.label} secondary={`${row.house.zone}・不可直接判吉凶`} tier={row.evidence.houseMapping.tier} tierLabel="後世類象" className="is-house" />
        </article>)}
      </div>
    </details>
  </section>;
}
