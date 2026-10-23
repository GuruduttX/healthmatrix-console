import Image from "next/image";
import type { ComponentType } from "react";
import { CalendarDays, FlaskConical, House, NotebookPen, ScrollText, Users } from "lucide-react";

import type { ChapterId } from "../content";
import { AccessMock } from "./mocks/access-mock";
import { EkaayMock } from "./mocks/ekaay-mock";
import { PrescriptionMock } from "./mocks/prescription-mock";
import { ResultsMock } from "./mocks/results-mock";
import { ScheduleMock } from "./mocks/schedule-mock";
import { VideoMock } from "./mocks/video-mock";
import styles from "./tour.module.css";

/** The console's own sidebar, as icons: Today, Schedule, Patients, Prescriptions, Results, Access log. */
const rail = [House, CalendarDays, Users, NotebookPen, FlaskConical, ScrollText];

const screens: Record<ChapterId, { title: string; rail: number; Mock: ComponentType<{ play: boolean }> }> = {
  schedule: { title: "Schedule", rail: 1, Mock: ScheduleMock },
  access: { title: "Patients · Ananya Rao", rail: 2, Mock: AccessMock },
  ekaay: { title: "Ananya Rao · Ask the record", rail: 2, Mock: EkaayMock },
  video: { title: "Consult · Ananya Rao", rail: 0, Mock: VideoMock },
  prescription: { title: "New prescription", rail: 3, Mock: PrescriptionMock },
  results: { title: "Results", rail: 4, Mock: ResultsMock },
};

/**
 * A window onto the console showing one chapter's preview. `play` runs its little story; a new
 * chapter remounts the preview, so it starts from the top with an entrance.
 */
export function ConsoleFrame({ chapter, play }: { chapter: ChapterId; play: boolean }) {
  const { title, rail: current, Mock } = screens[chapter];

  return (
    <div className="glass-panel rounded-4xl p-2" aria-hidden>
      <div className="flex h-110 overflow-hidden rounded-[1.625rem] bg-white/55 ring-1 ring-white sm:h-118">
        <div className="relative hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-line bg-white/40 py-3 sm:flex">
          <Image src="/logo-mark.png" width={26} height={26} alt="" className="mb-3" />
          <span className={styles.railMarker} style={{ translate: `0 ${current * 2.5}rem` }} />
          {rail.map((Icon, index) => (
            <span key={index} className={`relative grid size-9 place-items-center rounded-xl transition-colors duration-500 ${index === current ? "text-brand-deep" : "text-muted"}`}>
              <Icon className="size-4.5" />
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <p key={title} className={`${styles.titleIn} min-w-0 flex-1 truncate font-display text-[0.9375rem] font-semibold`}>
              {title}
            </p>
            <span className="hidden h-7 w-28 rounded-full bg-selected sm:block" />
            <span className="grid size-7 place-items-center rounded-full bg-[#dbe9f0] text-[0.625rem] font-bold text-ink-mid">MI</span>
          </div>
          <div key={chapter} className={`${styles.screenIn} min-h-0 flex-1 p-3 sm:p-4`}>
            <Mock play={play} />
          </div>
        </div>
      </div>
    </div>
  );
}
