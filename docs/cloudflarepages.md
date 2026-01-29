# Cloudflare Pages Implementation Guide (OpenNext)

**Project:** CaroHans Ventures ERMS  
**Target Platform:** Cloudflare Pages  
**Runtime:** Cloudflare Edge Runtime  
**Adapter:** `@opennextjs/cloudflare` (OpenNext)

This guide provides the necessary technical configuration and deployment workflows for hosting the CaroHans Ventures ERMS on Cloudflare Pages using the OpenNext adapter.

---

## 1. Architecture Overview

The application utilizes the **Next.js App Router**. To ensure compatibility with Cloudflare’s global edge network, we utilize `@opennextjs/cloudflare`.

*   **Build Logic:** Standard `next build` output is transformed into a Cloudflare-compatible Worker script and asset bundle.
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

## 3. Environment Variables & Secrets

Environment variables are critical for connecting the Edge Runtime to external services like Supabase.

### 3.1 Required Variables
*   **`NEXT_PUBLIC_SUPABASE_URL`**: The API URL for your Supabase project.
*   **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: The anonymous public key for Supabase.

### 3.2 Management via Dashboard
1.  Navigate to **Workers & Pages** > **[Project Name]** > **Settings** > **Variables and Secrets**.
2.  Add variables for both **Production** and **Preview** environments.
3.  **Redeploy Requirement:** Variables prefixed with `NEXT_PUBLIC_` are statically bundled into the client-side code during build. You **must redeploy** after any change.

### 3.3 Management via Wrangler
Variables can be defined in `wrangler.toml` under the `[vars]` block or per environment:

```toml
[vars]
NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"

[env.production.vars]
NEXT_PUBLIC_SUPABASE_URL = "https://prod-project.supabase.co"
```

### 3.4 Local Development & Secrets
*   **`.dev.vars` File:** Put secrets for local development in a `.dev.vars` file in the same directory as `wrangler.toml`. This file should **never** be committed to git.
*   **Precedence:** If `.dev.vars` exists, `.env` files will not be loaded. Otherwise, `.env` files are merged with the following precedence (most to least specific):
    1. `.env.<environment>.local`
    2. `.env.local`
    3. `.env.<environment>`
    4. `.env`
*   **Node.js Compatibility:** With `nodejs_compat` enabled, environment variables are exposed via the global `process.env`. Text variables are exposed as strings; JSON values are exposed as raw JSON strings.

---

## 4. Authentication at the Edge

The system utilizes `@supabase/ssr` to manage sessions directly on the edge.

*   **Middleware:** `apps/web/middleware.ts` runs on the Cloudflare Edge Runtime to intercept and validate requests.
*   **Security:** It validates JWTs and performs role-based checks (via the `profiles` table) before granting access to `/admin/*` routes.
*   **Fail-Safe:** If critical environment variables are missing, the middleware blocks protected routes to prevent unauthorized access.

---

## 5. Build & Deployment Commands

| Command | Level | Description |
| :--- | :--- | :--- |
| `pnpm build:pages` | Root | Triggers `turbo run pages:build`, executing the OpenNext build. |
| `pnpm deploy` | Root | Deploys the `.open-next` artifacts via Wrangler. |
| `pnpm preview` | App | Local simulation of the Cloudflare environment using `wrangler dev`. |

---

## 6. Runtime Considerations

*   **`nodejs_compat`**: Required for Supabase and Next.js internal APIs.
*   **Edge Compliance**: All server-side logic (Middleware, Server Actions, API Routes) must be compatible with the Cloudflare Workers/Pages environment.
*   **Local Testing**: Use `pnpm --filter web preview` to run in a environment that closely mimics production (`workerd`).
