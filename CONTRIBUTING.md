# Working with this Repo

This repo holds the **MacPlants ERP specification** and serves it as a static documentation site via [Docsify](https://docsify.js.org). The single source of truth is [`README.md`](./README.md). Every change is just an edit to that file.

## Who this guide is for

- **Developers** building the ERP — read the spec at the deployed site or directly here on GitHub.
- **You / spec maintainer** — you also need to know how to run the site locally, deploy it, and fold meeting outcomes back in.
- **Stakeholders (Jake, David, Ariane, etc.)** — they don't need this guide. They just visit the deployed URL.

---

## Reading the spec

- **On the live site** (after Netlify deploy): open the URL, use Ctrl+K to search, click any heading in the sidebar to jump.
- **On GitHub**: `README.md` renders as the repo landing page.
- **Locally**: see "Running locally" below.

---

## Running locally

You need Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The spec hot-reloads when you save `README.md`.

---

## Editing the spec

1. Edit `README.md` directly.
2. Commit and push.
3. Netlify auto-deploys on push to `main`.

The structure of `README.md` is treated as canonical — section numbering (`PRD-0`, `PRD-1`, etc.) should not change. Add new sections in the right place, don't reshuffle.

---

## Folding a meeting transcript into the spec

After every spec-relevant meeting, drop the transcript into `transcripts/` (e.g. `transcripts/2026-04-25-erp-walkthrough.md`) and run the update script.

### One-time setup

```bash
cp .env.example .env
# Edit .env and paste in your ANTHROPIC_API_KEY
npm install
```

### Running the update

```bash
node scripts/update-spec.mjs transcripts/2026-04-25-erp-walkthrough.md
```

The script does NOT overwrite `README.md`. It writes:

- `README.proposed.md` — the proposed updated spec
- `update-summary.md` — what changed and why

Review the diff:

```bash
git diff --no-index README.md README.proposed.md
cat update-summary.md
```

Accept the proposal:

```bash
mv README.proposed.md README.md
rm update-summary.md
git add README.md transcripts/
git commit -m "Fold in 2026-04-25 ERP walkthrough"
git push
```

Discard:

```bash
rm README.proposed.md update-summary.md
```

### Rules the script follows

The script is given a tight system prompt that mirrors how the spec has been maintained so far:

- Don't rename, reorder, or remove existing PRD sections.
- Only amend where the meeting genuinely updates the spec — re-discussion of already-correct material is ignored.
- Add new detail as new bullets within existing sections; only add a brand-new PRD section when the topic genuinely doesn't have a home.
- Data Model tables stay in the 3-column format and only list persisted fields.
- Don't fix cosmetic issues (typos, escape characters).
- Append to the action-items list; resolve action items the meeting closes out.
- Don't promote/demote items between Stage 1 and Stage 2 unless the meeting explicitly does so.

If the script's output is wrong in some way, just discard the proposal and either re-run with a cleaner transcript or fold the changes in by hand.

---

## Deploying to Netlify

### First-time setup

1. Push the repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub** → pick this repo.
3. Build settings: leave **Build command** blank, **Publish directory** = `.` (the repo root). `netlify.toml` already encodes this so you shouldn't have to type anything.
4. Deploy. Done — the live URL appears in 30 seconds.

### Subsequent deploys

Just push to `main`. Netlify rebuilds and ships automatically.

### Custom domain

In Netlify → **Site settings → Domain management → Add custom domain** (e.g. `spec.macplants.co.uk`). Netlify will give you the DNS records to point at it.

---

## Adding more interactivity later

The spec is currently a single markdown file rendered by Docsify. If you want richer interactivity — clickable order-lifecycle diagrams, a dedicated schema explorer that pulls all the Data Model tables onto one page, embedded mockups — those can be added as Docsify plugins or by replacing Docsify with a custom React app while keeping `README.md` as the source of truth.

Concrete ideas, in rough order of effort:

1. **Mermaid diagrams in the spec** — add `docsify-mermaid` and embed flow diagrams directly in `README.md` for the order lifecycle, PO flow, etc.
2. **Schema explorer page** — a small custom Docsify plugin that scans `README.md` for tables under "Data Model" headings and renders them on a dedicated `#/schema` route.
3. **Cross-link checker** — a CI script that fails the build if a `(see PRD-X.Y)` reference points at a section that doesn't exist.
4. **Live ERP data overlay** — once the ERP API exists in staging, the docs site can call it to show real plant counts / recent orders inline as live examples.
