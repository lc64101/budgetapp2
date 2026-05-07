"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement } from "react";
import {
  DEFAULT_DASHBOARD_MODULES,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardTilePreferences,
  type DashboardLayout,
  type DashboardTileId,
} from "@/data/repositories/accountRepository";
import { useAccountSettings } from "@/features/account/useAccountSettings";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import { useAccountRealtimeInvalidation } from "@/features/shared/sync/useAccountRealtimeInvalidation";
import { DASHBOARD_MODULE_CATALOG } from "@/features/dashboard/tileRegistry";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";

interface TileConfig {
  id: DashboardTileId;
  title: string;
  render: () => ReactElement;
}

const BOARD_MAX_WIDTH = 760;
const TILE_DEFAULT_WIDTH = 220;
const TILE_DEFAULT_HEIGHT = 190;
const TILE_MIN_SIZE = 140;
const TILE_GAP = 12;

const TILES: TileConfig[] = [
  {
    id: "available",
    title: "Available",
    render: () => (
      <article className="card stat-card highlight-card">
        <span className="stat-label">Available</span>
        <span className="highlight-value">$0.00</span>
        <span className="stat-helper">Ready to assign to goals and essentials.</span>
        <span className="stat-trend">+0.0% vs last cycle</span>
      </article>
    ),
  },
  {
    id: "spent",
    title: "Spent This Period",
    render: () => (
      <article className="card stat-card">
        <span className="stat-label">Spent This Period</span>
        <span className="stat-value">$0.00</span>
        <span className="stat-helper">Once transactions sync, this card updates instantly.</span>
        <div className="kpi-grid">
          <div className="kpi-item">
            <span className="stat-helper">Needs</span>
            <b>$0.00</b>
          </div>
          <div className="kpi-item">
            <span className="stat-helper">Wants</span>
            <b>$0.00</b>
          </div>
        </div>
      </article>
    ),
  },
  {
    id: "focus",
    title: "Today&apos;s Focus",
    render: () => (
      <article className="card list-card">
        <h2 className="calc-section-title">Today&apos;s Focus</h2>
        <div className="list-item">
          <div>
            <span className="list-title">Review fixed expense totals</span>
            <span className="list-subtle">Catch subscription drift before payday.</span>
          </div>
          <span className="chip">5 min</span>
        </div>
        <div className="list-item">
          <div>
            <span className="list-title">Set one short savings target</span>
            <span className="list-subtle">Start with a low-friction weekly amount.</span>
          </div>
          <span className="chip">Quick win</span>
        </div>
      </article>
    ),
  },
];

function baseTilePlacement(index: number): DashboardTilePreferences {
  const columns = Math.max(1, Math.floor((BOARD_MAX_WIDTH + TILE_GAP) / (TILE_DEFAULT_WIDTH + TILE_GAP)));

  return {
    x: (index % columns) * (TILE_DEFAULT_WIDTH + TILE_GAP),
    y: Math.floor(index / columns) * (TILE_DEFAULT_HEIGHT + TILE_GAP),
    width: TILE_DEFAULT_WIDTH,
    height: TILE_DEFAULT_HEIGHT,
    size: "medium",
    enabledModules: [],
  };
}

function tilePlacement(layout: DashboardLayout, tileId: DashboardTileId): DashboardTilePreferences {
  const index = layout.order.indexOf(tileId);
  const fallback = baseTilePlacement(index === -1 ? 0 : index);
  const raw = layout.tiles?.[tileId];

  if (!raw) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    x: Math.max(0, raw.x),
    y: Math.max(0, raw.y),
    width: Math.max(TILE_MIN_SIZE, raw.width),
    height: Math.max(TILE_MIN_SIZE, raw.height),
  };
}

function rectanglesOverlap(a: DashboardTilePreferences, b: DashboardTilePreferences): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function findNearestOpenSpot(
  occupied: DashboardTilePreferences[],
  width: number,
  height: number,
  boardWidth: number,
): { x: number; y: number } {
  const step = 24;

  for (let y = 0; y <= 5000; y += step) {
    for (let x = 0; x <= Math.max(0, boardWidth - width); x += step) {
      const probe: DashboardTilePreferences = {
        x,
        y,
        width,
        height,
        size: "medium",
        enabledModules: [],
      };

      if (!occupied.some((tile) => rectanglesOverlap(tile, probe))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: 0 };
}

function withAutoMovedTiles(layout: DashboardLayout, anchorTileId: DashboardTileId, boardWidth: number): DashboardLayout {
  const nextTiles: Partial<Record<DashboardTileId, DashboardTilePreferences>> = {
    ...(layout.tiles ?? {}),
  };

  const anchor = tilePlacement(layout, anchorTileId);
  const occupied: DashboardTilePreferences[] = [anchor];

  for (const tileId of layout.order) {
    if (tileId === anchorTileId || layout.hidden.includes(tileId)) {
      continue;
    }

    const placement = tilePlacement(layout, tileId);
    if (!occupied.some((tile) => rectanglesOverlap(tile, placement))) {
      occupied.push(placement);
      nextTiles[tileId] = placement;
      continue;
    }

    const openSpot = findNearestOpenSpot(occupied, placement.width, placement.height, boardWidth);
    const moved = {
      ...placement,
      x: openSpot.x,
      y: openSpot.y,
    };
    occupied.push(moved);
    nextTiles[tileId] = moved;
  }

  nextTiles[anchorTileId] = anchor;

  return {
    ...layout,
    tiles: nextTiles,
  };
}

function layoutForCompare(input: DashboardLayout): DashboardLayout {
  const tiles = Object.entries(input.tiles ?? {}).reduce<Partial<Record<DashboardTileId, DashboardTilePreferences>>>(
    (acc, [tileId, placement]) => {
      if (!placement) {
        return acc;
      }

      acc[tileId as DashboardTileId] = {
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        size: "medium",
        enabledModules: placement.enabledModules,
      };

      return acc;
    },
    {},
  );

  return {
    order: [...input.order],
    hidden: [...(input.hidden ?? [])],
    modules: [...(input.modules ?? DEFAULT_DASHBOARD_MODULES)],
    tiles,
  };
}

function hasLayoutChanges(current: DashboardLayout, baseline: DashboardLayout): boolean {
  return JSON.stringify(layoutForCompare(current)) !== JSON.stringify(layoutForCompare(baseline));
}

function buildEasyDashboardLayout(layout: DashboardLayout, boardWidth: number): DashboardLayout {
  const safeBoardWidth = Math.max(TILE_MIN_SIZE, boardWidth || BOARD_MAX_WIDTH);
  const columns = safeBoardWidth >= TILE_MIN_SIZE * 2 + TILE_GAP ? 2 : 1;
  const cardWidth = Math.max(TILE_MIN_SIZE, Math.floor((safeBoardWidth - TILE_GAP * (columns - 1)) / columns));
  const baseHeight = TILE_DEFAULT_HEIGHT;
  const rowHeights: number[] = [];

  const nextTiles = layout.order.reduce<Partial<Record<DashboardTileId, DashboardTilePreferences>>>((acc, tileId) => {
    const index = layout.order.indexOf(tileId);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const base = tilePlacement(layout, tileId);
    const preferredHeight = tileId === "focus" ? 220 : TILE_DEFAULT_HEIGHT;
    rowHeights[row] = Math.max(rowHeights[row] ?? baseHeight, preferredHeight);

    let y = 0;
    for (let rowIndex = 0; rowIndex < row; rowIndex += 1) {
      y += (rowHeights[rowIndex] ?? baseHeight) + TILE_GAP;
    }

    acc[tileId] = {
      ...base,
      x: col * (cardWidth + TILE_GAP),
      y,
      width: cardWidth,
      height: preferredHeight,
    };

    return acc;
  }, {});

  return {
    ...layout,
    hidden: [],
    modules: [...DEFAULT_DASHBOARD_MODULES],
    tiles: nextTiles,
  };
}

export function DashboardHome() {
  const [editing, setEditing] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [draftLayout, setDraftLayout] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUT);
  const [editBaseline, setEditBaseline] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUT);
  const [draggingTile, setDraggingTile] = useState<DashboardTileId | null>(null);
  const [resizingTile, setResizingTile] = useState<DashboardTileId | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { reportError } = useGlobalError();

  const { userId, isLoading: isLoadingUser, error: userError } = useCurrentUser();
  const {
    data,
    error,
    isLoading,
    updateDashboardLayout,
    isSavingDashboardLayout,
  } = useAccountSettings(userId ?? "");

  useAccountRealtimeInvalidation({ userId: userId ?? "", queryKeyPrefix: ["account-settings", userId] });

  const activeLayout = editing ? draftLayout : data?.dashboardLayout ?? DEFAULT_DASHBOARD_LAYOUT;
  const persistedLayout = {
    ...(data?.dashboardLayout ?? DEFAULT_DASHBOARD_LAYOUT),
    modules: data?.dashboardLayout.modules ?? DEFAULT_DASHBOARD_MODULES,
    tiles: data?.dashboardLayout.tiles,
  };
  const activeModules = activeLayout.modules ?? DEFAULT_DASHBOARD_MODULES;
  const isLayoutDirty = useMemo(
    () => editing && hasLayoutChanges(draftLayout, editBaseline),
    [draftLayout, editBaseline, editing],
  );
  const moduleGroups = useMemo(
    () => ({
      savings: DASHBOARD_MODULE_CATALOG.filter((moduleDef) => moduleDef.category === "savings"),
      investments: DASHBOARD_MODULE_CATALOG.filter((moduleDef) => moduleDef.category === "investments"),
      spending: DASHBOARD_MODULE_CATALOG.filter((moduleDef) => moduleDef.category === "spending"),
    }),
    [],
  );

  const visibleTiles = useMemo(() => {
    return activeLayout.order
      .map((id) => TILES.find((tile) => tile.id === id))
      .filter((tile): tile is TileConfig => Boolean(tile));
  }, [activeLayout.order]);

  const boardHeight = useMemo(() => {
    const maxBottom = visibleTiles.reduce((max, tile) => {
      const placement = tilePlacement(activeLayout, tile.id);
      return Math.max(max, placement.y + placement.height);
    }, 0);

    return Math.max(420, maxBottom + TILE_GAP);
  }, [activeLayout, visibleTiles]);

  const tileContentScale = (placement: DashboardTilePreferences): number => {
    const widthScale = placement.width / TILE_DEFAULT_WIDTH;
    const heightScale = placement.height / TILE_DEFAULT_HEIGHT;
    return Math.min(1.28, Math.max(0.82, Math.min(widthScale, heightScale)));
  };

  const handleDragStart = (tileId: DashboardTileId, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!editing || resizingTile) {
      return;
    }

    if ((event.target as HTMLElement).closest(".tile-resize-handle")) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    event.preventDefault();
    const boardRect = board.getBoundingClientRect();
    const start = tilePlacement(draftLayout, tileId);
    const offsetX = event.clientX - boardRect.left - start.x;
    const offsetY = event.clientY - boardRect.top - start.y;
    setDraggingTile(tileId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextX = Math.max(0, Math.min(board.clientWidth - start.width, moveEvent.clientX - boardRect.left - offsetX));
      const nextY = Math.max(0, moveEvent.clientY - boardRect.top - offsetY);

      setDraftLayout((current) => {
        const currentPlacement = tilePlacement(current, tileId);
        const moved = {
          ...current,
          tiles: {
            ...(current.tiles ?? {}),
            [tileId]: {
              ...currentPlacement,
              x: nextX,
              y: nextY,
            },
          },
        };

        return withAutoMovedTiles(moved, tileId, board.clientWidth);
      });
    };

    const onPointerUp = () => {
      setDraggingTile(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleResizeStart = (tileId: DashboardTileId, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!editing) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const boardRect = board.getBoundingClientRect();
    const start = tilePlacement(draftLayout, tileId);
    setResizingTile(tileId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.max(
        TILE_MIN_SIZE,
        Math.min(board.clientWidth - start.x, moveEvent.clientX - boardRect.left - start.x),
      );
      const nextHeight = Math.max(TILE_MIN_SIZE, moveEvent.clientY - boardRect.top - start.y);

      setDraftLayout((current) => {
        const currentPlacement = tilePlacement(current, tileId);
        const resized = {
          ...current,
          tiles: {
            ...(current.tiles ?? {}),
            [tileId]: {
              ...currentPlacement,
              width: nextWidth,
              height: nextHeight,
            },
          },
        };

        return withAutoMovedTiles(resized, tileId, board.clientWidth);
      });
    };

    const onPointerUp = () => {
      setResizingTile(null);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleSaveLayout = async () => {
    if (!isLayoutDirty) {
      setShowModuleEditor(false);
      setEditing(false);
      return;
    }

    const pendingLayout = draftLayout;
    setEditing(false);
    setShowModuleEditor(false);

    try {
      await updateDashboardLayout(pendingLayout);
    } catch (saveError) {
      setEditing(true);
      const message = saveError instanceof Error ? saveError.message : "Failed to save dashboard layout.";

      if (message.toLowerCase().includes("latest supabase migration")) {
        reportError("Dashboard layout persistence is pending migration. Your edits stay local for now.");
        return;
      }

      reportError(message);
    }
  };

  const handleAutoSetLayout = () => {
    const boardWidth = boardRef.current?.clientWidth ?? BOARD_MAX_WIDTH;
    setDraftLayout((current) => buildEasyDashboardLayout(current, boardWidth));
    setShowModuleEditor(false);
  };

  if (isLoadingUser || isLoading) {
    return <div className="app-loading">Loading dashboard...</div>;
  }

  if (userError || error || !userId) {
    return <div className="app-loading">Unable to load dashboard layout.</div>;
  }

  return (
    <section className="page dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">Your weekly momentum, key balances, and today&apos;s priorities.</p>
      </div>

      <button
        type="button"
        className="dashboard-top-edit-btn"
        aria-label={editing ? "Close dashboard editor" : "Edit dashboard"}
        title={editing ? "Close editor" : "Edit dashboard"}
        onClick={() => {
          if (editing) {
            setDraftLayout(editBaseline);
            setEditing(false);
            setShowModuleEditor(false);
            return;
          }

          setDraftLayout(persistedLayout);
          setEditBaseline(persistedLayout);
          setEditing(true);
          setShowModuleEditor(false);
        }}
      >
        <span aria-hidden="true">{editing ? "×" : "✎"}</span>
      </button>

      {editing ? (
        <div className="dashboard-edit-toolbar">
          <button
            type="button"
            className="btn"
            onClick={() => setShowModuleEditor((current) => !current)}
          >
            {showModuleEditor ? "Hide Modules" : "Modules"}
          </button>
          <button type="button" className="btn" onClick={handleAutoSetLayout}>
            Auto-Set
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSavingDashboardLayout || !isLayoutDirty}
            onClick={() => {
              void handleSaveLayout();
            }}
          >
            {isSavingDashboardLayout ? "Saving..." : "Save Layout"}
          </button>
        </div>
      ) : null}

      {editing && showModuleEditor ? (
        <div
          className="dashboard-module-overlay"
          role="dialog"
          aria-label="Dashboard modules editor"
          aria-modal="false"
          onClick={() => {
            setShowModuleEditor(false);
          }}
        >
          <article className="card tile-editor dashboard-module-menu" onClick={(event) => event.stopPropagation()}>
            <div className="tile-editor-header-row">
              <h2 className="calc-section-title">Modules</h2>
            </div>
            <p className="muted">Choose which module types should be active on your dashboard.</p>
            <div className="dashboard-module-scroll-region">
              <div className="module-category-stack">
                {([
                  ["savings", "Savings"],
                  ["investments", "Investments"],
                  ["spending", "Spending"],
                ] as const).map(([groupKey, groupLabel]) => (
                  <section className="module-category-panel" key={groupKey}>
                    <div className="module-category-header">
                      <h3>{groupLabel}</h3>
                      <span className="chip">
                        {
                          moduleGroups[groupKey].filter((moduleDef) => activeModules.includes(moduleDef.id)).length
                        }
                      </span>
                    </div>
                    <div className="tile-module-grid">
                      {moduleGroups[groupKey].map((moduleDef) => {
                        const isEnabled = activeModules.includes(moduleDef.id);

                        return (
                          <label key={moduleDef.id} className="tile-module-toggle">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(event) => {
                                setDraftLayout((current) => {
                                  const modules = current.modules ?? DEFAULT_DASHBOARD_MODULES;

                                  return {
                                    ...current,
                                    modules: event.target.checked
                                      ? [...new Set([...modules, moduleDef.id])]
                                      : modules.filter((moduleId) => moduleId !== moduleDef.id),
                                  };
                                });
                              }}
                            />
                            <span>
                              <b>{moduleDef.title}</b>
                              <small>{moduleDef.description}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="dashboard-module-footer">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowModuleEditor(false);
                }}
              >
                Done
              </button>
            </div>
          </article>
        </div>
      ) : null}

      <div
        ref={boardRef}
        className={`dashboard-grid${editing ? " editing" : ""}`}
        style={{ minHeight: boardHeight }}
      >
        {visibleTiles.map((tile) => (
          <div
            key={tile.id}
            className={`dashboard-tile${draggingTile === tile.id ? " dragging" : ""}${resizingTile === tile.id ? " resizing" : ""}`}
            onPointerDown={(event) => handleDragStart(tile.id, event)}
            style={(() => {
              const placement = tilePlacement(activeLayout, tile.id);
              return {
                left: placement.x,
                top: placement.y,
                width: placement.width,
                height: placement.height,
                ["--tile-content-scale" as const]: tileContentScale(placement),
              };
            })()}
          >
            <div className="dashboard-tile-card">
              {tile.render()}
              {editing ? (
                <button
                  type="button"
                  className="tile-resize-handle"
                  aria-label={`Resize ${tile.title} tile`}
                  onPointerDown={(event) => handleResizeStart(tile.id, event)}
                >
                  <span className="sr-only">Resize</span>
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
