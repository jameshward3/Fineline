import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Product</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Add a blank good to the catalog. Embroidery locations can be added after saving.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
