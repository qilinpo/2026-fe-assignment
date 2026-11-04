# Meridian Banking — Po Qi Lin

- Deployed: **TODO — add URL after deploying**
- Run locally: `npm install && npm run dev` (Node 22, see `.nvmrc`)

```bash
npm run check      # lint + typecheck + unit/integration tests (Vitest)
npm run build      # production build into dist/
npm run test:e2e   # Playwright, against the production build (see Tests)
```

Add `?debug` to the URL to get a small panel that switches the mock API into
its error, empty and slow modes (see [States](#loading-empty-and-error-states)).

## Project structure

```
src/
  api/          Typed data layer: apiFetch (starter), API types, and queries.ts —
                query options for customer/accounts/transactions/payees and the
                useCreateTransfer mutation. Components never call fetch.
  features/
    dashboard/  Dashboard page: useDashboardData (the three parallel queries),
                BalanceHero, AccountList, TransactionList (+ search), DailyLimitCard,
                DashboardError.
    transfer/   Transfer dialog: TransferDialog (native <dialog> shell),
                TransferFlow (one form, step machine, sending), the three steps,
                SuccessPanel, schema.ts (every validation rule), transferRequest.ts
                (form → API body), sendError.ts (API error → messages).
  components/   App-agnostic UI: Button, IconButton, Field (label/hint/error wiring),
                SearchInput, Skeleton, EmptyState, Header.
  theme/        Light/dark + Retail/Premium: a tiny store over <html data-*>,
                ThemeToggle, SegmentSwitch. The pre-paint script is in index.html.
  lib/          Pure helpers: format.ts (starter), accounts.ts (total, remaining limit).
  debug/        The ?debug panel and the switch it controls.
  test/         Test setup, renderApp, dialog polyfill for jsdom, shared helpers.
e2e/            One Playwright journey test.
```

Each feature owns its components, styles and tests; `components/` holds only
things with no knowledge of banking. CSS is plain CSS per component, using
only the design tokens.

## Decisions and trade-offs

### Server state vs UI state

- **All API data lives in TanStack Query.** No API data is copied into
  `useState`. The total available, the remaining daily limit and the search
  results are worked out on each render from the cached data, never stored.
- **The dashboard fires its three queries in parallel** (`useDashboardData`).
  Each section renders its own skeleton while its data is `undefined`, inside
  the same markup as the loaded state. That's why nothing jumps (verified as
  0 layout shift at 360–1280 px).
- **When the dashboard counts as failed:** only when a query has *no* data.
  A failed background refetch keeps the last good numbers on screen instead
  of replacing the page with an error.
- **After a transfer I invalidate customer, accounts and transactions rather than patching the cache with the response.**
  - The response only has the new balance and limit, not the new transaction,
    so patching would mean building a transaction on the client to mimic the
    server.
  - Invalidating keeps the server as the single source of truth, for the cost
    of 3 small requests.
  - `onSuccess` returns the refetch promise, so the mutation stays pending —
    and the button keeps saying `Sending…` — until the fresh data has arrived.
    The success screen never sits over stale balances.
- **Search (D6) filters the 8 loaded rows in the browser** instead of using
  `?q=`. The brief says search the recent list, and filtering locally is
  instant: no request per keystroke and no loading state while typing.
  The catch: it can't find older transactions. If that were needed, I'd switch
  to `q` with a debounce and a `limit`.
- **Requests can be cancelled.** Query functions pass TanStack's `signal` to
  `fetch`. A side effect is that in **dev only** you'll see each dashboard
  request twice: React StrictMode's simulated unmount aborts the first one.
  The production build makes exactly 3 requests (checked).

### Forms and validation

- **Every rule is defined once,** in `features/transfer/schema.ts`
  (`fieldRules`). `createTransferSchema()` builds the schema from live data,
  so the balance and limit messages show the real amounts. The same schema
  checks fields on blur, checks each step on Continue (`trigger(stepFields)`),
  and checks everything again on Confirm (`handleSubmit`).
- **All rules run inside one `superRefine`,** not as per-field object schemas
  plus refinements. Zod skips object refinements as soon as any field fails.
  That would let step 1 pass while the amount field (not on screen yet) was
  empty, and it would hide cross-field errors. A single refinement also lets
  the new-recipient fields be checked only when "Send to someone new" is
  chosen.
- **There is one React Hook Form across all three steps.** Steps only decide
  which fields are on screen, so `Back` keeps everything.
- **Focus goes to the first invalid field in on-screen order:** after the
  errors render, the form focuses the first `[aria-invalid="true"]`. RHF's own
  `shouldFocus` can't focus a radio group. Its `setFocus` picks whichever radio
  *registered* first, which was "Send to someone new" because it renders while
  payees are still loading.
- **Errors from the API** (`sendError.ts`):
  - A 4xx with `fields` shows the API's `message` in a `role="alert"` banner on
    the review step. The field messages are also attached to their fields with
    `setError`, so after `Back` they appear under the right input.
  - A 5xx or network failure shows the brief's "Your money hasn't left your
    account" copy.
- **No double sends:** the API sends money twice for two identical requests.
  - `isPending` only updates after a re-render, so a ref guard drops the
    second submit of a fast double-click. A test proves it: removing the guard
    makes it fail with 2 requests.
  - The button uses `aria-disabled`, not `disabled`, so keyboard focus stays
    on it and the user can retry after a failure.

### Dialog

- **The dialog is the native `<dialog>` with `showModal()`.** The browser
  provides the top layer, the inert background (focus can't escape), and Esc.
  My code only moves focus in, and back to the opener on close.
- **It's mounted only while open,** so each transfer starts clean.
- **Showing it:** `showModal()` runs in a layout effect, so the dialog is
  already open when children focus the step title. Focus returns in a passive
  effect's cleanup, which runs after the dialog has left the DOM and the page
  is no longer inert.
- **Layout:** a full-screen sheet below 1024 px, and a centred 520 px dialog
  above.
- **Style fixes for the native element:** Chrome's built-in dialog style
  (`overflow: auto`, `inset: 0`) needed `overflow: hidden` and
  `height: fit-content` overrides.

### Theming

- **Theme and segment live only on `<html data-theme data-segment>`.**
  - An inline classic script in `index.html` reads `localStorage`, falls back
    to `prefers-color-scheme`, and sets the attributes before first paint, so
    there's no flash.
  - React reads those attributes through a small `useSyncExternalStore` store
    (`theme/preferences.ts`). The desktop and mobile segment switches share
    one value.
- **Colours come only from the tokens.** The one tricky spot is the balance
  card:
  - Its button and focus ring use `--on-hero` and `--hero-from`, because the
    brand-coloured button and the brand-coloured focus ring would vanish
    against the brand gradient.
  - axe reports 0 violations in all four theme/segment combinations, on every
    screen. The gradient (which axe can't judge) was checked by hand:
    worst case 5.86 : 1.

### Choices where the brief was open

- **Segment default:** Retail (her API `segment`) until the user picks one.
  The pre-paint script can't wait for the API, and the two agree for Ava.
- **Greeting:** `Good evening, {firstName}`, so it doesn't hard-code "Ava".
- **Account cards:** deposit cards are labelled `Available`, matching the
  credit card's `Amount due`.
- **Long text on mobile:** transaction descriptions shorten to one line with
  an ellipsis, with the full text in a `title` tooltip, so every row has a
  fixed height and nothing shifts.
- **Bank field:** a fixed list of 8 Singapore banks, in a native `<select>`.
  On phones this opens the OS picker. (In Chrome DevTools device mode, the
  desktop drop-down can spill outside the emulated frame. That's an emulation
  quirk, not something phones show.)
- **Error wording I wrote:**
  - "Choose who you're sending to."
  - "Enter a name between 2 and 50 characters."
  - "Choose a bank."
  - "Enter an amount."
  - "Enter a valid amount, like 120.50."
  - "Use at most 2 decimal places."
  - "The minimum transfer is SGD 1.00."
  - "Keep the note to 50 characters or fewer."

### Libraries added

- **`@playwright/test`,** for the one e2e test. It runs against the
  production build, so it also checks that the MSW worker works in the
  deployed bundle.
- Nothing else: no component library, no icon library (inline SVG), no CSS
  framework.

## Loading, empty and error states

On the deployed site, add **`?debug`** to the URL and open the **Debug**
panel (bottom left). It applies the mock API's `scenario`/`delay` hooks to
every GET, then reloads the data. It's hidden without `?debug`, so it isn't a
permanent "break the app" button.

| State | How it's handled | How to see it |
| --- | --- | --- |
| Dashboard loading | Skeletons in the real layout; `aria-busy` on the page | Every load (~500 ms), or Debug → **Slow (3 s)** |
| Dashboard error | `We couldn't load your dashboard.` + `Retry`, which refetches only the failed queries | Debug → **Errors (500)**, then **Normal**, then press **Retry** |
| No accounts / transactions | `No accounts to show.` / `No transactions yet.` | Debug → **Empty lists** |
| No search matches | `No transactions match your search.` + `Clear search` (the ✕ and Esc also clear) | Search for `zzz` |
| Payees loading / failed / empty | Skeleton rows; error + `Retry`; "no saved payees yet". `Send to someone new` always works | Debug → Slow / Errors / Empty, then **New transfer** |
| Field errors | Under the field, linked with `aria-describedby`; first invalid field focused on Continue | Continue with nothing filled in; amount `5000` from checking (over balance); `6000` from savings (over the daily limit) |
| Sending | `Sending…`, button locked | Confirm any transfer |
| Send failed | `role="alert"` banner on the review step, data kept, Confirm works again | Put **`#fail`** in the note |
| Success | `Transfer sent`, amount, recipient, API reference; announced via `aria-live`; dashboard already refreshed | Any normal transfer |

## Tests

52 Vitest tests (jsdom, React Testing Library, MSW) plus 1 Playwright journey
on 2 devices. Tests drive the whole `<App>` through roles and labels, as a
user would, against the real mock API. Edge cases override one response with
`server.use`.

**The three required by the brief** (named by ID so they're easy to find):

- **E4 #1** — `TransferForm.test.tsx`: an amount over the balance shows the
  exact error, focuses the field, and **no `POST` is sent**. Every request the
  mock server sees is recorded to prove it.
- **E4 #2** — `TransferSend.test.tsx`: Confirm → `Sending…` (locked) →
  success screen with reference and live announcement. It checks the exact
  request body. Then, back on the dashboard: total `17,000.55`, checking
  `4,160.55`, `Transfer to Jamie Tan` first, `4,880.00` left on the daily
  limit, and focus back on `New transfer`.
- **E4 #3** — `Dashboard.test.tsx`: accounts returns 500 once → the error
  appears → `Retry` loads the dashboard.

**Other cases, and why I picked them:**

- **Where bugs are likely or costly:**
  - T7: a failed send keeps the data, shows the exact copy, and retry works.
  - API field errors appear on the right field.
  - A double-click sends one request.
  - The balance rule re-checks when the account changes.
  - Exact-balance boundaries: `4280.55` passes, `4280.56` fails.
- **Accessibility promises in the brief (T1, T8):**
  - Focus moves into the dialog, and back to the opener on Esc and ✕.
  - Payees work as a radio group.
  - Field errors are checked with `toHaveAccessibleDescription` — what a
    screen reader would actually announce — rather than by reading
    `aria-describedby` ids.
- **D1:** the three dashboard requests all start before the first response
  returns (recorded from the mock server's events).
- **TH1:** the *actual* inline script from `index.html` (imported with
  `?raw`), run against a stubbed `matchMedia` and `localStorage`: system
  setting on first visit, saved choice wins, junk values ignored.
- **Unit tests** for the schema rules, the request builder, totals and the
  remaining limit.

**End-to-end** (`e2e/transfer.spec.ts`):

- **What it runs:** the full journey against `vite preview` of the production
  build, in desktop Chrome and on a Pixel 7.
- **What it adds over the jsdom tests:** the real `<dialog>`, real focus
  handling, the MSW service worker in the built bundle, and no console errors.
- **Proof it can fail:** with cache invalidation disabled, it fails on the
  stale total.

```bash
npx playwright install --with-deps chromium   # once (installs system libs; needs sudo on Linux)
npm run test:e2e
```

**Not tested automatically:** visual layout (sticky and fixed positioning,
layout shift, contrast), because jsdom does no layout. I checked those in
Chromium with Playwright scripts and axe during development (results above),
but they aren't in the repo.

## AI use

I used **Claude Code** (in VS Code) as a pair programmer. It proposed the
plan, wrote most of the first drafts of components, styles and tests, and ran
the checks and headless-browser probes. I reviewed each phase, tested it
myself in the browser and DevTools, and committed phase by phase.

Places where I changed, rejected or fixed what it produced:

1. **Layout shift and the button over the header.** In my own testing, the
   dashboard still jumped slightly when data arrived, and `New transfer`
   scrolled over the sticky header. The AI's first skeletons only roughly
   matched text height, and the daily-limit text wrapped differently once
   loaded. The header bug came from a `z-index` on a flex item, which creates
   a stacking context even when the element is static. Both were fixed and
   then measured (0 layout shift).
2. **Button placement.** I checked the layout against the wireframe's "right
   rail 300px" spec and asked for `New transfer` to move into the
   `Total available` row, where the wireframe puts it. That needed new
   on-gradient colours and a visible focus ring, because the brand-coloured
   versions disappeared against the card.
3. **Copy and controls.** I changed a validation message's curly apostrophe
   to a straight one, to match the brief's copy style. I questioned the bank
   `<select>` opening off-screen in DevTools; after looking into it, I kept
   the native control, because phones use their own picker.

## Not done / known issues

- **Optional items done:** the daily-limit progress bar, the debug menu and
  one e2e test.
- **Optional items skipped:** `Discard this transfer?`, the `#transfer` deep
  link, the balance-hide toggle, a third segment, and the CI workflow.
- **No guard against closing mid-send.** Closing the dialog while a transfer
  is sending is allowed. The request finishes and the dashboard still
  refreshes, but the user doesn't see the success screen. I'd either block
  closing while sending or show a toast.
- **Silent background-refresh failures.** If a background refetch fails, the
  dashboard keeps the last good data without saying it's stale. A small
  "Couldn't refresh" notice would be better.
- **Debug scenario isn't remembered.** It resets on page reload (by design,
  since it's only for demoing).
- **Search can't reach older transactions.** It only covers the 8 loaded
  rows; see the search decision above.
