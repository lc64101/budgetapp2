import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthIdentityService,
  isEmailIdentifier,
  normalizeUsername,
  validateUsername,
} from "@/services/auth/AuthIdentityService";

describe("auth identity helpers", () => {
  it("normalizes usernames to lowercase", () => {
    expect(normalizeUsername("  Liam_C  ")).toBe("liam_c");
  });

  it("detects email identifiers", () => {
    expect(isEmailIdentifier("user@example.com")).toBe(true);
    expect(isEmailIdentifier("budget_user")).toBe(false);
  });

  it("validates username format", () => {
    expect(validateUsername("ok_name")).toBeNull();
    expect(validateUsername("ab")).toContain("3-24");
    expect(validateUsername("bad-name")).toContain("letters, numbers, or underscores");
  });
});

describe("AuthIdentityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects duplicate usernames", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "p1" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const service = new AuthIdentityService({ from } as never);

    await expect(service.assertUsernameAvailable("taken_name")).rejects.toThrow("Username is already taken");
  });

  it("allows keeping the current username for the same user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "p1" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const service = new AuthIdentityService({ from } as never);

    await expect(service.assertUsernameAvailable("taken_name", "p1")).resolves.toBe("taken_name");
  });

  it("resolves username logins to email addresses", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "user-1" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const getUserById = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "alex@example.com" } },
      error: null,
    });
    const service = new AuthIdentityService({ from, auth: { admin: { getUserById } } } as never);

    await expect(service.resolveEmailForLogin("Alex_User")).resolves.toBe("alex@example.com");
  });

  it("passes email identifiers through for login", async () => {
    const service = new AuthIdentityService({} as never);
    await expect(service.resolveEmailForLogin("USER@Example.com")).resolves.toBe("user@example.com");
  });
});