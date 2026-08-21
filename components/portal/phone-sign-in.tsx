"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, LockKeyhole, MessageSquareText, Phone } from "lucide-react";
import styles from "./order-portal.module.css";

interface CodeRequestResult {
  challengeId?: string;
  maskedPhone?: string;
  developmentCode?: string;
  error?: string;
}

interface CodeVerificationResult {
  destination?: string;
  error?: string;
}

export function PhoneSignIn({ orderReference }: { orderReference?: string }) {
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/public/portal/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, returnReference: orderReference }),
      });
      const payload = await response.json() as CodeRequestResult;
      if (!response.ok || !payload.challengeId) throw new Error(payload.error || "We could not send a code.");
      setChallengeId(payload.challengeId);
      setMaskedPhone(payload.maskedPhone ?? "your phone");
      setDevelopmentCode(payload.developmentCode ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not send a code.");
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeId) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/public/portal/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      });
      const payload = await response.json() as CodeVerificationResult;
      if (!response.ok || !payload.destination) throw new Error(payload.error || "We could not verify that code.");
      window.location.assign(payload.destination);
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "We could not verify that code.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.signInPanel}>
      <div className={styles.signInKicker}><LockKeyhole size={14} /> Customer order access</div>
      <h1>{challengeId ? "Enter your studio code." : "Your order, kept in one place."}</h1>
      <p className={styles.signInCopy}>
        {challengeId
          ? `We sent a one-time code to ${maskedPhone}. It expires in ten minutes.`
          : "Use the mobile number attached to your Fine Line request to review its progress and return to every past order."}
      </p>

      {orderReference && (
        <div className={styles.pendingOrderBadge}>
          <Check size={14} />
          <span>Configuration received</span>
          <strong>{orderReference}</strong>
        </div>
      )}

      {!challengeId ? (
        <form className={styles.signInForm} onSubmit={requestCode}>
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
            {pending ? <LoaderCircle className={styles.spinner} size={16} /> : <MessageSquareText size={16} />}
            Text me a secure code
            <ArrowRight size={15} />
          </button>
        </form>
      ) : (
        <form className={styles.signInForm} onSubmit={verifyCode}>
          <label>
            <span>Verification code</span>
            <div className={styles.codeInput}>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={10}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
              />
            </div>
          </label>
          {developmentCode && <p className={styles.developmentCode}>Local preview code: <strong>{developmentCode}</strong></p>}
          <button type="submit" disabled={pending || code.length < 4}>
            {pending ? <LoaderCircle className={styles.spinner} size={16} /> : <LockKeyhole size={16} />}
            Open my orders
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            className={styles.secondarySignInButton}
            onClick={() => {
              setChallengeId(null);
              setCode("");
              setError(null);
            }}
          >
            <ArrowLeft size={14} /> Use a different number
          </button>
        </form>
      )}

      {error && <div className={styles.signInError} role="alert">{error}</div>}
      <p className={styles.signInFinePrint}>Codes are single-use. Fine Line Studio will never ask for your code by phone or email.</p>
      <Link href="/configure" className={styles.startAnotherLink}>Start another configuration <ArrowRight size={13} /></Link>
    </div>
  );
}
