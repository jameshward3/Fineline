import Link from "next/link";
import { LogoLockup } from "@/components/story/marks";
import styles from "./order-portal.module.css";

export function PortalBrand() {
  return (
    <Link href="/" className={styles.portalBrand} aria-label="Fine Line Studio home">
      <svg viewBox="-115 -120 230 260" aria-hidden>
        <LogoLockup id="customer-portal-brand" showThread />
      </svg>
    </Link>
  );
}
