# CaroHans Ventures ERMS

## Overview
A robust Event Rental Management System (ERMS) for CaroHans Ventures based in Accra, Ghana. This application manages the full rental lifecycle, enabling clients to request items via a mobile-first portal while providing administrators with a powerful dashboard to track inventory, approve orders, process returns, and analyze business performance.

## Tech Stack
This project uses a modern Monorepo architecture:

*   **Monorepo:** Turborepo
*   **Package Manager:** pnpm
*   **Web Framework:** Next.js 16 (App Router), React 19
*   **Styling:** Tailwind CSS 4.0
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Icons:** Lucide React & Material UI Icons (@mui/icons-material)
*   **Charts:** Recharts
*   **Deployment:** Cloudflare Pages (OpenNext)

## Project Structure

```
├── apps/
│   └── web/            # Main application (Admin Dashboard & Client Portal)
├── docs/               # Project documentation (PRD, Supabase Schema, Test Plan)
├── package.json        # Root dependencies and scripts
├── pnpm-workspace.yaml # Workspace configuration
└── turbo.json          # Turbo build pipeline configuration
```

## Key Features

### Admin Dashboard (`/admin`)
*   **Inventory Control:** Inline editing, SKU management, and visual customization via a shared Icon & Color picker.
*   **Logistics Management:** Today's pickups/returns overview and manual order lifecycle transitions (Dispatch, Return).
*   **Client CRM:** Searchable client database with inline profile editing via row expansion.
*   **Business Intelligence:** Real-time revenue tracking, segment analysis, and inventory demand insights.

### Client Portal (`/portal`)
*   **Mobile-First Catalog:** Browse rental items and manage a persistent shopping cart.
*   **Smart Booking:** Select pickup and return dates with integrated availability checks.
*   **Self-Service Profile:** Manage personal information (First/Last name, Username, Contact) and delivery addresses.

## Getting Started

### Prerequisites
- Node.js (>= 18)
- pnpm (>= 9)

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

The web application will be available at [http://localhost:3000](http://localhost:3000).

### Building
Build the application:

```bash
pnpm build
```

## Deployment (Cloudflare Pages)

This project is deployed to Cloudflare using **OpenNext** (`@opennextjs/cloudflare`) for full Next.js feature support on the edge.

### Manual Deployment
While deployment is typically automated via Git integration, you can manually trigger a deployment:

1.  **Build for Cloudflare:**
    ```bash
    pnpm run build:pages
    ```

2.  **Deploy using Wrangler:**
    ```bash
    pnpm run deploy
    ```

## Documentation
Comprehensive documentation is available in the `docs/` directory:
*   [PRD.md](./docs/PRD.md): Product Requirement Document.
*   [SUPABASE.md](./docs/SUPABASE.md): Database schema and RLS policies.
*   [test.md](./docs/test.md): Verification and test plan.