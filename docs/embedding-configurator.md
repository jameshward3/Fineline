# Fine Line embroidery configurator integration

## Route

- Standalone: `https://fineligne.co/configure`
- Embedded: `https://fineligne.co/configure?embed=1`

The route is intentionally outside the authenticated STITCH OS route group.
The iframe makes its API and Vercel Blob requests to the same origin, so no
database credential, Blob token, or CRM secret is exposed to the host site.

## Embed on fineline.co

Insert this block where the existing commission form or “Start an Order”
experience should appear:

```html
<div id="fine-line-configurator" style="width:100%;background:#f6f2ec">
  <iframe
    id="fine-line-configurator-frame"
    title="Fine Line embroidery configurator"
    src="https://fineligne.co/configure?embed=1"
    loading="lazy"
    allow=""
    referrerpolicy="strict-origin-when-cross-origin"
    style="display:block;width:100%;min-height:1100px;border:0;background:#f6f2ec"
  ></iframe>
</div>
<script>
  (() => {
    const frame = document.getElementById("fine-line-configurator-frame");
    const configuratorOrigin = "https://fineligne.co";

    window.addEventListener("message", (event) => {
      if (event.origin !== configuratorOrigin || event.source !== frame.contentWindow) return;
      if (event.data?.source !== "fine-line-configurator") return;

      if (event.data.type === "resize" && Number.isFinite(event.data.height)) {
        frame.style.height = `${Math.max(720, event.data.height)}px`;
      }
      if (event.data.type === "submitted") {
        window.dispatchEvent(new CustomEvent("fine-line:configuration-submitted", {
          detail: {
            orderReference: event.data.orderReference,
            portalUrl: event.data.portalUrl,
          },
        }));
        if (typeof event.data.portalUrl === "string") {
          window.location.assign(new URL(event.data.portalUrl, configuratorOrigin));
        }
      }
    });
  })();
</script>
```

For the same Next.js deployment, link directly to `/configure` instead of
embedding. The repository’s marketing CTAs already use that route.

## Required Vercel environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `fineline_POSTGRES_PRISMA_URL` or `DATABASE_URL` | server | Pooled Supabase PostgreSQL connection used by Prisma |
| `fineline_POSTGRES_URL_NON_POOLING` or `DIRECT_URL` | build/server | Direct Supabase connection used by `prisma migrate deploy` |
| `BLOB_READ_WRITE_TOKEN` | server | Vercel Blob store for original artwork |
| `AUTH_SECRET` | server | Existing NextAuth secret and fallback upload-signing key |
| `CONFIGURATOR_UPLOAD_SECRET` | server | Recommended independent HMAC key for short-lived upload intents |
| `STITCHOS_PUBLIC_ORGANIZATION_ID` | server | CRM tenant that owns public submissions (currently `org_demo`) |
| `STITCHOS_PUBLIC_OWNER_EMAIL` | server | Active StitchOS user assigned as submission owner |
| `STITCHOS_INTAKE_SECRET` | server, optional | Trusted server-to-server intake; never expose to browser code |
| `PORTAL_AUTH_SECRET` | server | Independent HMAC key for phone-login rate-limit identifiers |
| `PORTAL_SESSION_DAYS` | server, optional | Customer session lifetime, 1–90 days; defaults to 30 |

No Supabase service-role or anonymous key is needed in the browser. All CRM
writes go through Prisma on the server.

## Database migration

The Vercel build already runs `prisma migrate deploy`. For a manual release:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Migration `20260821133000_public_configurator` adds the structured
`ConfiguratorSubmission` record and links it to the normal StitchOS client,
opportunity, design/version, and job records. It does not alter or delete
existing CRM data. Migration `20260821153000_customer_portal` adds rate-limited
phone access attempts and revocable hashed portal sessions linked to the
existing `Client` record.

## Customer order portal

- `/orders/sign-in` accepts a phone already attached to a CRM client or contact
  and opens a revocable customer session without a password or SMS code.
- `/orders` lists the matched client's current and past orders.
- `/orders/[reference]` shows artwork, product/placement, thread selections,
  price estimate, and live StitchOS production status.
- Submission redirects to `/orders/sign-in?order=<job-number>`. After entering
  the matching phone number, the customer lands directly on that order.
- The access API enforces database-backed limits of four requests per phone
  and ten per IP in fifteen minutes. Add a Vercel Firewall limit as a second
  layer in production.
- Phone-only access does not prove possession of the number. Anyone who knows a
  customer's phone number can view that customer's portal orders; do not place
  payment details or other highly sensitive information in the customer view.

## Production controls

1. Attach the existing Vercel Blob store to every environment where uploads
   should work.
2. In Vercel Firewall, rate-limit `/api/public/configurator`,
   `/api/public/configurator/upload`, and `/api/public/portal/*` (a starting
   point is 10 token/submission requests per IP per 10 minutes and 10 portal
   requests per IP per 15 minutes).
3. Keep the route’s `frame-ancestors` list in `next.config.mjs` synchronized
   with the production host domains.
4. Run one end-to-end submission after deployment, enter the matching phone, and
   confirm the linked CRM opportunity, design, artwork asset, job item, notes,
   estimate, portal order, and previous-order history.
5. Treat the displayed price as an estimate. The API recalculates it using
   pricing version `2026.08.1`; studio review and a sew test remain the final
   authority.
