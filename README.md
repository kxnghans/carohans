# CaroHans Ventures ERMS

## Overview
A robust Event Rental Management System (ERMS) for CaroHans Ventures. This application manages the full rental lifecycle, allowing clients to request items via mobile while providing Admins with a dashboard to track inventory, approve orders, and manage billing.

## Tech Stack
This project uses a modern Monorepo architecture:

*   **Monorepo:** Turborepo
*   **Package Manager:** pnpm
*   **Web Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript
*   **Linting/Formatting:** ESLint, Prettier

## Project Structure

```
├── apps/
│   └── web/            # Next.js application (Client & Admin Dashboard)
├── packages/           # Shared packages (UI, configs, etc.)
├── docs/               # Project documentation (PRD, Code guidelines)
├── package.json        # Root dependencies and scripts
├── pnpm-workspace.yaml # Workspace configuration
└── turbo.json          # Turbo build pipeline configuration
```

## Getting Started

### Prerequisites
- Node.js (>= 18)
- pnpm (>= 8)

### Installation
Install all dependencies from the root directory:

```bash
pnpm install
```

### Development
Start the development server for all apps:

```bash
pnpm dev
```

This will start the web application at [http://localhost:3000](http://localhost:3000).

### Building
Build all applications and packages:

```bash
pnpm build
```

## How to Serve

To serve the production build of the application locally or on a server:

1.  **Build the project:**
    ```bash
    pnpm build
    ```

2.  **Start the production server:**
    ```bash
    pnpm start
    ```
    *Note: This runs `turbo run start`, which will start the Next.js production server.*

Alternatively, to serve *only* the web app directly:

```bash
cd apps/web
pnpm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment (Cloudflare Pages)

This project is configured for deployment on Cloudflare Pages using `@cloudflare/next-on-pages`.

### Configuration

Ensure your Cloudflare Pages project settings are configured as follows:

-   **Framework Preset:** None / Custom
-   **Build command:** `pnpm run build:pages`
-   **Build output directory:** `apps/web/.vercel/output/static`
-   **Node.js Version:** >= 18

### Manual Deployment

To deploy manually using Wrangler:

```bash
pnpm run build:pages
pnpm run deploy
```

*Note: `pnpm run deploy` executes `wrangler pages deploy apps/web/.vercel/output/static`.*
