# Section Layout

Module overrides live in the optional `ResumeData.sectionLayouts` map, keyed by
the menu section ID. Missing values retain the global/template formatting.
An explicit `0` is a valid spacing value. Padding is an additional inset inside
the module; the document's page margin remains `globalSettings.pagePadding`.

## Boundaries

- `src/types/sectionLayout.ts` defines the persisted contract.
- `src/lib/sectionLayout.ts` validates values and builds immutable updates and CSS
  properties. It has no store, React runtime, or template dependencies.
- `src/hooks/useSectionLayout.ts` connects editor controls to the existing
  `updateResume` API, preserving persistence, file sync, undo, and redo.
- `TemplateProvider` supplies the rendered resume's overrides. Preview and export
  never read formatting from whichever resume happens to be active in the store.
- `SectionWrapper` applies the overrides. The editor reuses existing UI controls.

## Template Integration

Keep each module inside `SectionWrapper` and use these semantic markers:

| Marker | Placement |
| --- | --- |
| `data-section-item` | Each repeated entry, or the outer content block of a text-only module |
| `data-section-items` | An optional list container that supplies its own margin or row gap |
| `data-section-body` | A rich-text content element |
| `data-section-header` | A horizontal header row, including nested flex rows |

The shared stylesheet only overrides properties explicitly selected for the
module. Line height and text alignment include entry headings, wrapped subtitles,
dates, and rich text, but exclude the module title. Explicit module choices take
precedence over inline rich-text formatting; resetting restores that formatting
without rewriting the saved content. Item spacing controls the margin before each
entry and replaces template-specific list gaps and trailing item padding.

Templates with stacked headers can declare
`sectionLayout.disabledHeaderAlignment` in their own config. This hides controls
that do not apply to those sections without template-specific editor branches.
Custom modules use their own IDs and require no new store actions.

## Verification

Run `pnpm test:section-layout` for the pure layout rules. With a development server
running at `http://127.0.0.1:4173`, run `pnpm test:section-layout:browser` for browser
coverage. `SECTION_LAYOUT_TEST_URL` can override the server URL, and
`SECTION_LAYOUT_BROWSER_CHANNEL=chrome` uses an installed Chrome browser.

The browser check uses an isolated profile and fixture resume. It covers wrapped
education content, module isolation, zero spacing, all template configs, custom
modules, persistence, undo/redo, export styles, and mobile controls. Screenshots
are written to `/tmp/magic-resume-section-layout` by default.
