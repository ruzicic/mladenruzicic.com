import type { Person } from "@/lib/content/schema"

/**
 * "Worked alongside" — people attached to a timeline band.
 *
 * Names, LinkedIn URLs, shared employers and overlap years come from their own
 * public profiles (captured 2026-09-02). Surnames carry Serbian diacritics even
 * where LinkedIn prints them stripped, because the rest of the site does.
 *
 * `note` is grounded in what each profile actually says — the current role and
 * the work we shared — and nothing else. No invented anecdotes. Mladen should
 * replace these with his own sentences; see content/OPEN-QUESTIONS.md.
 *
 * Josip has no public profile URL on file, so he ships with `why` alone. That
 * is the intended fallback, not an oversight.
 */
export const PEOPLE = [
  {
    id: "radovan",
    name: "Radovan Skendžić",
    where: "Execom · WolkAbout",
    avatar: "/static/people/radovan.webp",
    linkedin: "https://www.linkedin.com/in/rskendzic/",
    why: "Execom from 2016, then nearly three years together on the WolkAbout IoT frontends, 2017 to 2020.",
    note: "He went from software engineer to frontend team lead over the stretch we overlapped. Now tech lead on AutoScout24 at SMG Swiss Marketplace Group, doing platform modernisation.",
  },
  {
    id: "milena",
    name: "Milena Pajić",
    where: "Execom · WolkAbout",
    avatar: "/static/people/milena.webp",
    linkedin: "https://www.linkedin.com/in/milenapajic/",
    why: "Execom in 2016 and 2017, where she was technical project manager, and then WolkAbout, where she was COO.",
    note: "She was running delivery at Execom long before I arrived, and was already COO at WolkAbout by the time I got there. Now managing partner at DOIT Software Testing Services, founder of MIT Business Solutions, and a Pluralsight author.",
  },
  {
    id: "tamara",
    name: "Tamara Radić",
    where: "Execom · WolkAbout",
    avatar: "/static/people/tamara.webp",
    linkedin: "https://www.linkedin.com/in/tamara-radic/",
    why: "Execom briefly in 2016, then two and a half years at WolkAbout, where she was test manager for the products I was building.",
    note: "Test lead at Execom, test manager at WolkAbout, and now Principal QA Engineer at Symphony — an entire career spent on quality, which is rarer than it should be.",
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
    avatar: "/static/people/igor.webp",
    linkedin: "https://www.linkedin.com/in/igor-scekic/",
    why: "Execom, 2016 to 2017 — we joined the web team within a couple of months of each other.",
    note: "He stayed on to lead JavaScript at Execom and is now a staff software engineer at Anaconda, in the Bay Area.",
  },
] satisfies Person[]
