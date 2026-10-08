"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { StudioProps } from "./kit";

/**
 * One lazily loaded component per studio template, so a published site only
 * downloads its own template's code and fonts.
 */
/** Shown for the moment a template’s code is downloading, so a preview is never blank. */
function Loading() {
  return <div role="status" aria-label="Loading the design" className="grid min-h-[60vh] place-items-center bg-[#f4f2ec]">
    <div className="flex flex-col items-center gap-4 text-[#6b675e]">
      <span className="size-9 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="text-[13px] tracking-wide">Loading the design…</span>
    </div>
  </div>;
}

const load = (loader: () => Promise<{ default: ComponentType<StudioProps> }>) => dynamic(loader, { loading: Loading });

export const STUDIO_COMPONENTS: Record<string, ComponentType<StudioProps>> = {
  terminal: load(() => import("./developer/Terminal")),
  blueprint: load(() => import("./developer/Blueprint")),
  contributions: load(() => import("./developer/Contributions")),
  swiss: load(() => import("./design/Swiss")),
  specimen: load(() => import("./design/Specimen")),
  salon: load(() => import("./art/Salon")),
  sketchbook: load(() => import("./art/Sketchbook")),
  riso: load(() => import("./art/Riso")),
  darkroom: load(() => import("./photo/Darkroom")),
  horizon: load(() => import("./photo/Horizon")),
  monograph: load(() => import("./photo/Monograph")),
  broadsheet: load(() => import("./writing/Broadsheet")),
  quarterly: load(() => import("./writing/Quarterly")),
  "plan-section": load(() => import("./architecture/PlanSection")),
  material: load(() => import("./architecture/Material")),
  seminar: load(() => import("./academic/Seminar")),
  notebook: load(() => import("./data/Notebook")),
  signal: load(() => import("./data/Signal")),
  campaign: load(() => import("./marketing/Campaign")),
  pitch: load(() => import("./marketing/Pitch")),
  practice: load(() => import("./consulting/Practice")),
  "liner-notes": load(() => import("./music/LinerNotes")),
  "tour-poster": load(() => import("./music/TourPoster")),
  credits: load(() => import("./film/Credits")),
  storyboard: load(() => import("./film/Storyboard")),
  "annual-report": load(() => import("./leadership/AnnualReport")),
  keynote: load(() => import("./leadership/Keynote")),
  syllabus: load(() => import("./student/Syllabus")),
  sanctuary: load(() => import("./wellness/Sanctuary")),
  "training-log": load(() => import("./wellness/TrainingLog")),
  brief: load(() => import("./legal/Brief")),
  "open-house": load(() => import("./realestate/OpenHouse")),
  clinic: load(() => import("./healthcare/Clinic")),
  "exercise-book": load(() => import("./education/ExerciseBook")),
  prospectus: load(() => import("./finance/Prospectus")),
  "site-board": load(() => import("./trades/SiteBoard")),
  carte: load(() => import("./food/Carte")),
  lookbook: load(() => import("./beauty/Lookbook")),
  quota: load(() => import("./sales/Quota")),
  datasheet: load(() => import("./engineering/Datasheet")),
  "field-report": load(() => import("./nonprofit/FieldReport")),
  residence: load(() => import("./realestate/Residence")),
  "margin-notes": load(() => import("./education/MarginNotes")),
  pulse: load(() => import("./healthcare/Pulse")),
  counsel: load(() => import("./legal/Counsel")),
  mise: load(() => import("./food/Mise")),
  skyline: load(() => import("./realestate/Skyline")),
  manor: load(() => import("./realestate/Manor")),
  "front-door": load(() => import("./realestate/FrontDoor")),
  shoreline: load(() => import("./realestate/Shoreline")),
  "off-plan": load(() => import("./realestate/OffPlan")),
};

export default function StudioTemplate(props: StudioProps) {
  const Component = STUDIO_COMPONENTS[props.template.id];
  return Component ? <Component {...props} /> : null;
}
