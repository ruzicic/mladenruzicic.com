import { ViewTransition, type ReactNode } from "react"

import { askLiveConfig } from "@/lib/ask/site-config"
import {
  getAsk,
  getMedia,
  getPress,
  getProductMark,
  getSite,
} from "@/lib/content"
import type { ProductMark } from "@/lib/content/schema"

import { AskButton } from "../ask/AskButton"
import type { AskClientData, AskImageMeta } from "../ask/types"
import { NameMenu } from "./NameMenu"

export interface TopBlockProps {
  /** The muted line under the name. Defaults to `getSite().line`. */
  line?: string
  /** `/`: the name is a button with the press menu, not a link home. */
  home?: boolean
  /**
   * The row's ends in place of the name and Ask (the CV, 17 Nov 2026: a
   * close control at the left, its Download PDF at the right). Same row,
   * height and edges; Ask is then not rendered at all.
   */
  start?: ReactNode
  end?: ReactNode
}

/** Everything the Ask island needs, so the client never loads content code. */
function askClientData(): AskClientData {
  const ask = getAsk()
  const press = getPress()
  const site = getSite()
  const liveConfig = askLiveConfig()

  const marks: Record<string, ProductMark> = {}
  const images: Record<string, AskImageMeta> = {}
  const addMark = (slug: string) => {
    const m = getProductMark(slug)
    if (m) marks[slug] = m
  }
  const addImage = (src: string) => {
    const m = getMedia(src)
    if (m) images[src] = m
  }
  for (const card of [...ask.questions.map((q) => q.card), ask.fallback.card]) {
    if (card.kind === "product") {
      addMark(card.ref)
      addImage(card.image.src)
    } else if (card.kind === "link") {
      if (card.visual.kind === "tile") addMark(card.visual.ref)
      if (card.visual.kind === "image") addImage(card.visual.image.src)
    }
  }

  return {
    label: ask.label,
    closeLabel: ask.closeLabel,
    ariaOpen: ask.ariaOpen,
    dialogLabel: ask.dialogLabel,
    title: ask.title,
    note: ask.note,
    suggestionsLabel: ask.suggestionsLabel,
    inputLabel: ask.inputLabel,
    placeholder: ask.placeholder,
    sendLabel: ask.sendLabel,
    thinkingVerbs: ask.thinkingVerbs,
    // With the live model behind it, the panel is no longer scripted.
    footNote: liveConfig ? ask.live.footNote : ask.footNote,
    savedNote: ask.savedNote,
    maxTurns: ask.maxTurns,
    done: ask.done,
    questions: ask.questions.map((q) => ({
      id: q.id,
      chip: q.chip,
      question: q.question,
      answer: q.answer,
      source: q.source,
      sourceHref: q.sourceHref,
      card: q.card,
      keywords: q.keywords,
    })),
    chipsShown: ask.chipsShown,
    fallback: ask.fallback,
    liveConfig,
    live: {
      sourcePrefix: ask.live.sourcePrefix,
      noSource: ask.live.noSource,
      checking: ask.live.checking,
      interactive: ask.live.interactive,
      cutShort: ask.live.cutShort,
      messages: ask.live.messages,
      wait: ask.live.wait,
    },
    bio: press.shortBio.text,
    marks,
    images,
    name: site.name,
    line: site.line,
  }
}

/**
 * The Ask button in its slot (`.site-top__ask`), as the right end of a
 * header: the top block's, or a case study's bar (`StoryBar`). A shared
 * element of the page transition (`site-ask`), so it travels from one
 * header's place to the other's.
 */
export function AskSlot() {
  return (
    <ViewTransition name="site-ask" share="vt-travel" default="none">
      <div className="site-top__ask">
        <AskButton data={askClientData()} />
      </div>
    </ViewTransition>
  )
}

/**
 * The top block every page but a case study shares (`Landing.dc.html`'s
 * `<header>`): his name with its press menu, the muted line under it, and
 * the Ask button, aligned as one unit on the 540px column. Not the page's
 * `<h1>`: on `/` the headline is, elsewhere the page title is. A case study
 * has its own bar instead (`app/components/story/StoryBar.tsx`).
 *
 * The two ends are shared elements of the page transition (`site-name`,
 * `site-ask`; `vt-travel` in `app/styles/site.css`): going to a case study,
 * the name block travels to the bar's back link and the Ask button to the
 * bar's right end instead of jumping there. Same place on both pages, they
 * do not move at all. Under reduced motion the transition has no duration,
 * a plain swap.
 */
export function TopBlock({ line, home = false, start, end }: TopBlockProps) {
  if (start || end)
    return (
      <header id="top" className="site-top" data-ends="">
        <div className="site-top__id site-top__start" data-top-id="">
          {start}
        </div>
        {end ? (
          <ViewTransition name="site-ask" share="vt-travel" default="none">
            <div className="site-top__end">{end}</div>
          </ViewTransition>
        ) : null}
      </header>
    )
  const site = getSite()
  const press = getPress()
  const name = (
    <NameMenu
      home={home}
      name={site.name}
      menu={press.menu}
      bio={press.shortBio.text}
      headshot={press.headshot.download}
    />
  )

  return (
    <header id="top" className="site-top">
      <ViewTransition name="site-name" share="vt-travel" default="none">
        <div className="site-top__id" data-top-id="">
          {name}
          <p className="site-top__line">{line ?? site.line}</p>
        </div>
      </ViewTransition>
      <AskSlot />
    </header>
  )
}
