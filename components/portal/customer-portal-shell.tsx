import Link from "next/link";
import { CircleHelp, FileText, Images, LayoutDashboard, PackageOpen, PlusCircle } from "lucide-react";
import type { PortalOrder } from "@/lib/portal/orders";
import { PortalBrand } from "./portal-brand";
import { SignOutButton } from "./sign-out-button";
import styles from "./order-portal.module.css";

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function CustomerPortalShell({
  contactName,
  accountName,
  orders,
  activeReference,
  children,
}: {
  contactName: string;
  accountName: string;
  orders: PortalOrder[];
  activeReference?: string;
  children: React.ReactNode;
}) {
  const firstName = contactName.trim().split(/\s+/)[0] || "there";

  return (
    <div className={styles.portalRoot}>
      <aside className={styles.portalSidebar}>
        <PortalBrand />
        <nav className={styles.primaryNav} aria-label="Customer portal">
          <Link href="/orders" className={!activeReference ? styles.activeNav : ""}><LayoutDashboard size={17} /> Dashboard</Link>
          <Link href="/configure" className={styles.newOrderLink}><PlusCircle size={17} /> New order</Link>
          <Link href="/orders" className={activeReference ? styles.activeNav : ""}><PackageOpen size={17} /> My orders</Link>
          <span aria-disabled><FileText size={17} /> Quotes <small>Studio review</small></span>
          <span aria-disabled><Images size={17} /> Design library <small>Coming next</small></span>
        </nav>

        <div className={styles.historyNav}>
          <p>Recent orders</p>
          {orders.length ? orders.slice(0, 6).map((order) => (
            <Link key={order.id} href={`/orders/${encodeURIComponent(order.reference)}`} className={order.reference === activeReference ? styles.activeHistory : ""}>
              <span><strong>{order.productName}</strong><small>{shortDate(order.createdAt)}</small></span>
              <em>{order.statusLabel}</em>
            </Link>
          )) : <span className={styles.emptyHistory}>Your submitted orders will appear here.</span>}
        </div>

        <div className={styles.conciergeCard}>
          <CircleHelp size={18} />
          <div><strong>Concierge assistance</strong><p>Questions about material, placement, or a deadline? The studio can help.</p></div>
          <a href="mailto:studio@fineligne.co">Contact the studio</a>
        </div>
      </aside>

      <main className={styles.portalMain}>
        <header className={styles.portalTopbar}>
          <p>Create something exceptional</p>
          <div>
            <span>Hi, {firstName}</span>
            <small>{accountName}</small>
            <span className={styles.avatar}>{firstName.slice(0, 1).toUpperCase()}</span>
            <SignOutButton />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
