import type { Person } from "@/lib/content/schema"

/**
 * "Worked alongside" — people attached to a timeline band. `linkedin` and `note`
 * are deliberately absent: the design data carried placeholder URLs and "Add 1–2
 * paragraphs" stubs, and placeholders never ship. Add real values when Mladen
 * writes them. See content/OPEN-QUESTIONS.md.
 */
export const PEOPLE = [
  {
    id: "radovan",
    name: "Radovan Skendžić",
    where: "Execom · WolkAbout",
    why: "We worked together at Execom and WolkAbout through the IoT platform years, roughly 2016 to 2019.",
  },
  {
    id: "milena",
    name: "Milena",
    where: "Execom · WolkAbout",
    why: "We worked together at Execom and WolkAbout.",
  },
  {
    id: "tamara",
    name: "Tamara",
    where: "Execom · WolkAbout",
    why: "We worked together at Execom and WolkAbout.",
  },
  {
    id: "josip",
    name: "Josip Kozić",
    where: "HEGIAS",
    why: "We worked together at HEGIAS, moving an AR/VR MVP toward a production-ready product.",
  },
  {
    id: "igor",
    name: "Igor Šćekić",
    where: "Execom",
    why: "We worked together at Execom.",
  },
] satisfies Person[]
