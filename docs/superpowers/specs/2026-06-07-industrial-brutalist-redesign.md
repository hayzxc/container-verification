# Industrial Brutalist UI Redesign - Design Spec

**Date:** 2026-06-07
**Project:** Container Verification Platform
**Objective:** Eliminate "AI slop" and establish a high-fidelity industrial identity that projects mechanical reliability and tactical precision for field inspection operations.

---

## 1. Visual Archetype: Swiss Industrial Print
The design is derived from mid-century corporate identity systems, heavy machinery manuals, and manufacturing blueprints. It prioritizes data density and structural authority.

### 1.1 Color Palette (Substrate & Ink)
- **Primary Substrate (Light):** `#F4F4F0` (Matte, unbleached documentation paper)
- **Primary Ink (Light):** `#050505` (Carbon Ink Black)
- **Inverted Substrate (Dark):** `#0A0A0A` (Deep Charcoal / CRT Black)
- **Inverted Ink (Dark):** `#EAEAEA` (White Phosphor)
- **Hazard Accent (Global):** `#E61919` (Aviation Red). Used exclusively for primary CTAs, alerts, and critical data highlights. Stays constant across both modes.

### 1.2 Typographic Infrastructure
- **Macro-Typography (Headers):** `Inter Black` (or Neue Haas Grotesk).
  - Scale: Massive (`clamp(2rem, 8vw, 6rem)`).
  - Tracking: Extremely tight (`-0.05em`).
  - Leading: Compressed (`0.85`).
  - Casing: Uppercase only.
- **Micro-Typography (Telemetry):** `IBM Plex Mono` (or JetBrains Mono).
  - Scale: Fixed/Small (`12px` - `14px`).
  - Tracking: Generous (`0.08em`).
  - Casing: Uppercase only. Used for all metadata, unit IDs, and system status.

---

## 2. Spatial Engineering & Grid
- **The Blueprint Grid:** Strict adherence to CSS Grid. 
- **Dividing Lines:** Elements are delineated by `1px` or `2px` solid lines rather than shadows or padding.
- **Zero Radius:** All corners must be exactly 90 degrees. `border-radius: 0` is enforced globally.
- **Bimodal Density:** High-density data clusters juxtaposed against large expanses of calculated negative space.

---

## 3. Component Architecture

### 3.1 Tactical Buttons
- **Shape:** Rectangular, sharp edges.
- **Visuals:** High-contrast solid fills or heavy `2px` borders.
- **Decorators:** Integration of ASCII characters (e.g., `[ SUBMIT ]`, `REJECT →`, `/// VIEW_ALL`).
- **Interaction:** No soft transitions. Snappy state changes.

### 3.2 Information Blocks (Cards)
- **Replacement:** The "Card" concept is discarded in favor of "Blocks."
- **Structure:** Blocks are part of the grid, not floating on top of it.
- **Borders:** `1px solid` matching the current mode's ink color. No shadows.

### 3.3 Inputs & Forms
- **Style:** Underlined fields or stark boxes.
- **Text:** Input text must be monospaced to reflect the data-entry nature of the platform.

---

## 4. Dark Mode: Industrial Inversion
Dark Mode is implemented as a pure mechanical color flip.
- **Substrate Switch:** `#F4F4F0` <-> `#0A0A0A`
- **Ink Switch:** `#050505` <-> `#EAEAEA`
- **Asset Handling:** Images should be subjected to high-contrast filters or dithering to match the substrate.

---

## 5. Implementation Strategy
1.  **Tailwind Configuration:** Update `tailwind.config.ts` with the new color tokens and typography fluid rules.
2.  **Global CSS Overrides:** Enforce `border-radius: 0` on all elements and set the base substrate color on `body`.
3.  **Component Refactoring:** Surgical updates to `apps/web/components/ui/` to align with the tactical directives.
4.  **Layout System:** Rebuild the main layouts using CSS Grid `gap: 1px` with contrasting background colors to automate the blueprint lines.

---

## 6. Success Criteria
- **Zero Slop:** No rounded corners, no soft shadows, no balanced sans-serif body text.
- **Authority:** The UI feels like an official piece of heavy industry equipment.
- **Tactical Speed:** Legibility in bright outdoor conditions is significantly improved.
