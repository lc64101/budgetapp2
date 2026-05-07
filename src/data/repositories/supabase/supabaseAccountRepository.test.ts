import { describe, expect, it, vi } from "vitest";
import { SupabaseAccountRepository } from "@/data/repositories/supabase/supabaseAccountRepository";

function createMockSupabaseForGetSettings() {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from, rpc: vi.fn() },
    mocks: { from, select, eq, single },
  };
}

describe("SupabaseAccountRepository", () => {
  it("loads account settings snapshot", async () => {
    const { client, mocks } = createMockSupabaseForGetSettings();
    mocks.single.mockResolvedValue({
      data: {
        user_id: "u1",
        dark_mode: true,
        pay_frequency: "weekly",
        dashboard_layout: {
          order: ["focus", "available", "spent"],
          hidden: ["spent"],
        },
        updated_at: "2026-03-09T00:00:00Z",
        version: 4,
        last_modified_by_session: "session-1",
      },
      error: null,
    });

    const repository = new SupabaseAccountRepository(client as never);
    const result = await repository.getSettings("u1");

    expect(result).toEqual({
      darkMode: true,
      payFrequency: "weekly",
      dashboardLayout: {
        order: ["focus", "available", "spent"],
        hidden: ["spent"],
        modules: [
          "savings_total",
          "investments_total",
          "spending_total",
          "savings_over_time",
          "investments_over_time",
          "spending_over_time",
        ],
      },
      version: 4,
      updatedAt: "2026-03-09T00:00:00Z",
    });
    expect(mocks.from).toHaveBeenCalledWith("app_settings");
  });

  it("loads modular dashboard tile metadata when provided", async () => {
    const { client, mocks } = createMockSupabaseForGetSettings();
    mocks.single.mockResolvedValue({
      data: {
        user_id: "u1",
        dark_mode: false,
        pay_frequency: "monthly",
        dashboard_layout: {
          order: ["available", "spent", "focus"],
          hidden: [],
          tiles: {
            available: {
              x: 1,
              y: 0,
              width: 2,
              height: 1,
              size: "large",
              enabledModules: ["savings_total", "spending_over_time"],
            },
          },
        },
        updated_at: "2026-03-09T00:00:00Z",
        version: 4,
        last_modified_by_session: "session-1",
      },
      error: null,
    });

    const repository = new SupabaseAccountRepository(client as never);
    const result = await repository.getSettings("u1");

    expect(result.dashboardLayout.tiles?.available).toEqual({
      x: 1,
      y: 0,
      width: 2,
      height: 1,
      size: "large",
      enabledModules: ["savings_total", "spending_over_time"],
    });
  });

  it("throws on settings load failure", async () => {
    const { client, mocks } = createMockSupabaseForGetSettings();
    mocks.single.mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    const repository = new SupabaseAccountRepository(client as never);

    await expect(repository.getSettings("u1")).rejects.toThrow("Failed to load account settings: permission denied");
  });

  it("requires complete settings for atomic update", async () => {
    const repository = new SupabaseAccountRepository({ rpc: vi.fn() } as never);

    await expect(repository.updateSettings("u1", { darkMode: true }, 1)).rejects.toThrow(
      "Both darkMode and payFrequency are required for atomic settings updates",
    );
  });

  it("maps rpc update response into mutation metadata", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        user_id: "u1",
        dark_mode: false,
        pay_frequency: "monthly",
        dashboard_layout: { order: ["available", "spent", "focus"], hidden: [] },
        updated_at: "2026-03-09T01:00:00Z",
        version: 5,
        last_modified_by_session: "session-2",
      },
      error: null,
    });

    const repository = new SupabaseAccountRepository({ rpc } as never);

    const result = await repository.updateSettings(
      "u1",
      {
        darkMode: false,
        payFrequency: "monthly",
      },
      4,
    );

    expect(result).toEqual({
      version: 5,
      updatedAt: "2026-03-09T01:00:00Z",
      lastModifiedBySession: "session-2",
    });
    expect(rpc).toHaveBeenCalledWith("rpc_update_app_settings", expect.objectContaining({ p_expected_version: 4 }));
  });

  it("throws when rpc update fails", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Version conflict" },
    });

    const repository = new SupabaseAccountRepository({ rpc } as never);

    await expect(
      repository.updateSettings(
        "u1",
        {
          darkMode: true,
          payFrequency: "fortnightly",
        },
        99,
      ),
    ).rejects.toThrow("Failed to update account settings: Version conflict");
  });

  it("updates dashboard layout with dedicated rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        user_id: "u1",
        dark_mode: true,
        pay_frequency: "monthly",
        dashboard_layout: { order: ["focus", "available", "spent"], hidden: ["spent"] },
        updated_at: "2026-03-10T02:00:00Z",
        version: 7,
        last_modified_by_session: "session-3",
      },
      error: null,
    });

    const repository = new SupabaseAccountRepository({ rpc } as never);

    const result = await repository.updateDashboardLayout(
      "u1",
      { order: ["focus", "available", "spent"], hidden: ["spent"] },
      6,
    );

    expect(result).toEqual({
      version: 7,
      updatedAt: "2026-03-10T02:00:00Z",
      lastModifiedBySession: "session-3",
    });
    expect(rpc).toHaveBeenCalledWith("rpc_update_dashboard_layout", expect.objectContaining({ p_expected_version: 6 }));
  });

  it("throws when dashboard layout rpc fails", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Version conflict" },
    });

    const repository = new SupabaseAccountRepository({ rpc } as never);

    await expect(
      repository.updateDashboardLayout("u1", { order: ["available", "spent", "focus"], hidden: [] }, 2),
    ).rejects.toThrow("Failed to update dashboard layout: Version conflict");
  });
});
