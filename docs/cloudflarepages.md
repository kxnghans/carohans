# Cloudflare Pages Implementation Guide (OpenNext)

**Project:** CaroHans Ventures ERMS
**Target Platform:** Cloudflare Pages / Workers
**Runtime:** Cloudflare Edge Runtime
**Adapter:** `@opennextjs/cloudflare` (OpenNext)

This document details the configuration and workflows used to deploy the Next.js application to Cloudflare using the **OpenNext** adapter, which is the currently recommended path by Cloudflare for full Next.js feature support.

---

## 1. Architecture Overview

The application uses the **Next.js App Router**. To run on Cloudflare's global edge network, we utilize `@opennextjs/cloudflare`. This utility:
1.  Builds the Next.js application using the standard `next build`.
2.  Transforms the build output into a Cloudflare-compatible Worker script and asset bundle.
3.  Outputs the result to `apps/web/.open-next/`.

---

## 2. Configuration

### 2.1 `apps/web/wrangler.toml`
Governs the Cloudflare deployment for the web application.

```toml
name = "carohans"
compatibility_date = "2024-09-23"
main = ".open-next/worker.js"
compatibility_flags = ["nodejs_compat"]
workers_dev = true
preview_urls = true

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

### 2.2 `apps/web/open-next.config.ts`
The configuration file for the OpenNext adapter.

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 2.3 `apps/web/next.config.ts`
Standard Next.js configuration. Note that OpenNext handles monorepo resolution more gracefully than previous adapters.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [],
};

export default nextConfig;
```

---

## 3. Build Scripts & Commands

The deployment pipeline is managed via `pnpm` and `turbo`.

### Root `package.json`
| Command | Script | Description |
| :--- | :--- | :--- |
| **Build** | `pnpm build:pages` | Runs `turbo run pages:build`. This triggers `opennextjs-cloudflare build` in the `web` app. |
| **Deploy** | `pnpm deploy` | Runs `wrangler deploy -c apps/web/wrangler.toml`. Deploys the OpenNext worker using the specific config file. |

### `apps/web/package.json`
| Command | Script | Description |
| :--- | :--- | :--- |
| **Adapter Build** | `pnpm pages:build` | Executes `opennextjs-cloudflare build`. |
| **Preview** | `pnpm preview` | Builds and starts a local instance of the app running in the `workerd` runtime. |

---

## 4. Deployment Workflow

### 4.1 Manual Deployment (CLI)
To deploy the application manually from your local machine:

1.  **Build the Project:**
    ```bash
    pnpm build:pages
    ```
2.  **Deploy to Cloudflare:**
    ```bash
    pnpm deploy
    ```

### 4.2 CI/CD (Workers Builds)
When using Cloudflare **Workers Builds** (recommended for OpenNext):

1.  **Build Command:** `pnpm run build:pages`
2.  **Deploy Command:** `pnpm run deploy`
3.  **Path:** `/`
4.  **Environment Variables:** Add any required keys (e.g., `NEXT_PUBLIC_...`) in the Cloudflare settings.

---

## 5. Runtime Considerations

OpenNext utilizes the **Edge Runtime** with `nodejs_compat` enabled.
*   **Node.js Support:** Many Node.js APIs are available via the `nodejs_compat` flag.
*   **Edge Compatibility:** Ensure all libraries used in server components are compatible with the Cloudflare Workers environment.

---

## 6. Local Testing
The best way to test the production environment locally is:
```bash
pnpm --filter web preview
```
This runs the application in `wrangler dev`, which is much closer to the actual Cloudflare environment than `next dev`.