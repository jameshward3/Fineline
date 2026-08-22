import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "@/components/portal/order-portal.module.css";

export default function OrderNotFound() {
  return (
    <main className={styles.orderNotFound}>
      <p>Fine Ligne customer studio</p>
      <h1>That order is not part of this account.</h1>
      <span>Check the reference or return to your verified order history.</span>
      <Link href="/orders"><ArrowLeft size={14} /> My orders</Link>
    </main>
  );
}
