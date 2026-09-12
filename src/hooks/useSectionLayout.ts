import { useResumeStore } from "@/store/useResumeStore";
import { normalizeSectionLayout, updateSectionLayout } from "@/lib/sectionLayout";
import type { SectionLayoutSettings } from "@/types/sectionLayout";

export function useSectionLayout(sectionId: string) {
  const resume = useResumeStore((state) => state.activeResume);

  const update = (patch: SectionLayoutSettings | null) => {
    const { activeResume, updateResume } = useResumeStore.getState();
    if (!activeResume) return;
    updateResume(activeResume.id, {
      sectionLayouts: updateSectionLayout(activeResume.sectionLayouts, sectionId, patch),
    });
  };

  return {
    settings: normalizeSectionLayout(resume?.sectionLayouts?.[sectionId]),
    globalSettings: resume?.globalSettings,
    update,
  };
}
