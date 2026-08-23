import { redirect } from "next/navigation";
import { getPortalViewer } from "@/lib/portal/session";
import { PhoneSignIn } from "@/components/portal/phone-sign-in";
import { PortalBrand } from "@/components/portal/portal-brand";
import styles from "@/components/portal/order-portal.module.css";

export default async function CustomerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const viewer = await getPortalViewer();
  if (viewer) redirect(order ? `/orders/${encodeURIComponent(order)}` : "/orders");

  return (
    <main className={styles.signInRoot}>
      <aside className={styles.signInBrandRail}>
        <PortalBrand />
        <div>
          <p>Fine Line customer studio</p>
          <blockquote>“A clear view from first thread to finished piece.”</blockquote>
        </div>
        <span>Phone-number access · No password to remember</span>
      </aside>
      <section className={styles.signInContent}>
        <div className={styles.signInTopline}>Order concierge <span>Fine Line Studio</span></div>
        <PhoneSignIn orderReference={order} />
      </section>
    </main>
  );
}
