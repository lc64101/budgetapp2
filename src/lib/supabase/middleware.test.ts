import { describe, expect, it } from "vitest";
import { getAuthRedirectPath } from "@/lib/supabase/middleware";

describe("getAuthRedirectPath", () => {
  it("redirects unauthenticated users away from protected routes", () => {
    expect(getAuthRedirectPath("/", false)).toBe("/login");
    expect(getAuthRedirectPath("/settings", false)).toBe("/login");
    expect(getAuthRedirectPath("/calculator/income", false)).toBe("/login");
  });

  it("does not redirect unauthenticated users for auth or api paths", () => {
    expect(getAuthRedirectPath("/login", false)).toBeNull();
    expect(getAuthRedirectPath("/api/account/settings", false)).toBeNull();
  });

  it("redirects authenticated users away from login", () => {
    expect(getAuthRedirectPath("/login", true)).toBe("/");
  });

  it("allows authenticated users onto protected routes", () => {
    expect(getAuthRedirectPath("/", true)).toBeNull();
    expect(getAuthRedirectPath("/social", true)).toBeNull();
  });
});