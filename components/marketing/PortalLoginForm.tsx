"use client";

import { useActionState } from "react";
import { portalLogin } from "@/lib/actions/portal";

export function PortalLoginForm() {
  const [state, formAction, pending] = useActionState(portalLogin, { error: null });

  return (
    <form action={formAction} className="mt-10 w-full max-w-sm">
      <label htmlFor="phone" className="block font-sans text-[11px] uppercase tracking-[0.22em] text-fl-ink-muted">
        Phone Number
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        placeholder="(555) 123-4567"
        className="mt-2 w-full border border-fl-line bg-fl-paper px-4 py-3 font-sans text-sm text-fl-charcoal placeholder:text-fl-ink-faint focus:outline-none focus:border-fl-brass"
      />
      {state.error && (
        <p className="mt-3 font-sans text-xs text-red-800">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full border border-fl-charcoal bg-fl-charcoal px-7 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-fl-paper transition-colors hover:bg-transparent hover:text-fl-charcoal disabled:opacity-60"
      >
        {pending ? "Checking…" : "View My Account"}
      </button>
      <p className="mt-4 font-sans text-xs leading-relaxed text-fl-ink-faint">
        Use the phone number your account team has on file. No password needed.
      </p>
    </form>
  );
}
