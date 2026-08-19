import { AccountForm } from "@/components/crm/account-form";

export default function NewAccountPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Account</h1>
        <p className="text-sm text-ink-muted mt-0.5">Begin a new studio relationship.</p>
      </div>
      <AccountForm />
    </div>
  );
}
