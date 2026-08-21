import { notFound, redirect } from "next/navigation";
import { CustomerPortalShell } from "@/components/portal/customer-portal-shell";
import { OrderDashboard } from "@/components/portal/order-dashboard";
import { getPortalOrder, getPortalOrders } from "@/lib/portal/orders";
import { getPortalViewer } from "@/lib/portal/session";

export default async function CustomerOrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const viewer = await getPortalViewer();
  if (!viewer) redirect(`/orders/sign-in?order=${encodeURIComponent(reference)}`);

  const [order, orders] = await Promise.all([
    getPortalOrder(viewer.client.id, reference),
    getPortalOrders(viewer.client.id),
  ]);
  if (!order) notFound();

  return (
    <CustomerPortalShell
      contactName={viewer.client.contactName ?? viewer.client.name}
      accountName={viewer.client.name}
      orders={orders}
      activeReference={order.reference}
    >
      <OrderDashboard order={order} />
    </CustomerPortalShell>
  );
}
