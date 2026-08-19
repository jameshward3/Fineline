import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { MobileNav } from "./mobile-nav";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  OPERATOR: "Operator",
  VIEWER: "Viewer",
};

export async function Topbar({ title }: { title?: string }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {title && <h1 className="text-sm font-medium text-ink">{title}</h1>}
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-ink leading-tight">{user.name}</p>
            <p className="text-[11px] text-ink-muted leading-tight">
              {ROLE_LABEL[user.role] ?? user.role}
            </p>
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-raised border border-border flex items-center justify-center text-xs font-medium text-ink-muted">
            {user.name?.slice(0, 2).toUpperCase()}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2 rounded-md text-ink-faint hover:text-ink hover:bg-surface-raised transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
