// src/Pages/Designs.jsx
// Design catalogue. Every card is a garment style made from fabric that is actually in the inventory:
// colour, pattern, price per metre and stock all come from the inventory API.
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";
import measurementsData from "../data/Booking.json";
import GarmentIllustration from "../Components/GarmentIllustration";
import { DESIGNS, FIXED_CHARGES, LOW_STOCK_METRES, TYPICAL_METRES, colorHex } from "../data/designs";
import { Alert, Badge, Button, SearchInput, formatINR, inputClass } from "../Components/Admin/ui";

const stockInfo = (qty) => {
  if (!(qty > 0)) return { label: "Out of stock", color: "red" };
  if (qty < LOW_STOCK_METRES) return { label: `Low stock · ${Math.floor(qty)} m`, color: "amber" };
  return { label: `In stock · ${Math.floor(qty)} m`, color: "green" };
};

function DesignCard({ design, variants, onBook }) {
  const firstAvailable = variants.find((v) => v.total_quantity > 0) || variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable.id);
  const item = variants.find((v) => v.id === selectedId) || firstAvailable;
  const available = item.total_quantity > 0;
  const stock = stockInfo(item.total_quantity);
  const pattern = item.pattern || "Solid";

  const base = measurementsData[design.gender]?.[design.dressType]?.baseCost || 0;
  const estimate = base + (item.price || 0) * TYPICAL_METRES[design.dressType] + FIXED_CHARGES;

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:border-gray-300 transition-colors">
      <div className="relative bg-slate-100 h-52 flex items-center justify-center">
        <GarmentIllustration
          dressType={design.dressType}
          color={colorHex(item)}
          pattern={pattern}
          collarType={design.collarType}
          sleeveType={design.sleeveType}
          fabricImage={item.image_url}
          className="h-44"
        />
        {item.image_url && (
          <img
            src={item.image_url}
            alt={`${item.material_name} ${item.color} fabric`}
            className="absolute bottom-3 right-3 w-16 h-16 rounded-md object-cover border-2 border-white shadow-sm"
          />
        )}
        <span className="absolute top-3 left-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded px-2 py-0.5">
          {design.gender} · {design.dressType}
        </span>
        <span className="absolute top-3 right-3">
          <Badge color={stock.color}>{stock.label}</Badge>
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-900">{design.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{design.tagline}</p>

        <dl className="mt-3 text-sm space-y-1">
          <div className="flex justify-between">
            <dt className="text-gray-500">Fabric</dt>
            <dd className="text-gray-900">{item.material_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Colour · Pattern</dt>
            <dd className="text-gray-900">{item.color} · {pattern}</dd>
          </div>
          {design.collarType && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Collar · Sleeve</dt>
              <dd className="text-gray-900">{design.collarType} · {design.sleeveType}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Fabric price</dt>
            <dd className="text-gray-900">{formatINR(item.price)} / m</dd>
          </div>
        </dl>

        {variants.length > 1 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Fabric options</span>
            {variants.map((v) => {
              const selected = v.id === item.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  title={`${v.material_name} · ${v.color} · ${v.pattern || "Solid"} · ${v.total_quantity > 0 ? `${Math.floor(v.total_quantity)} m` : "out of stock"}`}
                  aria-label={`${v.material_name} ${v.color}`}
                  className={`w-8 h-8 rounded-md border-2 transition ${selected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"} ${v.total_quantity > 0 ? "" : "opacity-40"}`}
                  style={{ backgroundColor: colorHex(v), backgroundImage: v.image_url ? `url(${v.image_url})` : undefined, backgroundSize: "cover" }}
                />
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className="text-xs text-gray-500">Estimated from</p>
            <p className="text-lg font-semibold text-gray-900 leading-tight">{formatINR(estimate)}</p>
          </div>
          <Button variant="primary" disabled={!available} onClick={() => onBook(design, item)}>
            {available ? "Book this design" : "Out of stock"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function Designs() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [gender, setGender] = useState("All");
  const [dressType, setDressType] = useState("");
  const [fabric, setFabric] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/inventory");
        const data = res.data?.items || res.data || [];
        setInventory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(errorMessage(err, "Could not load designs. Please try again."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Each design with the inventory fabrics it can be made from. Designs with no fabric on hand are hidden.
  const catalogue = useMemo(() => {
    // Identical fabric rows (same material, colour, pattern, price) are shown once with their stock added together.
    const merged = new Map();
    for (const row of inventory) {
      const key = [row.material_name, row.color, row.pattern || "Solid", row.price].join("|").toLowerCase();
      const seen = merged.get(key);
      if (seen) seen.total_quantity = (seen.total_quantity || 0) + (row.total_quantity || 0);
      else merged.set(key, { ...row });
    }
    const fabricStock = [...merged.values()];

    return DESIGNS.map((design) => {
      const names = design.materials.map((m) => m.toLowerCase());
      const variants = fabricStock
        .filter((i) => names.includes((i.material_name || "").toLowerCase()))
        .sort(
          (a, b) =>
            (b.total_quantity > 0) - (a.total_quantity > 0) || // in stock first
            names.indexOf(a.material_name.toLowerCase()) - names.indexOf(b.material_name.toLowerCase()) || // preferred fabric first
            (b.total_quantity || 0) - (a.total_quantity || 0) // then the best-stocked colour
        );
      return { design, variants };
    }).filter((d) => d.variants.length > 0);
  }, [inventory]);

  const dressTypes = useMemo(() => [...new Set(catalogue.map((d) => d.design.dressType))], [catalogue]);
  const fabrics = useMemo(() => [...new Set(catalogue.flatMap((d) => d.variants.map((v) => v.material_name)))].sort(), [catalogue]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = catalogue.filter(({ design, variants }) => {
      if (gender !== "All" && design.gender !== gender) return false;
      if (dressType && design.dressType !== dressType) return false;
      if (fabric && !variants.some((v) => v.material_name === fabric)) return false;
      if (q && ![design.name, design.tagline, design.occasion, design.dressType].some((t) => t.toLowerCase().includes(q))) return false;
      return true;
    });
    const minPrice = (d) => Math.min(...d.variants.map((v) => v.price || 0));
    if (sort === "priceAsc") list.sort((a, b) => minPrice(a) - minPrice(b));
    if (sort === "priceDesc") list.sort((a, b) => minPrice(b) - minPrice(a));
    return list;
  }, [catalogue, gender, dressType, fabric, search, sort]);

  // Hand the chosen design to Book Now (it reads and clears this on load), then go there.
  const book = (design, item) => {
    try {
      sessionStorage.setItem(
        "pendingDesign",
        JSON.stringify({
          gender: design.gender,
          dressType: design.dressType,
          material: item.material_name,
          color: item.color,
          pattern: item.pattern || "Solid",
          collarType: design.collarType || "",
          sleeveType: design.sleeveType || "",
        })
      );
    } catch {
      /* storage unavailable: Book Now simply opens at step 1 */
    }
    if (localStorage.getItem("token")) navigate("/booknow");
    else navigate("/login", { state: { from: { pathname: "/booknow" } } });
  };

  const resetFilters = () => { setGender("All"); setDressType(""); setFabric(""); setSearch(""); setSort("featured"); };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="pb-4 mb-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Design collection</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ready-to-order styles made from the fabrics we have in stock. Pick a design and we'll set it up in Book Now.
          </p>
        </header>

        <Alert type="error" onClose={() => setError("")}>{error}</Alert>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden bg-white">
            {["All", "Men", "Women"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`px-3.5 py-2 text-sm font-medium transition-colors ${gender === g ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <select className={`${inputClass} !w-auto`} value={dressType} onChange={(e) => setDressType(e.target.value)}>
            <option value="">All garments</option>
            {dressTypes.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className={`${inputClass} !w-auto`} value={fabric} onChange={(e) => setFabric(e.target.value)}>
            <option value="">All fabrics</option>
            {fabrics.map((f) => <option key={f}>{f}</option>)}
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search designs" />
          <select className={`${inputClass} !w-auto sm:ml-auto`} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="priceAsc">Fabric price: low to high</option>
            <option value="priceDesc">Fabric price: high to low</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-96 bg-white border border-gray-200 rounded-lg animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg py-14 text-center">
            <p className="text-gray-900 font-medium">No designs match your filters</p>
            <p className="text-sm text-gray-500 mt-1">
              {catalogue.length === 0 ? "New designs will appear as soon as fabric is added to stock." : "Try a different garment or fabric."}
            </p>
            {catalogue.length > 0 && <Button className="mt-4" onClick={resetFilters}>Clear filters</Button>}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{visible.length} designs</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(({ design, variants }) => (
                <DesignCard key={design.id} design={design} variants={variants} onBook={book} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-5">
              Estimated prices use a typical fabric length plus labour, delivery and handling. Your final price depends on your measurements.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
