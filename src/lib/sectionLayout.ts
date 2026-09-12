import type { CSSProperties } from "react";
import type { GlobalSettings } from "../types/resume";
import type { SectionLayoutMap, SectionLayoutSettings } from "../types/sectionLayout";

export const SECTION_LAYOUT_NUMBERS = {
  lineHeight: { min: 1, max: 3, step: 0.1, fallback: 1.5 },
  paragraphSpacing: { min: 0, max: 96, step: 1, fallback: 12 },
  sectionSpacing: { min: 0, max: 120, step: 1, fallback: 24 },
  paddingTop: { min: 0, max: 96, step: 1, fallback: 0 },
  paddingRight: { min: 0, max: 96, step: 1, fallback: 0 },
  paddingBottom: { min: 0, max: 96, step: 1, fallback: 0 },
  paddingLeft: { min: 0, max: 96, step: 1, fallback: 0 },
} as const;

export type SectionLayoutNumber = keyof typeof SECTION_LAYOUT_NUMBERS;

export const TEXT_ALIGNMENTS = ["left", "center", "right", "justify"] as const;
export const HEADER_ALIGNMENTS = ["start", "center", "end", "baseline"] as const;

// Validate persisted/imported overrides at the boundary, including explicit zeroes.
export function normalizeSectionLayout(settings?: SectionLayoutSettings): SectionLayoutSettings {
  const result: SectionLayoutSettings = {};
  for (const key of Object.keys(SECTION_LAYOUT_NUMBERS) as SectionLayoutNumber[]) {
    const value = settings?.[key];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const { min, max, step } = SECTION_LAYOUT_NUMBERS[key];
    result[key] = Number((Math.round(Math.min(max, Math.max(min, value)) / step) * step).toFixed(1));
  }
  if (settings?.textAlign && TEXT_ALIGNMENTS.includes(settings.textAlign)) {
    result.textAlign = settings.textAlign;
  }
  if (settings?.headerAlign && HEADER_ALIGNMENTS.includes(settings.headerAlign)) {
    result.headerAlign = settings.headerAlign;
  }
  return result;
}

export function updateSectionLayout(
  layouts: SectionLayoutMap | undefined,
  sectionId: string,
  patch: SectionLayoutSettings | null,
): SectionLayoutMap {
  const next = { ...layouts };
  const settings = patch === null ? {} : normalizeSectionLayout({ ...next[sectionId], ...patch });
  if (Object.keys(settings).length) next[sectionId] = settings;
  else delete next[sectionId];
  return next;
}

export function getSectionLayoutNumber(
  key: SectionLayoutNumber,
  settings: SectionLayoutSettings,
  globals?: GlobalSettings,
): number {
  const inherited = key === "lineHeight" || key === "paragraphSpacing" || key === "sectionSpacing"
    ? globals?.[key]
    : undefined;
  return settings[key] ?? inherited ?? SECTION_LAYOUT_NUMBERS[key].fallback;
}

type SectionLayoutStyle = CSSProperties & Record<`--section-${string}`, string | number>;

export function getSectionLayoutStyle(settings: SectionLayoutSettings): SectionLayoutStyle {
  const style: SectionLayoutStyle = {};
  if (settings.sectionSpacing !== undefined) style.marginTop = settings.sectionSpacing;
  for (const key of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] as const) {
    if (settings[key] !== undefined) style[key] = settings[key];
  }
  if (settings.lineHeight !== undefined) style["--section-line-height"] = settings.lineHeight;
  if (settings.paragraphSpacing !== undefined) style["--section-item-spacing"] = `${settings.paragraphSpacing}px`;
  if (settings.textAlign !== undefined) style["--section-text-align"] = settings.textAlign;
  if (settings.headerAlign !== undefined) style["--section-header-align"] = settings.headerAlign;
  return style;
}
