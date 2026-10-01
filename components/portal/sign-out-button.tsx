"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import styles from "./order-portal.module.css";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={styles.signOutButton}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/public/portal/logout", { method: "POST" });
        router.replace("/orders/sign-in");
        router.refresh();
      }}
    >
      <LogOut size={14} /> {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
