"use client";

import { Dispatch, SetStateAction, useMemo } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Map as MapIcon,
  PanelLeftClose,
  Search,
} from "lucide-react";

type MapRecord = {
  id: string;
  label: string;
  src: string;
};

type MarkerCategory = {
  name: string;
  subcategories: string[];
};

type MarkerVisibilityState = {
  categories: Record<string, boolean>;
  subcategories: Record<string, Record<string, boolean>>;
};

type SkinOption = {
  key: string;
  label: string;
  iconSrc?: string;
};

type Props = {
  maps: MapRecord[];
  activeMapId: string;
  mapMenuOpen: boolean;
  setMapMenuOpen: Dispatch<SetStateAction<boolean>>;
  markerMenuOpen: boolean;
  setMarkerMenuOpen: Dispatch<SetStateAction<boolean>>;
  skinsMenuOpen: boolean;
  setSkinsMenuOpen: Dispatch<SetStateAction<boolean>>;
  setActiveMapId: (mapId: string) => void;
  resetView: () => void;
  markerMenuSearch: string;
  setMarkerMenuSearch: Dispatch<SetStateAction<string>>;
  activeMarkersCount: number;
  filteredMarkerMenuTree: MarkerCategory[];
  expandedMarkerMenuCategories: string[];
  setExpandedMarkerMenuCategories: Dispatch<SetStateAction<string[]>>;
  activeVisibility: MarkerVisibilityState;
  toggleMarkerMenuCategory: (categoryName: string) => void;
  toggleMarkerMenuSubcategory: (categoryName: string, subcategory: string) => void;
  showAllMarkersForMap: () => void;
  hideAllMarkersForMap: () => void;
  skins: SkinOption[];
  activeSkinKey: string;
  setSkin: (skinKey: string) => void;
};

function TacticalCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition ${
        checked
          ? "border-emerald-300/70 bg-emerald-400/15 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.22)]"
          : "border-white/15 bg-black/35 text-transparent"
      }`}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  );
}

function MenuButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-10 w-10 items-center justify-center rounded-[10px] border text-[9px] font-bold uppercase tracking-[0.22em] transition ${
        active
          ? "border-emerald-300/45 bg-zinc-900/95 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
          : "border-white/12 bg-black/60 text-zinc-300 hover:border-white/25 hover:text-white"
      }`}
      aria-label={label}
      title={label}
    >
      <span>{label.slice(0, 3)}</span>
    </button>
  );
}

export default function PdaSideMenus({
  maps,
  activeMapId,
  mapMenuOpen,
  setMapMenuOpen,
  markerMenuOpen,
  setMarkerMenuOpen,
  skinsMenuOpen,
  setSkinsMenuOpen,
  setActiveMapId,
  resetView,
  markerMenuSearch,
  setMarkerMenuSearch,
  activeMarkersCount,
  filteredMarkerMenuTree,
  expandedMarkerMenuCategories,
  setExpandedMarkerMenuCategories,
  activeVisibility,
  toggleMarkerMenuCategory,
  toggleMarkerMenuSubcategory,
  showAllMarkersForMap,
  hideAllMarkersForMap,
  skins,
  activeSkinKey,
  setSkin,
}: Props) {
  const activeMap = useMemo(
    () => maps.find((map) => map.id === activeMapId) ?? maps[0],
    [maps, activeMapId],
  );

  const toggleCategoryExpanded = (categoryName: string) => {
    setExpandedMarkerMenuCategories((current) =>
      current.includes(categoryName)
        ? current.filter((item) => item !== categoryName)
        : [...current, categoryName],
    );
  };

  const closeOthersAndToggle = (target: "map" | "legend" | "skin") => {
    setMapMenuOpen(target === "map" ? !mapMenuOpen : false);
    setMarkerMenuOpen(target === "legend" ? !markerMenuOpen : false);
    setSkinsMenuOpen(target === "skin" ? !skinsMenuOpen : false);
  };

  return (
    <div className="pointer-events-none absolute left-[5.2%] top-[21%] z-50 flex items-start gap-3">
      <div className="pointer-events-auto flex flex-col gap-2">
        <MenuButton active={mapMenuOpen} label="Map" onClick={() => closeOthersAndToggle("map")} />
        <MenuButton active={markerMenuOpen} label="Legend" onClick={() => closeOthersAndToggle("legend")} />
        <MenuButton active={skinsMenuOpen} label="Skin" onClick={() => closeOthersAndToggle("skin")} />
      </div>

      {mapMenuOpen ? (
        <section className="pointer-events-auto w-[260px] rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(26,28,31,0.96),rgba(10,11,13,0.98))] p-3 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.48)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">Map menu</p>
              <p className="mt-1 text-xs text-zinc-300">Locations list</p>
            </div>
            <button
              type="button"
              onClick={() => setMapMenuOpen(false)}
              className="rounded-md border border-white/10 bg-black/30 p-1 text-zinc-300 transition hover:border-white/20 hover:text-white"
              aria-label="Close map menu"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-emerald-400/15 bg-black/25 px-3 py-2">
            <div className="flex items-center gap-2 text-emerald-200">
              <MapIcon className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Current map</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-white">{activeMap?.label ?? "Unknown map"}</p>
          </div>

          <div className="max-h-[255px] space-y-1.5 overflow-y-auto pr-1">
            {maps.map((map) => {
              const active = map.id === activeMapId;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => {
                    setActiveMapId(map.id);
                    resetView();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-emerald-300/40 bg-emerald-400/10 text-white"
                      : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/16 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold uppercase tracking-[0.12em]">{map.label}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">Location</p>
                  </div>
                  <span
                    className={`ml-3 h-2.5 w-2.5 rounded-full ${
                      active ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.95)]" : "bg-zinc-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {markerMenuOpen ? (
        <section className="pointer-events-auto w-[315px] rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(26,28,31,0.97),rgba(9,10,12,0.985))] p-3 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">Legend</p>
              <p className="mt-1 text-xs text-zinc-300">Marker categories · {activeMarkersCount} visible records</p>
            </div>
            <button
              type="button"
              onClick={() => setMarkerMenuOpen(false)}
              className="rounded-md border border-white/10 bg-black/30 p-1 text-zinc-300 transition hover:border-white/20 hover:text-white"
              aria-label="Close legend menu"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={markerMenuSearch}
              onChange={(event) => setMarkerMenuSearch(event.target.value)}
              placeholder="Search locations, categories, or markers"
              className="h-10 w-full rounded-xl border border-white/10 bg-black/35 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300/40"
            />
          </div>

          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={showAllMarkersForMap}
              className="flex-1 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-400/15"
            >
              Show all
            </button>
            <button
              type="button"
              onClick={hideAllMarkersForMap}
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-200 transition hover:border-white/20 hover:text-white"
            >
              Hide all
            </button>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {filteredMarkerMenuTree.map((category) => {
              const expanded = expandedMarkerMenuCategories.includes(category.name);
              const categoryChecked = activeVisibility.categories[category.name] ?? true;
              return (
                <div
                  key={category.name}
                  className="rounded-xl border border-white/8 bg-black/20"
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.name)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-zinc-300 transition hover:border-white/20 hover:text-white"
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleMarkerMenuCategory(category.name)}
                      className="flex items-center gap-2"
                    >
                      <TacticalCheck checked={categoryChecked} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCategoryExpanded(category.name)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-[12px] font-semibold uppercase tracking-[0.12em] text-white">
                        {category.name}
                      </p>
                    </button>
                  </div>

                  {expanded ? (
                    <div className="border-t border-white/8 px-2 py-2">
                      <div className="space-y-1">
                        {category.subcategories.map((subcategory) => {
                          const checked =
                            activeVisibility.subcategories[category.name]?.[subcategory] ?? true;

                          return (
                            <button
                              key={subcategory}
                              type="button"
                              onClick={() =>
                                toggleMarkerMenuSubcategory(category.name, subcategory)
                              }
                              className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition hover:border-white/10 hover:bg-white/[0.03]"
                            >
                              <TacticalCheck checked={checked} />
                              <span className="truncate text-[12px] text-zinc-300">
                                {subcategory}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {skinsMenuOpen ? (
        <section className="pointer-events-auto w-[230px] rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(26,28,31,0.97),rgba(9,10,12,0.985))] p-3 text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">Skin menu</p>
              <p className="mt-1 text-xs text-zinc-300">PDA frame variants</p>
            </div>
            <button
              type="button"
              onClick={() => setSkinsMenuOpen(false)}
              className="rounded-md border border-white/10 bg-black/30 p-1 text-zinc-300 transition hover:border-white/20 hover:text-white"
              aria-label="Close skins menu"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {skins.map((skin) => {
              const active = skin.key === activeSkinKey;
              return (
                <button
                  key={skin.key}
                  type="button"
                  onClick={() => setSkin(skin.key)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-emerald-300/35 bg-emerald-400/10 text-white"
                      : "border-white/8 bg-white/[0.03] text-zinc-300 hover:border-white/16 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {skin.iconSrc ? (
                      <img
                        src={skin.iconSrc}
                        alt={skin.label}
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold uppercase">{skin.label.slice(0, 2)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold uppercase tracking-[0.12em]">
                      {skin.label}
                    </p>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      active ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.95)]" : "bg-zinc-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}