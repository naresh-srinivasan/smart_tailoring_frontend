// Flat garment drawings coloured with the real fabric colour and pattern from the inventory.
import React, { useId } from "react";

const isLight = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

const COLLARS = {
  Regular: { left: "M78 30 L100 58 L86 64 L70 40 Z", right: "M122 30 L100 58 L114 64 L130 40 Z" },
  Spread: { left: "M74 32 L100 56 L78 68 L64 42 Z", right: "M126 32 L100 56 L122 68 L136 42 Z" },
  "Button-Down": { left: "M78 30 L100 58 L86 64 L70 40 Z", right: "M122 30 L100 58 L114 64 L130 40 Z" },
  LongPoint: { left: "M80 30 L100 70 L84 66 L72 40 Z", right: "M120 30 L100 70 L116 66 L128 40 Z" },
  Mandarin: { left: "M80 30 Q100 42 120 30 L120 42 Q100 54 80 42 Z", right: "" },
};

export default function GarmentIllustration({ dressType, color = "#94A3B8", pattern = "Plain", collarType, sleeveType, className = "" }) {
  const uid = useId().replace(/:/g, "");
  const light = isLight(color);
  const ink = light ? "rgba(15,23,42,0.22)" : "rgba(255,255,255,0.35)";
  const outline = light ? "#94A3B8" : "rgba(15,23,42,0.35)";
  const p = (pattern || "Plain").toLowerCase();
  const patternId = `pat-${uid}`;
  const hasPattern = ["striped", "stripe", "checked", "check", "floral"].includes(p);

  const defs = hasPattern && (
    <defs>
      {p.startsWith("stripe") && (
        <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="4" height="10" fill={ink} />
        </pattern>
      )}
      {p.startsWith("check") && (
        <pattern id={patternId} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="3" fill={ink} />
          <rect width="3" height="14" fill={ink} />
        </pattern>
      )}
      {p === "floral" && (
        <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="2.6" fill={ink} />
          <circle cx="16" cy="15" r="2" fill={ink} />
        </pattern>
      )}
    </defs>
  );

  // Body shape drawn once, then fabric colour and pattern are painted over the same path.
  const Body = ({ d }) => (
    <>
      <path d={d} fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
      {hasPattern && <path d={d} fill={`url(#${patternId})`} />}
    </>
  );

  let art = null;

  if (dressType === "Shirt") {
    const full = sleeveType !== "Half Sleeve";
    const body = full
      ? "M78 34 L100 46 L122 34 L130 40 L178 120 L160 128 L132 84 L132 214 L68 214 L68 84 L40 128 L22 120 L70 40 Z"
      : "M78 34 L100 46 L122 34 L130 40 L160 78 L142 92 L132 76 L132 214 L68 214 L68 76 L58 92 L40 78 L70 40 Z";
    const collar = COLLARS[collarType] || COLLARS.Regular;
    art = (
      <>
        <Body d={body} />
        <path d={collar.left} fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
        {collar.right && <path d={collar.right} fill={color} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />}
        <line x1="100" y1="58" x2="100" y2="214" stroke={outline} strokeWidth="1.2" />
        {[78, 106, 134, 162, 190].map((y) => (
          <circle key={y} cx="100" cy={y} r="2" fill={outline} />
        ))}
        {collarType === "Button-Down" && (
          <>
            <circle cx="76" cy="42" r="1.6" fill={outline} />
            <circle cx="124" cy="42" r="1.6" fill={outline} />
          </>
        )}
        <rect x="108" y="96" width="16" height="18" rx="2" fill="none" stroke={outline} strokeWidth="1.2" />
      </>
    );
  } else if (dressType === "Pant") {
    art = (
      <>
        <Body d="M68 22 H132 L138 70 L128 218 H106 L100 100 L94 218 H72 L62 70 Z" />
        <rect x="68" y="22" width="64" height="11" fill="none" stroke={outline} strokeWidth="1.2" />
        <line x1="100" y1="33" x2="100" y2="100" stroke={outline} strokeWidth="1.2" />
        <circle cx="100" cy="27" r="2" fill={outline} />
        <path d="M76 33 L74 52 M124 33 L126 52" stroke={outline} strokeWidth="1.2" fill="none" />
      </>
    );
  } else if (dressType === "Kurta") {
    art = (
      <>
        <Body d="M78 26 Q100 46 122 26 L138 34 L170 120 L152 128 L134 86 L140 208 H60 L66 86 L48 128 L30 120 L62 34 Z" />
        <path d="M86 28 Q100 46 114 28 L100 84 Z" fill="none" stroke={outline} strokeWidth="1.2" />
        <line x1="100" y1="84" x2="100" y2="150" stroke={outline} strokeWidth="1.2" />
        {[96, 112, 128].map((y) => (
          <circle key={y} cx="100" cy={y} r="1.8" fill={outline} />
        ))}
        <path d="M100 150 L100 208" stroke={outline} strokeWidth="1" strokeDasharray="2 3" />
        <path d="M60 170 L68 170 M132 170 L140 170" stroke={outline} strokeWidth="1.2" />
      </>
    );
  } else if (dressType === "Lehenga") {
    art = (
      <>
        <Body d="M70 84 H130 L182 222 H18 Z" />
        <Body d="M76 30 Q100 50 124 30 L134 42 L130 84 H70 L66 42 Z" />
        <path d="M70 84 H130" stroke={outline} strokeWidth="2" />
        <path d="M34 190 Q100 204 166 190" stroke={outline} strokeWidth="1.2" fill="none" />
        <path d="M44 214 Q100 226 156 214" stroke={outline} strokeWidth="1" fill="none" strokeDasharray="3 3" />
      </>
    );
  }

  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={`${dressType} illustration`}>
      {defs}
      <ellipse cx="100" cy="230" rx="62" ry="5" fill="rgba(15,23,42,0.08)" />
      {art}
    </svg>
  );
}
