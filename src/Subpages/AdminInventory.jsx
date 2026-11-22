// src/Subpages/AdminInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import api, { errorMessage } from "../api";
import { Alert, Badge, Button, DataTable, Field, Modal, PageHeader, SearchInput, Toolbar, formatINR, inputClass } from "../Components/Admin/ui";

const LOW_STOCK_METRES = 20;
const emptyForm = { material_name: "", material_type: "", color: "", color_code: "", pattern: "", total_quantity: "", price: "", image_url: "" };

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit", id? }
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory");
      const data = res.data?.items || res.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, "Failed to load inventory."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? items.filter((i) => [i.material_name, i.material_type, i.color, i.pattern].some((v) => v?.toLowerCase().includes(q)))
      : items;
  }, [items, search]);

  // Shrink an uploaded photo to a small JPEG so it can be stored with the inventory row.
  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      setForm((f) => ({ ...f, image_url: canvas.toDataURL("image/jpeg", 0.8) }));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setError("That file could not be read as an image.");
    img.src = URL.createObjectURL(file);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => setModal(null);
  const openAdd = () => { setForm(emptyForm); setModal({ mode: "add" }); };
  const openEdit = (i) => {
    setForm({
      material_name: i.material_name || "", material_type: i.material_type || "", color: i.color || "",
      color_code: i.color_code || "", pattern: i.pattern || "", total_quantity: i.total_quantity ?? "", price: i.price ?? "", image_url: i.image_url || "",
    });
    setModal({ mode: "edit", id: i.id });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.material_name.trim() || !form.color.trim()) {
      setError("Material name and colour are required.");
      close();
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, total_quantity: Number(form.total_quantity) || 0, price: Number(form.price) || 0 };
      if (modal.mode === "add") await api.post("/inventory", payload);
      else await api.put(`/inventory/${modal.id}`, payload);
      close();
      load();
    } catch (err) {
      setError(errorMessage(err, "Failed to save item."));
      close();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (i) => {
    if (!window.confirm(`Delete ${i.material_name} (${i.color})?`)) return;
    try {
      await api.delete(`/inventory/${i.id}`);
      setItems((prev) => prev.filter((x) => x.id !== i.id));
    } catch (err) {
      setError(errorMessage(err, "Failed to delete item."));
    }
  };

  const columns = [
    {
      key: "image_url", label: "Photo",
      render: (i) => i.image_url
        ? <img src={i.image_url} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
        : <span className="w-10 h-10 rounded bg-gray-100 border border-gray-200 inline-block" />,
    },
    { key: "material_name", label: "Material", sortable: true, render: (i) => <span className="font-medium text-gray-900">{i.material_name}</span> },
    { key: "material_type", label: "Type", sortable: true },
    {
      key: "color", label: "Colour", sortable: true,
      render: (i) => (
        <span className="inline-flex items-center gap-2">
          {i.color_code && <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: i.color_code }} />}
          {i.color}
        </span>
      ),
    },
    { key: "pattern", label: "Pattern", sortable: true },
    {
      key: "total_quantity", label: "In stock", sortable: true, align: "right",
      render: (i) => (
        <span className="inline-flex items-center gap-2 justify-end">
          {Number(i.total_quantity).toFixed(1)} m
          {i.total_quantity < LOW_STOCK_METRES && <Badge color="amber">Low</Badge>}
        </span>
      ),
    },
    { key: "price", label: "Price / m", sortable: true, align: "right", render: (i) => formatINR(i.price) },
    {
      key: "actions", label: "Actions", align: "right",
      render: (i) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" onClick={() => openEdit(i)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => remove(i)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${items.length} materials, price shown per metre`}
        actions={<Button variant="primary" onClick={openAdd}><FaPlus className="w-3 h-3" /> Add material</Button>}
      />
      <Alert type="error" onClose={() => setError("")}>{error}</Alert>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search material, colour, pattern" />
      </Toolbar>
      <DataTable columns={columns} rows={rows} loading={loading} emptyText="No materials in stock" defaultSort={{ key: "material_name", dir: "asc" }} />

      <Modal
        open={!!modal}
        onClose={close}
        title={modal?.mode === "add" ? "Add material" : "Edit material"}
        footer={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Material" required hint="e.g. Cotton, Silk, Linen"><input className={inputClass} value={form.material_name} onChange={set("material_name")} /></Field>
            <Field label="Type"><input className={inputClass} value={form.material_type} onChange={set("material_type")} placeholder="fabric" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Colour" required><input className={inputClass} value={form.color} onChange={set("color")} /></Field>
            <Field label="Colour code"><input className={inputClass} value={form.color_code} onChange={set("color_code")} placeholder="#3B82F6" /></Field>
          </div>
          <Field label="Pattern"><input className={inputClass} value={form.pattern} onChange={set("pattern")} placeholder="Plain, Striped, Checked" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock (metres)"><input type="number" min="0" step="0.1" className={inputClass} value={form.total_quantity} onChange={set("total_quantity")} /></Field>
            <Field label="Price per metre (₹)"><input type="number" min="0" className={inputClass} value={form.price} onChange={set("price")} /></Field>
          </div>
          <Field label="Fabric photo" hint="Upload a close-up photo of the fabric, or paste an image link or /fabrics/name.jpg">
            <div className="flex items-center gap-3">
              {form.image_url ? <img src={form.image_url} alt="" className="w-14 h-14 rounded object-cover border border-gray-200" /> : <span className="w-14 h-14 rounded bg-gray-100 border border-gray-200" />}
              <div className="flex-1 space-y-1.5">
                <input type="file" accept="image/*" onChange={onPhoto} className="text-sm w-full" />
                <input className={inputClass} value={form.image_url.startsWith("data:") ? "" : form.image_url} onChange={set("image_url")} placeholder={form.image_url.startsWith("data:") ? "Uploaded photo" : "Image link"} />
              </div>
            </div>
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>
    </div>
  );
}
