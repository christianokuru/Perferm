import { describe, expect, it } from "vitest";

import { homePath, postSignInPath } from "@/lib/auth/redirect";
import { safeRedirectPath } from "@/lib/utils";

describe("homePath", () => {
  it("sends admins to the store dashboard and everyone else to their account", () => {
    expect(homePath("admin")).toBe("/admin");
    expect(homePath("customer")).toBe("/account");
    expect(homePath(null)).toBe("/account");
    expect(homePath(undefined)).toBe("/account");
  });
});

describe("postSignInPath", () => {
  it("lands admins on /admin when they opened sign-in directly", () => {
    expect(postSignInPath(null, "admin")).toBe("/admin");
  });

  it("lands admins on /admin when the account icon or guard sent them (?next=/account)", () => {
    // Regression: the header icon links to /account, so signed-out admins arrive with next=/account.
    expect(postSignInPath("/account", "admin")).toBe("/admin");
  });

  it("lands customers on /account", () => {
    expect(postSignInPath(null, "customer")).toBe("/account");
    expect(postSignInPath("/account", "customer")).toBe("/account");
  });

  it("returns everyone to the specific page they came from", () => {
    expect(postSignInPath("/checkout", "admin")).toBe("/checkout");
    expect(postSignInPath("/wishlist", "customer")).toBe("/wishlist");
    expect(postSignInPath("/account/orders/PF-ABCD1234", "admin")).toBe("/account/orders/PF-ABCD1234");
  });

  it("never redirects off-site", () => {
    for (const evil of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/ok\nSet-Cookie:x"]) {
      expect(postSignInPath(evil, "customer")).toBe("/account");
      expect(postSignInPath(evil, "admin")).toBe("/admin");
    }
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-origin paths with their query", () => {
    expect(safeRedirectPath("/shop?gender=women")).toBe("/shop?gender=women");
  });

  it("falls back for missing or unsafe values", () => {
    expect(safeRedirectPath(null)).toBe("/account");
    expect(safeRedirectPath("")).toBe("/account");
    expect(safeRedirectPath("https://evil.example", "/")).toBe("/");
    expect(safeRedirectPath("//evil.example")).toBe("/account");
  });
});
