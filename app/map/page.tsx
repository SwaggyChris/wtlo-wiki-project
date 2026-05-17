"use client";

import Link from "next/link";
import "./page.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Grip,
  ImagePlus,
  Minus,
  PencilLine,
  Plus,
  Save,
  Search,
  Tag as TagIcon,
  Trash2,
  Upload,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

type SkinKey = "neutral" | "bss" | "confed";
type Point = { x: number; y: number };
type NormalizedPoint = { x: number; y: number };

type SkinConfig = {
  label: string;
  iconSrc?: string;
  frameSrc: string;
  screen: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  lights: {
    green: {
      left: number;
      top: number;
      coreSize: number;
      glowSize: number;
      haloSize: number;
    };
    red: {
      left: number;
      top: number;
      coreSize: number;
      glowSize: number;
      haloSize: number;
    };
  };
};

type MapRecord = {
  id: string;
  label: string;
  src: string;
};

type MarkerCategory = {
  name: string;
  subcategories: string[];
};

type MarkerRecord = {
  id: string;
  mapId: string;
  name: string;
  grid: string;
  description: string;
  picture?: string;
  icon?: string;
  tag: string;
  category: string;
  subcategory: string;
  x: number;
  y: number;
  createdAt: number;
  updatedAt: number;
};

type MarkerDraft = {
  name: string;
  grid: string;
  description: string;
  picture: string;
  icon: string;
  tag: string;
  category: string;
  subcategory: string;
};

type MarkerStore = Record<string, MarkerRecord[]>;
type MarkerVisibilityMap = Record<
  string,
  {
    categories: Record<string, boolean>;
    subcategories: Record<string, Record<string, boolean>>;
  }
>;

const MAP_SIZE = 2048;
const MIN_ZOOM = 1;
const MAX_ZOOM = 16;
const DEFAULT_ZOOM = 1;
const STORAGE_KEY = "wtlo-pda-markers-v4";
const CREATOR_PANEL_STORAGE_KEY = "wtlo-marker-creator-panel-v1";
const MARKER_VISIBILITY_STORAGE_KEY = "wtlo-marker-visibility-v2";
const CREATOR_PANEL_BASE_WIDTH = 336;
const CREATOR_PANEL_BASE_HEIGHT = 760;
const MARKER_CARD_WIDTH = 312;

const WHEEL_STEP = 0.35;
const ANIMATION_FACTOR = 0.2;

const CATEGORY_TREE: MarkerCategory[] = [
  { name: "Regular Bosses", subcategories: ["Stray Boar", "Symbiont Boss", "Elder Matador", "Giant Flesheater", "Crocodile", "Giant Crab"] },
  { name: "Event Bosses", subcategories: ["Frost Deer", "Hellbiont", "RW-01"] },
  { name: "Adventure Bosses", subcategories: ["Goblin", "RD-02 Frosty"] },
  { name: "Mutants", subcategories: ["Small rats", "Rats", "Big rats", "White Big Rat", "Stray Dogs", "Elder Stray dogs", "Small boars", "Boars", "Elder boars", "Small watchers", "Watchers", "Bog Watchers", "Elder Watchers", "Small Lizards", "Lizards", "Elder Lizards", "Small Flesheaters", "Elder Flesheaters", "Small Bugs", "Bugs", "Elder Bugs", "Small Cave spiders", "Cave Spiders", "Elder Cave spiders", "Big Cave Spiders", "Bloodsuckers", "Elder Bloodsuckers", "Small symbionts", "Bog Symbionts", "Shockers", "Bears", "Bog Belchers", "Small sand spiders", "Sand spiders", "Big sand spiders", "Small hornets", "Hornets", "Elder Hornets", "Fire spiders", "Small Sun spiders", "Big sun spiders", "Matadors", "small crabs", "Hogs of Coast", "Elder fire spiders", "Elder toxic spiders", "Lurkers"] },
  { name: "Neutral Mutants", subcategories: ["Chicken", "Rabbit", "Fox", "Deer"] },
  { name: "Crafting Tools", subcategories: ["Pilers", "Long lose Pilers", "Funnel", "Hose", "Hammer", "Insulating tape", "Ingot mold"] },
  { name: "Craft Items", subcategories: ["Lockpick blanks", "lockpicks", "Steel wires", "Fuel can"] },
  { name: "Base resource", subcategories: ["Firewood", "charcoal", "Coal", "Precious metals", "Fulminate of Mercury", "Nitroglycerine", "Ferrous metals", "Non-ferrous metals", "Radioactive metal", "Lead", "Plastic", "Rubber", "Glass", "Polymer", "Electronics", "Sulfur", "Radioactive metal Alpha", "Rock", "Silicon", "Chrome", "Nickel", "Small NDP crystals", "Medium NDP crystals", "Large NDP crystals", "Small NDP Stones", "Medium NDP Stones", "Large NDP Stones", "Strong Plastic", "Titanium Powder", "Titanium Ore", "NDP Powder", "NDP Polymer", "Alkali", "Chamomile", "Nettle", "Rose Bay", "Amanita", "Milk mushroom", "Toadstool", "Cep", "Calendula", "Dandelion", "Yarrow", "Dracocephalum", "Toxic toadstool", "Hornet Dust"] },
  { name: "Complex Resources", subcategories: ["Casted lead", "Gold", "Iron", "Gun Steel", "Armor Steel", "Copper", "Gun Powder", "Polymer Cloth", "Hard Leather", "Treated Firespider shell", "Chitin cloth"] },
  { name: "Stuff", subcategories: ["Weapons repair kit", "Equipments", "Resource", "Miner", "Weapon Attachments", "Artifact Container", "PDA Module", "Clothes repair kit", "Placement Kit"] },
  { name: "Spare Parts", subcategories: ["Starter", "Air filter", "Spurk plug", "Fastener - T1", "Holder-T1"] },
  { name: "Electronics", subcategories: ["External LCD display", "Power amplifier NDP - T1", "Electric screwdriver", "Microcircuit Part", "Small battery", "Medium Battery", "Large Battery", "Regulator", "Radio", "NDP Battery", "Led Lamp", "Microchip"] },
  { name: "Houseware", subcategories: ["Medical flask", "Small flask", "Salt-cellar", "Fork", "Spoon", "Nut", "Salt", "Cloth", "Plate", "Copper tube", "Duralumin Tube", "Watch", "Ring", "Sewing threds", "Matches"] },
  { name: "Misc", subcategories: ["Bolt", "Calcium Acetate", "SBM-20", "Plastic Bottle", "The body of the NDP Detector"] },
  { name: "Ammo", subcategories: ["7.62x39 HP", "7.62x54 FMJ", "5.45x39 HP", "12ga Shot Magnum", "12ga Slug", "9x18 PM FMJ", "9x18 PM HP", "7.62x25TT FMJ"] },
  { name: "Medicine", subcategories: ["Bandage" ,"Small Medkit", "Medium Medkit", "Large Medkit","Advanced Medkit","Adventure Medkit","Antirad" , "Small Antidote" , "Medium Antidote" , "Large Antidote" ,"Small Chemical Antidote" ,"Medium Chemical Antidote", "Detox" ,"Anti-burn Salve", "Lollipop" , "Champagne","Tangyuan Sweet Rice balls", "Awl Stimulator" , "Healing stimulator" ,"Tough guy stimulator" ,"Mustang Stimulator" ,"Fortuna Stimulator" ,"Smart-ass Stimulator" ] }
];

const DEFAULT_CATEGORY = CATEGORY_TREE[0].name;
const DEFAULT_SUBCATEGORY = CATEGORY_TREE[0].subcategories[0];

const EMPTY_MARKER_DRAFT: MarkerDraft = {
  name: "",
  grid: "",
  description: "",
  picture: "",
  icon: "",
  tag: "",
  category: "",
  subcategory: "",
};

function createDefaultVisibilityState(): MarkerVisibilityMap[string] {
  return {
    categories: Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, false])),
    subcategories: Object.fromEntries(
      CATEGORY_TREE.map((category) => [
        category.name,
        Object.fromEntries(category.subcategories.map((subcategory) => [subcategory, false])),
      ]),
    ),
  };
}

function safeReadMarkerVisibility(): MarkerVisibilityMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MARKER_VISIBILITY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const normalized: MarkerVisibilityMap = {};
    for (const [mapId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const defaults = createDefaultVisibilityState();
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        normalized[mapId] = defaults;
        continue;
      }
      const categories = (value as { categories?: Record<string, boolean> }).categories ?? {};
      const subcategories = (value as { subcategories?: Record<string, Record<string, boolean>> }).subcategories ?? {};
      normalized[mapId] = {
        categories: Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, typeof categories[category.name] === "boolean" ? categories[category.name] : false])),
        subcategories: Object.fromEntries(
          CATEGORY_TREE.map((category) => [
            category.name,
            Object.fromEntries(
              category.subcategories.map((subcategory) => [subcategory, typeof subcategories?.[category.name]?.[subcategory] === "boolean" ? subcategories[category.name][subcategory] : false]),
            ),
          ]),
        ),
      };
    }
    return normalized;
  } catch {
    return {};
  }
}

// LED coordinates – carefully calibrated for each skin
const SKINS: Record<SkinKey, SkinConfig> = {
  neutral: {
    label: "Neutral",
    frameSrc: "/PDA Skins/Neutral_PDA frame.png",
    iconSrc: "/PDA Skins/neutral_icon.svg",
    screen: {
      left: 13.0859375,
      top: 16.75347222222222,
      width: 75.5859375,
      height: 69.70486111111111,
    },
    lights: {
      green: {
        left: 83.15,   // original, correct position
        top: 10.70,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 19.2,
      },
      red: {
        left: 80.45,   // original, correct position
        top: 10.62,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 16.2,
      },
    },
  },
  bss: {
    label: "Black Sunset",
    frameSrc: "/PDA Skins/bss_pda frame.png",
    iconSrc: "/PDA Skins/bss_icon.svg",
    screen: {
      left: 13.0859375,
      top: 16.666666666666664,
      width: 75.537109375,
      height: 69.79166666666666,
    },
    lights: {
      green: {
        left: 83.15,   // original, correct position
        top: 10.70,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 19.2,
      },
      red: {
        left: 80.45,   // original, correct position
        top: 10.62,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 16.2,
      },
    },
  },
  confed: {
    label: "Confederation",
    frameSrc: "/PDA Skins/confed_pda frame.png",
    iconSrc: "/PDA Skins/confed_icon.svg",
    screen: {
      left: 13.134765625,
      top: 16.666666666666664,
      width: 75.5859375,
      height: 69.70486111111111,
    },
    lights: {
      green: {
        left: 83.15,   // original, correct position
        top: 10.70,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 19.2,
      },
      red: {
        left: 80.45,   // original, correct position
        top: 10.62,
        coreSize: 8.2,
        glowSize: 10.8,
        haloSize: 16.2,
      },
    },
  },
};

const DEFAULT_MAPS: MapRecord[] = [
  { id: "default", label: "Default", src: "/Maps/Default.png" },
  { id: "camp", label: "Camp", src: "/Maps/Camp.png" },
  { id: "solar-city-town", label: "Solar City Town", src: "/Maps/Solar_City_Town.png" },
  { id: "solnechny-outskirts", label: "Solnechny Outskirts", src: "/Maps/Solnechny_Outskirts.png" },
  { id: "mte", label: "MTE", src: "/Maps/MTE.png" },
  { id: "dead-forest", label: "Dead Forest", src: "/Maps/Dead_Forest.png"},
  { id: "swamp", label: "Swamp", src: "/Maps/Swamp.png" },
  { id: "minaev-mine", label: "Minaev Mine", src: "/Maps/Minaev_Mine.png" },
  { id: "exclusion-zone", label: "Exclusion Zone", src: "/Maps/Exclusion Zone.png" },
  { id: "canyon", label: "Canyon", src: "/Maps/Canyon.png" },
  { id: "testing-ground", label: "Testing Ground", src: "/Maps/Testing_Ground.png" },
  { id: "foothills", label: "Foothills", src: "/Maps/Foothills.png" },
  { id: "coast", label: "Coast", src: "/Maps/Coast.png" },
  { id: "pvp-arena-mte", label: "PvP Arena (MTE)", src: "/Maps/PvP_Arena_MTE.png" },
  { id: "pvp-arena", label: "PvP Arena", src: "/Maps/PVP_Arena.png" },
  { id: "adventure-3", label: "Adventure #3", src: "/Maps/Adventure 3.png" }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createMarkerId() {
  return `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSubcategories(categoryName: string) {
  return CATEGORY_TREE.find((category) => category.name === categoryName)?.subcategories ?? [];
}

function createTagFromValues(name: string, subcategory: string) {
  const source = (name.trim() || subcategory.trim() || "Marker")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const compactTag = source.replace(/[\s_-]+/g, "").toUpperCase();
  return (compactTag || "MARKER").slice(0, 16);
}

function makeGridFromPoint(point: NormalizedPoint) {
  const columns = 26;
  const rows = 26;
  const colIndex = clamp(Math.floor(point.x * columns), 0, columns - 1);
  const rowIndex = clamp(Math.floor(point.y * rows), 0, rows - 1);
  const colLetter = String.fromCharCode(65 + colIndex);
  return `${colLetter}${rowIndex + 1}`;
}

function safeReadMarkers(): MarkerStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const cleaned: MarkerStore = {};

    for (const [mapId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(value)) continue;

      cleaned[mapId] = value
        .filter((item): item is MarkerRecord => {
          if (!item || typeof item !== "object") return false;
          const marker = item as Partial<MarkerRecord>;

          return (
            typeof marker.id === "string" &&
            typeof marker.mapId === "string" &&
            typeof marker.name === "string" &&
            typeof marker.grid === "string" &&
            typeof marker.description === "string" &&
            typeof marker.tag === "string" &&
            typeof marker.category === "string" &&
            typeof marker.subcategory === "string" &&
            typeof marker.x === "number" &&
            typeof marker.y === "number"
          );
        })
        .map((marker) => ({
          ...marker,
          x: clamp(marker.x, 0, 1),
          y: clamp(marker.y, 0, 1),
          picture: typeof marker.picture === "string" ? marker.picture : undefined,
          icon: typeof marker.icon === "string" ? marker.icon : undefined,
          createdAt: typeof marker.createdAt === "number" ? marker.createdAt : Date.now(),
          updatedAt: typeof marker.updatedAt === "number" ? marker.updatedAt : Date.now(),
        }));
    }

    return cleaned;
  } catch {
    return {};
  }
}


function safeReadCreatorPanelState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CREATOR_PANEL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<{
      open: boolean;
      scale: number;
      position: Point;
    }>;

    return {
      open: typeof parsed.open === "boolean" ? parsed.open : true,
      scale:
        typeof parsed.scale === "number"
          ? clamp(parsed.scale, 0.8, 1.25)
          : 1,
      position: {
        x:
          parsed.position && typeof parsed.position.x === "number"
            ? parsed.position.x
            : 24,
        y:
          parsed.position && typeof parsed.position.y === "number"
            ? parsed.position.y
            : 24,
      },
    };
  } catch {
    return null;
  }
}

function setCategorySafe(previous: MarkerDraft, category: string): MarkerDraft {
  const subcategories = getSubcategories(category);
  return {
    ...previous,
    category,
    subcategory: subcategories.includes(previous.subcategory)
      ? previous.subcategory
      : subcategories[0] ?? "",
  };
}

export default function MapPage() {
  const maps = DEFAULT_MAPS;

  const [skin, setSkin] = useState<SkinKey>("neutral");
  const [activeMapId, setActiveMapId] = useState<string>(DEFAULT_MAPS[0].id);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [zoomControl, setZoomControl] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [mapLocationsMenuOpen, setMapLocationsMenuOpen] = useState(false);
  const [legendMarkMenuOpen, setLegendMarkMenuOpen] = useState(false);
  const [skinChangerMenuOpen, setSkinChangerMenuOpen] = useState(false);

  const [markersByMap, setMarkersByMap] = useState<MarkerStore>({});
  const [markerVisibilityByMap, setMarkerVisibilityByMap] = useState<MarkerVisibilityMap>({});
  const [markersReady, setMarkersReady] = useState(false);

  const [markerDraft, setMarkerDraft] = useState<MarkerDraft>(EMPTY_MARKER_DRAFT);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [placementPoint, setPlacementPoint] = useState<NormalizedPoint | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const [categorySearch, setCategorySearch] = useState("");
  const [legendMarkSearch, setLegendMarkSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, false])),
  );
  const [expandedLegendMarkCategories, setExpandedLegendMarkCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, false])),
  );
  const [creatorVisible, setCreatorVisible] = useState(false);
  const [creatorScale, setCreatorScale] = useState(0.92);
  const [creatorPosition, setCreatorPosition] = useState<Point>({ x: 24, y: 24 });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const creatorPanelRef = useRef<HTMLDivElement | null>(null);
  const markerCreatorButtonRef = useRef<HTMLButtonElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: Point;
  } | null>(null);
  const creatorDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPosition: Point;
  } | null>(null);

  const currentZoomRef = useRef(DEFAULT_ZOOM);
  const currentOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const targetZoomRef = useRef(DEFAULT_ZOOM);
  const targetOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const activeSkin = SKINS[skin];

  const activeMap = useMemo(
    () => maps.find((map) => map.id === activeMapId) ?? maps[0],
    [activeMapId, maps],
  );

  const activeMarkers = useMemo(
    () => markersByMap[activeMapId] ?? [],
    [activeMapId, markersByMap],
  );
  const activeVisibility = useMemo(
    () => markerVisibilityByMap[activeMapId] ?? createDefaultVisibilityState(),
    [activeMapId, markerVisibilityByMap],
  );

  const visibleActiveMarkers = useMemo(
    () =>
      activeMarkers.filter((marker) => {
        const categoryVisible = activeVisibility.categories[marker.category] ?? false;
        const subcategoryVisible = activeVisibility.subcategories[marker.category]?.[marker.subcategory] ?? false;
        return categoryVisible && subcategoryVisible;
      }),
    [activeMarkers, activeVisibility],
  );


  const selectedMarker = useMemo(
    () => activeMarkers.find((marker) => marker.id === selectedMarkerId) ?? null,
    [activeMarkers, selectedMarkerId],
  );

  const filteredCategoryTree = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return CATEGORY_TREE;

    return CATEGORY_TREE.map((category) => {
      const categoryMatch = category.name.toLowerCase().includes(query);
      const matchingSubcategories = category.subcategories.filter((sub) =>
        sub.toLowerCase().includes(query),
      );

      if (categoryMatch) return category;
      if (matchingSubcategories.length) {
        return { ...category, subcategories: matchingSubcategories };
      }

      return null;
    }).filter(Boolean) as MarkerCategory[];
  }, [categorySearch]);

  const filteredLegendMarkTree = useMemo(() => {
    const query = legendMarkSearch.trim().toLowerCase();
    if (!query) return CATEGORY_TREE;

    return CATEGORY_TREE.map((category) => {
      const categoryMatch = category.name.toLowerCase().includes(query);
      const matchingSubcategories = category.subcategories.filter((sub) =>
        sub.toLowerCase().includes(query),
      );

      if (categoryMatch) return category;
      if (matchingSubcategories.length) {
        return { ...category, subcategories: matchingSubcategories };
      }

      return null;
    }).filter(Boolean) as MarkerCategory[];
  }, [legendMarkSearch]);

  const baseScale = useMemo(() => {
    if (!viewport.width || !viewport.height) return 1;
    return Math.max(viewport.width / MAP_SIZE, viewport.height / MAP_SIZE);
  }, [viewport.height, viewport.width]);

  const mapPixelSize = MAP_SIZE * baseScale * zoom;

  const markerScreenPositions = useMemo(
    () =>
      visibleActiveMarkers.map((marker) => ({
        marker,
        left: offset.x + marker.x * mapPixelSize,
        top: offset.y + marker.y * mapPixelSize,
      })),
    [visibleActiveMarkers, mapPixelSize, offset.x, offset.y],
  );

  const hoverPreviewPosition = useMemo(() => {
    if (!placementPoint) return null;

    return {
      left: offset.x + placementPoint.x * mapPixelSize,
      top: offset.y + placementPoint.y * mapPixelSize,
    };
  }, [mapPixelSize, offset.x, offset.y, placementPoint]);

  const selectedMarkerCardPosition = useMemo(() => {
    if (!selectedMarker || !viewport.width || !viewport.height) return null;

    const rawLeft = offset.x + selectedMarker.x * mapPixelSize + 18;
    const rawTop = offset.y + selectedMarker.y * mapPixelSize - 205;

    return {
      left: clamp(rawLeft, 12, Math.max(12, viewport.width - MARKER_CARD_WIDTH - 12)),
      top: clamp(rawTop, 12, Math.max(12, viewport.height - 240)),
    };
  }, [mapPixelSize, offset.x, offset.y, selectedMarker, viewport.height, viewport.width]);

  const clampOffset = useCallback(
    (candidate: Point, zoomValue: number) => {
      if (!viewport.width || !viewport.height) return candidate;

      const scaledSize = MAP_SIZE * baseScale * zoomValue;
      const minX = Math.min(0, viewport.width - scaledSize);
      const minY = Math.min(0, viewport.height - scaledSize);

      const centeredX =
        scaledSize <= viewport.width ? (viewport.width - scaledSize) / 2 : candidate.x;
      const centeredY =
        scaledSize <= viewport.height ? (viewport.height - scaledSize) / 2 : candidate.y;

      return {
        x: scaledSize <= viewport.width ? centeredX : clamp(centeredX, minX, 0),
        y: scaledSize <= viewport.height ? centeredY : clamp(centeredY, minY, 0),
      };
    },
    [baseScale, viewport.height, viewport.width],
  );

  const clampCreatorPosition = useCallback(
    (candidate: Point, scaleValue = creatorScale) => {
      if (typeof window === "undefined") return candidate;

      const panelWidth = CREATOR_PANEL_BASE_WIDTH * scaleValue;
      const panelHeight = CREATOR_PANEL_BASE_HEIGHT * scaleValue;

      return {
        x: clamp(candidate.x, 12, Math.max(12, window.innerWidth - panelWidth - 12)),
        y: clamp(candidate.y, 12, Math.max(12, window.innerHeight - panelHeight - 12)),
      };
    },
    [creatorScale],
  );

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const syncViewImmediately = useCallback(
    (nextZoom: number, nextOffset: Point) => {
      stopAnimation();
      currentZoomRef.current = nextZoom;
      targetZoomRef.current = nextZoom;
      currentOffsetRef.current = nextOffset;
      targetOffsetRef.current = nextOffset;
      setZoom(nextZoom);
      setZoomControl(nextZoom);
      setOffset(nextOffset);
    },
    [stopAnimation],
  );

  const animateTowardTarget = useCallback(() => {
    const zoomDelta = targetZoomRef.current - currentZoomRef.current;
    const offsetXDelta = targetOffsetRef.current.x - currentOffsetRef.current.x;
    const offsetYDelta = targetOffsetRef.current.y - currentOffsetRef.current.y;

    const nextZoom =
      Math.abs(zoomDelta) < 0.001
        ? targetZoomRef.current
        : currentZoomRef.current + zoomDelta * ANIMATION_FACTOR;

    const nextOffset = {
      x:
        Math.abs(offsetXDelta) < 0.45
          ? targetOffsetRef.current.x
          : currentOffsetRef.current.x + offsetXDelta * ANIMATION_FACTOR,
      y:
        Math.abs(offsetYDelta) < 0.45
          ? targetOffsetRef.current.y
          : currentOffsetRef.current.y + offsetYDelta * ANIMATION_FACTOR,
    };

    currentZoomRef.current = nextZoom;
    currentOffsetRef.current = nextOffset;
    setZoom(nextZoom);
    setOffset(nextOffset);

    const done =
      nextZoom === targetZoomRef.current &&
      nextOffset.x === targetOffsetRef.current.x &&
      nextOffset.y === targetOffsetRef.current.y;

    if (done) {
      animationFrameRef.current = null;
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animateTowardTarget);
  }, []);

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = requestAnimationFrame(animateTowardTarget);
  }, [animateTowardTarget]);

  const setViewTarget = useCallback(
    (nextZoom: number, anchor?: Point) => {
      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

      if (!viewport.width || !viewport.height) {
        targetZoomRef.current = clampedZoom;
        setZoom(clampedZoom);
        setZoomControl(clampedZoom);
        return;
      }

      const sourceZoom = targetZoomRef.current;
      const sourceOffset = targetOffsetRef.current;
      const anchorPoint = anchor ?? {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

      const oldScaledSize = MAP_SIZE * baseScale * sourceZoom;
      const newScaledSize = MAP_SIZE * baseScale * clampedZoom;

      const focusX =
        oldScaledSize > 0 ? (anchorPoint.x - sourceOffset.x) / oldScaledSize : 0.5;
      const focusY =
        oldScaledSize > 0 ? (anchorPoint.y - sourceOffset.y) / oldScaledSize : 0.5;

      const nextOffset = clampOffset(
        {
          x: anchorPoint.x - focusX * newScaledSize,
          y: anchorPoint.y - focusY * newScaledSize,
        },
        clampedZoom,
      );

      targetZoomRef.current = clampedZoom;
      targetOffsetRef.current = nextOffset;
      setZoomControl(clampedZoom);
      startAnimation();
    },
    [baseScale, clampOffset, startAnimation, viewport.height, viewport.width],
  );

  const resetView = useCallback(() => {
    setViewTarget(DEFAULT_ZOOM);
  }, [setViewTarget]);

  const setActiveMapMarkers = useCallback(
    (updater: (current: MarkerRecord[]) => MarkerRecord[]) => {
      setMarkersByMap((previous) => ({
        ...previous,
        [activeMapId]: updater(previous[activeMapId] ?? []),
      }));
    },
    [activeMapId],
  );

  const resetMarkerDraft = useCallback(() => {
    setMarkerDraft(EMPTY_MARKER_DRAFT);
    setEditingMarkerId(null);
    setIsPlacingMarker(false);
    setPlacementPoint(null);
  }, []);

  const getNormalizedPointFromClient = useCallback(
    (clientX: number, clientY: number): NormalizedPoint | null => {
      const element = viewportRef.current;
      if (!element || !viewport.width || !viewport.height) return null;

      const rect = element.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const liveMapSize = MAP_SIZE * baseScale * currentZoomRef.current;

      if (!liveMapSize) return null;

      const normalizedX = (localX - currentOffsetRef.current.x) / liveMapSize;
      const normalizedY = (localY - currentOffsetRef.current.y) / liveMapSize;

      return {
        x: clamp(normalizedX, 0, 1),
        y: clamp(normalizedY, 0, 1),
      };
    },
    [baseScale, viewport.height, viewport.width],
  );

  const beginMarkerPlacement = useCallback(() => {
    setSelectedMarkerId(null);
    setIsPlacingMarker(true);
  }, []);

  const onFileToDataUrl = useCallback(
    (event: ChangeEvent<HTMLInputElement>, key: "icon" | "picture") => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        setMarkerDraft((previous) => ({
          ...previous,
          [key]: result,
        }));
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [],
  );

  const saveMarkerMeta = useCallback(() => {
    if (!editingMarkerId) return;

    const name = markerDraft.name.trim() || "Untitled marker";
    const grid = markerDraft.grid.trim() || (selectedMarker ? makeGridFromPoint(selectedMarker) : "");
    const description = markerDraft.description.trim();
    const tag = (markerDraft.tag.trim() || createTagFromValues(name, markerDraft.subcategory)).toUpperCase();

    setActiveMapMarkers((current) =>
      current.map((marker) =>
        marker.id === editingMarkerId
          ? {
              ...marker,
              name,
              grid,
              description,
              picture: markerDraft.picture.trim() || undefined,
              icon: markerDraft.icon.trim() || undefined,
              tag,
              category: markerDraft.category,
              subcategory: markerDraft.subcategory,
              updatedAt: Date.now(),
            }
          : marker,
      ),
    );

    setSelectedMarkerId(editingMarkerId);
    setEditingMarkerId(null);
    setIsPlacingMarker(false);
  }, [
    editingMarkerId,
    markerDraft.name,
    markerDraft.grid,
    markerDraft.description,
    markerDraft.picture,
    markerDraft.icon,
    markerDraft.tag,
    markerDraft.category,
    markerDraft.subcategory,
    selectedMarker,
    setActiveMapMarkers,
  ]);

  const finalizeMarkerPlacement = useCallback(
    (point: NormalizedPoint) => {
      const name = markerDraft.name.trim() || `Marker ${activeMarkers.length + 1}`;
      const grid = markerDraft.grid.trim() || makeGridFromPoint(point);
      const description = markerDraft.description.trim();
      const picture = markerDraft.picture.trim() || undefined;
      const icon = markerDraft.icon.trim() || undefined;
      const tag = (markerDraft.tag.trim() || createTagFromValues(name, markerDraft.subcategory)).toUpperCase();
      const timestamp = Date.now();

      if (editingMarkerId) {
        setActiveMapMarkers((current) =>
          current.map((marker) =>
            marker.id === editingMarkerId
              ? {
                  ...marker,
                  name,
                  grid,
                  description,
                  picture,
                  icon,
                  tag,
                  category: markerDraft.category,
                  subcategory: markerDraft.subcategory,
                  x: point.x,
                  y: point.y,
                  updatedAt: timestamp,
                }
              : marker,
          ),
        );

        setSelectedMarkerId(editingMarkerId);
      } else {
        const newMarker: MarkerRecord = {
          id: createMarkerId(),
          mapId: activeMapId,
          name,
          grid,
          description,
          picture,
          icon,
          tag,
          category: markerDraft.category,
          subcategory: markerDraft.subcategory,
          x: point.x,
          y: point.y,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        setActiveMapMarkers((current) => [...current, newMarker]);
        setSelectedMarkerId(newMarker.id);
      }

      setMarkerDraft(EMPTY_MARKER_DRAFT);
      setEditingMarkerId(null);
      setIsPlacingMarker(false);
      setPlacementPoint(null);
    },
    [
      activeMapId,
      activeMarkers.length,
      editingMarkerId,
      markerDraft.name,
      markerDraft.grid,
      markerDraft.description,
      markerDraft.picture,
      markerDraft.icon,
      markerDraft.tag,
      markerDraft.category,
      markerDraft.subcategory,
      setActiveMapMarkers,
    ],
  );

  const startEditingMarker = useCallback((marker: MarkerRecord) => {
    setMarkerDraft({
      name: marker.name,
      grid: marker.grid,
      description: marker.description,
      picture: marker.picture ?? "",
      icon: marker.icon ?? "",
      tag: marker.tag,
      category: marker.category,
      subcategory: marker.subcategory,
    });
    setEditingMarkerId(marker.id);
    setSelectedMarkerId(marker.id);
    setIsPlacingMarker(false);
    setPlacementPoint(null);
  }, []);

  const deleteMarker = useCallback(
    (markerId: string) => {
      setActiveMapMarkers((current) => current.filter((marker) => marker.id !== markerId));

      if (selectedMarkerId === markerId) setSelectedMarkerId(null);
      if (editingMarkerId === markerId) resetMarkerDraft();
    },
    [editingMarkerId, resetMarkerDraft, selectedMarkerId, setActiveMapMarkers],
  );


  const toggleDraftCategory = useCallback((categoryName: string) => {
    setMarkerDraft((previous) => {
      if (previous.category === categoryName) {
        return {
          ...previous,
          category: "",
          subcategory: "",
        };
      }

      const subcategories = getSubcategories(categoryName);

      return {
        ...previous,
        category: categoryName,
        subcategory:
          previous.category === categoryName && subcategories.includes(previous.subcategory)
            ? previous.subcategory
            : "",
      };
    });
  }, []);

  const toggleDraftSubcategory = useCallback((categoryName: string, subcategory: string) => {
    setMarkerDraft((previous) => {
      const isActive =
        previous.category === categoryName && previous.subcategory === subcategory;

      if (isActive) {
        return {
          ...previous,
          category: categoryName,
          subcategory: "",
        };
      }

      return {
        ...previous,
        category: categoryName,
        subcategory,
      };
    });
  }, []);

  const ensureMapVisibility = useCallback((mapId: string) => {
    setMarkerVisibilityByMap((previous) => ({
      ...previous,
      [mapId]: previous[mapId] ?? createDefaultVisibilityState(),
    }));
  }, []);

  const toggleMarkerMenuCategory = useCallback((categoryName: string) => {
    setMarkerVisibilityByMap((previous) => {
      const mapVisibility = previous[activeMapId] ?? createDefaultVisibilityState();
      const nextValue = !(mapVisibility.categories[categoryName] ?? false);

      return {
        ...previous,
        [activeMapId]: {
          categories: {
            ...mapVisibility.categories,
            [categoryName]: nextValue,
          },
          subcategories: {
            ...mapVisibility.subcategories,
            [categoryName]: Object.fromEntries(
              getSubcategories(categoryName).map((subcategory) => [subcategory, nextValue]),
            ),
          },
        },
      };
    });
  }, [activeMapId]);

  const toggleMarkerMenuSubcategory = useCallback((categoryName: string, subcategory: string) => {
    setMarkerVisibilityByMap((previous) => {
      const mapVisibility = previous[activeMapId] ?? createDefaultVisibilityState();
      const currentCategorySubs = mapVisibility.subcategories[categoryName] ?? {};
      const nextSubValue = !(currentCategorySubs[subcategory] ?? false);
      const nextCategorySubs = {
        ...currentCategorySubs,
        [subcategory]: nextSubValue,
      };
      const everyChecked = getSubcategories(categoryName).every((sub) => nextCategorySubs[sub] ?? false);

      return {
        ...previous,
        [activeMapId]: {
          categories: {
            ...mapVisibility.categories,
            [categoryName]: everyChecked,
          },
          subcategories: {
            ...mapVisibility.subcategories,
            [categoryName]: nextCategorySubs,
          },
        },
      };
    });
  }, [activeMapId]);

  const showAllMarkersForMap = useCallback(() => {
    setMarkerVisibilityByMap((previous) => ({
      ...previous,
      [activeMapId]: {
        categories: Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, true])),
        subcategories: Object.fromEntries(
          CATEGORY_TREE.map((category) => [
            category.name,
            Object.fromEntries(category.subcategories.map((subcategory) => [subcategory, true])),
          ]),
        ),
      },
    }));
  }, [activeMapId]);

  const hideAllMarkersForMap = useCallback(() => {
    setMarkerVisibilityByMap((previous) => ({
      ...previous,
      [activeMapId]: {
        categories: Object.fromEntries(CATEGORY_TREE.map((category) => [category.name, false])),
        subcategories: Object.fromEntries(
          CATEGORY_TREE.map((category) => [
            category.name,
            Object.fromEntries(category.subcategories.map((subcategory) => [subcategory, false])),
          ]),
        ),
      },
    }));
  }, [activeMapId]);

  const adjustCreatorScale = useCallback((delta: number) => {
    setCreatorScale((previous) => {
      const next = clamp(Number((previous + delta).toFixed(2)), 0.8, 1.25);
      return next;
    });
  }, []);

  const handleCreatorDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, input, textarea, label, a, [data-no-drag='true']")) {
        return;
      }

      creatorDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startPosition: creatorPosition,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [creatorPosition],
  );

  const handleCreatorDragMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!creatorDragRef.current || creatorDragRef.current.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - creatorDragRef.current.startX;
      const deltaY = event.clientY - creatorDragRef.current.startY;

      setCreatorPosition(
        clampCreatorPosition({
          x: creatorDragRef.current.startPosition.x + deltaX,
          y: creatorDragRef.current.startPosition.y + deltaY,
        }),
      );
    },
    [clampCreatorPosition],
  );

  const handleCreatorDragEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!creatorDragRef.current || creatorDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    creatorDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const positionCreatorNearFrame = useCallback(() => {
    if (!markerCreatorButtonRef.current) return;

    const buttonRect = markerCreatorButtonRef.current.getBoundingClientRect();
    const panelWidth = CREATOR_PANEL_BASE_WIDTH * creatorScale;
    const panelHeight = CREATOR_PANEL_BASE_HEIGHT * creatorScale;

    const desiredX = buttonRect.right + 12;
    const desiredY = buttonRect.top;

    const clamped = clampCreatorPosition({ x: desiredX, y: desiredY });
    setCreatorPosition(clamped);
  }, [creatorScale, clampCreatorPosition]);

  const toggleCreator = useCallback(() => {
    if (!creatorVisible) {
      positionCreatorNearFrame();
      setCreatorVisible(true);
    } else {
      setCreatorVisible(false);
      resetMarkerDraft();
    }
  }, [creatorVisible, positionCreatorNearFrame, resetMarkerDraft]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreenContainerRef.current) return;

    if (!isFullscreen) {
      fullscreenContainerRef.current.requestFullscreen?.().catch((err) => {
        console.error(`Fullscreen error: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    setMarkersByMap(safeReadMarkers());
    setMarkerVisibilityByMap(safeReadMarkerVisibility());
    setMarkersReady(true);
  }, []);

  useEffect(() => {
    if (!markersReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(markersByMap));
  }, [markersByMap, markersReady]);

  useEffect(() => {
    if (!markersReady || typeof window === "undefined") return;
    window.localStorage.setItem(MARKER_VISIBILITY_STORAGE_KEY, JSON.stringify(markerVisibilityByMap));
  }, [markerVisibilityByMap, markersReady]);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;
    const nextOffset = clampOffset({ x: 0, y: 0 }, DEFAULT_ZOOM);
    syncViewImmediately(DEFAULT_ZOOM, nextOffset);
  }, [clampOffset, syncViewImmediately, skin, activeMapId, viewport.height, viewport.width]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  useEffect(() => {
    ensureMapVisibility(activeMapId);
    setSelectedMarkerId(null);
    setEditingMarkerId(null);
    setIsPlacingMarker(false);
    setPlacementPoint(null);
    setMarkerDraft(EMPTY_MARKER_DRAFT);
  }, [activeMapId, ensureMapVisibility]);

  useEffect(() => {
    if (!selectedMarkerId) return;
    const stillExists = activeMarkers.some((marker) => marker.id === selectedMarkerId);
    if (!stillExists) {
      setSelectedMarkerId(null);
      return;
    }

    const stillVisible = visibleActiveMarkers.some((marker) => marker.id === selectedMarkerId);
    if (!stillVisible) setSelectedMarkerId(null);
  }, [activeMarkers, selectedMarkerId, visibleActiveMarkers]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPlacingMarker(false);
        setPlacementPoint(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);


  useEffect(() => {
    const panelState = safeReadCreatorPanelState();
    if (!panelState) return;

    setCreatorVisible(panelState.open);
    setCreatorScale(panelState.scale);
    setCreatorPosition(panelState.position);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      CREATOR_PANEL_STORAGE_KEY,
      JSON.stringify({
        open: creatorVisible,
        scale: creatorScale,
        position: creatorPosition,
      }),
    );
  }, [creatorVisible, creatorScale, creatorPosition]);

  useEffect(() => {
    if (!creatorVisible) return;

    const onResize = () => {
      setCreatorPosition((previous) => clampCreatorPosition(previous));
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampCreatorPosition, creatorVisible]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-control='true']") || target.closest("[data-marker-root='true']")) {
      return;
    }

    if (isPlacingMarker) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: currentOffsetRef.current,
    };

    setIsDragging(true);
    stopAnimation();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isPlacingMarker) {
      const point = getNormalizedPointFromClient(event.clientX, event.clientY);
      if (point) setPlacementPoint(point);
      return;
    }

    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    const nextOffset = clampOffset(
      {
        x: dragRef.current.startOffset.x + deltaX,
        y: dragRef.current.startOffset.y + deltaY,
      },
      currentZoomRef.current,
    );

    currentOffsetRef.current = nextOffset;
    targetOffsetRef.current = nextOffset;
    setOffset(nextOffset);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-control='true']") || target.closest("[data-marker-root='true']")) {
      return;
    }

    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    const anchor = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const step = event.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP;
    setViewTarget(targetZoomRef.current + step, anchor);
  };

  const handleMapClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-control='true']") || target.closest("[data-marker-root='true']")) {
      return;
    }

    if (!isPlacingMarker) {
      setSelectedMarkerId(null);
      return;
    }

    const point = getNormalizedPointFromClient(event.clientX, event.clientY);
    if (!point) return;

    finalizeMarkerPlacement(point);
  };

  const currentSelectedCategorySubcategories = getSubcategories(markerDraft.category);

  return (
    <main className="min-h-screen bg-[#04070a] px-2 py-2 text-white sm:px-4 sm:py-4">

      <section className="relative mx-auto w-full max-w-[1850px]">
        <div className="creator-top-buttons">
          <Link href="/" className="back-home-button">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to main page</span>
          </Link>
        </div>

        {creatorVisible ? (
          <div
            ref={creatorPanelRef}
            id="marker-creator-panel"
            className="floating-creator-shell"
            style={{
              transform: `translate3d(${creatorPosition.x}px, ${creatorPosition.y}px, 0) scale(${creatorScale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              className="floating-creator-header"
              onPointerDown={handleCreatorDragStart}
              onPointerMove={handleCreatorDragMove}
              onPointerUp={handleCreatorDragEnd}
              onPointerCancel={handleCreatorDragEnd}
            >
              <div className="skin-changer-option-inner">
                <span className="floating-creator-header__drag">
                  <Grip className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Draggable marker creator
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-300/85">
                    Drag this header · resize with +/- · close any time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2" data-no-drag="true">
                <button
                  type="button"
                  onClick={() => adjustCreatorScale(-0.08)}
                  className="floating-creator-control"
                  aria-label="Decrease marker creator size"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="floating-creator-scale">{Math.round(creatorScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => adjustCreatorScale(0.08)}
                  className="floating-creator-control"
                  aria-label="Increase marker creator size"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleCreator}
                  className="floating-creator-control"
                  aria-label="Close marker creator"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="outside-marker-panel marker-creator-menu">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Marker creator
                </p>
                <p className="mt-1 text-xs text-zinc-300/85">
                  {activeMap.label} · {activeMarkers.length} marker{activeMarkers.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetMarkerDraft();
                  setSelectedMarkerId(null);
                }}
                className="marker-card__icon-button"
                aria-label="Clear marker draft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="marker-field col-span-2">
                <span>Name</span>
                <input
                  type="text"
                  value={markerDraft.name}
                  onChange={(event) =>
                    setMarkerDraft((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Boss spawn, cache, route, anomaly..."
                  className="marker-input"
                />
              </label>

              <label className="marker-field">
                <span>Grid</span>
                <input
                  type="text"
                  value={markerDraft.grid}
                  onChange={(event) =>
                    setMarkerDraft((previous) => ({
                      ...previous,
                      grid: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Auto or A12"
                  className="marker-input"
                />
              </label>

              <label className="marker-field">
                <span>Tag <em className="not-italic text-[9px] text-zinc-500">(up to 16 letters)</em></span>
                <div className="relative">
                  <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={markerDraft.tag}
                    onChange={(event) =>
                      setMarkerDraft((previous) => ({
                        ...previous,
                        tag: event.target.value.toUpperCase().slice(0, 16),
                      }))
                    }
                    placeholder="BOSSMARKER"
                    className="marker-input marker-menu-search-input pl-9"
                  />
                </div>
              </label>

              <label className="marker-field col-span-2">
                <span>Description</span>
                <textarea
                  value={markerDraft.description}
                  onChange={(event) =>
                    setMarkerDraft((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Add notes, warnings, loot details, route information, or spawn timing."
                  className="marker-input marker-textarea"
                />
              </label>

              <div className="marker-field">
                <span>Custom icon</span>
                <label className="marker-upload-button">
                  <Upload className="h-4 w-4" />
                  Upload icon
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => onFileToDataUrl(event, "icon")}
                    hidden
                  />
                </label>

                {markerDraft.icon ? (
                  <div className="marker-icon-preview-wrap">
                    <img src={markerDraft.icon} alt="Marker icon preview" className="marker-icon-preview" />
                    <button
                      type="button"
                      className="marker-card__icon-button"
                      onClick={() =>
                        setMarkerDraft((previous) => ({
                          ...previous,
                          icon: "",
                        }))
                      }
                      aria-label="Remove marker icon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="marker-image-placeholder">
                    This icon is what appears on the map. It stays a fixed screen size while you zoom.
                  </div>
                )}
              </div>

              <div className="marker-field">
                <span>Picture addon</span>
                <label className="marker-upload-button">
                  <ImagePlus className="h-4 w-4" />
                  Upload picture
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => onFileToDataUrl(event, "picture")}
                    hidden
                  />
                </label>

                {markerDraft.picture ? (
                  <div className="marker-image-preview-wrap">
                    <img
                      src={markerDraft.picture}
                      alt="Marker picture preview"
                      className="marker-image-preview"
                    />
                    <button
                      type="button"
                      className="marker-card__icon-button"
                      onClick={() =>
                        setMarkerDraft((previous) => ({
                          ...previous,
                          picture: "",
                        }))
                      }
                      aria-label="Remove marker picture"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="marker-image-placeholder">
                    Optional picture for the info card, loot screenshot, or route image.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {editingMarkerId ? (
                <>
                  <button type="button" onClick={saveMarkerMeta} className="marker-primary-action">
                    <Save className="h-4 w-4" />
                    Save changes
                  </button>
                  <button type="button" onClick={beginMarkerPlacement} className="marker-secondary-action">
                    <Crosshair className="h-4 w-4" />
                    Pick new position
                  </button>
                </>
              ) : (
                <button type="button" onClick={beginMarkerPlacement} className="marker-primary-action">
                  <Crosshair className="h-4 w-4" />
                  Set marker on map
                </button>
              )}

              {(editingMarkerId ||
                isPlacingMarker ||
                markerDraft.name ||
                markerDraft.grid ||
                markerDraft.description ||
                markerDraft.picture ||
                markerDraft.icon ||
                markerDraft.tag) ? (
                <button type="button" onClick={resetMarkerDraft} className="marker-secondary-action">
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Category menu
                </p>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  bottom breakdown
                </span>
              </div>

              <div className="relative mb-2.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                  placeholder="Search categories or subcategories"
                  className="marker-input marker-menu-search-input pl-9"
                />
              </div>

              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {filteredCategoryTree.map((category) => {
                  const expanded = expandedCategories[category.name] ?? false;
                  const activeCategory = markerDraft.category === category.name;

                  return (
                    <div key={category.name} className="marker-menu-category-card">
                      <div className="flex items-center gap-1.5 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCategories((previous) => ({
                              ...previous,
                              [category.name]: !expanded,
                            }))
                          }
                          className="category-expand-button"
                          aria-label={`${expanded ? "Collapse" : "Expand"} ${category.name}`}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleDraftCategory(category.name)}
                          className={`category-check-row ${activeCategory ? "active" : ""}`}
                        >
                          <span className={`category-checkbox ${activeCategory ? "checked" : ""}`}>
                            {activeCategory ? <Check className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span className="marker-menu-category-name">{category.name}</span>
                        </button>
                      </div>

                      {expanded ? (
                        <div className="border-t border-white/8 px-2 pb-2 pt-1.5">
                          <div className="flex flex-wrap gap-2">
                            {category.subcategories.map((subcategory) => {
                              const activeSubcategory =
                                markerDraft.category === category.name &&
                                markerDraft.subcategory === subcategory;

                              return (
                                <button
                                  key={subcategory}
                                  type="button"
                                  onClick={() => toggleDraftSubcategory(category.name, subcategory)}
                                  className={`subcategory-check-chip ${activeSubcategory ? "active" : ""}`}
                                >
                                  <span className={`subcategory-checkbox ${activeSubcategory ? "checked" : ""}`}>
                                    {activeSubcategory ? <Check className="h-3 w-3" /> : null}
                                  </span>
                                  <span>{subcategory}</span>
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

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  Category: <span className="text-zinc-100">{markerDraft.category || "None"}</span>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  Sub: <span className="text-zinc-100">{markerDraft.subcategory || "None"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Saved markers on this map
                </p>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  auto saved
                </span>
              </div>

              <div className="mt-3 flex max-h-52 flex-col gap-2 overflow-auto pr-1">
                {activeMarkers.length ? (
                  activeMarkers.map((marker) => {
                    const active = marker.id === selectedMarkerId;

                    return (
                      <div key={marker.id} className={`marker-list-row ${active ? "active" : ""}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedMarkerId(marker.id)}
                          className="marker-list-row__main"
                        >
                          <div className="marker-list-row__thumb-wrap">
                            {marker.icon ? (
                              <img src={marker.icon} alt="" className="marker-list-row__thumb" />
                            ) : (
                              <span className="marker-list-row__dot">{marker.tag.slice(0, 2)}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-100">
                              {marker.name}
                            </p>
                            <p className="truncate text-xs text-zinc-400">
                              {marker.category} · {marker.subcategory} · {marker.grid}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingMarker(marker)}
                            className="marker-list-row__icon"
                            aria-label={`Edit ${marker.name}`}
                          >
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMarker(marker.id)}
                            className="marker-list-row__icon marker-list-row__icon--danger"
                            aria-label={`Delete ${marker.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-zinc-400">
                    No markers on this map yet. Fill the fields, choose a category, click <strong>Set marker on map</strong>, then click the exact position.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100/90">
              Current draft: {markerDraft.category || "No category"} → {markerDraft.subcategory || "No subcategory"}
              {currentSelectedCategorySubcategories.length ? "" : " · select only what you want checked"}
            </div>
          </div>
          </div>
        ) : null}

        <div className="map-stage-shell">
          <div
            ref={fullscreenContainerRef}
            className={`relative mx-auto transition-all duration-300 ${
              isFullscreen ? "w-screen h-screen" : "w-[80vw] max-w-[1280px]"
            }`}
            style={!isFullscreen ? { aspectRatio: "2048 / 1152" } : undefined}
          >

          <div
            ref={viewportRef}
            className="absolute overflow-hidden bg-black"
            style={
              isFullscreen
                ? { inset: 0, width: "100%", height: "100%" }
                : {
                    left: `${activeSkin.screen.left}%`,
                    top: `${activeSkin.screen.top}%`,
                    width: `${activeSkin.screen.width}%`,
                    height: `${activeSkin.screen.height}%`,
                  }
            }
          >
            <div
              className={`relative h-full w-full select-none ${
                isPlacingMarker ? "cursor-crosshair" : isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onClick={handleMapClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              style={{ touchAction: "none" }}
            >
              <img
                src={encodeURI(activeMap.src)}
                alt={activeMap.label}
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                style={{
                  width: `${mapPixelSize}px`,
                  height: `${mapPixelSize}px`,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  transformOrigin: "top left",
                  filter: "brightness(1.1) contrast(1.16) saturate(1.07)",
                  transition: isDragging ? "none" : "filter 160ms ease-out",
                  willChange: "transform, width, height",
                  backfaceVisibility: "hidden",
                }}
              />

              {markerScreenPositions.map(({ marker, left, top }) => {
                const visible = left > -56 && left < viewport.width + 56 && top > -56 && top < viewport.height + 56;
                if (!visible) return null;

                const active = marker.id === selectedMarkerId;
                const markerSize = clamp(17 + zoom * 2.95 + (active ? 4.5 : 0), 19, active ? 36 : 32);

                return (
                  <button
                    key={marker.id}
                    type="button"
                    data-marker-root="true"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMarkerId((previous) => (previous === marker.id ? null : marker.id));
                      setIsPlacingMarker(false);
                      setPlacementPoint(null);
                    }}
                    className={`marker-chip ${active ? "active" : ""}`}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${markerSize}px`,
                      height: `${markerSize}px`,
                    }}
                    aria-label={`Open ${marker.name}`}
                  >
                    <span className="marker-chip__pulse" />
                    {marker.icon ? (
                      <img src={marker.icon} alt="" className="marker-chip__image" />
                    ) : (
                      <span className="marker-chip__tag">{marker.tag.slice(0, 6)}</span>
                    )}
                  </button>
                );
              })}

              {hoverPreviewPosition ? (
                <div
                  className="marker-preview"
                  style={{
                    left: `${hoverPreviewPosition.left}px`,
                    top: `${hoverPreviewPosition.top}px`,
                      width: `${clamp(17 + zoom * 2.95, 19, 32)}px`,
                      height: `${clamp(17 + zoom * 2.95, 19, 32)}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {markerDraft.icon ? (
                    <img src={markerDraft.icon} alt="" className="marker-preview__image" />
                  ) : (
                    <span className="marker-preview__tag">
                      {(markerDraft.tag.trim() || createTagFromValues(markerDraft.name, markerDraft.subcategory)).slice(0, 8)}
                    </span>
                  )}
                </div>
              ) : null}

              {selectedMarker && selectedMarkerCardPosition ? (
                <div
                  data-marker-root="true"
                  className="marker-card absolute z-30"
                  style={{
                    left: `${selectedMarkerCardPosition.left}px`,
                    top: `${selectedMarkerCardPosition.top}px`,
                    width: `${MARKER_CARD_WIDTH}px`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
                        {activeMap.label}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold text-white">{selectedMarker.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                        <span className="rounded-full border border-white/10 px-2 py-1">{selectedMarker.grid}</span>
                        <span className="rounded-full border border-white/10 px-2 py-1">{selectedMarker.tag}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMarkerId(null)}
                      className="marker-card__icon-button"
                      aria-label="Close marker card"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {selectedMarker.picture ? (
                    <div className="marker-card__picture-frame mt-3">
                      <img
                        src={selectedMarker.picture}
                        alt={`${selectedMarker.name} preview`}
                        className="marker-card__picture"
                      />
                    </div>
                  ) : null}

                  <p className="mt-3 text-sm leading-6 text-zinc-200/90">
                    {selectedMarker.description || "No description added yet."}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingMarker(selectedMarker)}
                      className="marker-card__action"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMarker(selectedMarker.id)}
                      className="marker-card__action marker-card__action--danger"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}

              {isPlacingMarker ? (
                <div className="marker-placement-banner pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
                  Move over the map and click once to {editingMarkerId ? "update the exact marker position" : "place the marker exactly"}
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-0 border border-white/12 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),inset_0_0_95px_rgba(0,0,0,0.38)]" />
              <div className="screen-lighting pointer-events-none absolute inset-0" />
              <div className="screen-glass pointer-events-none absolute inset-0" />
              <div className="screen-scanlines pointer-events-none absolute inset-0" />
              <div className="screen-vignette pointer-events-none absolute inset-0" />
              <div className="screen-noise pointer-events-none absolute inset-0" />

              <div
                data-map-control="true"
                className="absolute left-[2.35%] top-[5.05%] z-40 flex flex-col items-center gap-[22px]"
              >
                <div className="relative flex h-[140px] w-[42px] items-center justify-center tactical-slider-shell">
                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.03}
                    value={zoomControl}
                    onChange={(event) => setViewTarget(Number(event.target.value))}
                    aria-label="Map zoom"
                    className="map-slider-vertical-clean w-[154px] appearance-none bg-transparent"
                  />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMapLocationsMenuOpen((previous) => !previous);
                      setLegendMarkMenuOpen(false);
                      setSkinChangerMenuOpen(false);
                    }}
                    className="side-tab-button map-locations-button"
                    aria-label="Open map locations menu"
                  >
                    <span>MAP</span>
                  </button>

                  {mapLocationsMenuOpen ? (
                    <div className="absolute left-[calc(100%+10px)] top-[-100px] w-[190px] max-w-[calc(100vw-24px)] map-locations-menu-panel map-locations-menu tactical-menu-shell">
                      <div className="map-locations-menu-header">
                        <p className="map-locations-menu-title">MAP LOCATIONS MENU</p>
                      </div>

                      <div className="map-locations-menu-scroll map-locations-list">
                        {maps.map((map) => {
                          const active = map.id === activeMapId;

                          return (
                            <button
                              key={map.id}
                              type="button"
                              onClick={() => {
                                setActiveMapId(map.id);
                                setMapLocationsMenuOpen(false);
                              }}
                              className={`map-locations-row ${active ? "active" : ""}`}
                            >
                              <span className="truncate">{map.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setLegendMarkMenuOpen((previous) => !previous);
                      setMapLocationsMenuOpen(false);
                      setSkinChangerMenuOpen(false);
                    }}
                    className="side-tab-button legend-mark-button"
                    aria-label="Open legend mark menu"
                  >
                    <span>LEGEND</span>
                  </button>

                  {legendMarkMenuOpen ? (
                    <div className="absolute left-[calc(100%+10px)] top-[-170px] w-[198px] max-w-[calc(100vw-24px)] legend-mark-menu-panel legend-mark-menu tactical-menu-shell">
                      <div className="legend-mark-menu-header legend-mark-menu-header--legend">
                        <div className="legend-mark-title-row">
                          <p className="legend-mark-menu-title">LEGEND MARK MENU</p>
                          <span className="legend-mark-count-badge">{visibleActiveMarkers.length}</span>
                        </div>
                        <p className="legend-mark-menu-subtitle">Toggle categories and subcategories to show markers on the map.</p>
                      </div>

                      <div className="relative px-3 pt-3">
                        <Search className="pointer-events-none absolute left-6 top-[calc(50%+6px)] h-3.5 w-3.5 -translate-y-1/2 text-[#909090]" />
                        <input
                          type="text"
                          value={legendMarkSearch}
                          onChange={(event) => setLegendMarkSearch(event.target.value)}
                          placeholder="Search legend marks"
                          className="legend-mark-search-input pl-9"
                        />
                      </div>

                      <div className="legend-mark-actions">
                        <button type="button" onClick={showAllMarkersForMap} className="legend-mark-action">Check all</button>
                        <button type="button" onClick={hideAllMarkersForMap} className="legend-mark-action">Uncheck all</button>
                      </div>

                      <div className="legend-mark-menu-scroll legend-mark-list">
                        {filteredLegendMarkTree.map((category) => {
                          const expanded = expandedLegendMarkCategories[category.name] ?? false;
                          const categoryChecked = activeVisibility.categories[category.name] ?? false;

                          return (
                            <div key={category.name} className="screenshot-legend-card">
                              <div className="screenshot-legend-row">
                                <button
                                  type="button"
                                  onClick={() => toggleMarkerMenuCategory(category.name)}
                                  className={`screenshot-square-check ${categoryChecked ? "active" : ""}`}
                                  aria-label={`${categoryChecked ? "Hide" : "Show"} ${category.name}`}
                                >
                                  {categoryChecked ? <Check className="h-3 w-3" /> : null}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedLegendMarkCategories((previous) => ({
                                      ...previous,
                                      [category.name]: !expanded,
                                    }))
                                  }
                                  className="screenshot-legend-main"
                                  aria-label={`${expanded ? "Collapse" : "Expand"} ${category.name}`}
                                >
                                  <span className="screenshot-legend-main-label">{category.name.toUpperCase()}</span>
                                  <span className="screenshot-legend-main-meta">
                                    {category.subcategories.length}
                                    {expanded ? (
                                      <ChevronDown className="h-4 w-4 text-[#9c9c9c]" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-[#9c9c9c]" />
                                    )}
                                  </span>
                                </button>
                              </div>

                              {expanded ? (
                                <div className="screenshot-legend-sublist">
                                  {category.subcategories.map((subcategory) => {
                                    const subcategoryChecked = activeVisibility.subcategories[category.name]?.[subcategory] ?? false;
                                    return (
                                      <button
                                        key={subcategory}
                                        type="button"
                                        onClick={() => toggleMarkerMenuSubcategory(category.name, subcategory)}
                                        className={`screenshot-legend-subitem ${subcategoryChecked ? "active" : ""}`}
                                      >
                                        <span className={`subcategory-checkbox ${subcategoryChecked ? "checked" : ""}`}>
                                          {subcategoryChecked ? <Check className="h-3 w-3" /> : null}
                                        </span>
                                        <span className="truncate">{subcategory}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSkinChangerMenuOpen((previous) => !previous);
                      setMapLocationsMenuOpen(false);
                      setLegendMarkMenuOpen(false);
                    }}
                    className="side-tab-button skin-changer-button"
                    aria-label="Open skin changer menu"
                  >
                    <span>SKINS</span>
                  </button>

                  {skinChangerMenuOpen ? (
                    <div className="absolute left-[calc(100%+10px)] top-[-50px] w-[194px] max-w-[calc(100vw-24px)] skin-changer-menu-panel skin-changer-menu tactical-menu-shell">
                      <div className="skin-changer-menu-header"><p className="skin-changer-menu-title">SKIN CHANGER MENU</p></div>

                      <div className="skin-changer-menu-list">
                        {(Object.entries(SKINS) as Array<[SkinKey, SkinConfig]>).map(([key, config]) => {
                          const active = key === skin;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSkin(key);
                                setSkinChangerMenuOpen(false);
                              }}
                              className={`skin-changer-option ${
                                active ? "active" : ""
                              }`}
                            >
                              <div className="skin-changer-option-inner">
                                {config.iconSrc ? <img src={config.iconSrc} alt="" className="h-6 w-6 rounded-md" /> : null}
                                <span>{config.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <button
                ref={markerCreatorButtonRef}
                type="button"
                onClick={toggleCreator}
                data-map-control="true"
                className="absolute right-[-12px] top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-black/80"
                aria-label={creatorVisible ? "Close marker creator" : "Open marker creator"}
              >
                <PencilLine className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                data-map-control="true"
                className="absolute bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-xl backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-black/80"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {!isFullscreen && (
            <>
              <div
                aria-hidden="true"
                className="pda-led pda-led--green"
                style={{
                  left: `${activeSkin.lights.green.left}%`,
                  top: `${activeSkin.lights.green.top}%`,
                  width: `${activeSkin.lights.green.haloSize}px`,
                  height: `${activeSkin.lights.green.haloSize}px`,
                }}
              >
                <span className="pda-led__socket pda-led__socket--green" />
                <span className="pda-led__cavity pda-led__cavity--green" />
                <span className="pda-led__glass pda-led__glass--green" />
                <span className="pda-led__ambient pda-led__ambient--green" />
                <span
                  className="pda-led__bloom pda-led__bloom--green"
                  style={{
                    width: `${activeSkin.lights.green.glowSize}px`,
                    height: `${activeSkin.lights.green.glowSize}px`,
                  }}
                />
                <span className="pda-led__ring pda-led__ring--green" />
                <span
                  className="pda-led__core pda-led__core--green"
                  style={{
                    width: `${activeSkin.lights.green.coreSize}px`,
                    height: `${activeSkin.lights.green.coreSize}px`,
                  }}
                />
                <span className="pda-led__spec pda-led__spec--green" />
              </div>
              <div
                aria-hidden="true"
                className="pda-led pda-led--red"
                style={{
                  left: `${activeSkin.lights.red.left}%`,
                  top: `${activeSkin.lights.red.top}%`,
                  width: `${activeSkin.lights.red.haloSize}px`,
                  height: `${activeSkin.lights.red.haloSize}px`,
                }}
              >
                <span className="pda-led__socket pda-led__socket--red" />
                <span className="pda-led__cavity pda-led__cavity--red" />
                <span className="pda-led__glass pda-led__glass--red" />
                <span className="pda-led__ambient pda-led__ambient--red" />
                <span
                  className="pda-led__bloom pda-led__bloom--red"
                  style={{
                    width: `${activeSkin.lights.red.glowSize}px`,
                    height: `${activeSkin.lights.red.glowSize}px`,
                  }}
                />
                <span className="pda-led__ring pda-led__ring--red" />
                <span
                  className="pda-led__core pda-led__core--red"
                  style={{
                    width: `${activeSkin.lights.red.coreSize}px`,
                    height: `${activeSkin.lights.red.coreSize}px`,
                  }}
                />
                <span className="pda-led__spec pda-led__spec--red" />
              </div>

              <img
                src={encodeURI(activeSkin.frameSrc)}
                alt={`${activeSkin.label} PDA frame skin`}
                className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain"
                draggable={false}
              />
            </>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}