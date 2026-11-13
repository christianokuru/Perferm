import { expect, test } from "@playwright/test";

import { expectPath, headerAccountLink } from "./helpers";

/** Visitor journeys: no account needed, nothing is written to the database. */

test("home page loads with the shop header", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Perferm/);
  await expect(page.getByRole("banner")).toBeVisible();
});

test("signed-out visitors are sent to sign in, and remember where they were going", async ({ page }) => {
  await page.goto("/account/orders");
  await expectPath(page, /^\/login\?next=%2Faccount%2Forders$/);

  await page.goto("/admin");
  await expectPath(page, /^\/login\?next=%2Fadmin$/);
});

test("a wrong password shows a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("nobody.e2e@example.com");
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password combination doesn't match our records.")).toBeVisible();
  await expectPath(page, "/login");
});

test("sign-up checks the form before creating anything", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Please enter your full name")).toBeVisible();
  await expect(page.getByText("Please accept the terms to continue")).toBeVisible();
  await expectPath(page, "/register");
});

test("an unknown product is a real 404", async ({ page }) => {
  const response = await page.goto("/product/this-scent-does-not-exist");
  expect(response?.status()).toBe(404);
});

test("sign in and sign up are easy to find, on phones too", async ({ page }) => {
  await page.goto("/shop");
  // The header's account icon is visible at every screen size and opens sign-in.
  await expect(headerAccountLink(page)).toBeVisible();
  await expect(headerAccountLink(page)).toHaveAttribute("href", "/login");

  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) {
    await menu.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "Sign in" })).toBeVisible();
    await dialog.getByRole("link", { name: "Create account" }).click();
    await expectPath(page, "/register");
  }
});
