"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import WTLO_DATABASE_DATA from "../../data/wtlo-database-data";

// ==================== DATA STRUCTURES ====================
type CategoryKey =
  | "general"
  | "guides"
  | "bestiary"
  | "characters"
  | "Items"
  | "premium"
  | "weapons"
  | "ammo"
  | "armor"
  | "medicine"
  | "crafting"
  | "achievements";

type AchievementRarity = "Common" | "Rare" | "Very Rare" | "Ultra Rare" | "Incredibly Rare" | "Legendary" | "Impossible";

interface BaseItem {
  name: string;
  type: string;
  level: number;            // 0 means "N/R"
  detail: string;
  vendors: string[];        // multiple vendors
  weaponClasses: string[];  // multiple classes (weapons only)
  parametersStats: string[]; // multiple parameters (weapons only)
  locations: string[];      // multiple locations (items, armor, medicine, crafting)
  // Legacy single fields (kept for migration)
  source?: string;
  weaponClass?: string;
  parametersStat?: string;
  location?: string;
  
  damage?: number;
  defense?: number;
  subtype?: string;
  caliber?: string;
  price?: number;
  minDamage?: number;
  maxDamage?: number;
  imageUrl?: string;
  imageDesc?: string;
  guideDifficulty?: string;
  bestiaryDifficulty?: string;
  characterPart?: string;
  itemParameters?: string;
  armorClass?: string;
  armorParameters?: string;
  craftingStation?: string;
  achievementDifficulty?: string;
  
  weight?: string;
  dropChance?: number;
  basePriceTokens?: number;
  sellingPriceTokens?: number;
  
  critChance?: number;
  effectiveRange?: number;
  magazine?: number;
  moa?: number;
  modLevel?: string;
  ammoComparisonType?: "AP" | "HP" | "FMJ" | "FMJ Extra" | "M1" | "S1";
  
  ammoType?: "AP" | "HP" | "FMJ" | "FMJ Extra" | "M1" | "S1";
  apPiercing?: string;
  apPiercingMin?: number;
  apPiercingMax?: number;
  
  modification?: "M0" | "M2" | "M4";
  
  effectImageUrl?: string;
  
  achievementRarity?: AchievementRarity;
  
  rarity?: string;
}

// ==================== LOCAL REACT DATABASE STORAGE ====================
// The database is now loaded from /data/wtlo-database-data.ts instead of JSON.
// Image paths are saved into the local React data file through the Next.js API route.
// Project/public paths still work too, for example: public/db-assets/weapons/ak.png => /db-assets/weapons/ak.png
const INITIAL_DATABASE: Record<CategoryKey, BaseItem[]> = WTLO_DATABASE_DATA as unknown as Record<CategoryKey, BaseItem[]>;

const DEFAULT_PUBLIC_IMAGE_ROOT = "/db-assets";

const makeSafeFileName = (fileName: string) => {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts.join(".") || fileName;
  return `${base.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}${extension.toLowerCase()}`;
};

const normalizeProjectImagePath = (value: string) => {
  if (!value.trim()) return "";

  let normalized = value.trim().replace(/\\/g, "/");
  normalized = normalized.replace(/^.*?\/public\//i, "/");
  normalized = normalized.replace(/^public\//i, "/");
  normalized = normalized.replace(/^\.\//, "/");

  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("data:")) {
    return normalized;
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const getCategoryImageFolder = (category: CategoryKey) => {
  const folderMap: Partial<Record<CategoryKey, string>> = {
    Items: "items",
    weapons: "weapons",
    ammo: "ammo",
    armor: "armor",
    medicine: "medicine",
    premium: "premium",
    crafting: "crafting",
    bestiary: "bestiary",
    characters: "characters",
    guides: "guides",
    achievements: "achievements",
    general: "general",
  };

  return folderMap[category] || String(category).toLowerCase();
};

// Some extracted WTLO armor files do not use the same filename as the item name / old database value.
// Keep these aliases here so the cards can still resolve to the real files in public/db-assets/armor.
const ARMOR_IMAGE_ALIASES: Record<string, string[]> = {
  "T_Inventory_ArmoredBoots.png": ["T_Inventory_ArmoredBoots_Remesh.png"],
  "T_Inventory_Icon_6B28.png": ["T_Inventory_Icon_Helmet6B28.png", "T_Inventory_Icon_6B28_M1.png"],
  "T_Inventory_Icon_BlackSunset_Bulletproof_Vest_RM1.png": ["T_Inventory_Icon_BlackSunset_Bulletproof_RM1.png"],
  "T_Inventory_Icon_BlackSunset_Bulletproof_Vest_RH1.png": ["T_Inventory_Icon_BlackSunset_Bulletproof_RH1.png"],
  "T_Inventory_Icon_Confederation_Bulletproof_Vest_RH1.png": ["T_Inventory_Icon_Confideration_Bulletproof_RH1.png"],
  "T_Inventory_Icon_Confederation_Bulletproof_Vest_H1.png": ["T_Inventory_Icon_Confideration_Bulletproof_Vest_H1.png"],
};

const getAliasFileNames = (category: CategoryKey, fileName: string) => {
  if (category !== "armor") return [];
  return ARMOR_IMAGE_ALIASES[fileName] || [];
};

const getImageCandidates = (item: BaseItem, category: CategoryKey) => {
  const candidates: string[] = [];
  const addCandidate = (value?: string) => {
    if (!value) return;
    const normalized = normalizeProjectImagePath(value);
    if (normalized && !candidates.includes(normalized)) candidates.push(normalized);
  };

  const folder = getCategoryImageFolder(category);

  const addFileNameCandidates = (rawFileName?: string) => {
    if (!rawFileName) return;

    const fileName = rawFileName.split(/[\\/]/).pop() || rawFileName;
    const safeFileName = makeSafeFileName(fileName);
    const fileNames = [fileName, safeFileName, ...getAliasFileNames(category, fileName)];

    for (const candidateFileName of fileNames) {
      addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/${folder}/${candidateFileName}`);
    }

    // Fallbacks for older database entries and mixed folders.
    for (const candidateFileName of fileNames) {
      addCandidate(`/items/${candidateFileName}`);
      addCandidate(candidateFileName);
    }
  };

  addCandidate(item.imageUrl);
  addFileNameCandidates(item.imageUrl);
  addFileNameCandidates(item.imageDesc);

  return candidates;
};

const ProjectImage = ({
  item,
  category,
  className,
  placeholderClassName,
}: {
  item: BaseItem;
  category: CategoryKey;
  className: string;
  placeholderClassName: string;
}) => {
  const candidates = useMemo(() => getImageCandidates(item, category), [item.imageUrl, item.imageDesc, item.name, category]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const src = candidates[candidateIndex];

  useEffect(() => {
    setCandidateIndex(0);
  }, [item.imageUrl, item.imageDesc, category]);

  if (!src || candidateIndex >= candidates.length) {
    return <div className={placeholderClassName}><i className="fas fa-image"></i></div>;
  }

  return (
    <img
      src={src}
      alt={item.imageDesc || item.name}
      className={className}
      draggable={false}
      onError={() => {
        setCandidateIndex((current) => current + 1);
      }}
    />
  );
};

const guessProjectImagePath = (file: File, category: CategoryKey) => {
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (relativePath) return normalizeProjectImagePath(relativePath);

  return `${DEFAULT_PUBLIC_IMAGE_ROOT}/${getCategoryImageFolder(category)}/${file.name}`;
};

const cloneDatabase = (db: Record<CategoryKey, BaseItem[]>) => {
  const cloned = createEmptyDatabase();
  for (const cat of Object.keys(cloned) as CategoryKey[]) {
    cloned[cat] = (db[cat] || []).map((item) => ({ ...item }));
  }
  return cloned;
};

const databaseToReactFile = (db: Record<CategoryKey, BaseItem[]>) => {
  return `const WTLO_DATABASE_DATA = ${JSON.stringify(db, null, 2)} as const;

export default WTLO_DATABASE_DATA;
`;
};

// Helper to migrate legacy single values to arrays
const migrateItem = (item: BaseItem): BaseItem => {
  const newItem = { ...item };
  if (!newItem.vendors && newItem.source) {
    newItem.vendors = [newItem.source];
  } else if (!newItem.vendors) {
    newItem.vendors = [];
  }
  if (!newItem.weaponClasses && newItem.weaponClass) {
    newItem.weaponClasses = [newItem.weaponClass];
  } else if (!newItem.weaponClasses) {
    newItem.weaponClasses = [];
  }
  if (!newItem.parametersStats && newItem.parametersStat) {
    newItem.parametersStats = [newItem.parametersStat];
  } else if (!newItem.parametersStats) {
    newItem.parametersStats = [];
  }
  if (!newItem.locations && newItem.location) {
    newItem.locations = [newItem.location];
  } else if (!newItem.locations) {
    newItem.locations = [];
  }
  return newItem;
};

const createEmptyDatabase = (): Record<CategoryKey, BaseItem[]> => ({
  general: [],
  guides: [],
  bestiary: [],
  characters: [],
  Items: [],
  premium: [],
  weapons: [],
  ammo: [],
  armor: [],
  medicine: [],
  crafting: [],
  achievements: [],
});

const loadDatabase = (): Record<CategoryKey, BaseItem[]> => {
  const migrated = createEmptyDatabase();

  for (const cat of Object.keys(migrated) as CategoryKey[]) {
    migrated[cat] = Array.isArray(INITIAL_DATABASE?.[cat])
      ? INITIAL_DATABASE[cat].map(migrateItem)
      : [];
  }

  // Source of truth: src/data/wtlo-database-data.ts only.
  // No browser localStorage is used for database or image persistence.
  return migrated;
};

const getRarityClass = (r: string): string => {
  const map: Record<string, string> = {
    Common: "tag-common",
    Uncommon: "tag-uncommon",
    Rare: "tag-rare",
    Epic: "tag-epic",
    Legendary: "tag-legendary",
  };
  return map[r] || "tag-common";
};

const caliberOptions = [
  "9x18 PM", "7.62x39", "5.45x39", "7.62x54", "12Ga.", "7.62x25 TT", "9x39",
  "7.62x38", "9x19 Para.", ".38 Special", ".357 Magnum", ".22 LR", ".30-60",
  ".45 ACP", "5.7x28", "43mm", "5.56x45", ".338LM", ".308 WIN", "40mm",
  "9x21", ".44 Magnum", ".500 S&W Magnum"
];
const universalLevelOptions = [
  { label: "N/R", value: 0 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "12", value: 12 },
  { label: "13", value: 13 },
  { label: "14", value: 14 },
  { label: "16", value: 16 },
  { label: "20", value: 20 },
  { label: "23", value: 23 },
  { label: "25", value: 25 },
  { label: "27", value: 27 },
  { label: "30", value: 30 },
  { label: "35", value: 35 },
  { label: "36", value: 36 },
  { label: "37", value: 37 },
  { label: "40", value: 40 }
];
const vendorOptions = ["Rafik", "Gosha", "Valera", "Karina", "Yuri", "Victoria", "Pavel", "Vladimir"];
const difficultyOptions = ["Easy", "Normal", "Medium", "Moderate", "Hard", "Impossible", "Insane", "Legendary", "Veteran", "Beginner", "Intermediate", "Advanced", "Expert", "New", "Hot", "Simple"];
const armorClassOptions = ["Light", "Medium", "Heavy"];
const craftingStationOptions = ["Inventory", "Furnace", "Press Machine", "Chemical Station", "Campfire", "Ammo Press", "Big CNC Machine"];
const characterPartOptions = ["Hair", "Head", "Torso", "Legs", "Foot", "DLC", "Faction"];

const itemTypeOptions = ["Tools", "Electronics", "Battery", "Junk", "Houseware", "Craft Tools", "Spare Parts", "Base Resource", "Complex Resource", "Document", "Food", "Quest", "Fuel", "Production Module", "Equipment" , "PDA Module", "Energy Equipment", "Placement Kit" , "Optical Device" ,"Resource Miner"];
const locationOptions = ["Solnechny Outskirts", "Solar City", "MTE", "Minayev's Mine", "Dead Forest", "Big Village", "Swamp", "Exclusive Zone", "Canyon", "Testing grounds", "Coast", "Foothills", "The village"];
const weaponClassOptions = ["Hunter", "Miner", "Mercenary", "Engineer"];
const parametersStatOptions = ["Strength", "Dexterity", "Stamina", "Accuracy", "Intelligence", "Fortune"];
const modLevelOptions = ["M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11"];
const ammoComparisonOptions = ["AP", "HP", "FMJ", "FMJ Extra", "M1"];
const armorModificationOptions = ["M0", "M2", "M4"];
const achievementRarityOptions: AchievementRarity[] = ["Common", "Rare", "Very Rare", "Ultra Rare", "Incredibly Rare", "Legendary", "Impossible"];

const typeOptionsMap: Record<CategoryKey, string[]> = {
  general: ["Info", "Guide", "Tip", "Mechanic"],
  guides: ["Text", "Video", "Guide", "Tutorial", "Walkthrough"],
  bestiary: ["Creature", "Mutant", "Animal", "Humanoid", "Boss"],
  characters: ["Trader", "Quest giver", "Faction", "NPC", "Merchant", "Vendor"],
  Items: itemTypeOptions,
  premium: itemTypeOptions,
  weapons: ["Assault rifle", "Handgun", "Shotgun", "Rifle", "Submachine-gun", "Melee", "Launcher", "Sniper rifle"],
  ammo: ["Rifle", "Pistol", "Shotgun", "Special", "Heavy"],
  armor: ["Jacket", "Helmet", "Boots", "Trousers", "Armored plate"],
  medicine: ["Healing", "Cure", "Buff", "Stimulant", "Antidote", "Bandage"],
  crafting: itemTypeOptions,
  achievements: ["Combat", "Discovery", "Completion", "Collectible", "Exploration", "Quest"]
};

export default function DatabasePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>("general");
  const [database, setDatabase] = useState<Record<CategoryKey, BaseItem[]>>(loadDatabase());
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clock, setClock] = useState("--:--");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<BaseItem>({} as BaseItem);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const effectFileInputRef = useRef<HTMLInputElement>(null);
  const quickImageUploadInputRef = useRef<HTMLInputElement>(null);
  const quickImageUploadTargetRef = useRef<BaseItem | null>(null);

  // Generic filters (single‑select)
  const [guideDifficultyFilter, setGuideDifficultyFilter] = useState("");
  const [bestiaryDifficultyFilter, setBestiaryDifficultyFilter] = useState("");
  const [characterPartFilter, setCharacterPartFilter] = useState("");
  
  // Items filters (single‑select)
  const [itemsTypeFilter, setItemsTypeFilter] = useState("");
  const [itemsLevelFilter, setItemsLevelFilter] = useState<number | "">("");
  const [itemsPriceFilter, setItemsPriceFilter] = useState<"Low" | "High" | "">("");
  const [itemsLocationFilter, setItemsLocationFilter] = useState("");
  const [itemsWeightFilter, setItemsWeightFilter] = useState("");
  const [itemsVendorFilter, setItemsVendorFilter] = useState("");
  
  // Weapons filters (single‑select)
  const [weaponTypeFilter, setWeaponTypeFilter] = useState("");
  const [weaponClassFilter, setWeaponClassFilter] = useState("");
  const [weaponCaliberFilter, setWeaponCaliberFilter] = useState("");
  const [weaponLevelFilter, setWeaponLevelFilter] = useState<number | "">("");
  const [weaponVendorFilter, setWeaponVendorFilter] = useState("");
  const [weaponPriceFilter, setWeaponPriceFilter] = useState<"Low" | "High" | "">("");
  const [weaponDMGFilter, setWeaponDMGFilter] = useState<"Low" | "High" | "">("");
  const [weaponModFilter, setWeaponModFilter] = useState("");
  const [weaponParameterFilter, setWeaponParameterFilter] = useState("");
  
  // Ammo filters (single‑select)
  const [ammoTypeFilter, setAmmoTypeFilter] = useState("");
  const [ammoCaliberFilter, setAmmoCaliberFilter] = useState("");
  const [ammoVendorFilter, setAmmoVendorFilter] = useState("");
  const [ammoPriceFilter, setAmmoPriceFilter] = useState<"Low" | "High" | "">("");
  const [ammoDMGFilter, setAmmoDMGFilter] = useState<"Low" | "High" | "">("");
  const [ammoAmmoTypeFilter, setAmmoAmmoTypeFilter] = useState("");
  const [ammoLevelFilter, setAmmoLevelFilter] = useState<number | "">("");
  
  // Armor filters (single‑select)
  const [armorTypeFilter, setArmorTypeFilter] = useState("");
  const [armorPriceFilter, setArmorPriceFilter] = useState<"Low" | "High" | "">("");
  const [armorLocationFilter, setArmorLocationFilter] = useState("");
  const [armorModificationFilter, setArmorModificationFilter] = useState("");
  const [armorClassFilter, setArmorClassFilter] = useState("");
  const [armorLevelFilter, setArmorLevelFilter] = useState<number | "">("");
  const [armorVendorFilter, setArmorVendorFilter] = useState("");
  
  // Medicine filters (single‑select)
  const [medicineTypeFilter, setMedicineTypeFilter] = useState("");
  const [medicinePriceFilter, setMedicinePriceFilter] = useState<"Low" | "High" | "">("");
  const [medicineLocationFilter, setMedicineLocationFilter] = useState("");
  const [medicineLevelFilter, setMedicineLevelFilter] = useState<number | "">("");
  const [medicineVendorFilter, setMedicineVendorFilter] = useState("");
  
  // Crafting filters (single‑select)
  const [craftingStationFilter, setCraftingStationFilter] = useState("");
  const [craftingTypeFilter, setCraftingTypeFilter] = useState("");
  const [craftingPriceFilter, setCraftingPriceFilter] = useState<"Low" | "High" | "">("");
  const [craftingLocationFilter, setCraftingLocationFilter] = useState("");
  const [craftingLevelFilter, setCraftingLevelFilter] = useState<number | "">("");
  const [craftingVendorFilter, setCraftingVendorFilter] = useState("");
  
  // Premium filters
  const [premiumNameFilter, setPremiumNameFilter] = useState("");
  const [premiumTypeFilter, setPremiumTypeFilter] = useState("");
  const [premiumPriceFilter, setPremiumPriceFilter] = useState<"Low" | "High" | "">("");

  // Achievements filters
  const [achievementsRarityFilter, setAchievementsRarityFilter] = useState("");
  
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedInfoItem, setSelectedInfoItem] = useState<BaseItem | null>(null);

  useEffect(() => {
    const loaded = loadDatabase();
    setDatabase(loaded);
    setMounted(true);
  }, []);

  const currentData = database[currentCategory] || [];
  const isWeapons = currentCategory === "weapons";
  const isAmmo = currentCategory === "ammo";
  const isGeneral = currentCategory === "general";
  const isItems = currentCategory === "Items";
  const isPremium = currentCategory === "premium";
  const isArmor = currentCategory === "armor";
  const isMedicine = currentCategory === "medicine";
  const isCrafting = currentCategory === "crafting";
  const isAchievements = currentCategory === "achievements";
  const canQuickUploadImage = ["Items", "weapons", "ammo", "armor", "medicine"].includes(currentCategory);

  const availableTypes = useMemo(() => {
    const types = new Set(currentData.map((item) => item.type).filter(Boolean));
    const preset = typeOptionsMap[currentCategory] || [];
    preset.forEach(t => types.add(t));
    return Array.from(types).sort();
  }, [currentData, currentCategory]);

  const availableSources = useMemo(() => {
    const sources = new Set(currentData.flatMap((item) => item.vendors || []).filter(Boolean));
    vendorOptions.forEach(v => sources.add(v));
    return Array.from(sources).sort();
  }, [currentData]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...currentData];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(term))
      );
    }

    if (isWeapons) {
      if (weaponTypeFilter) filtered = filtered.filter((item) => item.type === weaponTypeFilter);
      if (weaponClassFilter) filtered = filtered.filter((item) => item.weaponClasses?.includes(weaponClassFilter));
      if (weaponCaliberFilter) filtered = filtered.filter((item) => item.caliber === weaponCaliberFilter);
      if (weaponLevelFilter !== "") filtered = filtered.filter((item) => item.level === weaponLevelFilter);
      if (weaponVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(weaponVendorFilter));
      if (weaponPriceFilter) {
        const threshold = 1500;
        filtered = filtered.filter((item) => {
          const price = item.price ?? 0;
          return weaponPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (weaponDMGFilter) {
        const avgDamage = (item: BaseItem) => ((item.minDamage ?? 0) + (item.maxDamage ?? 0)) / 2;
        const threshold = 60;
        filtered = filtered.filter((item) => {
          const dmg = avgDamage(item);
          return weaponDMGFilter === "Low" ? dmg < threshold : dmg >= threshold;
        });
      }
      if (weaponModFilter) filtered = filtered.filter((item) => item.modLevel === weaponModFilter);
      if (weaponParameterFilter) filtered = filtered.filter((item) => item.parametersStats?.includes(weaponParameterFilter));
    } 
    else if (isAmmo) {
      if (ammoCaliberFilter) filtered = filtered.filter((item) => item.caliber === ammoCaliberFilter);
      if (ammoVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(ammoVendorFilter));
      if (ammoPriceFilter) {
        const threshold = 500;
        filtered = filtered.filter((item) => {
          const price = item.price ?? 0;
          return ammoPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (ammoDMGFilter) {
        const avgDamage = (item: BaseItem) => ((item.minDamage ?? 0) + (item.maxDamage ?? 0)) / 2;
        const threshold = 40;
        filtered = filtered.filter((item) => {
          const dmg = avgDamage(item);
          return ammoDMGFilter === "Low" ? dmg < threshold : dmg >= threshold;
        });
      }
      if (ammoAmmoTypeFilter) filtered = filtered.filter((item) => item.ammoType === ammoAmmoTypeFilter);
    }
    else if (isPremium) {
      if (premiumNameFilter.trim()) filtered = filtered.filter((item) => item.name.toLowerCase().includes(premiumNameFilter.trim().toLowerCase()));
      if (premiumTypeFilter) filtered = filtered.filter((item) => item.type === premiumTypeFilter);
      if (premiumPriceFilter) {
        const threshold = 1000;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? item.sellingPriceTokens ?? 0;
          return premiumPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
    }
    else if (isItems) {
      if (itemsTypeFilter) filtered = filtered.filter((item) => item.type === itemsTypeFilter);
      if (itemsLevelFilter !== "") filtered = filtered.filter((item) => item.level === itemsLevelFilter);
      if (itemsPriceFilter) {
        const threshold = 1000;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return itemsPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (itemsLocationFilter) filtered = filtered.filter((item) => item.locations?.includes(itemsLocationFilter));
      if (itemsWeightFilter) filtered = filtered.filter((item) => item.weight?.toLowerCase().includes(itemsWeightFilter.toLowerCase()));
      if (itemsVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(itemsVendorFilter));
    }
    else if (isArmor) {
      if (armorTypeFilter) filtered = filtered.filter((item) => item.type === armorTypeFilter);
      if (armorPriceFilter) {
        const threshold = 2000;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return armorPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (armorLocationFilter) filtered = filtered.filter((item) => item.locations?.includes(armorLocationFilter));
      if (armorModificationFilter) filtered = filtered.filter((item) => item.modification === armorModificationFilter);
      if (armorClassFilter) filtered = filtered.filter((item) => item.armorClass === armorClassFilter);
      if (armorLevelFilter !== "") filtered = filtered.filter((item) => item.level === armorLevelFilter);
      if (armorVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(armorVendorFilter));
    }
    else if (isMedicine) {
      if (medicineTypeFilter) filtered = filtered.filter((item) => item.type === medicineTypeFilter);
      if (medicinePriceFilter) {
        const threshold = 500;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return medicinePriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (medicineLocationFilter) filtered = filtered.filter((item) => item.locations?.includes(medicineLocationFilter));
      if (medicineLevelFilter !== "") filtered = filtered.filter((item) => item.level === medicineLevelFilter);
      if (medicineVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(medicineVendorFilter));
    }
    else if (isCrafting) {
      if (craftingStationFilter) filtered = filtered.filter((item) => item.craftingStation === craftingStationFilter);
      if (craftingTypeFilter) filtered = filtered.filter((item) => item.type === craftingTypeFilter);
      if (craftingPriceFilter) {
        const threshold = 800;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return craftingPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (craftingLocationFilter) filtered = filtered.filter((item) => item.locations?.includes(craftingLocationFilter));
      if (craftingLevelFilter !== "") filtered = filtered.filter((item) => item.level === craftingLevelFilter);
      if (craftingVendorFilter) filtered = filtered.filter((item) => item.vendors?.includes(craftingVendorFilter));
    }
    else if (isAchievements) {
      if (achievementsRarityFilter) filtered = filtered.filter((item) => item.achievementRarity === achievementsRarityFilter);
    }
    else if (!isGeneral) {
      switch (currentCategory) {
        case "guides":
          if (guideDifficultyFilter) filtered = filtered.filter((item) => item.guideDifficulty === guideDifficultyFilter);
          break;
        case "bestiary":
          if (bestiaryDifficultyFilter) filtered = filtered.filter((item) => item.bestiaryDifficulty === bestiaryDifficultyFilter);
          break;
        case "characters":
          if (characterPartFilter) filtered = filtered.filter((item) => item.characterPart === characterPartFilter);
          break;
        default: break;
      }
    }

    const defaultPriceSort = (isWeapons || isAmmo || isArmor || isMedicine || isPremium) && !sortField;
    if (sortField || defaultPriceSort) {
      filtered.sort((a, b) => {
        const activeSortField = (defaultPriceSort ? "priceValue" : sortField) as string;
        const activeDirection = defaultPriceSort ? "asc" : sortDirection;
        let aVal = a[activeSortField as keyof BaseItem] ?? "";
        let bVal = b[activeSortField as keyof BaseItem] ?? "";
        if (activeSortField === "dmg") {
          aVal = ((a.minDamage ?? 0) + (a.maxDamage ?? 0)) / 2;
          bVal = ((b.minDamage ?? 0) + (b.maxDamage ?? 0)) / 2;
          return activeDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        if (activeSortField === "priceValue" || activeSortField === "price") {
          aVal = a.basePriceTokens ?? a.price ?? 0;
          bVal = b.basePriceTokens ?? b.price ?? 0;
          return activeDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return activeDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        return activeDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return filtered;
  }, [
    currentData, searchTerm, currentCategory, isGeneral, isWeapons, isAmmo, isItems, isPremium, isArmor, isMedicine, isCrafting, isAchievements,
    weaponTypeFilter, weaponClassFilter, weaponCaliberFilter, weaponLevelFilter, weaponVendorFilter, weaponPriceFilter, weaponDMGFilter, weaponModFilter, weaponParameterFilter,
    ammoCaliberFilter, ammoVendorFilter, ammoPriceFilter, ammoDMGFilter, ammoAmmoTypeFilter,
    premiumNameFilter, premiumTypeFilter, premiumPriceFilter,
    itemsTypeFilter, itemsLevelFilter, itemsPriceFilter, itemsLocationFilter, itemsWeightFilter, itemsVendorFilter,
    armorTypeFilter, armorPriceFilter, armorLocationFilter, armorModificationFilter, armorClassFilter, armorLevelFilter, armorVendorFilter,
    medicineTypeFilter, medicinePriceFilter, medicineLocationFilter, medicineLevelFilter, medicineVendorFilter,
    craftingStationFilter, craftingTypeFilter, craftingPriceFilter, craftingLocationFilter, craftingLevelFilter, craftingVendorFilter,
    achievementsRarityFilter,
    guideDifficultyFilter, bestiaryDifficultyFilter, characterPartFilter,
    sortField, sortDirection
  ]);

  const openAddModal = () => {
    const emptyItem: BaseItem = {
      name: "",
      type: availableTypes[0] || "",
      level: 0,
      detail: "",
      vendors: [],
      weaponClasses: [],
      parametersStats: [],
      locations: [],
      imageUrl: "",
      imageDesc: "",
    };
    if (isWeapons) {
      emptyItem.caliber = "";
      emptyItem.price = 0;
      emptyItem.minDamage = 0;
      emptyItem.maxDamage = 0;
      emptyItem.critChance = 0;
      emptyItem.effectiveRange = 0;
      emptyItem.magazine = 0;
      emptyItem.moa = 0;
      emptyItem.modLevel = "M0";
      emptyItem.ammoComparisonType = "FMJ";
    }
    if (isAmmo) {
      emptyItem.caliber = "";
      emptyItem.price = 0;
      emptyItem.minDamage = 0;
      emptyItem.maxDamage = 0;
      emptyItem.ammoType = "FMJ";
      emptyItem.apPiercing = "";
      emptyItem.moa = 0;
      emptyItem.weight = "";
    }
    if (isItems || isPremium) {
      emptyItem.basePriceTokens = 0;
      emptyItem.sellingPriceTokens = 0;
      emptyItem.dropChance = 0;
      emptyItem.weight = "";
    }
    if (isArmor) {
      emptyItem.basePriceTokens = 0;
      emptyItem.dropChance = 0;
      emptyItem.weight = "";
      emptyItem.modification = "M0";
      emptyItem.defense = 0;
      emptyItem.armorClass = "Light";
    }
    if (isMedicine) {
      emptyItem.basePriceTokens = 0;
      emptyItem.dropChance = 0;
      emptyItem.weight = "";
      emptyItem.effectImageUrl = "";
    }
    if (isCrafting) {
      emptyItem.craftingStation = "Inventory";
      emptyItem.basePriceTokens = 0;
      emptyItem.dropChance = 0;
      emptyItem.weight = "";
    }
    if (isAchievements) {
      emptyItem.achievementRarity = "Common";
    }
    if (currentCategory === "guides") emptyItem.guideDifficulty = "Beginner";
    if (currentCategory === "bestiary") emptyItem.bestiaryDifficulty = "Normal";
    if (currentCategory === "characters") emptyItem.characterPart = "Head";
    
    setEditingIndex(null);
    setEditFormData(emptyItem);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const item = filteredAndSortedData[index];
    setEditingIndex(index);
    setEditFormData({ ...item });
    setIsModalOpen(true);
  };

  const saveItem = async () => {
    const newData = [...currentData];
    const cleanedFormData = {
      ...editFormData,
      imageUrl: normalizeProjectImagePath(editFormData.imageUrl || ""),
      effectImageUrl: normalizeProjectImagePath(editFormData.effectImageUrl || ""),
    };

    if (editingIndex !== null) {
      const originalItem = filteredAndSortedData[editingIndex];
      const originalIdx = currentData.findIndex(i => i === originalItem);
      if (originalIdx !== -1) {
        newData[originalIdx] = cleanedFormData;
      } else {
        newData.push(cleanedFormData);
      }
    } else {
      newData.push(cleanedFormData);
    }

    const updatedDatabase = { ...database, [currentCategory]: newData };
    setDatabase(updatedDatabase);
    await persistDatabase(updatedDatabase);
    setIsModalOpen(false);
  };

  const deleteItem = async (filteredIndex: number) => {
    const itemToDelete = filteredAndSortedData[filteredIndex];
    const newData = currentData.filter(i => i !== itemToDelete);
    const updatedDatabase = { ...database, [currentCategory]: newData };
    setDatabase(updatedDatabase);
    await persistDatabase(updatedDatabase);
    if (selectedInfoItem === itemToDelete) setSelectedInfoItem(null);
  };

  const openInfoModal = (item: BaseItem) => {
    setSelectedInfoItem(item);
  };

  const openEditModalForItem = (item: BaseItem) => {
    const idx = filteredAndSortedData.findIndex(i => i === item);
    setSelectedInfoItem(null);
    if (idx !== -1) {
      openEditModal(idx);
    } else {
      setEditingIndex(null);
      setEditFormData({ ...item });
      setIsModalOpen(true);
    }
  };

  const deleteItemByReference = async (itemToDelete: BaseItem) => {
    const newData = currentData.filter(i => i !== itemToDelete);
    const updatedDatabase = { ...database, [currentCategory]: newData };
    setDatabase(updatedDatabase);
    await persistDatabase(updatedDatabase);
    setSelectedInfoItem(null);
  };

  const downloadReactDatabaseFile = (db: Record<CategoryKey, BaseItem[]>) => {
    const blob = new Blob([databaseToReactFile(cloneDatabase(db))], {
      type: "text/typescript",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wtlo-database-data.ts";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const persistDatabase = async (db: Record<CategoryKey, BaseItem[]>) => {
    try {
      const response = await fetch("/api/wtlo-database/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloneDatabase(db)),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save WTLO database file.");
      }
    } catch (error) {
      console.error("Could not save WTLO database file:", error);
      alert("Could not save WTLO database file. Check the terminal and make sure /api/wtlo-database/save exists.");
    }
  };


  const uploadImageToProject = async (file: File, category: CategoryKey) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", getCategoryImageFolder(category));

    const response = await fetch("/api/wtlo-database/upload-image", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to save image into public/db-assets.");
    }

    return result as { success: true; fileName: string; publicPath: string };
  };

  const exportDatabaseToFile = () => {
    downloadReactDatabaseFile(database);
  };


  const resetAllFilters = () => {
    setSearchTerm("");
    if (isWeapons) {
      setWeaponTypeFilter("");
      setWeaponClassFilter("");
      setWeaponCaliberFilter("");
      setWeaponLevelFilter("");
      setWeaponVendorFilter("");
      setWeaponPriceFilter("");
      setWeaponDMGFilter("");
      setWeaponModFilter("");
      setWeaponParameterFilter("");
    } else if (isAmmo) {
      setAmmoTypeFilter("");
      setAmmoCaliberFilter("");
      setAmmoVendorFilter("");
      setAmmoPriceFilter("");
      setAmmoDMGFilter("");
      setAmmoAmmoTypeFilter("");
      setAmmoLevelFilter("");
    } else if (isPremium) {
      setPremiumNameFilter("");
      setPremiumTypeFilter("");
      setPremiumPriceFilter("");
    } else if (isItems) {
      setItemsTypeFilter("");
      setItemsLevelFilter("");
      setItemsPriceFilter("");
      setItemsLocationFilter("");
      setItemsWeightFilter("");
      setItemsVendorFilter("");
    } else if (isArmor) {
      setArmorTypeFilter("");
      setArmorPriceFilter("");
      setArmorLocationFilter("");
      setArmorModificationFilter("");
      setArmorClassFilter("");
      setArmorLevelFilter("");
      setArmorVendorFilter("");
    } else if (isMedicine) {
      setMedicineTypeFilter("");
      setMedicinePriceFilter("");
      setMedicineLocationFilter("");
      setMedicineLevelFilter("");
      setMedicineVendorFilter("");
    } else if (isCrafting) {
      setCraftingStationFilter("");
      setCraftingTypeFilter("");
      setCraftingPriceFilter("");
      setCraftingLocationFilter("");
      setCraftingLevelFilter("");
      setCraftingVendorFilter("");
    } else if (isAchievements) {
      setAchievementsRarityFilter("");
    } else if (!isGeneral) {
      setGuideDifficultyFilter("");
      setBestiaryDifficultyFilter("");
      setCharacterPartFilter("");
    }
    setSortField(null);
    setSortDirection("asc");
  };

  const removeChip = (id: string) => {
    if (isWeapons) {
      if (id === "weaponType") setWeaponTypeFilter("");
      if (id === "weaponClass") setWeaponClassFilter("");
      if (id === "weaponCaliber") setWeaponCaliberFilter("");
      if (id === "weaponLevel") setWeaponLevelFilter("");
      if (id === "weaponVendor") setWeaponVendorFilter("");
      if (id === "weaponPrice") setWeaponPriceFilter("");
      if (id === "weaponDMG") setWeaponDMGFilter("");
      if (id === "weaponMod") setWeaponModFilter("");
      if (id === "weaponParam") setWeaponParameterFilter("");
    } else if (isAmmo) {
      if (id === "ammoType") setAmmoTypeFilter("");
      if (id === "ammoCaliber") setAmmoCaliberFilter("");
      if (id === "ammoVendor") setAmmoVendorFilter("");
      if (id === "ammoPrice") setAmmoPriceFilter("");
      if (id === "ammoDMG") setAmmoDMGFilter("");
      if (id === "ammoAmmoType") setAmmoAmmoTypeFilter("");
      if (id === "ammoLevel") setAmmoLevelFilter("");
    } else if (isPremium) {
      if (id === "premiumName") setPremiumNameFilter("");
      if (id === "premiumType") setPremiumTypeFilter("");
      if (id === "premiumPrice") setPremiumPriceFilter("");
    } else if (isItems) {
      if (id === "itemsType") setItemsTypeFilter("");
      if (id === "itemsLevel") setItemsLevelFilter("");
      if (id === "itemsPrice") setItemsPriceFilter("");
      if (id === "itemsLocation") setItemsLocationFilter("");
      if (id === "itemsWeight") setItemsWeightFilter("");
      if (id === "itemsVendor") setItemsVendorFilter("");
    } else if (isArmor) {
      if (id === "armorType") setArmorTypeFilter("");
      if (id === "armorPrice") setArmorPriceFilter("");
      if (id === "armorLocation") setArmorLocationFilter("");
      if (id === "armorMod") setArmorModificationFilter("");
      if (id === "armorClass") setArmorClassFilter("");
      if (id === "armorLevel") setArmorLevelFilter("");
      if (id === "armorVendor") setArmorVendorFilter("");
    } else if (isMedicine) {
      if (id === "medicineType") setMedicineTypeFilter("");
      if (id === "medicinePrice") setMedicinePriceFilter("");
      if (id === "medicineLocation") setMedicineLocationFilter("");
      if (id === "medicineLevel") setMedicineLevelFilter("");
      if (id === "medicineVendor") setMedicineVendorFilter("");
    } else if (isCrafting) {
      if (id === "craftingStation") setCraftingStationFilter("");
      if (id === "craftingType") setCraftingTypeFilter("");
      if (id === "craftingPrice") setCraftingPriceFilter("");
      if (id === "craftingLocation") setCraftingLocationFilter("");
      if (id === "craftingLevel") setCraftingLevelFilter("");
      if (id === "craftingVendor") setCraftingVendorFilter("");
    } else if (isAchievements) {
      if (id === "achievementsRarity") setAchievementsRarityFilter("");
    } else if (!isGeneral) {
      if (id === "guideDifficulty") setGuideDifficultyFilter("");
      if (id === "bestiaryDifficulty") setBestiaryDifficultyFilter("");
      if (id === "characterPart") setCharacterPartFilter("");
    }
  };

  const switchCategory = (cat: CategoryKey) => {
    setCurrentCategory(cat);
    resetAllFilters();
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadImageToProject(file, currentCategory);

      setEditFormData({
        ...editFormData,
        imageUrl: uploaded.publicPath,
        imageDesc: uploaded.fileName,
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Image upload failed. Check the terminal.");
    }

    e.target.value = "";
  };

  const openQuickImageUpload = (item: BaseItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    quickImageUploadTargetRef.current = item;
    quickImageUploadInputRef.current?.click();
  };

  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetItem = quickImageUploadTargetRef.current;

    if (!file || !targetItem) {
      e.target.value = "";
      return;
    }

    try {
      const uploaded = await uploadImageToProject(file, currentCategory);
      const updatedItem = {
        ...targetItem,
        imageUrl: uploaded.publicPath,
        imageDesc: uploaded.fileName,
      };
      const newData = currentData.map((item) => (item === targetItem ? updatedItem : item));
      const updatedDatabase = { ...database, [currentCategory]: newData };

      setDatabase(updatedDatabase);
      await persistDatabase(updatedDatabase);

      if (selectedInfoItem === targetItem) {
        setSelectedInfoItem(updatedItem);
      }
    } catch (error) {
      console.error("Quick image upload failed:", error);
      alert("Image upload failed. Check the terminal.");
    }

    quickImageUploadTargetRef.current = null;
    e.target.value = "";
  };

  const handleEffectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadImageToProject(file, currentCategory);

      setEditFormData({
        ...editFormData,
        effectImageUrl: uploaded.publicPath,
      });
    } catch (error) {
      console.error("Effect image upload failed:", error);
      alert("Effect image upload failed. Check the terminal.");
    }

    e.target.value = "";
  };

  useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getActiveFilters = () => {
    if (isWeapons) {
      return [
        { label: `Type: ${weaponTypeFilter}`, id: "weaponType", active: !!weaponTypeFilter },
        { label: `Class: ${weaponClassFilter}`, id: "weaponClass", active: !!weaponClassFilter },
        { label: `Caliber: ${weaponCaliberFilter}`, id: "weaponCaliber", active: !!weaponCaliberFilter },
        { label: `Level: ${weaponLevelFilter === 0 ? "N/R" : weaponLevelFilter}`, id: "weaponLevel", active: weaponLevelFilter !== "" },
        { label: `Vendor: ${weaponVendorFilter}`, id: "weaponVendor", active: !!weaponVendorFilter },
        { label: `Price: ${weaponPriceFilter}`, id: "weaponPrice", active: !!weaponPriceFilter },
        { label: `DMG: ${weaponDMGFilter}`, id: "weaponDMG", active: !!weaponDMGFilter },
        { label: `Mod: ${weaponModFilter}`, id: "weaponMod", active: !!weaponModFilter },
        { label: `Parameter: ${weaponParameterFilter}`, id: "weaponParam", active: !!weaponParameterFilter },
      ].filter(f => f.active);
    } else if (isAmmo) {
      return [
        { label: `Caliber: ${ammoCaliberFilter}`, id: "ammoCaliber", active: !!ammoCaliberFilter },
        { label: `Vendor: ${ammoVendorFilter}`, id: "ammoVendor", active: !!ammoVendorFilter },
        { label: `Price: ${ammoPriceFilter}`, id: "ammoPrice", active: !!ammoPriceFilter },
        { label: `DMG: ${ammoDMGFilter}`, id: "ammoDMG", active: !!ammoDMGFilter },
        { label: `Ammo Type: ${ammoAmmoTypeFilter}`, id: "ammoAmmoType", active: !!ammoAmmoTypeFilter },
      ].filter(f => f.active);
    } else if (isPremium) {
      return [
        { label: `Name: ${premiumNameFilter}`, id: "premiumName", active: !!premiumNameFilter },
        { label: `Type: ${premiumTypeFilter}`, id: "premiumType", active: !!premiumTypeFilter },
        { label: `Price: ${premiumPriceFilter}`, id: "premiumPrice", active: !!premiumPriceFilter },
      ].filter(f => f.active);
    } else if (isItems) {
      return [
        { label: `Type: ${itemsTypeFilter}`, id: "itemsType", active: !!itemsTypeFilter },
        { label: `Level: ${itemsLevelFilter === 0 ? "N/R" : itemsLevelFilter}`, id: "itemsLevel", active: itemsLevelFilter !== "" },
        { label: `Price: ${itemsPriceFilter}`, id: "itemsPrice", active: !!itemsPriceFilter },
        { label: `Location: ${itemsLocationFilter}`, id: "itemsLocation", active: !!itemsLocationFilter },
        { label: `Weight: ${itemsWeightFilter}`, id: "itemsWeight", active: !!itemsWeightFilter },
        { label: `Vendor: ${itemsVendorFilter}`, id: "itemsVendor", active: !!itemsVendorFilter },
      ].filter(f => f.active);
    } else if (isArmor) {
      return [
        { label: `Type: ${armorTypeFilter}`, id: "armorType", active: !!armorTypeFilter },
        { label: `Level: ${armorLevelFilter === 0 ? "N/R" : armorLevelFilter}`, id: "armorLevel", active: armorLevelFilter !== "" },
        { label: `Price: ${armorPriceFilter}`, id: "armorPrice", active: !!armorPriceFilter },
        { label: `Location: ${armorLocationFilter}`, id: "armorLocation", active: !!armorLocationFilter },
        { label: `Mod: ${armorModificationFilter}`, id: "armorMod", active: !!armorModificationFilter },
        { label: `Class: ${armorClassFilter}`, id: "armorClass", active: !!armorClassFilter },
        { label: `Vendor: ${armorVendorFilter}`, id: "armorVendor", active: !!armorVendorFilter },
      ].filter(f => f.active);
    } else if (isMedicine) {
      return [
        { label: `Type: ${medicineTypeFilter}`, id: "medicineType", active: !!medicineTypeFilter },
        { label: `Level: ${medicineLevelFilter === 0 ? "N/R" : medicineLevelFilter}`, id: "medicineLevel", active: medicineLevelFilter !== "" },
        { label: `Price: ${medicinePriceFilter}`, id: "medicinePrice", active: !!medicinePriceFilter },
        { label: `Location: ${medicineLocationFilter}`, id: "medicineLocation", active: !!medicineLocationFilter },
        { label: `Vendor: ${medicineVendorFilter}`, id: "medicineVendor", active: !!medicineVendorFilter },
      ].filter(f => f.active);
    } else if (isCrafting) {
      return [
        { label: `Station: ${craftingStationFilter}`, id: "craftingStation", active: !!craftingStationFilter },
        { label: `Type: ${craftingTypeFilter}`, id: "craftingType", active: !!craftingTypeFilter },
        { label: `Level: ${craftingLevelFilter === 0 ? "N/R" : craftingLevelFilter}`, id: "craftingLevel", active: craftingLevelFilter !== "" },
        { label: `Price: ${craftingPriceFilter}`, id: "craftingPrice", active: !!craftingPriceFilter },
        { label: `Location: ${craftingLocationFilter}`, id: "craftingLocation", active: !!craftingLocationFilter },
        { label: `Vendor: ${craftingVendorFilter}`, id: "craftingVendor", active: !!craftingVendorFilter },
      ].filter(f => f.active);
    } else if (isAchievements) {
      return [
        { label: `Rarity: ${achievementsRarityFilter}`, id: "achievementsRarity", active: !!achievementsRarityFilter },
      ].filter(f => f.active);
    } else if (!isGeneral) {
      switch (currentCategory) {
        case "guides":
          if (guideDifficultyFilter) return [{ label: `Difficulty: ${guideDifficultyFilter}`, id: "guideDifficulty", active: true }];
          break;
        case "bestiary":
          if (bestiaryDifficultyFilter) return [{ label: `Difficulty: ${bestiaryDifficultyFilter}`, id: "bestiaryDifficulty", active: true }];
          break;
        case "characters":
          if (characterPartFilter) return [{ label: `Body Part: ${characterPartFilter}`, id: "characterPart", active: true }];
          break;
      }
    }
    return [];
  };

  const formatTokenPrice = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return "-";
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₸`;
  };

  const getItemPriceValue = (item: BaseItem) => item.basePriceTokens ?? item.price ?? item.sellingPriceTokens ?? 0;
  const getDamageValue = (item: BaseItem) => ((item.minDamage ?? item.damage ?? 0) + (item.maxDamage ?? item.damage ?? 0)) / 2;
  const displayDamage = (item: BaseItem) => {
    if (item.minDamage !== undefined && item.maxDamage !== undefined) return `${item.minDamage}–${item.maxDamage}`;
    if (item.damage !== undefined) return String(item.damage);
    return "-";
  };

  const renderStatHighlights = (item: BaseItem) => {
    const price = getItemPriceValue(item);
    const dmg = displayDamage(item);
    const showDamage = isWeapons || isAmmo;
    const showPrice = isWeapons || isAmmo || isArmor || isMedicine || isItems || isPremium || isCrafting;
    if (!showDamage && !showPrice && !item.weight && !item.caliber) return null;
    return (
      <div className="card-stat-grid">
        {showPrice && <div className="stat-pill"><span>Price</span><strong>{price ? formatTokenPrice(price) : "-"}</strong></div>}
        {showDamage && <div className="stat-pill"><span>DMG</span><strong>{dmg}</strong></div>}
        {(isWeapons || isAmmo) && item.apPiercing && <div className="stat-pill"><span>AP</span><strong>{item.apPiercing}</strong></div>}
        {(isWeapons || isAmmo) && item.caliber && <div className="stat-pill"><span>Caliber</span><strong>{item.caliber}</strong></div>}
        {(isArmor) && item.armorClass && <div className="stat-pill"><span>Armor Class</span><strong>{item.armorClass}</strong></div>}
        {item.weight && <div className="stat-pill"><span>Weight</span><strong>{item.weight}</strong></div>}
      </div>
    );
  };

  const renderCardDetails = (item: BaseItem) => {
    const levelDisplay = item.level === 0 ? "N/R" : item.level;
    if (isWeapons) {
      return (
        <>
          <div className="card-detail"><strong>Class:</strong> {item.weaponClasses?.join(", ") || "-"}</div>
          <div className="card-detail"><strong>Caliber:</strong> {item.caliber || "-"}</div>
          <div className="card-detail"><strong>Damage:</strong> {item.minDamage && item.maxDamage ? `${item.minDamage}–${item.maxDamage}` : item.damage || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(item.price)}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
          <div className="card-detail"><strong>Parameter:</strong> {item.parametersStats?.join(", ") || "-"}</div>
          <div className="card-detail"><strong>Crit %:</strong> {item.critChance ? `x${item.critChance}` : "-"}</div>
          <div className="card-detail"><strong>Range:</strong> {item.effectiveRange ? `${item.effectiveRange}m` : "-"}</div>
          <div className="card-detail"><strong>Magazine:</strong> {item.magazine || "-"}</div>
          <div className="card-detail"><strong>MOA:</strong> {item.moa || "-"}</div>
          <div className="card-detail"><strong>Mod:</strong> {item.modLevel || "-"}</div>
          {item.apPiercing && <div className="card-detail"><strong>AP:</strong> {item.apPiercing}</div>}
        </>
      );
    }
    if (isAmmo) {
      return (
        <>
          <div className="card-detail"><strong>Caliber:</strong> {item.caliber || "-"}</div>
          <div className="card-detail"><strong>Damage:</strong> {item.minDamage && item.maxDamage ? `${item.minDamage}–${item.maxDamage}` : "-"}</div>
          <div className="card-detail"><strong>Ammo Type:</strong> {item.ammoType || "-"}</div>
          <div className="card-detail"><strong>AP Piercing:</strong> {item.apPiercing || "-"}</div>
          <div className="card-detail"><strong>MOA:</strong> {item.moa || "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(item.price)}</div>
        </>
      );
    }
    if (isItems || isPremium) {
      return (
        <>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Buy Price:</strong> {formatTokenPrice(item.basePriceTokens)}</div>
          {item.sellingPriceTokens !== undefined && item.sellingPriceTokens !== null && (
            <div className="card-detail"><strong>Sell Price:</strong> {formatTokenPrice(item.sellingPriceTokens)}</div>
          )}
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
        </>
      );
    }
    if (isArmor) {
      return (
        <>
          <div className="card-detail"><strong>Defense:</strong> {item.defense || "-"}</div>
          <div className="card-detail"><strong>Class:</strong> {item.armorClass || "-"}</div>
          <div className="card-detail"><strong>Modification:</strong> {item.modification || "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
        </>
      );
    }
    if (isMedicine) {
      return (
        <>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
          {item.effectImageUrl && <div className="card-detail"><strong>Effects:</strong> <img src={item.effectImageUrl} alt="effects" style={{ maxWidth: "100px", marginTop: "5px" }} /></div>}
        </>
      );
    }
    if (isCrafting) {
      return (
        <>
          <div className="card-detail"><strong>Station:</strong> {item.craftingStation || "-"}</div>
          <div className="card-detail"><strong>Type:</strong> {item.type || "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(item.basePriceTokens)}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
        </>
      );
    }
    if (isAchievements) {
      return (
        <>
          <div className="card-detail"><strong>Rarity:</strong> {item.achievementRarity || "-"}</div>
        </>
      );
    }
    switch (currentCategory) {
      case "guides":
        return <div className="card-detail"><strong>Guide Difficulty:</strong> {item.guideDifficulty || "-"}</div>;
      case "bestiary":
        return (
          <>
            <div className="card-detail"><strong>Damage:</strong> {item.damage || "-"}</div>
            <div className="card-detail"><strong>Bestiary Difficulty:</strong> {item.bestiaryDifficulty || "-"}</div>
          </>
        );
      case "characters":
        return <div className="card-detail"><strong>Body Part:</strong> {item.characterPart || "-"}</div>;
      default:
        return null;
    }
  };


  const renderInfoDetails = (item: BaseItem) => {
    const rows = (pairs: Array<[string, React.ReactNode | undefined | null | false]>) =>
      pairs
        .filter(([, value]) => value !== undefined && value !== null && value !== false && String(value).trim() !== "" && String(value).trim() !== "-")
        .map(([label, value]) => (
          <div className="info-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ));

    const levelDisplay = item.level === 0 ? "N/R" : item.level;
    const priceValue = getItemPriceValue(item);
    const sections: React.ReactNode[] = [];

    sections.push(
      <div className="info-section" key="basic">
        <h3>Basic information</h3>
        {rows([
          ["Category", categories.find(c => c.key === currentCategory)?.label],
          ["Type", item.type],
          ["Rarity", item.rarity],
          ["Level", isAmmo ? undefined : levelDisplay],
          ["Caliber", item.caliber],
          ["Ammo Type", item.ammoType],
          ["Armor Class", item.armorClass],
          ["Weight", item.weight],
        ])}
      </div>
    );

    const statRows = rows([
      ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
      ["Base Price", item.basePriceTokens !== undefined ? formatTokenPrice(item.basePriceTokens) : undefined],
      ["Sell Price", item.sellingPriceTokens !== undefined ? formatTokenPrice(item.sellingPriceTokens) : undefined],
      ["Damage", displayDamage(item)],
      ["AP", item.apPiercing],
      ["Defense", item.defense],
      ["Critical", item.critChance !== undefined ? `x${item.critChance}` : undefined],
      ["Magazine", item.magazine !== undefined ? item.magazine : undefined],
      ["Accuracy / MOA", item.moa !== undefined ? item.moa : undefined],
      ["Effective Range", item.effectiveRange !== undefined ? item.effectiveRange : undefined],
      ["Mod", item.modLevel || item.modification],
      ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
      ["Crafting Station", item.craftingStation],
    ]);
    if (statRows.length) sections.push(<div className="info-section" key="stats"><h3>Important stats</h3>{statRows}</div>);

    const requirementRows = rows([
      ["Suitable Classes", item.weaponClasses?.length ? item.weaponClasses.join(", ") : undefined],
      ["Parameters", item.parametersStats?.length ? item.parametersStats.join(", ") : undefined],
      ["Item Parameters", item.itemParameters],
      ["Armor Parameters", item.armorParameters],
    ]);
    if (requirementRows.length) sections.push(<div className="info-section" key="requirements"><h3>Requirements / Parameters</h3>{requirementRows}</div>);

    const sourceRows = rows([
      ["Vendors", item.vendors?.length ? item.vendors.join(", ") : undefined],
      ["Locations", item.locations?.length ? item.locations.join(", ") : undefined],
      ["Source", item.source],
    ]);
    if (sourceRows.length) sections.push(<div className="info-section" key="sources"><h3>Sources</h3>{sourceRows}</div>);

    if (item.detail) {
      sections.push(
        <div className="info-section" key="details">
          <h3>Description / Details</h3>
          <div className="info-row"><span>Info</span><strong>{item.detail}</strong></div>
        </div>
      );
    }

    if (item.effectImageUrl) {
      sections.push(
        <div className="info-section" key="effects">
          <h3>Effect image</h3>
          <div className="info-effect-image"><span>Effects</span><img src={item.effectImageUrl} alt={`${item.name} effects`} /></div>
        </div>
      );
    }

    return sections;
  };

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: "general", label: "General Info", icon: "fa-info-circle" },
    { key: "guides", label: "Guides", icon: "fa-book-open" },
    { key: "bestiary", label: "Bestiary", icon: "fa-skull" },
    { key: "characters", label: "Characters", icon: "fa-users" },
    { key: "Items", label: "Items", icon: "fa-gem" },
    { key: "premium", label: "Premium", icon: "fa-crown" },
    { key: "weapons", label: "Weapons", icon: "fa-crosshairs" },
    { key: "ammo", label: "Ammo", icon: "fa-bullseye" },
    { key: "armor", label: "Armor", icon: "fa-shield-alt" },
    { key: "medicine", label: "Medicine", icon: "fa-kit-medical" },
    { key: "crafting", label: "Crafting", icon: "fa-hammer" },
    { key: "achievements", label: "Achievements", icon: "fa-trophy" },
  ];

  // -------------------- VALUE ADDER MODAL (multi‑select with Ctrl) --------------------
  const renderModalFields = () => {
    const comboboxDatalists = (
      <div style={{ display: 'none' }}>
        <datalist id="globalCaliberList">
          {caliberOptions.map(c => <option key={c} value={c} />)}
        </datalist>
        <datalist id="globalAmmoComparisonList">
          {ammoComparisonOptions.map(a => <option key={a} value={a} />)}
        </datalist>
      </div>
    );

    if (isGeneral) {
      return (
        <>
          {comboboxDatalists}
          <div className="modal-form-grid">
            <div className="form-row">
              <div className="form-field">
                <label>Name *</label>
                <input type="text" placeholder="Name" value={editFormData.name || ""} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>Type</label>
                <select value={editFormData.type || ""} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}>
                  <option value="">Select type</option>
                  {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Level</label>
                <input type="number" placeholder="Level" value={editFormData.level || 1} onChange={e => setEditFormData({ ...editFormData, level: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="form-field">
                <label>Vendors</label>
                <select multiple value={editFormData.vendors || []} onChange={e => setEditFormData({ ...editFormData, vendors: Array.from(e.target.selectedOptions, o => o.value) })}>
                  {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea placeholder="Description" rows={2} value={editFormData.detail || ""} onChange={e => setEditFormData({ ...editFormData, detail: e.target.value })} />
            </div>
            <div className="modal-image-group">
              <input type="text" placeholder="Project image path, e.g. /db-assets/weapons/item.png" value={editFormData.imageUrl || ""} onChange={e => setEditFormData({ ...editFormData, imageUrl: normalizeProjectImagePath(e.target.value) })} />
              <button type="button" onClick={() => document.getElementById("image-upload")?.click()} className="upload-btn">Choose File</button>
              <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} style={{ display: "none" }} id="image-upload" />
            </div>
            <input type="text" placeholder="Image Description" value={editFormData.imageDesc || ""} onChange={e => setEditFormData({ ...editFormData, imageDesc: e.target.value })} />
          </div>
        </>
      );
    }

    return (
      <div className="modal-form-grid">
        {comboboxDatalists}
        
        <div className="form-row">
          <div className="form-field">
            <label>Name *</label>
            <input type="text" placeholder="Name" value={editFormData.name || ""} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Type</label>
            <select value={editFormData.type || ""} onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}>
              <option value="">Select type</option>
              {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Level selector */}
        {!isAchievements && (
          <div className="form-row">
            <div className="form-field">
              <label>Level</label>
              <select value={editFormData.level ?? 0} onChange={e => setEditFormData({ ...editFormData, level: parseInt(e.target.value) })}>
                {universalLevelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {isAchievements && (
              <div className="form-field">
                <label>Achievement Rarity</label>
                <select value={editFormData.achievementRarity || "Common"} onChange={e => setEditFormData({ ...editFormData, achievementRarity: e.target.value as AchievementRarity })}>
                  {achievementRarityOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Vendors - multi-select for all non‑general categories */}
        {!isGeneral && (
          <div className="form-field">
            <label>Vendors</label>
            <select multiple value={editFormData.vendors || []} onChange={e => setEditFormData({ ...editFormData, vendors: Array.from(e.target.selectedOptions, o => o.value) })}>
              {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>
        )}

        {/* Price fields - all in Tokens */}
        {(isWeapons || isAmmo) && (
          <div className="form-row">
            <div className="form-field">
              <label>Price (Tokens)</label>
              <input type="number" placeholder="Price in Tokens" value={editFormData.price || 0} onChange={e => setEditFormData({ ...editFormData, price: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        )}

        {(isItems || isPremium || isArmor || isMedicine || isCrafting) && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Base Price (Tokens)</label>
                <input type="number" placeholder="Price in Tokens" value={editFormData.basePriceTokens || 0} onChange={e => setEditFormData({ ...editFormData, basePriceTokens: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-field">
                <label>Drop Chance (%)</label>
                <input type="number" step="0.1" placeholder="Drop Chance" value={editFormData.dropChance || 0} onChange={e => setEditFormData({ ...editFormData, dropChance: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            {(isItems || isPremium) && (
              <div className="form-row">
                <div className="form-field">
                  <label>Selling Price (Tokens)</label>
                  <input type="number" placeholder="Sell Price" value={editFormData.sellingPriceTokens || 0} onChange={e => setEditFormData({ ...editFormData, sellingPriceTokens: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="form-field">
                <label>Weight</label>
                <input type="text" placeholder="e.g., 0.5 kg" value={editFormData.weight || ""} onChange={e => setEditFormData({ ...editFormData, weight: e.target.value })} />
              </div>
              {(isItems || isPremium || isArmor || isMedicine || isCrafting) && (
                <div className="form-field">
                  <label>Locations</label>
                  <select multiple value={editFormData.locations || []} onChange={e => setEditFormData({ ...editFormData, locations: Array.from(e.target.selectedOptions, o => o.value) })}>
                    {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  <small>Hold Ctrl/Cmd to select multiple</small>
                </div>
              )}
            </div>
          </>
        )}

        {isWeapons && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Weapon Classes</label>
                <select multiple value={editFormData.weaponClasses || []} onChange={e => setEditFormData({ ...editFormData, weaponClasses: Array.from(e.target.selectedOptions, o => o.value) })}>
                  {weaponClassOptions.map(wc => <option key={wc} value={wc}>{wc}</option>)}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
              <div className="form-field">
                <label>Parameters</label>
                <select multiple value={editFormData.parametersStats || []} onChange={e => setEditFormData({ ...editFormData, parametersStats: Array.from(e.target.selectedOptions, o => o.value) })}>
                  {parametersStatOptions.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Caliber</label>
                <input list="globalCaliberList" placeholder="Caliber" value={editFormData.caliber || ""} onChange={e => setEditFormData({ ...editFormData, caliber: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Ammo Comparison Type</label>
                <input list="globalAmmoComparisonList" placeholder="Ammo Comparison" value={editFormData.ammoComparisonType || ""} onChange={e => setEditFormData({ ...editFormData, ammoComparisonType: e.target.value as any })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Min Damage</label>
                <input type="number" placeholder="Min Damage" value={editFormData.minDamage || 0} onChange={e => setEditFormData({ ...editFormData, minDamage: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-field">
                <label>Max Damage</label>
                <input type="number" placeholder="Max Damage" value={editFormData.maxDamage || 0} onChange={e => setEditFormData({ ...editFormData, maxDamage: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Critical Hit Chance (multiplier)</label>
                <input type="number" step="0.1" placeholder="e.g., 1.2" value={editFormData.critChance || 0} onChange={e => setEditFormData({ ...editFormData, critChance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="form-field">
                <label>Effective Range (m)</label>
                <input type="number" placeholder="Range" value={editFormData.effectiveRange || 0} onChange={e => setEditFormData({ ...editFormData, effectiveRange: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Magazine Size</label>
                <input type="number" placeholder="Magazine" value={editFormData.magazine || 0} onChange={e => setEditFormData({ ...editFormData, magazine: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-field">
                <label>MOA Accuracy</label>
                <input type="number" step="0.1" placeholder="MOA" value={editFormData.moa || 0} onChange={e => setEditFormData({ ...editFormData, moa: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-field">
              <label>Mod Level</label>
              <select value={editFormData.modLevel || ""} onChange={e => setEditFormData({ ...editFormData, modLevel: e.target.value })}>
                <option value="">Select mod level</option>
                {modLevelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Armor Penetration (AP)</label>
              <input type="text" placeholder="e.g., 1-5" value={editFormData.apPiercing || ""} onChange={e => setEditFormData({ ...editFormData, apPiercing: e.target.value })} />
            </div>
          </>
        )}

        {isAmmo && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Caliber</label>
                <input list="globalCaliberList" placeholder="Caliber" value={editFormData.caliber || ""} onChange={e => setEditFormData({ ...editFormData, caliber: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Ammo Type</label>
                <select value={editFormData.ammoType || ""} onChange={e => setEditFormData({ ...editFormData, ammoType: e.target.value as any })}>
                  <option value="">Select ammo type</option>
                  {ammoComparisonOptions.map(at => <option key={at} value={at}>{at}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Min Damage</label>
                <input type="number" placeholder="Min Damage" value={editFormData.minDamage || 0} onChange={e => setEditFormData({ ...editFormData, minDamage: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-field">
                <label>Max Damage</label>
                <input type="number" placeholder="Max Damage" value={editFormData.maxDamage || 0} onChange={e => setEditFormData({ ...editFormData, maxDamage: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>AP Piercing (PVE/PVP)</label>
                <input type="text" placeholder="e.g., PVE: 17-25 / PVP: 17-25" value={editFormData.apPiercing || ""} onChange={e => setEditFormData({ ...editFormData, apPiercing: e.target.value })} />
              </div>
              <div className="form-field">
                <label>MOA Accuracy</label>
                <input type="number" step="0.1" placeholder="MOA" value={editFormData.moa || 0} onChange={e => setEditFormData({ ...editFormData, moa: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-field">
              <label>Weight</label>
              <input type="text" placeholder="Weight" value={editFormData.weight || ""} onChange={e => setEditFormData({ ...editFormData, weight: e.target.value })} />
            </div>
          </>
        )}

        {isArmor && (
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Armor Class</label>
                <select value={editFormData.armorClass || ""} onChange={e => setEditFormData({ ...editFormData, armorClass: e.target.value })}>
                  <option value="">Select class</option>
                  {armorClassOptions.map(ac => <option key={ac} value={ac}>{ac}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Defense</label>
                <input type="number" placeholder="Defense" value={editFormData.defense || 0} onChange={e => setEditFormData({ ...editFormData, defense: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="form-field">
              <label>Modification</label>
              <select value={editFormData.modification || ""} onChange={e => setEditFormData({ ...editFormData, modification: e.target.value as any })}>
                <option value="">Select mod</option>
                {armorModificationOptions.map(am => <option key={am} value={am}>{am}</option>)}
              </select>
            </div>
          </>
        )}

        {isMedicine && (
          <div className="form-field">
            <label>Effects Image</label>
            <div className="modal-image-group">
              <input type="text" placeholder="Effect Image URL" value={editFormData.effectImageUrl || ""} onChange={e => setEditFormData({ ...editFormData, effectImageUrl: e.target.value })} />
              <button type="button" onClick={() => document.getElementById("effect-upload")?.click()} className="upload-btn">Upload Effect</button>
              <input type="file" accept="image/*" onChange={handleEffectImageUpload} ref={effectFileInputRef} style={{ display: "none" }} id="effect-upload" />
            </div>
          </div>
        )}

        {isCrafting && (
          <div className="form-field">
            <label>Crafting Station</label>
            <select value={editFormData.craftingStation || ""} onChange={e => setEditFormData({ ...editFormData, craftingStation: e.target.value })}>
              <option value="">Select station</option>
              {craftingStationOptions.map(cs => <option key={cs} value={cs}>{cs}</option>)}
            </select>
          </div>
        )}

        {currentCategory === "guides" && (
          <div className="form-field">
            <label>Guide Difficulty</label>
            <select value={editFormData.guideDifficulty || ""} onChange={e => setEditFormData({ ...editFormData, guideDifficulty: e.target.value })}>
              <option value="">Select difficulty</option>
              {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {currentCategory === "bestiary" && (
          <div className="form-row">
            <div className="form-field">
              <label>Bestiary Difficulty</label>
              <select value={editFormData.bestiaryDifficulty || ""} onChange={e => setEditFormData({ ...editFormData, bestiaryDifficulty: e.target.value })}>
                <option value="">Select difficulty</option>
                {difficultyOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Damage</label>
              <input type="number" placeholder="Damage" value={editFormData.damage || 0} onChange={e => setEditFormData({ ...editFormData, damage: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        )}
        {currentCategory === "characters" && (
          <div className="form-field">
            <label>Body Part / Faction</label>
            <select value={editFormData.characterPart || ""} onChange={e => setEditFormData({ ...editFormData, characterPart: e.target.value })}>
              <option value="">Select part</option>
              {characterPartOptions.map(cp => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          </div>
        )}

        <div className="form-field">
          <label>Description</label>
          <textarea placeholder="Description" rows={3} value={editFormData.detail || ""} onChange={e => setEditFormData({ ...editFormData, detail: e.target.value })} />
        </div>

        <div className="form-field">
          <label>Main Image</label>
          <div className="modal-image-group">
            <input type="text" placeholder="Project image path, e.g. /db-assets/weapons/item.png" value={editFormData.imageUrl || ""} onChange={e => setEditFormData({ ...editFormData, imageUrl: normalizeProjectImagePath(e.target.value) })} />
            <button type="button" onClick={() => document.getElementById("image-upload-adv")?.click()} className="upload-btn"><i className="fas fa-cloud-upload-alt"></i> Upload</button>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} id="image-upload-adv" />
          </div>
          <input type="text" placeholder="Image Description" value={editFormData.imageDesc || ""} onChange={e => setEditFormData({ ...editFormData, imageDesc: e.target.value })} style={{ marginTop: "8px" }} />
        </div>
      </div>
    );
  };

  // Loading screen (unchanged)
  if (!mounted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh",
        background: "#000000", fontFamily: "Inter, sans-serif", gap: 24,
        userSelect: "none",
      }}>
        <style>{`
          @keyframes wtlo-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.93); }
          }
          @keyframes wtlo-bar {
            0% { width: 0%; }
            60% { width: 75%; }
            100% { width: 100%; }
          }
          .wtlo-logo-anim {
            animation: wtlo-pulse 1.6s ease-in-out infinite;
          }
          .wtlo-bar-anim {
            animation: wtlo-bar 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
          }
        `}</style>
        <img
          src="/wtlo-logo.png"
          alt="WTLO"
          className="wtlo-logo-anim"
          style={{ width: 90, height: 90, objectFit: "contain", borderRadius: "50%", filter: "drop-shadow(0 0 18px #e8b84b88)" }}
        />
        <div style={{ textAlign: "center", lineHeight: 1.4 }}>
          <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: "1.35rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>WTLO Wiki</div>
          <div style={{ color: "#505050", fontSize: "0.72rem", letterSpacing: "0.2em", marginTop: 2 }}>TAC-DB v3.0</div>
        </div>
        <div style={{ width: 180, height: 3, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
          <div className="wtlo-bar-anim" style={{ height: "100%", background: "linear-gradient(90deg,#e8b84b,#ffdd88)", borderRadius: 99 }} />
        </div>
        <div style={{ color: "#3a3a3a", fontSize: "0.68rem", letterSpacing: "0.15em", marginTop: -8 }}>LOADING DATABASE…</div>
      </div>
    );
  }

  // Main render (filter panel unchanged)
  return (
    <>
      <style jsx global>{`
        :root {
          --bg-base: #000000;
          --bg-surface: #0a0a0a;
          --bg-elevated: #141414;
          --bg-sidebar: #050505;
          --bg-input: #111111;
          --border-color: #2a2a2a;
          --border-accent: #4a4a4a;
          --text-primary: #e0e0e0;
          --text-secondary: #a0a0a0;
          --text-tertiary: #707070;
          --accent: #c9a23b;
          --accent-bg: rgba(201, 162, 59, 0.12);
          --radius-sm: 3px;
          --radius-md: 6px;
          --radius-lg: 12px;
          --transition-fast: 0.15s ease;
          --font-display: "Inter", system-ui, sans-serif;
          --font-body: "Inter", system-ui, sans-serif;
          --sidebar-width: 260px;
          --header-height: 64px;
        }
        [data-theme="military-light"] {
          --bg-base: #f0ede4;
          --bg-surface: #e6e1d5;
          --bg-elevated: #dbd5c5;
          --bg-sidebar: #ddd7c5;
          --bg-input: #ece7db;
          --border-color: #b8af9a;
          --border-accent: #8f866e;
          --text-primary: #1e201b;
          --text-secondary: #3d4038;
          --text-tertiary: #5e6259;
          --accent: #a47c2b;
          --accent-bg: rgba(164, 124, 43, 0.1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          margin: 0;
          font-family: var(--font-body);
          background: var(--bg-base);
          color: var(--text-primary);
          overflow: hidden;
        }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 40; }
        .sidebar-overlay.show { display: block; }
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow-y: auto;
          transition: transform 0.3s ease;
          z-index: 50;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        .sidebar-logo {
          padding: 20px 16px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .sidebar-logo .logo-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 2px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
        }
        .sidebar-logo .logo-text { font-weight: 600; font-size: 1.2rem; text-transform: uppercase; }
        .sidebar-logo .logo-sub { font-size: 0.65rem; color: var(--accent); }
        .sidebar-nav { list-style: none; padding: 4px 10px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .sidebar-nav li a {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .sidebar-nav li a:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border-color); }
        .sidebar-nav li a.active {
          background: var(--accent-bg);
          color: var(--accent);
          border-color: var(--accent);
          box-shadow: inset 3px 0 0 var(--accent);
        }
        .sidebar-footer {
          padding: 14px 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--text-tertiary);
        }
        .home-nav-item { margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
        .main-content { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; min-width: 0; }
        .top-header {
          height: var(--header-height);
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          flex-shrink: 0;
        }
        .hamburger-btn {
          display: none;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-accent);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-size: 1.4rem;
          cursor: pointer;
          justify-content: center;
          align-items: center;
        }
        .hamburger-btn:hover { border-color: var(--accent); color: var(--accent); }
        .breadcrumb { font-size: 0.75rem; color: var(--text-tertiary); display: flex; gap: 6px; }
        .breadcrumb span { color: var(--accent); }
        .page-title { font-weight: 600; font-size: 1rem; text-transform: uppercase; }
        .search-filter-area {
          padding: 12px 16px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .search-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .search-input-wrap { flex: 1; min-width: 180px; position: relative; }
        .search-input-wrap input {
          width: 100%;
          padding: 8px 36px 8px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
        }
        .search-input-wrap input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(201, 162, 59, 0.3); }
        .search-input-wrap .search-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
        .btn-reset {
          padding: 6px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          text-transform: uppercase;
        }
        .btn-reset:hover { background: var(--bg-input); border-color: var(--accent); color: var(--text-primary); }
        .filter-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          padding-top: 10px;
          border-top: 1px dashed var(--border-color);
        }
        .filter-group { display: flex; flex-direction: column; gap: 4px; }
        .filter-group label { font-size: 0.6rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; }
        .filter-group select, .filter-group input {
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.75rem;
          outline: none;
        }
        .filter-group select:focus, .filter-group input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(201, 162, 59, 0.3); }
        .active-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--accent-bg);
          color: var(--accent);
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: 3px;
          border: 1px solid var(--accent);
        }
        .filter-chip .remove-chip { cursor: pointer; font-weight: 700; opacity: 0.7; }
        .results-info {
          padding: 6px 16px;
          font-size: 0.7rem;
          color: var(--text-tertiary);
          display: flex;
          justify-content: space-between;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
        }
        .grid-container {
          flex: 1;
          overflow: auto;
          padding: 20px;
          background: var(--bg-base);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
          gap: 16px;
        }
        .card {
          position: relative;
          aspect-ratio: 1 / 1;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          border-color: var(--accent);
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          background: var(--bg-elevated);
          padding: 14px;
        }
        .card-image-placeholder {
          width: 100%;
          height: 100%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 2rem;
        }
        .card-content {
          padding: 16px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .card-rarity {
          font-size: 0.7rem;
        }
        .card-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          flex-wrap: wrap;
        }
        .card-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin: 10px 0 12px;
        }
        .stat-pill {
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px 10px;
          min-width: 0;
        }
        .stat-pill span {
          display: block;
          font-size: 0.62rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }
        .stat-pill strong {
          display: block;
          font-size: 0.85rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-detail {
          font-size: 0.8rem;
          margin-bottom: 6px;
          color: var(--text-secondary);
        }
        .card-source {
          margin-top: 10px;
          font-size: 0.7rem;
          color: var(--text-tertiary);
          border-top: 1px solid var(--border-color);
          padding-top: 8px;
        }
        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        }
        .card-actions button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 1rem;
          transition: color 0.2s;
        }
        .card-actions button:hover { color: var(--accent); }
        .card-actions button.delete:hover { color: #b84c3b; }

        .thumbnail-actions {
          position: absolute;
          right: 8px;
          bottom: 8px;
          display: flex;
          gap: 6px;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.18s ease;
        }
        .card:hover .thumbnail-actions { opacity: 1; transform: translateY(0); }
        .thumbnail-actions button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.72);
          color: var(--text-primary);
          cursor: pointer;
        }
        .thumbnail-actions button:hover { border-color: var(--accent); color: var(--accent); }
        .thumbnail-actions button.upload-image:hover { border-color: #58d68d; color: #58d68d; }
        .thumbnail-actions button.delete:hover { border-color: #b84c3b; color: #ff7768; }
        .thumbnail-name {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          padding: 6px 116px 6px 8px;
          border-radius: var(--radius-md);
          background: rgba(0, 0, 0, 0.68);
          color: var(--text-primary);
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1.2;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.18s ease;
          pointer-events: none;
        }
        .card:hover .thumbnail-name { opacity: 1; transform: translateY(0); }
        .info-modal { max-width: 920px; }
        .info-header {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          align-items: start;
          margin-bottom: 18px;
        }
        .info-main-image, .info-main-placeholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          object-fit: contain;
          object-position: center;
          display: block;
          padding: 16px;
        }
        .info-main-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 2.5rem;
        }
        .info-title h2 { margin-bottom: 8px; }
        .info-subtitle { color: var(--text-tertiary); font-size: 0.85rem; }
        .info-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
        .info-section {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 14px;
        }
        .info-section h3 {
          color: var(--accent);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 10px;
        }
        .info-row {
          display: grid;
          grid-template-columns: minmax(95px, 0.7fr) 1.3fr;
          gap: 10px;
          padding: 8px 0;
          border-top: 1px solid var(--border-color);
          font-size: 0.82rem;
        }
        .info-row:first-of-type { border-top: none; }
        .info-row span { color: var(--text-tertiary); }
        .info-row strong { color: var(--text-primary); font-weight: 600; white-space: pre-wrap; word-break: break-word; }
        .info-effect-image {
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--text-tertiary);
          font-size: 0.8rem;
        }
        .info-effect-image img { max-width: 180px; border-radius: var(--radius-md); border: 1px solid var(--border-color); }

        .tag {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          border: 1px solid;
        }
        .tag-common { background: #1f1f1f; color: #a0a0a0; border-color: #3a3a3a; }
        .tag-uncommon { background: #1a2e1a; color: #6fbf6f; border-color: #2d4a2d; }
        .tag-rare { background: #1a2a3a; color: #6aa8d6; border-color: #2a3e5a; }
        .tag-epic { background: #2a1a3a; color: #b57ed6; border-color: #3a2a4a; }
        .tag-legendary { background: #3a2a0a; color: #e0b84c; border-color: #5a4a2a; }
        [data-theme="military-light"] .tag-common { background: #e2dfd3; color: #4a4d3a; border-color: #9a9b8a; }
        [data-theme="military-light"] .tag-uncommon { background: #d4ead4; color: #2d4a2d; border-color: #8aa98a; }
        [data-theme="military-light"] .tag-rare { background: #d4ddea; color: #1e364e; border-color: #8a9dae; }
        [data-theme="military-light"] .tag-epic { background: #e2d4ea; color: #3a2d4a; border-color: #ad9dbd; }
        [data-theme="military-light"] .tag-legendary { background: #f5edd4; color: #4a3d2a; border-color: #c9b87a; }
        .floating-add-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent);
          color: black;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s;
          z-index: 30;
        }
        .floating-add-btn:hover { transform: scale(1.05); }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal {
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 850px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 24px;
          border: 1px solid var(--accent);
        }
        .modal h2 { margin-bottom: 20px; color: var(--accent); font-size: 1.4rem; }
        .modal-form-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-field label {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.5px;
        }
        .modal input, .modal select, .modal textarea {
          width: 100%;
          padding: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          outline: none;
        }
        .modal input:focus, .modal select:focus, .modal textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(201, 162, 59, 0.2);
        }
        .modal-image-group {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .modal-image-group input { flex: 2; }
        .upload-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .upload-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
        .modal-buttons button {
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-buttons button:first-child {
          background: var(--accent);
          color: black;
          border: none;
        }
        .modal-buttons button:first-child:hover { opacity: 0.9; transform: translateY(-1px); }
        .modal-buttons button:last-child {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
        }
        .modal-buttons button:last-child:hover { border-color: var(--accent); color: var(--accent); }
        @media (max-width: 900px) {
          .hamburger-btn { display: flex; }
          .sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .filter-panel { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .top-header { padding: 0 10px; }
          .page-title { font-size: 0.85rem; }
          .btn-reset { padding: 4px 8px; font-size: 0.65rem; }
          .grid-container { padding: 12px; }
          .grid { grid-template-columns: 1fr; }
          .modal { padding: 16px; }
        }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <img
              src="/wtlo-logo.png"
              alt="WTLO Logo"
              onClick={() => window.location.reload()}
              title="Refresh"
              style={{
                width: 52, height: 52, objectFit: "contain",
                cursor: "pointer", borderRadius: "50%",
                transition: "opacity 0.2s, transform 0.2s",
                flexShrink: 0,
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            />
            <div><div className="logo-text">WTLO Wiki</div><div className="logo-sub">Database</div></div>
          </div>
          <div className="home-nav-item" style={{ padding: "4px 10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              <i className="fas fa-home"></i> Home
            </Link>
          </div>
          <ul className="sidebar-nav">
            {categories.map((cat) => (
              <li key={cat.key}>
                <a onClick={() => switchCategory(cat.key)} className={currentCategory === cat.key ? "active" : ""}>
                  <i className={`fas ${cat.icon}`} style={{ width: "20px" }}></i> {cat.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="sidebar-footer"><span>⚡ WTLO-DB 1.0</span><span>{clock}</span></div>
        </aside>

        <div className="main-content">
          <header className="top-header">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}><i className="fas fa-bars"></i></button>
            <span className="breadcrumb">WTLO <span>›</span> <span>{categories.find(c => c.key === currentCategory)?.label}</span></span>
            <span className="page-title">{categories.find(c => c.key === currentCategory)?.label} Database</span>
          </header>

          <div className="search-filter-area">
            <div className="search-row">
              <div className="search-input-wrap">
                <input id="global-search" type="text" placeholder="Search (Ctrl+K)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <span className="search-icon"><i className="fas fa-search"></i></span>
              </div>
              <button className="btn-reset" onClick={resetAllFilters}><i className="fas fa-undo-alt"></i> Reset</button>
              <button className="btn-reset" onClick={exportDatabaseToFile}><i className="fas fa-file-export"></i> Export React DB</button>
            </div>
            {!isGeneral && (
              <div className="active-filters">
                {getActiveFilters().map(f => <span key={f.id} className="filter-chip">{f.label} <span className="remove-chip" onClick={() => removeChip(f.id)}>×</span></span>)}
              </div>
            )}
            {!isGeneral && (
              <div className="filter-panel">
                {isWeapons ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={weaponTypeFilter} onChange={e => setWeaponTypeFilter(e.target.value)}><option value="">All</option>{availableTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Class</label>
                      <select value={weaponClassFilter} onChange={e => setWeaponClassFilter(e.target.value)}>
                        <option value="">All</option>
                        {weaponClassOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Caliber</label><select value={weaponCaliberFilter} onChange={e => setWeaponCaliberFilter(e.target.value)}><option value="">All</option>{caliberOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={weaponLevelFilter} onChange={e => setWeaponLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Vendor</label>
                      <select value={weaponVendorFilter} onChange={e => setWeaponVendorFilter(e.target.value)}>
                        <option value="">All</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={weaponPriceFilter} onChange={e => setWeaponPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;1500)</option><option value="High">High (≥1500)</option></select></div>
                    <div className="filter-group"><label>DMG</label><select value={weaponDMGFilter} onChange={e => setWeaponDMGFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;60)</option><option value="High">High (≥60)</option></select></div>
                    <div className="filter-group"><label>Mod</label><select value={weaponModFilter} onChange={e => setWeaponModFilter(e.target.value)}><option value="">All</option>{modLevelOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Parameter</label>
                      <select value={weaponParameterFilter} onChange={e => setWeaponParameterFilter(e.target.value)}>
                        <option value="">All</option>
                        {parametersStatOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="level">Level</option><option value="dmg">Damage</option><option value="priceValue">Price</option><option value="caliber">Caliber</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isAmmo ? (
                  <>
                    <div className="filter-group"><label>Caliber</label><select value={ammoCaliberFilter} onChange={e => setAmmoCaliberFilter(e.target.value)}><option value="">All</option>{caliberOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Vendor</label><select value={ammoVendorFilter} onChange={e => setAmmoVendorFilter(e.target.value)}><option value="">All</option>{vendorOptions.map(v => <option key={v}>{v}</option>)}</select></div>
                    <div className="filter-group"><label>Price</label><select value={ammoPriceFilter} onChange={e => setAmmoPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;500)</option><option value="High">High (≥500)</option></select></div>
                    <div className="filter-group"><label>DMG</label><select value={ammoDMGFilter} onChange={e => setAmmoDMGFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;40)</option><option value="High">High (≥40)</option></select></div>
                    <div className="filter-group"><label>Ammo Type</label><select value={ammoAmmoTypeFilter} onChange={e => setAmmoAmmoTypeFilter(e.target.value)}><option value="">All</option>{ammoComparisonOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="dmg">Damage</option><option value="priceValue">Price</option><option value="caliber">Caliber</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isPremium ? (
                  <>
                    <div className="filter-group"><label>Item name</label><input value={premiumNameFilter} onChange={e => setPremiumNameFilter(e.target.value)} placeholder="Search premium item name" /></div>
                    <div className="filter-group"><label>Item Type</label><select value={premiumTypeFilter} onChange={e => setPremiumTypeFilter(e.target.value)}><option value="">All</option>{availableTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Price</label><select value={premiumPriceFilter} onChange={e => setPremiumPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low Price (&lt;1000)</option><option value="High">High Price (≥1000)</option></select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField === "priceValue" ? (sortDirection === "desc" ? "priceHigh" : "priceLow") : (sortField || "")} onChange={e => { const value = e.target.value; if (value === "priceLow") { setSortField("priceValue"); setSortDirection("asc"); } else if (value === "priceHigh") { setSortField("priceValue"); setSortDirection("desc"); } else { setSortField(value || null); } }}><option value="priceLow">Price Low → High</option><option value="priceHigh">Price High → Low</option><option value="name">Item Name</option><option value="type">Item Type</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isItems ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={itemsTypeFilter} onChange={e => setItemsTypeFilter(e.target.value)}><option value="">All</option>{itemTypeOptions.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={itemsLevelFilter} onChange={e => setItemsLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={itemsPriceFilter} onChange={e => setItemsPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;1000)</option><option value="High">High (≥1000)</option></select></div>
                    <div className="filter-group"><label>Location</label>
                      <select value={itemsLocationFilter} onChange={e => setItemsLocationFilter(e.target.value)}>
                        <option value="">All</option>
                        {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Weight</label><input type="text" placeholder="Weight contains..." value={itemsWeightFilter} onChange={e => setItemsWeightFilter(e.target.value)} /></div>
                    <div className="filter-group"><label>Vendor</label>
                      <select value={itemsVendorFilter} onChange={e => setItemsVendorFilter(e.target.value)}>
                        <option value="">All</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option><option value="level">Level</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isArmor ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={armorTypeFilter} onChange={e => setArmorTypeFilter(e.target.value)}><option value="">All</option>{availableTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={armorLevelFilter} onChange={e => setArmorLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={armorPriceFilter} onChange={e => setArmorPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;2000)</option><option value="High">High (≥2000)</option></select></div>
                    <div className="filter-group"><label>Location</label>
                      <select value={armorLocationFilter} onChange={e => setArmorLocationFilter(e.target.value)}>
                        <option value="">All</option>
                        {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Modification</label><select value={armorModificationFilter} onChange={e => setArmorModificationFilter(e.target.value)}><option value="">All</option>{armorModificationOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Class</label><select value={armorClassFilter} onChange={e => setArmorClassFilter(e.target.value)}><option value="">All</option>{armorClassOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Vendor</label>
                      <select value={armorVendorFilter} onChange={e => setArmorVendorFilter(e.target.value)}>
                        <option value="">All</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isMedicine ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={medicineTypeFilter} onChange={e => setMedicineTypeFilter(e.target.value)}><option value="">All</option>{availableTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={medicineLevelFilter} onChange={e => setMedicineLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={medicinePriceFilter} onChange={e => setMedicinePriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;500)</option><option value="High">High (≥500)</option></select></div>
                    <div className="filter-group"><label>Location</label>
                      <select value={medicineLocationFilter} onChange={e => setMedicineLocationFilter(e.target.value)}>
                        <option value="">All</option>
                        {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Vendor</label>
                      <select value={medicineVendorFilter} onChange={e => setMedicineVendorFilter(e.target.value)}>
                        <option value="">All</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isCrafting ? (
                  <>
                    <div className="filter-group"><label>Station</label><select value={craftingStationFilter} onChange={e => setCraftingStationFilter(e.target.value)}><option value="">All</option>{craftingStationOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Type</label><select value={craftingTypeFilter} onChange={e => setCraftingTypeFilter(e.target.value)}><option value="">All</option>{itemTypeOptions.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={craftingLevelFilter} onChange={e => setCraftingLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={craftingPriceFilter} onChange={e => setCraftingPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;800)</option><option value="High">High (≥800)</option></select></div>
                    <div className="filter-group"><label>Location</label>
                      <select value={craftingLocationFilter} onChange={e => setCraftingLocationFilter(e.target.value)}>
                        <option value="">All</option>
                        {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Vendor</label>
                      <select value={craftingVendorFilter} onChange={e => setCraftingVendorFilter(e.target.value)}>
                        <option value="">All</option>
                        {vendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isAchievements ? (
                  <>
                    <div className="filter-group"><label>Rarity</label><select value={achievementsRarityFilter} onChange={e => setAchievementsRarityFilter(e.target.value)}><option value="">All</option>{achievementRarityOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : (
                  <>
                    {currentCategory === "guides" && (
                      <div className="filter-group"><label>Difficulty</label><select value={guideDifficultyFilter} onChange={e => setGuideDifficultyFilter(e.target.value)}><option value="">All</option>{difficultyOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    )}
                    {currentCategory === "bestiary" && (
                      <div className="filter-group"><label>Difficulty</label><select value={bestiaryDifficultyFilter} onChange={e => setBestiaryDifficultyFilter(e.target.value)}><option value="">All</option>{difficultyOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    )}
                    {currentCategory === "characters" && (
                      <div className="filter-group"><label>Body Part</label><select value={characterPartFilter} onChange={e => setCharacterPartFilter(e.target.value)}><option value="">All</option>{characterPartOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    )}
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option><option value="level">Level</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                )}
              </div>
            )}
            {isGeneral && (
              <div className="filter-panel">
                <div className="filter-group"><label>No filters available</label><div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", padding: "6px 0" }}>General info has no specific filters</div></div>
              </div>
            )}
          </div>

          <div className="results-info"><span>Results: <strong>{filteredAndSortedData.length}</strong></span><span>{sortField ? `Sorted by ${sortField} ${sortDirection === "asc" ? "↑" : "↓"}` : ((isWeapons || isAmmo || isArmor || isMedicine || isPremium) ? "Sorted by price ↑" : "")}</span></div>

          {canQuickUploadImage && (
            <input
              ref={quickImageUploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleQuickImageUpload}
              style={{ display: "none" }}
            />
          )}

          <div className="grid-container">
            {filteredAndSortedData.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><i className="fas fa-database" style={{ fontSize: "3rem", marginBottom: 12 }}></i><p>No entries. Click the + button to add one.</p></div>
            ) : (
              <div className="grid">
                {filteredAndSortedData.map((item, idx) => (
                  <div key={idx} className="card" title={item.name || "Open item information"} onClick={() => openInfoModal(item)}>
                    <ProjectImage
                      item={item}
                      category={currentCategory}
                      className="card-image"
                      placeholderClassName="card-image-placeholder"
                    />
                    <div className="thumbnail-name">{item.name || "Unnamed Item"}</div>
                    <div className="thumbnail-actions">
                      {canQuickUploadImage && (
                        <button aria-label="Upload item image" title="Upload image" className="upload-image" onClick={(e) => openQuickImageUpload(item, e)}><i className="fas fa-upload"></i></button>
                      )}
                      <button aria-label="Edit item" onClick={(e) => { e.stopPropagation(); openEditModal(idx); }}><i className="fas fa-edit"></i></button>
                      <button aria-label="Delete item" className="delete" onClick={(e) => { e.stopPropagation(); deleteItem(idx); }}><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button className="floating-add-btn" onClick={openAddModal}><i className="fas fa-plus"></i></button>


      {selectedInfoItem && (
        <div className="modal-overlay" onClick={() => setSelectedInfoItem(null)}>
          <div className="modal info-modal" onClick={e => e.stopPropagation()}>
            <div className="info-header">
              <ProjectImage
                item={selectedInfoItem}
                category={currentCategory}
                className="info-main-image"
                placeholderClassName="info-main-placeholder"
              />
              <div className="info-title">
                <h2><i className="fas fa-circle-info"></i> {selectedInfoItem.name || "Unnamed Item"}</h2>
                <div className="info-subtitle">Important information for this listing.</div>
              </div>
            </div>
            <div className="info-sections">
              {renderInfoDetails(selectedInfoItem)}
            </div>
            <div className="modal-buttons">
              <button onClick={() => openEditModalForItem(selectedInfoItem)}><i className="fas fa-edit"></i> Edit</button>
              <button className="delete" onClick={() => deleteItemByReference(selectedInfoItem)}><i className="fas fa-trash-alt"></i> Delete</button>
              <button onClick={() => setSelectedInfoItem(null)}><i className="fas fa-times"></i> Close</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2><i className="fas fa-plus-circle"></i> Value Adder 1.0 — {editingIndex !== null ? "Edit Item" : "Add New Item"} ({categories.find(c => c.key === currentCategory)?.label})</h2>
            {renderModalFields()}
            <div className="modal-buttons">
              <button onClick={saveItem}><i className="fas fa-save"></i> Save</button>
              <button onClick={() => setIsModalOpen(false)}><i className="fas fa-times"></i> Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}