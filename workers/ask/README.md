# Ask, the live backend

A Cloudflare Worker on Workers AI that answers the questions visitors type
into the Ask panel on the site. It speaks about Mladen in the third person,
only from what the site says (`content/ask/context.md`, generated from
`content/**`) and, optionally, from notes kept out of this repository. It
keeps no conversation. It saves each typed question, without the visitor's
address or any other identifier, for 90 days (see "Question log").

The site works without it: prepared questions answer from `content/ask.ts`,
and typed questions fall back to keyword matching and an honest "write to
him" answer. The Worker is switched on by two public variables on the site
(see "Go live").

The Worker was deployed to `ask.mladenruzicic.com` on 2026-11-13 (see "Go
live"). Read `SECURITY.md` for the threat model.

## How it answers

`POST https://ask.mladenruzicic.com/ask` with `{ "question": "…" }`. The
contract, shared by this Worker and the site, is `lib/ask/protocol.ts`:

```
event: delta   data: {"text":"Mladen co-founded TenderLift"}
event: delta   data: {"text":" in September 2025."}
event: done    data: {"outcome":"answer","sources":[{"href":"/work/tenderlift","label":"TenderLift story"}]}
```

A request that gets no answer gets one JSON object with a status and
nothing else: `{ "outcome": "rate_limited", "retryAfter": 60 }`. The Worker
never sends a message, a reason or a stack; the panel owns every line the
visitor reads (`content/ask.ts` `live.messages`).

| Outcome            | Status | When                                                    |
| ------------------ | ------ | ------------------------------------------------------- |
| `answer`           | 200    | streamed; the site answers the question                 |
| `unknown`          | 200    | streamed; in scope, the site does not say (email added) |
| `out_of_scope`     | 200    | streamed; not about his work (no sources)               |
| `challenge_needed` | 401    | no session and no Turnstile token, or the session ended |
| `challenge_failed` | 403    | the Turnstile token did not verify                      |
| `rate_limited`     | 429    | per-minute limit, or a repeat still being answered      |
| `daily_limit`      | 429    | this visitor's questions for the UTC day are used up    |
| `budget_reached`   | 429    | everyone's questions for the UTC day are used up        |
| `unavailable`      | 503    | the model, Siteverify or a secret is missing or slow    |
| `bad_request`      | 4xx    | not what the panel sends (400, 403, 404, 405, 413, 415) |

A stream that breaks after it started ends with
`event: error data: {"outcome":"unavailable"}`; the panel keeps what arrived
and says the answer was cut short.

The system prompt is `src/system-prompt.md` (the rules) followed by the
context and the notes. The model ends its answer with one line,
`<<<META>>>{"kind":…,"sources":[…]}`, which the Worker holds back and
checks: a source that is not in the context's site map is dropped, so the
model cannot invent a link. Links, URLs, unknown email addresses, markdown,
angle brackets and the long dash are stripped from the streamed text.

## The checks, in order

Cheapest first, so abuse costs as little as possible (`src/handler.ts`):

1. path, method, exact `Origin` (the CORS preflight ends here);
2. `Content-Type: application/json`, `Accept: text/event-stream`, a body of
   at most 2 KB in UTF-8, exactly `{ "question": "…" }` of 3 to 500
   characters, and the spam screen (at least two letters, at most one link,
   not mostly a link);
3. an `Ask-Session` or an `Ask-Turnstile` header is present (no I/O);
4. the session's signature (CPU only);
5. the per-minute limit (the rate limiting binding);
6. Turnstile Siteverify, only without a valid session;
7. the repeat memo, the visitor's day and everyone's day, in one Durable
   Object call;
8. the model.

Step 5 runs before step 6 on purpose: a flood of junk tokens is stopped by
the local limiter before it costs a round trip to Siteverify.

A question that got through steps 5 and 6 is written to the question log
once its outcome is known (see "Question log"); one refused earlier is not.

## Challenge and session

The first typed question of a visit carries a Turnstile token in the
`Ask-Turnstile` header. The Worker verifies it with Siteverify (the secret
is a Worker secret), requiring `success`, the action `ask` and one of the
site's hostnames, then returns its own session token in the `Ask-Session`
response header. The panel keeps that token in memory and sends it back
with each later question, so the visitor is checked once a visit, not once
a question.

The session token is `<payload>.<signature>`: the payload holds only a
random id and an expiry (30 minutes, `ASK_SESSION_MINUTES`); the signature
is an HMAC over the payload and the request's exact `Origin`, visitor
(IPv4 address or IPv6 /64) and `User-Agent`. None of those is written into the token or
stored; a token is worthless from another address, browser or site, and
the Worker keeps no session table. When it ends, the Worker answers
`challenge_needed` and the panel runs the check once more by itself.

**Why a header and not a cookie.** The Worker is on another origin
(`ask.` subdomain). A cookie would need `credentials: "include"`, CORS with
`Allow-Credentials`, and `SameSite` care; it would be sent by the browser on
its own (the ambient authority that cross-site request forgery feeds on)
and outlive the visit. A header is sent only by the panel's code, needs no
credentials mode, cannot be attached by another page, and disappears with
the tab. Nothing is gained from a cookie here.

On the site, Turnstile's script is added only when a typed question is
about to be sent: never on page load, never for prepared questions. The
widget runs in **Managed** mode with `appearance: "interaction-only"`: most
visitors see nothing; the few Turnstile is unsure about get one checkbox,
rendered inside the Ask dialog under the question field, reachable by
keyboard, with a status line saying what is happening. Invisible mode was
not chosen: it can never offer that checkbox, so a real visitor it doubts
is simply refused, and Cloudflare requires the site's privacy policy to
reference its Turnstile Privacy Addendum to use it.

## Limits

| Limit                | Default           | Where                                   | Setting                 |
| -------------------- | ----------------- | --------------------------------------- | ----------------------- |
| Per visitor, minute  | 6                 | rate limiting binding, per location     | `ratelimits`            |
| Per visitor, UTC day | 20                | `AskLimits` Durable Object, all regions | `ASK_VISITOR_DAILY_CAP` |
| Everyone, UTC day    | 300               | `AskLimits` Durable Object              | `ASK_DAILY_CAP`         |
| Same question again  | 10 min memo       | `AskLimits`, per session                | code                    |
| Session              | 30 minutes        | signed token                            | `ASK_SESSION_MINUTES`   |
| Output               | 1000 tokens       | the model call                          | `ASK_MAX_TOKENS`        |
| Time                 | 15 s first, 25 s  | the model call                          | `ASK_*_MS`              |

"Visitor" is an IPv4 address, or an IPv6 address's /64 network (one
connection rotates through a whole /64, so the full address would give a
fresh allowance per rotation). Counters are keyed by a keyed hash of that
and the UTC date (`HMAC(signing key, date + visitor)`), so a counter cannot
be turned back into an address, and one day's counters cannot be linked to
the next.
Counters of past days and old memos are deleted by the object's alarm. A
refused question is not counted. A repeat of a question already answered in
the same session within ten minutes is answered from the memo, without the
model and without counting; a repeat sent while the first is still being
answered is told to wait ten seconds.

## Notes kept off GitHub

The context can be extended with one more markdown document that is not in
this repository: one key (`ask-notes`) in one KV namespace (`ASK_NOTES`).
The Worker reads it at run time, keeps it in memory for five minutes, ignores
it if it is over 32 KB, cleans it (comments, control characters, the answer
marker and the question fence removed, headings demoted), and appends it to
the context. A missing key or a failed read means "no notes", never an
error.

```bash
pnpm --dir workers/ask notes:check  ~/Documents/ask-notes.md   # validate, change nothing
pnpm --dir workers/ask notes:upload ~/Documents/ask-notes.md   # put the key (remote)
pnpm --dir workers/ask notes:upload ~/Documents/ask-notes.md --local   # for `pnpm dev`
pnpm --dir workers/ask notes:delete                            # remove the key
```

The script refuses a file inside the repository, checks the size and the
encoding, counts the facts and warns about lines without a source; it never
prints the text. Add `--dry-run` to see the Wrangler command without
running it. The format is the one `content/ask/README.md` describes.

**Not on GitHub is not secret.** Anything the model can read can be drawn
out of it by a determined visitor, whatever the rules say. Put in the notes
only what you would be happy for Ask to say to anyone. They are for facts
that do not belong on a page, not for anything private.

## Choosing the model

`ASK_MODEL` in `wrangler.jsonc` is the only place the model is named.

Default: **`@cf/deepseek-ai/deepseek-v4.1-flash-1017`** (DeepSeek V4.1 Flash).
Read on the model page and the pricing page on 2026-11-12:

- Context window 1,048,576 tokens; the system prompt is about 15,600 tokens
  (`pnpm measure`), so the whole site fits with room to spare.
- $0.30 per million input tokens, **$0.006 per million cached input tokens**,
  $1.20 per million output tokens. Workers AI caches prompt prefixes for this
  model, and the Worker sends `x-session-affinity` so requests reach the
  instance that holds the cached prompt. A question costs about $0.0004 with
  the prefix cached and about $0.005 without (`pnpm measure`).
- Streams, has a `reasoning_effort` switch (`ASK_REASONING`, default `low`),
  and is listed with zero data retention.
- It requires the Workers Paid plan, and paid models are limited to **20
  requests a minute per account** (50 with prepaid AI Gateway credits).

Alternatives checked: `@cf/zai-org/glm-5.3-flash` (reasoning cannot be
switched off) and `@cf/google/gemma-4-26b-a4b-it` (smaller, no prefix-cache
price). To switch, change `ASK_MODEL` (and set `ASK_REASONING` to `""` for a
model without `reasoning_effort`), then run the evaluation before deploying.

## Settings

`vars` in `wrangler.jsonc`, all public:

| Variable                                | Default                     | What it does                                                      |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| `ASK_MODEL`                             | DeepSeek V4.1 Flash         | The Workers AI model id.                                          |
| `ASK_REASONING`                         | `low`                       | `none`, `low`, `high`, `max`; `""` to send none.                  |
| `ASK_MAX_TOKENS`                        | `1000`                      | Hard cap on generated tokens, reasoning included (at most 2000).  |
| `ASK_TEMPERATURE`                       | `0.3`                       |                                                                   |
| `ASK_TIMEOUT_MS` / `ASK_FIRST_TOKEN_MS` | `25000` / `15000`           | Whole answer, and the wait for its first word.                    |
| `ASK_DAILY_CAP`                         | `300`                       | Questions per UTC day for everyone. `0` switches Ask off.         |
| `ASK_VISITOR_DAILY_CAP`                 | `20`                        | Questions per visitor per UTC day.                                |
| `ASK_SESSION_MINUTES`                   | `30`                        | How long a passed check lasts (5 to 120).                         |
| `ASK_ALLOWED_ORIGINS`                   | the two production origins  | Comma-separated, exact.                                           |
| `ASK_ALLOW_LOCALHOST`                   | `false`                     | Local development only (see below).                               |
| `ASK_TURNSTILE_HOSTNAMES`               | the two production hosts    | Hostnames a token must have been solved on.                       |
| `ASK_GATEWAY_ID` / `..._CACHE_TTL`      | empty / `86400`             | Optional AI Gateway, with prompt logging off per request.         |
| `ASK_LOG_RETENTION_DAYS`                | `90`                        | Days a logged question is kept (at most 365). `0`: no log.        |

Secrets, set with `wrangler secret put` and never in a file in this
repository (`secrets.required` makes a deploy without them fail):

| Secret                 | What it is                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| `TURNSTILE_SECRET_KEY` | The Turnstile widget's secret key, from the dashboard.             |
| `ASK_SIGNING_KEY`      | 32 or more random characters; signs sessions, keys the counters.   |

With either secret missing (or the signing key shorter than 32 characters)
the Worker answers `unavailable` to everything: closed, not open. Setting a
new `ASK_SIGNING_KEY` ends every session and restarts the day's per-visitor
counts.

The two account-issued ids the deploy needs, the KV namespace id and the
question log's D1 database id, are kept in the git-ignored
`deploy.local.json` (copy `deploy.local.example.json`:
`notesNamespaceId`, `questionsDatabaseId`), or in `ASK_NOTES_NAMESPACE_ID`
and `ASK_QUESTIONS_DATABASE_ID`. `pnpm run deploy` merges them into the
git-ignored `wrangler.deploy.json` and deploys that. **Do not run
`wrangler deploy` directly**: with no ids in `wrangler.jsonc`, Wrangler would
create a second namespace and a second, empty database and write their ids
back into the committed file. The account comes from `wrangler login` (or
`CLOUDFLARE_ACCOUNT_ID` in your shell); no account id, zone id, database id
or token is in any file here.

## Local development

```bash
cp workers/ask/.dev.vars.example workers/ask/.dev.vars   # then set ASK_SIGNING_KEY
pnpm --dir workers/ask dev
```

`.dev.vars` uses Cloudflare's published Turnstile **test** secret, which
accepts the dummy token `XXXX.DUMMY.TOKEN.XXXX`. Test secrets are honoured
only with `ASK_ALLOW_LOCALHOST=true`; in production one counts as a missing
secret. Point a local site at it with `NEXT_PUBLIC_ASK_ENDPOINT=http://localhost:8787/ask`
and a test site key such as `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
in `.env.local`.

**Workers AI has no local model**: `wrangler dev` runs the Worker locally
but sends inference to the account, so each answered question is billed (a
fraction of a cent). Durable Objects, KV, D1 and the rate limiter are local:
`pnpm dev` applies `migrations/` to a local database first, and questions
asked locally are logged there (`pnpm run questions --local`). Set
`ASK_LOG_RETENTION_DAYS=0` in `.dev.vars` to log nothing locally.

## Go live

Steps 1 to 8 and 10 were run on 2026-11-13: the widget, the notes
namespace, both secrets, the deploy, the smoke test and the two variables in
Vercel. Step 11 waits for the site that reads those variables to be in
production. The question log (added 2026-11-16) has its own one-time setup,
in "Question log"; until it is done, step 7 stops with a message and deploys
nothing. The steps stay here for a rebuild from nothing, and step 7 is
the one to repeat after every change to the site's content, so the model
reads the new text. Commands are from the repository root.

1. **Check the account.** The Cloudflare account must be on the **Workers
   Paid** plan (the default model needs it), and the `mladenruzicic.com`
   zone must be in that same account.
2. **Install and check, offline:**
   ```bash
   pnpm --dir workers/ask install
   pnpm --dir workers/ask test        # context is fresh; offline unit tests
   pnpm --dir workers/ask typecheck
   pnpm --dir workers/ask build       # bundles without deploying (dist/)
   ```
3. **Log in:** `pnpm --dir workers/ask exec wrangler login`, then
   `pnpm --dir workers/ask exec wrangler whoami`. With more than one
   account, `export CLOUDFLARE_ACCOUNT_ID=<id>` in this shell only.
4. **Create the Turnstile widget** (dashboard, Turnstile, Add widget): any
   name, hostnames `mladenruzicic.com` and `www.mladenruzicic.com`, widget
   mode **Managed**, pre-clearance off. Keep the page open: it shows the
   site key (public) and the secret key (secret).
5. **Create the notes namespace**, without letting Wrangler edit the config:
   ```bash
   pnpm --dir workers/ask exec wrangler kv namespace create mladenruzicic-ask-notes
   cp workers/ask/deploy.local.example.json workers/ask/deploy.local.json
   # put the printed id into workers/ask/deploy.local.json (git-ignored)
   ```
   Then create the question log's database the same way ("Question log",
   steps 1 to 3).
6. **Set the two secrets** (Wrangler offers to create the Worker if it does
   not exist yet; say yes):
   ```bash
   pnpm --dir workers/ask exec wrangler secret put TURNSTILE_SECRET_KEY   # paste the widget's secret key
   openssl rand -base64 48 | pnpm --dir workers/ask exec wrangler secret put ASK_SIGNING_KEY
   pnpm --dir workers/ask exec wrangler secret list                       # both names, no values
   ```
7. **Deploy:** `pnpm --dir workers/ask run deploy` (with `run`: plain
   `pnpm deploy` is a different pnpm command). This regenerates the context,
   writes `wrangler.deploy.json`, and creates the Worker, its Durable Object,
   its rate limiter and the custom domain `ask.mladenruzicic.com` with its
   DNS record and certificate.
8. **Smoke test, free** (no token, so it stops at step 3 of the checks):
   ```bash
   curl -i https://ask.mladenruzicic.com/ask \
     -H 'Origin: https://mladenruzicic.com' -H 'Content-Type: application/json' \
     -H 'Accept: text/event-stream' -d '{"question":"What is TenderLift?"}'
   # expect: 401 and {"outcome":"challenge_needed"}
   ```
9. **Optional, the notes:** `pnpm --dir workers/ask notes:check <file>`,
   then `pnpm --dir workers/ask notes:upload <file>`, with a file outside
   this repository.
10. **Switch the site on.** In Vercel, Settings, Environment Variables, for
    Production: `NEXT_PUBLIC_ASK_ENDPOINT=https://ask.mladenruzicic.com/ask`
    and `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<the widget's site key>`. Redeploy
    the site. With both set, the content security policy adds the Worker's
    origin to `connect-src` and `https://challenges.cloudflare.com` to
    `script-src` and `frame-src`, and the panel's foot line changes. Preview
    deployments stay off unless their hostnames are added to the widget,
    `ASK_ALLOWED_ORIGINS` and `ASK_TURNSTILE_HOSTNAMES`.
11. **Try it** on the live site with one typed question; in the browser's
    network panel, Turnstile's script should load only then.
12. **Optional, AI Gateway.** Create a gateway (AI, AI Gateway) and set
    `ASK_GATEWAY_ID`, then deploy again. The Worker sends `collectLog: false`
    on every request, so the gateway never stores questions or answers.

To take Ask offline at once: remove the two variables in Vercel and
redeploy the site, or set `ASK_DAILY_CAP` to `"0"` and deploy the Worker.
To remove it entirely: `pnpm --dir workers/ask exec wrangler delete`, then
delete the question log's database ("Question log").

## Question log

The owner decided on 2026-11-16 that typed questions are saved, so he can
see what visitors ask. The panel says so: "QUESTIONS SAVED ANONYMOUSLY" on
its turn line (`content/ask.ts`).

**What a row holds** (`migrations/0001_questions.sql`, D1 database
`mladenruzicic-ask-questions`, binding `ASK_QUESTIONS`): the time (UTC);
the question as the Worker read it (control, zero-width and bidirectional
characters removed, whitespace collapsed, at most 500 characters); the
outcome; whether it was a repeat answered from the memo; the links offered
under the answer; how long it took, in milliseconds; the input and output
token counts, when the model's stream reports them (empty otherwise); the
model id; and the visitor's country as Cloudflare reports it
(`request.cf.country`). **Never** the address, a hash of it, the session,
the user agent, the referrer or the answer's text, so no two rows can be
tied to one visitor. A question can still hold whatever the visitor typed
into it, a name or an email address included: see `SECURITY.md`.

| Outcome          | When                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| `answer`         | answered from the site                                                  |
| `unknown`        | in scope, the site does not say                                         |
| `out_of_scope`   | the model declined: not about his work, or an attempt to bend the rules |
| `rate_limited`   | the same question sent again while the first was being answered         |
| `daily_limit`    | this visitor's questions for the UTC day were used up                   |
| `budget_reached` | everyone's questions for the UTC day were used up                       |
| `error`          | the model or the limits failed, the stream broke, or it came back empty |
| `timeout`        | the model was too slow to start (15 s) or to finish (25 s)              |

**What is not logged:** anything refused before the visitor check and the
per-minute limit (steps 1 to 6 of "The checks"): a malformed body, the spam
screen, no or a failed Turnstile check, the per-minute limit, a missing
secret, Siteverify unreachable. Anyone can send those without solving a
check, so logging them would let a script fill the log and the bill. The
platform's request logs stay off (see "Logs").

**How it is written.** Once the outcome is known, in the background
(`ctx.waitUntil`), so it never delays or changes an answer: a failed write
is one line, `ask: question log unavailable`, and the visitor sees nothing.
Without the binding (a deploy made before the database existed, the tests)
or with `ASK_LOG_RETENTION_DAYS` at `"0"`, nothing is written and Ask runs
as it did before the log. Nothing in the Worker reads the table: there is
no endpoint for it, and a logged question never goes back to the model.

**How long.** A Cron Trigger runs once a day (`17 3 * * *`, UTC) and deletes
every row older than `ASK_LOG_RETENTION_DAYS` (default 90, at most 365).
With `"0"` no new rows are written and the daily delete keeps the default
90 days, so switching the log off never keeps a question longer. D1 keeps a
restorable history of the database (Time Travel) for 30 days on the Workers
Paid plan, so a deleted row can be restored by the account for up to 30
days after it was deleted; it cannot be switched off.

### One-time setup

From the repository root, logged in as in "Go live", step 3:

1. **Create the database** (Western Europe; Wrangler may offer to add it to
   `wrangler.jsonc`: answer no, the id must not go into the public file):
   ```bash
   pnpm --dir workers/ask exec wrangler d1 create mladenruzicic-ask-questions --location weur
   ```
2. **Keep its id private:** copy the printed `database_id` (a UUID) into
   `workers/ask/deploy.local.json` (git-ignored) next to the notes id:
   ```json
   {
     "notesNamespaceId": "…",
     "questionsDatabaseId": "<the database_id>"
   }
   ```
3. **Create the table** (applies `migrations/` to the remote database; it
   asks to confirm):
   ```bash
   pnpm --dir workers/ask run questions migrate
   ```
4. **Deploy:** `pnpm --dir workers/ask run deploy`. The Worker gets the
   binding and the daily Cron Trigger (a trigger can take up to 15 minutes
   to reach the network).
5. **Check:** ask one question on the live site, then
   `pnpm --dir workers/ask run questions`.

With the log on (`ASK_LOG_RETENTION_DAYS` above 0) and no database id,
`pnpm run deploy` stops before Wrangler runs and says what is missing:
otherwise Wrangler would provision a new, empty database on its own and
every write would fail. To deploy without the log, set
`ASK_LOG_RETENTION_DAYS` to `"0"`: the deploy then leaves the binding out.

### Reading, exporting and wiping

```bash
pnpm --dir workers/ask run questions                         # the last 50, oldest first
pnpm --dir workers/ask run questions --limit 200
pnpm --dir workers/ask run questions --since 2026-11-01      # a UTC date
pnpm --dir workers/ask run questions --outcome out_of_scope,unknown
pnpm --dir workers/ask run questions --outcome failed        # error and timeout; also: refused, limit
pnpm --dir workers/ask run questions --json                  # the same rows as JSON
pnpm --dir workers/ask run questions --all --json > ~/Documents/ask-questions.json   # export
pnpm --dir workers/ask run questions wipe --yes              # delete every row now
```

Each runs `wrangler d1 execute --remote` through a git-ignored
`wrangler.questions.json` that holds only the database and its id. Add
`--local` for `pnpm dev`'s database and `--dry-run` to see the Wrangler
command without running it. A question is printed as data, with control
and bidirectional characters removed, so it cannot move the cursor or
recolour the terminal; still, never paste a logged question into a model as
an instruction. Keep exports outside the repository.

To remove the log entirely: set `ASK_LOG_RETENTION_DAYS` to `"0"`, deploy,
then `pnpm --dir workers/ask exec wrangler d1 delete mladenruzicic-ask-questions`
and remove `questionsDatabaseId` from `deploy.local.json`.

### What it costs

The account is on Workers Paid, which includes 25 billion D1 rows read and
50 million rows written a month and 5 GB of storage (read on 2026-11-16).
A logged question is one insert, which D1 counts as two rows written (the
table and the time index), and the daily delete writes two rows per deleted
question again. At the cap of 300 questions a day that is about 1,200 rows
written a day, some 36,000 a month: under 0.1 % of what is included. Ninety
days at the cap is 27,000 rows of at most about 1 KB each, under 30 MB.
A read scans at most the whole table. Nothing to pay beyond the plan.
(On the Free plan the limits are 100,000 rows written and 5 million read a
day: also far above this.)

## Keeping the context fresh

The context is generated, never edited: `pnpm --dir workers/ask context`
writes `content/ask/context.md` from `content/**` and `content/ask/notes.md`,
and prints every sentence it dropped because it holds a visible placeholder.
`test` fails when the file is stale, and `deploy` regenerates it.

## Testing

- `pnpm test`: offline unit tests with the model, Siteverify, the rate
  limiter, the Durable Object's storage and KV stubbed, and D1 replaced by
  an in-memory SQLite built from `migrations/`: every guard, every outcome,
  the session token, the limits and their sweep, the notes cleaning, the
  question log (a row per outcome, no identifier, no write without the
  binding or with the log off, a failing database changes nothing, the
  daily delete), the deploy config, the abuse set in `eval/cases.ts`, and
  the evaluation checker. No network, no account.
- `pnpm eval`: against a running `pnpm dev`. First the abuse cases (none may
  reach the model), then 30 questions in one session started with the dummy
  token: in scope, unknown, out of scope, prompt injection, extraction,
  private, Serbian, Italian. About 30 billed questions (a few cents); it
  waits 11 seconds between them to stay under the per-minute limit.
  `pnpm eval --abuse-only` costs nothing.
- `pnpm measure`: the prompt's size in tokens and the cost per question.
- On the site, `tests/ask.spec.ts` covers the panel's side: the challenge
  with the published test site keys (Turnstile's script stubbed), the
  session, every outcome's line, and that nothing from Turnstile loads
  before a typed question is sent.

## Logs

`observability` is off, and must stay off. Workers Logs would record
request metadata for every request (URL, headers, the visitor's country and
address); the question log keeps the questions without any of that, and the
panel says the questions are saved anonymously. The console holds one-line
operational errors only (`ask: model timed out`, `ask: a secret is
missing`, `ask: question log unavailable`), never the question, the answer,
a token or an address.

## Documentation relied on (read 2026-11-12)

- Turnstile: client-side rendering and widget configurations,
  https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/ ;
  server-side validation, https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ ;
  testing keys, https://developers.cloudflare.com/turnstile/troubleshooting/testing/ ;
  content security policy, https://developers.cloudflare.com/turnstile/reference/content-security-policy/ ;
  widget modes, https://developers.cloudflare.com/turnstile/concepts/widget/
- Rate limiting binding:
  https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Durable Objects alarms: https://developers.cloudflare.com/durable-objects/api/alarms/
- Workers KV reads and `wrangler kv`: https://developers.cloudflare.com/kv/api/read-key-value-pairs/ ,
  https://developers.cloudflare.com/kv/reference/kv-commands/
- Wrangler configuration (custom domains, `workers_dev`, `secrets.required`,
  `.dev.vars`, automatic provisioning):
  https://developers.cloudflare.com/workers/wrangler/configuration/ and the
  installed `node_modules/wrangler/config-schema.json` (Wrangler 4.154.0;
  `d1_databases` and `triggers` checked again in 4.161.0 on 2026-11-16)
- D1 (read 2026-11-16): pricing and limits,
  https://developers.cloudflare.com/d1/platform/pricing/ ; migrations,
  https://developers.cloudflare.com/d1/reference/migrations/ ; Time Travel,
  https://developers.cloudflare.com/d1/reference/time-travel/ ; and
  `wrangler d1 create|execute|migrations apply --help` in Wrangler 4.161.0
- Cron Triggers (read 2026-11-16):
  https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Workers AI model, pricing, limits, prompt caching:
  https://developers.cloudflare.com/workers-ai/models/deepseek-v4.1-flash-1017/ ,
  https://developers.cloudflare.com/workers-ai/platform/pricing/ ,
  https://developers.cloudflare.com/workers-ai/platform/limits/ ,
  https://developers.cloudflare.com/workers-ai/features/prompt-caching/
