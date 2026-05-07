import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateUser } from "@/lib/api/authMiddleware";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe("authenticateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user id and supabase client", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as never);

    await expect(authenticateUser()).resolves.toEqual({
      userId: "user-123",
      supabase,
    });
  });

  it("throws when there is no authenticated user", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as never);

    await expect(authenticateUser()).rejects.toThrow("Unauthorized");
  });
});