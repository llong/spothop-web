# CRITICAL: ARCHITECTURAL STOP-CONDITIONS
- **MAX FILE LENGTH:** NEVER create or expand a component beyond 200 lines. 
- **DECOMPOSITION PROTOCOL:** If a task requires more than 200 lines, you MUST stop and propose a plan to split the logic into sub-components or custom hooks BEFORE writing code.
- **NO MONOLITHS:** Logic (API, state, handlers) MUST reside in hooks. UI MUST reside in components.

# UI CONSTRAINTS (MUI v6+)
- **GRID RULE:** The `item` prop is DEPRECATED. NEVER use `<Grid item>`. 
- **REQUIRED SYNTAX:** Always use `<Grid size={{ xs: 12 }} ...>`. If you see `item`, you are REQUIRED to refactor it immediately.

# QUALITY GATE
- **IMPORT CLEANUP:** You are forbidden from saving a file with unused imports. Run a check before every "save" action.
- **NO MERGE MARKERS:** If "<<<<<<<" is detected in your proposed diff, the task is considered a failure. Scrub all markers.

# SUPABASE & MEDIA
- **STRICT ORDER:** 1. Insert to `spots` table -> 2. Upload to `spot-media/{id}/...` -> 3. Update `spots` URL. 
- **NEVER** attempt a single-step upload/insert.