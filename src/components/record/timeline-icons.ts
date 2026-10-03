import { FileText, FlaskConical, HeartPulse, Pill, Syringe, type LucideIcon } from "lucide-react";

import type { TimelineEntry } from "@/lib/types";

export const timelineIcons: Record<TimelineEntry["type"], LucideIcon> = {
  pod_screening: HeartPulse,
  lab_report: FlaskConical,
  prescription: Pill,
  vaccination: Syringe,
  note: FileText,
};

export const timelineTypeNames: Record<TimelineEntry["type"], string> = {
  pod_screening: "Pod screening",
  lab_report: "Lab report",
  prescription: "Prescription",
  vaccination: "Vaccination",
  note: "Clinical note",
};
