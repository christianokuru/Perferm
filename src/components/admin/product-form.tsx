"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { concentrationLabels, familyLabels, genderLabels } from "@/lib/catalog/labels";
import { collections } from "@/lib/data/collections";
import { koboToNaira, naira } from "@/lib/money";
import type { Concentration, Gender, Product, ScentFamily } from "@/lib/types";
import { focusFirstError } from "@/lib/focus";
import { slugify } from "@/lib/utils";
import { validate, type FieldErrors } from "@/lib/validation/fields";
import { imageSourceField, productFormSchema } from "@/lib/validation/admin";
import { useAdminStore } from "@/stores/admin-store";

import { AdminCard, AdminHeading } from "./admin-shell";

interface VariantDraft {
  id?: string;
  label: string;
  price: string;
  compareAtPrice: string;
  stock: string;
}

interface Draft {
  name: string;
  house: string;
  tagline: string;
  description: string;
  gender: Gender;
  concentration: Concentration;
  families: ScentFamily[];
  collections: string[];
  top: string;
  heart: string;
  base: string;
  longevity: string;
  sillage: string;
  images: string[];
  variants: VariantDraft[];
  isNew: boolean;
  isBestseller: boolean;
}

const MAX_UPLOAD_BYTES = 1_500_000;

function toDraft(product?: Product): Draft {
  if (!product) {
    return {
      name: "", house: "", tagline: "", description: "", gender: "unisex", concentration: "edp", families: [], collections: [],
      top: "", heart: "", base: "", longevity: "8–10 hours", sillage: "Moderate", images: [],
      variants: [{ label: "50 ml", price: "", compareAtPrice: "", stock: "10" }], isNew: true, isBestseller: false,
    };
  }
  return {
    name: product.name, house: product.house, tagline: product.tagline, description: product.description,
    gender: product.gender, concentration: product.concentration, families: product.families, collections: product.collections,
    top: product.notes.top.join(", "), heart: product.notes.heart.join(", "), base: product.notes.base.join(", "),
    longevity: product.longevity, sillage: product.sillage, images: product.images.map((i) => i.src),
    variants: product.variants.map((v) => ({
      id: v.id, label: v.label, price: String(koboToNaira(v.price)),
      compareAtPrice: v.compareAtPrice ? String(koboToNaira(v.compareAtPrice)) : "", stock: String(v.stock),
    })),
    isNew: Boolean(product.isNew), isBestseller: Boolean(product.isBestseller),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminCard className="p-5 md:p-6">
      <h2 className="mb-5 text-body text-ink">{title}</h2>
      <div className="space-y-5">{children}</div>
    </AdminCard>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const upsert = useAdminStore((s) => s.upsertProduct);
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleIn = <T extends string>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const setVariant = (index: number, patch: Partial<VariantDraft>) =>
    set("variants", draft.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const addImageUrl = () => {
    const parsed = imageSourceField.safeParse(imageUrl);
    if (!parsed.success) return setErrors((e) => ({ ...e, imageUrl: parsed.error.issues[0].message }));
    set("images", [...draft.images, parsed.data]);
    setImageUrl("");
    setErrors(({ imageUrl: _ignored, ...rest }) => rest);
  };

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|avif)$/.test(file.type)) return toast.error("Upload a PNG, JPEG, WebP or AVIF image.");
    if (file.size > MAX_UPLOAD_BYTES) return toast.error("Images must be under 1.5 MB.");
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && set("images", [...draft.images, reader.result]);
    reader.readAsDataURL(file);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const parsed = validate(productFormSchema, draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError("Please fix the highlighted fields.");
      focusFirstError();
      return;
    }
    const d = parsed.data;
    const slug = product?.slug ?? slugify(d.name);
    const next: Product = {
      id: product?.id ?? `p-${slug}-${crypto.randomUUID().slice(0, 6)}`,
      slug,
      name: d.name,
      house: d.house,
      tagline: d.tagline,
      description: d.description,
      gender: d.gender,
      concentration: d.concentration,
      families: d.families,
      collections: d.collections,
      notes: { top: d.top, heart: d.heart, base: d.base },
      images: d.images.map((src, i) => ({ src, alt: `${d.name} — image ${i + 1}` })),
      variants: d.variants.map((v) => ({
        id: v.id ?? `${slug}-${slugify(v.label)}-${crypto.randomUUID().slice(0, 4)}`,
        label: v.label,
        price: naira(v.price),
        compareAtPrice: typeof v.compareAtPrice === "number" && v.compareAtPrice > 0 ? naira(v.compareAtPrice) : undefined,
        stock: v.stock,
      })),
      longevity: d.longevity,
      sillage: d.sillage,
      rating: product?.rating ?? 0,
      reviewCount: product?.reviewCount ?? 0,
      isNew: d.isNew,
      isBestseller: d.isBestseller,
      createdAt: product?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
    upsert(next);
    toast.success(product ? "Product updated" : "Product created");
    router.push("/admin/products");
  };

  const err = (key: string) => errors[key];

  return (
    <form onSubmit={onSubmit} noValidate>
      <AdminHeading
        title={product ? `Edit ${product.name}` : "New product"}
        actions={
          <>
            <ButtonLink href="/admin/products" variant="ghost">
              Cancel
            </ButtonLink>
            <Button type="submit">{product ? "Save changes" : "Create product"}</Button>
          </>
        }
      />
      {formError ? <div className="mb-6"><FormMessage>{formError}</FormMessage></div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Section title="Details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Name" error={err("name")}>{(p) => <Input {...p} maxLength={80} value={draft.name} onChange={(e) => set("name", e.target.value)} />}</Field>
              <Field label="House" error={err("house")}>{(p) => <Input {...p} maxLength={60} value={draft.house} onChange={(e) => set("house", e.target.value)} />}</Field>
            </div>
            <Field label="Tagline" error={err("tagline")} hint="e.g. Smoked oud, Taif rose & ambergris">{(p) => <Input {...p} maxLength={120} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />}</Field>
            <Field label="Description" error={err("description")}>{(p) => <Textarea {...p} rows={5} maxLength={2000} value={draft.description} onChange={(e) => set("description", e.target.value)} />}</Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="For" error={err("gender")}>
                {(p) => (
                  <Select {...p} value={draft.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                    {(Object.keys(genderLabels) as Gender[]).map((g) => <option key={g} value={g}>{genderLabels[g]}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Type" error={err("concentration")}>
                {(p) => (
                  <Select {...p} value={draft.concentration} onChange={(e) => set("concentration", e.target.value as Concentration)}>
                    {(Object.keys(concentrationLabels) as Concentration[]).map((c) => <option key={c} value={c}>{concentrationLabels[c]}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Longevity" error={err("longevity")}>{(p) => <Input {...p} maxLength={30} value={draft.longevity} onChange={(e) => set("longevity", e.target.value)} />}</Field>
              <Field label="Sillage" error={err("sillage")}>{(p) => <Input {...p} maxLength={30} value={draft.sillage} onChange={(e) => set("sillage", e.target.value)} />}</Field>
            </div>
          </Section>

          <Section title="Notes">
            <Field label="Top notes" error={err("top")} hint="Comma separated">{(p) => <Input {...p} maxLength={200} value={draft.top} onChange={(e) => set("top", e.target.value)} />}</Field>
            <Field label="Heart notes" error={err("heart")}>{(p) => <Input {...p} maxLength={200} value={draft.heart} onChange={(e) => set("heart", e.target.value)} />}</Field>
            <Field label="Base notes" error={err("base")}>{(p) => <Input {...p} maxLength={200} value={draft.base} onChange={(e) => set("base", e.target.value)} />}</Field>
          </Section>

          <Section title="Sizes & pricing (₦)">
            {draft.variants.map((v, i) => (
              <div key={v.id ?? i} className="grid grid-cols-2 items-end gap-3 border-b border-mist pb-5 last:border-0 last:pb-0 sm:grid-cols-[1fr_1fr_1fr_0.7fr_auto]">
                <Field label="Size" error={err(`variants.${i}.label`)}>{(p) => <Input {...p} maxLength={20} value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} />}</Field>
                <Field label="Price" error={err(`variants.${i}.price`)}>{(p) => <Input {...p} inputMode="numeric" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value.replace(/\D/g, "") })} />}</Field>
                <Field label="Was" optional error={err(`variants.${i}.compareAtPrice`)}>{(p) => <Input {...p} inputMode="numeric" value={v.compareAtPrice} onChange={(e) => setVariant(i, { compareAtPrice: e.target.value.replace(/\D/g, "") })} />}</Field>
                <Field label="Stock" error={err(`variants.${i}.stock`)}>{(p) => <Input {...p} inputMode="numeric" value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value.replace(/\D/g, "") })} />}</Field>
                <Button variant="ghost" aria-label={`Remove size ${v.label || i + 1}`} disabled={draft.variants.length === 1} onClick={() => set("variants", draft.variants.filter((_, j) => j !== i))}>
                  <TrashIcon size={16} />
                </Button>
              </div>
            ))}
            {err("variants") ? <p className="text-caption text-danger">{err("variants")}</p> : null}
            <Button variant="outline" size="sm" icon={<PlusIcon size={14} />} disabled={draft.variants.length >= 6} onClick={() => set("variants", [...draft.variants, { label: "", price: "", compareAtPrice: "", stock: "0" }])}>
              Add size
            </Button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Images">
            {draft.images.length ? (
              <ul className="grid grid-cols-3 gap-2">
                {draft.images.map((src, i) => (
                  <li key={`${i}-${src.slice(-24)}`} className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-pearl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- previews include local data URLs */}
                    <img src={src} alt="" className="size-full object-cover" />
                    <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => set("images", draft.images.filter((_, j) => j !== i))} className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-ink">
                      <CloseIcon size={12} />
                    </button>
                    {i === 0 ? <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">Cover</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {err("images") ? <p className="text-caption text-danger">{err("images")}</p> : null}
            <label className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-graphite/40 text-body-sm text-ink hover:border-ink">
              Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={onUpload} className="sr-only" />
            </label>
            <div className="flex gap-2">
              <Field label="Or paste an image link" error={err("imageUrl")} className="flex-1" srOnlyLabel>
                {(p) => <Input {...p} type="url" placeholder="https://images.pexels.com/…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />}
              </Field>
              <Button variant="outline" onClick={addImageUrl} disabled={!imageUrl}>Add</Button>
            </div>
          </Section>

          <Section title="Scent family">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(familyLabels) as ScentFamily[]).map((f) => (
                <Checkbox key={f} label={familyLabels[f]} checked={draft.families.includes(f)} onChange={() => set("families", toggleIn(draft.families, f))} />
              ))}
            </div>
            {err("families") ? <p className="text-caption text-danger">{err("families")}</p> : null}
          </Section>

          <Section title="Collections & flags">
            <div className="grid gap-3">
              {collections.map((c) => (
                <Checkbox key={c.slug} label={c.title} checked={draft.collections.includes(c.slug)} onChange={() => set("collections", toggleIn(draft.collections, c.slug))} />
              ))}
            </div>
            <div className="grid gap-3 border-t border-mist pt-5">
              <Checkbox label="Mark as new" checked={draft.isNew} onChange={(e) => set("isNew", e.target.checked)} />
              <Checkbox label="Mark as bestseller" checked={draft.isBestseller} onChange={(e) => set("isBestseller", e.target.checked)} />
            </div>
          </Section>
        </div>
      </div>
    </form>
  );
}

export function EditProductView() {
  const { id } = useParams<{ id: string }>();
  const product = useAdminStore((s) => s.products.find((p) => p.id === id));
  if (!product) {
    return <EmptyState title="Product not found" description="It may have been deleted." action={<ButtonLink href="/admin/products">Back to products</ButtonLink>} />;
  }
  return <ProductForm key={product.id} product={product} />;
}
