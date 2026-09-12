import React, { createContext, useContext } from "react";
import { MenuSection } from "@/types/resume";
import type { SectionLayoutMap } from "@/types/sectionLayout";

interface TemplateContextProps {
  templateId: string;
  menuSections: MenuSection[];
  sectionLayouts?: SectionLayoutMap;
}

const TemplateContext = createContext<TemplateContextProps | undefined>(undefined);

export const TemplateProvider: React.FC<{
  templateId: string;
  menuSections: MenuSection[];
  sectionLayouts?: SectionLayoutMap;
  children: React.ReactNode;
}> = ({ templateId, menuSections, sectionLayouts, children }) => {
  return (
    <TemplateContext.Provider value={{ templateId, menuSections, sectionLayouts }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  return useContext(TemplateContext);
};
