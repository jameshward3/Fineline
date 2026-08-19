import { requireSession } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "@/components/setups/setup-form";

export default async function NewSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const session = await requireSession();
  const { productId } = await searchParams;
  const products = await prisma.product.findMany({
    where: { organizationId: session.user.organizationId },
    include: { locations: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Production Setup</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Capture how this embroidery was successfully produced so it can be reused.
        </p>
      </div>
      <SetupForm products={products} defaultProductId={productId} />
    </div>
  );
}
