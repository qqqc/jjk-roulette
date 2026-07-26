# AGENTS.md — 咒术转盘 (JJK Roulette)

## Project overview

Single-file static web app: a Jujutsu Kaisen themed character generator roulette.
- `index.html` (~1380 lines) — everything: HTML structure, CSS styles, embedded JS game engine, and embedded data (`SEED_DATA`).
- No build step, no package manager, no framework.
- Runs by opening `index.html` in a browser.

## Critical: SEED_DATA is JavaScript, not JSON

The game data is defined as `const SEED_DATA = {phases:[...]}` inside a `<script>` block. This is a **JS object literal**, not JSON:
- Single quotes, trailing commas, unquoted keys are all legal.
- **BUT `{}/[]` bracket balance must be exact.** A single missing/misplaced `}`, `]`, or `"` inside a `d:"..."` string will silently kill the entire script, making the page appear blank with no errors visible.

**Every time SEED_DATA is edited, run the validation script:**
```
.\check-braces.ps1
```
This checks `{}` balance, `[]` balance, and `d:"..."` string integrity via Python regex. See `BUG-TRACKER.md` for common failure patterns.

## Pre-commit hook

`.git/hooks/pre-commit` runs `check-braces.ps1` automatically on commit. If it fails:
- Fix the brackets, or
- `git commit --no-verify` to bypass (emergency only).

## Data loading

1. On page load, `SEED_DATA` is cloned into `DATA`.
2. If `localStorage` contains `jjk_data` (saved by the in-app editor), it overrides `DATA`.
3. `data.json` at repo root is a simplified JSON backup — it **diverges** from SEED_DATA in structure (different items, fewer phases). Do not use it as the source of truth for the app.

## Architecture

- **Phases** (`DATA.phases[]`) → **Rounds** (`phase.rounds[]`) → **Items** (`round.items[]`).
- Rounds are filtered by `cond` (trait or dimension check like `天赋|>=|A`), then sorted by `order`.
- Each item has `w` (weight for roulette probability) and optional `wMods` (conditional weight multipliers).
- Effect system: items apply `tags`, `dim` (set dimension level), and `dimMod` (adjust dimension level by ±N).
- Dimension scale: `E-`, `E`, `D`, `C`, `B`, `A`, `S`, `SS`, `SSS`, `EX`.
- Game state persisted to `localStorage` under `jjk_state`.
- The in-app editor (gear icon) modifies `DATA` in memory; "Save" writes to `localStorage` key `jjk_data`.

## Key files

| File | Purpose |
|------|---------|
| `index.html` | The entire app |
| `index_bak.html` | Older backup (404 lines), diverged CSS/structure |
| `check-braces.ps1` | Bracket validation script |
| `BUG-TRACKER.md` | Root cause analysis of crash bugs |
| `data.json` | Simplified static JSON backup (diverged from SEED_DATA) |
| `*.py` | Video frame extraction / OCR tooling (all gitignored) |
| `test_simple.html`, `test_wheel.html` | Standalone wheel canvas prototypes |

## SEED_DATA editing safety rules

When editing SEED_DATA items, these are the most common crash-causing mistakes:

1. **Unescaped double quotes in `d:"..."` strings.** The `d` field is delimited by `"`. If the description text itself contains a `"` character, the parser will see it as the end of the string, breaking all subsequent data. **Always avoid `"` inside `d` strings** — use `'` or 「」 or Unicode quotes instead. Example of BROKEN: `d:"他说"你好""` → CRASH. Example of FIXED: `d:"他说'你好'"`.

2. **Unescaped backslashes in `d:"..."` strings.** A single `\` inside a `d` string may escape the closing `"`, breaking the string. Avoid `\` in `d` strings or double them as `\\`.

3. **Missing comma between array elements.** `{...}{...}` without a comma between them breaks the parser. Always ensure `,` between items, rounds, and phases.

4. **Trailing comma before `]` or `}`.** Technically legal in JS but can confuse some editors/parsers. The linter will flag these as a warning.

5. **`cond` field value mismatch.** The `cond` on a round must EXACTLY match a tag or trait that earlier rounds can produce. A typo in `cond` means the round will never activate (silently skipped, no error). Always verify cond values against the tags produced by earlier rounds.

6. **Missing `items` array.** A round without `items:[]` will cause `undefined` errors at runtime. Every round must have `items:[]`, even if empty.

7. **Dimension value typo.** `dim:{体能:"S+"}` is invalid — `S+` is not in the dimension scale. The check-data.ps1 script catches these.

After editing: always run `.\check-braces.ps1` → `.\check-data.ps1` → `.\check-braces.ps1` (yes, twice — edits can easily create new issues).

## OpenCode commands

Use these commands for common workflows. Available in TUI via `/command`:

| Command | Agent | Purpose |
|---------|-------|---------|
| `/check` | — | Bracket balance check + show current phase/round/item counts via shell injection |
| `/seed-data <args>` | general | Edit SEED_DATA with auto-validation. Use for adding/modifying game data |
| `/add-round <args>` | general | Guided round addition — construct JS object, insert into phase, auto-validate brackets |
| `/lint` | — | Combined validation: `check-braces.ps1` + `check-data.ps1` (deep structure check) |
| `/stats` | — | Full SEED_DATA statistics: per-phase breakdown, item counts, dimension distribution |
| `/playtest` | — | Open `index.html` in the default browser |
| `/backup` | — | Create timestamped backup of `index.html` (`index_YYYYMMDD_HHmmss.html`) |
| `/reset-state` | — | Provide instructions to clear localStorage game saves |

## Validation scripts

| Script | What it checks |
|--------|---------------|
| `check-braces.ps1` | `{}` balance, `[]` balance, `d:"..."` string integrity |
| `check-data.ps1` | Duplicate round IDs, dimension value validity, missing item fields, phase ordering |

Run `check-braces.ps1` after EVERY SEED_DATA edit. Run `check-data.ps1` after structural changes (adding phases/rounds).

## Testing

No automated tests. Manual testing: open `index.html` in browser, verify wheel renders, spin through a few rounds. Use `/playtest` to launch.

## Responsive breakpoints

- **Mobile** (`max-width: 767px`): bottom tab bar, top bar with phase dropdown, center wheel area.
- **Desktop** (`min-width: 768px`): left sidebar (phases + event rounds), center wheel, right panel (traits/dimensions/skills/history).
