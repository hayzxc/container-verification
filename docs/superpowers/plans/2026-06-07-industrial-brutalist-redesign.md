# Industrial Brutalist UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Container Verification UI from generic "AI slop" into a high-fidelity Industrial Brutalist interface (Swiss Industrial archetype) with sharp grids, monolithic typography, and pure mechanical color inversion for Dark Mode.

**Architecture:** We will use Tailwind CSS v4 for utility-first styling, updating the core theme with industrial tokens. Shadcn/ui components will be surgically refactored to remove all `border-radius`, shadows, and soft transitions. Layouts will be rebuilt using rigid CSS Grid "blueprint" systems.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Lucide React, IBM Plex Mono, Inter (Black).

---

### Task 1: Industrial Theme Infrastructure

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/app/styles.css`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Update Tailwind Config with Industrial Tokens**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // ... existing content
  theme: {
    extend: {
      colors: {
        substrate: "var(--substrate)",
        ink: "var(--ink)",
        hazard: "#E61919",
        // Overwrite existing shadcn tokens to match industrial palette
        background: "var(--substrate)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--ink)",
          foreground: "var(--substrate)",
        },
        accent: {
          DEFAULT: "#E61919",
          foreground: "#FFFFFF",
        },
        border: "var(--ink)",
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  // ...
};
export default config;
```

- [ ] **Step 2: Define CSS Variables for Industrial Inversion**

Overwrite `apps/web/app/styles.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --substrate: #F4F4F0;
    --ink: #050505;
  }

  .dark {
    --substrate: #0A0A0A;
    --ink: #EAEAEA;
  }

  * {
    @apply border-border outline-none transition-none !rounded-none;
  }

  body {
    @apply bg-substrate text-ink font-sans selection:bg-hazard selection:text-white;
    -webkit-font-smoothing: antialiased;
  }

  /* Macro-Typography Utility */
  .macro-type {
    @apply font-black uppercase leading-[0.85] tracking-[-0.05em];
    font-size: clamp(2.5rem, 10vw, 8rem);
  }

  /* Micro-Telemetry Utility */
  .telemetry {
    @apply font-mono uppercase text-[12px] tracking-[0.08em];
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/tailwind.config.ts apps/web/app/styles.css
git commit -m "feat(web): initialize industrial theme infrastructure and inversion logic"
```

### Task 2: Surgical Component Industrialization

**Files:**
- Modify: `apps/web/components/ui/button.tsx`
- Modify: `apps/web/components/ui/card.tsx`
- Modify: `apps/web/components/ui/input.tsx`

- [ ] **Step 1: Industrialize Buttons**

Remove all `rounded` classes and add ASCII decorator support.
Modify `buttonVariants` in `button.tsx`:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-black uppercase tracking-wider transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hazard disabled:pointer-events-none disabled:opacity-50 border-2",
  {
    variants: {
      variant: {
        default: "bg-ink text-substrate border-ink hover:bg-hazard hover:border-hazard",
        destructive: "bg-hazard text-white border-hazard hover:bg-ink hover:border-ink",
        outline: "border-ink bg-transparent text-ink hover:bg-ink hover:text-substrate",
        secondary: "bg-substrate text-ink border-ink hover:bg-ink hover:text-substrate",
        ghost: "border-transparent hover:bg-ink/10",
        link: "border-transparent text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-16 px-10 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Industrialize Cards (Blocks)**

Modify `Card` in `card.tsx`:
```typescript
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-2 border-ink bg-substrate text-ink shadow-none",
      className
    )}
    {...props}
  />
))
```

- [ ] **Step 3: Industrialize Inputs**

Modify `Input` in `input.tsx`:
```typescript
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-2 border-ink bg-substrate px-4 py-2 text-base font-mono uppercase placeholder:text-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hazard disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/ui/
git commit -m "feat(web): surgically industrialize button, card, and input components"
```

### Task 3: Blueprint Layout Rebuilding

**Files:**
- Modify: `apps/web/app/(inspector)/layout.tsx`
- Modify: `apps/web/app/(inspector)/inspector/page.tsx`
- Modify: `apps/web/app/(admin)/layout.tsx`

- [ ] **Step 1: Rebuild Inspector Layout with Blueprint Grid**

Update `apps/web/app/(inspector)/layout.tsx` to use a rigid full-viewport container with blueprint lines.

- [ ] **Step 2: Update Inspector Dashboard with Macro-Typography**

Update `apps/web/app/(inspector)/inspector/page.tsx`:
- Use `.macro-type` for the main "INSPECTOR" header.
- Use `.telemetry` for unit IDs and status.
- Apply high-density grid for recent inspections.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(inspector)/
git commit -m "feat(web): rebuild inspector dashboard with blueprint grid and macro-typography"
```

### Task 4: Dark Mode Inversion Toggle

**Files:**
- Create: `apps/web/components/ThemeToggle.tsx`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Build Industrial Theme Toggle**

A simple button that toggles the `.dark` class on `html`. Use `[ MODE: LIGHT ]` / `[ MODE: DARK ]` text instead of icons.

- [ ] **Step 2: Integrate Toggle into Layouts**

Add the toggle to the corner of the Inspector and Admin layouts.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/ThemeToggle.tsx apps/web/app/layout.tsx
git commit -m "feat(web): add industrial inversion theme toggle"
```
