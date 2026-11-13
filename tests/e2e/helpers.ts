import { expect, type Page } from "@playwright/test";

/** A throwaway account. example.com never receives mail, and the journey deletes it at the end. */
export function tempCustomer() {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    name: "Test Customer",
    email: `e2e.${id}@example.com`,
    phone: "0801 234 5678",
    password: `Pf${id}9Aa`, // see tempPasswordFor
  };
}

/** Rebuilds a temporary customer's password from its email (both come from the same id). */
export function tempPasswordFor(email: string) {
  const id = /^e2e\.(?:changed\.)?([a-z0-9]+)@example\.com$/.exec(email)?.[1];
  if (!id) throw new Error(`Not a temporary test account: ${email}`);
  return `Pf${id}9Aa`;
}

/** Deletes an account through the app's own Delete account form. Returns false if it can't sign in (already gone). */
export async function deleteAccountViaUi(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto("/login");
  await signIn(page, email, password);
  const outcome = await Promise.race([
    page.waitForURL((url) => url.pathname !== "/login", { timeout: 30_000 }).then(() => "in" as const),
    page.getByText("That email and password combination doesn't match our records.").waitFor({ timeout: 30_000 }).then(() => "gone" as const),
  ]);
  if (outcome === "gone") return false;

  await page.goto("/account/settings");
  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Delete account" }) });
  await section.getByRole("button", { name: "Delete account" }).click();
  await section.getByLabel("Password", { exact: true }).fill(password);
  await section.getByLabel('Type "DELETE" to confirm').fill("DELETE");
  await section.getByRole("button", { name: "Delete permanently" }).click();
  await expectPath(page, "/");
  return true;
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** The account control in the shop header: a person icon when signed out, initials when signed in. */
export function headerAccountLink(page: Page) {
  return page.getByRole("banner").getByTestId("account-avatar");
}

export async function expectPath(page: Page, path: string | RegExp) {
  await expect(page).toHaveURL((url) => (typeof path === "string" ? url.pathname === path : path.test(url.pathname + url.search)), {
    timeout: 30_000,
  });
}
