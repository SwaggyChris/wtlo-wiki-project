import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  isDefault?: boolean;
  anchorDotColor?: string;
  anchorDotSize?: number;
  iconOffsetY?: number;
  dotOnly?: boolean;
};

type MarkerStore = Record<string, MarkerRecord[]>;

const MARKERS_FILE = path.join(
  process.cwd(),
  "public",
  "db-assets",
  "map-markers.json",
);

function isMarkerRecord(value: unknown): value is MarkerRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const marker = value as Partial<MarkerRecord>;

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
}

function normalizeStore(input: unknown): MarkerStore {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? ((input as { markersByMap?: unknown }).markersByMap ?? input)
      : null;

  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const cleaned: MarkerStore = {};

  for (const [mapId, value] of Object.entries(source as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;

    cleaned[mapId] = value.filter(isMarkerRecord).map((marker) => ({
      ...marker,
      mapId,
      x: Math.min(1, Math.max(0, marker.x)),
      y: Math.min(1, Math.max(0, marker.y)),
      picture: typeof marker.picture === "string" ? marker.picture : undefined,
      icon: typeof marker.icon === "string" ? marker.icon : undefined,
      isDefault: marker.isDefault === true,
      anchorDotColor:
        typeof (marker as MarkerRecord).anchorDotColor === "string"
          ? (marker as MarkerRecord).anchorDotColor
          : undefined,
      anchorDotSize:
        typeof (marker as MarkerRecord).anchorDotSize === "number"
          ? (marker as MarkerRecord).anchorDotSize
          : undefined,
      iconOffsetY:
        typeof (marker as MarkerRecord).iconOffsetY === "number"
          ? (marker as MarkerRecord).iconOffsetY
          : undefined,
      dotOnly: (marker as MarkerRecord).dotOnly === true,
      createdAt:
        typeof marker.createdAt === "number" ? marker.createdAt : Date.now(),
      updatedAt:
        typeof marker.updatedAt === "number" ? marker.updatedAt : Date.now(),
    }));
  }

  return cleaned;
}

async function readMarkerFile() {
  try {
    const raw = await fs.readFile(MARKERS_FILE, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const nodeError = error as { code?: string };
    if (nodeError.code === "ENOENT") {
      await fs.mkdir(path.dirname(MARKERS_FILE), { recursive: true });
      const emptyStore = { markersByMap: {} };
      await fs.writeFile(MARKERS_FILE, JSON.stringify(emptyStore, null, 2), "utf8");
      return emptyStore;
    }

    throw error;
  }
}

export async function GET() {
  try {
    const data = await readMarkerFile();
    return NextResponse.json({ markersByMap: normalizeStore(data) });
  } catch (error) {
    console.error("Failed to read map markers", error);
    return NextResponse.json(
      { error: "Failed to read map markers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const markersByMap = normalizeStore(body);
    const payload = {
      updatedAt: new Date().toISOString(),
      markersByMap,
    };

    await fs.mkdir(path.dirname(MARKERS_FILE), { recursive: true });
    await fs.writeFile(MARKERS_FILE, JSON.stringify(payload, null, 2), "utf8");

    return NextResponse.json({ ok: true, markersByMap });
  } catch (error) {
    console.error("Failed to save map markers", error);
    return NextResponse.json(
      { error: "Failed to save map markers" },
      { status: 500 },
    );
  }
}
