# Cloudflare Pages Implementation Guide (OpenNext)

**Project:** CaroHans Ventures ERMS  
**Target Platform:** Cloudflare Pages  
**Runtime:** Cloudflare Edge Runtime (Experimental)  
**Adapter:** `@opennextjs/cloudflare` (OpenNext)  
**Next.js Version:** 16.1.4+ (Turbopack)

This guide provides the technical configuration and deployment workflows for hosting the CaroHans Ventures ERMS on Cloudflare Pages using the OpenNext adapter.

---

## 1. Architecture Overview

The application utilizes the **Next.js 16 App Router** with **Turbopack**. To ensure compatibility with Cloudflare’s global edge network, we utilize `@opennextjs/cloudflare`.

*   **Build Engine:** Turbopack is enabled for optimized production builds.
*   **Edge Runtime:** The application targets the Cloudflare Edge Runtime. Note that as of Next.js 16, this is considered experimental and APIs may evolve.
*   **Adapter:** `@opennextjs/cloudflare` transforms standard `next build` output into a Cloudflare-compatible Worker script and asset bundle.
*   **Output Path:** The final assets and worker script are generated in `apps/web/.open-next/`.

---

## 2. Configuration

### 2.1 `apps/web/wrangler.toml`
Governs the Cloudflare deployment environment.

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
The configuration for the OpenNext adapter.

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

---

## 3. Middleware to Proxy Migration

Next.js 16+ has deprecated the `middleware.ts` convention in favor of `proxy.ts`. This change clarifies that the logic runs at the Edge as a network boundary (Proxy) rather than standard application middleware.

### 3.1 Migration Status
*   **Current File:** `apps/web/middleware.ts` (Active, but triggers deprecation warnings).
*   **Recommended Action:** Rename to `proxy.ts` and update the function name to `proxy`.

### 3.2 Manual Migration Steps
1. Rename `apps/web/middleware.ts` to `apps/web/proxy.ts`.
2. Update the export:
   ```typescript
   // FROM
   export function middleware(request: NextRequest) { ... }
   // TO
   export function proxy(request: NextRequest) { ... }
   ```

Alternatively, use the Next.js codemod:
```bash
npx @next/codemod@canary middleware-to-proxy .
```

---

## 4. Environment Variables & Secrets

### 4.1 Required Variables
*   **`NEXT_PUBLIC_SUPABASE_URL`**: The API URL for your Supabase project.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: The anonymous public key for Supabase.

### 4.2 Management
*   **Dashboard:** Add variables in **Workers & Pages** > **[Project Name]** > **Settings** > **Variables and Secrets**.
*   **Static Bundling:** Variables prefixed with `NEXT_PUBLIC_` are bundled at **build time**. You must trigger a new build/deploy after changing these.
*   **Local Dev:** Use a `.dev.vars` file in `apps/web/` for secrets. **Do not commit this file.**

---

## 5. Build & Deployment Workflow

Based on current CI/CD logs (`Node v22.16.0`, `pnpm v9.15.4`):

| Command | Level | Description |
| :--- | :--- | :--- |
| `pnpm build:pages` | Root | Executes `turbo run pages:build`, which runs `opennextjs-cloudflare build`. |
| `pnpm deploy` | Root | Deploys the `.open-next` bundle using `wrangler deploy`. |
| `pnpm preview` | Root | Locally simulates the Cloudflare environment. |

### 5.1 Deployment Output
Successful builds deploy to:  
`https://carohans.hansoncreation.workers.dev`

---

## 6. Development Notes

*   **`nodejs_compat`**: This flag is mandatory in `wrangler.toml` to support Node.js APIs within the Worker environment.
*   **Telemetry:** Both Turborepo and Next.js collect anonymous telemetry.
*   **Experimental Warnings:** Expect warnings regarding the experimental nature of the Edge Runtime in Next.js 16. These are expected and do not currently block deployment.