import { FileText, FlaskConical, HeartPulse, Pill, Syringe, type LucideIcon } from "lucide-react";

import type { TimelineEntry, Tone } from "@/lib/types";

export const timelineIcons: Record<TimelineEntry["type"], LucideIcon> = {
  pod_screening: HeartPulse,
  lab_report: FlaskConical,
  prescription: Pill,
  vaccination: Syringe,
  note: FileText,
};

/** Each kind of entry in its colour, as the app's records timeline: the tint of its round of glass. */
export const timelineTones: Record<TimelineEntry["type"], Tone> = {
  prescription: "success",
  vaccination: "brand",
  pod_screening: "warning",
  lab_report: "neutral",
  note: "neutral",
};

export const timelineTypeNames: Record<TimelineEntry["type"], string> = {
  pod_screening: "Pod screening",
  lab_report: "Lab report",
  prescription: "Prescription",
  vaccination: "Vaccination",
  note: "Clinical note",
};
