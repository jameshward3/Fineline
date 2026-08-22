"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, Phone } from "lucide-react";
import styles from "./order-portal.module.css";

interface PhoneAccessResult {
  destination?: string;
  error?: string;
}

export function PhoneSignIn({ orderReference }: { orderReference?: string }) {
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accessOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/public/portal/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, returnReference: orderReference }),
      });
      const payload = await response.json() as PhoneAccessResult;
      if (!response.ok || !payload.destination) {
        throw new Error(payload.error || "We could not open your orders.");
      }
      window.location.assign(payload.destination);
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : "We could not open your orders.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.signInPanel}>
      <div className={styles.signInKicker}><Phone size={14} /> Customer order access</div>
      <h1>Your order, kept in one place.</h1>
      <p className={styles.signInCopy}>
        Use the mobile number attached to your Fine Line request to review its progress and return to every past order.
      </p>

      {orderReference && (
        <div className={styles.pendingOrderBadge}>
          <Check size={14} />
          <span>Configuration received</span>
          <strong>{orderReference}</strong>
        </div>
      )}

      <form className={styles.signInForm} onSubmit={accessOrders}>
        <label>
          <span>Mobile number</span>
          <div className={styles.signInInput}>
            <Phone size={17} aria-hidden />
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(203) 555-0142"
              required
            />
          </div>
        </label>
        <button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className={styles.spinner} size={16} /> : <Phone size={16} />}
          View my orders
          <ArrowRight size={15} />
        </button>
      </form>

      {error && <div className={styles.signInError} role="alert">{error}</div>}
      <p className={styles.signInFinePrint}>Use the phone number entered with your order. No password or verification code is required.</p>
      <Link href="/configure" className={styles.startAnotherLink}>Start another configuration <ArrowRight size={13} /></Link>
    </div>
  );
}
