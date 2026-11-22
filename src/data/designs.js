// Design catalogue. A design is a garment STYLE; the fabric variants (colour, pattern, price, stock)
// always come live from the inventory, matched by material name, so the page never shows fabric we don't hold.
// gender / dressType must match keys in data/Booking.json. collarType / sleeveType apply to shirts only.

export const DESIGNS = [
  // ---------- Men: shirts ----------
  {
    id: "classic-oxford",
    name: "Classic Oxford",
    tagline: "Everyday formal shirt with a regular collar",
    gender: "Men",
    dressType: "Shirt",
    collarType: "Regular",
    sleeveType: "Full Sleeve",
    materials: ["Cotton", "Polyester"],
    occasion: "Office",
  },
  {
    id: "business-spread",
    name: "Business Spread",
    tagline: "Sharp spread collar for boardroom days",
    gender: "Men",
    dressType: "Shirt",
    collarType: "Spread",
    sleeveType: "Full Sleeve",
    materials: ["Cotton", "Linen"],
    occasion: "Formal",
  },
  {
    id: "smart-casual",
    name: "Smart Casual",
    tagline: "Button-down collar, short sleeves",
    gender: "Men",
    dressType: "Shirt",
    collarType: "Button-Down",
    sleeveType: "Half Sleeve",
    materials: ["Cotton", "Linen"],
    occasion: "Casual",
  },
  {
    id: "mandarin-linen",
    name: "Mandarin Linen",
    tagline: "Band collar in breathable fabric",
    gender: "Men",
    dressType: "Shirt",
    collarType: "Mandarin",
    sleeveType: "Full Sleeve",
    materials: ["Linen", "Cotton"],
    occasion: "Festive",
  },
  // ---------- Men: pants ----------
  {
    id: "tailored-trouser",
    name: "Tailored Trouser",
    tagline: "Straight fit with a clean waistband",
    gender: "Men",
    dressType: "Pant",
    materials: ["Cotton", "Polyester"],
    occasion: "Office",
  },
  {
    id: "relaxed-linen-pant",
    name: "Relaxed Linen Pant",
    tagline: "Light, easy-fit pant for warm days",
    gender: "Men",
    dressType: "Pant",
    materials: ["Linen", "Cotton"],
    occasion: "Casual",
  },
  // ---------- Women: kurtas ----------
  {
    id: "everyday-cotton-kurta",
    name: "Everyday Cotton Kurta",
    tagline: "Soft straight kurta for daily wear",
    gender: "Women",
    dressType: "Kurta",
    materials: ["Cotton", "Linen"],
    occasion: "Daily",
  },
  {
    id: "silk-festive-kurta",
    name: "Silk Festive Kurta",
    tagline: "Rich drape with side slits",
    gender: "Women",
    dressType: "Kurta",
    materials: ["Silk", "Velvet"],
    occasion: "Festive",
  },
  {
    id: "chiffon-flare-kurta",
    name: "Chiffon Flare Kurta",
    tagline: "Light, flowing and elegant",
    gender: "Women",
    dressType: "Kurta",
    materials: ["Chiffon"],
    occasion: "Party",
  },
  // ---------- Women: lehengas ----------
  {
    id: "velvet-bridal-lehenga",
    name: "Velvet Bridal Lehenga",
    tagline: "Statement lehenga with a full flare",
    gender: "Women",
    dressType: "Lehenga",
    materials: ["Velvet", "Silk"],
    occasion: "Wedding",
  },
  {
    id: "silk-festive-lehenga",
    name: "Silk Festive Lehenga",
    tagline: "Classic silk lehenga for celebrations",
    gender: "Women",
    dressType: "Lehenga",
    materials: ["Silk", "Chiffon"],
    occasion: "Festive",
  },
];

// Typical fabric length per garment, used only for the "from" price on cards.
// The real figure in Book Now is calculated from the customer's measurements.
export const TYPICAL_METRES = { Shirt: 2.5, Pant: 1.9, Kurta: 2.5, Lehenga: 3.5 };
export const FIXED_CHARGES = 100 + 50 + 30; // labour + delivery + handling (same as Book Now)
export const LOW_STOCK_METRES = 20;

const COLOR_NAMES = {
  red: "#EF4444", blue: "#3B82F6", green: "#10B981", yellow: "#F59E0B", black: "#1F2937", white: "#FFFFFF",
  gray: "#6B7280", grey: "#6B7280", purple: "#8B5CF6", orange: "#F97316", pink: "#EC4899", brown: "#92400E",
  navy: "#1E40AF", maroon: "#991B1B", beige: "#D8C3A5",
};

// Inventory rows carry an optional hex (color_code); fall back to a name lookup.
export const colorHex = (item) => {
  if (item?.color_code && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item.color_code)) return item.color_code;
  return COLOR_NAMES[(item?.color || "").toLowerCase()] || "#94A3B8";
};
