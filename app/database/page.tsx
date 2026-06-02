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
  earnedImageUrl?: string;
  earnedImageDesc?: string;
  achievementValue?: number;
  achievementHidden?: boolean;
  statisticsParameterID?: number;
  achievementOrder?: number;
  rawAchievementId?: number | string;
  guideDifficulty?: string;
  bestiaryDifficulty?: string;
  characterPart?: string;
  itemParameters?: string;
  armorClass?: string;
  armorParameters?: string;
  craftingStation?: string;
  craftingModule?: string;
  requiredImageFolder?: string;
  resultImageFolder?: string;
  craftingRequiredImages?: Array<{ name: string; imageUrl?: string; imageDesc?: string; quantity?: string; type?: string; method?: string; }>;
  craftingResultImages?: Array<{ name: string; imageUrl?: string; imageDesc?: string; quantity?: string; type?: string; method?: string; }>;
  craftingRecipeOrder?: number;
  craftingNotes?: string[];
  achievementDifficulty?: string;
  
  weight?: string;
  dropChance?: number;
  basePriceTokens?: number;
  sellingPriceTokens?: number;
  craftExperience?: number;
  survivalExperience?: number;
  experience?: number;
  weaponAttachmentRecoilMultiplier?: number;
  weaponAttachmentDamageMultiplier?: number;
  weaponAttachmentAccuracyMultiplier?: number;
  
  critChance?: number;
  effectiveRange?: number;
  magazine?: number;
  moa?: number;
  modLevel?: string;
  ammoComparisonType?: string;
  
  ammoType?: string;
  apPiercing?: string;
  apPiercingMin?: number;
  apPiercingMax?: number;
  
  modification?: "M0" | "M2" | "M4";
  
  effectImageUrl?: string;
  
  achievementRarity?: AchievementRarity;
  
  rarity?: string;
  rawWeaponId?: number | string;
  damageDisplay?: string;
  projectileType?: string;
  projectileCount?: number;
  initialVelocity?: number;
  destroyVelocity?: number;
  pvpDamageMultiplier?: number;
  pveDamageMultiplier?: number;
  robotDamageMultiplier?: number;
  pvpArmorPiercingMultiplier?: number;
  pveArmorPiercingMultiplier?: number;
  robotArmorPiercingMultiplier?: number;
  conditionDeltaMultiplier?: number;
  spawnTracer?: boolean;
  spawnTracerChance?: number;
  rawAmmoId?: number | string;
  premiumCategory?: string;
  rawMedicineId?: number | string;
  totalDuration?: number;
  medicineEffects?: string[];
  characterEffects?: string[];
  canBeUnited?: boolean;
  canBeTakenIntoAccountInventory?: boolean;
  accountInventory?: string | boolean;
  premiumOnly?: boolean;
  weaponSkins?: Array<{
    name: string;
    displayName?: string;
    type?: string;
    imageUrl?: string;
    imageDesc?: string;
    detail?: string;
    rawWeaponId?: number | string;
    premiumCategory?: string;
  }>;

  armorMin?: number;
  armorMax?: number;
  armorDisplay?: string;
  haveFrontPlate?: boolean;
  acceptableFrontPlates?: number[];
  frontPlates?: string;
  haveBackPlate?: boolean;
  acceptableBackPlates?: number[];
  backPlates?: string;
  monsterArmorMultiplier?: number;
  condition?: number;
  conditionDelta?: number;
  coverArms?: boolean;
  armsArmorMultiplier?: number;
  hidesBackpackStraps?: boolean;
  hidesBackpack?: boolean;
  replaceBodyPart?: boolean;
  needLongPants?: boolean;
  torsoMeshVariant?: string;
  faction?: string;
  factionTechnologiesLevel?: number;
  minRepairExperience?: number;
  canBeCustomized?: boolean;
  canBeCamouflaged?: boolean;
  canBePlacedOnCommission?: boolean;
  canBeViewedThroughPreviewMeshesList?: boolean;
  canTransferToSteam?: boolean;
  steamMarketID?: number;
  itemPickupClass?: string;
  maleCharacterBodyMesh?: string;
  femaleCharacterBodyMesh?: string;
  characterClothesPreviewMesh?: string;
  rawArmorId?: number | string;

  rawMonsterId?: number | string;
  minLevel?: number;
  maxLevel?: number;
  health?: number;
  healthPerLevel?: number;
  regeneration?: string;
  regenerateHealthDelay?: number;
  regenerateHealthRate?: number;
  minRegenerationDamageThreshold?: number;
  dangerLevelMultiplier?: number;
  experienceForKill?: number;
  massInKg?: number;
  armorSummary?: string;
  armorPerLevelSummary?: string;
  headArmor?: number;
  bodyArmor?: number;
  armsArmor?: number;
  legsArmor?: number;
  feetArmor?: number;
  causingEffects?: string[];
}

// ==================== LOCAL REACT DATABASE STORAGE ====================
// The database is now loaded from /data/wtlo-database-data.ts instead of JSON.
// Image paths are saved into the local React data file through the Next.js API route.
// Project/public category folders work too, for example: public/db-assets/weapons/ak.png => /db-assets/weapons/ak.png
const INITIAL_DATABASE: Record<CategoryKey, BaseItem[]> = WTLO_DATABASE_DATA as unknown as Record<CategoryKey, BaseItem[]>;

const DEFAULT_PUBLIC_IMAGE_ROOT = "/db-assets";
const TOKEN_ICON_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAAAjCAYAAADPPrcpAAAABHNCSVQICAgIfAhkiAAAFzVJREFUaIGFmntc1HXWx9/zG2aAgWEGRkYuMgiIAgreUDDCKE2sNbWlLDWv2bqt1bO22tp2f1q33Wyz0nK1R2s1a9VMTcxLmhe8p6IoCqLoIPf7cBnmwsw8fxzI3Wcvz+/1mtf4Gn6/8/2e8/2cz+ec81P11SIVvZfdCZkDIMgfFn8JU4ZDvBn2X4b4cCi4Dp8d9QKYsVfEo7O0A8V8HYXL3op23FYITQvE0dBN2Ej3zsUKfmo4dwssYZB/Cb5ZsxhG/hmazqZiGh0I3KSttMm6IZnYjPmQ/j7UHwskelIXgOPzAL484cJsgA/3w4dPwbcXIDgAzpbDxhfC4fE6aL2cQkiSHkVTAdRUfaQQPSwPxqyHph91RIzrAnz8h8vvP/3R5YGmDii0MmhUPANzkphRu1qJL7QSW1xF3wANrhgTN5xuGiONbM02L89n4ikrOgsAxVUw1ALXawgwBJIydQSTi/avfCDw8Mrw/IskAJpIIzUaNXfMIVzynNqwKX7IsoLeQAB0drnw14BaBd0ecLqhrA4lKpRhuak8cLq4YVJklWLaXUii24O/KZiGkEBuGXVcbz6xfVNq0gvfEzHO/p/87L1U/w4Zj62CWVk8+MKjlrmdzVXTg56qVmErgdMLIfweqNzN5RsNbDkDp2+AvwayB9LxaDofDVrq/ZNns74t/tedYaUrtM+73e5p+jFvpzDkd3DscXC1gp+Opmu7+b4Y/nYaGjtgTALE9uHwc0veeofU176n5gCHV03E4QZbFyz/lqB9S3g2NNjvSV3y7JGM+R84sxBaikCfSOuVLzhaCl+ehKpWSO0HCWbOLPnFI38iZ9cOag7A8VlUVDdg+S/v/x+M9DioacUQGsza0c/se4LICdB6GWoPg6MBnPXgbIaw4WAcDH3vh9LVHPziVd7cCYW34XeTKXxunG+bYdgvnmXEihgULVi3gr0SXDboKIfACOiTCaZ0UKnp3JrMsi0eNp2AGBN88wKrE5d4f3vubcVeaAVzCLlTsi2fMLkkHnUAWLdBp1X21FEO/mEQniV7CrLg+Tqet7/pZM0hCNDAunlsyn3t+hKu/LG+9vwGIp77F8FYv0CCoVaguRNSoojJnZR3iLHbErFuo3TrE9S0Qq0N2h0C0w6H3B8VCglmyHzwKcjaCGcW8uCCTzl4xYeljwrrd4ug6RwnTp6hxQ71Nuj2QlsXOLshLEgcvz9ZTdC0awAcfmcgD7wjqf3Gz1Vn3nwy/IWD5xvmj1+wdiEDnoH8YZw4W0RbF9S3iZ1ee4ZAsTcmAcyPH4XQoZR+YGToK+B0+5hxj6pq86ql9/pK/3JbNd32z8E49YYKRRFUWBuJmPPcWycIio2ndDUkzCF/3fP8UAxD+oHdBTqtBKK+DTxe8PjAZofHRsPo39aBfzgvT1b4424fcWYVmxYKd9jsYNDJogEaccDWBf5+YstigufmPQI5u2hdqzDot1Bv8/H+TFXl4mW/70fZOoibBbUHWbrqDH0NEBIoewjyh06nrKFWoKEdIo2w+PFEmFIKO/oT/8sKbtX7yButKvlyUcAk7Wz7zX8KRuWHKjw+aGqH4Q8v3U+wZQIXXgE/HZt/qKW+DTqcEnVziCyuVgQhLg9o1bK4rUt+f/N5cWj1HIWV+2WR/5ogzta3ycZ7L6e7x1Y31LVBexc8PBRylnvh2OOkPrUdpxtyU2HV8kVYT3zMrgt31zaHgD7g7p7aHbIfl0fWstkhIwHyPvSCdRspWU9wrcrH8P6qOxdueXOA8n8Ihu/wZOi2Q9rrc9EaP+P4LFqrilj+rdzws2GQlRTI0eIuyuogNEh+//sN9DrmcEN5A3w8X49quo2dixVe+htUtcDXz99FkVoBV7cgpKPnebtLvq2NMDASnvkfL1z/mPE/f56jJTAtA3KS5dDmj5V78y+Cnxq0frIfjRq6XPJvZ7d8V7WAKRiWbLKDs56JY/qzv8jH7x9X3Xxlq3cI4LgbjOIV0CfDiDn7Njv6G6ruVPDWTpgxBnJy84ToYqZStfVBtp+DCIM4rfUTrW/uEIiagiFcL7yz/zKs+1UEPFbNmnkK7+0VZv/NQ7K53uAZg0QumzvlN0uYBOrUTQjUwJIvvXBoImMXHeDUDTjyO8ia8QF4XdBVw9bPV/60l39lr1+oBOhyJdS0wrv5XijfyP2T5nLkmo8fXlZ9cf8fvLN6g6EQmgZ9Mn/D+d8YPPYmVh+EZZMgZ84qUKmFrYtXUGMDo04223sSTrecgFqRQIAUZzPGwK/W1sLV93j249sk9oXj12H7j1LEgZyo0w1uj5xmuB50/iLRU0eIUzsXKzBuHy8/ImS94jtERrtqcF/9C/4asaVR/7M9Q6Aclp8axqVImn40W4H42axfAMnRKhZ+xlPAA/8YjE7rQ/ZLq/jiWCd5oyD+iW+hrgC6asDZRFXxAdJHZfwUhACNoMHhFif8/aCiST5Xq4U/hllg5R9eAp2FPS8FEWmEA1ckl0N7iLSpQ2yZggVh5fVwq+FusXbiOnBoIg+t8DJ+MHx/Bf62eQPUF6AJNDB+sJpWuwRQrfyjPVuX2KtoEmT0D4fKZnBvCiL+RS9TRghaXpqkrAbA3YZCQMQAavYPcbm7AUgfmgTlX0D0w9DvEU4cO0R0bCLo+tHSeTffPV7J80CNwNPjBZNeCLLbI/dcrwXPZj3qme1MGiYKcu4WhAbLsx6v3BdllOAEaiEsWBxqaAeVClZ+dgCA9YsTCQ2C9UehvvwcjPgj1S0eXN09nOMUew43RIcKkfprxF6Qv3CTvwaW75Ti9p3XFhEdCnuLSObW5ofQhKAAsTib/Y+WCmtjybtbFN3YIFA0Z+O2fvcTArw+QYO/Hzi6xXk/tWzKqJPTTewr5PvqFkngd155huQoqVab2uXe3hNtc0iKAARpxaG2LpiVBXeawPeVAaaU8tLPhGDL6gB7paSEW1Dl1+O8ohL1C9TetQeCgumZErDy9xUYtYo/PiHrHFw760VJEzDRYUWrhoh7lkqFqTFA4xmIHIc5BHDb0Ix6B1MPQUaHysfXow4er/BITatsNCkKcn/5OZMWbQLAtlYFGWvJHCBQvtMMGfGS1za75LiiEmhXNEFjOywcH0jqy14W5MDrWyV687JVGINg1wVAn0hKUiLtPZJuMUkR1+H4O4Vyir3KZpidBSm/9bJkoo/39gIeB1PHpRFjgs2nuI/2GxaF+oJkbMXydEA4GAaDvQo8LlzX1ktkm36EwEhS+4nTJTWCiECtQNrrkxPMTID0/pAWg5THHeXMHwtrfpAqd8IQSYvqVgmq1k8QoVFLILRqmDrCR78w0KT8Ei6/TcqYPHw+oOBJ9JlvEhIg8k3tQUh8hrhw4aGKJkFHr70Oh5D7z9NVxJjAlPwIXH0PQ9rTWMKAb2Jh2FtEGOBOExrH9iFTFMzZA3E2U9MKv37xJbixAe7/FtRanE4npoRsmmor4MJS/NTQJ1hOtM4mJxIdKoQXqIXUed8TFtxDzZ1WaCsjcXQeti7g+sdkZ2WQkSCsb20UXogwiAJcuA1zfpaEIeNVeV7lB/UnoE8GualweO9WSJhD3ihJz9N7P4XK3cSHCyLUClS3QN8QCcq52zD7XjX68RtRK9xFuz6evFGw+XAD9MlgeiaE6ECj0SQqgK6+sgyDThyb+U4R+W8NBHcHHq+P0ycLhDTb6wnVqdBpYdqDSUzPVFFWCzfqRLoWjg+EthJsdrBER0gz11UDXhdhQQgpj92CoaeEnpOXjSEQCq1ykssmAXHTwbqVWBOgiwZPF3TVYA6RgKOzMHm48ERLJ6A14q8RuZ45az5RoXD+tgR7cS4EDZkP5Zsk1UPTwN0OnVbCgnrQFRDB1NFBeL1QbO0cq1B7yGWOTaO5U7Q8Jxl+KIY3l6/gciWkxqgxDnqEw1cc6GPvZc7c+Rw5U4JOpyMpShg/JzsDTf9HoGIn0aGAOQtai6GzAoxppMVA0YUz0FyIKVjKaGwlZA4QEGQmQOyIPHDU42ixkhYXJMgCcDQwKC6CWhtwazNB/hBthPAQaLq2m5ynPyclCq4e28B9gyT1hvSDxNF54PXgri5gWP8AqZcAumoxJY7D7gQuvoZaqyPSCIFaBigEmMuJysXpFlXQB0h/APDVaVCpVNjL98oPpnRQ1HS5YPe5TqY+mkdKNJw9e4Yj+7aCvwlT7udyAsbB4HWCXyAG3V0FyBoosF6d34AlKpxnx2u5Vg2Fx7ZTf/ZjAibuQR2RJWmiaAUdwbGy/p2dGE0RpFkkrbR+KvA6MYYEcbAYNH5qXng4hDtNUHR8O2UnNqAZvwNt3GTwdYNGL61HYKSo5K1NEJrGqDg4WYa/gjH1NM4mHO678ljRJOVzViI8v7Gbsze7yX3xeyqOr2TjZ59yzwAfrm5wlO+mwwEl1ZCZqIW+2XDpdTy1JyAkCZytgHSQVS2iAFUtQsBeH5RZG3C73VytFlk0p02D6gM0XZfaAn28ICz8HlEIdztojVy4DTFhoI97gL1rF/JjWSeThsGF2x7sdjultdKsJQ4bBy1F2K5ukTlKSBK0l4EpnW4PeOxNEBhJSQ2U1OBSgGrctp86Ubir+Ro1JEUK02McTIxZT6cTiipV6PzherWLnOERJEWBx+ORBftkysmWrYPEp8GUTl2bVIV0SRfcahfCLa0FvV7PzDE9HOAn7GsaMg0aT0N3FwxZBvYqqRs0etw2K5XNUmoTP4tALdxulElZTSv4+fkxL1slwdMawdOFIfmxHkIvgcFLwW1DpQK1zgRtJTS0Q6sdhwJcImpCaaRRpMjulCA4eoY4ydFCcvYvLagyP2HycLhWLTPJtJ9/gK2phppWsDZ6qDj0Kvg8MHarEFbVXjgxl9M3pA7AXilBQZAyaWwSxEzmcqUgxXpmA46iD2HQIhi5QvqQG+spPLoVQyCgUuPz+QgNgmOlgKOenOwM4s1Sqk8dFYB2yPMU3fHh80H5ue3YTr4O8U9BxhoJSPkXWA+9gdYP0BjB3YEhEFQqGhXARdysfcNjheV7mx+PV4Yx0UZJmR3nusHnIXpgBjFhcs+5bb9GURSmTM2jb4j0AmVnt8PFVyBshAQmwExuao9drQG1IgOilCg4d6mEq8e/IGdMGtnpidS1wY83XXBqAbQJnH1NFxk+2EKksUdhEPksqgDXuddhxLtEGCRtLpQ7KNq3gqyRidyfnY7NDoUVKnwFs6HuMJiz8bVcJXZAmihWYAT4PL3d7lkFRy2oAzYNGvsMLXZpwHpnBMH+4PbCwIgeKarYDgOfxaSX+qChDfT9RlLw/XaqWkSaDxZD+8VPQBMMWgOk/5mB/fQMjlZDdxclNVIkJUfJMCfKCI7GEvILyrCEyd/yC8rAVgJaAyrLFBj639Lthg7FWu+gsUOQdqLEAaFDCdWpSI8TJBt04LPXkn/oHOYQqW6/Od0ODWfA34QqMgfS/0yCWVSvs7GcOhtcraZCISAC4DwZawsmDRUy9PkkVVrskjZqRYqtwuO7wV5Jn2AJ2EP3JnK44ByXKoQT8i8K/N/9zof160ch7XUwj+X41XaCwqKhYjtHr8E9iTKyGzNQi8ZPzeoDLhL7wpVKaeQOXoGt65dLJZy1Ea6vET7zOsm/KNVubqoQMXsz0cfei90lw+woUyAf7GnHHCJl/7FS6X4/Xb8BqvdD9hao+o7GDkAdyLESD+dvYwe+VSjfCCUfgaP29eFzd2DSCxGBlNpOtyzev4+cGu3lPzVIRE0AZAh7ogziwqVBiwmT/iF/5WQ6P9NRXg+Yx0JXDR1Oub+tCwKiMlCpVJh7UqyxQxwaFCk9zJoNW2lao3D69BlCdJLjvbNXU7BM3SpulYCipdYGRrMFTUAwpmBpBm83ir2kKDngj74owLpKx+UDKwnwA4JiqWmFDgcdKVGcUZr2z6X+0K9p/WvUEfpN2bV0UgC3GqSBUqnEaYNOytsYE+BvoqVTplKtFz7G4ZbO0O0RB10e6GuA2D5w5iYs2+LB2Q1kbeT0pQpqWuGBZJX0G51Wzt/qxmK6Oz602QU1iX17Zqo7YPNJGJ2ZDeEZ7LogpG7rgtsNYBkyARp/JNgf8Lg4e62BmLC7Y0SbXQ41PlzaiJX7YM0PMH5oEMQ+zpenIMHMnvuSQDEtaMX8i1aMc+sA5mofLWqfliEoKKuVgMSHi/MpaelwZycxYRDkr2LPJeEJEGkM10tBZbNL/g4wi4TeO1DumbEGpo2G4OBg4sJVFF2roLnz7jDG1S32uj2CEj8F0iziDBOOUvRBf65V+VicKyf9wGAgJJGKujZG9ldRequW8nqppDsckuIWk9zb2CGIGt5Tv6kfK4e/GTlU7OP9GayeOWs+Cu5WcLdKjWCvaEU/YF76gn0/NVxTFrxLix0G9BUps94qw+6Cti4fdpcQq9sDffSCivhwIUWNWhZvaJfW2bZWRXMH/GlGIDeq2uly+WjqgNZOsDZJid47Vx0UKQEw6ETWl02SvYz5b/j6BRWJT31PQzsM6edHZ9FfaO0EV7ePxnZBWEmNDJr8NfJJjhZ7wQHCS9NGA/7hjHm9jUGRqjU36riwYcMGVL7eHsDTgyv9AIB5XH57w+X8NwgJFLhnJcrESIUPHyqaO0Ui69vk4+iWdAnUyqk0dsDnBbDlVz4MC31EhSm8PwOeHGeh6k6F1DLdUq8UVoBGEeUyh4C7W54/dwuu18CW016OvKLw8jY4/kYQJ0s65ZQt8rLJ2a1C6yfo8lPEXoAfdLpEhj1eEYNrVXCkBPYUenF8HkDgPGfp3LGqpME9aafwr6/PSH1tdmruUjaekBnijvMCY0PcWIyjltLYIXlp0MnGNQoEBUiKVLVIIKaNBsNCH69OVTAFS22Bxkj08GmYzeEUV0JosB8dDglEqE4Iu6FdJmLHS2HLntNw5Q/MWcf1U3+dv0dRFLaekUDlX1JhiEzGnJqHMS6by5VgDFLT7ZFpV1jQXXQWWmFXIexZtwgctYx63eWalqF6wtUNP5bDzTpQv/nKYnHf55Fv/7DegBQR+WDRfWPvHd+nfpNu90WRKrO6AupPcrAYsgaq0aq9FFbI8KahHS7dgfxCeDIT5n/qpeojhbJaeGgo7L0EbnsdFk0ZBcXt2N2QmpxAVW0zLZ0C8aoW+O6SpM6BA/vAPJaopPuu9w/nsfmvfPmBKv0988NRp0adu3yTQis4OhqJ1Vzn4rXbVLfAyLQBNDQ2U2eTw6pqgR+uwqUKOPLXRTBqFUMTQuoGRDDj4TSOX6mU+YhK9e+R0ZM6jh0EmFPTfuf9Zt2ybAw6eHsX/OqvUq57vV4MWcsBie7REuGAg8sTmf+pl/L3lZL+LzJx6VfeOTM/8bqmZch44MnVLvYWiVqQMIeMBLhoFTScugHTxwiUiZzgS4hQVte0+IabQ7jc09YvYty+GS987mxfnCspPGuth03He4g2agL3pui5Uglnb8LJMnggBQ5e8cKoVfxsuLKxqMKX2t/Edx1OcVPV8+7933GGXF63vD2Pmyk84m5byolZybu+3U1Tu5DnpGHCJW1dMDJeS8DMetCEXPNs1n+a+GLnJ21dOBsb6sA/fDiwFOu26eXbn6CgFCpbINIA44cINwyMBMs9i2DUKi/tNza+OXfgut/v5JTH62PKSBU7dwtScLdCQEQisISaA79o/XYiuy4IMgM0MHmEwL5fGCSmy+tO4Ot1TytrF2/moN3pY/FEGQceLbn7yvM//mcVQMpqAGfDZ/iHbyFn1+NTcphG09kYHPWJ2EoU+mQ0Ys4uAe5gr/iKo3kFp0s77X0NkrN4ugAK8bpnEJX7bvyL3kXxkEhVfgqd1lD89F2W+Nk3gGq87iOc/8321nMrb8X1kdcQvdP0/3OV4WxYSJ/MlcaF3oVzIJWq/BSczeF0t7ssCU/fRB1Qhdd9istvb3MVvnPNqBPVq3BKY/h/r/8FXytTHwKc4yYAAAAASUVORK5CYII=";


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
  // These names must match folders inside public/db-assets.
  const folderMap: Partial<Record<CategoryKey, string>> = {
    Items: "items",
    weapons: "weapons",
    ammo: "ammo",
    armor: "armor",
    medicine: "Medicine",
    premium: "Premium",
    crafting: "Crafting Recipes",
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

const PREMIUM_FOLDER_ALIASES: Record<string, string[]> = {
  ammo: ["Ammo"],
  armor: ["Armor"],
  attachment: ["Attachments", "Weapon Attachments", "WeaponAttachment"],
  attachments: ["Attachments", "Weapon Attachments", "WeaponAttachment"],
  "weapon attachment": ["Attachments", "Weapon Attachments", "WeaponAttachment"],
  weaponattachment: ["Attachments", "Weapon Attachments", "WeaponAttachment"],
  weapon: ["Weapons", "Weapon"],
  weapons: ["Weapons", "Weapon"],
  bandana: ["Bandanas", "Bandana"],
  bandanas: ["Bandanas", "Bandana"],
  document: ["Document"],
  food: ["Food"],
  "gas mask": ["Gas Masks", "GasMask"],
  "gas masks": ["Gas Masks", "GasMask"],
  mask: ["Masks"],
  masks: ["Masks"],
  medicine: ["Medicine"],
  stimulator: ["Medicine"],
  paint: ["Paints", "WeaponSprayCan"],
  paints: ["Paints", "WeaponSprayCan"],
  weaponspraycan: ["Paints", "WeaponSprayCan"],
  "repair kit": ["Repair kits", "Repair kit", "Repair Kit"],
  "repair kits": ["Repair kits", "Repair kit", "Repair Kit"],
  vehicle: ["Vehicles", "Vehicle"],
  vehicles: ["Vehicles", "Vehicle"],
};

const getPremiumImageFolderAliases = (item: BaseItem) => {
  const premiumType = getPremiumItemType(item);
  const rawFolders = [premiumType, item.premiumCategory, item.type]
    .filter((value): value is string => Boolean(value && String(value).trim()));

  const aliases = rawFolders.flatMap((folder) => {
    const normalized = String(folder).trim();
    const normalizedKey = normalizeFilterText(normalized);
    const canonical = canonicalFilterText(normalized);

    return PREMIUM_FOLDER_ALIASES[normalizedKey] || PREMIUM_FOLDER_ALIASES[canonical] || [normalized];
  });

  return Array.from(new Set(aliases));
};

const isWeaponSkinLikeItem = (item: BaseItem, category: CategoryKey) => {
  const premiumType = getPremiumItemType(item);
  return (
    category === "weapons" &&
    (premiumType === "Weapons" || /\s[-–—]\s/.test(item.name || "") || /skin/i.test(item.type || ""))
  );
};

const getImageCandidates = (item: BaseItem, category: CategoryKey) => {
  const candidates: string[] = [];
  const addCandidate = (value?: string) => {
    if (!value) return;
    const normalized = normalizeProjectImagePath(value);
    if (normalized && !candidates.includes(normalized)) candidates.push(normalized);
  };

  // Crafting recipes use a nested folder structure:
  // public/db-assets/Crafting Recipes/<Station>/<Module>/<Recipe>/Required|Result/<file>
  // Do not guess flat /Crafting Recipes/T_Inventory_*.png paths, because missing guesses create repeated 404 logs.
  if (category === "crafting") {
    addCandidate(item.imageUrl);
    item.craftingResultImages?.forEach((img) => addCandidate(img.imageUrl));
    return candidates;
  }

  const folder = getCategoryImageFolder(category);

  const addFileNameCandidates = (rawFileName?: string) => {
    if (!rawFileName) return;

    const fileName = rawFileName.split(/[\\/]/).pop() || rawFileName;
    const hasExtension = /\.(png|jpg|jpeg|webp|gif)$/i.test(fileName);
    const fileNameWithPng = hasExtension ? fileName : `${fileName}.png`;
    const safeFileName = makeSafeFileName(fileNameWithPng);
    const fileNames = Array.from(new Set([
      fileNameWithPng,
      safeFileName,
      ...getAliasFileNames(category, fileNameWithPng),
    ]));

    for (const candidateFileName of fileNames) {
      if (category === "premium") {
        for (const premiumFolder of getPremiumImageFolderAliases(item)) {
          addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/Premium/${premiumFolder}/${candidateFileName}`);
          addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/premium/${premiumFolder}/${candidateFileName}`);
        }
      }

      if (isWeaponSkinLikeItem(item, category)) {
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/weapons/skins/${candidateFileName}`);
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/weapons/Skins/${candidateFileName}`);
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/Weapons/Skins/${candidateFileName}`);
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/weapon-skins/${candidateFileName}`);
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/Premium/Weapons/${candidateFileName}`);
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/premium/Weapons/${candidateFileName}`);
      }

      addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/${folder}/${candidateFileName}`);
      if (category === "achievements") {
        addCandidate(`${DEFAULT_PUBLIC_IMAGE_ROOT}/Achievements/${candidateFileName}`);
      }
    }

    // Premium images are resolved from public/db-assets/Premium/<Type>/,
    // where <Type> matches the Premium type filter and folder name exactly.
    // Direct custom paths still work through item.imageUrl above.
  };

  const addNameGuessCandidates = () => {
    const compactName = item.name.replace(/[^A-Za-z0-9]+/g, "");
    const underscoreName = item.name.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

    [
      item.name,
      `${item.name}.png`,
      `T_Inventory_${compactName}.png`,
      `T_Inventory_Icon_${compactName}.png`,
      `T_Inventory_${underscoreName}.png`,
      `T_Inventory_Icon_${underscoreName}.png`,
    ].forEach(addFileNameCandidates);
  };

  addCandidate(item.imageUrl);
  addFileNameCandidates(item.imageUrl);
  addFileNameCandidates(item.imageDesc);
  addNameGuessCandidates();

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
  const candidates = useMemo(() => getImageCandidates(item, category), [item.imageUrl, item.imageDesc, item.name, item.type, item.premiumCategory, category]);
  const earnedCandidates = useMemo(() => {
    if (category !== "achievements") return [];
    return getImageCandidates(
      {
        ...item,
        imageUrl: item.earnedImageUrl,
        imageDesc: item.earnedImageDesc,
      },
      category
    );
  }, [item.earnedImageUrl, item.earnedImageDesc, item.name, item.type, category]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [earnedCandidateIndex, setEarnedCandidateIndex] = useState(0);
  const src = candidates[candidateIndex];
  const earnedSrc = earnedCandidates[earnedCandidateIndex];

  useEffect(() => {
    setCandidateIndex(0);
    setEarnedCandidateIndex(0);
  }, [item.imageUrl, item.imageDesc, item.earnedImageUrl, item.earnedImageDesc, item.name, category]);

  if (!src || candidateIndex >= candidates.length) {
    return <div className={placeholderClassName}><i className={category === "crafting" ? "fas fa-hammer" : "fas fa-image"}></i></div>;
  }

  if (category === "achievements" && earnedSrc && earnedCandidateIndex < earnedCandidates.length) {
    return (
      <span className="achievement-image-hover" title="Hover to preview completed achievement icon">
        <img
          src={src}
          alt={`${item.name} incomplete icon`}
          className={`${className} achievement-image-base`}
          draggable={false}
          onError={() => {
            setCandidateIndex((current) => current + 1);
          }}
        />
        <img
          src={earnedSrc}
          alt={`${item.name} completed icon`}
          className={`${className} achievement-image-earned`}
          draggable={false}
          onError={() => {
            setEarnedCandidateIndex((current) => current + 1);
          }}
        />
      </span>
    );
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
  "7.62x38", "9x19 Parabellum", ".38 Special", ".357 Magnum", ".22 LR", ".30-06",
  ".45 ACP", "5.7x28", "43mm", "5.56x45 NATO", ".338 LM", ".308 WIN", "40mm",
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
const armorClassOptions = ["None", "Light", "Medium", "Heavy"];
const craftingStationOptions = ["Inventory", "Furnace", "Press Machine", "Chemical Station", "Campfire", "Ammo Press", "Big CNC Machine"];
const craftingLocationOptions = ["Minayev's Territory", "Zapandnaya Mine (Big Village)", "Tunnels", "Canyon", "Coast", "Testing Ground", "Foothills"];
const characterPartOptions = ["Hair", "Head", "Torso", "Legs", "Foot", "DLC", "Faction"];

const itemTypeOptions = ["Artefact", "Artefact Container L", "Artefact Container M", "Artefact Container S", "Base Resource", "Battery", "Clothes Modification Kit", "Clothes Repair Kit", "Clothes Spray Can", "Complex", "Controlled Drone", "Document", "Drone", "Electronics", "Energy Equipment", "Engraving Kit", "Equipment", "Extractor", "Fish", "Fishing Bait", "Fishing Item", "Food", "Fuel", "Healing Item", "Houseware", "Instruments", "Junk", "Miscellaneous", "Modification Parts", "Money", "None", "Optical Device", "PDA Module", "Placement Kit", "Production Module", "Quest", "Radio Device", "Repair Item", "Resource Miner", "Spare Parts", "Stimulator Container", "Teleportation Device", "Universal Scanner", "Unlocking Kit", "Vehicle", "Weapon Modification Kit", "Weapon Repair Kit", "Weapon Spray Can"];
const locationOptions = ["Solnechny Outskirts", "Solar City", "MTE", "Minayev's Mine", "Dead Forest", "Big Village", "Swamp", "Exclusive Zone", "Canyon", "Testing grounds", "Coast", "Foothills", "The village"];
const weaponClassOptions = ["Mercenary", "Miner", "Engineer", "Hunter"];
const parametersStatOptions = ["Strength", "Dexterity", "Stamina", "Accuracy", "Intelligence", "Fortune"];
const modLevelOptions = ["M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11"];
const ammoComparisonOptions = ["FMJ", "HP", "AP", "FMJ Extra", "M1"];
const armorModificationOptions = ["M0", "M2", "M4"];
const achievementRarityOptions: AchievementRarity[] = ["Common", "Rare", "Very Rare", "Ultra Rare", "Incredibly Rare", "Legendary", "Impossible"];

const normalizeFilterText = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");

const canonicalFilterText = (value?: string | number | null) => {
  const normalized = normalizeFilterText(value);

  const aliases: Record<string, string> = {
    "assault rifle": "assault rifle",
    "assault rifles": "assault rifle",
    "ar": "assault rifle",

    "machine gun": "machine gun",
    "machinegun": "machine gun",
    "machine guns": "machine gun",
    "machine gunner": "machine gun",
    "machine-gun": "machine gun",

    "submachine gun": "smg",
    "submachine guns": "smg",
    "submachinegun": "smg",
    "sub machine gun": "smg",
    "smg": "smg",

    "handgun": "pistol",
    "handguns": "pistol",
    "pistol": "pistol",
    "pistols": "pistol",

    "knife": "melee",
    "knives": "melee",
    "melee": "melee",

    "grenade launcher": "grenade launcher",
    "grenade launchers": "grenade launcher",
    "grenade launcher ammo": "grenade launcher ammo",

    "armored plate": "armor plate",
    "armour plate": "armor plate",
    "armor plate": "armor plate",
    "armored plates": "armor plate",
    "armour plates": "armor plate",
    "armor plates": "armor plate",

    "stimulant": "stimulator",
    "stimulator": "stimulator",
    "stimulants": "stimulator",
    "stimulators": "stimulator",
  };

  return aliases[normalized] || normalized;
};

const matchesTextFilter = (value: unknown, filter: string) => {
  if (!filter) return true;

  const normalizedValue = normalizeFilterText(String(value ?? ""));
  const normalizedFilter = normalizeFilterText(filter);
  const canonicalValue = canonicalFilterText(String(value ?? ""));
  const canonicalFilter = canonicalFilterText(filter);

  return (
    canonicalValue === canonicalFilter ||
    normalizedValue === normalizedFilter ||
    normalizedValue.includes(normalizedFilter) ||
    normalizedFilter.includes(normalizedValue)
  );
};

const arrayMatchesTextFilter = (values: unknown, filter: string) => {
  if (!filter) return true;

  if (Array.isArray(values)) {
    return values.some((value) => matchesTextFilter(value, filter));
  }

  return matchesTextFilter(values, filter);
};

const getDatabasePrice = (item: BaseItem) => item.basePriceTokens ?? item.price ?? item.sellingPriceTokens ?? 0;

const getAverageDamage = (item: BaseItem) => {
  if (typeof item.damage === "number") return item.damage;
  if (typeof item.minDamage === "number" || typeof item.maxDamage === "number") {
    return ((item.minDamage ?? 0) + (item.maxDamage ?? 0)) / 2;
  }

  const display = item.damageDisplay || item.detail || "";
  const numbers = display.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (numbers.length >= 2) return (numbers[0] + numbers[1]) / 2;
  if (numbers.length === 1) return numbers[0];

  return 0;
};

const AMMO_TYPE_FILTER_OPTIONS = ["FMJ", "HP", "AP", "FMJ Extra", "M1"];

const PREMIUM_AMMO_TYPE_FILTER_OPTIONS = ["S1"];

const PREMIUM_TYPE_FILTER_OPTIONS = [
  "Ammo",
  "Armor",
  "Attachments",
  "Bandanas",
  "Document",
  "Food",
  "Gas Masks",
  "Masks",
  "Medicine",
  "Paints",
  "Repair kits",
  "Vehicles",
  "Weapons",
];

const getPremiumItemType = (item: BaseItem) => {
  const rawType = String(item.premiumCategory || item.type || "").trim();
  const normalized = normalizeFilterText(rawType);
  const canonical = canonicalFilterText(rawType);

  if (["weapon", "weapons"].includes(canonical) || ["weapon", "weapons"].includes(normalized)) return "Weapons";
  if (["weapon attachment", "weaponattachment", "attachments", "attachment"].includes(canonical) || ["weapon attachment", "weaponattachment", "attachments", "attachment"].includes(normalized)) return "Attachments";
  if (["bandana", "bandanas"].includes(canonical) || ["bandana", "bandanas"].includes(normalized)) return "Bandanas";
  if (["gas mask", "gas masks"].includes(canonical) || ["gas mask", "gas masks"].includes(normalized)) return "Gas Masks";
  if (["mask", "masks"].includes(canonical) || ["mask", "masks"].includes(normalized)) return "Masks";
  if (["repair kit", "repair kits"].includes(canonical) || ["repair kit", "repair kits"].includes(normalized)) return "Repair kits";
  if (["paint", "paints", "weaponspraycan"].includes(canonical) || ["paint", "paints", "weaponspraycan"].includes(normalized)) return "Paints";
  if (["vehicle", "vehicles"].includes(canonical) || ["vehicle", "vehicles"].includes(normalized)) return "Vehicles";
  if (canonical === "stimulator") return "Medicine";

  return rawType;
};


const premiumCategoryMatches = (item: BaseItem, selectedCategory: string) => {
  if (!selectedCategory) return true;
  return canonicalFilterText(getPremiumItemType(item)) === canonicalFilterText(selectedCategory);
};

const canBeTakenIntoAccountInventory = (item: BaseItem) =>
  item.canBeTakenIntoAccountInventory === true ||
  item.accountInventory === true ||
  String(item.accountInventory || "").toLowerCase() === "yes";

const normalizeCaliberText = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const CALIBER_CANONICAL_KEYS: Record<string, string> = {
  "12ga": "12ga",
  "12gauge": "12ga",

  "22lr": "22lr",

  "306": "3006",
  "3006": "3006",
  "3060": "3006",
  "30060": "3006",

  "38special": "38special",
  "357magnum": "357magnum",
  "44magnum": "44magnum",
  "45acp": "45acp",
  "500swmagnum": "500swmagnum",

  "556x45": "556x45nato",
  "556x45nato": "556x45nato",
  "55645": "556x45nato",
  "55645nato": "556x45nato",

  "762x25": "762x25tt",
  "762x25tt": "762x25tt",
  "76225": "762x25tt",
  "76225tt": "762x25tt",

  "762x38": "762x38",
  "76238": "762x38",

  "762x39": "762x39",
  "76239": "762x39",

  "762x54": "762x54",
  "76254": "762x54",

  "9x18": "9x18pm",
  "9x18pm": "9x18pm",
  "918": "9x18pm",
  "918pm": "9x18pm",

  "9x19": "9x19parabellum",
  "9x19para": "9x19parabellum",
  "9x19parabellum": "9x19parabellum",
  "919": "9x19parabellum",
  "919para": "9x19parabellum",
  "919parabellum": "9x19parabellum",

  "9x21": "9x21",
  "921": "9x21",

  "9x39": "9x39",
  "939": "9x39",

  "338lm": "338lm",
  "338lapua": "338lm",
  "338lapuamagnum": "338lm",

  "308win": "308win",
  "308winchester": "308win",

  "40mm": "40mm",
  "43mm": "43mm",
  "57x28": "57x28",
  "76mm": "76mm",
};

const CALIBER_DISPLAY_LABELS: Record<string, string> = {
  "12ga": "12Ga.",
  "22lr": ".22 LR",
  "3006": ".30-06",
  "38special": ".38 Special",
  "357magnum": ".357 Magnum",
  "44magnum": ".44 Magnum",
  "45acp": ".45 ACP",
  "500swmagnum": ".500 S&W Magnum",
  "556x45nato": "5.56x45 NATO",
  "57x28": "5.7x28",
  "762x25tt": "7.62x25 TT",
  "762x38": "7.62x38",
  "762x39": "7.62x39",
  "762x54": "7.62x54",
  "9x18pm": "9x18 PM",
  "9x19parabellum": "9x19 Parabellum",
  "9x21": "9x21",
  "9x39": "9x39",
  "338lm": ".338 LM",
  "308win": ".308 WIN",
  "40mm": "40mm",
  "43mm": "43mm",
  "76mm": "76mm",
};

const getCanonicalCaliberKey = (value?: string | number | null) => {
  const normalized = normalizeCaliberText(value);
  return CALIBER_CANONICAL_KEYS[normalized] || normalized;
};

const getCaliberDisplayLabel = (value?: string | number | null) => {
  const key = getCanonicalCaliberKey(value);
  return CALIBER_DISPLAY_LABELS[key] || String(value ?? "").trim();
};

const matchesCaliberFilter = (value: unknown, filter: string) => {
  if (!filter) return true;
  return getCanonicalCaliberKey(String(value ?? "")) === getCanonicalCaliberKey(filter);
};

const getAmmoTypeCategory = (item: BaseItem) => {
  const raw = [item.ammoType, item.ammoComparisonType, item.name, item.detail]
    .filter(Boolean)
    .map((value) => normalizeFilterText(String(value)))
    .join(" ");

  if (raw.includes("s1")) return "s1";
  if (raw.includes("fmj extra") || raw.includes("extra fmj")) return "fmj extra";
  if (raw.split(" ").includes("m1")) return "m1";
  if (raw.split(" ").includes("hp") || raw.includes("hollow point")) return "hp";
  if (raw.split(" ").includes("ap") || raw.includes("armor piercing") || raw.includes("armour piercing")) return "ap";
  if (raw.split(" ").includes("fmj") || raw.includes("full metal jacket")) return "fmj";

  return canonicalFilterText(item.ammoType || item.ammoComparisonType || item.type);
};

const ammoMatchesAmmoTypeFilter = (item: BaseItem, selectedAmmoType: string) => {
  if (!selectedAmmoType) return true;
  return getAmmoTypeCategory(item) === canonicalFilterText(selectedAmmoType);
};

const isS1AmmoItem = (item: BaseItem) =>
  getAmmoTypeCategory(item) === "s1" || normalizeFilterText(item.name).includes("s1");

const isPremiumAmmoItem = (item: BaseItem) =>
  matchesTextFilter(item.type, "Ammo") || isS1AmmoItem(item);

const weaponClassTypeMap: Record<string, string[]> = {
  Hunter: ["melee", "pistol", "rifle"],
  Miner: ["melee", "pistol", "shotgun"],
  Mercenary: ["melee", "pistol", "assault rifle"],
  Engineer: ["melee", "pistol", "smg"],
};

const WEAPON_FILTER_TYPES = [
  "Melee",
  "Pistol",
  "Assault Rifle",
  "Rifle",
  "Shotgun",
  "SMG",
  "Missile",
  "Explosive",
  "Grenade Launcher",
  "Weapon Attachment",
];

const getWeaponTypeCategory = (item: BaseItem) => {
  const raw = [item.type, item.subtype, item.weaponClass, ...(item.weaponClasses || []), item.name]
    .filter(Boolean)
    .map((value) => normalizeFilterText(String(value)))
    .join(" ");

  if (/weapon attachment|attachment|sight|scope|silencer|suppressor|magazine|muzzle|rail|stock|grip/.test(raw)) return "weapon attachment";
  if (/grenade launcher/.test(raw)) return "grenade launcher";
  if (/assault rifle|\bar\b/.test(raw)) return "assault rifle";
  if (/submachine gun|submachinegun|sub machine gun|\bsmg\b/.test(raw)) return "smg";
  if (/handgun|pistol|revolver/.test(raw)) return "pistol";
  if (/melee|knife|knives|machete|brass knuckles|axe|bayonet/.test(raw)) return "melee";
  if (/shotgun/.test(raw)) return "shotgun";
  if (/missile|rocket launcher|launcher/.test(raw)) return "missile";
  if (/explosive|grenade|mine|charge|c4|mon-50|mon50/.test(raw)) return "explosive";
  if (/rifle/.test(raw)) return "rifle";

  return canonicalFilterText(item.type);
};

const weaponMatchesTypeFilter = (item: BaseItem, selectedType: string) => {
  if (!selectedType) return true;
  return getWeaponTypeCategory(item) === canonicalFilterText(selectedType);
};

const weaponMatchesClassFilter = (item: BaseItem, selectedClass: string) => {
  if (!selectedClass) return true;
  const allowedTypes = weaponClassTypeMap[selectedClass] || [];
  return allowedTypes.includes(getWeaponTypeCategory(item));
};

const typeOptionsMap: Record<CategoryKey, string[]> = {
  general: ["Info", "Guide", "Tip", "Mechanic"],
  guides: ["Text", "Video", "Guide", "Tutorial", "Walkthrough"],
  bestiary: ["Creature", "Mutant", "Animal", "Humanoid", "Boss"],
  characters: ["Trader", "Quest giver", "Faction", "NPC", "Merchant", "Vendor"],
  Items: itemTypeOptions,
  premium: itemTypeOptions,
  weapons: ["Melee", "Pistol", "Assault Rifle", "Rifle", "Shotgun", "SMG", "Missile", "Explosive", "Grenade Launcher", "Weapon Attachment"],
  ammo: ["Ammo", "Grenade launcher ammo"],
  armor: ["Jacket", "Helmet", "Boots", "Trousers", "Armored plate"],
  medicine: ["Medicine", "Stimulator"],
  crafting: ["Recipe"],
  achievements: ["Combat", "Discovery", "Completion", "Collectible", "Exploration", "Quest"]
};

export default function DatabasePage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryKey>("weapons");
  const [database, setDatabase] = useState<Record<CategoryKey, BaseItem[]>>(loadDatabase());
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSidebarSections, setExpandedSidebarSections] = useState<Record<string, boolean>>({ Database: true });
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
  const [craftingModuleFilter, setCraftingModuleFilter] = useState("");
  const [craftingTypeFilter, setCraftingTypeFilter] = useState("");
  const [craftingPriceFilter, setCraftingPriceFilter] = useState<"Low" | "High" | "">("");
  const [craftingLocationFilter, setCraftingLocationFilter] = useState("");
  const [craftingLevelFilter, setCraftingLevelFilter] = useState<number | "">("");
  const [craftingVendorFilter, setCraftingVendorFilter] = useState("");
  
  // Premium filters
  const [premiumNameFilter, setPremiumNameFilter] = useState("");
  const [premiumTypeFilter, setPremiumTypeFilter] = useState("");
  const [premiumWeaponTypeFilter, setPremiumWeaponTypeFilter] = useState("");
  const [premiumAmmoTypeFilter, setPremiumAmmoTypeFilter] = useState("");
  const [premiumPriceFilter, setPremiumPriceFilter] = useState<"Low" | "High" | "">("");
  const [premiumAccountInventoryFilter, setPremiumAccountInventoryFilter] = useState("");

  // Achievements filters
  const [achievementsRarityFilter, setAchievementsRarityFilter] = useState("");
  
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedInfoItem, setSelectedInfoItem] = useState<BaseItem | null>(null);
  const [selectedCraftingItem, setSelectedCraftingItem] = useState<BaseItem | null>(null);
  const [activeCraftingSlot, setActiveCraftingSlot] = useState<any | null>(null);

  useEffect(() => {
    const loaded = loadDatabase();
    setDatabase(loaded);
    document.title = "WTLO Knowledge Base";
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
  const isBestiary = currentCategory === "bestiary";
  const canQuickUploadImage = ["Items", "premium", "weapons", "ammo", "armor", "medicine", "bestiary", "achievements", "crafting"].includes(currentCategory);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(currentData.map((item) => item.type).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [currentData]);

  const craftingModuleOptions = useMemo(() => {
    const recipes = database.crafting || [];
    return Array.from(
      new Set(
        recipes
          .filter((item) => !craftingStationFilter || item.craftingStation === craftingStationFilter)
          .map((item) => item.craftingModule || "General")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [database.crafting, craftingStationFilter]);

  useEffect(() => {
    if (craftingModuleFilter && !craftingModuleOptions.includes(craftingModuleFilter)) {
      setCraftingModuleFilter("");
    }
  }, [craftingModuleFilter, craftingModuleOptions]);

  const availablePremiumTypes = useMemo(() => {
    const dynamicPremiumTypes = (database.premium || [])
      .map((item) => getPremiumItemType(item))
      .filter(Boolean);

    return Array.from(new Set([...PREMIUM_TYPE_FILTER_OPTIONS, ...dynamicPremiumTypes]))
      .sort((a, b) => a.localeCompare(b));
  }, [database.premium]);

  const availablePremiumWeaponTypes = useMemo(() => {
    const dynamicWeaponTypes = (database.premium || [])
      .filter((item) => getPremiumItemType(item) === "Weapons")
      .map((item) => item.type)
      .filter((type): type is string => Boolean(type && type.trim()));

    return Array.from(new Set(dynamicWeaponTypes)).sort((a, b) => a.localeCompare(b));
  }, [database.premium]);

  const availablePremiumAmmoTypes = useMemo(() => {
    const dynamicAmmoTypes = (database.premium || [])
      .filter((item) => getPremiumItemType(item) === "Ammo")
      .map((item) => item.ammoType || item.ammoComparisonType || item.projectileType)
      .filter((type): type is string => Boolean(type && String(type).trim()));

    return Array.from(new Set([...PREMIUM_AMMO_TYPE_FILTER_OPTIONS, ...dynamicAmmoTypes]))
      .sort((a, b) => a.localeCompare(b));
  }, [database.premium]);

  const availableSources = useMemo(() => {
    return Array.from(new Set(currentData.flatMap((item) => item.vendors || []).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [currentData]);

  const weaponLevelOptions = useMemo(() => {
    const levels = (database.weapons || [])
      .map((item) => item.level)
      .filter((level): level is number => typeof level === "number" && Number.isFinite(level));

    if (!levels.length) return [];

    const hasNoRequirement = levels.includes(0);
    const positiveLevels = levels.filter((level) => level > 0);
    const options: { label: string; value: number }[] = [];

    if (hasNoRequirement) {
      options.push({ label: "N/R", value: 0 });
    }

    if (positiveLevels.length) {
      const minLevel = Math.min(...positiveLevels);
      const maxLevel = Math.max(...positiveLevels);

      for (let level = minLevel; level <= maxLevel; level += 1) {
        options.push({ label: String(level), value: level });
      }
    }

    return options;
  }, [database.weapons]);

  const ammoCaliberOptions = useMemo(() => {
    const dynamicCalibers = (database.ammo || [])
      .map((item) => item.caliber)
      .filter((caliber): caliber is string => Boolean(caliber && caliber.trim()));

    const byCanonicalCaliber = new Map<string, string>();
    [...dynamicCalibers, ...caliberOptions].forEach((caliber) => {
      const key = getCanonicalCaliberKey(caliber);
      if (key && !byCanonicalCaliber.has(key)) {
        byCanonicalCaliber.set(key, getCaliberDisplayLabel(caliber));
      }
    });

    return Array.from(byCanonicalCaliber.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [database.ammo]);

  const ammoTypeFilterOptions = useMemo(() => {
    const dynamicAmmoTypes = (database.ammo || [])
      .filter((item) => !isS1AmmoItem(item))
      .map((item) => item.ammoType || item.ammoComparisonType)
      .filter((ammoType): ammoType is string => Boolean(ammoType && ammoType.trim()));

    const byNormalizedAmmoType = new Map<string, string>();
    [...AMMO_TYPE_FILTER_OPTIONS, ...dynamicAmmoTypes].forEach((ammoType) => {
      const key = canonicalFilterText(ammoType);
      if (key && key !== "s1" && !byNormalizedAmmoType.has(key)) {
        byNormalizedAmmoType.set(key, ammoType);
      }
    });

    return Array.from(byNormalizedAmmoType.values());
  }, [database.ammo]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...currentData];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(term))
      );
    }

    if (isWeapons) {
      if (weaponTypeFilter) filtered = filtered.filter((item) => weaponMatchesTypeFilter(item, weaponTypeFilter));
      if (weaponClassFilter) filtered = filtered.filter((item) => weaponMatchesClassFilter(item, weaponClassFilter));
      if (weaponCaliberFilter) filtered = filtered.filter((item) => matchesTextFilter(item.caliber, weaponCaliberFilter));
      if (weaponLevelFilter !== "") filtered = filtered.filter((item) => item.level === weaponLevelFilter);
    } 
    else if (isAmmo) {
      filtered = filtered.filter((item) => !isS1AmmoItem(item));
      if (ammoTypeFilter) filtered = filtered.filter((item) => matchesTextFilter(item.type, ammoTypeFilter));
      if (ammoCaliberFilter) filtered = filtered.filter((item) => matchesCaliberFilter(item.caliber, ammoCaliberFilter));
      if (ammoAmmoTypeFilter) filtered = filtered.filter((item) => ammoMatchesAmmoTypeFilter(item, ammoAmmoTypeFilter));
    }
    else if (isPremium) {
      if (premiumNameFilter.trim()) filtered = filtered.filter((item) => item.name.toLowerCase().includes(premiumNameFilter.trim().toLowerCase()));
      if (premiumTypeFilter) filtered = filtered.filter((item) => premiumCategoryMatches(item, premiumTypeFilter));
      if (premiumWeaponTypeFilter) {
        filtered = filtered.filter((item) => matchesTextFilter(getPremiumItemType(item), "Weapons") && matchesTextFilter(item.type, premiumWeaponTypeFilter));
      }
      if (premiumAmmoTypeFilter) {
        filtered = filtered.filter((item) => matchesTextFilter(getPremiumItemType(item), "Ammo") && (
          matchesTextFilter(item.ammoType, premiumAmmoTypeFilter) ||
          matchesTextFilter(item.ammoComparisonType, premiumAmmoTypeFilter) ||
          matchesTextFilter(item.projectileType, premiumAmmoTypeFilter)
        ));
      }
      if (premiumAccountInventoryFilter === "Yes") filtered = filtered.filter((item) => canBeTakenIntoAccountInventory(item));
      if (premiumAccountInventoryFilter === "No") filtered = filtered.filter((item) => !canBeTakenIntoAccountInventory(item));
      if (premiumPriceFilter) {
        const threshold = 1000;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? item.sellingPriceTokens ?? 0;
          return premiumPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
    }
    else if (isItems) {
      if (itemsTypeFilter) filtered = filtered.filter((item) => matchesTextFilter(item.type, itemsTypeFilter));
      if (itemsLevelFilter !== "") filtered = filtered.filter((item) => item.level === itemsLevelFilter);
      if (itemsPriceFilter) {
        const threshold = 1000;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return itemsPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (itemsLocationFilter) filtered = filtered.filter((item) => arrayMatchesTextFilter(item.locations, itemsLocationFilter));
      if (itemsWeightFilter) filtered = filtered.filter((item) => item.weight?.toLowerCase().includes(itemsWeightFilter.toLowerCase()));
      if (itemsVendorFilter) filtered = filtered.filter((item) => arrayMatchesTextFilter(item.vendors, itemsVendorFilter));
    }
    else if (isArmor) {
      if (armorTypeFilter) filtered = filtered.filter((item) => matchesTextFilter(item.type, armorTypeFilter));
      if (armorPriceFilter) {
        const threshold = 2000;
        filtered = filtered.filter((item) => {
          const price = getDatabasePrice(item);
          return armorPriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      if (armorClassFilter) filtered = filtered.filter((item) => matchesTextFilter(item.armorClass, armorClassFilter));
      if (armorLevelFilter !== "") filtered = filtered.filter((item) => item.level === armorLevelFilter);
    }
    else if (isMedicine) {
      if (medicineTypeFilter) filtered = filtered.filter((item) => matchesTextFilter(item.type, medicineTypeFilter));
      if (medicinePriceFilter) {
        const threshold = 500;
        filtered = filtered.filter((item) => {
          const price = item.basePriceTokens ?? item.price ?? 0;
          return medicinePriceFilter === "Low" ? price < threshold : price >= threshold;
        });
      }
      
    }
    else if (isCrafting) {
      if (craftingStationFilter) filtered = filtered.filter((item) => item.craftingStation === craftingStationFilter);
      if (craftingModuleFilter) filtered = filtered.filter((item) => item.craftingModule === craftingModuleFilter);
      if (craftingLocationFilter) filtered = filtered.filter((item) => arrayMatchesTextFilter(item.locations, craftingLocationFilter));
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
    const defaultAchievementSort = isAchievements && !sortField;
    const defaultBestiarySort = isBestiary && !sortField;
    const defaultCraftingSort = isCrafting && !sortField;
    if (sortField || defaultPriceSort || defaultAchievementSort || defaultBestiarySort || defaultCraftingSort) {
      filtered.sort((a, b) => {
        const activeSortField = (defaultPriceSort ? "priceValue" : defaultAchievementSort ? "achievementOrder" : defaultBestiarySort ? "name" : defaultCraftingSort ? "craftingRecipeOrder" : sortField) as string;
        const activeDirection = sortDirection;
        let aVal = a[activeSortField as keyof BaseItem] ?? "";
        let bVal = b[activeSortField as keyof BaseItem] ?? "";
        if (activeSortField === "type" && isPremium) {
          aVal = getPremiumItemType(a);
          bVal = getPremiumItemType(b);
        }
        if (activeSortField === "dmg") {
          aVal = getAverageDamage(a);
          bVal = getAverageDamage(b);
          return activeDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        if (activeSortField === "priceValue" || activeSortField === "price") {
          aVal = getDatabasePrice(a);
          bVal = getDatabasePrice(b);
          return activeDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        }
        if (activeSortField === "ammoType") {
          aVal = getAmmoTypeCategory(a);
          bVal = getAmmoTypeCategory(b);
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
    currentData, searchTerm, currentCategory, isGeneral, isWeapons, isAmmo, isItems, isPremium, isArmor, isMedicine, isCrafting, isBestiary, isAchievements,
    weaponTypeFilter, weaponClassFilter, weaponCaliberFilter, weaponLevelFilter, weaponVendorFilter, weaponPriceFilter, weaponDMGFilter, weaponModFilter, weaponParameterFilter,
    ammoTypeFilter, ammoCaliberFilter, ammoVendorFilter, ammoPriceFilter, ammoDMGFilter, ammoAmmoTypeFilter, ammoLevelFilter,
    premiumNameFilter, premiumTypeFilter, premiumWeaponTypeFilter, premiumAmmoTypeFilter, premiumPriceFilter, premiumAccountInventoryFilter,
    itemsTypeFilter, itemsLevelFilter, itemsPriceFilter, itemsLocationFilter, itemsWeightFilter, itemsVendorFilter,
    armorTypeFilter, armorPriceFilter, armorLocationFilter, armorModificationFilter, armorClassFilter, armorLevelFilter, armorVendorFilter,
    medicineTypeFilter, medicinePriceFilter, medicineLocationFilter, medicineLevelFilter, medicineVendorFilter,
    craftingStationFilter, craftingModuleFilter, craftingTypeFilter, craftingPriceFilter, craftingLocationFilter, craftingLevelFilter, craftingVendorFilter,
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
    if (!itemToDelete) return;
    if (!window.confirm(`Remove ${itemToDelete.name || "this item"}?`)) return;
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


  const normalizeCraftingFolderForUpload = (folder?: string) => {
    if (!folder?.trim()) return "";
    return folder
      .trim()
      .replace(/^\/db-assets\//, "")
      .replace(/^db-assets\//, "")
      .replace(/^public\/db-assets\//, "");
  };

  const buildCraftingAssetFolder = (item: Partial<BaseItem>, slot: "Required" | "Result") => {
    const existingFolder = slot === "Required" ? item.requiredImageFolder : item.resultImageFolder;
    const normalizedExistingFolder = normalizeCraftingFolderForUpload(existingFolder);
    if (normalizedExistingFolder) return normalizedExistingFolder;

    const station = item.craftingStation || "Inventory";
    const recipeName = item.name || "Unnamed Recipe";
    return `${getCategoryImageFolder("crafting")}/${station} - ${recipeName}/${slot}`;
  };

  const uploadImageToProject = async (file: File, category: CategoryKey, customFolder?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", customFolder || getCategoryImageFolder(category));

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

    setGuideDifficultyFilter("");
    setBestiaryDifficultyFilter("");
    setCharacterPartFilter("");

    setItemsTypeFilter("");
    setItemsLevelFilter("");
    setItemsPriceFilter("");
    setItemsLocationFilter("");
    setItemsWeightFilter("");
    setItemsVendorFilter("");

    setWeaponTypeFilter("");
    setWeaponClassFilter("");
    setWeaponCaliberFilter("");
    setWeaponLevelFilter("");
    setWeaponVendorFilter("");
    setWeaponPriceFilter("");
    setWeaponDMGFilter("");
    setWeaponModFilter("");
    setWeaponParameterFilter("");

    setAmmoTypeFilter("");
    setAmmoCaliberFilter("");
    setAmmoVendorFilter("");
    setAmmoPriceFilter("");
    setAmmoDMGFilter("");
    setAmmoAmmoTypeFilter("");
    setAmmoLevelFilter("");

    setArmorTypeFilter("");
    setArmorPriceFilter("");
    setArmorLocationFilter("");
    setArmorModificationFilter("");
    setArmorClassFilter("");
    setArmorLevelFilter("");
    setArmorVendorFilter("");

    setMedicineTypeFilter("");
    setMedicinePriceFilter("");
    setMedicineLocationFilter("");
    setMedicineLevelFilter("");
    setMedicineVendorFilter("");

    setCraftingStationFilter("");
    setCraftingModuleFilter("");
    setCraftingTypeFilter("");
    setCraftingPriceFilter("");
    setCraftingLocationFilter("");
    setCraftingLevelFilter("");
    setCraftingVendorFilter("");

    setPremiumNameFilter("");
    setPremiumTypeFilter("");
    setPremiumWeaponTypeFilter("");
    setPremiumPriceFilter("");
    setPremiumAccountInventoryFilter("");

    setAchievementsRarityFilter("");

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
      if (id === "premiumWeaponType") setPremiumWeaponTypeFilter("");
      if (id === "premiumAmmoType") setPremiumAmmoTypeFilter("");
      if (id === "premiumPrice") setPremiumPriceFilter("");
      if (id === "premiumAccountInventory") setPremiumAccountInventoryFilter("");
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
      if (id === "craftingModule") setCraftingModuleFilter("");
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
      const craftingResultFolder = currentCategory === "crafting" ? buildCraftingAssetFolder(targetItem, "Result") : undefined;
      const uploaded = await uploadImageToProject(file, currentCategory, craftingResultFolder);
      const updatedItem = currentCategory === "crafting"
        ? {
            ...targetItem,
            imageUrl: uploaded.publicPath,
            imageDesc: uploaded.fileName,
            resultImageFolder: craftingResultFolder ? `/db-assets/${craftingResultFolder}` : targetItem.resultImageFolder,
            craftingResultImages: [
              {
                name: targetItem.name || uploaded.fileName,
                imageUrl: uploaded.publicPath,
                imageDesc: uploaded.fileName,
                quantity: "1",
                type: "Result",
              },
            ],
          }
        : {
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

  const handleCraftingRecipeImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "Required" | "Result",
    index?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const folder = buildCraftingAssetFolder(editFormData, slot);
      const uploaded = await uploadImageToProject(file, "crafting", folder);
      const imageEntry = {
        name: editFormData.name || uploaded.fileName,
        imageUrl: uploaded.publicPath,
        imageDesc: uploaded.fileName,
        quantity: slot === "Required" ? "0/1" : "1",
        type: slot === "Required" ? "Required" : "Result",
      };

      const requiredImages = [...(editFormData.craftingRequiredImages || [])];
      const resultImages = [...(editFormData.craftingResultImages || [])];

      if (slot === "Required") {
        if (typeof index === "number" && requiredImages[index]) requiredImages[index] = { ...requiredImages[index], ...imageEntry };
        else requiredImages.push(imageEntry);

        setEditFormData({
          ...editFormData,
          requiredImageFolder: `/db-assets/${folder}`,
          craftingRequiredImages: requiredImages,
        });
      } else {
        if (typeof index === "number" && resultImages[index]) resultImages[index] = { ...resultImages[index], ...imageEntry };
        else resultImages.push(imageEntry);

        setEditFormData({
          ...editFormData,
          imageUrl: uploaded.publicPath,
          imageDesc: uploaded.fileName,
          resultImageFolder: `/db-assets/${folder}`,
          craftingResultImages: resultImages,
        });
      }
    } catch (error) {
      console.error("Crafting recipe image upload failed:", error);
      alert("Crafting recipe image upload failed. Check the terminal and make sure the image upload API supports nested category folders.");
    }

    e.target.value = "";
  };

  const updateCraftingImageEntry = (slot: "Required" | "Result", index: number, patch: Partial<{ name: string; imageUrl: string; imageDesc: string; quantity: string; type: string }>) => {
    const requiredImages = [...(editFormData.craftingRequiredImages || [])];
    const resultImages = [...(editFormData.craftingResultImages || [])];

    if (slot === "Required") {
      requiredImages[index] = { ...(requiredImages[index] || { name: "Required item" }), ...patch };
      setEditFormData({ ...editFormData, craftingRequiredImages: requiredImages });
    } else {
      resultImages[index] = { ...(resultImages[index] || { name: editFormData.name || "Result item" }), ...patch };
      setEditFormData({
        ...editFormData,
        imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : editFormData.imageUrl,
        craftingResultImages: resultImages,
      });
    }
  };

  const removeCraftingImageEntry = (slot: "Required" | "Result", index: number) => {
    if (slot === "Required") {
      const requiredImages = [...(editFormData.craftingRequiredImages || [])];
      requiredImages.splice(index, 1);
      setEditFormData({ ...editFormData, craftingRequiredImages: requiredImages });
    } else {
      const resultImages = [...(editFormData.craftingResultImages || [])];
      resultImages.splice(index, 1);
      setEditFormData({ ...editFormData, craftingResultImages: resultImages });
    }
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
      ].filter(f => f.active);
    } else if (isAmmo) {
      return [
        { label: `Type: ${ammoTypeFilter}`, id: "ammoType", active: !!ammoTypeFilter },
        { label: `Caliber: ${ammoCaliberFilter}`, id: "ammoCaliber", active: !!ammoCaliberFilter },
        { label: `Ammo Type: ${ammoAmmoTypeFilter}`, id: "ammoAmmoType", active: !!ammoAmmoTypeFilter },
      ].filter(f => f.active);
    } else if (isPremium) {
      return [
        { label: `Name: ${premiumNameFilter}`, id: "premiumName", active: !!premiumNameFilter },
        { label: `Premium Category: ${premiumTypeFilter}`, id: "premiumType", active: !!premiumTypeFilter },
        { label: `Weapon Type: ${premiumWeaponTypeFilter}`, id: "premiumWeaponType", active: !!premiumWeaponTypeFilter },
        { label: `Ammo Type: ${premiumAmmoTypeFilter}`, id: "premiumAmmoType", active: !!premiumAmmoTypeFilter },
        { label: `Price: ${premiumPriceFilter}`, id: "premiumPrice", active: !!premiumPriceFilter },
        { label: `Account Inventory: ${premiumAccountInventoryFilter}`, id: "premiumAccountInventory", active: !!premiumAccountInventoryFilter },
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
        { label: `Class: ${armorClassFilter}`, id: "armorClass", active: !!armorClassFilter },
      ].filter(f => f.active);
    } else if (isMedicine) {
      return [
        { label: `Type: ${medicineTypeFilter}`, id: "medicineType", active: !!medicineTypeFilter },
        { label: `Price: ${medicinePriceFilter}`, id: "medicinePrice", active: !!medicinePriceFilter },
      ].filter(f => f.active);
    } else if (isCrafting) {
      return [
        { label: `Station: ${craftingStationFilter}`, id: "craftingStation", active: !!craftingStationFilter },
        { label: `Module: ${craftingModuleFilter}`, id: "craftingModule", active: !!craftingModuleFilter },
        { label: `Location: ${craftingLocationFilter}`, id: "craftingLocation", active: !!craftingLocationFilter },
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

    return (
      <span className="token-price" title={`${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens`}>
        <span>{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <img src={TOKEN_ICON_DATA_URI} alt="tokens" className="token-icon" draggable={false} />
      </span>
    );
  };

  const getItemPriceValue = (item: BaseItem) => item.basePriceTokens ?? item.price ?? item.sellingPriceTokens ?? 0;
  const getDamageValue = (item: BaseItem) => ((item.minDamage ?? item.damage ?? 0) + (item.maxDamage ?? item.damage ?? 0)) / 2;
  const displayDamage = (item: BaseItem) => {
    if (item.minDamage !== undefined && item.maxDamage !== undefined) return `${item.minDamage}–${item.maxDamage}`;
    if (item.damage !== undefined) return String(item.damage);
    return "-";
  };

  const renderCraftingImageStrip = (images: BaseItem["craftingRequiredImages"], fallbackIcon: string) => {
    if (!images?.length) return <span className="crafting-image-empty">No recipe images listed</span>;
    return (
      <div className="crafting-image-strip">
        {images.map((img, index) => (
          <div className="crafting-image-slot" key={`${img.name}-${index}`} title={img.imageUrl || img.name}>
            {img.imageUrl ? (
              <img src={img.imageUrl} alt={img.imageDesc || img.name} onError={(event) => { event.currentTarget.style.display = "none"; }} />
            ) : null}
            <span className="crafting-image-fallback">{fallbackIcon}</span>
            {img.quantity && <em>{img.quantity}</em>}
            <strong>{img.name}</strong>
            {img.method && <small className="crafting-image-method">{img.method}</small>}
          </div>
        ))}
      </div>
    );
  };

  const formatCraftingParts = (parts?: BaseItem["craftingRequiredImages"], limit = 4) => {
    if (!parts?.length) return "Not supplied";
    const displayed = parts.slice(0, limit).map((part) => {
      const quantity = part.quantity ? `[${part.quantity}] ` : "";
      const method = part.method ? ` (${part.method})` : "";
      return `${quantity}${part.name}${method}`;
    });
    const remaining = parts.length > limit ? ` +${parts.length - limit} more` : "";
    return `${displayed.join(", ")}${remaining}`;
  };

  const renderStatHighlights = (item: BaseItem) => {
    const price = getItemPriceValue(item);
    const dmg = displayDamage(item);
    const showAmmoProperties = isAmmo || (isPremium && isPremiumAmmoItem(item));
    const showDamage = isWeapons || showAmmoProperties;
    const showPrice = isWeapons || isAmmo || isArmor || isMedicine || isItems || isPremium;
    if (isAchievements) {
      return (
        <div className="card-stat-grid">
          <div className="stat-pill"><span>Rarity</span><strong>{item.achievementRarity || "-"}</strong></div>
          {item.achievementHidden !== undefined && <div className="stat-pill"><span>Hidden</span><strong>{item.achievementHidden ? "Yes" : "No"}</strong></div>}
          {item.achievementValue !== undefined && <div className="stat-pill"><span>Value</span><strong>{item.achievementValue}</strong></div>}
        </div>
      );
    }
    if (isBestiary) {
      return (
        <div className="card-stat-grid">
          <div className="stat-pill"><span>Health</span><strong>{item.health ?? "-"}</strong></div>
          <div className="stat-pill"><span>HP / Level</span><strong>{item.healthPerLevel ?? "-"}</strong></div>
          <div className="stat-pill"><span>DMG</span><strong>{item.damageDisplay || displayDamage(item)}</strong></div>
          <div className="stat-pill"><span>Armor</span><strong>{item.defense ?? 0}</strong></div>
          <div className="stat-pill"><span>Regen</span><strong>{item.regenerateHealthRate ? `${item.regenerateHealthRate}/s` : "No"}</strong></div>
        </div>
      );
    }
    if (isCrafting) {
      return (
        <div className="card-stat-grid">
          <div className="stat-pill"><span>Station</span><strong>{item.craftingStation || "Inventory"}</strong></div>
          <div className="stat-pill"><span>Module</span><strong>{item.craftingModule || "General"}</strong></div>
          <div className="stat-pill"><span>Required</span><strong>{item.craftingRequiredImages?.length || 0}</strong></div>
          <div className="stat-pill"><span>Results</span><strong>{item.craftingResultImages?.length || 1}</strong></div>
        </div>
      );
    }
    if (!showDamage && !showPrice && !item.weight && !item.caliber) return null;
    return (
      <div className="card-stat-grid">
        {showPrice && <div className="stat-pill"><span>Price</span><strong>{price ? formatTokenPrice(price) : "-"}</strong></div>}
        {showDamage && <div className="stat-pill"><span>DMG</span><strong>{dmg}</strong></div>}
        {showAmmoProperties && item.ammoType && <div className="stat-pill"><span>Ammo Type</span><strong>{item.ammoType}</strong></div>}
        {(isWeapons || showAmmoProperties) && item.apPiercing && <div className="stat-pill"><span>AP</span><strong>{item.apPiercing}</strong></div>}
        {(isWeapons || showAmmoProperties) && item.caliber && <div className="stat-pill"><span>Caliber</span><strong>{item.caliber}</strong></div>}
        {isArmor && item.armorDisplay && <div className="stat-pill"><span>Armor</span><strong>{item.armorDisplay}</strong></div>}
        {isArmor && item.armorClass && <div className="stat-pill"><span>Armor Class</span><strong>{item.armorClass}</strong></div>}
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
          <div className="card-detail"><strong>Damage:</strong> {displayDamage(item)}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
          {item.itemParameters && <div className="card-detail"><strong>Requirements:</strong> {item.itemParameters}</div>}
          <div className="card-detail"><strong>Crit %:</strong> {item.critChance !== undefined ? `x${item.critChance}` : "-"}</div>
          <div className="card-detail"><strong>Range:</strong> {item.effectiveRange !== undefined ? `${item.effectiveRange}m` : "-"}</div>
          <div className="card-detail"><strong>Magazine:</strong> {item.magazine !== undefined ? item.magazine : "-"}</div>
          <div className="card-detail"><strong>MOA:</strong> {item.moa !== undefined ? item.moa : "-"}</div>
          {item.modLevel && <div className="card-detail"><strong>Mod:</strong> {item.modLevel}</div>}
          {item.apPiercing && <div className="card-detail"><strong>AP:</strong> {item.apPiercing}</div>}
          {item.weight && <div className="card-detail"><strong>Weight:</strong> {item.weight}</div>}
          {item.dropChance !== undefined && <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance}%</div>}
          {item.basePriceTokens !== undefined && <div className="card-detail"><strong>Base Price:</strong> {formatTokenPrice(item.basePriceTokens)}</div>}
          {item.weaponAttachmentRecoilMultiplier !== undefined && <div className="card-detail"><strong>Attachment Recoil Multiplier:</strong> {item.weaponAttachmentRecoilMultiplier}</div>}
          {item.weaponAttachmentDamageMultiplier !== undefined && <div className="card-detail"><strong>Attachment Damage Multiplier:</strong> {item.weaponAttachmentDamageMultiplier}</div>}
          {item.weaponAttachmentAccuracyMultiplier !== undefined && <div className="card-detail"><strong>Attachment Accuracy Multiplier:</strong> {item.weaponAttachmentAccuracyMultiplier}</div>}
        </>
      );
    }
    if (isAmmo || (isPremium && isPremiumAmmoItem(item))) {
      return (
        <>
          <div className="card-detail"><strong>Caliber:</strong> {item.caliber || "-"}</div>
          <div className="card-detail"><strong>Damage:</strong> {displayDamage(item) || "-"}</div>
          <div className="card-detail"><strong>Ammo Type:</strong> {item.ammoType || "-"}</div>
          <div className="card-detail"><strong>Projectile:</strong> {item.projectileType || "-"}</div>
          <div className="card-detail"><strong>Projectile Count:</strong> {item.projectileCount ?? "-"}</div>
          <div className="card-detail"><strong>AP Piercing:</strong> {item.apPiercing || "-"}</div>
          <div className="card-detail"><strong>Accuracy / MOA:</strong> {item.moa ?? "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance !== undefined ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          {isPremium && <div className="card-detail"><strong>Account Inventory:</strong> {canBeTakenIntoAccountInventory(item) ? "Can be taken" : "No"}</div>}
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
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance !== undefined ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
          {isPremium && <div className="card-detail"><strong>Account Inventory:</strong> {canBeTakenIntoAccountInventory(item) ? "Can be taken" : "No"}</div>}
          {item.craftExperience !== undefined && <div className="card-detail"><strong>Craft Experience:</strong> {item.craftExperience}</div>}
          {item.survivalExperience !== undefined && <div className="card-detail"><strong>Survival Experience:</strong> {item.survivalExperience}</div>}
          {item.experience !== undefined && <div className="card-detail"><strong>Experience:</strong> {item.experience}</div>}
        </>
      );
    }
    if (isArmor) {
      return (
        <>
          <div className="card-detail"><strong>Armor:</strong> {item.armorDisplay || (item.defense !== undefined ? item.defense : "-")}</div>
          <div className="card-detail"><strong>Class:</strong> {item.armorClass || "-"}</div>
          <div className="card-detail"><strong>Type:</strong> {item.type || "-"}</div>
          <div className="card-detail"><strong>Front Plate:</strong> {item.haveFrontPlate ? `Yes${item.frontPlates ? ` (${item.frontPlates})` : ""}` : "No"}</div>
          <div className="card-detail"><strong>Back Plate:</strong> {item.haveBackPlate ? `Yes${item.backPlates ? ` (${item.backPlates})` : ""}` : "No"}</div>
          <div className="card-detail"><strong>Cover Arms:</strong> {item.coverArms ? "Yes" : "No"}</div>
          <div className="card-detail"><strong>Monster Armor Multiplier:</strong> {item.monsterArmorMultiplier ?? "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance !== undefined ? `${item.dropChance}%` : "-"}</div>
          <div className="card-detail"><strong>Level:</strong> {levelDisplay}</div>
        </>
      );
    }
    if (isMedicine) {
      return (
        <>
          <div className="card-detail"><strong>Type:</strong> {item.type || "-"}</div>
          <div className="card-detail"><strong>Weight:</strong> {item.weight || "-"}</div>
          <div className="card-detail"><strong>Price:</strong> {formatTokenPrice(getItemPriceValue(item))}</div>
          <div className="card-detail"><strong>Duration:</strong> {item.totalDuration !== undefined ? `${item.totalDuration}s` : "-"}</div>
          <div className="card-detail"><strong>Experience:</strong> {item.experience ?? "-"}</div>
          <div className="card-detail"><strong>Drop Chance:</strong> {item.dropChance !== undefined ? `${item.dropChance}%` : "-"}</div>
          {item.medicineEffects?.length ? <div className="card-detail"><strong>Effects:</strong> {item.medicineEffects.join(", ")}</div> : null}
          {item.characterEffects?.length ? <div className="card-detail"><strong>Character Effects:</strong> {item.characterEffects.join(", ")}</div> : null}
          {item.effectImageUrl && <div className="card-detail"><strong>Effects:</strong> <img src={item.effectImageUrl} alt="effects" style={{ maxWidth: "100px", marginTop: "5px" }} /></div>}
        </>
      );
    }
    if (isCrafting) {
      return (
        <>
          <div className="card-detail"><strong>Station:</strong> {item.craftingStation || "-"}</div>
          <div className="card-detail"><strong>Module:</strong> {item.craftingModule || "General"}</div>
          <div className="card-detail"><strong>Location:</strong> {item.locations?.length ? item.locations.join(", ") : "-"}</div>
          <div className="card-detail"><strong>Required folder:</strong> {item.requiredImageFolder || "-"}</div>
          <div className="card-detail"><strong>Result folder:</strong> {item.resultImageFolder || "-"}</div>
          <div className="card-detail recipe-media-detail"><strong>Required:</strong> {renderCraftingImageStrip(item.craftingRequiredImages, "◇")}</div>
          <div className="card-detail recipe-media-detail"><strong>Result:</strong> {renderCraftingImageStrip(item.craftingResultImages, "◆")}</div>
          {item.craftingNotes?.length ? <div className="card-detail"><strong>Notes:</strong> {item.craftingNotes.join(" ")}</div> : null}
          {item.craftExperience !== undefined && <div className="card-detail"><strong>Craft Experience:</strong> {item.craftExperience}</div>}
          {item.survivalExperience !== undefined && <div className="card-detail"><strong>Survival Experience:</strong> {item.survivalExperience}</div>}
          {item.experience !== undefined && <div className="card-detail"><strong>Experience:</strong> {item.experience}</div>}
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
            <div className="card-detail"><strong>Health:</strong> {item.health ?? "-"}</div>
            <div className="card-detail"><strong>Health / Level:</strong> {item.healthPerLevel ?? "-"}</div>
            <div className="card-detail"><strong>Damage:</strong> {item.damageDisplay || displayDamage(item)}</div>
            <div className="card-detail"><strong>Armor:</strong> {item.armorSummary || item.armorDisplay || "-"}</div>
            <div className="card-detail"><strong>Regeneration:</strong> {item.regeneration || "-"}</div>
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
    const isAmmoLikeItem = isAmmo || (isPremium && isPremiumAmmoItem(item));
    const sections: React.ReactNode[] = [];

    sections.push(
      <div className="info-section" key="basic">
        <h3>Basic information</h3>
        {rows([
          ["Category", currentCategoryLabel],
          ["Premium Category", isPremium ? getPremiumItemType(item) : undefined],
          ["Type", item.type],
          ["Rarity", item.rarity],
          ["Achievement Rarity", isAchievements ? item.achievementRarity : undefined],
          ["Achievement Hidden", isAchievements && item.achievementHidden !== undefined ? (item.achievementHidden ? "Yes" : "No") : undefined],
          ["Achievement Value", isAchievements && item.achievementValue !== undefined ? item.achievementValue : undefined],
          ["Account Inventory", isPremium ? (canBeTakenIntoAccountInventory(item) ? "Can be taken" : "No") : undefined],
          ["Level", isAmmoLikeItem ? undefined : levelDisplay],
          ["Caliber", item.caliber],
          ["Ammo Type", item.ammoType],
          ["Armor Class", item.armorClass],
          ["Weight", item.weight],
        ])}
      </div>
    );

    const categoryStatPairs: Array<[string, React.ReactNode | undefined | null | false]> = isWeapons
      ? [
          ["Type", item.type],
          ["Suitable Classes", item.weaponClasses?.length ? item.weaponClasses.join(", ") : undefined],
          ["Caliber", item.caliber],
          ["Damage", displayDamage(item)],
          ["AP", item.apPiercing],
          ["Critical Hit Chance", item.critChance !== undefined ? `x${item.critChance}` : undefined],
          ["Effective Range", item.effectiveRange !== undefined ? `${item.effectiveRange} m` : undefined],
          ["Magazine", item.magazine !== undefined ? item.magazine : undefined],
          ["Accuracy / MOA", item.moa !== undefined ? item.moa : undefined],
          ["Weight", item.weight],
          ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
          ["Base Price", item.basePriceTokens !== undefined ? formatTokenPrice(item.basePriceTokens) : undefined],
          ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
          ["Attachment Recoil Multiplier", item.weaponAttachmentRecoilMultiplier !== undefined ? item.weaponAttachmentRecoilMultiplier : undefined],
          ["Attachment Damage Multiplier", item.weaponAttachmentDamageMultiplier !== undefined ? item.weaponAttachmentDamageMultiplier : undefined],
          ["Attachment Accuracy Multiplier", item.weaponAttachmentAccuracyMultiplier !== undefined ? item.weaponAttachmentAccuracyMultiplier : undefined],
        ]
      : isAmmoLikeItem
      ? [
          ["Caliber", item.caliber],
          ["Ammo Type", item.ammoType],
          ["Projectile Type", item.projectileType],
          ["Projectile Count", item.projectileCount !== undefined ? item.projectileCount : undefined],
          ["Damage", displayDamage(item)],
          ["AP", item.apPiercing],
          ["Accuracy / MOA", item.moa !== undefined ? item.moa : undefined],
          ["Weight", item.weight],
          ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
          ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
          ["Initial Velocity", item.initialVelocity !== undefined ? item.initialVelocity : undefined],
          ["Destroy Velocity", item.destroyVelocity !== undefined ? item.destroyVelocity : undefined],
          ["PVP Damage Multiplier", item.pvpDamageMultiplier !== undefined ? item.pvpDamageMultiplier : undefined],
          ["PVE Damage Multiplier", item.pveDamageMultiplier !== undefined ? item.pveDamageMultiplier : undefined],
          ["Robot Damage Multiplier", item.robotDamageMultiplier !== undefined ? item.robotDamageMultiplier : undefined],
          ["PVP AP Multiplier", item.pvpArmorPiercingMultiplier !== undefined ? item.pvpArmorPiercingMultiplier : undefined],
          ["PVE AP Multiplier", item.pveArmorPiercingMultiplier !== undefined ? item.pveArmorPiercingMultiplier : undefined],
          ["Robot AP Multiplier", item.robotArmorPiercingMultiplier !== undefined ? item.robotArmorPiercingMultiplier : undefined],
          ["Condition Delta Multiplier", item.conditionDeltaMultiplier !== undefined ? item.conditionDeltaMultiplier : undefined],
          ["Spawn Tracer", item.spawnTracer !== undefined ? (item.spawnTracer ? "Yes" : "No") : undefined],
          ["Spawn Tracer Chance", item.spawnTracerChance !== undefined ? `${item.spawnTracerChance}%` : undefined],
          ["Account Inventory", isPremium ? (canBeTakenIntoAccountInventory(item) ? "Can be taken" : "No") : undefined],
        ]
      : isArmor
      ? [
          ["Type", item.type],
          ["Armor Class", item.armorClass],
          ["Armor", item.armorDisplay],
          ["Armor Min", item.armorMin !== undefined ? item.armorMin : undefined],
          ["Armor Max", item.armorMax !== undefined ? item.armorMax : undefined],
          ["Front Plate", item.haveFrontPlate !== undefined ? (item.haveFrontPlate ? "Yes" : "No") : undefined],
          ["Acceptable Front Plates", item.frontPlates],
          ["Back Plate", item.haveBackPlate !== undefined ? (item.haveBackPlate ? "Yes" : "No") : undefined],
          ["Acceptable Back Plates", item.backPlates],
          ["Cover Arms", item.coverArms !== undefined ? (item.coverArms ? "Yes" : "No") : undefined],
          ["Monster Armor Multiplier", item.monsterArmorMultiplier !== undefined ? item.monsterArmorMultiplier : undefined],
          ["Arms Armor Multiplier", item.armsArmorMultiplier !== undefined ? item.armsArmorMultiplier : undefined],
          ["Condition", item.condition !== undefined ? item.condition : undefined],
          ["Condition Delta", item.conditionDelta !== undefined ? item.conditionDelta : undefined],
          ["Weight", item.weight],
          ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
          ["Base Price", item.basePriceTokens !== undefined ? formatTokenPrice(item.basePriceTokens) : undefined],
          ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
          ["Can Be Customized", item.canBeCustomized !== undefined ? (item.canBeCustomized ? "Yes" : "No") : undefined],
          ["Can Be Camouflaged", item.canBeCamouflaged !== undefined ? (item.canBeCamouflaged ? "Yes" : "No") : undefined],
          ["Can Be Placed On Commission", item.canBePlacedOnCommission !== undefined ? (item.canBePlacedOnCommission ? "Yes" : "No") : undefined],
          ["Can Transfer To Steam", item.canTransferToSteam !== undefined ? (item.canTransferToSteam ? "Yes" : "No") : undefined],
        ]
      : isMedicine
      ? [
          ["Type", item.type],
          ["Weight", item.weight],
          ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
          ["Base Price", item.basePriceTokens !== undefined ? formatTokenPrice(item.basePriceTokens) : undefined],
          ["Total Duration", item.totalDuration !== undefined ? `${item.totalDuration}s` : undefined],
          ["Experience Per Use", item.experience !== undefined ? item.experience : undefined],
          ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
          ["Medicine Effects", item.medicineEffects?.length ? item.medicineEffects.join(", ") : undefined],
          ["Character Effects", item.characterEffects?.length ? item.characterEffects.join(", ") : undefined],
          ["Can Be United", item.canBeUnited !== undefined ? (item.canBeUnited ? "Yes" : "No") : undefined],
          ["Can Be Placed On Commission", item.canBePlacedOnCommission !== undefined ? (item.canBePlacedOnCommission ? "Yes" : "No") : undefined],
          ["Can Transfer To Steam", item.canTransferToSteam !== undefined ? (item.canTransferToSteam ? "Yes" : "No") : undefined],
        ]
      : isBestiary
      ? [
          ["Monster ID", item.rawMonsterId],
          ["Health", item.health !== undefined ? item.health : undefined],
          ["Health Per Level", item.healthPerLevel !== undefined ? item.healthPerLevel : undefined],
          ["Damage", item.damageDisplay || displayDamage(item)],
          ["Min Damage", item.minDamage !== undefined ? item.minDamage : undefined],
          ["Max Damage", item.maxDamage !== undefined ? item.maxDamage : undefined],
          ["Armor", item.armorSummary || item.armorDisplay],
          ["Armor Per Level", item.armorPerLevelSummary],
          ["Regeneration", item.regeneration],
          ["Regeneration Delay", item.regenerateHealthDelay !== undefined ? `${item.regenerateHealthDelay}s` : undefined],
          ["Regeneration Rate", item.regenerateHealthRate !== undefined ? `${item.regenerateHealthRate} HP/s` : undefined],
          ["Level Range", item.minLevel !== undefined && item.maxLevel !== undefined ? `${item.minLevel}–${item.maxLevel}` : undefined],
          ["Danger Multiplier", item.dangerLevelMultiplier !== undefined ? item.dangerLevelMultiplier : undefined],
          ["Experience For Kill", item.experienceForKill !== undefined ? item.experienceForKill : undefined],
          ["Mass", item.massInKg !== undefined ? `${item.massInKg} kg` : undefined],
          ["Causing Effects", item.causingEffects?.length ? item.causingEffects.join(", ") : undefined],
        ]
      : isAchievements
      ? [
          ["Name", item.name],
          ["Description", item.detail],
          ["Rarity", item.achievementRarity],
          ["Hidden", item.achievementHidden !== undefined ? (item.achievementHidden ? "Yes" : "No") : undefined],
          ["Required Value", item.achievementValue !== undefined ? item.achievementValue : undefined],
          ["Statistics Parameter ID", item.statisticsParameterID !== undefined ? item.statisticsParameterID : undefined],
          ["Incomplete Icon", item.imageDesc],
          ["Completed Icon", item.earnedImageDesc],
        ]
      : isCrafting
      ? [
          ["Crafting Station", item.craftingStation],
          ["Crafting Module", item.craftingModule],
          ["Map Locations", item.locations?.length ? item.locations.join(", ") : undefined],
          ["Required", formatCraftingParts(item.craftingRequiredImages, 99)],
          ["Result", formatCraftingParts(item.craftingResultImages, 99)],
          ["Required Folder", item.requiredImageFolder],
          ["Result Folder", item.resultImageFolder],
          ["Required Items", item.craftingRequiredImages?.length ? item.craftingRequiredImages.length : undefined],
          ["Result Items", item.craftingResultImages?.length ? item.craftingResultImages.length : undefined],
        ]
      : [
          ["Price", priceValue ? formatTokenPrice(priceValue) : undefined],
          ["Base Price", item.basePriceTokens !== undefined ? formatTokenPrice(item.basePriceTokens) : undefined],
          ["Sell Price", item.sellingPriceTokens !== undefined ? formatTokenPrice(item.sellingPriceTokens) : undefined],
          ["Weight", item.weight],
          ["Drop Chance", item.dropChance !== undefined ? `${item.dropChance}%` : undefined],
          ["Crafting Station", item.craftingStation],
          ["Craft Experience", item.craftExperience !== undefined ? item.craftExperience : undefined],
          ["Survival Experience", item.survivalExperience !== undefined ? item.survivalExperience : undefined],
          ["Experience", item.experience !== undefined ? item.experience : undefined],
        ];

    const statRows = rows(categoryStatPairs);
    if (statRows.length) {
      const statTitle = isWeapons
        ? "Weapon properties"
        : isAmmoLikeItem
        ? "Ammo properties"
        : isArmor
        ? "Armor properties"
        : isMedicine
        ? "Medicine properties"
        : isBestiary
        ? "Monster properties"
        : isAchievements
        ? "Achievement details"
        : "Important stats";
      sections.push(<div className="info-section" key="stats"><h3>{statTitle}</h3>{statRows}</div>);
    }

    const requirementRows = rows([
      ["Suitable Classes", item.weaponClasses?.length ? item.weaponClasses.join(", ") : undefined],
      ["Item Parameters", item.itemParameters],
      ["Armor Parameters", item.armorParameters],
      ["Faction", item.faction],
      ["Faction Technologies Level", item.factionTechnologiesLevel !== undefined ? item.factionTechnologiesLevel : undefined],
    ]);
    if (requirementRows.length) sections.push(<div className="info-section" key="requirements"><h3>Requirements / Parameters</h3>{requirementRows}</div>);

    if (isCrafting) {
      sections.push(
        <div className="info-section crafting-recipe-board" key="crafting-recipe-images">
          <h3>Recipe images</h3>
          <div className="crafting-recipe-media-group">
            <div>
              <h4>Required</h4>
              {renderCraftingImageStrip(item.craftingRequiredImages, "◇")}
            </div>
            <div>
              <h4>Result</h4>
              {renderCraftingImageStrip(item.craftingResultImages, "◆")}
            </div>
          </div>
        </div>
      );
    }

    if (isWeapons && item.weaponSkins?.length) {
      sections.push(
        <div className="info-section weapon-skins-board" key="weapon-skins">
          <h3>Weapon skins</h3>
          <div className="weapon-skins-grid">
            {item.weaponSkins.map((skin, index) => (
              <div className="weapon-skin-card" key={`${skin.name}-${index}`}>
                <ProjectImage
                  item={skin as BaseItem}
                  category="weapons"
                  className="weapon-skin-image"
                  placeholderClassName="weapon-skin-image-placeholder"
                />
                <div className="weapon-skin-info">
                  <strong>{skin.displayName || skin.name}</strong>
                  <span>{skin.type || "Weapon Skin"}</span>
                  {skin.imageDesc && <small>{skin.imageDesc}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if ((isWeapons || isAmmoLikeItem || isArmor || isMedicine || isBestiary) && item.parametersStats?.length) {
      const propertiesBoardTitle = isBestiary ? "All monster properties" : isAmmoLikeItem ? "All ammo properties" : isArmor ? "All armor properties" : isMedicine ? "All medicine properties" : "All weapon properties";
      sections.push(
        <div className="info-section weapon-properties-board" key={isBestiary ? "monster-properties" : isAmmoLikeItem ? "ammo-properties" : isArmor ? "armor-properties" : isMedicine ? "medicine-properties" : "weapon-properties"}>
          <h3>{propertiesBoardTitle}</h3>
          {item.parametersStats.map((entry, index) => {
            const [label, ...rest] = String(entry).split(": ");
            const value = rest.join(": ");
            return (
              <div className="info-row" key={`${label}-${index}`}>
                <span>{label || `Property ${index + 1}`}</span>
                <strong>{value || entry}</strong>
              </div>
            );
          })}
        </div>
      );
    }

    const sourceRows = rows([
      ["Vendors", item.vendors?.length ? item.vendors.join(", ") : undefined],
      ["Locations", item.locations?.length ? item.locations.join(", ") : undefined],
      ["Item Pickup Class", item.itemPickupClass],
      ["Male Body Mesh", item.maleCharacterBodyMesh],
      ["Female Body Mesh", item.femaleCharacterBodyMesh],
      ["Preview Mesh", item.characterClothesPreviewMesh],
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
    { key: "Items", label: "All Items", icon: "fa-gem" },
    { key: "weapons", label: "Weapons", icon: "fa-crosshairs" },
    { key: "ammo", label: "Ammo", icon: "fa-bullseye" },
    { key: "armor", label: "Armor", icon: "fa-shield-alt" },
    { key: "medicine", label: "Medicine", icon: "fa-kit-medical" },
    { key: "crafting", label: "Crafting Recipes", icon: "fa-hammer" },
    { key: "premium", label: "Premium Items", icon: "fa-crown" },
    { key: "achievements", label: "Achievements", icon: "fa-trophy" },
  ];

  const sidebarSections: Array<{
    label?: string;
    icon?: string;
    children: { key: CategoryKey; label: string; icon: string }[];
  }> = [
    {
      children: [
        { key: "general", label: "General Info", icon: "fa-info-circle" },
        { key: "guides", label: "Guides", icon: "fa-book-open" },
      ],
    },
    {
      label: "Database",
      icon: "fa-database",
      children: [
        { key: "Items", label: "All Items", icon: "fa-border-all" },
        { key: "premium", label: "Premium Items", icon: "fa-crown" },
        { key: "bestiary", label: "Bestiary", icon: "fa-skull" },
        { key: "weapons", label: "Weapons", icon: "fa-crosshairs" },
        { key: "ammo", label: "Ammo", icon: "fa-bullseye" },
        { key: "armor", label: "Armor", icon: "fa-shield-alt" },
        { key: "medicine", label: "Medicine", icon: "fa-kit-medical" },
        { key: "crafting", label: "Crafting Recipes", icon: "fa-hammer" },
        { key: "achievements", label: "Achievements", icon: "fa-trophy" },
      ],
    },
  ];

  const toggleSidebarSection = (label: string) => {
    setExpandedSidebarSections((previous) => ({
      ...previous,
      [label]: !(previous[label] ?? true),
    }));
  };

  const isSidebarSectionExpanded = (label?: string) => {
    if (!label) return true;
    return expandedSidebarSections[label] ?? true;
  };

  const currentCategoryLabel = categories.find(c => c.key === currentCategory)?.label || "Database";

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
                  {availableSources.map(v => <option key={v} value={v}>{v}</option>)}
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
        {isAchievements && (
          <div className="form-row">
            <div className="form-field">
              <label>Achievement Rarity</label>
              <select value={editFormData.achievementRarity || "Common"} onChange={e => setEditFormData({ ...editFormData, achievementRarity: e.target.value as AchievementRarity })}>
                {achievementRarityOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        )}


        {/* Vendors - multi-select for all non‑general categories except crafting recipes */}
        {!isGeneral && !isCrafting && (
          <div className="form-field">
            <label>Vendors</label>
            <select multiple value={editFormData.vendors || []} onChange={e => setEditFormData({ ...editFormData, vendors: Array.from(e.target.selectedOptions, o => o.value) })}>
              {availableSources.map(v => <option key={v} value={v}>{v}</option>)}
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

        {(isItems || isPremium || isArmor || isMedicine) && (
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
              {(isItems || isPremium || isArmor || isMedicine) && (
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
          <>
            <div className="form-row">
              <div className="form-field">
                <label>Crafting Station</label>
                <select
                  value={editFormData.craftingStation || ""}
                  onChange={e => {
                    const next = { ...editFormData, craftingStation: e.target.value, requiredImageFolder: "", resultImageFolder: "" };
                    setEditFormData({
                      ...next,
                      requiredImageFolder: `/db-assets/${buildCraftingAssetFolder(next, "Required")}`,
                      resultImageFolder: `/db-assets/${buildCraftingAssetFolder(next, "Result")}`,
                    });
                  }}
                >
                  <option value="">Select station</option>
                  {craftingStationOptions.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Crafting Module</label>
                <input
                  type="text"
                  placeholder="Module name"
                  value={editFormData.craftingModule || "General"}
                  onChange={e => {
                    const next = { ...editFormData, craftingModule: e.target.value || "General", requiredImageFolder: "", resultImageFolder: "" };
                    setEditFormData({
                      ...next,
                      requiredImageFolder: `/db-assets/${buildCraftingAssetFolder(next, "Required")}`,
                      resultImageFolder: `/db-assets/${buildCraftingAssetFolder(next, "Result")}`,
                    });
                  }}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Map Locations</label>
                <select multiple value={editFormData.locations || []} onChange={e => setEditFormData({ ...editFormData, locations: Array.from(e.target.selectedOptions, o => o.value) })}>
                  {craftingLocationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
              <div className="form-field">
                <label>Recipe Asset Folders</label>
                <input type="text" readOnly value={`/db-assets/${buildCraftingAssetFolder(editFormData, "Required")}`} />
                <input type="text" readOnly value={`/db-assets/${buildCraftingAssetFolder(editFormData, "Result")}`} style={{ marginTop: 8 }} />
                <small>Images upload into the flattened Station - Recipe Required or Result folder.</small>
              </div>
            </div>

            <div className="form-field crafting-image-editor">
              <label>Required Images</label>
              <div className="crafting-image-editor-grid">
                {(editFormData.craftingRequiredImages || []).map((img, imageIndex) => (
                  <div className="crafting-edit-image-card" key={`required-${imageIndex}`}>
                    <ProjectImage item={{ imageUrl: img.imageUrl, imageDesc: img.imageDesc, name: img.name } as BaseItem} category="crafting" className="crafting-edit-preview" placeholderClassName="crafting-edit-placeholder" />
                    <input type="text" placeholder="Ingredient name" value={img.name || ""} onChange={e => updateCraftingImageEntry("Required", imageIndex, { name: e.target.value })} />
                    <input type="text" placeholder="Quantity, e.g. 0/1" value={img.quantity || ""} onChange={e => updateCraftingImageEntry("Required", imageIndex, { quantity: e.target.value })} />
                    <input type="text" placeholder="Image path" value={img.imageUrl || ""} onChange={e => updateCraftingImageEntry("Required", imageIndex, { imageUrl: normalizeProjectImagePath(e.target.value) })} />
                    <div className="crafting-edit-actions">
                      <label className="upload-btn small-upload">
                        Upload
                        <input type="file" accept="image/*" onChange={e => handleCraftingRecipeImageUpload(e, "Required", imageIndex)} style={{ display: "none" }} />
                      </label>
                      <button type="button" className="remove-image-btn" onClick={() => removeCraftingImageEntry("Required", imageIndex)}>Remove</button>
                    </div>
                  </div>
                ))}
                <label className="crafting-add-image-card">
                  <i className="fas fa-plus"></i>
                  <span>Add Required Image</span>
                  <input type="file" accept="image/*" onChange={e => handleCraftingRecipeImageUpload(e, "Required")} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div className="form-field crafting-image-editor">
              <label>Result Images</label>
              <div className="crafting-image-editor-grid">
                {(editFormData.craftingResultImages || []).map((img, imageIndex) => (
                  <div className="crafting-edit-image-card" key={`result-${imageIndex}`}>
                    <ProjectImage item={{ imageUrl: img.imageUrl, imageDesc: img.imageDesc, name: img.name } as BaseItem} category="crafting" className="crafting-edit-preview" placeholderClassName="crafting-edit-placeholder" />
                    <input type="text" placeholder="Result name" value={img.name || ""} onChange={e => updateCraftingImageEntry("Result", imageIndex, { name: e.target.value })} />
                    <input type="text" placeholder="Quantity, e.g. 1" value={img.quantity || ""} onChange={e => updateCraftingImageEntry("Result", imageIndex, { quantity: e.target.value })} />
                    <input type="text" placeholder="Image path" value={img.imageUrl || ""} onChange={e => updateCraftingImageEntry("Result", imageIndex, { imageUrl: normalizeProjectImagePath(e.target.value) })} />
                    <div className="crafting-edit-actions">
                      <label className="upload-btn small-upload">
                        Upload
                        <input type="file" accept="image/*" onChange={e => handleCraftingRecipeImageUpload(e, "Result", imageIndex)} style={{ display: "none" }} />
                      </label>
                      <button type="button" className="remove-image-btn" onClick={() => removeCraftingImageEntry("Result", imageIndex)}>Remove</button>
                    </div>
                  </div>
                ))}
                <label className="crafting-add-image-card result-add-card">
                  <i className="fas fa-plus"></i>
                  <span>Add Result Image</span>
                  <input type="file" accept="image/*" onChange={e => handleCraftingRecipeImageUpload(e, "Result")} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          </>
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

  // Loading screen

  const getCraftingRecipeOrder = (item?: BaseItem | null) => {
    const orderLine = item?.parametersStats?.find((line) => /^Recipe order:/i.test(line));
    const order = orderLine?.match(/Recipe order:\s*(\d+)/i)?.[1];
    return order ? parseInt(order, 10) : 9999;
  };

  const getCraftingIcon = (name?: string) => {
    const normalized = normalizeFilterText(name || "");
    if (normalized.includes("campfire")) return "🔥";
    if (normalized.includes("lockpick blanks")) return "〽";
    if (normalized.includes("lockpick")) return "🗝️";
    if (normalized.includes("lead") || normalized.includes("battery")) return "🔋";
    if (normalized.includes("map")) return "🗺️";
    if (normalized.includes("pharmacist")) return "💊";
    if (normalized.includes("smoke")) return "🧯";
    if (normalized.includes("gas grenade")) return "🧪";
    if (normalized.includes("leather")) return "🟫";
    if (normalized.includes("cloth")) return "🧵";
    if (normalized.includes("shell")) return "🦴";
    if (normalized.includes("ammo")) return "✹";
    if (normalized.includes("furnace") || normalized.includes("metal")) return "⚙️";
    return "◇";
  };

  const getCraftingIngredientSlots = (item?: BaseItem | null) => {
    const normalized = normalizeFilterText(item?.name || "");
    const baseSlots = [
      { name: "Scrap parts", type: "Component", qty: "0/2", icon: "⚙️", desc: "General crafting component used by this recipe." },
      { name: "Tool kit", type: "Tool", qty: "0/1", icon: "🧰", desc: "Required tool or workstation support for this recipe." },
    ];

    if (normalized.includes("campfire")) {
      return [
        { name: "Branches", type: "Component", qty: "0/5", icon: "🪵", desc: "Dry branches used as fuel and structure for the fire." },
        { name: "Rag", type: "Component", qty: "0/2", icon: "🧻", desc: "A dirty piece of cloth. Can be used as tinder when starting a fire." },
        { name: "Tin can", type: "Component", qty: "0/1", icon: "🥫", desc: "Small metal container used as part of the kit." },
        { name: "Matches", type: "Component", qty: "0/1", icon: "📦", desc: "Ignition source needed to light the campfire." },
      ];
    }
    if (normalized.includes("lockpick blanks")) {
      return [
        { name: "Metal scrap", type: "Component", qty: "0/2", icon: "⚙️", desc: "Thin metal pieces suitable for shaping into blanks." },
        { name: "File", type: "Tool", qty: "0/1", icon: "🔧", desc: "Tool used to shape the metal into lockpick blanks." },
      ];
    }
    if (normalized.includes("lockpick")) {
      return [
        { name: "Lockpick blanks", type: "Component", qty: "0/1", icon: "〽", desc: "Prepared blank used to create a working lockpick." },
        { name: "Wire", type: "Component", qty: "0/1", icon: "➰", desc: "Small wire used to finish the lockpick." },
      ];
    }
    if (normalized.includes("lead") || normalized.includes("battery")) {
      return [
        { name: "Battery", type: "Material", qty: "0/1", icon: "🔋", desc: "Battery source used to extract lead." },
        { name: "Heat source", type: "Station", qty: "0/1", icon: "🔥", desc: "Processing heat from the required station." },
      ];
    }
    if (normalized.includes("grenade")) {
      return [
        { name: "Casing", type: "Component", qty: "0/1", icon: "🥫", desc: "Metal casing used as the grenade body." },
        { name: "Chemical mix", type: "Component", qty: "0/2", icon: "🧪", desc: "Chemical ingredient used by this grenade recipe." },
        { name: "Fuse", type: "Component", qty: "0/1", icon: "🧨", desc: "Ignition/fuse element needed to activate the item." },
      ];
    }
    if (normalized.includes("map")) {
      return [
        { name: "Map fragment", type: "Document", qty: "0/3", icon: "🗺️", desc: "Map pieces combined into a complete strange map." },
        { name: "Glue", type: "Component", qty: "0/1", icon: "🧴", desc: "Used to combine fragments cleanly." },
      ];
    }
    return baseSlots;
  };

  const selectedCraftingRecipe = selectedCraftingItem && filteredAndSortedData.includes(selectedCraftingItem)
    ? selectedCraftingItem
    : filteredAndSortedData[0] || null;

  const selectedCraftingIngredients = getCraftingIngredientSlots(selectedCraftingRecipe);

  useEffect(() => {
    if (!isCrafting) return;
    if (!selectedCraftingItem || !filteredAndSortedData.includes(selectedCraftingItem)) {
      setSelectedCraftingItem(filteredAndSortedData[0] || null);
      setActiveCraftingSlot(null);
    }
  }, [isCrafting, filteredAndSortedData, selectedCraftingItem]);

  if (!mounted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100vh",
        background: "#000000", fontFamily: "Inter, sans-serif", gap: 24,
        userSelect: "none",
      }}>
        <style>{`
          @keyframes wtlo-bar {
            0% { width: 0%; }
            60% { width: 75%; }
            100% { width: 100%; }
          }
          .wtlo-bar-anim {
            animation: wtlo-bar 1.1s cubic-bezier(0.4,0,0.2,1) forwards;
          }
          .crafting-image-editor {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.025);
        }
        .crafting-image-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 8px;
        }
        .crafting-edit-image-card, .crafting-add-image-card {
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .crafting-add-image-card {
          align-items: center;
          justify-content: center;
          min-height: 220px;
          color: var(--accent);
          cursor: pointer;
          border-style: dashed;
          text-align: center;
        }
        .crafting-add-image-card:hover {
          background: rgba(255, 193, 7, 0.08);
          border-color: var(--accent);
        }
        .crafting-edit-preview, .crafting-edit-placeholder {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          align-self: center;
        }
        .crafting-edit-actions {
          display: flex;
          gap: 8px;
        }
        .small-upload, .remove-image-btn {
          flex: 1;
          justify-content: center;
          text-align: center;
          padding: 8px 10px;
          border-radius: 8px;
        }
        .remove-image-btn {
          border: 1px solid rgba(255, 80, 80, 0.35);
          background: rgba(255, 80, 80, 0.08);
          color: #ff8a8a;
          cursor: pointer;
        }
        .thumbnail-actions .upload, .list-actions .upload {
          color: var(--accent);
        }
        `}
      </style>
        <img
          src="/wtlo-logo.png"
          alt="WTLO"
          style={{ width: 90, height: 90, objectFit: "contain", borderRadius: "50%" }}
        />
        <div style={{ textAlign: "center", lineHeight: 1.4 }}>
          <div style={{ color: "#e8b84b", fontWeight: 800, fontSize: "1.35rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>WTLO Knowledge Base</div>
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
        .sidebar-nav { list-style: none; padding: 4px 10px; flex: 1; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
        .sidebar-nav, .sidebar-section-list { margin: 0; }
        .sidebar-section { list-style: none; }
        .sidebar-section-plain { margin-bottom: 2px; }
        .sidebar-section-title {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 6px 0 4px;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: rgba(255, 193, 7, 0.06);
          color: var(--accent);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sidebar-section-title:hover { background: var(--accent-bg); border-color: var(--accent); }
        .sidebar-section-title span { display: flex; align-items: center; gap: 10px; }
        .sidebar-section-title .section-chevron {
          width: 16px;
          text-align: center;
          transition: transform var(--transition-fast);
        }
        .sidebar-section-title[aria-expanded="false"] .section-chevron { transform: rotate(-90deg); }
        .sidebar-section-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-section-list.collapsed { display: none; }
        .sidebar-section:not(.sidebar-section-plain) .sidebar-section-list {
          padding-left: 10px;
          margin-left: 8px;
          border-left: 1px solid var(--border-color);
        }
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
        .sidebar-nav li.premium-nav-child { margin-left: 0; }
        .sidebar-nav li.premium-nav-child .premium-nav-link {
          color: #d7b255;
          border-color: transparent;
        }
        .sidebar-nav li.premium-nav-child .premium-nav-link:hover {
          background: rgba(255, 193, 7, 0.10);
          color: #ffd86b;
          border-color: rgba(255, 193, 7, 0.55);
          box-shadow: 0 0 14px rgba(255, 193, 7, 0.18), inset 3px 0 0 rgba(255, 193, 7, 0.75);
        }
        .sidebar-nav li.premium-nav-child .premium-nav-link.active {
          background: rgba(255, 193, 7, 0.14);
          color: var(--accent);
          border-color: rgba(255, 193, 7, 0.75);
          box-shadow: 0 0 16px rgba(255, 193, 7, 0.22), inset 3px 0 0 var(--accent);
        }
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
        .view-mode-control {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
        }
        .view-mode-label {
          padding: 0 7px;
          font-size: 0.62rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .view-mode-btn {
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 700;
          transition: all 0.18s ease;
        }
        .view-mode-btn:hover {
          color: var(--text-primary);
          background: var(--bg-input);
          border-color: var(--border-color);
        }
        .view-mode-btn.active {
          color: var(--accent);
          background: var(--accent-bg);
          border-color: var(--accent);
        }
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
        .crafting-recipes-ui {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 66% 40%, rgba(142,142,142,.22), transparent 34%),
            linear-gradient(90deg, #040404 0%, #111 46%, #050505 100%);
          font-family: "Arial Narrow", "Roboto Condensed", "Inter", sans-serif;
          color: #fff;
          text-shadow: 1px 1px 1px #000;
        }
        .crafting-recipes-shell {
          height: 100%;
          position: relative;
          padding: 8px 22px 18px;
          overflow: hidden;
          background:
            linear-gradient(180deg, rgba(255,255,255,.05), transparent 26%, rgba(0,0,0,.4)),
            repeating-linear-gradient(135deg, rgba(255,255,255,.025) 0 2px, transparent 2px 9px);
        }
        .crafting-recipes-shell::before,
        .crafting-recipes-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .crafting-recipes-shell::before {
          background:
            radial-gradient(ellipse at 74% 50%, rgba(255,255,255,.12), transparent 36%),
            linear-gradient(90deg, rgba(0,0,0,.4), transparent 18%, transparent 70%, rgba(0,0,0,.62));
          opacity: .78;
        }
        .crafting-recipes-shell::after {
          box-shadow: inset 0 0 42px #000, inset 0 22px 32px rgba(0,0,0,.88);
        }
        .crafting-recipes-title {
          position: relative;
          z-index: 1;
          text-align: center;
          margin: 0 0 8px;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 900;
          color: #fff;
          text-shadow: 2px 2px 0 #000, 0 0 4px #000;
        }
        .crafting-recipes-layout {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 118px minmax(290px, 1fr) 330px;
          gap: 10px;
          height: calc(100% - 34px);
          max-width: 1060px;
        }
        .crafting-station-rail {
          min-height: 0;
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.75);
          background: linear-gradient(180deg, rgba(245,245,245,.16), rgba(10,10,10,.64));
          box-shadow: inset 0 0 18px rgba(255,255,255,.08), 0 2px 10px rgba(0,0,0,.65);
        }
        .crafting-station-btn {
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(255,255,255,.42);
          background: linear-gradient(90deg, #111, #252525 62%, #050505);
          color: #fff;
          font-family: inherit;
          text-align: left;
          padding: 7px 6px;
          display: grid;
          grid-template-columns: 22px 1fr;
          gap: 4px;
          cursor: pointer;
          text-shadow: 1px 1px 0 #000;
        }
        .crafting-station-btn:hover,
        .crafting-station-btn.active {
          background: linear-gradient(90deg, #f4f4f4, #9a9a9a 72%, #fff);
          color: #fff;
          box-shadow: inset 0 0 10px rgba(255,255,255,.5);
        }
        .crafting-station-icon { font-size: 16px; line-height: 1; filter: drop-shadow(1px 1px 0 #000); }
        .crafting-station-name { font-size: 13px; font-weight: 900; line-height: 1.05; }
        .crafting-station-count { grid-column: 2; font-size: 10px; opacity: .92; line-height: 1; }
        .crafting-list-panel,
        .crafting-details-panel {
          min-height: 0;
          background: transparent;
          border: 0;
        }
        .crafting-list-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .crafting-list-toolbar {
          display: grid;
          grid-template-columns: 1fr 118px;
          gap: 5px;
          margin-bottom: 6px;
          position: relative;
          z-index: 5;
        }
        .crafting-list-toolbar select,
        .crafting-list-toolbar input,
        .crafting-select,
        .crafting-search {
          height: 25px;
          border: 1px solid rgba(255,255,255,.92);
          border-radius: 0;
          outline: none;
          color: #000;
          background: linear-gradient(90deg, #fff 0%, #ececec 62%, #a9a9a9 100%);
          box-shadow: inset 0 0 10px rgba(0,0,0,.22), 0 1px 0 #000;
          font-size: 14px;
          font-weight: 900;
          padding: 1px 6px;
          font-family: inherit;
          text-shadow: none;
        }
        .crafting-search::placeholder { color: rgba(0,0,0,.42); }
        .crafting-select { appearance: auto; cursor: pointer; padding-right: 0; }
        .crafting-select option { background: #050505; color: #fff; font-weight: 900; font-size: 14px; }
        .crafting-list {
          overflow-y: auto;
          padding-right: 4px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
          align-content: start;
          gap: 7px;
          scrollbar-width: thin;
          scrollbar-color: #f5f5f5 #222;
        }
        .crafting-list::-webkit-scrollbar { width: 10px; }
        .crafting-list::-webkit-scrollbar-track { background: rgba(0,0,0,.55); }
        .crafting-list::-webkit-scrollbar-thumb { background: linear-gradient(#fff,#888); border: 1px solid #111; }
        .crafting-recipe-card {
          min-height: 102px;
          border: 1px solid rgba(255,255,255,.68);
          background:
            linear-gradient(180deg, rgba(235,235,235,.20), rgba(78,78,78,.18) 48%, rgba(0,0,0,.62)),
            linear-gradient(90deg, rgba(255,255,255,.12), transparent 45%);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: space-between;
          padding: 7px;
          font-size: 14px;
          font-weight: 900;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          text-shadow: 1px 1px 1px #000;
          box-shadow: inset 0 0 14px rgba(255,255,255,.08), 0 2px 8px rgba(0,0,0,.65);
        }
        .crafting-recipe-card:hover,
        .crafting-recipe-card.active {
          background:
            linear-gradient(180deg, rgba(255,255,255,.54), rgba(166,166,166,.34) 46%, rgba(0,0,0,.62)),
            linear-gradient(90deg, rgba(255,255,255,.18), transparent 45%);
          border-color: #fff;
          box-shadow: inset 0 0 18px rgba(255,255,255,.22), 0 0 0 1px rgba(255,255,255,.35), 0 3px 10px #000;
        }
        .crafting-card-top { display: flex; align-items: flex-start; gap: 8px; min-width: 0; }
        .crafting-card-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.78);
          background: linear-gradient(135deg, #efefef, #777 62%, #111);
          font-size: 23px;
          filter: drop-shadow(1px 1px 0 #000);
          box-shadow: inset 0 0 8px rgba(255,255,255,.28);
        }
        .crafting-card-name {
          min-width: 0;
          font-size: 15px;
          line-height: 1.05;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .crafting-card-bottom { display: flex; justify-content: space-between; align-items: center; gap: 4px; margin-top: 8px; }
        .crafting-card-station,
        .crafting-card-action {
          border: 1px solid rgba(255,255,255,.5);
          background: rgba(0,0,0,.44);
          padding: 2px 5px;
          font-size: 10px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }
        .crafting-card-action { opacity: .88; }
        .crafting-details-panel {
          position: relative;
          padding: 10px 12px;
          overflow: hidden;
          color: #fff;
          border: 1px solid rgba(255,255,255,.68);
          background: linear-gradient(180deg, rgba(18,18,18,.72), rgba(0,0,0,.38));
          box-shadow: inset 0 0 18px rgba(255,255,255,.05), 0 3px 12px rgba(0,0,0,.72);
        }
        .crafting-details-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,.08), transparent 44%);
          pointer-events: none;
        }
        .crafting-detail-title {
          position: relative;
          z-index: 1;
          font-size: 22px;
          line-height: 1.1;
          margin: 0 0 8px;
          font-weight: 900;
          color: #fff;
          text-shadow: 2px 2px 0 #000;
        }
        .crafting-detail-meta { position: relative; z-index: 1; display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .crafting-detail-label { display: none; }
        .crafting-detail-value,
        .crafting-detail-pill {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,.58);
          background: rgba(0,0,0,.46);
          padding: 3px 7px;
          font-size: 12px;
          line-height: 1;
          font-weight: 900;
          color: #fff;
        }
        .crafting-detail-desc {
          position: relative;
          z-index: 1;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 12px;
          color: #fff;
          border-top: 1px dotted rgba(255,255,255,.42);
          border-bottom: 1px dotted rgba(255,255,255,.42);
          padding: 8px 0;
        }
        .crafting-section-heading {
          position: relative;
          z-index: 1;
          font-size: 15px;
          line-height: 1.1;
          font-weight: 900;
          color: #fff;
          margin: 11px 0 6px;
          text-shadow: 2px 2px 0 #000;
        }
        .crafting-slot-grid {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 7px;
        }
        .crafting-slot {
          width: 48px;
          height: 48px;
          border: 1px solid #fff;
          border-radius: 0;
          background: linear-gradient(135deg, #f0f0f0, #8d8d8d 62%, #1b1b1b);
          box-shadow: inset 0 0 10px rgba(255,255,255,.35), 0 1px 0 #000;
          padding: 1px;
          position: relative;
          cursor: pointer;
          color: #fff;
          text-shadow: 1px 1px 0 #000;
        }
        .crafting-slot:hover,
        .crafting-slot.active {
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255,255,255,.96), 0 0 10px rgba(255,255,255,.35), inset 0 0 10px rgba(255,255,255,.45);
          z-index: 3;
        }
        .crafting-slot .crafting-slot-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          background: rgba(0,0,0,.16);
        }
        .crafting-slot-qty {
          position: absolute;
          right: 1px;
          top: 0;
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          text-shadow: 1px 1px 0 #000;
          line-height: 1;
        }
        .crafting-result-slot { width: 52px; height: 52px; }
        .crafting-tooltip {
          position: relative;
          z-index: 3;
          margin-top: 10px;
          width: min(100%, 294px);
          border: 1px solid rgba(255,255,255,.82);
          background: linear-gradient(180deg, rgba(35,35,35,.98), rgba(10,10,10,.98));
          box-shadow: 0 10px 22px rgba(0,0,0,.78), inset 0 0 14px rgba(255,255,255,.06);
          padding: 10px 12px;
          color: #fff;
          text-shadow: 1px 1px 0 #000;
        }
        .crafting-tooltip h4 {
          margin: 0 0 8px;
          font-size: 17px;
          line-height: 1;
          font-weight: 900;
        }
        .crafting-tooltip-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 800;
        }
        .crafting-tooltip-row span { color: #fff; opacity: .92; }
        .crafting-tooltip-row strong { color: #fff; font-weight: 900; }
        .crafting-tooltip-desc {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed rgba(255,255,255,.55);
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }
        .crafting-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 900;
        }
        @media (max-width: 1040px) {
          .crafting-recipes-layout { grid-template-columns: 110px minmax(260px, 1fr); max-width: none; overflow-y: auto; }
          .crafting-details-panel { grid-column: 1 / -1; min-height: 300px; }
        }
        @media (max-width: 720px) {
          .crafting-recipes-layout { grid-template-columns: 1fr; }
          .crafting-station-rail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: visible; }
          .crafting-list-toolbar { grid-template-columns: 1fr; }
        }
        .grid-container {
          flex: 1;
          overflow: auto;
          padding: 20px;
          background: var(--bg-base);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .list-view {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .list-row {
          display: grid;
          grid-template-columns: 74px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          padding: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
        }
        .list-row:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
          box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        }
        .list-image,
        .list-image-placeholder {
          width: 74px;
          height: 74px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          object-fit: contain;
          object-position: center;
          display: block;
          padding: 8px;
          color: var(--text-tertiary);
        }
        .list-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .list-main { min-width: 0; }
        .list-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
          min-width: 0;
        }
        .list-title-row h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .list-type {
          flex: 0 0 auto;
          color: var(--accent);
          background: var(--accent-bg);
          border: 1px solid rgba(201, 162, 59, 0.35);
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 0.65rem;
          font-weight: 700;
        }
        .list-description {
          margin: 0 0 7px;
          color: var(--text-secondary);
          font-size: 0.76rem;
          line-height: 1.35;
          max-height: 2.7em;
          overflow: hidden;
        }
        .list-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          color: var(--text-tertiary);
          font-size: 0.68rem;
        }
        .list-meta strong { color: var(--text-secondary); }
        .crafting-list-summary {
          display: grid;
          gap: 4px;
          margin: 6px 0 8px;
          color: var(--text-secondary);
          font-size: 0.72rem;
          line-height: 1.35;
        }
        .crafting-list-summary strong,
        .crafting-card-summary strong { color: var(--accent); }
        .crafting-card-summary {
          margin-top: 10px;
          padding: 8px 9px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: rgba(0, 0, 0, 0.18);
          font-size: 0.68rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }
        .crafting-card-summary p { margin: 0 0 5px; }
        .crafting-card-summary p:last-child { margin-bottom: 0; }
        .crafting-image-method {
          position: relative;
          z-index: 2;
          font-size: .55rem;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.05;
        }
        .list-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .list-actions button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.58);
          color: var(--text-primary);
          cursor: pointer;
        }
        .list-actions button:hover { border-color: var(--accent); color: var(--accent); }
        .list-actions button.edit:hover { border-color: var(--accent); color: var(--accent); }
        .list-actions button.upload-image:hover { border-color: #58d68d; color: #58d68d; }
        .list-actions button.delete:hover { border-color: #b84c3b; color: #ff7768; }
        .card {
          position: relative;
          min-height: 420px;
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
          border-color: var(--accent);
        }
        .card-image {
          width: 100%;
          height: 170px;
          object-fit: contain;
          object-position: center;
          display: block;
          background: var(--bg-elevated);
          padding: 14px;
          border-bottom: 1px solid var(--border-color);
        }
        .card-image-placeholder {
          width: 100%;
          height: 170px;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 2rem;
          border-bottom: 1px solid var(--border-color);
        }
        .crafting-image-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
          width: 100%;
        }
        .crafting-image-slot {
          width: 82px;
          min-height: 94px;
          border: 1px solid var(--border-color);
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          padding: 6px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          overflow: hidden;
        }
        .crafting-image-slot img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          position: relative;
          z-index: 2;
        }
        .crafting-image-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 1.5rem;
          opacity: .65;
        }
        .crafting-image-slot strong {
          font-size: .62rem;
          line-height: 1.1;
          color: var(--text-secondary);
          text-align: center;
          word-break: break-word;
          position: relative;
          z-index: 2;
        }
        .crafting-image-slot em {
          position: absolute;
          top: 4px;
          right: 5px;
          color: var(--accent);
          font-size: .65rem;
          font-style: normal;
          z-index: 3;
        }
        .crafting-image-empty { color: var(--text-tertiary); font-size: .78rem; }
        .recipe-media-detail { display: block; }
        .crafting-recipe-board { grid-column: 1 / -1; }
        .crafting-recipe-media-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
        .crafting-recipe-media-group h4 { margin: 0 0 6px; color: var(--accent); text-transform: uppercase; font-size: .78rem; letter-spacing: .08em; }
        .achievement-image-hover {
          position: relative;
          display: block;
          overflow: hidden;
        }
        .achievement-image-hover .achievement-image-earned {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.18s ease, transform 0.18s ease, filter 0.18s ease;
          transform: scale(0.96);
          pointer-events: none;
        }
        .achievement-image-hover:hover .achievement-image-earned {
          opacity: 1;
          transform: scale(1);
          filter: drop-shadow(0 0 10px rgba(201, 162, 59, 0.55));
        }
        .achievement-image-hover:hover .achievement-image-base {
          opacity: 0.18;
          filter: grayscale(1);
        }

        .weapon-card-content {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .weapon-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .weapon-card-header h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1rem;
          line-height: 1.2;
        }
        .weapon-card-header span {
          flex: 0 0 auto;
          border: 1px solid rgba(201, 162, 59, 0.35);
          color: var(--accent);
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 0.62rem;
          background: var(--accent-bg);
        }
        .weapon-card-footer {
          margin-top: auto;
          color: var(--text-tertiary);
          font-size: 0.72rem;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
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
        .token-price {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 5px;
          vertical-align: middle;
          white-space: nowrap;
        }
        .token-icon {
          width: 22px;
          height: 22px;
          object-fit: contain;
          image-rendering: auto;
          filter: drop-shadow(0 0 4px rgba(255, 186, 57, 0.45));
          flex: 0 0 auto;
        }
        .stat-pill .token-price {
          width: 100%;
          justify-content: space-between;
          gap: 6px;
        }
        .stat-pill .token-icon {
          width: 24px;
          height: 24px;
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
        .thumbnail-actions button.edit:hover { border-color: var(--accent); color: var(--accent); }
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

        .weapon-skins-board {
          grid-column: 1 / -1;
        }
        .weapon-skins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .weapon-skin-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .weapon-skin-image,
        .weapon-skin-image-placeholder {
          width: 100%;
          height: 108px;
          object-fit: contain;
          background: var(--bg-base);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          padding: 10px;
        }
        .weapon-skin-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
        }
        .weapon-skin-info strong {
          font-size: 0.86rem;
          color: var(--text-primary);
        }
        .weapon-skin-info span,
        .weapon-skin-info small {
          color: var(--text-tertiary);
          font-size: 0.72rem;
          word-break: break-word;
        }

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
        .modal-buttons button.delete {
          background: transparent;
          border: 1px solid #74352e;
          color: #ff7768;
        }
        .modal-buttons button.delete:hover {
          border-color: #b84c3b;
          color: #ff9a90;
          transform: translateY(-1px);
        }
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
          .view-mode-control { width: 100%; justify-content: space-between; }
          .view-mode-btn { flex: 1; justify-content: center; }
          .list-row { grid-template-columns: 56px minmax(0, 1fr); align-items: start; }
          .list-image, .list-image-placeholder { width: 56px; height: 56px; }
          .list-actions { grid-column: 1 / -1; justify-content: flex-end; }
          .list-title-row { flex-wrap: wrap; }
          .modal { padding: 16px; }
        }

        .crafting-image-editor {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.025);
        }
        .crafting-image-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 8px;
        }
        .crafting-edit-image-card, .crafting-add-image-card {
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .crafting-add-image-card {
          align-items: center;
          justify-content: center;
          min-height: 220px;
          color: var(--accent);
          cursor: pointer;
          border-style: dashed;
          text-align: center;
        }
        .crafting-add-image-card:hover {
          background: rgba(255, 193, 7, 0.08);
          border-color: var(--accent);
        }
        .crafting-edit-preview, .crafting-edit-placeholder {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          align-self: center;
        }
        .crafting-edit-actions {
          display: flex;
          gap: 8px;
        }
        .small-upload, .remove-image-btn {
          flex: 1;
          justify-content: center;
          text-align: center;
          padding: 8px 10px;
          border-radius: 8px;
        }
        .remove-image-btn {
          border: 1px solid rgba(255, 80, 80, 0.35);
          background: rgba(255, 80, 80, 0.08);
          color: #ff8a8a;
          cursor: pointer;
        }
        .thumbnail-actions .upload, .list-actions .upload {
          color: var(--accent);
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
            <div><div className="logo-text">WTLO</div><div className="logo-sub">Knowledge Base</div></div>
          </div>
          <div className="home-nav-item" style={{ padding: "4px 10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-md)", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>
              <i className="fas fa-home"></i> Home
            </Link>
          </div>
          <ul className="sidebar-nav">
            {sidebarSections.map((section, sectionIndex) => {
              const expanded = isSidebarSectionExpanded(section.label);

              return (
                <li key={section.label || `section-${sectionIndex}`} className={section.label ? "sidebar-section" : "sidebar-section sidebar-section-plain"}>
                  {section.label && (
                    <button
                      type="button"
                      className="sidebar-section-title"
                      aria-expanded={expanded}
                      onClick={() => toggleSidebarSection(section.label!)}
                    >
                      <span><i className={`fas ${section.icon}`}></i> {section.label}</span>
                      <i className="fas fa-chevron-down section-chevron"></i>
                    </button>
                  )}
                  <ul className={`sidebar-section-list ${section.label && !expanded ? "collapsed" : ""}`}>
                    {section.children.map((cat) => (
                      <li key={cat.key} className={cat.key === "premium" ? "premium-nav-child" : ""}>
                        <a
                          onClick={() => switchCategory(cat.key)}
                          className={`${currentCategory === cat.key ? "active" : ""} ${cat.key === "premium" ? "premium-nav-link" : ""}`.trim()}
                        >
                          <i className={`fas ${cat.icon}`} style={{ width: "20px" }}></i> {cat.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
          <div className="sidebar-footer"><span>⚡ WTLO-KB 1.0</span><span>{clock}</span></div>
        </aside>

        <div className="main-content">
          <header className="top-header">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}><i className="fas fa-bars"></i></button>
            <span className="breadcrumb">WTLO Knowledge Base <span>›</span> <span>{currentCategoryLabel}</span></span>
          </header>

          <div className="search-filter-area">
            <div className="search-row">
              <div className="search-input-wrap">
                <input id="global-search" type="text" placeholder="Search (Ctrl+K)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <span className="search-icon"><i className="fas fa-search"></i></span>
              </div>
              <button className="btn-reset" onClick={resetAllFilters}><i className="fas fa-undo-alt"></i> Reset</button>
              <button className="btn-reset" onClick={exportDatabaseToFile}><i className="fas fa-file-export"></i> Export React DB</button>
              <div className="view-mode-control" role="group" aria-label="Display view">
                <span className="view-mode-label">View</span>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  title="Grid view"
                >
                  <i className="fas fa-border-all"></i>
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  title="List view"
                >
                  <i className="fas fa-list"></i>
                  <span>List</span>
                </button>
              </div>
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
                    <div className="filter-group"><label>Type</label><select value={weaponTypeFilter} onChange={e => setWeaponTypeFilter(e.target.value)}><option value="">All</option>{WEAPON_FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Caliber</label><select value={weaponCaliberFilter} onChange={e => setWeaponCaliberFilter(e.target.value)}><option value="">All</option>{caliberOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Class</label>
                      <select value={weaponClassFilter} onChange={e => setWeaponClassFilter(e.target.value)}>
                        <option value="">All</option>
                        {weaponClassOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Level</label>
                      <select value={weaponLevelFilter} onChange={e => setWeaponLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value, 10))}>
                        <option value="">All</option>
                        {weaponLevelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || "priceValue"} onChange={e => setSortField(e.target.value || null)}><option value="priceValue">Price</option><option value="dmg">DMG</option><option value="level">Level</option><option value="name">Name</option><option value="caliber">Caliber</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Low → High</option><option value="desc">High → Low</option></select></div>
                  </>
                ) : isAmmo ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={ammoTypeFilter} onChange={e => setAmmoTypeFilter(e.target.value)}><option value="">All</option>{Array.from(new Set([...typeOptionsMap.ammo, ...availableTypes])).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Caliber</label><select value={ammoCaliberFilter} onChange={e => setAmmoCaliberFilter(e.target.value)}><option value="">All</option>{ammoCaliberOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Ammo Type</label><select value={ammoAmmoTypeFilter} onChange={e => setAmmoAmmoTypeFilter(e.target.value)}><option value="">All</option>{ammoTypeFilterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || "priceValue"} onChange={e => setSortField(e.target.value || null)}><option value="priceValue">Price</option><option value="dmg">Damage</option><option value="name">Name</option><option value="caliber">Caliber</option><option value="ammoType">Ammo Type</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Low → High</option><option value="desc">High → Low</option></select></div>
                  </>
                ) : isPremium ? (
                  <>
                    <div className="filter-group"><label>Item name</label><input value={premiumNameFilter} onChange={e => setPremiumNameFilter(e.target.value)} placeholder="Search premium item name" /></div>
                    <div className="filter-group"><label>Premium Category</label><select value={premiumTypeFilter} onChange={e => setPremiumTypeFilter(e.target.value)}><option value="">All</option>{availablePremiumTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Premium Weapon Type</label><select value={premiumWeaponTypeFilter} onChange={e => setPremiumWeaponTypeFilter(e.target.value)}><option value="">All</option>{availablePremiumWeaponTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Premium Ammo Type</label><select value={premiumAmmoTypeFilter} onChange={e => setPremiumAmmoTypeFilter(e.target.value)}><option value="">All</option>{availablePremiumAmmoTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Account Inventory</label><select value={premiumAccountInventoryFilter} onChange={e => setPremiumAccountInventoryFilter(e.target.value)}><option value="">All</option><option value="Yes">Can be taken</option><option value="No">Cannot be taken</option></select></div>
                    <div className="filter-group"><label>Price</label><select value={premiumPriceFilter} onChange={e => setPremiumPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low Price (&lt;1000)</option><option value="High">High Price (≥1000)</option></select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField === "priceValue" ? (sortDirection === "desc" ? "priceHigh" : "priceLow") : (sortField || "")} onChange={e => { const value = e.target.value; if (value === "priceLow") { setSortField("priceValue"); setSortDirection("asc"); } else if (value === "priceHigh") { setSortField("priceValue"); setSortDirection("desc"); } else { setSortField(value || null); } }}><option value="priceLow">Price Low → High</option><option value="priceHigh">Price High → Low</option><option value="name">Item Name</option><option value="type">Item Type</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isItems ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={itemsTypeFilter} onChange={e => setItemsTypeFilter(e.target.value)}><option value="">All</option>{availableTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
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
                        {availableSources.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option><option value="level">Level</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isArmor ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={armorTypeFilter} onChange={e => setArmorTypeFilter(e.target.value)}><option value="">All</option>{Array.from(new Set([...typeOptionsMap.armor, ...availableTypes])).filter(t => !matchesTextFilter(t, "Customization item")).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Level</label>
                      <select value={armorLevelFilter} onChange={e => setArmorLevelFilter(e.target.value === "" ? "" : parseInt(e.target.value))}>
                        <option value="">All</option>
                        {universalLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-group"><label>Price</label><select value={armorPriceFilter} onChange={e => setArmorPriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;2000)</option><option value="High">High (≥2000)</option></select></div>
                    <div className="filter-group"><label>Class</label><select value={armorClassFilter} onChange={e => setArmorClassFilter(e.target.value)}><option value="">All</option>{armorClassOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isMedicine ? (
                  <>
                    <div className="filter-group"><label>Type</label><select value={medicineTypeFilter} onChange={e => setMedicineTypeFilter(e.target.value)}><option value="">All</option>{Array.from(new Set([...typeOptionsMap.medicine, ...availableTypes])).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="filter-group"><label>Price</label><select value={medicinePriceFilter} onChange={e => setMedicinePriceFilter(e.target.value as any)}><option value="">All</option><option value="Low">Low (&lt;500)</option><option value="High">High (≥500)</option></select></div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Price Low → High</option><option value="name">Name</option><option value="priceValue">Price</option></select></div>
                    <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                  </>
                ) : isCrafting ? (
                  <>
                    <div className="filter-group"><label>Station</label><select value={craftingStationFilter} onChange={e => setCraftingStationFilter(e.target.value)}><option value="">All</option>{craftingStationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    <div className="filter-group"><label>Module</label><select value={craftingModuleFilter} onChange={e => setCraftingModuleFilter(e.target.value)}><option value="">All</option>{craftingModuleOptions.map(moduleName => <option key={moduleName} value={moduleName}>{moduleName}</option>)}</select></div>
                    <div className="filter-group"><label>Map Location</label>
                      <select value={craftingLocationFilter} onChange={e => setCraftingLocationFilter(e.target.value)}>
                        <option value="">All</option>
                        {craftingLocationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                    <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">Recipe order</option><option value="name">Name</option><option value="craftingStation">Station</option><option value="craftingModule">Module</option></select></div>
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
                    {currentCategory === "bestiary" ? (
                      <>
                        <div className="filter-group"><label>Sort by</label><select value={sortField || "name"} onChange={e => setSortField(e.target.value || null)}><option value="name">Name</option><option value="health">Health</option></select></div>
                        <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Low → High / A → Z</option><option value="desc">High → Low / Z → A</option></select></div>
                      </>
                    ) : (
                      <>
                        {currentCategory === "characters" && (
                          <div className="filter-group"><label>Body Part</label><select value={characterPartFilter} onChange={e => setCharacterPartFilter(e.target.value)}><option value="">All</option>{characterPartOptions.map(opt => <option key={opt}>{opt}</option>)}</select></div>
                        )}
                        <div className="filter-group"><label>Sort by</label><select value={sortField || ""} onChange={e => setSortField(e.target.value || null)}><option value="">None</option><option value="name">Name</option><option value="level">Level</option></select></div>
                        <div className="filter-group"><label>Direction</label><select value={sortDirection} onChange={e => setSortDirection(e.target.value as any)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
                      </>
                    )}
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
              <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><i className="fas fa-database" style={{ fontSize: "3rem", marginBottom: 12 }}></i><p>No entries in this category.</p></div>
            ) : (
              viewMode === "grid" ? (
                <div className="grid">
                  {filteredAndSortedData.map((item, idx) => (
                    <div key={idx} className="card weapon-stat-card" title={item.name || "Open weapon stats"} onClick={() => openInfoModal(item)}>
                      <ProjectImage
                        item={item}
                        category={currentCategory}
                        className="card-image"
                        placeholderClassName="card-image-placeholder"
                      />
                      <div className="thumbnail-actions item-controls">
                        {canQuickUploadImage && (
                          <button type="button" className="upload" aria-label={`Upload image for ${item.name || "item"}`} title={isCrafting ? "Upload recipe result image" : "Upload image"} onClick={(e) => openQuickImageUpload(item, e)}>
                            <i className="fas fa-cloud-upload-alt"></i>
                          </button>
                        )}
                        <button type="button" className="edit" aria-label={`Edit ${item.name || "item"}`} title="Edit item" onClick={(e) => { e.stopPropagation(); openEditModal(idx); }}>
                          <i className="fas fa-pen"></i>
                        </button>
                        <button type="button" className="delete" aria-label={`Remove ${item.name || "item"}`} title="Remove item" onClick={(e) => { e.stopPropagation(); void deleteItem(idx); }}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="weapon-card-content">
                        <div className="weapon-card-header">
                          <h3>{item.name || (isAchievements ? "Unnamed Achievement" : "Unnamed Weapon")}</h3>
                          <span>{isAchievements ? (item.achievementRarity || "Achievement") : isBestiary ? "Monster" : isCrafting ? `${item.craftingStation || "Inventory"}${item.craftingModule ? ` • ${item.craftingModule}` : ""}` : isPremium ? getPremiumItemType(item) : (item.weaponSkins?.length ? `${item.type || "Weapon"} • ${item.weaponSkins.length} skins` : (item.type || "Weapon"))}</span>
                        </div>
                        {renderStatHighlights(item)}
                        {isCrafting && (
                          <div className="crafting-card-summary">
                            <p><strong>Required:</strong> {formatCraftingParts(item.craftingRequiredImages, 3)}</p>
                            <p><strong>Result:</strong> {formatCraftingParts(item.craftingResultImages, 2)}</p>
                          </div>
                        )}
                        <div className="weapon-card-footer">
                          <span><i className="fas fa-chart-simple"></i> {isAchievements ? "Click for achievement details" : isBestiary ? "Click for monster properties" : isCrafting ? "Click for recipe details" : "Click for stats board"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="list-view">
                  {filteredAndSortedData.map((item, idx) => {
                    const priceValue = item.basePriceTokens ?? item.price ?? item.sellingPriceTokens;
                    const damageValue = item.damageDisplay || (item.minDamage !== undefined || item.maxDamage !== undefined ? `${item.minDamage ?? 0}–${item.maxDamage ?? 0}` : "");
                    return (
                      <div key={idx} className="list-row" title={item.name || "Open item information"} onClick={() => openInfoModal(item)}>
                        <ProjectImage
                          item={item}
                          category={currentCategory}
                          className="list-image"
                          placeholderClassName="list-image-placeholder"
                        />
                        <div className="list-main">
                          <div className="list-title-row">
                            <h3>{item.name || "Unnamed Item"}</h3>
                            <span className="list-type">{isAchievements ? (item.achievementRarity || "Achievement") : isBestiary ? "Monster" : isCrafting ? `${item.craftingStation || "Inventory"}${item.craftingModule ? ` • ${item.craftingModule}` : ""}` : isPremium ? `${getPremiumItemType(item)}${item.type ? ` • ${item.type}` : ""}` : (item.type || "No type")}</span>
                          </div>
                          {item.detail && <p className="list-description">{item.detail}</p>}
                          {isCrafting && (
                            <div className="crafting-list-summary">
                              <span><strong>Required:</strong> {formatCraftingParts(item.craftingRequiredImages, 6)}</span>
                              <span><strong>Result:</strong> {formatCraftingParts(item.craftingResultImages, 4)}</span>
                            </div>
                          )}
                          <div className="list-meta">
                            {isAchievements ? <span><strong>Rarity:</strong> {item.achievementRarity || "-"}</span> : isCrafting ? <span><strong>Station:</strong> {item.craftingStation || "Inventory"}</span> : <span><strong>Level:</strong> {item.level ? item.level : "N/R"}</span>}
                            {isCrafting && item.craftingModule ? <span><strong>Module:</strong> {item.craftingModule}</span> : null}
                            {isCrafting && item.locations?.length ? <span><strong>Map Location:</strong> {item.locations.join(", ")}</span> : null}
                            {isBestiary && item.health !== undefined && <span><strong>Health:</strong> {item.health}</span>}
                            {isBestiary && item.healthPerLevel !== undefined && <span><strong>HP/Lvl:</strong> {item.healthPerLevel}</span>}
                            {isBestiary && item.armorSummary && <span><strong>Armor:</strong> {item.armorSummary}</span>}
                            {isBestiary && item.regeneration && <span><strong>Regen:</strong> {item.regeneration}</span>}
                            {priceValue !== undefined && !isBestiary && <span><strong>Price:</strong> {priceValue}</span>}
                            {item.weight && <span><strong>Weight:</strong> {item.weight}</span>}
                            {item.dropChance !== undefined && <span><strong>Drop:</strong> {item.dropChance}%</span>}
                            {damageValue && <span><strong>DMG:</strong> {damageValue}</span>}
                            {item.caliber && <span><strong>Caliber:</strong> {item.caliber}</span>}
                            {!isCrafting && item.vendors?.length ? <span><strong>Vendors:</strong> {item.vendors.join(", ")}</span> : null}
                          </div>
                        </div>
                        <div className="list-actions stats-only">
                          {canQuickUploadImage && <button type="button" className="upload" aria-label={`Upload image for ${item.name || "item"}`} title={isCrafting ? "Upload recipe result image" : "Upload image"} onClick={(e) => openQuickImageUpload(item, e)}><i className="fas fa-cloud-upload-alt"></i></button>}
                          <button type="button" aria-label="Open stats board" title="Open stats board" onClick={(e) => { e.stopPropagation(); openInfoModal(item); }}><i className="fas fa-chart-simple"></i></button>
                          <button type="button" className="edit" aria-label={`Edit ${item.name || "item"}`} title="Edit item" onClick={(e) => { e.stopPropagation(); openEditModal(idx); }}><i className="fas fa-pen"></i></button>
                          <button type="button" className="delete" aria-label={`Remove ${item.name || "item"}`} title="Remove item" onClick={(e) => { e.stopPropagation(); void deleteItem(idx); }}><i className="fas fa-trash"></i></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>
              <i className={`fas ${editingIndex !== null ? "fa-pen" : "fa-plus"}`}></i>{" "}
              {editingIndex !== null ? "Edit Item" : "Add Item"}
            </h2>
            {renderModalFields()}
            <div className="modal-buttons">
              <button type="button" onClick={() => void saveItem()}><i className="fas fa-save"></i> Save</button>
              <button type="button" onClick={() => setIsModalOpen(false)}><i className="fas fa-times"></i> Cancel</button>
            </div>
          </div>
        </div>
      )}

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
              <button type="button" onClick={() => openEditModalForItem(selectedInfoItem)}><i className="fas fa-pen"></i> Edit</button>
              <button type="button" className="delete" onClick={() => { if (window.confirm(`Remove ${selectedInfoItem.name || "this item"}?`)) void deleteItemByReference(selectedInfoItem); }}><i className="fas fa-trash"></i> Remove</button>
              <button type="button" onClick={() => setSelectedInfoItem(null)}><i className="fas fa-times"></i> Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}