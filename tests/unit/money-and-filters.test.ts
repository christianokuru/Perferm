import { describe, expect, it } from "vitest";

import { countActiveFilters, filtersToSearchParams, parseShopFilters } from "@/lib/catalog/filters";
import { formatNaira, koboToNaira, naira } from "@/lib/money";
import { createReference } from "@/lib/utils";

describe("money (integer kobo)", () => {
  it("formats kobo as whole Naira", () => {
    expect(formatNaira(12_500_000)).toBe("₦125,000");
    expect(formatNaira(0)).toBe("₦0");
  });

  it("converts without floating-point drift", () => {
    expect(naira(0.1 + 0.2)).toBe(30);
    expect(naira(19_999.99)).toBe(1_999_999);
    expect(koboToNaira(1_999_999)).toBe(19_999.99);
  });
});

describe("order references", () => {
  it("are PF- plus 8 unambiguous characters, and unique", () => {
    const refs = new Set(Array.from({ length: 500 }, () => createReference()));
    expect(refs.size).toBe(500);
    for (const ref of refs) expect(ref).toMatch(/^PF-[A-HJ-NP-Z2-9]{8}$/);
  });
});

describe("shop filters from the URL", () => {
  it("keeps only known values (never trusts the URL)", () => {
    const filters = parseShopFilters(new URLSearchParams("gender=her,hacker&sort=nope&price=free&collection=secret&q=%20oud%20"), ["oud"]);
    expect(filters.gender).toEqual(["her"]);
    expect(filters.sort).toBe("featured");
    expect(filters.price).toBeNull();
    expect(filters.collection).toBeNull();
    expect(filters.q).toBe("oud");
  });

  it("caps very long searches", () => {
    expect(parseShopFilters({ q: "x".repeat(500) }).q).toHaveLength(80);
  });

  it("round-trips through the URL", () => {
    const original = parseShopFilters(new URLSearchParams("gender=him&gender=unisex&collection=oud"), ["oud"]);
    const again = parseShopFilters(filtersToSearchParams(original), ["oud"]);
    expect(again).toEqual(original);
    expect(countActiveFilters(again)).toBe(3);
    expect(countActiveFilters(again, true)).toBe(2);
  });
});
