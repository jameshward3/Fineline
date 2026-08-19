"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { brand } from "@/lib/branding";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const [state, formAction, pending] = useActionState(loginAction, { error: null });

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src={brand.logoBadge}
            alt={brand.companyName}
            width={165}
            height={180}
            className="mb-5 rounded-lg shadow-panel"
            priority
          />
          <p className="text-sm text-ink-muted">{brand.loginScreen.subheading}</p>
        </div>

        <form
          action={formAction}
          className="bg-surface border border-border rounded-lg p-6 shadow-panel"
        >
          <input type="hidden" name="from" value={from} />
          <div className="mb-4">
            <label htmlFor="email" className="block text-xs font-medium text-ink-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue="admin@stitchos.dev"
              className="w-full rounded-md bg-surface-inset border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              placeholder="you@company.com"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="block text-xs font-medium text-ink-muted mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              defaultValue="stitchos-dev"
              className="w-full rounded-md bg-surface-inset border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <div className="mb-4 text-sm text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-md px-3 py-2">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-accent hover:bg-accent/90 disabled:opacity-60 text-accent-foreground text-sm font-medium py-2.5 transition-colors"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-ink-faint mt-6">
          {brand.loginScreen.footer}
        </p>
      </div>
    </div>
  );
}
