export type JingFangStageId = "base" | "first" | "second" | "third" | "fourth" | "fifth" | "wandering" | "returning";

export type JingFangStage = Readonly<{
  id: JingFangStageId;
  label: string;
  heading: string;
  changedLineIndexes: readonly number[];
}>;

export type JingFangPalaceDefinition = Readonly<{
  trigramId: number;
  palace: string;
  trigram: string;
  element: "金" | "木" | "水" | "火" | "土";
}>;

export type JingFangPalaceEntry = Readonly<{
  upperId: number;
  lowerId: number;
  hexId: number;
  name: string;
  symbol: string;
  palace: string;
  palaceTrigram: string;
  element: "金" | "木" | "水" | "火" | "土";
  stageId: JingFangStageId;
  stage: string;
  stageIndex: number;
  lines: readonly (0 | 1)[];
}>;

export type JingFangPalaceRow = JingFangPalaceDefinition & Readonly<{
  entries: readonly JingFangPalaceEntry[];
}>;

export type JingFangSource = Readonly<{
  id: string;
  title: string;
  organization: string;
  url: string;
  scope: string;
}>;

export const JINGFANG_STAGES: readonly JingFangStage[];
export const JINGFANG_PALACES: readonly JingFangPalaceDefinition[];
export const JINGFANG_SOURCE_ORDER: readonly string[];
export const JINGFANG_EIGHT_PALACES: readonly JingFangPalaceRow[];
export const JINGFANG_SOURCES: readonly JingFangSource[];
export function findJingFangPalacePosition(hexagramId: number): JingFangPalaceEntry;
