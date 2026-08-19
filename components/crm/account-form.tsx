"use client";

import { useActionState } from "react";
import { createAccount } from "@/lib/actions/crm";
import { Panel } from "@/components/ui/panel";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";
import { ACCOUNT_TYPE_LABELS } from "@/lib/crm-labels";

export function AccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, { error: null });

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account Name" required>
            <Input name="name" required placeholder="Hathaway Preparatory School" />
          </Field>
          <Field label="Account Type" required>
            <Select name="accountType" required defaultValue="INDIVIDUAL">
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Primary Contact Name">
            <Input name="contactName" placeholder="Emily Richardson" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" placeholder="contact@example.com" />
          </Field>
          <Field label="Phone">
            <Input name="phone" placeholder="(203) 555-0198" />
          </Field>
          <Field label="Lead Source">
            <Input name="leadSource" placeholder="Referral" />
          </Field>
          <Field label="Referral Source">
            <Input name="referralSource" placeholder="Westfield Academy" />
          </Field>
        </div>
        <Field label="Notes">
          <Input name="notes" placeholder="Optional" />
        </Field>

        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

        <div className="flex justify-end">
          <SubmitButton pending={pending}>Create Account</SubmitButton>
        </div>
      </Panel>
    </form>
  );
}
