import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Topbar />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
