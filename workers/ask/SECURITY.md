# Ask: threat model

Ask is a public, anonymous endpoint (`ask.mladenruzicic.com/ask`) that puts
a paid language model behind one question box, in a repository anyone can
read. Everything below assumes the attacker has read this code.

## What is worth protecting

- **Money.** Every answered question is a billed model call.
- **The owner's voice.** Ask must not say things he did not say, commit him
  to anything, or speak for an employer.
- **Visitors.** No address or identifier is stored as written, nothing
  ties a stored question to the person who asked it, and no markup from the
  model reaches their browser. What is stored, and for how long:
  - **The question log** (D1, README.md "Question log"): each typed question
    that passed the visitor check, with the time (UTC), the outcome, the
    links offered, the duration, token counts, the model id and the
    country Cloudflare reports. No address, no hash of one, no session id,
    no user agent, no answer text. Rows older than 90 days
    (`ASK_LOG_RETENTION_DAYS`) are deleted by a daily Cron Trigger; D1's
    Time Travel can restore a deleted row for 30 more days, to the account
    holder only.
  - **The limits** keep counts under keyed hashes of the visitor and the
    day, deleted the next day.
  - **The memo** keeps one session's finished answer (its text, outcome and
    sources, under a keyed hash of the session and the question, never the
    question itself) so a repeat within ten minutes is not billed again.
    The object's alarm deletes an expired memo on its next sweep, so an
    answer is held for at most about 25 minutes (10 minutes of use, a sweep
    every 15).
- **The account.** No id, token or secret is in the repository or in a
  response.

## Threats and defences

### Cost abuse

Scripts asking thousands of questions, or one visitor asking all day.

- Turnstile on the first question of a visit, verified server-side with the
  action `ask` and the site's hostnames; then a signed 30-minute session
  bound to the origin, address and browser, so a solved check cannot be
  shared out to other machines.
- Per-visitor limits: 6 a minute (rate limiting binding) and 20 a UTC day
  (Durable Object, strict across regions), keyed by a keyed hash of the
  IPv4 address or the IPv6 /64, so rotating through one IPv6 network does
  not buy a fresh allowance.
- A global cap of 300 a day, which bounds the worst day at a few dollars.
- Hard caps on the model call: 1000 output tokens, 15 s to the first token,
  25 s in all. The 25 s cover the whole response, writes included: when
  they run out the model call is aborted and the stream closed, even if the
  reader has stopped reading.
- Spam rejected before the model: under three characters, fewer than two
  letters, more than one link, mostly a link, any body that is not exactly
  `{ "question": "…" }`, no `Accept: text/event-stream`.
- Repeats within ten minutes in one session are answered from a memo, not
  the model; a repeat sent while the first is answering is told to wait.
- Cheap checks first: the model is the last of eight steps, and the
  per-minute limit runs before Siteverify.
- `ASK_DAILY_CAP=0` or removing the site's variables takes Ask offline.

### Prompt injection

A question that tries to change the rules, take another role, forge the
answer's final line or add links.

- The question is fenced (`<question>…</question>`, fence tags and the
  answer marker removed from it) and the rules say it is data.
- No history is accepted, so an injection cannot build up over turns.
- The final line is parsed by the Worker; `kind` must be one of three
  values and every source must be in the site map, so the model cannot
  point visitors anywhere new.
- Sources are site paths, `mailto:` or `https:` only (the site map's one
  `http:` archive link is never offered), and ONA's row and shop are offered
  only when the question names ONA.
- The streamed text loses links, URLs, unknown email addresses, markdown
  and angle brackets on its way out.
- The panel renders the answer as text (React text nodes), never as HTML,
  and links only site paths, `https:` and `mailto:` sources, with no
  backslash (browsers read `/\host` as another site).

### Data extraction

Getting the system prompt, the context or the notes out of the model.

- The system prompt is built inside the Worker and never sent to the
  browser; the rules tell the model not to discuss them.
- **Accepted:** the model can be talked into repeating what it reads. The
  context is the public site, and the notes are "not on GitHub", not
  secret; both READMEs say so, and the notes must hold only what the owner
  is happy for Ask to say. Nothing private is ever given to the model.
- Refusals carry an outcome and nothing else: no rule name, no message from
  a dependency, no stack. The console holds one-line operational errors
  only.

### The question log

What a visitor types is kept for up to 90 days, so the log is itself
something to protect, and something an attacker may try to use.

- **A visitor may type personal data into a question** (their own name,
  email address or employer, or someone else's). The Worker cannot tell,
  and stores the question as typed (cleaned of control characters, at most
  500 characters). The panel says questions are saved anonymously, which is
  true of the row (no address, no identifier) but not of what the visitor
  chose to write in it. **Accepted**, with these limits: rows are deleted
  after 90 days (plus up to 30 days in D1's Time Travel history), only the
  account holder can read them, and a single row can be removed on request
  (`wrangler d1 execute ... --remote --command "DELETE FROM questions WHERE
  id = …"`) or everything with `pnpm run questions wipe --yes`.
- **No identifier, by construction.** The writer (`src/questions-log.ts`)
  builds a row from a fixed list of fields and has no field for an address,
  a session, a user agent or the answer; a test fails if the table gains a
  column or a row contains the address, the browser string, the session
  token or the answer text.
- **Write-only.** Nothing in the Worker reads the table and no endpoint
  serves it, so a question cannot be read back by a visitor or fed to the
  model through the log. The owner reads it from his terminal through
  Wrangler, with his own Cloudflare login.
- **Prompt injection, deferred.** A logged question can be written to
  attack whoever reads it later: terminal escape sequences, bidirectional
  overrides, or instructions aimed at a model the owner might paste the log
  into. Control, zero-width and bidirectional characters are removed when
  the question is read from the request and again when it is printed; the
  reader prints questions as data. Never hand logged questions to a model
  as instructions.
- **Filling the log.** Only questions from a checked visitor (a valid
  session or a solved Turnstile) that also passed the per-minute limit are
  logged; everything refused before that is not, so a script without a
  solved check cannot write a row. A checked visitor writes at most about
  6 rows a minute per address (the per-minute limit, per Cloudflare
  location), answered or refused at the daily limits; at that rate one
  address could add some 8,600 rows a day, about 17,000 rows written, far
  under D1's included 50 million a month. **Accepted:** many addresses,
  each solving Turnstile, can add more rows; they cost cents per million
  and are deleted after 90 days. Each row is capped (500 characters of
  question, six links).
- **A failing database changes nothing.** The write happens after the
  outcome is known, in the background; a failure is one console line and
  the answer is untouched. Without the binding, or with
  `ASK_LOG_RETENTION_DAYS` at `0`, nothing is written.
- **The country** comes from Cloudflare (`request.cf.country`), never from
  a header the client sets.

### Cross-site use

Another site calling the endpoint from its visitors' browsers, or
borrowing a visitor's session.

- Exact `Origin` allow-list (no `*`, no wildcard subdomains, no `null`);
  a request without an allowed origin gets 403 and no CORS headers. This
  binds browsers only: a script outside a browser can send any `Origin`.
  Against scripts, Turnstile and the limits are the controls.
- No cookies and no `Allow-Credentials`: the session travels in a header
  only the panel's code sets, so there is no ambient authority to ride.
- The session's signature covers the exact origin, so a token issued to one
  site origin does not work from another.
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`,
  `nosniff` and `no-store` on every response.
- On the site, Turnstile's and the Worker's origins enter the content
  security policy only when both public variables are set.

### Denial of service

Flooding the endpoint, or exhausting the daily cap so real visitors get
"come back tomorrow".

- Cloudflare's network in front, the per-minute and per-day limits per
  visitor, and the global cap, which turns a flood into a bounded bill.
- Bodies are read with a hard 2 KB cap and cut off mid-stream.
- **Accepted:** a distributed attacker with many addresses who also solves
  Turnstile on each can use up the day's global cap. The cost is bounded by
  the cap; the site and its prepared questions keep working; the panel
  says so politely and offers the email.
- **Accepted, in plain terms:** one visitor is one IPv4 address or one IPv6
  /64. Anyone holding a large IPv6 block (a /48 holds 65,536 /64s) counts
  as that many visitors, so the 300-a-day global cap can be used up cheaply
  from one block, one Turnstile solve per /64. That stops Ask for everyone
  until midnight UTC; it does not raise the bill above the cap.

## Also accepted

- **Shared addresses share limits.** The rate limiting documentation
  advises against keying on IP addresses; per-visitor limits here are per
  IPv4 address or IPv6 /64, so people behind one office or mobile network
  share them. With
  20 a day and 6 a minute that is unlikely to bite a personal site.
- **The per-minute limit is per Cloudflare location** and approximate by
  design; the daily limits are the strict ones.
- **Limits are not secret.** They are in this repository, and the outcome
  names which one was reached, so the panel can say when to come back.
  Spam rules are not distinguished: every one is `bad_request`.
- **A changing address or browser ends the session early.** The panel runs
  the check again by itself, usually without the visitor noticing.
- **A failed model call still counts** against the day's limits; the memo
  is cleared so the same question can be asked again.
- **Turnstile itself is a third party.** Visitors who type a question load
  Cloudflare's script and frame; prepared questions never do.
- **Replay of a Turnstile token** within Siteverify's eventual-consistency
  window could yield a second session for the same address and browser. It
  grants nothing the first did not.
- **Request logs are off** (`observability` disabled in `wrangler.jsonc`),
  so no request, header or address is written to Workers Logs; questions
  go only to the question log above, without them. What is also recorded:
  the Worker's `console.error` lines (one line each, such as "ask: model
  timed out" or "ask: question log unavailable", never a question, an
  answer or an address), which are not stored but can be seen live by
  anyone with access to the account (`wrangler tail`, the dashboard's live
  view); Cloudflare's own aggregate analytics for the Worker (request
  counts, status codes, errors, CPU time), for Workers AI (usage) and for
  Turnstile (solves); and whatever Cloudflare keeps under its own policies
  for the network in front. Abuse is seen through those counters and the
  bill.
- **Local development** honours Cloudflare's published test secrets only
  with `ASK_ALLOW_LOCALHOST=true`; in production a test secret counts as a
  missing secret and Ask stays closed.

## Reporting

Write to me@mladenruzicic.com. Please do not test the limits on the live
endpoint: everything here runs offline with `pnpm --dir workers/ask test`.
