import { defineDiagrams } from "@/lib/content/schema-diagrams"

/**
 * The HEGIAS diagram. Never name the conversion's language, the 3D tool it
 * ran in or the cloud provider (owner, 2026-11-12). Open items are listed in
 * docs/v4-build/PLACEHOLDERS.md under "Diagrams: waiting for the owner".
 */
export const HEGIAS_DIAGRAMS = defineDiagrams("content/diagrams/hegias.ts", [
  {
    id: "hegias/model-to-headset",
    form: "pipeline",
    title: "From model to headset",
    lead: "An architect drops a building model into the browser, and it comes back as a scene light enough to walk through in a headset, alone or together.",
    leadShort:
      "A building model becomes a scene light enough to walk through in a headset.",
    caption:
      "A building got into a headset in four moves: exported as it was, uploaded through the browser, converted in the cloud into a light 3D file, and opened in a browser that could step into VR.",
    alt: "A pipeline: 3D or BIM files are uploaded, converted in the cloud to a compact GLB file, opened in the browser and viewed in a VR headset; a branch shows several people joining the same scene.",
    chain: [
      {
        kind: "stack",
        label: "Any 3D or BIM export",
        tabs: [
          { label: "C4D", type: "plain" },
          { label: "OBJ", type: "plain" },
          { label: "FBX", type: "plain" },
          { label: "IFC", type: "plain" },
        ],
      },
      { kind: "arrow", verb: "Upload" },
      { kind: "cell", label: "Processing", sub: "Cloud" },
      { kind: "arrow", verb: "Convert" },
      { kind: "file", tab: { label: "GLB", type: "page" } },
      { kind: "arrow", verb: "Open" },
      { kind: "window", label: "Browser" },
      { kind: "arrow", verb: "Enter VR" },
      { kind: "headset", label: "Headset" },
    ],
    branch: { at: 6, kind: "together", label: "Together", verb: "Join" },
    ledger: [
      // Open: which tools the architects exported from, in his words.
      {
        name: "Export",
        note: "From the tool the architect already uses.",
        short: "From the architect\u2019s own tool.",
      },
      {
        name: "Upload",
        note: "The browser checks the files before they leave.",
        short: "Checked in the browser first.",
      },
      // Open: the conversion's language and where it ran. Never shown.
      {
        name: "Convert",
        note: "Simplified, sorted into floors and walls, saved as a light GLB.",
        short: "Simplified into a light GLB.",
      },
      {
        name: "Open",
        note: "Walk through it, furnish it, change materials. All a client needs is a link.",
        short: "Walk through it from a link.",
      },
      // Open: when the Quest support shipped, and to whom.
      { name: "Enter VR", note: "The same page, in a headset." },
      {
        name: "Together",
        note: "Several people in one scene, with voice.",
        short: "Several people, one scene.",
      },
    ],
  },
])
