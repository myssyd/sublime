# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
bun dev          # Start development server at http://localhost:3000
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint
```

## Architecture

This is a Next.js 16 application using the App Router with React 19 and TypeScript.

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with CSS variables for theming (OKLCH color space)
- **UI Components**: Custom component library built on Radix UI primitives and shadcn patterns
- **Icons**: Hugeicons (`@hugeicons/react`, `@hugeicons/core-free-icons`)
- **Utilities**: `class-variance-authority` for variant styling, `tailwind-merge` + `clsx` via `cn()` utility

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `components/ui/` - Reusable UI components (Button, Card, Input, Select, DropdownMenu, etc.)
- `components/` - Application-specific components
- `lib/utils.ts` - Contains the `cn()` function for merging Tailwind classes

### Component Patterns
- UI components use `cva` (class-variance-authority) for variant definitions
- Components support `asChild` pattern via Radix `Slot` for composition
- Styling uses data attributes (`data-slot`, `data-variant`, `data-size`) for targeting
- Path alias `@/*` maps to project root

### Theming
- CSS variables defined in `app/globals.css` for light/dark modes
- Dark mode activated via `.dark` class on parent elements
- Colors use OKLCH color space for perceptually uniform theming
