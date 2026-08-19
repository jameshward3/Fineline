import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { requireSession } from "@/lib/current-user";
import { getProducts } from "@/lib/queries/products";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

export default async function ProductsPage() {
  const session = await requireSession();
  const products = await getProducts(session.user.organizationId);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Product Catalog</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Blank goods and their embroidery locations, reusable across designs.
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium px-3 py-2"
        >
          <PlusCircle size={14} />
          New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <Panel className="h-full hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.brand}</p>
                </div>
                <Badge>{p.category}</Badge>
              </div>
              <p className="text-xs text-ink-muted line-clamp-2">{p.material}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-ink-faint">
                <span>{p._count.locations} location{p._count.locations === 1 ? "" : "s"}</span>
                <span>{p._count.productionSetups} setup{p._count.productionSetups === 1 ? "" : "s"}</span>
              </div>
            </Panel>
          </Link>
        ))}
        {products.length === 0 && (
          <Panel className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-ink-faint text-center py-8">No products yet.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
