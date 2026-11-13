import { describe, expect, it } from "vitest";

import { authErrorMessage } from "@/lib/auth/errors";

describe("authErrorMessage", () => {
  it("keeps wrong-password errors generic (no account discovery)", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("That email and password combination doesn't match our records.");
  });

  it("tells people when an email is already registered", () => {
    expect(authErrorMessage({ code: "user_already_exists" })).toMatch(/already exists/);
    expect(authErrorMessage({ code: "email_exists" })).toMatch(/already exists/);
  });

  it("maps rate limits, weak passwords and network failures", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
    expect(authErrorMessage({ code: "weak_password" })).toMatch(/stronger password/);
    expect(authErrorMessage({ message: "Failed to fetch" })).toMatch(/couldn't reach the server/);
  });

  it("never leaks raw server messages", () => {
    expect(authErrorMessage({ message: "duplicate key value violates unique constraint" })).toBe("Something went wrong. Please try again.");
    expect(authErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });
});
