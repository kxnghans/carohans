# CaroHans Ventures ERMS - Web Application

This is the main web application for the CaroHans Ventures Event Rental Management System. It is built with Next.js 16 (App Router) and targets the Cloudflare Edge Runtime via OpenNext.

## Project Structure

*   `app/admin`: Desktop-first dashboard for managing inventory, clients, and orders.
*   `app/portal`: Mobile-first customer portal for browsing the catalog and placing rental requests.
*   `app/components`: Shared UI component library.
*   `app/context`: Global state management using React Context.
*   `app/hooks`: Custom React hooks (e.g., `useScrollLock`).
*   `app/services`: Data fetching and API integration logic.
*   `app/types`: TypeScript type definitions.
*   `app/utils`: Helper functions and formatting utilities.

## Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **Database & Auth:** Supabase
*   **Styling:** Tailwind CSS 4
*   **Deployment:** Cloudflare Pages (OpenNext)

## Migration to Proxy.ts

In accordance with Next.js 16 conventions, the project has migrated from `middleware.ts` to `proxy.ts`. This file manages authentication and route protection at the edge.

## Development

Run the development server from the root of the monorepo:

```bash
pnpm dev
```

## Building & Deployment

### Build for Production
```bash
pnpm build
```

### Build for Cloudflare
```bash
pnpm build:pages
```

### Deploy to Cloudflare
```bash
pnpm deploy
```

## Design System

The application uses a custom design system based on Tailwind CSS 4 variables, defined in `app/globals.css`. It supports full dark mode and responsive scaling across mobile, tablet, and desktop devices.