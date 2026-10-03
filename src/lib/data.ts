/**
 * Sample data for the UI build. People and scenarios are illustrative and follow
 * the 2026 product brochure; this file goes away once MongoDB is wired in.
 */

import type {
  AccessLogEntry,
  Consult,
  Doctor,
  EkaayFlag,
  Nominee,
  Notification,
  Patient,
  PatientRecord,
  PlanId,
  Prescription,
  RecordDetail,
  TestOrder,
} from "./types";

export const doctor: Doctor = {
  name: "Dr Anjali Mehta",
  shortName: "Dr A. Mehta",
  initials: "AM",
  qualifications: "MBBS, MD (Medicine)",
  specialty: "General physician",
  phone: "+91 98100 12345",
  registrationNumber: "DMC 48217",
  council: "Delhi Medical Council",
  specialties: ["General medicine", "Diabetes and endocrinology"],
  languages: ["English", "Hindi", "Gujarati"],
  location: "New Delhi, Delhi",
};

export const planNames: Record<PlanId, string> = {
  essential: "Essential",
  plus: "Plus",
  family: "Family",
  senior_care: "Senior Care",
  community: "Community",
};

export const patients: Patient[] = [
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    firstName: "Priya",
    initials: "PS",
    avatarTone: "brand",
    age: 38,
    sex: "female",
    bloodGroup: "O+",
    memberId: "HM 4829 1057 3316",
    plan: "plus",
    abhaLinked: true,
    allergies: ["Sulfa drugs"],
    conditions: [],
    access: { status: "active", note: "Opened with Priya’s OTP at 10:14 am, expires in 24 h" },
  },
  {
    id: "vikram-sharma",
    name: "Vikram Sharma",
    firstName: "Vikram",
    initials: "VS",
    avatarTone: "ink",
    age: 41,
    sex: "male",
    bloodGroup: "B+",
    memberId: "HM 4829 1057 3324",
    plan: "family",
    abhaLinked: true,
    allergies: [],
    conditions: [],
    access: { status: "pending", note: "OTP sent to Vikram at 10:02 am, waiting for him to share it" },
  },
  {
    id: "mohan-sharma",
    name: "Mohan Sharma",
    firstName: "Mohan",
    initials: "MS",
    avatarTone: "success",
    age: 68,
    sex: "male",
    bloodGroup: "A+",
    memberId: "HM 4829 1057 3340",
    plan: "senior_care",
    abhaLinked: true,
    allergies: [],
    conditions: ["Hypertension"],
    access: { status: "active", note: "Opened with nominee Priya’s OTP at 9:36 am, expires in 24 h" },
  },
  {
    id: "rahul-verma",
    name: "Rahul Verma",
    firstName: "Rahul",
    initials: "RV",
    avatarTone: "ink",
    age: 34,
    sex: "male",
    bloodGroup: "B+",
    memberId: "HM 7310 2284 9051",
    plan: "plus",
    abhaLinked: true,
    allergies: ["Penicillin"],
    conditions: ["Type 1 diabetes, on insulin"],
    access: { status: "none", note: "Not requested yet" },
  },
  {
    id: "sana-qureshi",
    name: "Sana Qureshi",
    firstName: "Sana",
    initials: "SQ",
    avatarTone: "rust",
    age: 29,
    sex: "female",
    bloodGroup: "AB+",
    memberId: "HM 6604 7712 0185",
    plan: "community",
    abhaLinked: true,
    allergies: [],
    conditions: [],
    access: { status: "expired", note: "Access expired on 28 Sep, 24 h after her last consult" },
  },
  {
    id: "arjun-nair",
    name: "Arjun Nair",
    firstName: "Arjun",
    initials: "AN",
    avatarTone: "brand",
    age: 45,
    sex: "male",
    bloodGroup: "A+",
    memberId: "HM 5521 0937 4418",
    plan: "essential",
    abhaLinked: true,
    allergies: [],
    conditions: [],
    access: { status: "none", note: "Not requested yet" },
  },
];

export const consults: Consult[] = [
  {
    id: "c1",
    patientId: "mohan-sharma",
    time: "9:40 am",
    mode: "Video from pod",
    reason: "Monthly blood pressure review",
    status: "completed",
  },
  {
    id: "c2",
    patientId: "priya-sharma",
    time: "10:30 am",
    mode: "Video",
    reason: "Rising fasting sugar after pod screening",
    status: "in_progress",
  },
  {
    id: "c3",
    patientId: "vikram-sharma",
    time: "11:15 am",
    mode: "Video",
    reason: "BP up in three office-pod readings",
    status: "scheduled",
  },
  {
    id: "c4",
    patientId: "rahul-verma",
    time: "12:00 pm",
    mode: "Video",
    reason: "Follow-up after road accident, insulin review",
    status: "scheduled",
  },
  {
    id: "c5",
    patientId: "sana-qureshi",
    time: "2:30 pm",
    mode: "Video from pod",
    reason: "Tiredness, low haemoglobin on pod check",
    status: "scheduled",
  },
  {
    id: "c6",
    patientId: "arjun-nair",
    time: "3:15 pm",
    mode: "Video",
    reason: "First consult, cholesterol results",
    status: "scheduled",
  },
  {
    id: "c7",
    patientId: "vikram-sharma",
    day: "Tomorrow",
    time: "10:00 am",
    mode: "Video from pod",
    reason: "Kidney function results, BP plan",
    status: "scheduled",
  },
  {
    id: "c8",
    patientId: "sana-qureshi",
    day: "Tomorrow",
    time: "4:30 pm",
    mode: "Video",
    reason: "Ferritin and vitamin B12 results",
    status: "scheduled",
  },
  {
    id: "c9",
    patientId: "priya-sharma",
    day: "In 12 weeks",
    time: "10:30 am",
    mode: "Video",
    reason: "Follow-up: HbA1c and lipids",
    status: "scheduled",
  },
];

export const ekaayFlags: EkaayFlag[] = [
  {
    patientId: "priya-sharma",
    text: "Fasting sugar has risen in three tests since 2024, now 118 mg/dL.",
    tone: "danger",
  },
  {
    patientId: "vikram-sharma",
    text: "Blood pressure up in three office-pod readings in a row.",
    tone: "warning",
  },
  {
    patientId: "mohan-sharma",
    text: "Evening BP tablet not marked on 4 of the last 14 days.",
    tone: "warning",
  },
];

export const accessLog: AccessLogEntry[] = [
  {
    at: "Today, 10:14 am",
    patientId: "priya-sharma",
    what: "Full record, Ekaay summary",
    approvedBy: "Priya (patient)",
    status: "active",
  },
  {
    at: "Today, 10:02 am",
    patientId: "vikram-sharma",
    what: "Full record requested",
    approvedBy: "Waiting for OTP",
    status: "pending",
  },
  {
    at: "Today, 9:36 am",
    patientId: "mohan-sharma",
    what: "Full record, medicine log",
    approvedBy: "Priya (nominee)",
    status: "active",
  },
  {
    at: "27 Sep, 4:05 pm",
    patientId: "sana-qureshi",
    what: "Full record, pod screening",
    approvedBy: "Sana (patient)",
    status: "expired",
  },
  {
    at: "12 Sep, 11:20 am",
    patientId: "priya-sharma",
    what: "Pod screening, 22 tests",
    approvedBy: "Priya (patient)",
    status: "expired",
  },
];

const records: Record<string, PatientRecord> = {
  "priya-sharma": {
    medicines: [],
    summary: [
      "Fasting glucose rising: 96, then 104, now 118 mg/dL over two years.",
      "LDL 142 mg/dL, borderline high, 11 higher than last year.",
      "BP averaging 128/84 across the last three pod readings.",
      "No regular medicines. Father has type 2 diabetes.",
      "Suggested: HbA1c, lifestyle counselling, lipids again in 12 weeks.",
    ],
    timeline: [
      { date: "12 Sep 2026", title: "Pod screening, 22 tests", type: "pod_screening" },
      { date: "03 Aug 2026", title: "Lipid profile, city lab", type: "lab_report" },
      { date: "14 Mar 2026", title: "Annual health check", type: "lab_report" },
      { date: "14 Aug 2023", title: "Rash after co-trimoxazole", type: "prescription" },
    ],
    charts: [
      {
        title: "Fasting glucose",
        unit: "mg/dL",
        labels: ["Aug 2024", "Mar 2026", "Sep 2026"],
        series: [{ name: "Fasting glucose", values: [96, 104, 118] }],
        bands: [
          { from: 70, to: 99, tone: "success", label: "Normal 70 to 99" },
          { from: 100, to: 125, tone: "warning", label: "Prediabetes 100 to 125" },
        ],
      },
      {
        title: "Blood pressure",
        unit: "mmHg",
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        series: [
          { name: "Systolic", values: [122, 124, 126, 127, 129, 128] },
          { name: "Diastolic", values: [78, 80, 81, 84, 84, 84] },
        ],
        refLines: [80, 120],
        caption: "Six pod readings, Apr to Sep 2026",
      },
    ],
    results: [
      { name: "LDL cholesterol", value: "142 mg/dL", flag: "borderline", label: "Borderline high" },
      { name: "Total cholesterol", value: "212 mg/dL", flag: "borderline", label: "Borderline" },
      { name: "Haemoglobin", value: "12.6 g/dL", flag: "normal", label: "Normal" },
      { name: "Creatinine", value: "0.8 mg/dL", flag: "normal", label: "Normal" },
      { name: "HbA1c", value: "Booked, Sat", flag: "pending", label: "Pending" },
    ],
    qa: [
      {
        question: "Any past reaction to antibiotics?",
        answer:
          "Yes. A rash after co-trimoxazole, a sulfa drug, in August 2023, recorded by Dr S. Rao. No other reactions on file.",
        source: "Prescription, 14 Aug 2023",
      },
      {
        question: "How has her LDL changed?",
        answer: "LDL was 131 mg/dL in March 2026 and 142 mg/dL in September 2026, a rise of 11.",
        source: "Annual health check, 14 Mar 2026; pod screening, 12 Sep 2026",
      },
      {
        question: "Any family history of diabetes?",
        answer: "Her father has type 2 diabetes. No other family history is recorded.",
        source: "Annual health check, 14 Mar 2026",
      },
    ],
    prescriptionDraft: [
      "HbA1c at the Sector 1 pod, this Saturday",
      "Lipid profile again in 12 weeks",
      "Diet and activity plan, attached",
      "Video follow-up in 12 weeks",
    ],
    draftSource: "from a voice note",
  },

  "vikram-sharma": {
    medicines: [],
    summary: [
      "BP rising over five office-pod readings: 126/82 in May to 142/92 in September.",
      "Fasting glucose normal at 95 mg/dL.",
      "Weight up 3 kg since March. Desk job, little exercise reported.",
      "No regular medicines. No known allergies.",
      "Suggested: home BP log for two weeks, kidney function, salt and activity advice.",
    ],
    timeline: [
      { date: "18 Sep 2026", title: "Office-pod vitals", type: "pod_screening" },
      { date: "21 Aug 2026", title: "Office-pod vitals", type: "pod_screening" },
      { date: "14 Mar 2026", title: "Annual health check", type: "lab_report" },
    ],
    charts: [
      {
        title: "Blood pressure",
        unit: "mmHg",
        labels: ["May", "Jun", "Jul", "Aug", "Sep"],
        series: [
          { name: "Systolic", values: [126, 128, 134, 138, 142] },
          { name: "Diastolic", values: [82, 84, 86, 88, 92] },
        ],
        refLines: [80, 120],
        caption: "Five office-pod readings, May to Sep 2026",
      },
      {
        title: "Fasting glucose",
        unit: "mg/dL",
        labels: ["Mar 2025", "Mar 2026", "Sep 2026"],
        series: [{ name: "Fasting glucose", values: [92, 94, 95] }],
        bands: [{ from: 70, to: 99, tone: "success", label: "Normal 70 to 99" }],
      },
    ],
    results: [
      { name: "Blood pressure", value: "142/92 mmHg", flag: "high", label: "High" },
      { name: "Fasting glucose", value: "95 mg/dL", flag: "normal", label: "Normal" },
      { name: "LDL cholesterol", value: "118 mg/dL", flag: "normal", label: "Near optimal" },
      { name: "Creatinine", value: "Not on file", flag: "pending", label: "Suggested" },
    ],
    qa: [
      {
        question: "Is he on any BP medicine?",
        answer: "No. There are no regular medicines on file.",
        source: "Medicine list, updated 18 Sep 2026",
      },
      {
        question: "When did his BP first cross 130?",
        answer: "In July 2026, at 134/86 on the office pod. It has risen at each reading since.",
        source: "Office-pod vitals, Jul to Sep 2026",
      },
    ],
    prescriptionDraft: [
      "Home BP log, morning and evening, for two weeks",
      "Kidney function test and urine analysis at the tech park pod",
      "Salt and activity plan, attached",
      "Video follow-up in two weeks",
    ],
    draftSource: "suggested by Ekaay for your review",
  },

  "mohan-sharma": {
    medicines: ["Telmisartan 40 mg, morning", "Amlodipine 5 mg, 8 pm", "Atorvastatin 10 mg, night"],
    summary: [
      "BP improving on treatment: 148/92 in April to 134/84 in September.",
      "Three regular medicines. Evening BP tablet missed on 4 of the last 14 days.",
      "Kidney function stable, creatinine 1.1 mg/dL.",
      "Priya is his caregiver and nominee for OTPs.",
      "Suggested: keep the current dose, move the evening tablet to dinner time.",
    ],
    timeline: [
      { date: "29 Sep 2026", title: "Monthly vitals, Sector 1 pod", type: "pod_screening" },
      { date: "02 Sep 2026", title: "Kidney function, city lab", type: "lab_report" },
      { date: "10 Jun 2026", title: "Prescription, BP medicines", type: "prescription" },
      { date: "05 Nov 2025", title: "Flu vaccine", type: "vaccination" },
    ],
    charts: [
      {
        title: "Blood pressure",
        unit: "mmHg",
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
        series: [
          { name: "Systolic", values: [148, 144, 140, 138, 136, 134] },
          { name: "Diastolic", values: [92, 90, 88, 86, 84, 84] },
        ],
        refLines: [80, 120],
        caption: "Monthly pod vitals, Apr to Sep 2026",
      },
      {
        title: "Fasting glucose",
        unit: "mg/dL",
        labels: ["Sep 2025", "Mar 2026", "Sep 2026"],
        series: [{ name: "Fasting glucose", values: [98, 101, 99] }],
        bands: [
          { from: 70, to: 99, tone: "success", label: "Normal 70 to 99" },
          { from: 100, to: 125, tone: "warning", label: "Prediabetes 100 to 125" },
        ],
      },
    ],
    results: [
      { name: "Blood pressure", value: "134/84 mmHg", flag: "borderline", label: "Watch" },
      { name: "Creatinine", value: "1.1 mg/dL", flag: "normal", label: "Normal" },
      { name: "Potassium", value: "4.4 mmol/L", flag: "normal", label: "Normal" },
      { name: "Fasting glucose", value: "99 mg/dL", flag: "normal", label: "Normal" },
    ],
    qa: [
      {
        question: "How often does he miss his evening tablet?",
        answer: "The 8 pm BP tablet was not marked on 4 of the last 14 days. Morning doses were all marked.",
        source: "Medicine log, 16 to 29 Sep 2026",
      },
      {
        question: "Any change in kidney function?",
        answer: "Creatinine was 1.0 mg/dL in March 2026 and 1.1 mg/dL in September 2026, both in range.",
        source: "Kidney function, 02 Sep 2026",
      },
    ],
    prescriptionDraft: [
      "Continue current BP medicines, same dose",
      "Move the evening tablet to dinner time",
      "Monthly vitals at the Sector 1 pod",
    ],
    draftSource: "from a photo of your note",
  },

  "rahul-verma": {
    medicines: ["Insulin glargine, night", "Insulin aspart, with meals"],
    summary: [
      "Type 1 diabetes on insulin glargine at night and insulin aspart with meals.",
      "HbA1c improving: 8.1, then 7.6, now 7.4 percent.",
      "Emergency admission last month after a road accident, discharged in two days.",
      "Allergic to penicillin.",
      "Suggested: review insulin doses after the injury, repeat HbA1c in 12 weeks.",
    ],
    timeline: [
      { date: "24 Sep 2026", title: "Pod screening, HbA1c", type: "pod_screening" },
      { date: "04 Sep 2026", title: "Discharge summary, emergency admission", type: "note" },
      { date: "11 Jun 2026", title: "Prescription, insulin", type: "prescription" },
      { date: "20 Mar 2026", title: "HbA1c, city lab", type: "lab_report" },
    ],
    charts: [
      {
        title: "HbA1c",
        unit: "percent",
        labels: ["Dec 2025", "Mar 2026", "Sep 2026"],
        series: [{ name: "HbA1c", values: [8.1, 7.6, 7.4] }],
        bands: [{ from: 6, to: 7, tone: "success", label: "Target under 7" }],
      },
      {
        title: "Fasting glucose",
        unit: "mg/dL",
        labels: ["Jun", "Jul", "Aug", "Sep"],
        series: [{ name: "Fasting glucose", values: [156, 148, 142, 138] }],
        bands: [{ from: 80, to: 130, tone: "success", label: "Target 80 to 130" }],
        caption: "Four pod readings, Jun to Sep 2026",
      },
    ],
    results: [
      { name: "HbA1c", value: "7.4 percent", flag: "borderline", label: "Above target" },
      { name: "Fasting glucose", value: "138 mg/dL", flag: "high", label: "High" },
      { name: "Creatinine", value: "0.9 mg/dL", flag: "normal", label: "Normal" },
      { name: "Haemoglobin", value: "13.8 g/dL", flag: "normal", label: "Normal" },
    ],
    qa: [
      {
        question: "What happened at the emergency admission?",
        answer:
          "He was brought in after a scooter crash on 2 September 2026 with minor injuries. Blood sugar was checked first and penicillin was avoided. He was discharged on 4 September.",
        source: "Discharge summary, 04 Sep 2026",
      },
      {
        question: "What insulin is he on?",
        answer: "Insulin glargine at night and insulin aspart with meals.",
        source: "Prescription, 11 Jun 2026",
      },
    ],
    prescriptionDraft: [
      "Continue insulin glargine at night and insulin aspart with meals",
      "Glucose log before meals for two weeks",
      "HbA1c again in 12 weeks",
    ],
    draftSource: "suggested by Ekaay for your review",
  },

  "sana-qureshi": {
    medicines: ["Iron and folic acid, once a day"],
    summary: [
      "Haemoglobin low but improving: 10.2, then 10.8, now 11.4 g/dL.",
      "On iron and folic acid since June.",
      "Reports tiredness. BP and sugar normal.",
      "No known allergies.",
      "Suggested: ferritin and vitamin B12, continue iron for three months.",
    ],
    timeline: [
      { date: "26 Sep 2026", title: "Pod screening, complete blood count", type: "pod_screening" },
      { date: "15 Jun 2026", title: "Prescription, iron and folic acid", type: "prescription" },
      { date: "12 Jun 2026", title: "Community screening camp", type: "pod_screening" },
    ],
    charts: [
      {
        title: "Haemoglobin",
        unit: "g/dL",
        labels: ["Mar 2026", "Jun 2026", "Sep 2026"],
        series: [{ name: "Haemoglobin", values: [10.2, 10.8, 11.4] }],
        bands: [{ from: 12, to: 15.5, tone: "success", label: "Normal 12 to 15.5" }],
      },
      {
        title: "Blood pressure",
        unit: "mmHg",
        labels: ["Mar", "Jun", "Sep"],
        series: [
          { name: "Systolic", values: [108, 112, 110] },
          { name: "Diastolic", values: [70, 72, 70] },
        ],
        refLines: [80, 120],
        caption: "Three pod readings, Mar to Sep 2026",
      },
    ],
    results: [
      { name: "Haemoglobin", value: "11.4 g/dL", flag: "low", label: "Low" },
      { name: "MCV", value: "76 fL", flag: "low", label: "Low" },
      { name: "Fasting glucose", value: "88 mg/dL", flag: "normal", label: "Normal" },
      { name: "Ferritin", value: "Not on file", flag: "pending", label: "Suggested" },
    ],
    qa: [
      {
        question: "Is she taking iron?",
        answer: "Yes. Iron and folic acid once a day since 15 June 2026.",
        source: "Prescription, 15 Jun 2026",
      },
    ],
    prescriptionDraft: [
      "Ferritin and vitamin B12 at the community pod",
      "Continue iron and folic acid for three months",
      "Complete blood count again in 12 weeks",
    ],
    draftSource: "suggested by Ekaay for your review",
  },

  "arjun-nair": {
    medicines: [],
    summary: [
      "LDL rising: 138, then 151, now 164 mg/dL over two years.",
      "BP normal. Fasting glucose 97 mg/dL.",
      "Smoker. No regular medicines.",
      "First consult on HealthMatrix. Records imported from two lab PDFs.",
      "Suggested: full lipid profile, cardiovascular risk review, lifestyle advice.",
    ],
    timeline: [
      { date: "30 Sep 2026", title: "Pod screening, pay per test", type: "pod_screening" },
      { date: "08 Sep 2025", title: "Lipid profile, lab PDF", type: "lab_report" },
      { date: "02 Sep 2024", title: "Health check, lab PDF", type: "lab_report" },
    ],
    charts: [
      {
        title: "LDL cholesterol",
        unit: "mg/dL",
        labels: ["Sep 2024", "Sep 2025", "Sep 2026"],
        series: [{ name: "LDL cholesterol", values: [138, 151, 164] }],
        bands: [{ from: 100, to: 129, tone: "success", label: "Near optimal 100 to 129" }],
      },
      {
        title: "Blood pressure",
        unit: "mmHg",
        labels: ["Sep 2024", "Sep 2025", "Sep 2026"],
        series: [
          { name: "Systolic", values: [118, 120, 122] },
          { name: "Diastolic", values: [76, 78, 78] },
        ],
        refLines: [80, 120],
      },
    ],
    results: [
      { name: "LDL cholesterol", value: "164 mg/dL", flag: "high", label: "High" },
      { name: "Total cholesterol", value: "238 mg/dL", flag: "borderline", label: "Borderline high" },
      { name: "HDL cholesterol", value: "41 mg/dL", flag: "normal", label: "Normal" },
      { name: "Fasting glucose", value: "97 mg/dL", flag: "normal", label: "Normal" },
    ],
    qa: [
      {
        question: "Has he been on a statin before?",
        answer: "No. There are no lipid-lowering medicines on file.",
        source: "Medicine list, updated 30 Sep 2026",
      },
    ],
    prescriptionDraft: [
      "Full lipid profile at the Market Street pod",
      "Diet and activity plan, attached",
      "Video follow-up when results arrive",
    ],
    draftSource: "suggested by Ekaay for your review",
  },
};

const nominees: Record<string, Nominee> = {
  "priya-sharma": { name: "Vikram Sharma", relation: "husband" },
  "vikram-sharma": { name: "Priya Sharma", relation: "wife" },
  "mohan-sharma": { name: "Priya Sharma", relation: "daughter-in-law" },
  "rahul-verma": { name: "Neha Verma", relation: "wife" },
};

/** Words in a prescription line that clash with a recorded allergy. */
const allergyTerms: Record<string, string[]> = {
  "Sulfa drugs": ["sulfa", "co-trimoxazole", "cotrimoxazole", "sulfamethoxazole"],
  Penicillin: ["penicillin", "amoxicillin", "ampicillin"],
};

export const prescriptions: Prescription[] = [
  {
    id: "rx-1",
    patientId: "priya-sharma",
    date: "Today",
    status: "draft",
    source: "Voice note",
    items: records["priya-sharma"].prescriptionDraft,
  },
  {
    id: "rx-2",
    patientId: "mohan-sharma",
    date: "Today",
    status: "draft",
    source: "Photo of a note",
    items: records["mohan-sharma"].prescriptionDraft,
  },
  {
    id: "rx-3",
    patientId: "sana-qureshi",
    date: "15 Jun 2026",
    status: "signed",
    source: "Typed",
    items: ["Iron and folic acid, once a day after lunch", "Complete blood count in 12 weeks"],
  },
  {
    id: "rx-4",
    patientId: "rahul-verma",
    date: "11 Jun 2026",
    status: "signed",
    source: "Voice note",
    items: [
      "Insulin glargine at night, dose unchanged",
      "Insulin aspart with meals, dose unchanged",
      "HbA1c in 12 weeks",
    ],
  },
  {
    id: "rx-5",
    patientId: "mohan-sharma",
    date: "10 Jun 2026",
    status: "signed",
    source: "Photo of a note",
    items: [
      "Telmisartan 40 mg, once in the morning",
      "Amlodipine 5 mg, at 8 pm",
      "Atorvastatin 10 mg, at night",
      "Monthly vitals at the Sector 1 pod",
    ],
  },
];

export const testOrders: TestOrder[] = [
  {
    id: "t-1",
    patientId: "sana-qureshi",
    test: "Complete blood count",
    orderedOn: "15 Jun 2026",
    where: "Community pod",
    status: "result_back",
    result: { value: "Haemoglobin 11.4 g/dL", flag: "low", label: "Low", date: "26 Sep 2026" },
  },
  {
    id: "t-2",
    patientId: "rahul-verma",
    test: "HbA1c",
    orderedOn: "11 Jun 2026",
    where: "Market Street pharmacy pod",
    status: "result_back",
    result: { value: "7.4 percent", flag: "borderline", label: "Above target", date: "24 Sep 2026" },
  },
  {
    id: "t-3",
    patientId: "priya-sharma",
    test: "HbA1c",
    orderedOn: "Today",
    where: "Sector 1 clubhouse pod, Saturday 8:30 am",
    status: "booked",
  },
  {
    id: "t-4",
    patientId: "vikram-sharma",
    test: "Kidney function and urine analysis",
    orderedOn: "Today",
    where: "Tech park pod, Block B",
    status: "awaiting_booking",
  },
  {
    id: "t-5",
    patientId: "mohan-sharma",
    test: "Kidney function",
    orderedOn: "28 Aug 2026",
    where: "City lab",
    status: "reviewed",
    result: { value: "Creatinine 1.1 mg/dL", flag: "normal", label: "Normal", date: "02 Sep 2026" },
  },
];

export const notifications: Notification[] = [
  {
    id: "n-1",
    time: "10:14 am",
    title: "Priya shared her record",
    body: "Opened with her OTP. Ekaay’s summary is ready for your 10:30 am consult.",
    href: "/consults/c2",
    tone: "success",
    unread: true,
  },
  {
    id: "n-2",
    time: "10:02 am",
    title: "Waiting for Vikram’s OTP",
    body: "The OTP was sent to his phone. His consult is at 11:15 am.",
    href: "/patients/vikram-sharma",
    tone: "warning",
    unread: true,
  },
  {
    id: "n-3",
    time: "9:58 am",
    title: "Result back: Sana Qureshi",
    body: "Complete blood count from the community pod. Haemoglobin 11.4 g/dL, low.",
    href: "/results",
    tone: "danger",
    unread: true,
  },
  {
    id: "n-4",
    time: "Yesterday",
    title: "Rahul’s emergency QR was scanned on 2 September",
    body: "The discharge summary from his admission is now on his timeline.",
    href: "/patients/rahul-verma",
    tone: "neutral",
    unread: false,
  },
  {
    id: "n-5",
    time: "Yesterday",
    title: "Sana’s access expired",
    body: "It ended on its own 24 hours after her last consult. Ask for a new OTP to reopen it.",
    href: "/patients/sana-qureshi",
    tone: "neutral",
    unread: false,
  },
];

/** Keyed by `patientId:r<position on the timeline>`. */
const recordDetails: Record<string, RecordDetail> = {
  "priya-sharma:r1": {
    source: "Arc Max pod, Sector 1 clubhouse. Run by a trained operator.",
    values: [
      { name: "Fasting glucose", value: "118 mg/dL", range: "Normal: 70 to 99", flag: "high", label: "High", position: 0.8 },
      { name: "Blood pressure", value: "128/84 mmHg", range: "Normal: under 120/80", flag: "borderline", label: "Watch", position: 0.6 },
      { name: "Total cholesterol", value: "212 mg/dL", range: "Desirable: under 200", flag: "borderline", label: "Borderline", position: 0.62 },
      { name: "LDL cholesterol", value: "142 mg/dL", range: "Optimal: under 100", flag: "borderline", label: "Borderline high", position: 0.7 },
      { name: "HDL cholesterol", value: "52 mg/dL", range: "Healthy: 50 or more", flag: "normal", label: "Normal", position: 0.55 },
      { name: "Triglycerides", value: "148 mg/dL", range: "Normal: under 150", flag: "normal", label: "Normal", position: 0.45 },
      { name: "Haemoglobin", value: "12.6 g/dL", range: "Normal: 12 to 15.5", flag: "normal", label: "Normal", position: 0.3 },
      { name: "Creatinine", value: "0.8 mg/dL", range: "Normal: 0.6 to 1.1", flag: "normal", label: "Normal", position: 0.4 },
      { name: "Oxygen (SpO2)", value: "98 percent", range: "Normal: 95 or more", flag: "normal", label: "Normal", position: 0.5 },
    ],
    explains:
      "Fasting glucose is in the prediabetes range and has risen in three tests since 2024. LDL is borderline high and 11 points up on last year. Together they are worth one review.",
  },
  "priya-sharma:r2": {
    source: "City lab PDF, sent by Priya on WhatsApp and read by Ekaay.",
    values: [
      { name: "Total cholesterol", value: "208 mg/dL", range: "Desirable: under 200", flag: "borderline", label: "Borderline", position: 0.6 },
      { name: "LDL cholesterol", value: "139 mg/dL", range: "Optimal: under 100", flag: "borderline", label: "Borderline high", position: 0.68 },
      { name: "HDL cholesterol", value: "51 mg/dL", range: "Healthy: 50 or more", flag: "normal", label: "Normal", position: 0.52 },
      { name: "Triglycerides", value: "152 mg/dL", range: "Normal: under 150", flag: "borderline", label: "Borderline", position: 0.55 },
    ],
    explains: "Close to the pod result five weeks later, which makes a one-off reading unlikely.",
  },
  "priya-sharma:r3": {
    source: "Lab PDF, 18 pages, photographed by Priya and read by Ekaay.",
    values: [
      { name: "Fasting glucose", value: "104 mg/dL", range: "Normal: 70 to 99", flag: "borderline", label: "Borderline", position: 0.62 },
      { name: "LDL cholesterol", value: "131 mg/dL", range: "Optimal: under 100", flag: "borderline", label: "Borderline high", position: 0.64 },
      { name: "Haemoglobin", value: "12.4 g/dL", range: "Normal: 12 to 15.5", flag: "normal", label: "Normal", position: 0.28 },
      { name: "Creatinine", value: "0.8 mg/dL", range: "Normal: 0.6 to 1.1", flag: "normal", label: "Normal", position: 0.4 },
    ],
    explains: "The first test where fasting glucose crossed 99 mg/dL. Family history noted: father has type 2 diabetes.",
  },
  "priya-sharma:r4": {
    source: "Handwritten prescription by Dr S. Rao, photographed by Priya and read by Ekaay.",
    items: [
      "Co-trimoxazole stopped after a rash on day 2",
      "Cetirizine 10 mg at night for 5 days",
      "Avoid sulfa drugs in future",
    ],
    explains: "This is the source of the sulfa allergy shown on her emergency profile.",
  },
};

export function getPatient(id: string) {
  return patients.find((p) => p.id === id);
}

export function getRecord(id: string) {
  return records[id];
}

export function getConsultFor(patientId: string) {
  return consults.find((c) => c.patientId === patientId && !c.day);
}

export function getNominee(patientId: string): Nominee | undefined {
  return nominees[patientId];
}

export function getAllergyTerms(patient: Patient) {
  return patient.allergies.flatMap((allergy) => allergyTerms[allergy] ?? [allergy.toLowerCase()]);
}

export function getConsult(id: string) {
  return consults.find((c) => c.id === id);
}

export function getPrescription(id: string) {
  return prescriptions.find((p) => p.id === id);
}

/** `rid` is `r1` for the newest timeline entry, `r2` for the next, and so on. */
export function getTimelineEntry(patientId: string, rid: string) {
  const record = records[patientId];
  const index = Number(rid.slice(1)) - 1;
  const entry = record?.timeline[index];
  if (!entry || !/^r\d+$/.test(rid)) return undefined;

  const detail: RecordDetail | undefined =
    recordDetails[`${patientId}:${rid}`] ??
    (index === 0 && entry.type !== "prescription"
      ? { source: "Structured values read by Ekaay.", values: record.results }
      : undefined);
  return { entry, detail };
}
