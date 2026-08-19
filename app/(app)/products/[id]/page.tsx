import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/queries/products";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { AddLocationForm } from "@/components/products/add-location-form";
import { formatInches } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">{product.name}</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {product.brand} · {product.category}
            {product.sku ? ` · ${product.sku}` : ""}
          </p>
        </div>
        {product.cost != null && <Badge tone="accent">${product.cost.toFixed(2)}</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel>
          <PanelHeader title="Product Details" />
          <dl className="text-sm space-y-2">
            <Row label="Material" value={product.material} />
            <Row label="Fabric Weight" value={product.fabricWeight} />
            <Row label="Stretch" value={product.stretch} />
            <Row label="Supplier" value={product.supplier} />
            <Row
              label="Available Colors"
              value={product.availableColors.length ? product.availableColors.join(", ") : null}
            />
            <Row label="Notes" value={product.notes} />
          </dl>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Embroidery Locations"
            subtitle="Configurable per-location size and setup guidance"
          />
          <div className="space-y-2 mb-4">
            {product.locations.map((loc) => (
              <div key={loc.id} className="rounded-md border border-border bg-surface-inset p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{loc.name}</p>
                  <Badge>
                    Max {formatInches(loc.maxWidthInches)} × {formatInches(loc.maxHeightInches)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-ink-muted">
                  {loc.standardWidthMinInches && (
                    <span>
                      Standard: {formatInches(loc.standardWidthMinInches)}–
                      {formatInches(loc.standardWidthMaxInches)} wide
                    </span>
                  )}
                  {loc.recommendedHoop && <span>Hoop: {loc.recommendedHoop}</span>}
                  {loc.recommendedStabilizer && <span>Stabilizer: {loc.recommendedStabilizer}</span>}
                  {loc.orientation && <span>Orientation: {loc.orientation}</span>}
                </div>
                {loc.placementNotes && (
                  <p className="text-xs text-ink-faint mt-1.5">{loc.placementNotes}</p>
                )}
              </div>
            ))}
            {product.locations.length === 0 && (
              <p className="text-sm text-ink-faint py-4 text-center">No locations configured yet.</p>
            )}
          </div>
          <AddLocationForm productId={product.id} />
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Production Setups"
          action={
            <Link href={`/setups/new?productId=${product.id}`} className="text-xs text-accent hover:underline">
              + New setup for this product
            </Link>
          }
        />
        <div className="divide-y divide-border">
          {product.productionSetups.map((s) => (
            <Link
              key={s.id}
              href={`/setups/${s.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 -mx-2 px-2 rounded-md"
            >
              <div>
                <p className="text-sm text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted">
                  {s.location?.name} · {s.hoop} · {s.stabilizer}
                </p>
              </div>
              {s.isFavorite && <Badge tone="warning">Favorite</Badge>}
            </Link>
          ))}
          {product.productionSetups.length === 0 && (
            <p className="text-sm text-ink-faint py-6 text-center">No setups saved for this product yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink text-right">{value}</dd>
    </div>
  );
}
