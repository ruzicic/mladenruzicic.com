import type { StoryRole } from "@/lib/content/schema"
import { Icon } from "@/app/components/primitives/Icon"

/**
 * A story's roles, oldest first, in the panel in place of its paragraphs
 * (`panel.timeline`; the owner, 13 Nov 2026: "a minimalistic
 * timeline-accordion on the left side, and for each of the roles say what
 * happened and how I moved forward").
 *
 * A list of native `<details>` sharing one `name`, so opening one closes the
 * one before; the current role is open on load. No JavaScript: the browser
 * opens and closes them, keyboard included, and closed text stays in the
 * DOM, readable by assistive technology and by find-in-page. The hairline,
 * the markers and the short height-and-fade (where `::details-content` can
 * be animated) are in `app/styles/story.css` (`.cs-roles`).
 */
export function StoryRoles({
  roles,
  label,
  name,
}: {
  roles: StoryRole[]
  /** The list's accessible name. */
  label: string
  /** The exclusive group, unique on the page. */
  name: string
}) {
  return (
    <ol className="cs-roles" aria-label={label}>
      {roles.map((role) => (
        <li
          key={role.dates + role.title}
          className="cs-role"
          data-current={role.current ? "" : undefined}
        >
          <details name={name} open={role.current ?? false}>
            <summary className="cs-role-sum">
              <span className="cs-role-head">
                <span className="cs-role-dates">{role.dates}</span>
                <span className="cs-role-title">{role.title}</span>
              </span>
              {/* Plus closed, minus open: the vertical bar turns flat. */}
              <Icon name="plus-minus" size={12} className="cs-role-chev" />
            </summary>
            <div className="cs-role-body">
              {role.blocks.map((b) => (
                <div key={b.label} className="cs-role-block">
                  <p className="cs-role-label">{b.label}</p>
                  <p className="cs-role-text">{b.text}</p>
                </div>
              ))}
            </div>
          </details>
        </li>
      ))}
    </ol>
  )
}
