import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders — Fine Line Studio",
  description: "Securely review Fine Line Studio embroidery orders and their production progress.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
