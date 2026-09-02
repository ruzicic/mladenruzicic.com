/**
 * The work system — `/work`, `/work/[slug]` and anything on `/` that has to
 * pair with them.
 *
 * The homepage work rows MUST import `WorkArt` (or at least
 * `workArtTransitionName` / `workTitleTransitionName` + `MORPH_CLASS`) from here
 * so the shared-element morph names match on all three surfaces.
 */
export { CaseStudyHeader, type CaseStudyHeaderProps } from "./CaseStudyHeader"
export {
  ConfidentialityNotice,
  type ConfidentialityNoticeProps,
} from "./ConfidentialityNotice"
export { MediaGallery, type MediaGalleryProps } from "./MediaGallery"
export { MetricStrip, type MetricStripProps } from "./MetricStrip"
export { PrevNextWork, type PrevNextWorkProps } from "./PrevNextWork"
export { Prose, type ProseProps } from "./Prose"
export { relatedTo, RelatedWork, type RelatedWorkProps } from "./RelatedWork"
export { StatusBadge, type StatusBadgeProps } from "./StatusBadge"
export {
  MORPH_CLASS,
  workArtTransitionName,
  workTitleTransitionName,
} from "./transitions"
export {
  FILTER_IDS,
  FILTERS,
  caseStudyLinks,
  filterLabel,
  formatPeriod,
  formatPeriodPart,
  formatYears,
  GROUPS,
  groupOf,
  hostOf,
  isFilterId,
  matchesFilter,
  statusIsLive,
  statusLabel,
  topicsFor,
  type FilterId,
  type GroupId,
  type GroupSpec,
} from "./taxonomy"
export { WorkArt, type WorkArtProps } from "./WorkArt"
export { WorkCard, type WorkCardProps } from "./WorkCard"
export {
  WorkExplorer,
  type ExplorerGroup,
  type ExplorerItem,
  type WorkExplorerProps,
} from "./WorkExplorer"
export { WorkFilters, type WorkFiltersProps } from "./WorkFilters"
export { fallbackMark, WorkMark, type WorkMarkProps } from "./WorkMark"
