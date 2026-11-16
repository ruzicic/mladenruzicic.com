# What Ask knows

The live Ask assistant (`workers/ask`) answers from `context.md` in this
folder and, optionally, from one document kept outside this repository
(below). `context.md` is generated from the site's content, so it says
exactly what the site says. **Never edit `context.md` by hand**: it is
overwritten every time it is generated.

## Adding something Ask should know

Write it in `notes.md`, then run:

```bash
pnpm --dir workers/ask context
```

and deploy the Worker (`pnpm --dir workers/ask run deploy`). Rules for a
note, here or in the notes kept off GitHub:

- One fact per line, as a `- ` bullet, in plain words. First person is fine
  ("I take on…"); Ask turns it into the third person.
- End the line with the page it belongs to, for example `(source: /about)`,
  `(source: /mentoring)` or `(source: /#contact)`. Use `(source: /about)` if
  no page says it yet. The generator warns about a line without one.
- Put it under a heading that says what it is about; add headings freely.
- Only what you would say on the record, to anyone, today.

## What must never go in

- Family, relationships, health, religion, politics.
- Money: income, salary, rates, prices, revenue, user or customer numbers
  you have not published.
- Your home address, phone number or anything that locates you more
  precisely than "Ticino, Switzerland".
- Anything about an employer or a client that they have not made public,
  and anything that speaks for them.
- Anything from `docs/` (the private dossier).
- Text in square-bracket capitals (`[LIKE THIS]`): it is treated as a
  placeholder and dropped. The generator lists everything it drops.

The one family line Ask may repeat is the ONA by Alma row in the site's
list, exactly as the site has it.

## Notes kept off GitHub

`notes.md` is public: it is in the repository. For facts that should not
sit in a public repository but that Ask may still use, write a second file
in the same format **outside this repository** (for example
`~/Documents/ask-notes.md`) and upload it:

```bash
pnpm --dir workers/ask notes:check  ~/Documents/ask-notes.md
pnpm --dir workers/ask notes:upload ~/Documents/ask-notes.md
```

It goes to one key in Workers KV; the Worker reads it at run time, and no
deploy is needed. `pnpm --dir workers/ask notes:delete` removes it. The
upload script refuses a file inside the repository and never prints its
text.

**Not on GitHub is not secret.** The model reads these notes, so a
determined visitor can get Ask to repeat them, word for word. Everything in
"What must never go in" above applies to them too. Write only what you
would be happy for Ask to say to anyone who asks.
