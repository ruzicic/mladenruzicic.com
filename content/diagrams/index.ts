import type { DiagramData } from "@/lib/content/schema-diagrams"

import { HEGIAS_DIAGRAMS } from "./hegias"
import { STUDENTI_RS_DIAGRAMS } from "./studenti-rs"
import { TENDERLIFT_DIAGRAMS } from "./tenderlift"

/** Every case-study diagram, by id. */
export const DIAGRAMS: ReadonlyMap<string, DiagramData> = new Map(
  [...STUDENTI_RS_DIAGRAMS, ...HEGIAS_DIAGRAMS, ...TENDERLIFT_DIAGRAMS].map(
    (d) => [d.id, d]
  )
)
