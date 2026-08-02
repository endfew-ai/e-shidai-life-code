const candidateRows = [
  [1, "乾", ["天", "父", "老人", "官", "官貴", "頭", "骨", "馬", "金", "金寶", "珠", "玉", "水果", "圓", "圓物", "冠", "鏡", "剛物", "大赤", "水寒"]],
  [2, "兌", ["澤", "少女", "巫", "舌", "妾", "肺", "羊", "毀折", "帶口", "缺口", "金屬", "廢缺", "奴僕", "婢"]],
  [3, "離", ["火", "雉", "日", "目", "電", "霓", "霞", "中女", "甲冑", "戈兵", "文書", "槁木", "爐", "獸", "鱷", "龜", "蟹", "蚌", "有殼", "紅", "赤", "紫", "花", "文人", "乾燥"]],
  [4, "震", ["雷", "長男", "足", "髮", "龍", "蟲", "蹄", "竹", "萑葦", "馬鳴", "稼", "樂器", "草木", "青", "碧", "綠", "樹", "木核", "柴", "蛇"]],
  [5, "巽", ["風", "長女", "僧", "尼", "雞", "股", "禽", "百草", "臼", "香", "臭", "繩", "眼", "羽毛", "帆", "扇", "枝葉", "仙道", "工匠", "直物", "工巧"]],
  [6, "坎", ["水", "雨", "雪", "工", "豬", "豕", "中男", "溝", "瀆", "弓", "輪", "耳", "血", "月", "盜", "宮律", "棟", "棘", "狐", "蒺藜", "桎梏", "水族", "魚", "鹽", "酒", "醢", "有核", "黑"]],
  [7, "艮", ["山", "土", "少男", "童子", "狗", "手", "手指", "徑路", "門", "門闕", "果", "蓏", "閽寺", "鼠", "虎", "狐", "黔喙", "木生", "藤生", "爪", "鼻", "黃"]],
  [8, "坤", ["地", "母", "老婦", "土", "牛", "金", "布", "布帛", "文章", "輿", "方", "方物", "柄", "黃", "瓦", "瓦器", "腹", "裳", "黑", "黍", "稷", "書", "米", "穀"]],
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
      score: row.keywords.reduce((score, keyword) => score + (description.includes(keyword) ? Math.max(1, keyword.length) : 0), 0),
    }))
    .filter((row) => row.matches.length)
    .sort((left, right) => right.score - left.score || right.matches.length - left.matches.length || left.trigramId - right.trigramId);
}
