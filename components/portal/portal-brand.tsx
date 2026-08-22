import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/branding";
import styles from "./order-portal.module.css";

export function PortalBrand({ variant = "stacked" }: { variant?: "stacked" | "dark" }) {
  return (
    <Link
      href="/"
      className={`${styles.portalBrand} ${variant === "dark" ? styles.portalBrandDark : ""}`}
      aria-label="Fine Ligne Studio home"
    >
      <Image
        src={variant === "dark" ? brand.logoDark : brand.logoBadge}
        alt=""
        fill
        sizes={variant === "dark" ? "245px" : "118px"}
        priority
      />
    </Link>
  );
}
