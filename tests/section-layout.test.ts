import test from "node:test";
import assert from "node:assert/strict";
import { getSectionLayoutNumber, getSectionLayoutStyle, normalizeSectionLayout, updateSectionLayout } from "../src/lib/sectionLayout";
import type { SectionLayoutSettings } from "../src/types/sectionLayout";

test("legacy resumes have no implicit module overrides", () => {
  assert.deepEqual(normalizeSectionLayout(), {});
  assert.deepEqual(getSectionLayoutStyle({}), {});
  assert.equal(getSectionLayoutNumber("lineHeight", {}, { lineHeight: 1.8 }), 1.8);
  assert.equal(getSectionLayoutNumber("paddingLeft", {}, { pagePadding: 32 }), 0);
});

test("explicit zero spacing survives inheritance and JSON persistence", () => {
  const layouts = updateSectionLayout(undefined, "education", { paragraphSpacing: 0, sectionSpacing: 0, paddingLeft: 0 });
  const restored = JSON.parse(JSON.stringify(layouts)).education;
  assert.equal(getSectionLayoutNumber("paragraphSpacing", restored, { paragraphSpacing: 12 }), 0);
  assert.equal(getSectionLayoutStyle(restored).marginTop, 0);
  assert.equal(getSectionLayoutStyle(restored)["--section-item-spacing"], "0px");
});

test("patching or resetting a module preserves other modules and the input", () => {
  const original = { education: { lineHeight: 1.2, paddingLeft: 8 }, custom_123: { textAlign: "right" as const } };
  const updated = updateSectionLayout(original, "education", { lineHeight: 1.9 });
  assert.deepEqual(updated.education, { lineHeight: 1.9, paddingLeft: 8 });
  assert.equal(original.education.lineHeight, 1.2);
  assert.deepEqual(updateSectionLayout(updated, "education", null), { custom_123: original.custom_123 });
});

test("individual reset resumes following global settings", () => {
  const layouts = updateSectionLayout({ education: { lineHeight: 1.2, paddingTop: 6 } }, "education", { lineHeight: undefined });
  assert.deepEqual(layouts.education, { paddingTop: 6 });
  assert.equal(getSectionLayoutNumber("lineHeight", layouts.education, { lineHeight: 2 }), 2);
  assert.deepEqual(updateSectionLayout(layouts, "education", { paddingTop: undefined }), {});
});

test("invalid imported values cannot produce invalid CSS", () => {
  assert.deepEqual(normalizeSectionLayout({
    lineHeight: NaN,
    paragraphSpacing: Infinity,
    sectionSpacing: -12,
    paddingLeft: 200,
    textAlign: "invalid",
    headerAlign: "invalid",
  } as unknown as SectionLayoutSettings), { sectionSpacing: 0, paddingLeft: 96 });
  assert.equal(normalizeSectionLayout({ lineHeight: 1.2000000000000002 }).lineHeight, 1.2);
});

test("content padding and alignment do not change document page margins", () => {
  const style = getSectionLayoutStyle({ paddingTop: 4, paddingRight: 8, paddingBottom: 12, paddingLeft: 16, textAlign: "justify", headerAlign: "baseline" });
  assert.deepEqual(style, {
    paddingTop: 4, paddingRight: 8, paddingBottom: 12, paddingLeft: 16,
    "--section-text-align": "justify", "--section-header-align": "baseline",
  });
});
