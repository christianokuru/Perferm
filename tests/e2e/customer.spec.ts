import { expect, test } from "@playwright/test";

import { deleteAccountViaUi, expectPath, headerAccountLink, signIn, tempCustomer } from "./helpers";

/**
 * A customer's whole account life, end to end: sign up (no confirmation email),
 * sign out and back in, change email, delete the account. It creates one
 * temporary account in the configured Supabase project and deletes it again.
 */
test.describe.configure({ mode: "serial" });

const customer = tempCustomer();
let email = customer.email;
let deleted = false;

// If a step fails midway, still remove the temporary account.
test.afterAll(async ({ browser }) => {
  if (deleted) return;
  const page = await browser.newPage();
  await deleteAccountViaUi(page, email, customer.password).catch((error) => console.warn(`Clean-up failed for ${email}:`, error));
  await page.close();
});

test("signs up and lands in their account straight away", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(customer.name);
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Phone").fill(customer.phone);
  await page.getByLabel("Password", { exact: true }).fill(customer.password);
  await page.getByLabel("Confirm password").fill(customer.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expectPath(page, "/account");
  await expect(page.getByText("check your inbox")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /hello/i })).toBeVisible();
});

test("can't sign up twice with the same email", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(customer.name);
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Phone").fill(customer.phone);
  await page.getByLabel("Password", { exact: true }).fill(customer.password);
  await page.getByLabel("Confirm password").fill(customer.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/An account with this email already exists/)).toBeVisible();
});

test("signing in from the account icon lands on the customer dashboard, never admin", async ({ page }) => {
  await page.goto("/");
  await expect(headerAccountLink(page)).toHaveAccessibleName("Sign in");
  await headerAccountLink(page).click();
  await expectPath(page, "/login");
  await signIn(page, email, customer.password);
  await expectPath(page, "/account");

  // Signed in, the header shows their initials and links to their own dashboard.
  await expect(headerAccountLink(page)).toHaveAttribute("href", "/account");
  await expect(headerAccountLink(page)).toHaveText("TC");
  await expect(headerAccountLink(page)).toHaveAccessibleName(`Account, ${customer.name}`);
  await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);

  // The admin area is hidden: customers get the shop's "not found" page and no admin navigation.
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /evaporated/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Customers" })).toHaveCount(0);
});

test("returns to the page they were sent from", async ({ page }) => {
  await page.goto("/login?next=/wishlist");
  await signIn(page, email, customer.password);
  await expectPath(page, "/wishlist");
});

test("changes email instantly, but only with the right password", async ({ page }) => {
  await page.goto("/login");
  await signIn(page, email, customer.password);
  await expectPath(page, "/account");
  await page.goto("/account/settings");

  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Email", exact: true }) });
  const newEmail = email.replace("e2e.", "e2e.changed.");
  await section.getByLabel("New email").fill(newEmail);
  await section.getByLabel("Current password").fill("NotMyPassword1");
  await section.getByRole("button", { name: "Change email" }).click();
  await expect(section.getByText("Your password is incorrect.")).toBeVisible();

  await section.getByLabel("Current password").fill(customer.password);
  await section.getByRole("button", { name: "Change email" }).click();
  await expect(section.getByLabel("Current email")).toHaveValue(newEmail);
  email = newEmail;
});

test("deletes the account, after which it can't sign in", async ({ page }) => {
  expect(await deleteAccountViaUi(page, email, customer.password)).toBe(true);
  deleted = true;

  await page.goto("/login");
  await signIn(page, email, customer.password);
  await expect(page.getByText("That email and password combination doesn't match our records.")).toBeVisible();
});
