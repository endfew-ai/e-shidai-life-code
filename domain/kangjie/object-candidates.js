const candidateRows = [
  [1, "乾", ["天", "父", "老人", "官", "頭", "骨", "馬", "金", "玉", "圓物", "鏡"]],
  [2, "兌", ["澤", "少女", "口", "舌", "羊", "缺口器", "毀折物", "金屬"]],
  [3, "離", ["火", "日", "目", "電", "花", "文書", "爐", "有殼物", "紅色"]],
  [4, "震", ["雷", "長男", "足", "龍", "樂器", "竹", "樹", "柴", "青綠色"]],
  [5, "巽", ["風", "長女", "雞", "繩", "羽毛", "帆", "扇", "枝葉", "工巧器"]],
  [6, "坎", ["水", "雨", "雪", "豬", "耳", "血", "月", "魚", "酒", "黑色"]],
  [7, "艮", ["山", "少男", "童子", "狗", "手", "門", "果", "鼠", "虎", "黃色"]],
  [8, "坤", ["地", "母", "老婦", "土", "牛", "布", "方物", "瓦器", "書", "米"]],
];

export const objectTrigramCandidates = Object.freeze(candidateRows.map(([trigramId, trigram, keywords]) => Object.freeze({
  trigramId,
  trigram,
  keywords: Object.freeze(keywords),
})));

export function findObjectTrigramCandidates(rawDescription) {
  const description = String(rawDescription ?? "").trim();
  if (!description) return [];
  return objectTrigramCandidates
    .map((row) => ({
      ...row,
      matches: row.keywords.filter((keyword) => description.includes(keyword)),
    }))
    .filter((row) => row.matches.length)
    .sort((left, right) => right.matches.length - left.matches.length || left.trigramId - right.trigramId);
}
