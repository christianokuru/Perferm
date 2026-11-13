import { expect, test } from "@playwright/test";

import { expectPath, headerAccountLink, signIn } from "./helpers";

/**
 * Admin journeys. They need a real admin login, read from .env.test.local
 * (gitignored) as E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD; skipped without it.
 * Read-only: nothing in the store is changed.
 */
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";

test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env.test.local to run admin tests");

test("signing in from the account icon takes an admin straight to the admin dashboard", async ({ page }) => {
  await page.goto("/");
  await headerAccountLink(page).click();
  await expectPath(page, "/login");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");
});

test("a signed-out admin sent to /login?next=/account still lands on the admin dashboard", async ({ page }) => {
  await page.goto("/account");
  await expectPath(page, /^\/login\?next=%2Faccount$/);
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");
});

test("opening sign-in directly also lands on the admin dashboard", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");
  await expect(page.getByRole("link", { name: "Orders" }).first()).toBeVisible();
});

test("the shop header shows the admin's initials, linking to the admin dashboard", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");
  await page.goto("/shop");
  await expect(headerAccountLink(page)).toHaveAttribute("href", "/admin");
  await expect(headerAccountLink(page)).toHaveText(/^[A-Z?]{1,2}$/);
  await expect(headerAccountLink(page)).toHaveAccessibleName(/^Admin dashboard, /);
});

test("a specific page still wins over the dashboard", async ({ page }) => {
  await page.goto("/login?next=/wishlist");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/wishlist");
});

test("the admin area has its own profile page and never links to the customer dashboard", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");

  await expect(page.locator('a[href="/account"]')).toHaveCount(0);
  await page.getByRole("banner").getByRole("link", { name: "Your profile" }).click();
  await expectPath(page, "/admin/profile");
  await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible();
  await expect(page.getByLabel("Current email")).toHaveValue(adminEmail.toLowerCase());
  await expect(page.getByRole("heading", { name: "Password" })).toBeVisible();
});

test("an admin can sign out from the admin area", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, adminEmail, adminPassword);
  await expectPath(page, "/admin");

  await page.getByRole("banner").getByRole("button", { name: "Sign out" }).click();
  await expectPath(page, "/");
  await page.goto("/admin");
  await expectPath(page, /^\/login\?next=%2Fadmin$/);
});
