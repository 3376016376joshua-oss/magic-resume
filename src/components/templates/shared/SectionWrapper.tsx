import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { useTemplateContext } from "../TemplateContext";
import { getSectionLayoutStyle, normalizeSectionLayout } from "@/lib/sectionLayout";
import "./sectionLayout.css";

interface SectionWrapperProps {
    sectionId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Shared interaction and layout boundary; render settings come from template data.
 */
const SectionWrapper: React.FC<SectionWrapperProps> = ({
    sectionId,
    children,
    className = "",
    style,
}) => {
    const { setActiveSection } = useResumeStore();
    const context = useTemplateContext();
    const settings = normalizeSectionLayout(context?.sectionLayouts?.[sectionId]);

    return (
        <motion.div
            data-resume-section-id={sectionId}
            data-section-line-height={settings.lineHeight !== undefined || undefined}
            data-section-spacing={settings.paragraphSpacing !== undefined || undefined}
            data-section-text-align={settings.textAlign}
            data-section-header-align={settings.headerAlign}
            className={cn(
                "hover:cursor-pointer rounded-md transition-all duration-300 ease-in-out hover:shadow-md",
                "hover:bg-[#f9f8f3]",
                className
            )}
            style={{ ...style, ...getSectionLayoutStyle(settings) }}
            onClick={() => setActiveSection(sectionId)}
        >
            {children}
        </motion.div>
    );
};

export default SectionWrapper;
