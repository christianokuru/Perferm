import { describe, expect, it } from "vitest";

import { formatPhone, validate } from "@/lib/validation/fields";
import { changeEmailSchema, loginSchema, registerSchema } from "@/lib/validation/schemas";

const validSignup = {
  name: "Ada Obi",
  email: "  Ada@Example.COM ",
  phone: "0801 234 5678",
  password: "Perfume2026",
  confirmPassword: "Perfume2026",
  acceptTerms: true,
};

describe("registerSchema", () => {
  it("accepts a valid sign-up and normalises email and phone", () => {
    const result = validate(registerSchema, validSignup);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("ada@example.com");
      expect(result.data.phone).toBe("+2348012345678");
    }
  });

  it("rejects weak passwords, mismatches, bad phones and unaccepted terms", () => {
    const result = validate(registerSchema, { ...validSignup, password: "short", confirmPassword: "other", phone: "12345", acceptTerms: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(["password", "phone", "acceptTerms"]));
    }
    const mismatch = validate(registerSchema, { ...validSignup, confirmPassword: "Perfume2027" });
    expect(mismatch.ok || mismatch.errors.confirmPassword).toBe("Passwords do not match");
  });

  it("accepts every common Nigerian phone format", () => {
    for (const phone of ["08012345678", "+2348012345678", "2348012345678", "0901-234-5678", "(0703) 234 5678"]) {
      expect(validate(registerSchema, { ...validSignup, phone }).ok, phone).toBe(true);
    }
  });
});

describe("loginSchema", () => {
  it("requires an email and a password", () => {
    const result = validate(loginSchema, { email: "not-an-email", password: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "password"]);
  });
});

describe("changeEmailSchema", () => {
  it("lower-cases the new email and allows the password to be omitted (Google-only accounts)", () => {
    const result = validate(changeEmailSchema, { email: "New@Example.com" });
    expect(result).toEqual({ ok: true, data: { email: "new@example.com" } });
  });
});

describe("formatPhone", () => {
  it("shows E.164 numbers the local way", () => {
    expect(formatPhone("+2348012345678")).toBe("0801 234 5678");
    expect(formatPhone("+447700900000")).toBe("+447700900000");
  });
});
