export interface PublicThreadColor {
  id: string | null;
  name: string;
  manufacturer: string;
  manufacturerCode: string;
  hex: string;
  weight: "W30" | "W40" | "W60" | "OTHER";
}

export interface PublicPlacement {
  id: string | null;
  name: string;
  maxWidthInches: number;
  maxHeightInches: number;
  placementNotes: string | null;
}

export interface PublicProduct {
  id: string | null;
  name: string;
  category: string;
  material: string | null;
  availableColors: string[];
  placements: PublicPlacement[];
}

export interface ConfiguratorCatalog {
  threads: PublicThreadColor[];
  /** Colors currently threaded on an active machine needle — what custom
   * lettering actually picks from, since it runs without a separate color
   * re-threading/matching pass. Empty when no machine reports loaded colors. */
  loadedThreads: PublicThreadColor[];
  products: PublicProduct[];
  source: "database" | "fallback";
}

export const DEFAULT_THREAD_COLORS: PublicThreadColor[] = [
  { id: null, name: "Bright White", manufacturer: "Madeira", manufacturerCode: "1001", hex: "#F5F3EA", weight: "W40" },
  { id: null, name: "Black", manufacturer: "Madeira", manufacturerCode: "1000", hex: "#1A1A1A", weight: "W40" },
  { id: null, name: "Navy", manufacturer: "Madeira", manufacturerCode: "1243", hex: "#17375E", weight: "W40" },
  { id: null, name: "Royal Blue", manufacturer: "Madeira", manufacturerCode: "1912", hex: "#1F4E9C", weight: "W40" },
  { id: null, name: "Red", manufacturer: "Madeira", manufacturerCode: "1147", hex: "#C41230", weight: "W40" },
  { id: null, name: "Yellow", manufacturer: "Madeira", manufacturerCode: "1122", hex: "#FFD100", weight: "W40" },
  { id: null, name: "Kelly Green", manufacturer: "Madeira", manufacturerCode: "1246", hex: "#00843D", weight: "W40" },
  { id: null, name: "Orange", manufacturer: "Madeira", manufacturerCode: "1168", hex: "#F4661C", weight: "W40" },
  { id: null, name: "Purple", manufacturer: "Madeira", manufacturerCode: "1327", hex: "#5B2C83", weight: "W40" },
  { id: null, name: "Gray", manufacturer: "Madeira", manufacturerCode: "1288", hex: "#8B8D8F", weight: "W40" },
  { id: null, name: "Tan", manufacturer: "Madeira", manufacturerCode: "1170", hex: "#C9A876", weight: "W40" },
  { id: null, name: "Brown", manufacturer: "Madeira", manufacturerCode: "1082", hex: "#5C4033", weight: "W40" },
  { id: null, name: "Pink", manufacturer: "Madeira", manufacturerCode: "1503", hex: "#F2A0C9", weight: "W40" },
  { id: null, name: "Light Blue", manufacturer: "Madeira", manufacturerCode: "1841", hex: "#6EC6E8", weight: "W40" },
  { id: null, name: "Gold", manufacturer: "Madeira", manufacturerCode: "1012", hex: "#C9A227", weight: "W40" },
];

export const DEFAULT_PRODUCTS: PublicProduct[] = [
  {
    id: "product_polo",
    name: "Performance Polo",
    category: "Polo Shirt",
    material: "Performance knit",
    availableColors: ["Navy", "Black", "White", "Royal Blue"],
    placements: [
      { id: "loc_polo_left_chest", name: "Left Chest", maxWidthInches: 4, maxHeightInches: 4, placementNotes: "Classic chest placement" },
      { id: "loc_polo_right_chest", name: "Right Chest", maxWidthInches: 4, maxHeightInches: 4, placementNotes: "Mirrored chest placement" },
    ],
  },
  {
    id: "product_hoodie",
    name: "Heavyweight Hoodie",
    category: "Hoodie",
    material: "Cotton/poly fleece",
    availableColors: ["Black", "Navy", "Charcoal"],
    placements: [
      { id: "loc_hoodie_left_chest", name: "Left Chest", maxWidthInches: 4.5, maxHeightInches: 4.5, placementNotes: "Quiet chest mark" },
      { id: "loc_hoodie_full_back", name: "Full Back", maxWidthInches: 11, maxHeightInches: 13, placementNotes: "Large-format back embroidery" },
    ],
  },
  {
    id: "product_cap",
    name: "Structured Cap",
    category: "Trucker Hat",
    material: "Cotton twill front",
    availableColors: ["Navy", "Black", "Natural"],
    placements: [
      { id: "loc_cap_front", name: "Front Panel", maxWidthInches: 4.5, maxHeightInches: 2.25, placementNotes: "Curved to the crown" },
    ],
  },
  {
    id: "product_tshirt",
    name: "Cotton Tee",
    category: "T-Shirt",
    material: "Cotton jersey",
    availableColors: ["White", "Black", "Navy", "Sport Grey"],
    placements: [
      { id: "loc_tshirt_left_chest", name: "Left Chest", maxWidthInches: 4, maxHeightInches: 4, placementNotes: "Classic chest placement" },
    ],
  },
];

export const FALLBACK_CATALOG: ConfiguratorCatalog = {
  threads: DEFAULT_THREAD_COLORS,
  loadedThreads: DEFAULT_THREAD_COLORS.slice(0, 4),
  products: DEFAULT_PRODUCTS,
  source: "fallback",
};

/**
 * Every item is currently customer-supplied — the studio doesn't sell the
 * blank, so there's no per-unit product charge for any category. Kept as a
 * function (rather than inlining 0 at call sites) so real catalog pricing is
 * a one-line change to restore once the studio stocks blanks again.
 */
export function categoryBasePrice(_category: string): number {
  return 0;
}
