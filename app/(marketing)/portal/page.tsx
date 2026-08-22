import { redirect } from "next/navigation";

export default function PortalPage() {
  redirect("/orders/sign-in");
}
