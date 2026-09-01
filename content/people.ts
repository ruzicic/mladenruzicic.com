import { z } from "zod"

import { parseOrThrow, personSchema, type Person } from "@/lib/content/schema"

/**
 * SEED — "worked alongside". `linkedin` and `note` are OMITTED rather than
 * filled with placeholders; the UI must handle their absence.
 *
 * TODO (owner): supply real LinkedIn URLs and one or two sentences each, or the
 * section ships without people.
 */
export const PEOPLE: Person[] = parseOrThrow(
  z.array(personSchema),
  [
    {
      id: "radovan-skendzic",
      name: "Radovan Skendžić",
      where: "Execom · WolkAbout",
      why: "We worked together at Execom and WolkAbout between roughly 2016 and 2019.",
    },
    {
      id: "josip-kozic",
      name: "Josip Kozić",
      where: "HEGIAS",
      why: "We worked together at HEGIAS, moving an AR/VR MVP toward production.",
    },
    {
      id: "igor-scekic",
      name: "Igor Šćekić",
      where: "Execom",
      why: "We worked together at Execom.",
    },
  ],
  "content/people.ts"
)
