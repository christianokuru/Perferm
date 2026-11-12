"use client";

import Link from "next/link";

import { ProductImage } from "@/components/product/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { toast } from "@/components/ui/toast";
import { formatNaira } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MAX_LINE_QUANTITY } from "@/lib/validation/schemas";
import { useCartStore, type CartLine } from "@/stores/cart-store";

export function CartLineItem({ line, onNavigate, size = "md" }: { line: CartLine; onNavigate?: () => void; size?: "md" | "lg" }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const add = useCartStore((s) => s.add);

  const handleRemove = () => {
    remove(line.variantId);
    const { quantity, ...snapshot } = line;
    toast.show(`${line.name} removed`, { label: "Undo", onClick: () => add(snapshot, quantity) });
  };

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.slug}`} onClick={onNavigate} className="shrink-0">
        <ProductImage
          src={line.image}
          alt={line.name}
          sizes={size === "lg" ? "128px" : "96px"}
          className={cn("aspect-[4/5]", size === "lg" ? "w-28 md:w-32" : "w-22")}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption text-smoke">{line.house}</p>
            <Link href={`/product/${line.slug}`} onClick={onNavigate} className="block truncate text-body text-ink hover:underline">
              {line.name}
            </Link>
            <p className="mt-0.5 text-caption text-smoke">{line.variantLabel}</p>
          </div>
          <p className="shrink-0 text-body-sm text-ink tabular-nums">{formatNaira(line.unitPrice * line.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={MAX_LINE_QUANTITY}
            onChange={(q) => setQuantity(line.variantId, q)}
            label={`Quantity of ${line.name}`}
          />
          <button type="button" onClick={handleRemove} className="text-caption text-smoke underline-offset-4 hover:text-ink hover:underline">
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
