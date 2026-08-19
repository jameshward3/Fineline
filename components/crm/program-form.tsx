"use client";

import { useActionState } from "react";
import { createProgram } from "@/lib/actions/crm";
import { Panel } from "@/components/ui/panel";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";

export function ProgramForm({
  clients,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const [state, formAction, pending] = useActionState(createProgram, { error: null });

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <Field label="Account" required>
          <Select name="clientId" required defaultValue={defaultClientId ?? ""}>
            <option value="" disabled>
              Select account…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Program Name" required>
          <Input name="name" required placeholder="Student Uniform Program" />
        </Field>
        <Field label="Description">
          <Input name="description" placeholder="Approved crest, placements, and thread palette." />
        </Field>

        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

        <div className="flex justify-end">
          <SubmitButton pending={pending}>Create Program</SubmitButton>
        </div>
      </Panel>
    </form>
  );
}
