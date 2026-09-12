import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readdir } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { initialResumeState } from "../src/config/initialResumeData";

const origin = process.env.SECTION_LAYOUT_TEST_URL ?? "http://127.0.0.1:4173";
const outputDir = process.env.SECTION_LAYOUT_SCREENSHOTS ?? "/tmp/magic-resume-section-layout";
const section = '[data-resume-section-id="education"]';
const editor = '[data-section-layout-editor="education"]:visible';
const resume = {
  ...initialResumeState,
  id: "section-layout-test",
  title: "Section layout verification",
  templateId: "classic",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  activeSection: "education",
  basic: { ...initialResumeState.basic, photo: "" },
  education: [
    { ...initialResumeState.education[0], id: "edu-1", school: "纽约大学", major: "计算机工程", degree: "硕士", gpa: "3.889/4", startDate: "2025-09", endDate: "", description: '<p style="text-align:right;line-height:3">Education details</p>' },
    { ...initialResumeState.education[0], id: "edu-2", school: "陕西科技大学", major: "计算机科学与技术", degree: "本科", gpa: "3.5/4", startDate: "2020-09", endDate: "2024-07", description: "" },
  ],
  customData: { custom_test: [{ id: "custom-item", title: "Custom item", subtitle: "Subtitle", dateRange: "2020-2024", description: "<p>Custom details</p>", visible: true }] },
  menuSections: [
    ...initialResumeState.menuSections.map((entry) => ({ ...entry, order: entry.id === "education" ? 1 : entry.order + (entry.id === "basic" ? 0 : 1) })),
    { id: "custom_test", title: "Custom section", icon: "", enabled: true, order: 5 },
    { id: "selfEvaluation", title: "Summary", icon: "", enabled: true, order: 6 },
  ],
  selfEvaluationContent: "<p>Summary details</p>",
};

async function storeAction(page: Page, code: string) {
  return page.evaluate(`(async () => {
    const resource = performance.getEntriesByType('resource').findLast((entry) => new URL(entry.name).pathname === '/src/store/useResumeStore.ts');
    const { useResumeStore } = await import(resource?.name ?? '/src/store/useResumeStore.ts');
    const store = useResumeStore.getState();
    ${code}
  })()`);
}

async function waitForStyle(page: Page, selector: string, property: string, value: string) {
  await page.waitForFunction(({ selector, property, value }) => {
    const element = document.querySelector(selector);
    return element && getComputedStyle(element).getPropertyValue(property) === value;
  }, { selector, property, value }, { timeout: 10_000 }).catch(async (error) => {
    const actual = await page.locator(selector).first().evaluate((element, property) => ({ value: getComputedStyle(element).getPropertyValue(property), html: element.outerHTML.slice(0, 600) }), property).catch(() => null);
    throw new Error(`${selector}: expected ${property}=${value}; actual=${JSON.stringify(actual)}`, { cause: error });
  });
}

async function experienceLayout(page: Page) {
  return page.locator('[data-resume-section-id="experience"]').evaluate((element) => {
    return [element, ...element.querySelectorAll("*")].map((node) => {
      const style = getComputedStyle(node);
      return [style.lineHeight, style.marginTop, style.paddingLeft, style.textAlign, style.alignItems];
    });
  });
}

test("module layout controls, persistence, templates, export styles and mobile", { timeout: 180_000 }, async (t) => {
  const browser = await chromium.launch({ headless: true, channel: process.env.SECTION_LAYOUT_BROWSER_CHANNEL });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, colorScheme: "light" });
  await context.addCookies([{ name: "NEXT_LOCALE", value: "zh", url: origin }]);
  await context.addInitScript((data) => {
    if (!localStorage.getItem("resume-storage")) {
      localStorage.setItem("resume-storage", JSON.stringify({ state: { resumes: { [data.id]: data }, activeResumeId: data.id }, version: 0 }));
    }
  }, resume);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/app/workbench/${resume.id}`);
  await page.locator(`${section} [data-section-item]`).first().waitFor();
  const originalOtherSection = await experienceLayout(page);
  const originalGlobal = await storeAction(page, "return store.activeResume.globalSettings;");
  assert.ok(originalGlobal);
  await page.locator(editor).getByRole("button", { name: /^模块排版/ }).click();
  await page.locator(editor).getByRole("spinbutton", { name: "内容行距（倍）" }).fill("1.2");
  await waitForStyle(page, `${section} [data-section-item]`, "line-height", "19.2px");
  await waitForStyle(page, `${section} [data-section-body] p`, "line-height", "19.2px");
  for (const [label, value] of [["条目间距（px）", "0"], ["模块上方间距（px）", "0"], ["左边距", "20"], ["右边距", "12"], ["上边距", "8"], ["下边距", "6"]]) {
    await page.locator(editor).getByRole("spinbutton", { name: label, exact: true }).fill(value);
  }
  await page.locator(editor).getByRole("button", { name: "左对齐", exact: true }).click();
  await page.locator(editor).getByRole("combobox").click();
  await page.getByRole("option", { name: "顶部对齐", exact: true }).click();
  await waitForStyle(page, section, "margin-top", "0px");
  await waitForStyle(page, section, "padding-left", "20px");
  await waitForStyle(page, `${section} [data-section-item]`, "margin-top", "0px");
  await waitForStyle(page, `${section} [data-section-header]`, "align-items", "start");
  await waitForStyle(page, `${section} [data-section-body] p`, "text-align", "left");
  assert.deepEqual(await experienceLayout(page), originalOtherSection);
  assert.deepEqual(await storeAction(page, "return store.activeResume.globalSettings;"), originalGlobal);
  await mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: `${outputDir}/desktop.png`, animations: "disabled" });
  const overrides = await storeAction(page, "return store.activeResume.sectionLayouts;");

  const previousLayouts = await storeAction(page, "return store.history[store.activeResume.id].at(-1)?.sectionLayouts;");
  await storeAction(page, "store.undo();");
  assert.deepEqual(await storeAction(page, "return store.activeResume.sectionLayouts;"), previousLayouts);
  await storeAction(page, "store.redo();");
  assert.deepEqual(await storeAction(page, "return store.activeResume.sectionLayouts;"), overrides);
  await page.reload();
  await waitForStyle(page, section, "padding-left", "20px");

  const templateDirs = await readdir(new URL("../src/components/templates/", import.meta.url), { withFileTypes: true });
  for (const dir of templateDirs.filter((entry) => entry.isDirectory() && entry.name !== "shared")) {
    const module = await import(`../src/components/templates/${dir.name}/config.ts`);
    const config = Object.values(module)[0] as { id: string };
    await storeAction(page, `store.setTemplate(${JSON.stringify(config.id)});`);
    await waitForStyle(page, section, "padding-left", "20px");
    await waitForStyle(page, `${section} [data-section-item]`, "margin-top", "0px");
    assert.equal(await page.locator(`${section} [data-section-item]`).first().evaluate((element) => {
      const value = getComputedStyle(element);
      return Number.parseFloat(value.lineHeight) / Number.parseFloat(value.fontSize);
    }), 1.2, config.id);
    assert.deepEqual(await storeAction(page, "return store.activeResume.sectionLayouts;"), overrides);
  }

  await storeAction(page, 'store.setTemplate("classic");');
  for (const id of ["experience", "projects", "skills", "selfEvaluation", "custom_test"]) {
    await storeAction(page, `store.updateResume(store.activeResume.id, { sectionLayouts: { ...store.activeResume.sectionLayouts, ${JSON.stringify(id)}: { lineHeight: 2, paragraphSpacing: 3, paddingLeft: 9, textAlign: "center" } } });`);
    await waitForStyle(page, `[data-resume-section-id="${id}"] [data-section-item]`, "margin-top", "3px");
    await waitForStyle(page, `[data-resume-section-id="${id}"] [data-section-body]`, "text-align", "center");
  }

  const exportHtml = await page.evaluate(`(async () => {
    const { getOptimizedStyles } = await import('/src/utils/export.ts');
    return '<style>' + getOptimizedStyles() + '</style>' + document.querySelector('${section}').outerHTML;
  })()`);
  const exportPage = await context.newPage();
  await exportPage.setContent(exportHtml as string);
  await exportPage.emulateMedia({ media: "print" });
  await waitForStyle(exportPage, section, "padding-left", "20px");
  await waitForStyle(exportPage, `${section} [data-section-body] p`, "text-align", "left");
  await waitForStyle(exportPage, `${section} [data-section-body] p`, "line-height", "19.2px");
  await exportPage.locator(section).screenshot({ path: `${outputDir}/education-export.png` });
  await exportPage.close();

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileToggle = page.locator(editor).getByRole("button", { name: /^模块排版/ });
  if (await mobileToggle.getAttribute("aria-expanded") !== "true") await mobileToggle.click();
  assert.equal(await mobileToggle.getAttribute("aria-expanded"), "true");
  await page.locator(editor).getByRole("spinbutton", { name: "内容行距（倍）" }).fill("1.8");
  assert.equal(await storeAction(page, "return store.activeResume.sectionLayouts.education.lineHeight;"), 1.8);
  const overflow = await page.locator(editor).evaluate((element) => element.scrollWidth > element.clientWidth);
  assert.equal(overflow, false);
  await page.screenshot({ path: `${outputDir}/mobile.png`, animations: "disabled" });
  await page.locator(editor).getByRole("button", { name: "恢复默认：内容行距（倍）", exact: true }).click();
  assert.equal(await storeAction(page, "return store.activeResume.sectionLayouts.education.lineHeight;"), undefined);
  await page.locator(editor).getByRole("button", { name: "重置模块排版", exact: true }).click();
  assert.equal(await storeAction(page, "return store.activeResume.sectionLayouts.education;"), undefined);
  assert.equal(await storeAction(page, "return store.activeResume.sectionLayouts.custom_test.lineHeight;"), 2);
  assert.deepEqual(errors, []);
});
