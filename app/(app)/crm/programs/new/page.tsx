import { requireSession } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProgramForm } from "@/components/crm/program-form";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await requireSession();
  const { clientId } = await searchParams;
  const clients = await prisma.client.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Program</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Establish a repeatable embroidery relationship for this account.
        </p>
      </div>
      <ProgramForm clients={clients} defaultClientId={clientId} />
    </div>
  );
}
