# Who I am, what this repo is

**Who I am:** Sigurd, the project manager for the MacPlants ERP project. This repo is the **specification** for that project, not its source code. The actual ERP build lives elsewhere (or not yet at all). My day-to-day work here is reviewing, refining, and explaining the spec — both to myself and to the client (MacPlants).

**What this repo is:** A documentation site. The canonical content lives in:
- `README.md` — the working spec (single source of truth)
- `project-spec/YYYY-MM-DD.md` — dated snapshots of the spec
- `transcripts/` — meeting transcripts that get folded into the spec via `scripts/update-spec.mjs`

The Vite + React app under `app/` is the *viewer* for these docs, not the project itself.
