import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PackageOpen, Plus } from "lucide-react";
import { CustomerPortalShell } from "@/components/portal/customer-portal-shell";
import { getPortalOrders } from "@/lib/portal/orders";
import { getPortalViewer } from "@/lib/portal/session";
import styles from "@/components/portal/order-portal.module.css";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default async function CustomerOrdersPage() {
  const viewer = await getPortalViewer();
  if (!viewer) redirect("/orders/sign-in");
  const orders = await getPortalOrders(viewer.client.id);

  return (
    <CustomerPortalShell
      contactName={viewer.client.contactName ?? viewer.client.name}
      accountName={viewer.client.name}
      orders={orders}
    >
      <section className={styles.ordersIndex}>
        <div className={styles.indexHeading}>
          <div><p>Customer studio</p><h1>My orders</h1><span>Every active and completed Fine Ligne project in one place.</span></div>
          <Link href="/configure"><Plus size={15} /> Start a new order</Link>
        </div>
        {orders.length ? (
          <div className={styles.orderIndexGrid}>
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${encodeURIComponent(order.reference)}`}>
                <div className={styles.indexCardTop}><span className={styles.indexStatusDot} /><em>{order.statusLabel}</em><small>{order.reference}</small></div>
                <h2>{order.designName}</h2>
                <p>{order.productName} · {order.quantity} units</p>
                <div><strong>{money(order.total)}</strong><span>View order <ArrowRight size={13} /></span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyOrders}>
            <PackageOpen size={34} />
            <h2>Your first order will live here.</h2>
            <p>Build a thread-ready proof and send it directly to the studio.</p>
            <Link href="/configure">Open the configurator <ArrowRight size={14} /></Link>
          </div>
        )}
      </section>
    </CustomerPortalShell>
  );
}
