export interface SectionLayoutSettings {
  lineHeight?: number;
  paragraphSpacing?: number;
  sectionSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  headerAlign?: "start" | "center" | "end" | "baseline";
}

export type SectionLayoutMap = Record<string, SectionLayoutSettings>;
