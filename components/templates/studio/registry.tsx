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
  rolodex: load(() => import("./hr/Rolodex")),
  datasheet: load(() => import("./engineering/Datasheet")),
  "field-report": load(() => import("./nonprofit/FieldReport")),
};

export default function StudioTemplate(props: StudioProps) {
  const Component = STUDIO_COMPONENTS[props.template.id];
  return Component ? <Component {...props} /> : null;
}
