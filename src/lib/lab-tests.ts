import { z } from "zod";

/**
 * Lab tests on a prescription, picked from Mobilab's catalog (`src/lib/mobilab.ts`): a health
 * check (Mobilab's "profile", several tests) or a single test. Saved on the prescription with
 * the codes the patient's pod booking will send, so the app can book exactly what was prescribed.
 * Shared by the dialog, the draft and the save action; no server code here.
 */

/** Mobilab's catalog as the dialog lists it. */
export type LabCatalog = {
  /** `id`: the profile's code, or `profile-<number>` for the ones Mobilab gives no code (as in the app). */
  profiles: { id: string; name: string; tests: { code: string; name: string }[] }[];
  tests: { code: string; name: string; sampleType?: string }[];
};

export const labTestInput = z.object({
  kind: z.enum(["profile", "test"]),
  /** A test's code ("HBA1C"), or a health check's id as in `LabCatalog`. */
  code: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, "Name the test.").max(120),
  /** The test codes it covers: its own code for a single test, every test in a health check. */
  tests: z.array(z.string().trim().min(1).max(60)).min(1).max(60),
});

export type LabTestInput = z.infer<typeof labTestInput>;

/** The test code that is in two of the choices, if any: a pod booking can't take one test twice. */
export function overlapOf(tests: LabTestInput[]) {
  const seen = new Set<string>();
  for (const test of tests) {
    for (const code of test.tests) {
      if (seen.has(code)) return code;
      seen.add(code);
    }
  }
  return undefined;
}

export const labTestsField = z
  .array(labTestInput)
  .max(30, "Keep it to 30 tests or fewer.")
  .refine((tests) => !overlapOf(tests), "A test is in more than one of the chosen tests. Remove one of them.");

/** "Liver Function Test, 5 tests" for a health check; a single test by its name. */
export function describeLabTest(test: LabTestInput) {
  return test.kind === "profile" ? `${test.name}, ${test.tests.length} ${test.tests.length === 1 ? "test" : "tests"}` : test.name;
}
