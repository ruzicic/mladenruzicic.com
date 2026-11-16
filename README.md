# mladenruzicic.com

<img src=".github/assets/screenshot.jpg" alt="The home page of mladenruzicic.com"/>

The personal site of Mladen Ružičić, live at
[mladenruzicic.com](https://mladenruzicic.com).

Next.js 16, React 19, Tailwind CSS 4 and TypeScript, on Node 22 and pnpm.

```bash
pnpm install
pnpm dev                                   # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm build  # what CI checks
```

End-to-end tests are Playwright: see [`tests/README.md`](tests/README.md).

All copy and data live in `content/`, checked by the zod schemas in
`lib/content/` when the site builds.

Environment variables are optional and set on the host, never here:
`CONVERTKIT_API_KEY` (newsletter), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
`TURNSTILE_SECRET_KEY` (bot check), `NEXT_PUBLIC_ASK_ENDPOINT` (Ask's typed
questions, answered by the Cloudflare Worker in
[`workers/ask/`](workers/ask/README.md)), `NEXT_PUBLIC_FATHOM_SITE_ID`.
Without them the newsletter is offline and Ask answers only its prepared
questions.

## Licence

[LICENSE.md](./LICENSE.md): an MIT-based licence with conditions of its own.
Third-party logos and artwork under `public/` belong to their owners.
