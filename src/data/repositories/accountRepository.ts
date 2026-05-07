import type { AccountMutationMeta } from "@/contracts/sync";

export const DASHBOARD_TILE_IDS = ["available", "spent", "focus"] as const;

export type DashboardTileId = (typeof DASHBOARD_TILE_IDS)[number];

export const DASHBOARD_MODULE_IDS = [
  "savings_total",
  "savings_over_time",
  "savings_goals",
  "investments_total",
  "investments_over_time",
  "investments_goals",
  "spending_total",
  "spending_over_time",
  "spending_goals",
] as const;

export type DashboardModuleId = (typeof DASHBOARD_MODULE_IDS)[number];

export type DashboardTileSize = "small" | "medium" | "large";

export interface DashboardTilePreferences {
  x: number;
  y: number;
  width: number;
  height: number;
  size: DashboardTileSize;
  enabledModules: DashboardModuleId[];
}

export interface DashboardLayout {
  order: DashboardTileId[];
  hidden: DashboardTileId[];
  modules?: DashboardModuleId[];
  tiles?: Partial<Record<DashboardTileId, DashboardTilePreferences>>;
}

export const DEFAULT_DASHBOARD_MODULES: DashboardModuleId[] = [
  "savings_total",
  "investments_total",
  "spending_total",
  "savings_over_time",
  "investments_over_time",
  "spending_over_time",
];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  order: [...DASHBOARD_TILE_IDS],
  hidden: [],
  modules: [...DEFAULT_DASHBOARD_MODULES],
};

export function normalizeDashboardLayout(input: unknown): DashboardLayout {
  if (!input || typeof input !== "object") {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const maybeOrder = Array.isArray((input as { order?: unknown }).order)
    ? ((input as { order: unknown[] }).order as string[])
    : [];
  const maybeHidden = Array.isArray((input as { hidden?: unknown }).hidden)
    ? ((input as { hidden: unknown[] }).hidden as string[])
    : [];

  const validOrder = maybeOrder.filter((id): id is DashboardTileId =>
    DASHBOARD_TILE_IDS.includes(id as DashboardTileId),
  );
  const dedupedOrder = [...new Set(validOrder)];
  const missingTiles = DASHBOARD_TILE_IDS.filter((id) => !dedupedOrder.includes(id));

  const validHidden = maybeHidden.filter((id): id is DashboardTileId =>
    DASHBOARD_TILE_IDS.includes(id as DashboardTileId),
  );

  const modulesInput = Array.isArray((input as { modules?: unknown }).modules)
    ? ((input as { modules: unknown[] }).modules as string[])
    : [];
  const validModules = modulesInput.filter((id): id is DashboardModuleId =>
    DASHBOARD_MODULE_IDS.includes(id as DashboardModuleId),
  );

  const tilesInput = (input as { tiles?: unknown }).tiles;
  const normalizedTiles =
    tilesInput && typeof tilesInput === "object"
      ? DASHBOARD_TILE_IDS.reduce<Partial<Record<DashboardTileId, DashboardTilePreferences>>>((acc, tileId) => {
          const raw = (tilesInput as Record<string, unknown>)[tileId];
          if (!raw || typeof raw !== "object") {
            return acc;
          }

          const row = raw as Record<string, unknown>;
          const modules = Array.isArray(row.enabledModules)
            ? (row.enabledModules as string[]).filter((value): value is DashboardModuleId =>
                DASHBOARD_MODULE_IDS.includes(value as DashboardModuleId),
              )
            : [];

          const size = row.size === "small" || row.size === "large" ? row.size : "medium";
          const width = typeof row.width === "number" && row.width > 0 ? row.width : size === "large" ? 2 : 1;
          const height = typeof row.height === "number" && row.height > 0 ? row.height : 1;

          acc[tileId] = {
            x: typeof row.x === "number" ? row.x : 0,
            y: typeof row.y === "number" ? row.y : 0,
            width,
            height,
            size,
            enabledModules: [...new Set(modules)],
          };
          return acc;
        }, {})
      : undefined;

  return {
    order: [...dedupedOrder, ...missingTiles],
    hidden: [...new Set(validHidden)],
    modules:
      validModules.length > 0
        ? [...new Set(validModules)]
        : [...DEFAULT_DASHBOARD_MODULES],
    ...(normalizedTiles && Object.keys(normalizedTiles).length > 0 ? { tiles: normalizedTiles } : {}),
  };
}

export interface AccountSettings {
  darkMode: boolean;
  payFrequency: "weekly" | "fortnightly" | "monthly";
}

export interface AccountSettingsSnapshot extends AccountSettings {
  version: number;
  updatedAt: string;
  dashboardLayout: DashboardLayout;
}

export interface AccountRepository {
  getSettings(userId: string): Promise<AccountSettingsSnapshot>;
  updateSettings(userId: string, settings: Partial<AccountSettings>, currentVersion: number): Promise<AccountMutationMeta>;
  updateDashboardLayout(userId: string, layout: DashboardLayout, currentVersion: number): Promise<AccountMutationMeta>;
}
