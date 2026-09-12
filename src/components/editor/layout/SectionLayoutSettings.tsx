import { useId } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, RotateCcw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "@/i18n/compat/client";
import { useSectionLayout } from "@/hooks/useSectionLayout";
import { getSectionLayoutNumber, HEADER_ALIGNMENTS, SECTION_LAYOUT_NUMBERS, type SectionLayoutNumber } from "@/lib/sectionLayout";
import type { SectionLayoutSettings as LayoutSettings } from "@/types/sectionLayout";
import type { ResumeTemplate } from "@/types/template";

const alignmentIcons = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify };
const spacingFields = ["lineHeight", "paragraphSpacing", "sectionSpacing"] as const;
const paddingFields = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] as const;

interface SectionLayoutSettingsProps {
  sectionId: string;
  capabilities?: ResumeTemplate["sectionLayout"];
}

export default function SectionLayoutSettings({ sectionId, capabilities }: SectionLayoutSettingsProps) {
  const t = useTranslations("workbench.sectionLayout");
  const inputId = useId();
  const { settings, globalSettings, update } = useSectionLayout(sectionId);
  const customized = Object.keys(settings).length > 0;
  const hasText = sectionId !== "certificates";
  const hasHeader = !["skills", "selfEvaluation", "certificates"].includes(sectionId)
    && !capabilities?.disabledHeaderAlignment?.includes(sectionId);

  const resetButton = (key: keyof LayoutSettings) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          disabled={settings[key] === undefined}
          aria-label={t("resetField", { field: t(key) })}
          onClick={() => update({ [key]: undefined })}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("resetField", { field: t(key) })}</TooltipContent>
    </Tooltip>
  );

  const numberInput = (key: SectionLayoutNumber) => {
    const { min, max, step } = SECTION_LAYOUT_NUMBERS[key];
    const effective = getSectionLayoutNumber(key, settings, globalSettings);
    return (
      <Input
        id={`${inputId}-${key}`}
        aria-label={t(key)}
        type="number"
        min={min}
        max={max}
        step={step}
        value={settings[key] ?? ""}
        placeholder={String(effective)}
        className="h-8 min-w-0 text-sm"
        onChange={(event) => {
          if (event.target.value === "") update({ [key]: undefined });
          else if (Number.isFinite(event.target.valueAsNumber)) update({ [key]: event.target.valueAsNumber });
        }}
      />
    );
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Accordion type="single" collapsible className="mb-4" data-section-layout-editor={sectionId}>
        <AccordionItem value="layout">
          <AccordionTrigger className="py-3">
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span>{t("title")}</span>
              <span className="text-xs font-normal text-muted-foreground">{t(customized ? "customized" : "inherited")}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {spacingFields.filter((key) => hasText || key !== "lineHeight").map((key) => {
              const { min, max, step } = SECTION_LAYOUT_NUMBERS[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`${inputId}-${key}`} className="text-xs">{t(key)}</Label>
                    {resetButton(key)}
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_76px] items-center gap-3">
                    <Slider
                      aria-label={t(key)}
                      min={min}
                      max={max}
                      step={step}
                      value={[getSectionLayoutNumber(key, settings, globalSettings)]}
                      onValueChange={([value]) => update({ [key]: value })}
                    />
                    {numberInput(key)}
                  </div>
                </div>
              );
            })}

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-xs font-medium">{t("padding")}</legend>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {paddingFields.map((key) => (
                  <div key={key} className="min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <Label htmlFor={`${inputId}-${key}`} className="text-xs">{t(key)}</Label>
                      {resetButton(key)}
                    </div>
                    {numberInput(key)}
                  </div>
                ))}
              </div>
            </fieldset>

            {hasText && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{t("textAlign")}</span>
                  {resetButton("textAlign")}
                </div>
                <div className="flex items-center gap-1" role="group" aria-label={t("textAlign")}>
                  {Object.entries(alignmentIcons).map(([value, Icon]) => (
                    <Tooltip key={value}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={settings.textAlign === value ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9"
                          aria-label={t(`align.${value}`)}
                          aria-pressed={settings.textAlign === value}
                          onClick={() => update({ textAlign: value as LayoutSettings["textAlign"] })}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t(`align.${value}`)}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {hasHeader && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${inputId}-headerAlign`} className="text-xs">{t("headerAlign")}</Label>
                  {resetButton("headerAlign")}
                </div>
                <Select value={settings.headerAlign ?? "inherit"} onValueChange={(value) => update({ headerAlign: value === "inherit" ? undefined : value as LayoutSettings["headerAlign"] })}>
                  <SelectTrigger id={`${inputId}-headerAlign`} className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">{t("templateDefault")}</SelectItem>
                    {HEADER_ALIGNMENTS.map((value) => <SelectItem key={value} value={value}>{t(`vertical.${value}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="button" variant="outline" size="sm" disabled={!customized} onClick={() => update(null)}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              {t("resetAll")}
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  );
}
