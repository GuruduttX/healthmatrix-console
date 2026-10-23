/*
 * Every word on the welcome page, kept apart from the layout so copy can change without touching
 * a component. Each claim matches what the console does today (durations, labels and limits are
 * the ones in src/lib and the console screens); patients named in previews are made up.
 */

export const nav = [
  { href: "#tour", label: "How it works" },
  { href: "#essentials", label: "Features" },
  { href: "#consent", label: "Privacy" },
  { href: "#join", label: "Join" },
  { href: "#faq", label: "FAQ" },
] as const;

/** The words the hero's last line cycles through: "One calm console for your …". */
export const heroWords = ["schedule", "patient records", "video consults", "prescriptions", "lab results"] as const;

export const marqueeRows = [
  [
    "Admit from the waiting room",
    "Records open with the patient’s OTP",
    "24-hour access, closes on its own",
    "Ekaay summaries",
    "Ask the record",
    "Allergy check before you sign",
    "Print-ready prescriptions",
  ],
  [
    "Booking requests you approve",
    "Consults from 10 to 60 minutes",
    "Time off in a tap",
    "Results as they come back",
    "Every view in the access log",
    "Updates every 30 seconds",
    "Works on your phone",
  ],
] as const;

export type ChapterId = "schedule" | "access" | "ekaay" | "video" | "prescription" | "results";

export const chapters: readonly {
  id: ChapterId;
  eyebrow: string;
  title: string;
  text: string;
  points: readonly string[];
}[] = [
  {
    id: "schedule",
    eyebrow: "Schedule",
    title: "Open your hours. Patients book into them.",
    text: "Set a daily timing, change it for any weekday and choose how long each consult runs. Patients book the open slots from their app.",
    points: [
      "Consults from 10 to 60 minutes, booked up to 30 days ahead",
      "Requests outside your hours wait for your approval",
      "Pause new bookings or take time off; booked consults stay",
    ],
  },
  {
    id: "access",
    eyebrow: "Patient records",
    title: "The full history opens with the patient’s OTP.",
    text: "Request access and the patient, or the nominee they chose, gets a 6-digit code. Once it’s shared, the record is yours to read for 24 hours.",
    points: [
      "Summary, medicines, vaccines, timeline, lab tests and trends",
      "Lab values shown against their range, with the lab’s PDF",
      "Access closes on its own; every view is logged",
    ],
  },
  {
    id: "ekaay",
    eyebrow: "Ekaay",
    title: "Ask the record, get an answer in seconds.",
    text: "Ekaay reads the open record and answers in plain words: what’s out of range, how readings have moved, what clashes with their allergies.",
    points: [
      "An Ekaay summary of the whole history",
      "Suggested questions to start from",
      "It informs; you diagnose and prescribe",
    ],
  },
  {
    id: "video",
    eyebrow: "Video consults",
    title: "Patients wait in the room. You admit them.",
    text: "When it’s time, the patient joins a private waiting room. Admit them when you’re ready, with their record, medicines and Ekaay beside the call.",
    points: [
      "See who’s waiting and for how long",
      "Mute, camera, full screen and rejoin",
      "Write the prescription the moment you end",
    ],
  },
  {
    id: "prescription",
    eyebrow: "Prescriptions",
    title: "Sign with an allergy check built in.",
    text: "Add medicines, advice, lab tests and vaccines. Every line is checked against the patient’s allergies, and a clash stops the signature.",
    points: [
      "Drafts save themselves as you write",
      "Signed digitally under the Telemedicine Practice Guidelines, 2020",
      "Medicines and follow-ups go straight to the patient’s reminders",
    ],
  },
  {
    id: "results",
    eyebrow: "Results",
    title: "Results come back to you.",
    text: "Every test your patients book at a pod, including the ones you order, lands in one list as soon as the lab reports it.",
    points: [
      "Filter new, booked, not booked yet and reviewed",
      "Out-of-range readings flagged on Today",
      "Mark each one reviewed when you’ve read it",
    ],
  },
];

export type EssentialId = "notifications" | "live" | "log" | "bookings" | "phone" | "profile" | "tests";

export const essentials: readonly { id: EssentialId; title: string; text: string }[] = [
  {
    id: "notifications",
    title: "Know the moment it matters",
    text: "A record shared, a result back, a booking made or cancelled, and a nudge ten minutes before each consult. Choose which ones reach you.",
  },
  { id: "live", title: "Always current", text: "Every screen refreshes itself every 30 seconds while it’s open. No reloading between patients." },
  { id: "log", title: "A log both sides can see", text: "Every record you request or open is listed, and the patient sees the same entries in their app." },
  {
    id: "bookings",
    title: "Bookings on your terms",
    text: "Pause new bookings when you need to, block whole or part days off with a private note, and decide on requests outside your hours.",
  },
  { id: "phone", title: "In your pocket", text: "Built for phones as well as desktops. Add it to your home screen and sign in with a one-time code." },
  { id: "profile", title: "A profile patients trust", text: "Photo, qualifications, specialties and languages: patients see it before they share their record with you." },
  { id: "tests", title: "Tests, booked for them", text: "Add lab tests to a prescription. Patients book them at a pod near them, and the results come back to you." },
];

export const consentSteps = [
  { title: "You request access", text: "From the patient’s page, in one click." },
  { title: "They get a 6-digit OTP", text: "Or the nominee they chose, if they can’t respond." },
  { title: "The record opens", text: "For 24 hours, logged on both sides." },
  { title: "Access closes", text: "On its own. They can revoke it sooner." },
] as const;

export const consentStats = [
  { value: 6, unit: "digit", label: "OTP, sent to the patient or their nominee" },
  { value: 10, unit: "min", label: "to use the code before it expires" },
  { value: 24, unit: "hours", label: "of access, then the record closes itself" },
] as const;

export const joinSteps = [
  { title: "Verify your mobile", text: "Enter your number and the one-time code we text you.", fields: ["Mobile number", "SMS code"] },
  { title: "Name and registration", text: "So patients and pharmacists know who signed.", fields: ["Full name", "Registration number", "Medical council"] },
  { title: "Your practice", text: "What you’re qualified in and what you treat.", fields: ["Qualifications", "Specialties"] },
  { title: "Where and how you consult", text: "Then confirm you’ll consult under the Telemedicine Practice Guidelines, 2020.", fields: ["Languages", "State and city"] },
] as const;

export const faqs = [
  {
    question: "What do I need to join?",
    answer:
      "Your mobile number, your medical registration number and at least one specialty and language. Adding your medical council and qualifications is optional but helps patients choose you. You’ll also confirm that you’re a registered medical practitioner consulting under the Telemedicine Practice Guidelines, 2020.",
  },
  {
    question: "How do I open a patient’s records?",
    answer:
      "Click “Request access with an OTP” on their page. The patient, or the nominee they chose, receives a 6-digit code that works for 10 minutes. Once they share it, the record stays open to you for 24 hours and then closes on its own. Every view is logged, and the patient can revoke access at any time.",
  },
  {
    question: "Does Ekaay make clinical decisions?",
    answer:
      "No. Ekaay summarises the record and answers questions about it so you get to the point faster. It can be wrong: it informs, and you diagnose and prescribe.",
  },
  {
    question: "Can I control when patients book me?",
    answer:
      "Yes. Set your hours, change them for any weekday, choose a consult length from 10 to 60 minutes and how far ahead patients can book. You can pause new bookings or take time off, and requests for times outside your hours wait for your approval.",
  },
  {
    question: "What happens after I sign a prescription?",
    answer:
      "It reaches the patient straight away, with your registration number and council on it, and you can print it. Medicines and follow-ups go to the patient’s reminders, and any tests are booked at a pod near them. Signing can’t be undone, so until you sign, the draft stays with you.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "Yes. The console is built for phones as well as desktops, and you can add it to your home screen. Sign in with your mobile number and a one-time code on any device.",
  },
] as const;
