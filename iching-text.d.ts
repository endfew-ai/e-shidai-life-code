export type IChingLineText = { position: number; text: string; image: string };
export type IChingSpecialText = { text: string; image: string };
export type IChingTextRecord = {
  id: number;
  name: string;
  fullName: string;
  symbol: string;
  judgment: string;
  tuan: string;
  image: string;
  lines: IChingLineText[];
  special: IChingSpecialText[];
  wenyan: string;
  sourceTitle: string;
  sourceRevision: number;
};

export const ICHING_TEXT_SOURCE: {
  name: string;
  url: string;
  license: string;
  generatedFromRevisions: Record<number, number>;
};
export const ichingTexts: Record<number, IChingTextRecord>;
export function getIChingText(hexagramId: number): IChingTextRecord;
