"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { StudioProps } from "./kit";

/**
 * One lazily loaded component per studio template, so a published site only
 * downloads its own template's code and fonts.
 */
const load = (loader: () => Promise<{ default: ComponentType<StudioProps> }>) => dynamic(loader);

export const STUDIO_COMPONENTS: Record<string, ComponentType<StudioProps>> = {
  terminal: load(() => import("./developer/Terminal")),
  changelog: load(() => import("./developer/Changelog")),
  blueprint: load(() => import("./developer/Blueprint")),
  manpage: load(() => import("./developer/Manpage")),
  contributions: load(() => import("./developer/Contributions")),
  swiss: load(() => import("./design/Swiss")),
  index: load(() => import("./design/Index")),
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
  preprint: load(() => import("./academic/Preprint")),
  seminar: load(() => import("./academic/Seminar")),
  notebook: load(() => import("./data/Notebook")),
  signal: load(() => import("./data/Signal")),
  campaign: load(() => import("./marketing/Campaign")),
  pitch: load(() => import("./marketing/Pitch")),
  practice: load(() => import("./consulting/Practice")),
  ledger: load(() => import("./consulting/Ledger")),
  "liner-notes": load(() => import("./music/LinerNotes")),
  "tour-poster": load(() => import("./music/TourPoster")),
  credits: load(() => import("./film/Credits")),
  storyboard: load(() => import("./film/Storyboard")),
  "annual-report": load(() => import("./leadership/AnnualReport")),
  keynote: load(() => import("./leadership/Keynote")),
  syllabus: load(() => import("./student/Syllabus")),
  sanctuary: load(() => import("./wellness/Sanctuary")),
  "training-log": load(() => import("./wellness/TrainingLog")),
};

export default function StudioTemplate(props: StudioProps) {
  const Component = STUDIO_COMPONENTS[props.template.id];
  return Component ? <Component {...props} /> : null;
}
