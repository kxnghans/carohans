# CaroHans Ventures ERMS

## Project Overview

**CaroHans Ventures ERMS** is an Event Rental Management System built as a Monorepo. It features a modern web application designed for both desktop (Admin Dashboard) and mobile (Client Portal) use cases.

## Tech Stack

*   **Monorepo:** Turborepo, pnpm
*   **Web Framework:** Next.js 16 (App Router), React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS 4, CSS Variables, Lucide React, Material UI (@mui/material, @mui/icons-material)
*   **Charts:** Recharts
*   **Deployment:** Cloudflare (via OpenNext `@opennextjs/cloudflare`)

## Modal & Scroll Management

When implementing modals (using `createPortal`), it is critical to prevent "Scroll Leak" (background scrolling). 

### Why Scroll Leak Happens
By default, even if a modal overlay is fixed, the underlying `body` or `html` elements can still receive scroll events. This creates a confusing user experience where the background moves while interacting with a modal.

### Best Practice for New Modals
Every modal must include a `useEffect` hook to lock both the `body` and `documentElement` (html).

```tsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
  }
  return () => { 
    document.body.style.overflow = 'unset'; 
    document.documentElement.style.overflow = 'unset';
  };
}, [isOpen]);
```

## Directory Structure

*   `apps/web`: Main Next.js application.
    *   `app/admin`: Desktop-first admin dashboard.
    *   `app/portal`: Mobile-first client portal.
    *   `app/context`: Global state management (`AppProvider`).
    *   `app/components`: Shared UI components.
    *   `lib/`: Utilities and mock data.
*   `docs`: Documentation (PRD, test notes).
*   `turbo.json`: Turbopack pipeline configuration.

## Key Commands

Run these commands from the **root directory**:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server (`next dev`). Accessible at `http://localhost:3000`. |
| `pnpm build` | Standard Next.js build (`next build`). |
| `pnpm build:pages` | Builds for Cloudflare using OpenNext. Output: `.open-next`. |
| `pnpm deploy` | Deployment is handled automatically via Git integration. |
| `pnpm lint` | Runs ESLint. |
| `pnpm format` | Formats code with Prettier. |

## Development Conventions

*   **Styling:** Uses **Tailwind CSS 4**. configuration is minimal (`@import "tailwindcss";` in `globals.css`).
*   **Theme:** Custom CSS variables (`--background`, `--foreground`) are defined in `globals.css` and exposed via `@theme inline`.
*   **Responsive Design:** Implements a global `zoom` strategy in `globals.css` to handle responsiveness across different device sizes (Mobile: 0.7, Tablet: 0.8, Desktop: 1).
*   **State Management:** `AppProvider` (in `apps/web/app/context/AppContext.tsx`) wraps the application in `layout.tsx`.
*   **Fonts:** Uses `Geist` and `Geist_Mono` from `next/font/google`.
*   **Icons:** Primarily uses `lucide-react` and `@mui/icons-material`.

## Deployment

The application is deployed to **Cloudflare**.
*   **Runtime:** Edge runtime compatibility is required.
*   **Build Tool:** `@opennextjs/cloudflare` transforms the Next.js build.
